/* ── Helpers ── */
const $ = (id) => document.getElementById(id);

/* ── Lightbox state ── */
let lightboxImages = [];
let lightboxIndex = 0;

/* ═══════════════════════════════════════
       INIT
    ═══════════════════════════════════════ */
async function init() {
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    showError(
      "No property ID in URL.",
      "Go back to listings and click a property.",
    );
    return;
  }

  try {
    const res = await fetch("/data/properties.json");
    const data = await res.json();
    const prop = data.properties.find((p) => p.id === id);

    if (!prop) {
      showError(
        "Property not found.",
        "It may have been removed or the link is outdated.",
      );
      return;
    }

    renderPage(prop);
    updateMeta(prop);
  } catch (e) {
    showError(
      "Could not load property data.",
      "Make sure you're using a local server (not opening the file directly).",
    );
  }
}

/* ═══════════════════════════════════════
       UPDATE PAGE META (title, OG tags)
    ═══════════════════════════════════════ */
function updateMeta(p) {
  document.title = `${p.identity.title} — CVR`;
  document
    .querySelector('meta[name="description"]')
    .setAttribute("content", p.metadata.description.slice(0, 160));
  $("breadcrumbTitle").textContent = p.identity.title;
}

/* ═══════════════════════════════════════
       RENDER FULL PAGE
    ═══════════════════════════════════════ */
