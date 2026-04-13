/* ═══════════════════════════════════════
       STATE
       All app state in one object — easy to debug
    ═══════════════════════════════════════ */
const state = {
  allProperties: [], // full dataset from JSON
  filtered: [], // after filters applied
  page: 1, // current page (6 per load)
  perPage: 6,
  filters: {
    q: "",
    type: "",
    status: "",
    city: "",
    price: "",
  },
  sort: "featured",
};

/* ═══════════════════════════════════════
       INIT — runs on page load
    ═══════════════════════════════════════ */
async function init() {
  await loadConfig();
  await loadProperties();
  readURLParams();
  applyFiltersAndRender();
}

/* ═══════════════════════════════════════
       LOAD CONFIG — populates city + price dropdowns
    ═══════════════════════════════════════ */
async function loadConfig() {
  try {
    const res = await fetch("/data/config.json");
    const config = await res.json();

    // Populate cities
    const citySelect = document.getElementById("filterCity");
    config.filters.cities.forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });

    // Populate price ranges
    const priceSelect = document.getElementById("filterPrice");
    config.filters.priceRanges.forEach((range, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = range.label;
      opt.dataset.min = range.min;
      opt.dataset.max = range.max ?? "";
      priceSelect.appendChild(opt);
    });
  } catch (e) {
    console.warn("Could not load config.json:", e);
  }
}

/* ═══════════════════════════════════════
       LOAD PROPERTIES
    ═══════════════════════════════════════ */
async function loadProperties() {
  try {
    const res = await fetch("/data/properties.json");
    const data = await res.json();
    state.allProperties = data.properties;
  } catch (e) {
    document.getElementById("listingsGrid").innerHTML = `
          <p class="text-muted" style="grid-column:1/-1;padding:40px 0;text-align:center;">
            Could not load listings. Open the site through a local server (not by double-clicking the file).
          </p>`;
  }
}

/* ═══════════════════════════════════════
       READ URL PARAMS — syncs filters from URL
       e.g. /listings.html?status=for-sale&city=Bacoor
    ═══════════════════════════════════════ */
function readURLParams() {
  const params = new URLSearchParams(window.location.search);

  state.filters.q = params.get("q") || "";
  state.filters.type = params.get("type") || "";
  state.filters.status = params.get("status") || "";
  state.filters.city = params.get("city") || "";
  state.filters.price = params.get("price") || "";
  state.sort = params.get("sort") || "featured";

  // Reflect in UI controls
  document.getElementById("filterKeyword").value = state.filters.q;
  document.getElementById("filterType").value = state.filters.type;
  document.getElementById("filterStatus").value = state.filters.status;
  document.getElementById("filterCity").value = state.filters.city;
  document.getElementById("filterPrice").value = state.filters.price;
  document.getElementById("sortBy").value = state.sort;
}

/* ═══════════════════════════════════════
       WRITE URL PARAMS — keeps URL in sync with filters
       so users can copy/share a filtered URL
    ═══════════════════════════════════════ */
function writeURLParams() {
  const params = new URLSearchParams();
  if (state.filters.q) params.set("q", state.filters.q);
  if (state.filters.type) params.set("type", state.filters.type);
  if (state.filters.status) params.set("status", state.filters.status);
  if (state.filters.city) params.set("city", state.filters.city);
  if (state.filters.price) params.set("price", state.filters.price);
  if (state.sort !== "featured") params.set("sort", state.sort);

  const newURL = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, "", newURL);
}

/* ═══════════════════════════════════════
       FILTER LOGIC
    ═══════════════════════════════════════ */
