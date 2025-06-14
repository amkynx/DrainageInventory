// ==========================================
// DRAINTRACK PUBLIC MAP SYSTEM
// ==========================================

// Global variables
let map;
let drainageData = [];
let allDrainageData = [];
let currentPointId = null;
let pickLocationMode = false;
let recentReports = [];

// Enhanced Search Variables
let searchDropdownVisible = false;
let selectedDrainagePoint = null;

// Enhanced Image Gallery Variables
let currentImageIndex = 0;
let currentPointImages = [];

// Layer groups
let drainagePointsLayer, floodProneAreasLayer, drainageLinesLayer;
let osmTileLayer, satelliteTileLayer;

// Filter state
let currentFilters = {
  type: "all",
  status: "all",
  depth: 10,
  search: "",
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  initializePublicMap();
});

async function initializePublicMap() {
  try {
    showLoading(true);

    // Initialize map components
    initializeMap();
    initializeControlPanel();
    setupEventListeners();
    injectEnhancedSearchCSS();
    injectImageGalleryCSS();

    // Load data
    await Promise.all([
      fetchDrainageData(),
      fetchFloodProneAreas(),
      fetchDrainageLines(),
    ]);

    showLoading(false);
    showNotification("Drainage information loaded successfully", "success");

    // Initialize search dropdown with all data after loading
    if (allDrainageData.length > 0) {
      populateSearchDropdown(allDrainageData);
      updateQuickStats();
    }
  } catch (error) {
    console.error("Error initializing public map:", error);
    showLoading(false);
    showNotification("Error loading map data", "danger");
  }
}

// ==========================================
// MAP INITIALIZATION
// ==========================================

function initializeMap() {
  map = L.map("map", {
    zoomControl: false,
    attributionControl: false,
  }).setView([2.05788, 102.57471], 13);

  // Initialize base layers
  osmTileLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }
  ).addTo(map);

  satelliteTileLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19 }
  );

  // Initialize overlay layers
  drainagePointsLayer = L.markerClusterGroup({
    chunkedLoading: true,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
  }).addTo(map);

  floodProneAreasLayer = L.layerGroup();
  drainageLinesLayer = L.layerGroup();

  // Setup map event handlers
  map.on("click", handleMapClick);
  map.on("zoomend", updateZoomLevel);

  console.log("Map initialized successfully");
}

function handleMapClick(e) {
  if (pickLocationMode) {
    handleLocationPick(e);
  }
}

