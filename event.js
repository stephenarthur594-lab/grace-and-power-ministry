// events.js
import { supabase } from "./supabaseClient.js";

const grid = document.getElementById("events-grid");

console.log("EVENTS JS LOADED ✅");

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
      ${img ? `<img src="${img}" alt="${title}" class="event-card-img" loading="lazy">` : ""}
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <h3 style="margin:0;">${title}</h3>
        <span class="muted">${date}${time ? " • " + time : ""}</span>
      </div>
      ${loc ? `<div class="muted" style="margin-top:6px;">${loc}</div>` : ""}
      ${desc ? `<p class="muted" style="margin-top:10px; white-space:pre-wrap;">${desc}</p>` : ""}
    </div>
  `;
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
      .select("id, title, date, time, location, description, image_url, is_published")
      .eq("is_published", true)
      .order("date", { ascending: true });

    if (error) throw error;

    console.log("PUBLIC EVENTS:", data);

    if (!data || data.length === 0) {
      grid.innerHTML = `<p class="muted">No events published yet. Check back soon.</p>`;
      return;
    }

    grid.innerHTML = data.map(card).join("");
  } catch (err) {
    console.error("EVENTS LOAD ERROR:", err);
    grid.innerHTML = `<p class="muted">Could not load events. Check Supabase keys / RLS policies.</p>`;
  }
}

loadEvents();