function applyFilters() {
  const { q, type, status, city, price } = state.filters;
  const keyword = q.toLowerCase();

  // Get price range bounds from the select option's data attrs
  let priceMin = null;
  let priceMax = null;
  if (price !== "") {
    const priceOpt = document.querySelector(
      `#filterPrice option[value="${price}"]`,
    );
    if (priceOpt) {
      priceMin = priceOpt.dataset.min ? Number(priceOpt.dataset.min) : null;
      priceMax = priceOpt.dataset.max ? Number(priceOpt.dataset.max) : null;
    }
  }

  state.filtered = state.allProperties.filter((p) => {
    // Keyword: matches title, city, barangay, description, tags
    if (keyword) {
      const searchable = [
        p.identity.title,
        p.location.city,
        p.location.barangay,
        p.location.address,
        p.metadata.description,
        ...(p.metadata.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(keyword)) return false;
    }

    if (type && p.identity.type !== type) return false;
    if (status && p.identity.status !== status) return false;
    if (city && p.location.city !== city) return false;

    // Price filter
    if (priceMin !== null && p.pricing.price < priceMin) return false;
    if (priceMax !== null && p.pricing.price > priceMax) return false;

    return true;
  });
}

/* ═══════════════════════════════════════
       SORT LOGIC
    ═══════════════════════════════════════ */
function sortProperties() {
  const arr = [...state.filtered];

  switch (state.sort) {
    case "price-asc":
      arr.sort((a, b) => a.pricing.price - b.pricing.price);
      break;
    case "price-desc":
      arr.sort((a, b) => b.pricing.price - a.pricing.price);
      break;
    case "newest":
      arr.sort(
        (a, b) =>
          new Date(b.metadata.datePosted) - new Date(a.metadata.datePosted),
      );
      break;
    case "area-desc":
      arr.sort(
        (a, b) => (b.details.floorArea || 0) - (a.details.floorArea || 0),
      );
      break;
    case "featured":
    default:
      arr.sort(
        (a, b) => (b.identity.featured ? 1 : 0) - (a.identity.featured ? 1 : 0),
      );
  }

  state.filtered = arr;
}

/* ═══════════════════════════════════════
       RENDER
    ═══════════════════════════════════════ */
function applyFiltersAndRender() {
  state.page = 1;
  applyFilters();
  sortProperties();
  writeURLParams();
  renderChips();
  renderGrid();
  updateCounts();
}

function renderGrid() {
  const grid = document.getElementById("listingsGrid");
  const empty = document.getElementById("emptyState");
  const lmWrap = document.getElementById("loadMoreWrap");
  const lmMeta = document.getElementById("loadMoreMeta");

  const toShow = state.filtered.slice(0, state.page * state.perPage);

  if (state.filtered.length === 0) {
    grid.innerHTML = "";
    empty.classList.add("visible");
    lmWrap.classList.add("hidden");
    return;
  }

  empty.classList.remove("visible");
  grid.innerHTML = toShow.map((p, i) => cardHTML(p, i)).join("");

  // Load more button
  const hasMore = state.filtered.length > toShow.length;
  lmWrap.classList.toggle("hidden", !hasMore);
  if (hasMore) {
    const remaining = state.filtered.length - toShow.length;
    lmMeta.textContent = `Showing ${toShow.length} of ${state.filtered.length} — ${remaining} more available`;
  }
}

function updateCounts() {
  const total = state.filtered.length;
  const all = state.allProperties.length;
  const countEl = document.getElementById("resultsCount");
  const headerEl = document.getElementById("headerCount");

  countEl.innerHTML =
    total === all
      ? `Showing <strong>${total}</strong> properties`
      : `Showing <strong>${total}</strong> of <strong>${all}</strong> properties`;

  headerEl.textContent =
    total === 1 ? "1 property found" : `${total} properties found`;
}

/* ═══════════════════════════════════════
       ACTIVE FILTER CHIPS
    ═══════════════════════════════════════ */
const FILTER_LABELS = {
  q: (v) => `"${v}"`,
  type: (v) =>
    ({
      house: "House",
      condo: "Condo",
      lot: "Lot",
      townhouse: "Townhouse",
    })[v] || v,
  status: (v) => ({ "for-sale": "For Sale", "for-rent": "For Rent" })[v] || v,
  city: (v) => v,
  price: (v) =>
    document.querySelector(`#filterPrice option[value="${v}"]`)?.textContent ||
    v,
};

function renderChips() {
  const row = document.getElementById("chipsRow");
  const chips = [];

  Object.entries(state.filters).forEach(([key, val]) => {
    if (!val && val !== 0) return;
    const label = FILTER_LABELS[key]?.(val) || val;
    chips.push(`
          <span class="chip">
            ${label}
            <i class="chip__remove" role="button" aria-label="Remove ${label} filter"
               onclick="removeFilter('${key}')">✕</i>
          </span>
        `);
  });

  row.innerHTML = chips.join("");
  row.classList.toggle("has-chips", chips.length > 0);
}

function removeFilter(key) {
  state.filters[key] = "";
  document.getElementById(
    {
      q: "filterKeyword",
      type: "filterType",
      status: "filterStatus",
      city: "filterCity",
      price: "filterPrice",
    }[key],
  ).value = "";
  applyFiltersAndRender();
}

/* ═══════════════════════════════════════
       CARD HTML TEMPLATE
    ═══════════════════════════════════════ */
function cardHTML(p, index = 0) {
  const { identity, pricing, location, details, media, metadata } = p;

  const statusClass =
    {
      "for-sale": "badge--for-sale",
      "for-rent": "badge--for-rent",
      sold: "badge--sold",
    }[identity.status] || "badge--for-sale";

  const statusLabel =
    {
      "for-sale": "For Sale",
      "for-rent": "For Rent",
      sold: "Sold",
    }[identity.status] || identity.status;

  const beds =
    details.bedrooms > 0
      ? `${details.bedrooms} Bed${details.bedrooms > 1 ? "s" : ""}`
      : "Studio";
  const baths = `${details.bathrooms} Bath${details.bathrooms > 1 ? "s" : ""}`;
  const area = details.floorArea ? `${details.floorArea} sqm` : "";

  const monthly = pricing.monthlyAmortization
    ? `<div class="price-monthly">~₱${pricing.monthlyAmortization.toLocaleString()}/mo</div>`
    : "";

  // Stagger animation delay
  const delay = Math.min(index * 60, 360);

  return `
        <article class="card" style="animation-delay:${delay}ms;">
          <a href="/pages/property.html?id=${p.id}" class="card__image-wrap">
            <img
              class="card__image"
              src="${media.thumbnail}"
              alt="${identity.title}"
              loading="lazy"
              onerror="this.src='/images/brand/placeholder.jpg'"
            />
            <div class="card__badges">
              <span class="badge ${statusClass}">${statusLabel}</span>
              ${identity.featured ? '<span class="badge badge--featured">★ Featured</span>' : ""}
            </div>
          </a>
          <div class="card__body">
            <h2 class="card__title">
              <a href="/pages/property.html?id=${p.id}">${identity.title}</a>
            </h2>
            <div class="card__location">
              📍 ${location.barangay}, ${location.city}
            </div>
            <div class="card__specs">
              <div class="card__spec">
                <span class="card__spec-icon">🛏</span> ${beds}
              </div>
              <div class="card__spec">
                <span class="card__spec-icon">🚿</span> ${baths}
              </div>
              ${area ? `<div class="card__spec"><span class="card__spec-icon">📐</span> ${area}</div>` : ""}
            </div>
            <div class="card__footer">
              <div>
                <div class="price">${pricing.priceLabel}</div>
                ${monthly}
              </div>
              <a href="/pages/property.html?id=${p.id}" class="btn btn--primary btn--sm">View</a>
            </div>
          </div>
        </article>
      `;
}

/* ═══════════════════════════════════════
       EVENT LISTENERS
    ═══════════════════════════════════════ */

// Filter inputs — debounced keyword, instant selects
let debounceTimer;
document.getElementById("filterKeyword").addEventListener("input", (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    state.filters.q = e.target.value.trim();
    applyFiltersAndRender();
  }, 320);
});

["filterType", "filterStatus", "filterCity", "filterPrice"].forEach((id) => {
  document.getElementById(id).addEventListener("change", (e) => {
    const key = {
      filterType: "type",
      filterStatus: "status",
      filterCity: "city",
      filterPrice: "price",
    }[id];
    state.filters[key] = e.target.value;
    applyFiltersAndRender();
  });
});

// Sort
document.getElementById("sortBy").addEventListener("change", (e) => {
  state.sort = e.target.value;
  applyFiltersAndRender();
});

// Reset
function resetAllFilters() {
  state.filters = { q: "", type: "", status: "", city: "", price: "" };
  state.sort = "featured";
  document.getElementById("filterKeyword").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("filterStatus").value = "";
  document.getElementById("filterCity").value = "";
  document.getElementById("filterPrice").value = "";
  document.getElementById("sortBy").value = "featured";
  applyFiltersAndRender();
}

document.getElementById("resetBtn").addEventListener("click", resetAllFilters);
document
  .getElementById("emptyResetBtn")
  .addEventListener("click", resetAllFilters);

// Load more
document.getElementById("loadMoreBtn").addEventListener("click", () => {
  state.page++;
  renderGrid();
  updateCounts();
});

// Kick everything off
init();
