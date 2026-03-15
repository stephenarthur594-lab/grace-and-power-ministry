// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"; // ✅ add

// ================= YOUR FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyABsgKYIc6LZ01z8yHkyBEMqJfyyeQBqG8",
  authDomain: "grace-power-ministry-wonder.firebaseapp.com",
  projectId: "grace-power-ministry-wonder",
  storageBucket: "grace-power-ministry-wonder.firebasestorage.app",
  messagingSenderId: "162593849186",
  appId: "1:162593849186:web:415e3c7228d9f93d9df63b"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); // ✅ add