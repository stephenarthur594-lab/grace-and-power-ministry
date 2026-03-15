import { supabase } from "./supabase.js";

const tbody = document.getElementById("appointmentsBody");
const refreshBtn = document.getElementById("refreshAppointments");
const exportBtn = document.getElementById("exportAppointments");
const meta = document.getElementById("apptMeta");

function badgeClass(status) {
  const s = String(status || "pending").toLowerCase();
  if (s === "confirmed") return "confirmed";
  if (s === "cancelled") return "cancelled";
  if (s === "completed") return "completed";
  return "pending";
}

function fmtDate(ts) {
  try {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return String(ts || "");
  }
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let cachedAppointments = [];

async function loadAppointments() {
  tbody.innerHTML = `<tr><td colspan="8" class="muted">Loading appointments...</td></tr>`;

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="8">Failed to load appointments: ${escapeHtml(error.message)}</td></tr>`;
    meta.textContent = "";
    return;
  }

  cachedAppointments = data || [];
  meta.textContent = `${cachedAppointments.length} appointment(s)`;

  if (!cachedAppointments.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="muted">No appointments yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = cachedAppointments.map((a) => {
    const status = (a.status || "pending").toLowerCase();
    const created = a.created_at ? fmtDate(a.created_at) : "";
    const dateTime = `${a.appointment_date || ""} ${a.appointment_time || ""}`.trim();
    const message = a.message ? escapeHtml(a.message) : `<span class="muted">—</span>`;
    const email = a.email ? escapeHtml(a.email) : "";
    const phone = a.phone ? escapeHtml(a.phone) : "";

    return `
      <tr data-id="${a.id}">
        <td class="small">${escapeHtml(created)}</td>
        <td>${escapeHtml(a.name || "")}</td>
        <td class="small">
          <div>${email}</div>
          <div class="muted">${phone}</div>
        </td>
        <td>${escapeHtml(a.appointment_type || "")}</td>
        <td>${escapeHtml(dateTime)}</td>
        <td class="small">${message}</td>
        <td>
          <span class="badge ${badgeClass(status)}">${escapeHtml(status)}</span>
          <div style="margin-top:8px;">
            <select class="admin-select" data-action="status">
              ${["pending","confirmed","cancelled","completed"].map(s => `
                <option value="${s}" ${s===status?"selected":""}>${s}</option>
              `).join("")}
            </select>
          </div>
        </td>
        <td>
          <div class="row-actions">
            <button class="btn mini-btn" data-action="save">Save</button>
            <button class="btn mini-btn" data-action="delete">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

async function updateStatus(id, newStatus) {
  const { error } = await supabase
    .from("appointments")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) throw error;
}

async function deleteAppointment(id) {
  const ok = confirm("Delete this appointment?");
  if (!ok) return;
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

function exportCSV() {
  const rows = cachedAppointments.map(a => ({
    id: a.id,
    created_at: a.created_at,
    name: a.name,
    email: a.email,
    phone: a.phone,
    appointment_type: a.appointment_type,
    appointment_date: a.appointment_date,
    appointment_time: a.appointment_time,
    message: a.message,
    status: a.status
  }));

  const headers = Object.keys(rows[0] || {
    id: "", created_at:"", name:"", email:"", phone:"",
    appointment_type:"", appointment_date:"", appointment_time:"",
    message:"", status:""
  });

  const csv = [
    headers.join(","),
    ...rows.map(r =>
      headers.map(h => {
        const v = r[h] ?? "";
        // CSV escaping
        const s = String(v).replaceAll('"', '""');
        return `"${s}"`;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `appointments-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Click handlers (save/delete)
tbody?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const tr = e.target.closest("tr");
  const id = tr?.dataset?.id;
  if (!id) return;

  const action = btn.dataset.action;

  try {
    if (action === "save") {
      const select = tr.querySelector('select[data-action="status"]');
      const newStatus = select?.value || "pending";
      await updateStatus(id, newStatus);
      await loadAppointments();
      alert("Status updated.");
    }

    if (action === "delete") {
      await deleteAppointment(id);
      await loadAppointments();
      alert("Deleted.");
    }
  } catch (err) {
    console.error(err);
    alert(err?.message || "Action failed.");
  }
});

refreshBtn?.addEventListener("click", loadAppointments);
exportBtn?.addEventListener("click", exportCSV);

// Initial load
loadAppointments();