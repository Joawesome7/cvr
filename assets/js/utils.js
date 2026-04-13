/* ── 1. Mobile nav toggle ── */
export function initMobileNav() {
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  if (!navToggle || !navLinks) return;

  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    // Animate hamburger to X
    const spans = navToggle.querySelectorAll("span");
    const isOpen = navLinks.classList.contains("open");
    spans[0].style.transform = isOpen ? "translateY(7px) rotate(45deg)" : "";
    spans[1].style.opacity = isOpen ? "0" : "1";
    spans[2].style.transform = isOpen ? "translateY(-7px) rotate(-45deg)" : "";
  });
}

// --- Component loader ---
export async function loadComponent(selector, path) {
  const el = document.querySelector(selector);
  if (!el) return;

  try {
    const res = await fetch(path);
    const html = await res.text();
    el.innerHTML = html;
  } catch (err) {
    console.warn(`Could not load component: ${path}`, err);
  }
}
