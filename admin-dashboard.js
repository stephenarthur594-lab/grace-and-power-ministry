// admin-dashboard.js
import { supabase } from "./supabaseClient.js";

const $ = (id) => document.getElementById(id);

const loginBox = $("admin-login");
const dashBox = $("admin-dashboard");

const loginForm = $("login-form");
const loginEmail = $("login-email");
const loginPassword = $("login-password");
const loginMsg = $("login-msg");
const logoutBtn = $("logout-btn");

const appointmentsList = $("appointments-list");
const pendingTestimonies = $("pending-testimonies");
const approvedTestimonies = $("approved-testimonies");

const eventForm = $("event-form");
const evTitle = $("ev_title");
const evDate = $("ev_date");
const evTime = $("ev_time");
const evLocation = $("ev_location");
const evImage = $("ev_image");
const evDesc = $("ev_desc");
const evSubmit = $("ev_submit");
const evMsg = $("ev_msg");

const eventsList = $("events-list");

function show(el) {
  if (el) el.style.display = "";
}

function hide(el) {
  if (el) el.style.display = "none";
}

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
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function toNiceError(err) {
  if (!err) return "Unknown error.";
  if (typeof err === "string") return err;
  return err.message || JSON.stringify(err);
}

async function setUI(user) {
  if (user) {
    hide(loginBox);
    show(dashBox);
    await loadAll();
  } else {
    show(loginBox);
    hide(dashBox);
  }
}

supabase.auth.onAuthStateChange((_e, session) => {
  setUI(session?.user || null);
});

(async () => {
  const { data } = await supabase.auth.getSession();
  await setUI(data?.session?.user || null);
})();

/* ================= LOGIN ================= */

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (loginMsg) loginMsg.textContent = "Signing in...";

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.value.trim(),
      password: loginPassword.value
    });

    if (error) throw error;
    if (loginMsg) loginMsg.textContent = "";
  } catch (err) {
    if (loginMsg) loginMsg.textContent = toNiceError(err);
  }
});

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

/* ================= LOAD DASHBOARD ================= */

async function loadAll() {
  await Promise.allSettled([
    loadAppointments(),
    loadPendingTestimonies(),
    loadApprovedTestimonies(),
    loadEvents()
  ]);
}

/* ================= APPOINTMENTS ================= */

