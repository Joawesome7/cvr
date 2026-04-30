/**
 * Developers Page - Vanilla JavaScript
 * Fetches developer data from JSON and renders developer cards
 */

// Mobile menu toggle
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  // Close menu when a link is clicked
  document.querySelectorAll(".nav-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
    });
  });
}

// Fetch and render developers
async function loadDevelopers() {
  try {
    const response = await fetch("../data/developers.json");
    if (!response.ok) throw new Error("Failed to load developers");

    const developers = await response.json();
    renderDevelopers(developers);
  } catch (error) {
    console.error("Error loading developers:", error);
    document.getElementById("developersGrid").innerHTML = `
      <div class="error-message">
        <p>Unable to load developers. Please try again later.</p>
      </div>
    `;
  }
}

function renderDevelopers(developers) {
  const grid = document.getElementById("developersGrid");
  grid.innerHTML = ""; // Clear skeleton loaders

  developers.forEach((developer) => {
    const card = createDeveloperCard(developer);
    grid.appendChild(card);
  });
}

function createDeveloperCard(developer) {
  const card = document.createElement("div");
  card.className = "developer-card";
  card.innerHTML = `
    <div class="card-header">
      <img src="${developer.logo}" alt="${developer.name}" class="developer-logo" />
    </div>
    <div class="card-body">
      <h3 class="developer-name">${developer.name}</h3>
      <p class="developer-description">${developer.description}</p>
      <a href="${developer.website}" rel="noopener noreferrer" class="btn btn-learn-more">
        Learn More →
      </a>
    </div>
  `;
  return card;
}

// Load developers when page loads
document.addEventListener("DOMContentLoaded", loadDevelopers);