async function uploadFloodImages(files) {
  const uploadedUrls = [];
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  // Validate files
  for (let file of files) {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type: ${file.name}. Only JPG and PNG files are allowed.`
      );
    }
    if (file.size > maxFileSize) {
      throw new Error(`File too large: ${file.name}. Maximum size is 5MB.`);
    }
  }

  // Upload each file
  for (let file of files) {
    try {
      const formData = new FormData();
      formData.append("image", file);

      // Send to upload-image.php
      const response = await fetch("../api/upload-image.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        uploadedUrls.push(`/${result.url}`);
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
    }
  }

  return uploadedUrls;
}

function handleLocationPick(e) {
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);

  document.getElementById("map").style.cursor = "";
  pickLocationMode = false;

  const locationInput = document.getElementById("flood-location");
  if (locationInput) {
    locationInput.value = `${lat}, ${lng}`;
    locationInput.setAttribute("data-lat", lat);
    locationInput.setAttribute("data-lng", lng);
  }

  showModal("floodReportModal");
  showNotification(`Location selected: ${lat}, ${lng}`, "success");
}

function updateZoomLevel() {
  const zoom = map.getZoom();
  if (zoom > 15) {
    drainagePointsLayer.options.disableClusteringAtZoom = 16;
  }
}

// ==========================================
// DATA LOADING FUNCTIONS
// ==========================================

async function fetchDrainageData() {
  try {
    const response = await fetch("../api/drainage-points.php");
    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid data format received");
    }

    allDrainageData = data;
    drainageData = [...data];
    renderDrainagePoints(drainageData);
    updateFilterCounts();
  } catch (error) {
    console.error("Error fetching drainage data:", error);
    showNotification(
      "Could not load drainage data. Using sample data.",
      "warning"
    );

    // Use fallback sample data
    allDrainageData = getSampleDrainageData();
    drainageData = [...allDrainageData];
    renderDrainagePoints(drainageData);
  }
}

async function fetchFloodProneAreas() {
  try {
    const response = await fetch("../api/flood-prone-areas.php");
    if (!response.ok) throw new Error("API not available");

    const data = await response.json();
    renderFloodProneAreas(data);
  } catch (error) {
    console.error("Error fetching flood-prone areas:", error);
    renderFloodProneAreas(getSampleFloodProneAreas());
  }
}

async function fetchDrainageLines() {
  try {
    const response = await fetch("../api/drainage-lines.php");
    if (!response.ok) throw new Error("Failed to fetch drainage lines");

    const geojsonData = await response.json();
    const lineLayer = L.geoJSON(geojsonData, {
      style: {
        color: "#007bff",
        weight: 3,
        opacity: 0.8,
      },
    });

    drainageLinesLayer.addLayer(lineLayer);
  } catch (error) {
    console.error("Error fetching drainage lines:", error);
  }
}

// ==========================================
// DATA RENDERING FUNCTIONS
// ==========================================

function renderDrainagePoints(data) {
  drainagePointsLayer.clearLayers();

  data.forEach((point) => {
    const marker = L.marker(point.coordinates, {
      icon: createPublicMarkerIcon(point.status),
      title: point.name,
    });

    const popupContent = createPublicPopupContent(point);
    marker.bindPopup(popupContent, {
      maxWidth: 320,
      className: "custom-popup public-popup",
    });

    marker.on("popupopen", () => {
      setTimeout(() => setupPublicPopupHandlers(point.id), 100);
    });

    drainagePointsLayer.addLayer(marker);
  });
}

function renderFloodProneAreas(data) {
  floodProneAreasLayer.clearLayers();

  data.forEach((area) => {
    const polygon = L.polygon(area.coordinates, {
      color: "#17a2b8",
      fillColor: "#17a2b8",
      fillOpacity: 0.3,
      weight: 2,
    }).addTo(floodProneAreasLayer);

    const popupContent = `
      <div class="popup-content">
        <h5><i class="fas fa-water me-2"></i>${area.name}</h5>
        <div class="property-row">
          <div class="property-label">Risk Level:</div>
          <div><span class="badge bg-warning">${area.risk_level}</span></div>
        </div>
        <div class="property-row">
          <div class="property-label">Last Flood:</div>
          <div>${area.last_flood || "No record"}</div>
        </div>
        <div class="text-center mt-3">
          <button class="btn btn-sm btn-danger" onclick="reportFloodingInArea('${
            area.name
          }')">
            <i class="fas fa-exclamation-triangle me-1"></i>Report Flooding Here
          </button>
        </div>
      </div>
    `;

    polygon.bindPopup(popupContent);
  });
}

function createPublicMarkerIcon(status) {
  const colors = {
    Good: "#28a745",
    "Needs Maintenance": "#ffc107",
    Critical: "#dc3545",
  };

  const color = colors[status] || "#6c757d";

  return L.divIcon({
    className: "custom-div-icon public-marker",
    html: `
      <div style="
        background: ${color}; 
        width: 16px; 
        height: 16px; 
        border-radius: 50%; 
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function createPublicPopupContent(point) {
  const statusClass = getStatusBadgeClass(point.status);
  let imagesHtml = "";

  // Parse and handle images
  let images = [];
  if (point.images) {
    try {
      // Handle string URLs separated by spaces
      if (typeof point.images === "string") {
        if (point.images.startsWith("http") || point.images.startsWith("/")) {
          // Single URL or multiple URLs separated by spaces
          images = point.images.split(" ").filter((url) => url.trim());
        } else {
          // Try parsing as JSON
          try {
            const parsed = JSON.parse(point.images);
            images = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            // If JSON parsing fails, treat as single URL
            images = [point.images];
          }
        }
      } else if (Array.isArray(point.images)) {
        // Already an array
        images = point.images;
      }

      // Clean up URLs and filter out empty ones
      images = images
        .map((url) => url.trim())
        .filter((url) => url && url.length > 0)
        .map((url) => {
          // Ensure URL starts with proper path
          if (!url.startsWith("http") && !url.startsWith("/")) {
            return `/DrainageInventory/${url}`;
          }
          return url;
        });
    } catch (e) {
      console.error("Error parsing images for point", point.id, e);
      images = [];
    }
  }

  // Create image carousel if there are images
  if (images && images.length > 0) {
    imagesHtml = `
        <div class="popup-image-carousel mb-3">
          <div class="carousel slide" id="carousel-${
            point.id
          }" data-bs-ride="carousel">
            <div class="carousel-inner">
              ${images
                .map(
                  (img, index) => `
                <div class="carousel-item ${
                  index === 0 ? "active" : ""
                }" style="height: 200px;">
                  <div class="portrait-image-container">
                    <img src="${img}" 
                         class="d-block w-100" 
                         style="object-fit: contain; height: 100%; max-height: 200px;"
                         alt="Drainage point image ${index + 1}"
                         onerror="this.onerror=null; this.src='/DrainageInventory/images/no-image.png';">
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
            ${
              images.length > 1
                ? `
              <button class="carousel-control-prev" type="button" data-bs-target="#carousel-${point.id}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#carousel-${point.id}" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
              </button>
            `
                : ""
            }
          </div>
        </div>
      `;
  }

  // Rest of your popup content...
  return `
      <div class="popup-content">
        ${imagesHtml}
        <h5><i class="fas fa-map-pin me-2"></i>${point.name}</h5>
        <div class="mb-2">
          <span class="badge ${statusClass}">${point.status}</span>
        </div>
        <div class="property-row">
          <div class="property-label">Type:</div>
          <div>${point.type}</div>
        </div>
        <div class="property-row">
          <div class="property-label">Depth:</div>
          <div>${point.depth}m</div>
        </div>
        <div class="property-row">
          <div class="property-label">Description:</div>
          <div>${point.description || "No description available"}</div>
        </div>
        <div class="text-center mt-3">
          <button class="btn btn-sm btn-primary view-details-btn" data-id="${
            point.id
          }">
            <i class="fas fa-eye me-1"></i>View Details
          </button>
        </div>
      </div>
    `;
}
function setupPublicPopupHandlers(pointId) {
  const detailsBtn = document.querySelector(".view-details-btn");
  if (detailsBtn) {
    detailsBtn.addEventListener("click", () => showPointDetails(pointId));
  }
}

// ==========================================
// ENHANCED SEARCH FUNCTIONALITY
// ==========================================

function setupEnhancedSearch() {
  const searchInput = document.getElementById("search-input");
  const searchDropdown = document.getElementById("search-dropdown");
  const clearSearchBtn = document.getElementById("clear-search-btn");

  if (!searchInput || !searchDropdown || !clearSearchBtn) {
    console.warn("Search elements not found");
    return;
  }

  // Show dropdown when input is focused
  searchInput.addEventListener("focus", function () {
    if (this.value.trim() === "") {
      populateSearchDropdown(allDrainageData);
    }
    showSearchDropdown();
  });

  // Handle typing in search input
  let searchTimeout;
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);

    const searchTerm = this.value.trim();

    if (searchTerm === "") {
      populateSearchDropdown(allDrainageData);
      clearSearchBtn.classList.remove("show");
      currentFilters.search = "";
      applyFilters();
    } else {
      const filteredData = filterDrainagePoints(searchTerm);
      populateSearchDropdown(filteredData);
      clearSearchBtn.classList.add("show");

      searchTimeout = setTimeout(() => {
        currentFilters.search = searchTerm;
        applyFilters();
      }, 300);
    }

    showSearchDropdown();
  });

  // Clear search functionality
  clearSearchBtn.addEventListener("click", function () {
    searchInput.value = "";
    selectedDrainagePoint = null;
    populateSearchDropdown(allDrainageData);
    clearSearchBtn.classList.remove("show");
    currentFilters.search = "";
    applyFilters();
    searchInput.focus();
    showNotification("Search cleared", "info");
  });

  // Hide dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      hideSearchDropdown();
    }
  });

  // Handle keyboard navigation
  searchInput.addEventListener("keydown", function (e) {
    const dropdownItems = searchDropdown.querySelectorAll(
      ".search-dropdown-item"
    );
    const currentActive = searchDropdown.querySelector(
      ".search-dropdown-item.active"
    );
    let activeIndex = -1;

    if (currentActive) {
      activeIndex = Array.from(dropdownItems).indexOf(currentActive);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, dropdownItems.length - 1);
      setActiveDropdownItem(dropdownItems, activeIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      setActiveDropdownItem(dropdownItems, activeIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentActive) {
        const pointId = currentActive.getAttribute("data-point-id");
        selectDrainagePoint(pointId);
      }
    } else if (e.key === "Escape") {
      hideSearchDropdown();
      searchInput.blur();
    }
  });
}

function filterDrainagePoints(searchTerm) {
  const term = searchTerm.toLowerCase();
  return allDrainageData.filter(
    (point) =>
      point.name.toLowerCase().includes(term) ||
      point.type.toLowerCase().includes(term) ||
      point.status.toLowerCase().includes(term) ||
      (point.description && point.description.toLowerCase().includes(term)) ||
      point.id.toString().includes(term)
  );
}

function populateSearchDropdown(data) {
  const dropdown = document.getElementById("search-dropdown");

  if (!dropdown) return;

  if (data.length === 0) {
    dropdown.innerHTML =
      '<div class="search-dropdown-empty"><i class="fas fa-search me-2"></i>No drainage points found</div>';
    return;
  }

  let dropdownHTML = "";
  data.forEach((point) => {
    const statusBadgeClass = getStatusBadgeClass(point.status);
    const typeIcon = getTypeIcon(point.type);

    dropdownHTML += `
      <div class="search-dropdown-item" data-point-id="${point.id}" title="Click to locate on map">
        <div class="dropdown-item-main">
          <div class="dropdown-item-name">
            <i class="${typeIcon} me-2"></i>${point.name}
          </div>
          <div class="dropdown-item-details">
            ${point.type} • ${point.depth}m depth • ID: ${point.id}
          </div>
        </div>
        <div class="dropdown-item-status">
          <span class="badge ${statusBadgeClass}">${point.status}</span>
        </div>
      </div>
    `;
  });

  dropdown.innerHTML = dropdownHTML;

  dropdown.querySelectorAll(".search-dropdown-item").forEach((item) => {
    item.addEventListener("click", function () {
      const pointId = this.getAttribute("data-point-id");
      selectDrainagePoint(pointId);
    });

    item.addEventListener("mouseenter", function () {
      removeActiveFromDropdownItems();
      this.classList.add("active");
    });
  });
}

function selectDrainagePoint(pointId) {
  const point = allDrainageData.find((p) => p.id == pointId);
  if (!point) {
    showNotification("Drainage point not found", "danger");
    return;
  }

  selectedDrainagePoint = point;

  const searchInput = document.getElementById("search-input");
  searchInput.value = point.name;

  map.closePopup();

  map.flyTo(point.coordinates, 17, {
    duration: 1.5,
    easeLinearity: 0.5,
  });

  setTimeout(() => {
    drainagePointsLayer.eachLayer((layer) => {
      if (
        layer.getLatLng &&
        Math.abs(layer.getLatLng().lat - point.coordinates[0]) < 0.0001 &&
        Math.abs(layer.getLatLng().lng - point.coordinates[1]) < 0.0001
      ) {
        layer.openPopup();

        const originalIcon = layer.options.icon;
        const highlightIcon = createHighlightMarkerIcon(point.status);

        layer.setIcon(highlightIcon);

        setTimeout(() => {
          layer.setIcon(originalIcon);
        }, 3000);
      }
    });
  }, 1000);

  hideSearchDropdown();
  showNotification(`Located: ${point.name}`, "success");
  document.getElementById("clear-search-btn").classList.add("show");
}

function createHighlightMarkerIcon(status) {
  const colors = {
    Good: "#28a745",
    "Needs Maintenance": "#ffc107",
    Critical: "#dc3545",
  };

  const color = colors[status] || "#6c757d";

  return L.divIcon({
    className: "custom-div-icon highlight-marker",
    html: `
      <div style="
        background: ${color}; 
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        border: 4px solid #ffffff;
        box-shadow: 0 0 0 3px ${color}, 0 4px 12px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// ==========================================
// ENHANCED IMAGE GALLERY SYSTEM
// ==========================================

function populateImageGalleryEnhanced(point) {
  const imageGallery = document.getElementById("point-image-gallery");
  if (!imageGallery) return;

  let images = [];

  // Parse images from different formats
  if (point.images) {
    try {
      if (
        typeof point.images === "string" &&
        (point.images.startsWith("[") || point.images.startsWith('"'))
      ) {
        images = JSON.parse(point.images);
        if (typeof images === "string") {
          images = JSON.parse(images);
        }
        if (!Array.isArray(images)) {
          images = [images];
        }
      } else if (Array.isArray(point.images)) {
        images = point.images;
      } else if (typeof point.images === "string") {
        images = point.images.split(" ").filter((url) => url.trim() !== "");
      }
    } catch (e) {
      console.error("Error parsing images:", e);
      if (typeof point.images === "string") {
        images = point.images.split(" ").filter((url) => url.trim() !== "");
      }
    }
  }

  // Clean and filter valid images
  images = images
    .map((url) => {
      let cleanUrl = url.trim();
      if (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) {
        cleanUrl = cleanUrl.slice(1, -1);
      }
      return cleanUrl;
    })
    .filter((url) => url && url.length > 0);

  currentPointImages = images;
  currentImageIndex = 0;

  if (images.length > 0) {
    imageGallery.innerHTML = createPublicImageGalleryHTML(images, point);
    setupImageGalleryEvents();
  } else {
    imageGallery.innerHTML = `
      <div class="no-images-placeholder">
        <i class="fas fa-images"></i>
        <h6>No images available</h6>
        <p class="mb-0">No photos have been uploaded for this drainage point</p>
      </div>
    `;
  }
}

function createPublicImageGalleryHTML(images, point) {
  const totalImages = images.length;

  return `
    <div class="image-gallery-container">
      <div class="image-gallery-header">
        <h6 class="mb-0"><i class="fas fa-images me-2"></i>Photo Gallery</h6>
        <div class="d-flex align-items-center gap-3">
          <span class="image-counter">${
            currentImageIndex + 1
          } of ${totalImages}</span>
          <div class="gallery-controls">
            <button class="gallery-btn" onclick="downloadCurrentImage()" title="Download Image">
              <i class="fas fa-download"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div class="main-image-container">
        <img src="${images[currentImageIndex]}" 
             alt="Drainage point image ${currentImageIndex + 1}" 
             class="main-image"
             onclick="openFullscreenImage()"
             onerror="handleImageError(this)">
        
        ${
          totalImages > 1
            ? `
          <button class="image-navigation nav-prev" onclick="previousImage()" title="Previous Image">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="image-navigation nav-next" onclick="nextImage()" title="Next Image">
            <i class="fas fa-chevron-right"></i>
          </button>
        `
            : ""
        }
        
        <div class="image-overlay">
          <div class="image-filename">Image ${currentImageIndex + 1}</div>
          <div class="image-date">Point: ${point.name} (${point.id})</div>
        </div>
      </div>
      
      ${
        totalImages > 1
          ? `
        <div class="thumbnail-strip">
          ${images
            .map(
              (img, index) => `
            <div class="thumbnail-item ${
              index === currentImageIndex ? "active" : ""
            }" 
                 onclick="selectImage(${index})">
              <img src="${img}" alt="Thumbnail ${
                index + 1
              }" class="thumbnail-image"
                   onerror="handleThumbnailError(this)">
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }
    </div>
  `;
}

// Image gallery navigation functions (same as admin/operator maps)
function setupImageGalleryEvents() {
  document.removeEventListener("keydown", handleGalleryKeyboard);
  document.addEventListener("keydown", handleGalleryKeyboard);
}

function handleGalleryKeyboard(e) {
  if (currentPointImages.length <= 1) return;
  const modalElement = document.getElementById("pointDetailsModal");
  const isModalOpen = modalElement && modalElement.classList.contains("show");
  if (!isModalOpen) return;

  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      previousImage();
      break;
    case "ArrowRight":
      e.preventDefault();
      nextImage();
      break;
    case "Escape":
      closeFullscreenModal();
      break;
  }
}

function selectImage(index) {
  if (index >= 0 && index < currentPointImages.length) {
    currentImageIndex = index;
    updateMainImage();
    updateThumbnailSelection();
    updateImageCounter();
  }
}

function previousImage() {
  if (currentPointImages.length <= 1) return;
  currentImageIndex =
    (currentImageIndex - 1 + currentPointImages.length) %
    currentPointImages.length;
  updateMainImage();
  updateThumbnailSelection();
  updateImageCounter();
}

function nextImage() {
  if (currentPointImages.length <= 1) return;
  currentImageIndex = (currentImageIndex + 1) % currentPointImages.length;
  updateMainImage();
  updateThumbnailSelection();
  updateImageCounter();
}

function updateMainImage() {
  const mainImage = document.querySelector(".main-image");
  if (mainImage && currentPointImages[currentImageIndex]) {
    mainImage.src = currentPointImages[currentImageIndex];
    mainImage.alt = `Drainage point image ${currentImageIndex + 1}`;
  }
}

function updateThumbnailSelection() {
  document.querySelectorAll(".thumbnail-item").forEach((thumb, index) => {
    thumb.classList.toggle("active", index === currentImageIndex);
  });
}

function updateImageCounter() {
  const counter = document.querySelector(".image-counter");
  if (counter) {
    counter.textContent = `${currentImageIndex + 1} of ${
      currentPointImages.length
    }`;
  }
}

function downloadCurrentImage() {
  if (currentPointImages[currentImageIndex]) {
    const link = document.createElement("a");
    link.href = currentPointImages[currentImageIndex];
    link.download = `drainage-point-image-${currentImageIndex + 1}.jpg`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Image download started", "info");
  }
}

function openFullscreenImage() {
  if (!currentPointImages[currentImageIndex]) return;
  createFullscreenModal();
}

function createFullscreenModal() {
  const existingModal = document.querySelector(".image-fullscreen-modal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.className = "image-fullscreen-modal";
  modal.innerHTML = `
    <button class="fullscreen-close" onclick="closeFullscreenModal()">
      <i class="fas fa-times"></i>
    </button>
    
    ${
      currentPointImages.length > 1
        ? `
      <button class="fullscreen-nav fullscreen-prev" onclick="fullscreenPrevious()">
        <i class="fas fa-chevron-left"></i>
      </button>
      <button class="fullscreen-nav fullscreen-next" onclick="fullscreenNext()">
        <i class="fas fa-chevron-right"></i>
      </button>
    `
        : ""
    }
    
    <img src="${currentPointImages[currentImageIndex]}" 
         alt="Fullscreen image" 
         class="fullscreen-image">
    
    <div class="fullscreen-info">
      <div>Image ${currentImageIndex + 1} of ${currentPointImages.length}</div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => {
    modal.classList.add("show");
  }, 10);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeFullscreenModal();
    }
  });
}

function closeFullscreenModal() {
  const modal = document.querySelector(".image-fullscreen-modal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

function fullscreenPrevious() {
  if (currentPointImages.length <= 1) return;
  currentImageIndex =
    (currentImageIndex - 1 + currentPointImages.length) %
    currentPointImages.length;
  updateFullscreenImage();
}

function fullscreenNext() {
  if (currentPointImages.length <= 1) return;
  currentImageIndex = (currentImageIndex + 1) % currentPointImages.length;
  updateFullscreenImage();
}

function updateFullscreenImage() {
  const fullscreenImage = document.querySelector(".fullscreen-image");
  const fullscreenInfo = document.querySelector(".fullscreen-info div");

  if (fullscreenImage) {
    fullscreenImage.src = currentPointImages[currentImageIndex];
  }

  if (fullscreenInfo) {
    fullscreenInfo.textContent = `Image ${currentImageIndex + 1} of ${
      currentPointImages.length
    }`;
  }

  updateMainImage();
  updateThumbnailSelection();
  updateImageCounter();
}

function handleImageError(img) {
  img.style.display = "none";
  const container = img.parentElement;
  if (container) {
    container.innerHTML = `
      <div class="d-flex align-items-center justify-content-center h-100 text-muted">
        <div class="text-center">
          <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
          <p>Image not found</p>
        </div>
      </div>
    `;
  }
}

function handleThumbnailError(img) {
  img.style.display = "none";
  const container = img.parentElement;
  if (container) {
    container.innerHTML = `
      <div class="d-flex align-items-center justify-content-center h-100 text-muted">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
    `;
  }
}

// ==========================================
// POINT DETAILS MODAL
// ==========================================

function showPointDetails(pointId) {
  currentPointId = pointId;
  const point = allDrainageData.find((p) => p.id == pointId);

  if (!point) {
    showNotification("Point not found", "danger");
    return;
  }

  populatePointDetails(point);
  populateMaintenanceHistory(point);
  populateImageGalleryEnhanced(point);

  showModal("pointDetailsModal");
}

function populatePointDetails(point) {
  const detailsTable = document.getElementById("point-details-table");
  if (!detailsTable) return;

  const statusBadge = `<span class="badge ${getStatusBadgeClass(
    point.status
  )}">${point.status}</span>`;

  detailsTable.innerHTML = `
    <tr><th style="width: 40%;">ID</th><td>${point.id}</td></tr>
    <tr><th>Name</th><td>${point.name}</td></tr>
    <tr><th>Type</th><td>${point.type}</td></tr>
    <tr><th>Status</th><td>${statusBadge}</td></tr>
    <tr><th>Depth</th><td>${point.depth}m</td></tr>
    <tr><th>Invert Level</th><td>${point.invert_level || "N/A"}</td></tr>
    <tr><th>Reduced Level</th><td>${point.reduced_level || "N/A"}</td></tr>
    <tr><th>Coordinates</th><td>${point.coordinates[0]}, ${
    point.coordinates[1]
  }</td></tr>
    <tr><th>Description</th><td>${
      point.description || "No description available"
    }</td></tr>
    <tr><th>Last Updated</th><td>${point.last_updated || "N/A"}</td></tr>
  `;
}

async function populateMaintenanceHistory(point) {
  const maintenanceTable = document.getElementById("maintenance-history-table");
  if (!maintenanceTable) return;

  try {
    const response = await fetch(
      `../api/maintenance-requests.php?drainage_point_id=${point.id}&public=1`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && Array.isArray(data) && data.length > 0) {
      let tableContent = `
        <thead class="table-primary">
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Status</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
      `;

      // Show only completed maintenance (for public)
      const publicData = data
        .filter((record) => record.status === "Completed")
        .slice(0, 5);

      publicData.forEach((record) => {
        const statusClass = getMaintenanceStatusBadgeClass(record.status);
        const priorityClass = getPriorityBadgeClass(record.priority);
        tableContent += `
          <tr>
            <td>${formatMaintenanceDate(
              record.scheduled_date || record.created_at
            )}</td>
            <td>${record.request_type}</td>
            <td><span class="badge ${statusClass}">${record.status}</span></td>
            <td><span class="badge ${priorityClass}">${
          record.priority
        }</span></td>
          </tr>
        `;
      });

      tableContent += "</tbody>";
      maintenanceTable.innerHTML = tableContent;
    } else {
      maintenanceTable.innerHTML = `
        <tbody>
          <tr>
            <td colspan="4" class="text-center text-muted py-4">
              <i class="fas fa-history fa-2x mb-2 d-block"></i>
              <p class="mb-0">No maintenance history available</p>
            </td>
          </tr>
        </tbody>
      `;
    }
  } catch (error) {
    console.error("Error fetching maintenance history:", error);
    maintenanceTable.innerHTML = `
      <tbody>
        <tr>
          <td colspan="4" class="text-center text-muted py-4">
            <i class="fas fa-info-circle fa-2x mb-2 d-block"></i>
            <p class="mb-0">Maintenance history not available</p>
          </td>
        </tr>
      </tbody>
    `;
  }
}

// ==========================================
// FLOOD REPORTING FUNCTIONALITY
// ==========================================

async function submitFloodReport() {
  const locationInput = document.getElementById("flood-location");
  const severitySelect = document.getElementById("flood-severity");
  const depthInput = document.getElementById("flood-depth");
  const descriptionTextarea = document.getElementById("flood-description");
  const nameInput = document.getElementById("reporter-name");
  const contactInput = document.getElementById("reporter-contact");
  const imagesInput = document.getElementById("flood-images");

  // Validation
  if (!locationInput.value.trim()) {
    showNotification("Please enter a flood location", "warning");
    locationInput.focus();
    return;
  }

  if (!severitySelect.value) {
    showNotification("Please select flood severity", "warning");
    severitySelect.focus();
    return;
  }

  if (!descriptionTextarea.value.trim()) {
    showNotification("Please provide a description", "warning");
    descriptionTextarea.focus();
    return;
  }

  showLoading(true);

  try {
    const floodData = {
      location: locationInput.value.trim(),
      severity: severitySelect.value,
      water_depth: depthInput.value ? parseInt(depthInput.value) : null,
      description: descriptionTextarea.value.trim(),
      reporter_name: nameInput.value.trim(),
      reporter_contact: contactInput.value.trim(),
      timestamp: new Date().toISOString(),
      source: "public_web",
    };

    // Add coordinates if available
    const lat = locationInput.getAttribute("data-lat");
    const lng = locationInput.getAttribute("data-lng");
    if (lat && lng) {
      floodData.coordinates = [parseFloat(lat), parseFloat(lng)];
    }

    // Handle image upload if any
    if (imagesInput.files && imagesInput.files.length > 0) {
      try {
        const imageUrls = await uploadFloodImages(imagesInput.files);
        if (imageUrls.length > 0) {
          floodData.images = JSON.stringify(imageUrls);
        }
      } catch (imageError) {
        console.error("Error uploading images:", imageError);
        showNotification(
          "Warning: Could not upload images, but report will be submitted",
          "warning"
        );
      }
    }

    const response = await fetch("../api/flood-reports.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(floodData),
    });

    const result = await response.json();

    if (result.success) {
      showNotification(
        "Flood report submitted successfully! Authorities have been notified.",
        "success"
      );

      // Show success message in modal
      const modalBody = document.querySelector("#floodReportModal .modal-body");
      modalBody.innerHTML = `
        <div class="report-success">
          <i class="fas fa-check-circle fa-3x mb-3"></i>
          <h4>Report Submitted Successfully!</h4>
          <p>Thank you for reporting this flooding incident. The relevant authorities have been notified and will respond as appropriate.</p>
          <p><strong>Report ID:</strong> #${
            result.report_id || "FLD" + Date.now()
          }</p>
          <p class="mb-0">You can close this window now.</p>
        </div>
      `;

      // Reset form
      document.getElementById("floodReportForm").reset();

      // Add marker to map if coordinates available
      if (floodData.coordinates) {
        addFloodReportMarker(floodData);
      }

      // Close modal after delay
      setTimeout(() => {
        hideModal("floodReportModal");
      }, 5000);
    } else {
      throw new Error(result.message || "Failed to submit flood report");
    }
  } catch (error) {
    console.error("Error submitting flood report:", error);
    showNotification(
      `Error submitting flood report: ${error.message}`,
      "danger"
    );
  } finally {
    showLoading(false);
  }
}

