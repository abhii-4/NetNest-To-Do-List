# 🕸️ NetNest — Premium Task Orchestration Platform

NetNest is a sleek, modern, and high-performance task management web application. It features a stunning glassmorphic UI built with React, Tailwind CSS, and GSAP/Framer Motion animations. The backend is powered by FastAPI, implementing dual-sync persistence across a local MongoDB instance and Google Cloud Firestore, secured with Firebase Authentication.


<img width="1920" height="911" alt="auth_page_preview" src="https://github.com/user-attachments/assets/445a5496-c246-4c73-99fe-c0c8b3f396d6" />


## 📂 Project Structure

```
NetNest To-Do-List/
├── Backend/
│   ├── requirements.txt           # Python dependencies
│   └── server.py                  # FastAPI Backend server entry point
└── Frontend/
    ├── craco.config.js            # CRACO webpack configuration
    ├── package.json               # Node packages list & scripts
    ├── tailwind.config.js         # Tailwind CSS configurations
    ├── public/                    # Static public assets
    └── src/
        ├── app.css                # Global custom app layout styles
        ├── app.js                 # React routing and context wrapper
        ├── index.css              # Baseline CSS and Tailwind variables
        ├── index.js               # React entry point
        ├── components/            # Shared reusable UI elements
        │   ├── ui/
        │   │   └── dialog.jsx
        │   ├── AlarmDialog.jsx
        │   ├── CustomCursor.jsx
        │   ├── FirebaseSetupNotice.jsx
        │   ├── MagneticButton.jsx
        │   ├── ShareModal.jsx
        │   ├── Spinner.jsx
        │   └── TaskItem.jsx
        ├── contexts/              # React state context providers
        │   └── AuthContext.jsx    # Auth session context
        ├── firebase/              # Firebase API wrappers and configurations
        │   ├── AlarmChime.js      # Alert chiming utilities
        │   ├── authApi.js         # Login, registration, and OTP methods
        │   ├── config.js          # Initialization of Firebase Client SDK
        │   └── listsApi.js        # CRUD database actions for todo list
        └── pages/                 # Full screen page views
            ├── AuthPage.jsx       # Authentication entry view (Email/Phone)
            └── Dashboard.jsx      # Core Dashboard workspace
```

---

## ⚡ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, CRACO, Tailwind CSS, GSAP, Framer Motion, Axios, Sonner |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Motor (Async MongoDB), Pydantic |
| **Auth & Cloud DB** | Firebase Authentication (Email/Password & Phone OTP), Firestore |
| **Local Database** | MongoDB (Port 27017) |

## 🚀 How to Run the Program

Follow these steps to launch both the Backend and Frontend servers.

### Step 1: Start the Backend Server

1. Open a terminal and navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI development server with Uvicorn:
   ```bash
   python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
   ```
4. Verification: Open `http://localhost:8000/api/` in your browser. You should see `{"message": "Hello World"}`.

### Step 2: Start the Frontend Application

1. Open a new terminal and navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Install the Node.js packages:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm start
   ```
4. Verification: The application will open automatically at `http://localhost:3000`.