function renderPage(p) {
  const { identity, pricing, location, details, media, metadata } = p;

  // Build image list — use thumbnail if no images array
  lightboxImages = media.images?.length ? media.images : [media.thumbnail];

  $("pageContent").innerHTML = `
        <div class="container">
          <div class="property-layout">

            <!-- ── LEFT: main content ── -->
            <div>

              <!-- Gallery -->
              <div class="gallery">
                <div class="gallery__main" id="galleryMain"
                     onclick="openLightbox(0)" role="button" tabindex="0"
                     aria-label="Open photo gallery">
                  <img
                    id="mainPhoto"
                    src="${media.thumbnail}"
                    alt="${identity.title}"
                    onerror="this.src='/images/brand/placeholder.jpg'"
                  />
                  <div class="gallery__expand" aria-hidden="true">⛶</div>
                  <div class="gallery__count">
                    📷 ${lightboxImages.length} photo${lightboxImages.length !== 1 ? "s" : ""}
                  </div>
                </div>

                <div class="gallery__thumbs" id="galleryThumbs">
                  ${lightboxImages
                    .map(
                      (src, i) => `
                    <div
                      class="gallery__thumb ${i === 0 ? "active" : ""}"
                      onclick="switchPhoto(${i})"
                      role="button"
                      tabindex="0"
                      aria-label="View photo ${i + 1}"
                    >
                      <img src="${src}" alt="Photo ${i + 1}"
                           onerror="this.src='/images/brand/placeholder.jpg'" />
                    </div>
                  `,
                    )
                    .join("")}
                </div>
              </div>

              <!-- Title & badges -->
              <div class="property-title-row">
                <div class="property-badges">
                  ${badgeHTML(identity.status)}
                  <span class="tag">${capitalize(identity.type)}</span>
                  ${identity.featured ? '<span class="badge badge--featured">★ Featured</span>' : ""}
                </div>
                <h1 class="property-title">${identity.title}</h1>
                <div class="property-location">
                  📍 ${location.address}, ${location.barangay}, ${location.city}, ${location.province}
                </div>
              </div>

              <!-- Key specs -->
              <div class="specs-grid">
                ${specsHTML(details)}
              </div>

              <!-- Description -->
              <div class="info-section">
                <h2 class="info-section__title">About this property</h2>
                <div id="descWrapper">
                  <p class="description-text" id="descText"
                     style="overflow:hidden;${metadata.description.length > 280 ? "max-height:5.6em;" : ""}">
                    ${metadata.description}
                  </p>
                  ${
                    metadata.description.length > 280
                      ? `
                    <button class="read-more-btn" id="readMoreBtn"
                            onclick="toggleReadMore()">Read more ↓</button>
                  `
                      : ""
                  }
                </div>
              </div>

              <!-- Amenities -->
              ${
                metadata.amenities?.length
                  ? `
                <div class="info-section">
                  <h2 class="info-section__title">Amenities &amp; features</h2>
                  <div class="amenities-list">
                    ${metadata.amenities
                      .map(
                        (a) => `
                      <span class="amenity-chip">
                        ${amenityIcon(a)} ${amenityLabel(a)}
                      </span>
                    `,
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }

              <!-- Property details table -->
              <div class="info-section">
                <h2 class="info-section__title">Property details</h2>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;">
                  ${detailRowsHTML(identity, details, location)}
                </div>
              </div>

              <!-- Inquiry form -->
              <div class="info-section">
                <div class="inquiry-form">
                  <h2 class="inquiry-form__title">Send an inquiry</h2>
                  <p class="inquiry-form__sub">
                    Interested in this property? Fill out the form and
                    ${metadata.agent.name} will get back to you shortly.
                  </p>

                  <!-- Replace YOUR_FORM_ID with your Formspree form ID -->
                  <!-- Get a free form at formspree.io — takes 2 minutes -->
                  <form id="inquiryForm"
                        action="https://formspree.io/f/xzdjkkjo"
                        method="POST">

                    <!-- Hidden field: tells the agent which property this is -->
                    <input type="hidden" name="property_id"    value="${p.id}" />
                    <input type="hidden" name="property_title" value="${identity.title}" />
                    <input type="hidden" name="property_url"   value="${window.location.href}" />

                    <div class="form-row" style="margin-bottom:var(--space-4);">
                      <div class="form-group">
                        <label class="form-label" for="inquiryName">Your name *</label>
                        <input
                          class="form-input"
                          type="text"
                          id="inquiryName"
                          name="name"
                          placeholder="Juan dela Cruz"
                          required
                        />
                      </div>
                      <div class="form-group">
                        <label class="form-label" for="inquiryPhone">Phone / Viber *</label>
                        <input
                          class="form-input"
                          type="tel"
                          id="inquiryPhone"
                          name="phone"
                          placeholder="+63 912 345 6789"
                          required
                        />
                      </div>
                    </div>

                    <div class="form-group" style="margin-bottom:var(--space-4);">
                      <label class="form-label" for="inquiryEmail">Email (optional)</label>
                      <input
                        class="form-input"
                        type="email"
                        id="inquiryEmail"
                        name="email"
                        placeholder="juan@email.com"
                      />
                    </div>

                    <div class="form-group" style="margin-bottom:var(--space-6);">
                      <label class="form-label" for="inquiryMessage">Message *</label>
                      <textarea
                        class="form-textarea"
                        id="inquiryMessage"
                        name="message"
                        required
                      >Hi, I'm interested in "${identity.title}". Please contact me for more details.</textarea>
                    </div>

                    <button type="submit" class="btn btn--primary btn--full btn--lg"
                            id="inquirySubmit">
                      Send inquiry
                    </button>

                  </form>

                  <!-- Success state (hidden until form submitted) -->
                  <div class="form-success" id="formSuccess">
                    <div class="form-success__icon">✅</div>
                    <h3 class="form-success__title">Inquiry sent!</h3>
                    <p class="text-muted">
                      Thank you! ${metadata.agent.name} will reach out to you
                      within 24 hours. You can also message directly on Viber.
                    </p>
                    <a href="viber://chat?number=%2B63${metadata.agent.viberNumber?.replace(/\D/g, "").slice(-10)}"
                       class="btn btn--viber">
                      📱 Message on Viber
                    </a>
                  </div>

                </div>
              </div>

            </div><!-- end left col -->


            <!-- ── RIGHT: sidebar ── -->
            <aside class="sidebar">

              <!-- Price card -->
              <div class="sidebar__card">
                <div class="sidebar__price-block">
                  <div class="sidebar__price">${pricing.priceLabel}</div>
                  ${
                    pricing.monthlyAmortization
                      ? `
                    <div class="sidebar__monthly">
                      Monthly amortization: ~₱${pricing.monthlyAmortization.toLocaleString()}
                    </div>
                  `
                      : ""
                  }
                  ${
                    pricing.priceNegotiable
                      ? `
                    <span class="sidebar__negotiable">✓ Price negotiable</span>
                  `
                      : ""
                  }
                </div>

                <div class="sidebar__actions">
                  <a href="tel:${metadata.agent.phone}"
                     class="btn btn--primary btn--full">
                    📞 Call ${metadata.agent.name.split(" ")[0]}
                  </a>
                  <a href="viber://chat?number=%2B63${metadata.agent.viberNumber?.replace(/\D/g, "").slice(-10)}"
                     class="btn btn--viber btn--full">
                    📱 Message on Viber
                  </a>
                  <button
                    class="btn btn--secondary btn--full"
                    onclick="document.getElementById('inquiryForm').scrollIntoView({behavior:'smooth'})">
                    ✉️ Send inquiry
                  </button>
                </div>

                <!-- Agent info -->
                <div class="agent-card">
                  <div class="agent-avatar">
                    <img src="/images/team/${metadata.agent.name.toLowerCase().replace(/\s+/g, "-")}.jpg"
                         alt="${metadata.agent.name}"
                         onerror="this.parentElement.textContent='👤'" />
                  </div>
                  <div>
                    <div class="agent-name">${metadata.agent.name}</div>
                    <div class="agent-role">CVR Agent</div>
                  </div>
                </div>

              </div>

              <!-- Share block -->
              <div class="share-block">
                <div class="share-block__title">Share this listing</div>
                <div class="share-btns">
                  <button class="share-btn share-btn--fb" onclick="shareToFacebook()">
                    📘 Facebook
                  </button>
                  <button class="share-btn share-btn--copy" id="copyLinkBtn"
                          onclick="copyLink()">
                    🔗 Copy link
                  </button>
                </div>
              </div>

            </aside>

          </div><!-- end property-layout -->
        </div><!-- end container -->
      `;

  // Attach form submit handler after render
  attachFormHandler(p);
}

/* ═══════════════════════════════════════
       FORM HANDLER
    ═══════════════════════════════════════ */
function attachFormHandler(p) {
  const form = $("inquiryForm");
  const success = $("formSuccess");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("inquirySubmit");
    btn.textContent = "Sending…";
    btn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        form.style.display = "none";
        success.classList.add("visible");
      } else {
        btn.textContent = "Send inquiry";
        btn.disabled = false;
        alert("Something went wrong. Please call or message us directly.");
      }
    } catch (err) {
      btn.textContent = "Send inquiry";
      btn.disabled = false;
      alert("Could not send. Please call or message us directly.");
    }
  });
}

/* ═══════════════════════════════════════
       GALLERY HELPERS
    ═══════════════════════════════════════ */
function switchPhoto(index) {
  lightboxIndex = index;
  $("mainPhoto").src = lightboxImages[index];

  // Update active thumb
  document.querySelectorAll(".gallery__thumb").forEach((t, i) => {
    t.classList.toggle("active", i === index);
  });
}

function openLightbox(index) {
  lightboxIndex = index;
  updateLightbox();
  $("lightbox").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  $("lightbox").classList.remove("open");
  document.body.style.overflow = "";
}

function updateLightbox() {
  $("lightboxImg").src = lightboxImages[lightboxIndex];
  $("lightboxCounter").textContent =
    `${lightboxIndex + 1} / ${lightboxImages.length}`;
}

function lightboxNext() {
  lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
  updateLightbox();
}

function lightboxPrev() {
  lightboxIndex =
    (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
  updateLightbox();
}

// Lightbox keyboard & click
$("lightboxClose").addEventListener("click", closeLightbox);
$("lightboxNext").addEventListener("click", lightboxNext);
$("lightboxPrev").addEventListener("click", lightboxPrev);
$("lightbox").addEventListener("click", (e) => {
  if (e.target === $("lightbox")) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!$("lightbox").classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") lightboxNext();
  if (e.key === "ArrowLeft") lightboxPrev();
});

/* ═══════════════════════════════════════
       READ MORE TOGGLE
    ═══════════════════════════════════════ */
function toggleReadMore() {
  const text = $("descText");
  const btn = $("readMoreBtn");
  const collapsed = text.style.maxHeight !== "none";

  text.style.maxHeight = collapsed ? "none" : "5.6em";
  btn.textContent = collapsed ? "Read less ↑" : "Read more ↓";
}

/* ═══════════════════════════════════════
       SHARE HELPERS
    ═══════════════════════════════════════ */
function shareToFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    const btn = $("copyLinkBtn");
    btn.textContent = "✓ Copied!";
    setTimeout(() => {
      btn.textContent = "🔗 Copy link";
    }, 2000);
  } catch {
    prompt("Copy this link:", window.location.href);
  }
}

/* ═══════════════════════════════════════
       HTML BUILDERS
    ═══════════════════════════════════════ */
function badgeHTML(status) {
  const map = {
    "for-sale": ["badge--for-sale", "For Sale"],
    "for-rent": ["badge--for-rent", "For Rent"],
    sold: ["badge--sold", "Sold"],
  };
  const [cls, label] = map[status] || map["for-sale"];
  return `<span class="badge ${cls}">${label}</span>`;
}

function specsHTML(d) {
  const items = [
    {
      icon: "🛏",
      value: d.bedrooms > 0 ? d.bedrooms : "Studio",
      label: "Bedrooms",
    },
    { icon: "🚿", value: d.bathrooms, label: "Bathrooms" },
    {
      icon: "📐",
      value: d.floorArea ? `${d.floorArea} sqm` : "—",
      label: "Floor area",
    },
    {
      icon: "🌿",
      value: d.lotArea ? `${d.lotArea} sqm` : "—",
      label: "Lot area",
    },
    {
      icon: "🚗",
      value: d.parking
        ? `${d.parking} slot${d.parking > 1 ? "s" : ""}`
        : "None",
      label: "Parking",
    },
    {
      icon: "🛋",
      value: capitalize(d.furnished || "unfurnished"),
      label: "Furnished",
    },
  ];

  return items
    .map(
      (s) => `
        <div class="spec-item">
          <span class="spec-item__icon">${s.icon}</span>
          <span class="spec-item__value">${s.value}</span>
          <span class="spec-item__label">${s.label}</span>
        </div>
      `,
    )
    .join("");
}

function detailRowsHTML(identity, details, location) {
  const rows = [
    ["Property type", capitalize(identity.type)],
    ["Status", identity.status === "for-sale" ? "For Sale" : "For Rent"],
    ["City", location.city],
    ["Province", location.province],
    ["Year built", details.yearBuilt || "—"],
    ["Floors", details.floors || "—"],
    ["Carport", details.carport ? "Yes" : "No"],
  ];

  return rows
    .map(
      ([label, val]) => `
        <div style="padding:8px 0;border-bottom:1px solid var(--color-border);">
          <span style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:.06em;
                       color:var(--color-text-muted);font-weight:500;">${label}</span>
          <div style="font-size:var(--text-sm);font-weight:600;color:var(--color-text-primary);
                      margin-top:2px;">${val}</div>
        </div>
      `,
    )
    .join("");
}

function amenityLabel(key) {
  const labels = {
    "gated-community": "Gated community",
    "24hr-security": "24/7 Security",
    "near-school": "Near school",
    "near-market": "Near market",
    pool: "Swimming pool",
    gym: "Gym",
    elevator: "Elevator",
    cctv: "CCTV",
  };
  return labels[key] || key.replace(/-/g, " ");
}

function amenityIcon(key) {
  const icons = {
    "gated-community": "🔒",
    "24hr-security": "🛡️",
    "near-school": "🏫",
    "near-market": "🛒",
    pool: "🏊",
    gym: "💪",
    elevator: "🛗",
    cctv: "📷",
  };
  return icons[key] || "✓";
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
}

/* ═══════════════════════
      
    </script>════════════════
       ERROR STATE
    ═══════════════════════════════════════ */
function showError(title, sub) {
  $("pageContent").innerHTML = `
        <div class="container">
          <div class="page-error">
            <div class="page-error__icon">🏚️</div>
            <h1 style="font-family:var(--font-heading);color:var(--color-blue);">${title}</h1>
            <p class="text-muted">${sub}</p>
            <a href="/pages/listings.html" class="btn btn--primary">
              ← Back to listings
            </a>
          </div>
        </div>
      `;
  $("breadcrumbTitle").textContent = "Not found";
}

// Run
init();