async function uploadFloodImages(files) {
  const uploadedUrls = [];
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  for (let file of files) {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type: ${file.name}. Only JPG and PNG files are allowed.`
      );
    }
    if (file.size > maxFileSize) {
      throw new Error(`File too large: ${file.name}. Maximum size is 5MB.`);
    }
  }

  for (let file of files) {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("../api/upload-image.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        uploadedUrls.push(`/${result.url}`);
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
    }
  }

  return uploadedUrls;
}

function addFloodReportMarker(floodData) {
  const floodIcon = L.divIcon({
    className: "flood-report-marker",
    html: `
      <div style="
        background: #dc3545; 
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
      ">
        <i class="fas fa-exclamation" style="
          color: white; 
          font-size: 10px; 
          position: absolute; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%);
        "></i>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

  const marker = L.marker(floodData.coordinates, { icon: floodIcon }).addTo(
    map
  );

  marker.bindPopup(`
    <div class="popup-content">
      <h6><i class="fas fa-exclamation-triangle me-2 text-danger"></i>Flood Report</h6>
      <p><strong>Severity:</strong> ${floodData.severity}</p>
      <p><strong>Description:</strong> ${floodData.description}</p>
      <p><strong>Reported:</strong> Just now</p>
    </div>
  `);

  map.setView(floodData.coordinates, 16);

  // Remove marker after 30 seconds
  setTimeout(() => {
    map.removeLayer(marker);
  }, 30000);
}

