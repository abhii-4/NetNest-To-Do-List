// Firestore helpers for todo_lists and their tasks subcollection.
// Schema:
//   todo_lists/{listId}: { title, ownerId, sharedWith[], permissions{uid|email: 'read'|'write'|'full'}, createdAt }
//   todo_lists/{listId}/tasks/{taskId}: { text, completed, createdAt }
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

const LISTS = "todo_lists";

export const createList = async (title, user) => {
  const ref = await addDoc(collection(db, LISTS), {
    title: title.trim() || "Untitled list",
    ownerId: user.uid,
    ownerEmail: user.email || null,
    sharedWith: [],
    permissions: {},
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Realtime subscription to lists the user owns OR is shared on.
// Firestore can't OR across fields in v10 easily without composite indexes,
// so we run two listeners and merge in the UI layer.
export const subscribeOwnedLists = (uid, cb) => {
  const q = query(collection(db, LISTS), where("ownerId", "==", uid));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const subscribeSharedLists = (identifiers, cb) => {
  // identifiers: array of strings (uid + email) the user is known by
  if (!identifiers || identifiers.length === 0) {
    cb([]);
    return () => {};
  }
  // Firestore array-contains-any supports up to 10 values
  const ids = identifiers.slice(0, 10);
  const q = query(
    collection(db, LISTS),
    where("sharedWith", "array-contains-any", ids)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const updateListTitle = (listId, title) =>
  updateDoc(doc(db, LISTS, listId), { title });

export const deleteList = async (listId) => {
  // Delete all tasks first then the list itself
  const tasksSnap = await getDocs(collection(db, LISTS, listId, "tasks"));
  const batch = writeBatch(tasksSnap.firestore);
  tasksSnap.forEach((t) => batch.delete(t.ref));
  await batch.commit();
  await deleteDoc(doc(db, LISTS, listId));
};

export const shareList = (listId, identifier, permission) =>
  updateDoc(doc(db, LISTS, listId), {
    sharedWith: arrayUnion(identifier),
    [`permissions.${identifier}`]: permission, // 'read' | 'write' | 'full'
  });

export const unshareList = async (listId, identifier) => {
  const ref = doc(db, LISTS, listId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const newPerms = { ...(data.permissions || {}) };
  delete newPerms[identifier];
  await updateDoc(ref, {
    sharedWith: arrayRemove(identifier),
    permissions: newPerms,
  });
};

export const updateSharePermission = (listId, identifier, permission) =>
  updateDoc(doc(db, LISTS, listId), {
    [`permissions.${identifier}`]: permission,
  });

// ===== Tasks =====
export const subscribeTasks = (listId, cb) => {
  const q = query(
    collection(db, LISTS, listId, "tasks"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const addTask = (listId, text) =>
  addDoc(collection(db, LISTS, listId, "tasks"), {
    text: text.trim(),
    completed: false,
    createdAt: serverTimestamp(),
  });

export const toggleTask = (listId, taskId, completed) =>
  updateDoc(doc(db, LISTS, listId, "tasks", taskId), { completed });

export const updateTaskText = (listId, taskId, text) =>
  updateDoc(doc(db, LISTS, listId, "tasks", taskId), { text });

export const deleteTask = (listId, taskId) =>
  deleteDoc(doc(db, LISTS, listId, "tasks", taskId));

export const updateListAlarm = (listId, alarmTime) =>
  updateDoc(doc(db, LISTS, listId), { alarmTime });

export const updateTaskAlarm = (listId, taskId, alarmTime) =>
  updateDoc(doc(db, LISTS, listId, "tasks", taskId), { alarmTime });


// Resolve permission for a given user against a given list document.
// Returns: 'owner' | 'full' | 'write' | 'read' | null
export const resolvePermission = (list, user) => {
  if (!list || !user) return null;
  if (list.ownerId === user.uid) return "owner";
  const perms = list.permissions || {};
  if (perms[user.uid]) return perms[user.uid];
  if (user.email && perms[user.email]) return perms[user.email];
  return null;
};
