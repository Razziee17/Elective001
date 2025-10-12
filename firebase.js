    import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

    // Firebase configuration
    const firebaseConfig = {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    };

    // Initialize Firebase
const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);

    // Initialize Firestore
    const db = getFirestore(app);  // Initialize Firestore instance

    // Reference to 'items' collection in Firestore
    const itemsCol = collection(db, "items");

    // Create a new item
    export async function createItem(text) {
    if (!text?.trim()) return;
    try {
        await addDoc(itemsCol, {
        text: text.trim(),
        done: false,
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
        });
    } catch (error) {
        console.error("Error adding item: ", error);
    }
    }

    // Subscribe to items (listen to changes)
    export function subscribeItems(cb) {
    const q = query(itemsCol, orderBy("createdAtMs", "desc"));
    return onSnapshot(
        q,
        (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        cb(rows);
        },
        (err) => console.error("subscribeItems error:", err)
    );
    }

    // Update an item
    export async function updateItem(id, data) {
    try {
        await updateDoc(doc(db, "items", id), data);
    } catch (error) {
        console.error("Error updating item: ", error);
    }
    }

    // Delete an item
    export async function deleteItem(id) {
    try {
        await deleteDoc(doc(db, "items", id));
    } catch (error) {
        console.error("Error deleting item: ", error);
    }
    }   