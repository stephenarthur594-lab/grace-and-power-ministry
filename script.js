// Turn on JS mode (so reveal animation only runs when JS is working)
document.documentElement.classList.add("js");

// ================= MENU TOGGLE (SAFE) =================
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("#site-nav") || document.querySelector("header nav");

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

// ================= REVEAL (SAFE) =================
const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  revealEls.forEach((el) => io.observe(el));
} else {
  // Fallback for old browsers
  revealEls.forEach((el) => el.classList.add("active"));
}
/* ===== Secret Admin Access ===== */

const secret = document.getElementById("admin-secret");

if(secret){

let clicks = 0;

secret.addEventListener("click", () => {

clicks++;

if(clicks >= 5){
window.location.href = "admin.html";
}

setTimeout(()=>{
clicks = 0;
},3000);

});

}