// testimonies.js
import { supabase } from "./supabaseClient.js";

console.log("TESTIMONIES JS LOADED ✅");

const grid = document.getElementById("testimony-grid");
const searchInput = document.getElementById("testimonySearch");
const filterBtns = document.querySelectorAll(".filter-btn");
const form = document.getElementById("testimony-form");
const tMsg = document.getElementById("t_msg");

let cards = [];
let activeFilter = "all";

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function titleCase(str = "") {
  if (!str) return "Testimony";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderCard(t) {
  const name = escapeHtml(t.name || t.full_name || "Member");
  const category = escapeHtml(t.category || "all");
  const message = escapeHtml(t.message || "");

  return `
    <div class="card card-soft" data-category="${category}">
      <h3>${titleCase(category)} Testimony</h3>
      <p class="muted" style="white-space:pre-wrap;">“${message}”</p>
      <div class="card-meta">— ${name}</div>
    </div>
  `;
}

function applyFilters() {
  const q = (searchInput?.value || "").toLowerCase().trim();

  cards.forEach((card) => {
    const cat = (card.getAttribute("data-category") || "").toLowerCase();
    const text = card.innerText.toLowerCase();

    const okFilter = activeFilter === "all" || cat === activeFilter;
    const okSearch = !q || text.includes(q);

    card.style.display = okFilter && okSearch ? "" : "none";
  });
}

function setActive(btn) {
  filterBtns.forEach((b) => b.classList.remove("primary"));
  btn.classList.add("primary");
}

async function loadTestimonies() {
  if (!grid) return;

  grid.innerHTML = `<p class="muted">Loading testimonies...</p>`;

  try {
    const { data, error } = await supabase
      .from("testimonies")
      .select("id, name, full_name, message, created_at, is_approved, category")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = `<p class="muted">No testimonies yet. Be the first to share!</p>`;
      cards = [];
      return;
    }

    grid.innerHTML = data.map(renderCard).join("");
    cards = Array.from(grid.querySelectorAll(".card"));
    applyFilters();
  } catch (err) {
    console.error("TESTIMONIES LOAD ERROR:", err);
    grid.innerHTML = `<p class="muted">Could not load testimonies. Check Supabase keys / RLS policies.</p>`;
  }
}

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    activeFilter = (btn.getAttribute("data-filter") || "all").toLowerCase();
    setActive(btn);
    applyFilters();
  });
});

searchInput?.addEventListener("input", applyFilters);

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name =
    (form.querySelector("#t_name")?.value || form.querySelector('input[type="text"]')?.value || "").trim();

  const category =
    (form.querySelector("#t_category")?.value || form.querySelector("select")?.value || "").trim();

  const message =
    (form.querySelector("#t_content")?.value || form.querySelector("textarea")?.value || "").trim();

  if (!name || !category || !message) {
    if (tMsg) tMsg.textContent = "Please fill all fields.";
    return;
  }

  const payload = {
    name,
    full_name: name,
    message,
    category,
    is_approved: false
  };

  const btn = form.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Submitting...";
  }
  if (tMsg) tMsg.textContent = "";

  try {
    const { error } = await supabase.from("testimonies").insert([payload]);
    if (error) throw error;

    form.reset();
    if (tMsg) tMsg.textContent = "Submitted! Your testimony will appear after admin approval.";
  } catch (err) {
    console.error("TESTIMONY INSERT ERROR:", err);
    if (tMsg) tMsg.textContent = err?.message || "Submission failed.";
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Submit Testimony";
    }
  }
});

loadTestimonies();