function showFloodReportModal() {
  // Reset form
  document.getElementById("floodReportForm").reset();

  // Reset modal body in case it was showing success message
  const modalBody = document.querySelector("#floodReportModal .modal-body");
  if (modalBody.innerHTML.includes("report-success")) {
    location.reload(); // Reload to reset modal
    return;
  }

  showModal("floodReportModal");
}

function handlePickLocation() {
  pickLocationMode = true;
  map.closePopup();
  document.getElementById("map").style.cursor = "crosshair";
  showNotification("Click on the map to select the flood location", "info");
  hideModal("floodReportModal");
}

function reportPointIssue(pointId) {
  const point = allDrainageData.find((p) => p.id == pointId);
  if (point) {
    document.getElementById(
      "flood-location"
    ).value = `Near ${point.name} (${point.id})`;
    document
      .getElementById("flood-location")
      .setAttribute("data-lat", point.coordinates[0]);
    document
      .getElementById("flood-location")
      .setAttribute("data-lng", point.coordinates[1]);
    document.getElementById(
      "flood-description"
    ).value = `Issue reported near drainage point: ${point.name}`;
    showFloodReportModal();
  }
}

function reportFloodingHere(pointId) {
  const point = allDrainageData.find((p) => p.id == pointId);
  if (point) {
    document.getElementById(
      "flood-location"
    ).value = `${point.name} (${point.id})`;
    document
      .getElementById("flood-location")
      .setAttribute("data-lat", point.coordinates[0]);
    document
      .getElementById("flood-location")
      .setAttribute("data-lng", point.coordinates[1]);
    document.getElementById(
      "flood-description"
    ).value = `Flooding reported at drainage point: ${point.name}`;
    showFloodReportModal();
  }
}