async function loadAppointments() {
  if (!appointmentsList) return;

  appointmentsList.textContent = "Loading...";

  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, name, email, phone, appointment_type, appointment_date, appointment_time, message, status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      appointmentsList.innerHTML = `<div class="muted">No appointments yet.</div>`;
      return;
    }

    appointmentsList.innerHTML = data.map((ap) => {
      const id = ap.id;
      const name = escapeHtml(ap.name || "Unknown");
      const email = escapeHtml(ap.email || "");
      const phone = escapeHtml(ap.phone || "");
      const type = escapeHtml(ap.appointment_type || "");
      const date = escapeHtml(ap.appointment_date || "");
      const time = escapeHtml(ap.appointment_time || "");
      const message = escapeHtml(ap.message || "");
      const status = escapeHtml(ap.status || "pending");

      return `
        <div class="card card-soft admin-card" style="margin-top:10px;">
          <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
            <strong>${name}</strong>
            <span class="muted">${date}${time ? " • " + time : ""}</span>
          </div>

          <div class="muted" style="margin-top:6px;">
            ${type}${status ? " • Status: " + status : ""}
          </div>

          ${email ? `<div style="margin-top:8px;">Email: ${email}</div>` : ""}
          ${phone ? `<div>Phone: ${phone}</div>` : ""}
          ${message ? `<div style="margin-top:10px; white-space:pre-wrap;">${message}</div>` : ""}

          <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
            <button class="btn soft" data-status="${id}" data-next="approved" type="button">Approve</button>
            <button class="btn soft" data-status="${id}" data-next="completed" type="button">Complete</button>
            <button class="btn soft" data-del-appointment="${id}" type="button">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    appointmentsList.querySelectorAll("[data-status]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-status");
        const next = btn.getAttribute("data-next");
        await updateAppointmentStatus(id, next);
      });
    });

    appointmentsList.querySelectorAll("[data-del-appointment]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-appointment");
        if (!confirm("Delete this appointment?")) return;
        await deleteAppointment(id);
      });
    });

  } catch (err) {
    console.error(err);
    appointmentsList.innerHTML = `<div class="muted">Could not load appointments.</div>`;
  }
}

async function updateAppointmentStatus(id, nextStatus) {
  try {
    const { error } = await supabase
      .from("appointments")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) throw error;
    await loadAppointments();
  } catch (err) {
    alert(toNiceError(err));
  }
}

async function deleteAppointment(id) {
  try {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await loadAppointments();
  } catch (err) {
    alert(toNiceError(err));
  }
}

/* ================= PENDING TESTIMONIES ================= */

async function loadPendingTestimonies() {
  if (!pendingTestimonies) return;

  pendingTestimonies.textContent = "Loading...";

  try {
    const { data, error } = await supabase
      .from("testimonies")
      .select("id, name, full_name, message, category, created_at, is_approved")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      pendingTestimonies.innerHTML = `<div class="muted">No pending testimonies.</div>`;
      return;
    }

    pendingTestimonies.innerHTML = data.map((t) => {
      const id = t.id;
      const name = escapeHtml(t.name || t.full_name || "Member");
      const category = escapeHtml(t.category || "");
      const message = escapeHtml(t.message || "");
      const created = fmtDate(t.created_at);

      return `
        <div class="card card-soft admin-card" style="margin-top:10px;">
          <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
            <strong>${name}</strong>
            <span class="muted">${created}</span>
          </div>

          ${category ? `<div class="muted" style="margin-top:6px;">Category: ${category}</div>` : ""}

          <div style="margin-top:10px; white-space:pre-wrap;">${message}</div>

          <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
            <button class="btn primary" data-approve="${id}" type="button">Approve</button>
            <button class="btn soft" data-del-testimony="${id}" type="button">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    pendingTestimonies.querySelectorAll("[data-approve]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-approve");
        await approveTestimony(id);
      });
    });

    pendingTestimonies.querySelectorAll("[data-del-testimony]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-testimony");
        if (!confirm("Delete this testimony?")) return;
        await deleteTestimony(id);
      });
    });

  } catch (err) {
    console.error(err);
    pendingTestimonies.innerHTML = `<div class="muted">Could not load testimonies.</div>`;
  }
}

/* ================= APPROVED TESTIMONIES ================= */

