// events.js
import { supabase } from "./supabaseClient.js";

console.log("EVENTS JS LOADED ✅");

const grid = document.getElementById("events-grid");

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function card(ev) {
  const title = escapeHtml(ev.title || "Untitled Event");
  const date = escapeHtml(fmtDate(ev.date));
  const time = escapeHtml(ev.time || "");
  const loc = escapeHtml(ev.location || "");
  const desc = escapeHtml(ev.description || "");
  const img = ev.image_url ? escapeHtml(ev.image_url) : "";

  return `
    <div class="card card-soft">
      ${
        img
          ? `<button class="event-image-btn" type="button" data-fullimg="${img}" data-title="${title}">
               <img src="${img}" alt="${title}" class="event-card-img" loading="lazy">
             </button>`
          : ""
      }
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <h3 style="margin:0;">${title}</h3>
        <span class="muted">${date}${time ? " • " + time : ""}</span>
      </div>
      ${loc ? `<div class="muted" style="margin-top:6px;">${loc}</div>` : ""}
      ${desc ? `<p class="muted" style="margin-top:10px; white-space:pre-wrap;">${desc}</p>` : ""}
    </div>
  `;
}

function closeLightbox() {
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  if (!lightbox || !lightboxImg) return;

  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
}

function bindLightbox() {
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");

  if (!lightbox || !lightboxImg || !lightboxClose) return;

  document.querySelectorAll(".event-image-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const src = btn.getAttribute("data-fullimg");
      const title = btn.getAttribute("data-title") || "Full event image";

      lightboxImg.src = src || "";
      lightboxImg.alt = title;
      lightbox.classList.add("active");
      lightbox.setAttribute("aria-hidden", "false");
    });
  });

  lightboxClose.onclick = closeLightbox;

  lightbox.onclick = (e) => {
    if (e.target === lightbox) closeLightbox();
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}

async function loadEvents() {
  if (!grid) {
    console.error("EVENTS GRID NOT FOUND");
    return;
  }

  grid.innerHTML = `<p class="muted">Loading events...</p>`;

  try {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, image_url, created_at, description, time, is_published, date, location")
      .eq("is_published", true)
      .order("date", { ascending: true });

    if (error) throw error;

    console.log("PUBLIC EVENTS:", data);

    if (!data || data.length === 0) {
      grid.innerHTML = `<p class="muted">No events published yet. Check back soon.</p>`;
      return;
    }

    grid.innerHTML = data.map(card).join("");
    bindLightbox();
  } catch (err) {
    console.error("EVENTS LOAD ERROR:", err);
    grid.innerHTML = `<p class="muted">Could not load events. Check Supabase keys / RLS policies.</p>`;
  }
}

loadEvents();