function reportFloodingInArea(areaName) {
  document.getElementById("flood-location").value = `${areaName} area`;
  document.getElementById(
    "flood-description"
  ).value = `Flooding reported in ${areaName}`;
  showFloodReportModal();
}

// ==========================================
// FILTERING AND INTERFACE FUNCTIONS
// ==========================================

function applyFilters() {
  let filteredData = [...allDrainageData];

  if (currentFilters.search) {
    const searchTerm = currentFilters.search.toLowerCase();
    filteredData = filteredData.filter(
      (point) =>
        point.name.toLowerCase().includes(searchTerm) ||
        point.type.toLowerCase().includes(searchTerm) ||
        (point.description &&
          point.description.toLowerCase().includes(searchTerm))
    );
  }

  if (currentFilters.type !== "all") {
    filteredData = filteredData.filter((point) => {
      const type = point.type.toLowerCase();
      switch (currentFilters.type) {
        case "concrete":
          return type.includes("concrete");
        case "earth":
          return type.includes("earth");
        case "box-culvert":
          return type.includes("culvert");
        case "pipe":
          return type.includes("pipe");
        default:
          return true;
      }
    });
  }

  if (currentFilters.status !== "all") {
    filteredData = filteredData.filter((point) => {
      const status = point.status.toLowerCase().replace(/\s+/g, "-");
      return status === currentFilters.status;
    });
  }

  filteredData = filteredData.filter(
    (point) => parseFloat(point.depth) <= currentFilters.depth
  );

  drainageData = filteredData;
  renderDrainagePoints(drainageData);
  updateFilterCounts();

  if (filteredData.length === 0) {
    showNotification("No drainage points match the current filters", "info");
  }
}

