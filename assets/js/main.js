import { loadComponent, initMobileNav } from "/assets/js/utils.js";

function setActiveNavLink() {
  const current = window.location.pathname;

  document.querySelectorAll(".nav__link").forEach((link) => {
    const linkPath = new URL(link.href).pathname;
    link.classList.toggle("active", linkPath === current);
  });
}

async function init() {
  await loadComponent("#nav-placeholder", "/components/nav.html");
  await loadComponent("#footer-placeholder", "/components/footer.html");

  initMobileNav();
  setActiveNavLink();
}

init();
