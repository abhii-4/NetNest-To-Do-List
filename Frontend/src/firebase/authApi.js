// Authentication helpers wrapping Firebase Auth (Email/Password + Google Auth).
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

// Ensure a corresponding /users/{uid} document exists for the authenticated user.
export const upsertUserDoc = async (user, extra = {}) => {
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email || null,
      phoneNumber: user.phoneNumber || null,
      createdAt: serverTimestamp(),
      ...extra,
    });
  }
};

export const signUpWithEmail = async (email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await upsertUserDoc(cred.user);
  return cred.user;
};

export const signInWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await upsertUserDoc(cred.user);
  return cred.user;
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  await upsertUserDoc(cred.user);
  return cred.user;
};

export const logout = () => signOut(auth);

export const subscribeAuth = (cb) => onAuthStateChanged(auth, cb);