function updateQuickStats() {
  const total = allDrainageData.length;
  const good = allDrainageData.filter((p) => p.status === "Good").length;
  const maintenance = allDrainageData.filter(
    (p) => p.status === "Needs Maintenance"
  ).length;
  const critical = allDrainageData.filter(
    (p) => p.status === "Critical"
  ).length;

  document.getElementById("totalPoints").textContent = total;
  document.getElementById("goodCondition").textContent = good;
  document.getElementById("needsMaintenance").textContent = maintenance;
  document.getElementById("criticalCondition").textContent = critical;
}

function updateFilterCounts() {
  const totalCount = allDrainageData.length;
  const filteredCount = drainageData.length;
  console.log(`Showing ${filteredCount} of ${totalCount} drainage points`);
}

function getActivityIcon(type) {
  const icons = {
    flood_report: "exclamation-triangle",
    maintenance: "tools",
    inspection: "clipboard-check",
    system: "cog",
  };
  return icons[type] || "info-circle";
}

function formatActivityDate(timestamp) {
  try {
    return new Date(timestamp).toLocaleDateString("en-MY", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return timestamp;
  }
}

// ==========================================
// CONTROL PANEL AND EVENT LISTENERS
// ==========================================

function initializeControlPanel() {
  const panel = document.getElementById("controlPanel");
  const toggleBtn = document.getElementById("panelToggle");
  const toggleIcon = document.getElementById("toggleIcon");

  if (!panel || !toggleBtn || !toggleIcon) {
    console.warn("Control panel elements not found");
    return;
  }

  const isCollapsed = localStorage.getItem("publicPanelCollapsed") === "true";
  if (isCollapsed) {
    panel.classList.add("collapsed");
    toggleIcon.className = "fas fa-chevron-right";
  }

  function togglePanel() {
    const isCurrentlyCollapsed = panel.classList.contains("collapsed");

    if (isCurrentlyCollapsed) {
      panel.classList.remove("collapsed");
      toggleIcon.className = "fas fa-chevron-left";
      localStorage.setItem("publicPanelCollapsed", "false");
    } else {
      panel.classList.add("collapsed");
      toggleIcon.className = "fas fa-chevron-right";
      localStorage.setItem("publicPanelCollapsed", "true");
    }
  }

  toggleBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    togglePanel();
  });

  // Close panel on mobile when clicking outside
  if (window.innerWidth <= 768) {
    document.addEventListener("click", function (e) {
      const isClickInsidePanel = panel.contains(e.target);
      const isClickOnToggle = toggleBtn.contains(e.target);

      if (
        !isClickInsidePanel &&
        !isClickOnToggle &&
        !panel.classList.contains("collapsed")
      ) {
        setTimeout(() => {
          panel.classList.add("collapsed");
          toggleIcon.className = "fas fa-chevron-right";
          localStorage.setItem("publicPanelCollapsed", "true");
        }, 100);
      }
    });
  }

  console.log("Control panel initialized successfully");
}