async function loadApprovedTestimonies() {
  if (!approvedTestimonies) return;

  approvedTestimonies.textContent = "Loading...";

  try {
    const { data, error } = await supabase
      .from("testimonies")
      .select("id, name, full_name, message, category, created_at, is_approved")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      approvedTestimonies.innerHTML = `<div class="muted">No approved testimonies yet.</div>`;
      return;
    }

    approvedTestimonies.innerHTML = data.map((t) => {
      const id = t.id;
      const name = escapeHtml(t.name || t.full_name || "Member");
      const category = escapeHtml(t.category || "");
      const message = escapeHtml(t.message || "");
      const created = fmtDate(t.created_at);

      return `
        <div class="card card-soft admin-card" style="margin-top:10px;">
          <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
            <strong>${name}</strong>
            <span class="muted">${created}</span>
          </div>

          ${category ? `<div class="muted" style="margin-top:6px;">Category: ${category}</div>` : ""}

          <div style="margin-top:10px; white-space:pre-wrap;">${message}</div>

          <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
            <button class="btn soft" data-unapprove="${id}" type="button">Move to Pending</button>
            <button class="btn soft" data-del-approved="${id}" type="button">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    approvedTestimonies.querySelectorAll("[data-unapprove]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-unapprove");
        await unapproveTestimony(id);
      });
    });

    approvedTestimonies.querySelectorAll("[data-del-approved]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-approved");
        if (!confirm("Delete this approved testimony?")) return;
        await deleteTestimony(id);
      });
    });

  } catch (err) {
    console.error(err);
    approvedTestimonies.innerHTML = `<div class="muted">Could not load approved testimonies.</div>`;
  }
}

async function approveTestimony(id) {
  try {
    const { error } = await supabase
      .from("testimonies")
      .update({ is_approved: true })
      .eq("id", id);

    if (error) throw error;

    await loadPendingTestimonies();
    await loadApprovedTestimonies();
  } catch (err) {
    alert(toNiceError(err));
  }
}

async function unapproveTestimony(id) {
  try {
    const { error } = await supabase
      .from("testimonies")
      .update({ is_approved: false })
      .eq("id", id);

    if (error) throw error;

    await loadPendingTestimonies();
    await loadApprovedTestimonies();
  } catch (err) {
    alert(toNiceError(err));
  }
}

async function deleteTestimony(id) {
  try {
    const { error } = await supabase
      .from("testimonies")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await loadPendingTestimonies();
    await loadApprovedTestimonies();
  } catch (err) {
    alert(toNiceError(err));
  }
}

/* ================= EVENTS ================= */

async function loadEvents() {
  if (!eventsList) return;

  eventsList.textContent = "Loading events...";

  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      eventsList.innerHTML = `<div class="muted">No events yet.</div>`;
      return;
    }

    eventsList.innerHTML = data.map((ev) => {
      const id = ev.id;
      const title = escapeHtml(ev.title || "");
      const date = fmtDate(ev.date);
      const time = escapeHtml(ev.time || "");
      const location = escapeHtml(ev.location || "");
      const description = escapeHtml(ev.description || "");
      const image = ev.image_url || "";
      const published = !!ev.is_published;

      return `
        <div class="card card-soft admin-card" style="margin-top:10px;">
          <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
            <strong>${title}</strong>
            <span class="muted">${date}${time ? " • " + time : ""}</span>
          </div>

          ${location ? `<div class="muted" style="margin-top:6px;">${location}</div>` : ""}

          ${image ? `<img src="${image}" alt="${title}" class="event-card-img" style="margin-top:10px;">` : ""}

          ${description ? `<div style="margin-top:10px;">${description}</div>` : ""}

          <div style="margin-top:10px;">
            <span class="muted">Status: <strong>${published ? "Published" : "Hidden"}</strong></span>
          </div>

          <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;">
            <button class="btn soft" data-toggle="${id}" type="button">
              ${published ? "Unpublish" : "Publish"}
            </button>
            <button class="btn soft" data-del-event="${id}" type="button">
              Delete
            </button>
          </div>
        </div>
      `;
    }).join("");

    eventsList.querySelectorAll("[data-del-event]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-event");
        if (!confirm("Delete event?")) return;
        await deleteEvent(id);
      });
    });

    eventsList.querySelectorAll("[data-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-toggle");
        await togglePublish(id);
      });
    });

  } catch (err) {
    console.error(err);
    eventsList.innerHTML = `<div class="muted">Could not load events.</div>`;
  }
}

/* ================= EVENT CREATE ================= */

eventForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (evMsg) evMsg.textContent = "";
  if (evSubmit) {
    evSubmit.disabled = true;
    evSubmit.textContent = "Publishing...";
  }

  try {
    const title = evTitle.value.trim();
    const date = evDate.value;
    const time = evTime.value.trim();
    const location = evLocation.value.trim();
    const description = evDesc.value.trim();

    if (!title || !date) throw new Error("Title and date required");

    const file = evImage.files[0];
    if (!file) throw new Error("Please select image");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `event_${Date.now()}.${ext}`;

    const upload = await supabase.storage.from("events").upload(path, file);
    if (upload.error) throw upload.error;

    const { data } = supabase.storage.from("events").getPublicUrl(path);
    const image_url = data.publicUrl;

    const { error } = await supabase
      .from("events")
      .insert([{
        title,
        date,
        time,
        location,
        description,
        image_url,
        is_published: true
      }]);

    if (error) throw error;

    eventForm.reset();
    if (evMsg) evMsg.textContent = "Event published!";
    await loadEvents();

  } catch (err) {
    if (evMsg) evMsg.textContent = toNiceError(err);
  } finally {
    if (evSubmit) {
      evSubmit.disabled = false;
      evSubmit.textContent = "Publish Event";
    }
  }
});

/* ================= EVENT DELETE ================= */

async function deleteEvent(id) {
  try {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await loadEvents();
  } catch (err) {
    alert(toNiceError(err));
  }
}

/* ================= EVENT PUBLISH ================= */

async function togglePublish(id) {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("is_published")
      .eq("id", id)
      .single();

    if (error) throw error;

    const { error: err2 } = await supabase
      .from("events")
      .update({ is_published: !data.is_published })
      .eq("id", id);

    if (err2) throw err2;
    await loadEvents();
  } catch (err) {
    alert(toNiceError(err));
  }
}
