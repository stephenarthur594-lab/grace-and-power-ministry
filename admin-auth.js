import { supabase } from "./supabase.js";

async function requireAdmin() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.replace("login.html");
    return;
  }

  // check role from profiles
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !data || data.role !== "admin") {
    await supabase.auth.signOut();
    alert("Not authorized.");
    window.location.replace("login.html");
  }
}

requireAdmin();

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.replace("login.html");
});