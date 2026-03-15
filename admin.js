// admin.js
import { db, storage } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ---------- Helpers ----------
function $(id) {
  return document.getElementById(id);
}

function setBtnLoading(btn, isLoading, text = "Saving...") {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.dataset.oldText ||= btn.textContent;
  btn.textContent = isLoading ? text : btn.dataset.oldText;
}

function safeFileName(name = "file") {
  // Remove weird chars to avoid storage issues
  return name.replace(/[^\w.\-]+/g, "_");
}

// ---------- TESTIMONY SAVE ----------
const testimonyForm = $("testimonyForm");

if (testimonyForm) {
  testimonyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = testimonyForm.querySelector("button");
    try {
      setBtnLoading(btn, true, "Saving testimony...");

      const name = $("name")?.value?.trim();
      const message = $("message")?.value?.trim();

      if (!name || !message) {
        alert("Please fill in your name and testimony.");
        return;
      }

      await addDoc(collection(db, "testimonies"), {
        name,
        message,
        createdAt: serverTimestamp()
      });

      alert("Testimony saved!");
      testimonyForm.reset();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to save testimony. Please try again.");
    } finally {
      setBtnLoading(btn, false);
    }
  });
}

// ---------- EVENT SAVE ----------
const eventForm = $("eventForm");

if (eventForm) {
  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = eventForm.querySelector("button");
    try {
      setBtnLoading(btn, true, "Saving event...");

      const title = $("title")?.value?.trim();
      const date = $("date")?.value;
      const file = $("image")?.files?.[0];

      if (!title || !date || !file) {
        alert("Please fill event title, date, and choose an image.");
        return;
      }

      // Give each upload a unique path to avoid overwriting
      const uniqueId = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
      const cleanName = safeFileName(file.name);
      const imagePath = `events/${uniqueId}-${cleanName}`;

      // Upload image
      const imageRef = ref(storage, imagePath);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);

      // Save event
      await addDoc(collection(db, "events"), {
        title,
        date,          // keep as YYYY-MM-DD (string) for now
        image: imageUrl,
        imagePath,     // store path for future delete functionality
        createdAt: serverTimestamp()
      });

      alert("Event saved!");
      eventForm.reset();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to save event. Please try again.");
    } finally {
      setBtnLoading(btn, false);
    }
  });
}