function setupEventListeners() {
  setupEnhancedSearch();

  // Filter functionality
  document.querySelectorAll(".filter-badge").forEach((badge) => {
    badge.addEventListener("click", function () {
      const filterType = this.getAttribute("data-type");
      const filterValue = this.getAttribute("data-filter");

      document.querySelectorAll(`[data-type="${filterType}"]`).forEach((b) => {
        b.classList.remove("active");
      });
      this.classList.add("active");

      currentFilters[filterType] = filterValue;
      applyFilters();
    });
  });

  // Depth range filter
  const depthRange = document.getElementById("depth-range");
  const depthValue = document.getElementById("depth-value");

  if (depthRange && depthValue) {
    depthRange.addEventListener("input", function () {
      const value = this.value;
      depthValue.textContent = `0-${value}m`;
      currentFilters.depth = parseFloat(value);
      applyFilters();
    });
  }

  // Map controls
  const controls = [
    { id: "zoom-in-btn", action: () => map.zoomIn() },
    { id: "zoom-out-btn", action: () => map.zoomOut() },
    { id: "locate-me-btn", action: handleLocateMe },
    {
      id: "full-extent-btn",
      action: () => map.setView([2.05788, 102.57471], 13),
    },
    { id: "layers-btn", action: () => showModal("layerModal") },
  ];

  controls.forEach(({ id, action }) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("click", action);
    }
  });

  // Flood report location picker
  const pickLocationBtn = document.getElementById("pick-location-btn");
  if (pickLocationBtn) {
    pickLocationBtn.addEventListener("click", handlePickLocation);
  }

  // Layer controls
  setupLayerControls();
  setupBasemapControls();

  console.log("Event listeners setup complete");
}

function handleLocateMe() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map.setView([lat, lng], 16);
        showNotification("Location found", "success");
      },
      (error) => {
        showNotification("Could not get your location", "warning");
      }
    );
  } else {
    showNotification("Geolocation is not supported", "warning");
  }
}

function setupLayerControls() {
  document.getElementById("layer-drainage").addEventListener("change", (e) => {
    if (e.target.checked) {
      map.addLayer(drainagePointsLayer);
    } else {
      map.removeLayer(drainagePointsLayer);
    }
  });

  document
    .getElementById("layer-flood-areas")
    .addEventListener("change", (e) => {
      if (e.target.checked) {
        map.addLayer(floodProneAreasLayer);
      } else {
        map.removeLayer(floodProneAreasLayer);
      }
    });

  document
    .getElementById("layer-drainage-lines")
    .addEventListener("change", (e) => {
      if (e.target.checked) {
        map.addLayer(drainageLinesLayer);
      } else {
        map.removeLayer(drainageLinesLayer);
      }
    });
}

function setupBasemapControls() {
  document
    .getElementById("basemap-street")
    .addEventListener("change", () => switchBasemap("street"));
  document
    .getElementById("basemap-satellite")
    .addEventListener("change", () => switchBasemap("satellite"));
}

function switchBasemap(type) {
  [osmTileLayer, satelliteTileLayer].forEach((layer) => {
    map.removeLayer(layer);
  });

  const basemaps = {
    street: osmTileLayer,
    satellite: satelliteTileLayer,
  };

  if (basemaps[type]) {
    map.addLayer(basemaps[type]);
  }
}

// ==========================================
// EMERGENCY AND INFO FUNCTIONS
// ==========================================

function showEmergencyInfo() {
  showModal("emergencyModal");
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function getStatusBadgeClass(status) {
  const classes = {
    Good: "bg-success",
    "Needs Maintenance": "bg-warning text-dark",
    Critical: "bg-danger",
  };
  return classes[status] || "bg-secondary";
}

function getTypeIcon(type) {
  const icons = {
    "Concrete Drain": "fas fa-square",
    "Box Culvert": "fas fa-cube",
    "Pipe Drain": "fas fa-circle",
    "Earth Drain": "fas fa-mountain",
  };

  for (const [key, icon] of Object.entries(icons)) {
    if (type.toLowerCase().includes(key.toLowerCase().split(" ")[0])) {
      return icon;
    }
  }
  return "fas fa-map-pin";
}

function getMaintenanceStatusBadgeClass(status) {
  const classes = {
    Pending: "bg-warning text-dark",
    "In Progress": "bg-info",
    Completed: "bg-success",
    Cancelled: "bg-secondary",
    "On Hold": "bg-dark",
  };
  return classes[status] || "bg-secondary";
}

function getPriorityBadgeClass(priority) {
  const classes = {
    Low: "bg-light text-dark",
    Medium: "bg-primary",
    High: "bg-warning text-dark",
    Critical: "bg-danger",
  };
  return classes[priority] || "bg-secondary";
}

function formatMaintenanceDate(dateString) {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
}

function showModal(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}

function hideModal(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
  }
}

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `alert alert-${type} alert-dismissible fade show notification`;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    z-index: 9999;
    max-width: 400px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  `;
  notification.innerHTML = `
    <i class="fas fa-${getNotificationIcon(type)} me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  document.body.appendChild(notification);
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

function getNotificationIcon(type) {
  const icons = {
    success: "check-circle",
    danger: "exclamation-triangle",
    warning: "exclamation-triangle",
    info: "info-circle",
  };
  return icons[type] || "info-circle";
}

function showLoading(show) {
  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? "flex" : "none";
  }
}

// Search utility functions
function showSearchDropdown() {
  const dropdown = document.getElementById("search-dropdown");
  if (dropdown) {
    dropdown.classList.add("show");
    searchDropdownVisible = true;
  }
}

