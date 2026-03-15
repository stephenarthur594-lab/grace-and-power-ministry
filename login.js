import { supabase } from "./supabase.js";

const form = document.getElementById("loginForm");
const errorEl = document.getElementById("error");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = error.message;
    return;
  }

  window.location.replace("admin.html");
});