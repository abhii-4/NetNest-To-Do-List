import os
import logging
from pathlib import Path
import uuid
from datetime import datetime, timezone
from typing import List

import firebase_admin
from firebase_admin import credentials, auth
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize Firebase Admin SDK
firebase_cred_path = os.environ.get('FIREBASE_CREDENTIALS_PATH', 'firebase-service-account.json')
# Ensure absolute path resolution if needed
cred_absolute_path = ROOT_DIR / firebase_cred_path

firebase_initialized = False
db_firestore = None

if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(str(cred_absolute_path))
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logging.info("Firebase Admin SDK initialized successfully.")
    except FileNotFoundError:
        logging.warning(
            f"Firebase credentials file not found at {cred_absolute_path}. "
            "Authentication endpoints will fail, but the server is running."
        )

# Initialize Firestore Client if Firebase is configured
if firebase_initialized:
    from firebase_admin import firestore
    try:
        db_firestore = firestore.client()
        logging.info("Firestore client initialized successfully on the backend.")
    except Exception as e:
        logging.error(f"Failed to initialize Firestore client: {e}")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

@app.get("/")
async def root_message():
    return {"message": "NetNest FastAPI backend is running! Use the /api prefix for endpoints."}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Firebase Authentication Dependency
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not firebase_initialized:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Authentication is not configured on the server. Please configure firebase-service-account.json.",
        )
    token = credentials.credentials
    try:
        # Verify the Firebase ID Token sent from the Frontend
        decoded_token = auth.verify_id_token(token)
        return decoded_token  # Contains user information (uid, email, etc.)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Use it in any endpoint:
@api_router.get("/secure-data")
async def secure_endpoint(user = Depends(get_current_user)):
    return {"message": f"Hello, user {user['uid']}!"}


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    # Write to MongoDB
    try:
        _ = await db.status_checks.insert_one(doc)
    except Exception as e:
        logger.error(f"Failed to write to MongoDB: {e}")
    
    # Write to Firestore if configured
    if db_firestore:
        try:
            db_firestore.collection('status_checks').document(status_obj.id).set(doc)
            logger.info(f"Stored status check {status_obj.id} in Firestore.")
        except Exception as e:
            logger.error(f"Failed to store status check in Firestore: {e}")
            
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Prefer reading from Firestore if configured
    if db_firestore:
        try:
            docs = db_firestore.collection('status_checks').stream()
            status_checks = []
            for doc in docs:
                data = doc.to_dict()
                if isinstance(data.get('timestamp'), str):
                    data['timestamp'] = datetime.fromisoformat(data['timestamp'])
                status_checks.append(data)
            return status_checks
        except Exception as e:
            logger.error(f"Failed to fetch status checks from Firestore: {e}")
            
    # Fallback to MongoDB
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