function hideSearchDropdown() {
  const dropdown = document.getElementById("search-dropdown");
  if (dropdown) {
    dropdown.classList.remove("show");
    searchDropdownVisible = false;
    removeActiveFromDropdownItems();
  }
}

function setActiveDropdownItem(items, activeIndex) {
  removeActiveFromDropdownItems();
  if (items[activeIndex]) {
    items[activeIndex].classList.add("active");
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

function removeActiveFromDropdownItems() {
  document.querySelectorAll(".search-dropdown-item").forEach((item) => {
    item.classList.remove("active");
  });
}

// CSS injection functions
function injectEnhancedSearchCSS() {
  const additionalCSS = `
    .public-popup .popup-image-preview {
      position: relative;
      margin-bottom: 1rem;
    }
    
    .image-count-badge {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 0.7rem;
    }
    
    .search-dropdown.show {
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  const style = document.createElement("style");
  style.textContent = additionalCSS;
  document.head.appendChild(style);
}

function injectImageGalleryCSS() {
  const imageGalleryCSS = `
    /* Enhanced Image Gallery Styles for Public Map */
    .image-gallery-container {
      position: relative;
      background: #f8f9fa;
      border-radius: 15px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .image-gallery-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e9ecef;
    }

    .image-counter {
      font-size: 0.9rem;
      color: #6c757d;
      font-weight: 500;
    }

    .gallery-controls {
      display: flex;
      gap: 0.5rem;
    }

    .gallery-btn {
      padding: 0.25rem 0.5rem;
      border: none;
      border-radius: 6px;
      background: #6c757d;
      color: white;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .gallery-btn:hover {
      background: #495057;
      transform: translateY(-1px);
    }

    .main-image-container {
      position: relative;
      width: 100%;
      height: 300px;
      border-radius: 10px;
      overflow: hidden;
      background: #e9ecef;
      margin-bottom: 1rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .main-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
      transition: transform 0.3s ease;
    }

    .main-image:hover {
      transform: scale(1.02);
    }

    .image-navigation {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0,0,0,0.7);
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: 10;
    }

    .image-navigation:hover {
      background: rgba(0,0,0,0.9);
      transform: translateY(-50%) scale(1.1);
    }

    .nav-prev {
      left: 10px;
    }

    .nav-next {
      right: 10px;
    }

    .image-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.8));
      color: white;
      padding: 1rem;
      font-size: 0.9rem;
    }

    .image-filename {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .image-date {
      font-size: 0.8rem;
      opacity: 0.8;
    }

    .thumbnail-strip {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding: 0.5rem 0;
      scrollbar-width: thin;
      scrollbar-color: #6c757d #e9ecef;
    }

    .thumbnail-strip::-webkit-scrollbar {
      height: 6px;
    }

    .thumbnail-strip::-webkit-scrollbar-track {
      background: #e9ecef;
      border-radius: 3px;
    }

    .thumbnail-strip::-webkit-scrollbar-thumb {
      background: #6c757d;
      border-radius: 3px;
    }

    .thumbnail-item {
      position: relative;
      flex-shrink: 0;
      width: 80px;
      height: 60px;
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .thumbnail-item:hover {
      border-color: #007bff;
      transform: translateY(-2px);
    }

    .thumbnail-item.active {
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .thumbnail-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-images-placeholder {
      text-align: center;
      padding: 3rem 1rem;
      color: #6c757d;
    }

    .no-images-placeholder i {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    /* Fullscreen Modal */
    .image-fullscreen-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.95);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .image-fullscreen-modal.show {
      opacity: 1;
      visibility: visible;
    }

    .fullscreen-image {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 10px;
      box-shadow: 0 0 50px rgba(0,0,0,0.5);
    }

    .fullscreen-close {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255,255,255,0.2);
      color: white;
      border: none;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .fullscreen-close:hover {
      background: rgba(255,255,255,0.3);
      transform: scale(1.1);
    }

    .fullscreen-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,0.2);
      color: white;
      border: none;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .fullscreen-nav:hover {
      background: rgba(255,255,255,0.3);
      transform: translateY(-50%) scale(1.1);
    }

    .fullscreen-prev {
      left: 30px;
    }

    .fullscreen-next {
      right: 30px;
    }

    .fullscreen-info {
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 1rem 2rem;
      border-radius: 25px;
      text-align: center;
    }

    @media (max-width: 768px) {
      .main-image-container {
        height: 250px;
      }
      
      .thumbnail-item {
        width: 60px;
        height: 45px;
      }
      
      .image-navigation {
        width: 35px;
        height: 35px;
        font-size: 0.9rem;
      }
    }
  `;

  const style = document.createElement("style");
  style.textContent = imageGalleryCSS;
  document.head.appendChild(style);
}

// ==========================================
// SAMPLE DATA FOR FALLBACK
// ==========================================

function getSampleDrainageData() {
  return [
    {
      id: "MAIN01",
      name: "Main Street Drain A1",
      type: "Concrete Drain",
      status: "Good",
      depth: 2.5,
      coordinates: [2.05788, 102.57471],
      description: "Main drainage point on Main Street",
      last_updated: "2025-01-01",
      invert_level: "15.2m",
      reduced_level: "17.7m",
    },
    {
      id: "PARK02",
      name: "Park Avenue Culvert",
      type: "Box Culvert",
      status: "Needs Maintenance",
      depth: 3.2,
      coordinates: [2.06, 102.576],
      description: "Box culvert under Park Avenue",
      last_updated: "2025-01-01",
      invert_level: "14.8m",
      reduced_level: "18.0m",
    },
    {
      id: "IND03",
      name: "Industrial Zone Pipe",
      type: "Pipe Drain",
      status: "Critical",
      depth: 1.8,
      coordinates: [2.055, 102.578],
      description: "Large pipe drainage system",
      last_updated: "2025-01-01",
      invert_level: "16.1m",
      reduced_level: "17.9m",
    },
  ];
}

function getSampleFloodProneAreas() {
  return [
    {
      name: "Downtown Flood Zone",
      risk_level: "High",
      last_flood: "2024-12-15",
      coordinates: [
        [
          [2.055, 102.57],
          [2.06, 102.575],
          [2.055, 102.58],
          [2.05, 102.575],
          [2.055, 102.57],
        ],
      ],
    },
  ];
}

// Initialize the public map when the page loads
console.log("DrainTrack Public Map System loaded successfully!");
