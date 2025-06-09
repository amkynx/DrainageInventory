// ==========================================
// DRAINTRACK MAP SYSTEM - COMPLETE VERSION WITH IMAGE UPLOAD
// ==========================================

let map;
let drainageData = [];
let allDrainageData = [];
let currentPointId = null;
let pickLocationMode = false;
let floodReportLocationMode = false;
let editMode = false;
let users = [];
let currentImageIndex = 0;
let currentPointImages = [];

// Enhanced Search Variables
let searchDropdownVisible = false;
let selectedDrainagePoint = null;

// Image Upload Variables
let uploadedImages = [];
let currentlyUploadingImages = 0;

// ID Validation Variables
let idValidationTimeout;
let isIdValid = false;
let currentEditingId = null;

// Layer groups
let drainagePointsLayer, floodProneAreasLayer, maintenanceRoutesLayer;
let osmTileLayer, satelliteTileLayer, terrainTileLayer;

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

// Note: Authentication-based initialization is now handled in map.html
// The initializeMapAfterAuth() function calls the components below

// Initialize components in order
function initializeMapComponents() {
  initializeMap();
  initializeControlPanel();
  setupEventListeners();
  injectEnhancedSearchCSS();
  injectImageGalleryCSS();

  // Load data
  return Promise.all([
    fetchDrainageData(),
    fetchFloodProneAreas(),
    fetchAndRenderDrainageLines(),
    loadUsers(),
  ]);
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

  // Show dropdown when input is focused or clicked
  searchInput.addEventListener("focus", function () {
    if (this.value.trim() === "") {
      populateSearchDropdown(allDrainageData);
    }
    showSearchDropdown();
  });

  searchInput.addEventListener("click", function () {
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

  console.log("Enhanced search functionality initialized");
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

  setTimeout(() => {
    currentFilters.search = "";
    applyFilters();
  }, 2000);
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

function injectEnhancedSearchCSS() {
  const additionalCSS = `
    .search-dropdown-item.active {
      background: var(--primary-color) !important;
      color: white !important;
      transform: translateX(8px) !important;
    }

    .search-dropdown-item.active .dropdown-item-name,
    .search-dropdown-item.active .dropdown-item-details {
      color: white !important;
    }

    .search-dropdown-item.active .badge {
      background: rgba(255,255,255,0.9) !important;
      color: var(--dark-color) !important;
    }

    .highlight-marker {
      z-index: 1000 !important;
    }

    .search-container .clear-search {
      transition: all 0.3s ease;
      font-size: 0.9rem;
      padding: 0.25rem;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .search-container .clear-search:hover {
      background: rgba(220, 53, 69, 0.1);
      color: var(--danger-color) !important;
    }

    .search-dropdown {
      border: 2px solid var(--primary-color);
      border-radius: 0 0 15px 15px;
    }

    .search-dropdown-item {
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .search-dropdown-item:hover {
      background: var(--light-color);
      border-left: 4px solid var(--primary-color);
      padding-left: calc(1rem - 4px);
    }
  `;

  const style = document.createElement("style");
  style.textContent = additionalCSS;
  document.head.appendChild(style);
}

// ==========================================
// IMAGE UPLOAD FUNCTIONALITY
// ==========================================

function setupImagePreview() {
  const imageInput = document.getElementById("point-images");
  if (!imageInput) return;

  imageInput.addEventListener("change", function (e) {
    const files = e.target.files;
    let previewContainer = document.getElementById("image-preview-container");

    if (!previewContainer) {
      previewContainer = document.createElement("div");
      previewContainer.id = "image-preview-container";
      previewContainer.className = "mt-2";
      imageInput.parentNode.appendChild(previewContainer);
    }

    previewContainer.innerHTML = "";

    if (files.length > 0) {
      previewContainer.innerHTML =
        "<small class='text-muted'>Preview:</small><div class='row g-2 mt-1' id='preview-images'></div>";
      const previewImages = document.getElementById("preview-images");

      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const col = document.createElement("div");
            col.className = "col-4 col-md-3";
            col.innerHTML = `
              <img src="${e.target.result}" 
                   class="img-thumbnail w-100" 
                   style="height: 60px; object-fit: cover;"
                   title="${file.name}">
            `;
            previewImages.appendChild(col);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  });
}

async function uploadImages(files) {
  const uploadedUrls = [];
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type: ${file.name}. Only JPG and PNG files are allowed.`
      );
    }

    if (file.size > maxFileSize) {
      throw new Error(`File too large: ${file.name}. Maximum size is 5MB.`);
    }
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const url = await uploadSingleImage(file);
      if (url) {
        uploadedUrls.push(url);
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      showNotification(`Warning: Failed to upload ${file.name}`, "warning");
    }
  }

  return uploadedUrls;
}

async function uploadSingleImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch("/DrainageInventory/api/upload-image.php", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return `/DrainageInventory/${result.url}`;
    } else {
      throw new Error(result.message || "Upload failed");
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

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
    imageGallery.innerHTML = createImageGalleryHTML(images, point);
    setupImageGalleryEvents();
  } else {
    imageGallery.innerHTML = `
      <div class="no-images-placeholder">
        <i class="fas fa-images"></i>
        <h6>No images available</h6>
        <p class="mb-0">Upload images when editing this point</p>
      </div>
    `;
  }
}

function createImageGalleryHTML(images, point) {
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
            <button class="gallery-btn danger" onclick="deleteCurrentImage()" title="Delete Image">
              <i class="fas fa-trash"></i>
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
              <button class="thumbnail-delete" onclick="deleteThumbnailImage(${index}, event)" title="Delete">
                <i class="fas fa-times"></i>
              </button>
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

// ==========================================
// STEP 3: Image Gallery Event Functions
// ==========================================

function setupImageGalleryEvents() {
  // Keyboard navigation
  document.addEventListener("keydown", handleGalleryKeyboard);
}

function handleGalleryKeyboard(e) {
  if (currentPointImages.length <= 1) return;

  switch (e.key) {
    case "ArrowLeft":
      if (document.querySelector(".image-gallery-container")) {
        e.preventDefault();
        previousImage();
      }
      break;
    case "ArrowRight":
      if (document.querySelector(".image-gallery-container")) {
        e.preventDefault();
        nextImage();
      }
      break;
    case "Delete":
      if (document.querySelector(".image-gallery-container")) {
        e.preventDefault();
        deleteCurrentImage();
      }
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
// STEP 4: Image Action Functions
// ==========================================

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

async function deleteCurrentImage() {
  if (!currentPointImages[currentImageIndex]) return;

  const confirmDelete = confirm(
    `Are you sure you want to delete image ${
      currentImageIndex + 1
    }? This action cannot be undone.`
  );
  if (!confirmDelete) return;

  await deleteImageFromPoint(currentImageIndex);
}

async function deleteThumbnailImage(index, event) {
  event.stopPropagation();

  const confirmDelete = confirm(
    `Are you sure you want to delete image ${
      index + 1
    }? This action cannot be undone.`
  );
  if (!confirmDelete) return;

  await deleteImageFromPoint(index);
}

async function deleteImageFromPoint(imageIndex) {
  if (
    !currentPointId ||
    imageIndex < 0 ||
    imageIndex >= currentPointImages.length
  ) {
    showNotification("Invalid image or point", "danger");
    return;
  }

  showLoading(true);

  try {
    // Remove image from array
    const imageToDelete = currentPointImages[imageIndex];
    currentPointImages.splice(imageIndex, 1);

    // Adjust current index if necessary
    if (currentImageIndex >= currentPointImages.length) {
      currentImageIndex = Math.max(0, currentPointImages.length - 1);
    }

    // Prepare updated point data
    const point = allDrainageData.find((p) => p.id == currentPointId);
    if (!point) {
      throw new Error("Point not found");
    }

    const updateData = {
      id: point.id,
      name: point.name,
      type: point.type,
      status: point.status,
      depth: point.depth,
      invert_level: point.invert_level || "N/A",
      reduced_level: point.reduced_level || "N/A",
      coordinates: point.coordinates,
      description: point.description || "No description provided",
      images:
        currentPointImages.length > 0
          ? JSON.stringify(currentPointImages)
          : null,
      originalId: point.id,
    };

    // Update point in database
    const response = await fetch("/DrainageInventory/api/drainage-points.php", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();

    if (result.success) {
      // Update local data
      const pointIndex = allDrainageData.findIndex(
        (p) => p.id == currentPointId
      );
      if (pointIndex !== -1) {
        allDrainageData[pointIndex].images =
          currentPointImages.length > 0 ? currentPointImages : null;
      }

      // Update display
      const point = allDrainageData.find((p) => p.id == currentPointId);
      populateImageGalleryEnhanced(point);

      showNotification("Image deleted successfully", "success");

      // Optional: Delete physical file from server
      deleteImageFile(imageToDelete);
    } else {
      throw new Error(result.message || "Failed to update point");
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    showNotification(`Error deleting image: ${error.message}`, "danger");
  } finally {
    showLoading(false);
  }
}

async function deleteImageFile(imageUrl) {
  try {
    // Extract filename from URL
    const filename = imageUrl.split("/").pop();

    const response = await fetch("/DrainageInventory/api/delete-image.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename: filename }),
    });

    const result = await response.json();
    if (!result.success) {
      console.warn("Could not delete physical file:", result.message);
    }
  } catch (error) {
    console.warn("Error deleting physical file:", error);
  }
}

// ==========================================
// STEP 5: Fullscreen Modal Functions
// ==========================================

function openFullscreenImage() {
  if (!currentPointImages[currentImageIndex]) return;

  createFullscreenModal();
}

function createFullscreenModal() {
  // Remove existing modal if any
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

  // Show modal with animation
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);

  // Close on click outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeFullscreenModal();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", handleFullscreenKeyboard);
}

function handleFullscreenKeyboard(e) {
  const modal = document.querySelector(".image-fullscreen-modal.show");
  if (!modal) return;

  switch (e.key) {
    case "Escape":
      closeFullscreenModal();
      break;
    case "ArrowLeft":
      fullscreenPrevious();
      break;
    case "ArrowRight":
      fullscreenNext();
      break;
  }
}

function closeFullscreenModal() {
  const modal = document.querySelector(".image-fullscreen-modal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.remove();
      document.removeEventListener("keydown", handleFullscreenKeyboard);
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

  // Also update the main gallery
  updateMainImage();
  updateThumbnailSelection();
  updateImageCounter();
}

// ==========================================
// ID VALIDATION FUNCTIONALITY
// ==========================================

function setupIdValidation() {
  const pointIdInput = document.getElementById("point-id");
  if (!pointIdInput) return;

  pointIdInput.addEventListener("input", function () {
    clearTimeout(idValidationTimeout);
    const idValue = this.value.trim().toUpperCase();
    this.value = idValue;

    if (idValue === "") {
      resetIdValidation();
      return;
    }

    if (!isValidIdFormat(idValue)) {
      showIdValidation(
        false,
        "ID must contain only letters and numbers (no spaces or special characters)"
      );
      return;
    }

    showIdValidation("checking", "Checking ID availability...");

    idValidationTimeout = setTimeout(() => {
      checkIdAvailability(idValue);
    }, 500);
  });
}

function isValidIdFormat(id) {
  const pattern = /^[A-Z0-9]+$/;
  return pattern.test(id) && id.length >= 2 && id.length <= 20;
}

async function checkIdAvailability(id) {
  try {
    if (editMode && currentEditingId && id === currentEditingId) {
      showIdValidation(true, "Current ID (no change needed)");
      return;
    }

    const response = await fetch(
      `/DrainageInventory/api/drainage-points.php?id=${encodeURIComponent(id)}`
    );
    const result = await response.json();

    if (result && result.id) {
      showIdValidation(
        false,
        "This ID is already in use. Please choose a different one."
      );
    } else {
      showIdValidation(true, "ID is available");
    }
  } catch (error) {
    console.error("Error checking ID availability:", error);
    showIdValidation(
      "error",
      "Could not verify ID availability. Please try again."
    );
  }
}

function showIdValidation(status, message) {
  const pointIdInput = document.getElementById("point-id");
  const feedback = document.getElementById("point-id-feedback");
  const alert = document.getElementById("id-validation-alert");
  const alertMessage = document.getElementById("id-validation-message");

  if (!pointIdInput || !feedback || !alert || !alertMessage) return;

  pointIdInput.classList.remove("is-valid", "is-invalid");
  alert.classList.remove(
    "alert-success",
    "alert-danger",
    "alert-warning",
    "alert-info",
    "d-none"
  );

  if (status === true) {
    pointIdInput.classList.add("is-valid");
    alert.classList.add("alert-success");
    alertMessage.innerHTML = `<i class="fas fa-check-circle me-2"></i>${message}`;
    alert.classList.remove("d-none");
    isIdValid = true;
  } else if (status === false) {
    pointIdInput.classList.add("is-invalid");
    feedback.textContent = message;
    alert.classList.add("alert-danger");
    alertMessage.innerHTML = `<i class="fas fa-times-circle me-2"></i>${message}`;
    alert.classList.remove("d-none");
    isIdValid = false;
  } else if (status === "checking") {
    alert.classList.add("alert-info");
    alertMessage.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${message}`;
    alert.classList.remove("d-none");
    isIdValid = false;
  } else if (status === "error") {
    alert.classList.add("alert-warning");
    alertMessage.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${message}`;
    alert.classList.remove("d-none");
    isIdValid = false;
  }
}

function resetIdValidation() {
  const pointIdInput = document.getElementById("point-id");
  const feedback = document.getElementById("point-id-feedback");
  const alert = document.getElementById("id-validation-alert");

  if (pointIdInput) pointIdInput.classList.remove("is-valid", "is-invalid");
  if (feedback) feedback.textContent = "";
  if (alert) alert.classList.add("d-none");

  isIdValid = false;
}

// ==========================================
// CONTROL PANEL FUNCTIONALITY
// ==========================================

function initializeControlPanel() {
  const panel = document.getElementById("controlPanel");
  const toggleBtn = document.getElementById("panelToggle");
  const toggleIcon = document.getElementById("toggleIcon");

  if (!panel || !toggleBtn || !toggleIcon) {
    console.warn("Control panel elements not found");
    return;
  }

  const isCollapsed = localStorage.getItem("panelCollapsed") === "true";
  if (isCollapsed) {
    panel.classList.add("collapsed");
    toggleIcon.className = "fas fa-chevron-right";
  }

  function togglePanel() {
    const isCurrentlyCollapsed = panel.classList.contains("collapsed");

    if (isCurrentlyCollapsed) {
      panel.classList.remove("collapsed");
      toggleIcon.className = "fas fa-chevron-left";
      localStorage.setItem("panelCollapsed", "false");
    } else {
      panel.classList.add("collapsed");
      toggleIcon.className = "fas fa-chevron-right";
      localStorage.setItem("panelCollapsed", "true");
    }
  }

  toggleBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    togglePanel();
  });

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "h") {
      e.preventDefault();
      togglePanel();
    }

    if (e.key === "Escape" && !panel.classList.contains("collapsed")) {
      panel.classList.add("collapsed");
      toggleIcon.className = "fas fa-chevron-right";
      localStorage.setItem("panelCollapsed", "true");
      showNotification("Control panel closed", "info");
    }
  });

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
          localStorage.setItem("panelCollapsed", "true");
        }, 100);
      }
    });
  }

  console.log("Control panel initialized successfully");
}

// ==========================================
// MAP INITIALIZATION
// ==========================================

function initializeMap() {
  map = L.map("map", {
    zoomControl: false,
    attributionControl: false,
  }).setView([2.05788, 102.57471], 13);

  initializeBaseLayers();
  initializeOverlayLayers();
  setupMapEventHandlers();
}

function initializeBaseLayers() {
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

  terrainTileLayer = L.tileLayer(
    "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    { maxZoom: 17 }
  );
}

function initializeOverlayLayers() {
  drainagePointsLayer = L.markerClusterGroup({
    chunkedLoading: true,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
  }).addTo(map);

  floodProneAreasLayer = L.layerGroup();
  maintenanceRoutesLayer = L.layerGroup();
}

function setupMapEventHandlers() {
  map.on("click", handleMapClick);
  map.on("zoomend", updateZoomLevel);
}

function handleMapClick(e) {
  if (pickLocationMode) {
    handleLocationPick(e, "point");
  } else if (floodReportLocationMode) {
    handleLocationPick(e, "flood");
  }
}

function handleLocationPick(e, type) {
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);

  document.getElementById("map").style.cursor = "";

  if (type === "point") {
    pickLocationMode = false;
    document.getElementById("point-lat").value = lat;
    document.getElementById("point-lng").value = lng;
    showModal("addPointModal");
    showNotification(`Location selected: ${lat}, ${lng}`, "success");
  } else if (type === "flood") {
    floodReportLocationMode = false;
    const locationInput = document.getElementById("flood-location-input");
    if (locationInput) {
      locationInput.value = `${lat}, ${lng}`;
      locationInput.setAttribute("data-lat", lat);
      locationInput.setAttribute("data-lng", lng);
    }
    showModal("floodReportModal");
    showNotification(`Flood location selected: ${lat}, ${lng}`, "success");
  }
}

// ==========================================
// DATA MANAGEMENT
// ==========================================

async function fetchDrainageData() {
  try {
    const response = await fetch("/DrainageInventory/api/drainage-points.php");
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

    allDrainageData = getSampleDrainageData();
    drainageData = [...allDrainageData];
    renderDrainagePoints(drainageData);
  }
}

async function fetchFloodProneAreas() {
  try {
    const response = await fetch(
      "/DrainageInventory/api/flood-prone-areas.php"
    );
    if (!response.ok) throw new Error("API not available");

    const data = await response.json();
    renderFloodProneAreas(data);
  } catch (error) {
    console.error("Error fetching flood-prone areas:", error);
    renderFloodProneAreas(getSampleFloodProneAreas());
  }
}

async function fetchAndRenderDrainageLines() {
  try {
    const response = await fetch("/DrainageInventory/api/drainage-lines.php");
    if (!response.ok) throw new Error("Failed to fetch drainage lines");

    const geojsonData = await response.json();
    const drainageLineLayer = L.geoJSON(geojsonData, {
      style: {
        color: "#007bff",
        weight: 3,
        opacity: 0.8,
      },
    }).addTo(map);

    drainageLineLayer.setZIndex(10);
  } catch (error) {
    console.error("Error fetching drainage lines:", error);
  }
}

// ==========================================
// FILTERING AND SEARCH
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

function updateFilterCounts() {
  const totalCount = allDrainageData.length;
  const filteredCount = drainageData.length;
  console.log(`Showing ${filteredCount} of ${totalCount} drainage points`);
}

// ==========================================
// RENDERING FUNCTIONS
// ==========================================

function renderDrainagePoints(data) {
  drainagePointsLayer.clearLayers();

  data.forEach((point) => {
    const marker = L.marker(point.coordinates, {
      icon: createMarkerIcon(point.status),
      title: point.name,
    });

    const popupContent = createPopupContent(point);
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: "custom-popup",
    });

    marker.on("popupopen", () => {
      setTimeout(() => setupPopupEventHandlers(point.id), 100);
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
      </div>
    `;

    polygon.bindPopup(popupContent);
  });
}

function createMarkerIcon(status) {
  const colors = {
    Good: "#28a745",
    "Needs Maintenance": "#ffc107",
    Critical: "#dc3545",
  };

  const color = colors[status] || "#6c757d";

  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="
        background: ${color}; 
        width: 14px; 
        height: 14px; 
        border-radius: 50%; 
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function createPopupContent(point) {
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
function getStatusBadgeClass(status) {
  const classes = {
    Good: "bg-success",
    "Needs Maintenance": "bg-warning text-dark",
    Critical: "bg-danger",
  };
  return classes[status] || "bg-secondary";
}

function setupPopupEventHandlers(pointId) {
  const detailsBtn = document.querySelector(".view-details-btn");
  if (detailsBtn) {
    detailsBtn.addEventListener("click", () => showPointDetails(pointId));
  }
}

// ==========================================
// POINT DETAILS MODAL FUNCTIONS
// ==========================================

function showPointDetails(pointId) {
  currentPointId = pointId;
  const point = allDrainageData.find((p) => p.id == pointId);

  if (!point) {
    showNotification("Point not found", "danger");
    return;
  }

  populatePointDetailsWithImages(point);
  populateMaintenanceHistory(point);
  populateImageGalleryEnhanced(point);

  showModal("pointDetailsModal");
}

function populatePointDetailsWithImages(point) {
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

// Updated populateMaintenanceHistory function with better error handling and formatting
async function populateMaintenanceHistory(point) {
  const maintenanceTable = document.getElementById("maintenance-history-table");
  if (!maintenanceTable) return;

  try {
    console.log("Fetching maintenance history for point:", point.id); // Debug log

    // Fetch maintenance history for this point
    const response = await fetch(
      `/DrainageInventory/api/maintenance-requests.php?drainage_point_id=${point.id}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Maintenance history response:", data); // Debug log

    // Check if we have data and it's an array
    if (data && Array.isArray(data) && data.length > 0) {
      let tableContent = `
        <thead class="table-primary">
          <tr>
            <th>Request #</th>
            <th>Date</th>
            <th>Type</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
      `;

      data.forEach((record) => {
        const statusClass = getMaintenanceStatusBadgeClass(record.status);
        const priorityClass = getPriorityBadgeClass(record.priority);
        tableContent += `
          <tr>
            <td>${record.request_number || record.id}</td>
            <td>${formatMaintenanceDate(
              record.scheduled_date || record.created_at
            )}</td>
            <td>${record.request_type}</td>
            <td title="${record.description}">${truncateText(
          record.description,
          50
        )}</td>
            <td><span class="badge ${priorityClass}">${
          record.priority
        }</span></td>
            <td><span class="badge ${statusClass}">${record.status}</span></td>
            <td>${
              record.estimated_cost
                ? `RM ${parseFloat(record.estimated_cost).toFixed(2)}`
                : "-"
            }</td>
          </tr>
        `;
      });

      tableContent += "</tbody>";
      maintenanceTable.innerHTML = tableContent;

      // Add summary statistics
      const completedTasks = data.filter(
        (r) => r.status === "Completed"
      ).length;
      const pendingTasks = data.filter((r) => r.status === "Pending").length;
      const inProgressTasks = data.filter(
        (r) => r.status === "In Progress"
      ).length;
      const totalCost = data.reduce(
        (sum, r) => sum + (parseFloat(r.estimated_cost) || 0),
        0
      );

      const summaryHtml = `
        <div class="maintenance-summary mt-3">
          <div class="row g-2">
            <div class="col-md-3">
              <div class="card bg-light">
                <div class="card-body">
                  <h6 class="card-title">Total Records</h6>
                  <p class="card-text h4">${data.length}</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-success text-white">
                <div class="card-body">
                  <h6 class="card-title">Completed</h6>
                  <p class="card-text h4">${completedTasks}</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-warning text-dark">
                <div class="card-body">
                  <h6 class="card-title">Pending</h6>
                  <p class="card-text h4">${pendingTasks}</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-info text-white">
                <div class="card-body">
                  <h6 class="card-title">Total Cost</h6>
                  <p class="card-text h4">RM ${totalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      maintenanceTable.insertAdjacentHTML("afterend", summaryHtml);
    } else {
      maintenanceTable.innerHTML = `
        <tbody>
          <tr>
            <td colspan="7" class="text-center text-muted py-4">
              <i class="fas fa-history fa-2x mb-2 d-block"></i>
              <p class="mb-0">No maintenance history available</p>
              <button class="btn btn-sm btn-primary mt-2" onclick="showRequestMaintenanceModal('${point.id}')">
                <i class="fas fa-plus me-1"></i>Request Maintenance
              </button>
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
          <td colspan="7" class="text-center text-danger py-4">
            <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block"></i>
            <p class="mb-0">Error loading maintenance history</p>
            <p class="text-muted small">${error.message}</p>
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="populateMaintenanceHistory(${JSON.stringify(
              point
            ).replace(/"/g, "&quot;")})">
              <i class="fas fa-refresh me-1"></i>Try Again
            </button>
          </td>
        </tr>
      </tbody>
    `;
  }
  const existingSummary = document.querySelector(".maintenance-summary");
  if (existingSummary) {
    existingSummary.outerHTML = summaryHtml;
  } else {
    maintenanceTable.insertAdjacentHTML("afterend", summaryHtml);
  }
}

// Helper function to get maintenance status badge classes
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

// Helper function to get priority badge classes
function getPriorityBadgeClass(priority) {
  const classes = {
    Low: "bg-light text-dark",
    Medium: "bg-primary",
    High: "bg-warning text-dark",
    Critical: "bg-danger",
  };
  return classes[priority] || "bg-secondary";
}

// Helper function to format maintenance dates
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

// Helper function to truncate text
function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
// Helper function to format dates
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function handleEditPoint() {
  if (!currentPointId) {
    showNotification("No point selected for editing", "danger");
    return;
  }

  const point = allDrainageData.find((p) => p.id == currentPointId);
  if (!point) {
    showNotification("Point not found", "danger");
    return;
  }

  populateEditForm(point);
  editMode = true;

  const modalLabel = document.getElementById("addPointModalLabel");
  const saveBtn = document.getElementById("save-point-btn");

  if (modalLabel) {
    modalLabel.innerHTML =
      '<i class="fas fa-edit me-2"></i>Edit Drainage Point';
  }
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Update Point';
  }

  hideModal("pointDetailsModal");
  showModal("addPointModal");
}

function populateEditForm(point) {
  const fields = [
    { id: "point-id", value: point.id || "" },
    { id: "point-name", value: point.name || "" },
    { id: "point-type", value: point.type || "" },
    { id: "point-status", value: point.status || "Good" },
    { id: "point-depth", value: point.depth || "" },
    { id: "point-il", value: point.invert_level || "" },
    { id: "point-rl", value: point.reduced_level || "" },
    { id: "point-lat", value: point.coordinates[0] || "" },
    { id: "point-lng", value: point.coordinates[1] || "" },
    { id: "point-description", value: point.description || "" },
  ];

  fields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (element) {
      element.value = field.value;
    }
  });

  // Set current editing ID and mark as valid (since it's the existing ID)
  currentEditingId = point.id;
  isIdValid = true;

  // Show existing images in the form
  displayExistingImagesInForm(point);

  // Show that current ID is valid
  setTimeout(() => {
    showIdValidation(true, "Current ID (no change needed)");
  }, 100);
}

// New function to display existing images in the edit form
function displayExistingImagesInForm(point) {
  let existingImages = [];

  // Parse existing images
  if (point.images) {
    try {
      if (
        typeof point.images === "string" &&
        (point.images.startsWith("[") || point.images.startsWith('"'))
      ) {
        existingImages = JSON.parse(point.images);
        if (typeof existingImages === "string") {
          existingImages = JSON.parse(existingImages);
        }
        if (!Array.isArray(existingImages)) {
          existingImages = [existingImages];
        }
      } else if (Array.isArray(point.images)) {
        existingImages = point.images;
      } else if (typeof point.images === "string") {
        existingImages = point.images
          .split(" ")
          .filter((url) => url.trim() !== "");
      }
    } catch (e) {
      console.error("Error parsing existing images:", e);
      if (typeof point.images === "string") {
        existingImages = point.images
          .split(" ")
          .filter((url) => url.trim() !== "");
      }
    }
  }

  // Clean the URLs
  existingImages = existingImages
    .map((url) => {
      let cleanUrl = url.trim();
      if (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) {
        cleanUrl = cleanUrl.slice(1, -1);
      }
      return cleanUrl;
    })
    .filter((url) => url && url.length > 0);

  // Store existing images globally for later use
  window.currentEditingImages = existingImages;

  // Create existing images preview
  const imageInput = document.getElementById("point-images");
  if (imageInput && existingImages.length > 0) {
    let existingContainer = document.getElementById(
      "existing-images-container"
    );

    if (!existingContainer) {
      existingContainer = document.createElement("div");
      existingContainer.id = "existing-images-container";
      existingContainer.className = "mb-3";
      imageInput.parentNode.insertBefore(
        existingContainer,
        imageInput.parentNode.querySelector(".form-text")
      );
    }

    existingContainer.innerHTML = `
      <label class="form-label">Existing Images</label>
      <div class="existing-images-grid row g-2" id="existing-images-grid">
        ${existingImages
          .map(
            (img, index) => `
          <div class="col-4 col-md-3" data-image-index="${index}">
            <div class="position-relative">
              <img src="${img}" 
                   class="img-thumbnail w-100" 
                   style="height: 80px; object-fit: cover;"
                   alt="Existing image ${index + 1}">
              <button type="button" 
                      class="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle"
                      style="width: 25px; height: 25px; font-size: 12px; transform: translate(50%, -50%);"
                      onclick="removeExistingImage(${index})"
                      title="Remove this image">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <small class="text-muted d-block text-center mt-1">Image ${
              index + 1
            }</small>
          </div>
        `
          )
          .join("")}
      </div>
      <small class="text-muted">
        <i class="fas fa-info-circle me-1"></i>
        These are existing images. You can remove them or add new ones below.
      </small>
    `;
  }
}

async function deletePoint(pointId) {
  if (!pointId) {
    showNotification("Invalid point ID", "danger");
    return;
  }

  if (
    !confirm(
      "Are you sure you want to delete this drainage point? This action cannot be undone."
    )
  ) {
    return;
  }

  showLoading(true);

  try {
    const response = await fetch(
      `/DrainageInventory/api/drainage-points.php?id=${pointId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (result.success) {
      showNotification("Drainage point deleted successfully", "success");

      allDrainageData = allDrainageData.filter((point) => point.id !== pointId);
      drainageData = drainageData.filter((point) => point.id !== pointId);

      renderDrainagePoints(drainageData);
      updateFilterCounts();

      hideModal("pointDetailsModal");
    } else {
      throw new Error(result.message || "Failed to delete point");
    }
  } catch (error) {
    console.error("Error deleting point:", error);
    showNotification(`Error deleting point: ${error.message}`, "danger");
  } finally {
    showLoading(false);
  }
}

// ==========================================
// ENHANCED FORM HANDLING WITH IMAGE UPLOAD
// ==========================================

async function handleAddPointFormWithImages() {
  const pointId = document
    .getElementById("point-id")
    .value.trim()
    .toUpperCase();
  const pointName = document.getElementById("point-name").value.trim();
  const pointType = document.getElementById("point-type").value;
  const pointStatus = document.getElementById("point-status").value;
  const pointDepth = document.getElementById("point-depth").value;
  const pointIL = document.getElementById("point-il").value.trim();
  const pointRL = document.getElementById("point-rl").value.trim();
  const pointLat = document.getElementById("point-lat").value;
  const pointLng = document.getElementById("point-lng").value;
  const pointDescription = document
    .getElementById("point-description")
    .value.trim();
  const imageFiles = document.getElementById("point-images").files;

  // Enhanced validation (same as before)
  if (!pointId) {
    showNotification("Please enter a point ID", "warning");
    document.getElementById("point-id").focus();
    return;
  }

  if (!isValidIdFormat(pointId)) {
    showNotification(
      "ID must contain only letters and numbers (2-20 characters)",
      "warning"
    );
    document.getElementById("point-id").focus();
    return;
  }

  if (!isIdValid && !editMode) {
    showNotification("Please choose a valid, available ID", "warning");
    document.getElementById("point-id").focus();
    return;
  }

  if (!pointName) {
    showNotification("Please enter a point name", "warning");
    document.getElementById("point-name").focus();
    return;
  }

  if (!pointType) {
    showNotification("Please select a drainage type", "warning");
    document.getElementById("point-type").focus();
    return;
  }

  if (!pointLat || !pointLng) {
    showNotification("Please pick a location on the map", "warning");
    return;
  }

  const lat = parseFloat(pointLat);
  const lng = parseFloat(pointLng);

  if (isNaN(lat) || isNaN(lng)) {
    showNotification(
      "Invalid coordinates. Please pick a location on the map.",
      "warning"
    );
    return;
  }

  showLoading(true);

  try {
    // Handle images properly for both new and edit modes
    let finalImageUrls = [];

    if (editMode && window.currentEditingImages) {
      // Start with existing images (after any removals)
      finalImageUrls = [...window.currentEditingImages];
    }

    // Upload new images if any
    if (imageFiles && imageFiles.length > 0) {
      showNotification("Uploading new images...", "info");
      const newImageUrls = await uploadImages(imageFiles);

      if (newImageUrls.length > 0) {
        // Add new images to existing ones
        finalImageUrls = finalImageUrls.concat(newImageUrls);
        showNotification(
          `${newImageUrls.length} new image(s) uploaded successfully`,
          "success"
        );
      } else if (imageFiles.length > 0) {
        showNotification(
          "Failed to upload new images. Point will be saved with existing images only.",
          "warning"
        );
      }
    }

    const formData = {
      id: pointId,
      name: pointName,
      type: pointType,
      status: pointStatus,
      depth: pointDepth ? parseFloat(pointDepth) : 0,
      invert_level: pointIL || "N/A",
      reduced_level: pointRL || "N/A",
      coordinates: [lat, lng],
      description: pointDescription || "No description provided",
      images: finalImageUrls.length > 0 ? JSON.stringify(finalImageUrls) : null,
    };

    if (editMode && currentPointId) {
      formData.originalId = currentPointId;
      await updatePointWithImages(formData);
    } else {
      await addNewPointWithImages(formData);
    }
  } catch (error) {
    console.error("Error handling point form:", error);
    showNotification(`Error: ${error.message}`, "danger");
    showLoading(false);
  }
}

async function addNewPointWithImages(pointData) {
  try {
    const response = await fetch("/DrainageInventory/api/drainage-points.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pointData),
    });

    const result = await response.json();

    if (result.success) {
      showNotification("New drainage point added successfully", "success");

      const newPoint = {
        ...pointData,
        last_updated: new Date().toISOString().split("T")[0],
      };

      allDrainageData.push(newPoint);
      applyFilters();

      if (allDrainageData.length > 0) {
        populateSearchDropdown(allDrainageData);
      }

      resetForm("add-point-form");
      resetIdValidation();
      hideModal("addPointModal");

      if (pointData.coordinates && pointData.coordinates.length === 2) {
        map.setView(pointData.coordinates, 16);
      }
    } else {
      throw new Error(result.message || "Failed to add point");
    }
  } catch (error) {
    console.error("Error adding point:", error);
    if (error.message.includes("Duplicate entry")) {
      showNotification(
        "This ID already exists. Please choose a different ID.",
        "danger"
      );
      document.getElementById("point-id").focus();
    } else {
      showNotification(`Error adding point: ${error.message}`, "danger");
    }
  } finally {
    showLoading(false);
  }
}

async function updatePointWithImages(pointData) {
  try {
    const response = await fetch("/DrainageInventory/api/drainage-points.php", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pointData),
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Drainage point updated successfully", "success");

      // Update the data in our arrays
      const pointIndex = allDrainageData.findIndex(
        (p) => p.id === pointData.originalId || p.id === pointData.id
      );
      if (pointIndex !== -1) {
        allDrainageData[pointIndex] = {
          ...allDrainageData[pointIndex],
          ...pointData,
          last_updated: new Date().toISOString().split("T")[0],
        };
      }

      applyFilters();

      if (allDrainageData.length > 0) {
        populateSearchDropdown(allDrainageData);
      }

      // Clean up edit mode variables
      resetForm("add-point-form");
      resetIdValidation();
      editMode = false;
      currentEditingId = null;
      window.currentEditingImages = null;

      const modalLabel = document.getElementById("addPointModalLabel");
      const saveBtn = document.getElementById("save-point-btn");

      if (modalLabel) {
        modalLabel.innerHTML =
          '<i class="fas fa-plus-circle me-2"></i>Add New Drainage Point';
      }
      if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Save Point';
      }

      hideModal("addPointModal");

      // Refresh the point details if it's still open
      if (currentPointId) {
        const updatedPoint = allDrainageData.find(
          (p) => p.id == currentPointId
        );
        if (updatedPoint) {
          populatePointDetailsWithImages(updatedPoint);
          populateImageGalleryEnhanced(updatedPoint);
        }
      }
    } else {
      throw new Error(result.message || "Failed to update point");
    }
  } catch (error) {
    console.error("Error updating point:", error);
    if (error.message.includes("Duplicate entry")) {
      showNotification(
        "This ID already exists. Please choose a different ID.",
        "danger"
      );
      document.getElementById("point-id").focus();
    } else {
      showNotification(`Error updating point: ${error.message}`, "danger");
    }
  } finally {
    showLoading(false);
  }
}

function handlePickLocation() {
  pickLocationMode = true;
  map.closePopup();
  document.getElementById("map").style.cursor = "crosshair";
  showNotification(
    "Click on the map to select a location for the drainage point",
    "info"
  );
  hideModal("addPointModal");
}

// ==========================================
// FLOOD REPORTING FUNCTIONS
// ==========================================

async function handleFloodReportForm() {
  const locationInput = document.getElementById("flood-location-input");
  const severitySelect = document.getElementById("flood-severity");
  const waterDepthInput = document.getElementById("flood-water-depth");
  const descriptionTextarea = document.getElementById("flood-description");
  const contactInput = document.getElementById("reporter-contact");

  if (!locationInput || !locationInput.value.trim()) {
    showNotification("Please enter a flood location", "warning");
    return;
  }

  if (!severitySelect || !severitySelect.value) {
    showNotification("Please select flood severity", "warning");
    return;
  }

  if (!descriptionTextarea || !descriptionTextarea.value.trim()) {
    showNotification("Please provide a description", "warning");
    return;
  }

  showLoading(true);

  try {
    const floodData = {
      location: locationInput.value.trim(),
      severity: severitySelect.value,
      water_depth: waterDepthInput ? parseInt(waterDepthInput.value) || 0 : 0,
      description: descriptionTextarea.value.trim(),
      contact: contactInput ? contactInput.value.trim() : "",
      timestamp: new Date().toISOString(),
    };

    const lat = locationInput.getAttribute("data-lat");
    const lng = locationInput.getAttribute("data-lng");
    if (lat && lng) {
      floodData.coordinates = [parseFloat(lat), parseFloat(lng)];
    }

    const response = await fetch("/DrainageInventory/api/flood-reports.php", {
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

      resetForm("flood-report-form");
      hideModal("floodReportModal");

      if (floodData.coordinates) {
        const floodMarker = L.marker(floodData.coordinates, {
          icon: L.divIcon({
            className: "flood-report-marker",
            html: '<div style="background: #dc3545; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><i class="fas fa-exclamation" style="color: white; font-size: 10px; position: relative; top: 3px; left: 6px;"></i></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          }),
        }).addTo(map);

        floodMarker.bindPopup(`
          <div class="popup-content">
            <h6><i class="fas fa-exclamation-triangle me-2 text-danger"></i>Flood Report</h6>
            <p><strong>Severity:</strong> ${floodData.severity}</p>
            <p><strong>Description:</strong> ${floodData.description}</p>
            <p><strong>Reported:</strong> Just now</p>
          </div>
        `);

        map.setView(floodData.coordinates, 16);

        setTimeout(() => {
          map.removeLayer(floodMarker);
        }, 30000);
      }
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

function handleFloodPickLocation() {
  floodReportLocationMode = true;
  map.closePopup();
  document.getElementById("map").style.cursor = "crosshair";
  showNotification("Click on the map to select the flood location", "info");
  hideModal("floodReportModal");
}

// ==========================================
// EVENT LISTENERS SETUP
// ==========================================

function setupEventListeners() {
  setupEnhancedSearch();

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

  setupMapControls();
  setupActionButtons();
  setupFormHandlers();
  setupPointDetailHandlers();

  const submitMaintenanceRequestBtn = document.getElementById(
    "submit-maintenance-request-btn"
  );
  if (submitMaintenanceRequestBtn) {
    submitMaintenanceRequestBtn.addEventListener(
      "click",
      handleMaintenanceRequestForm
    );
  }

  const submitInspectionScheduleBtn = document.getElementById(
    "submit-inspection-schedule-btn"
  );
  if (submitInspectionScheduleBtn) {
    submitInspectionScheduleBtn.addEventListener(
      "click",
      handleInspectionScheduleForm
    );
  }
}

function setupPointDetailHandlers() {
  const editPointBtn = document.getElementById("edit-point-btn");
  if (editPointBtn) {
    editPointBtn.addEventListener("click", handleEditPoint);
  }

  const deletePointBtn = document.getElementById("delete-point-btn");
  if (deletePointBtn) {
    deletePointBtn.addEventListener("click", () => {
      deletePoint(currentPointId);
    });
  }

  const scheduleInspectionBtn = document.querySelector(
    ".btn-outline-success[onclick^='showScheduleInspectionModal']"
  );
  if (scheduleInspectionBtn) {
    scheduleInspectionBtn.onclick = () =>
      showScheduleInspectionModal(currentPointId);
  }

  const requestMaintenanceBtn = document.querySelector(
    ".btn-outline-warning[onclick^='showRequestMaintenanceModal']"
  );
  if (requestMaintenanceBtn) {
    requestMaintenanceBtn.onclick = () =>
      showRequestMaintenanceModal(currentPointId);
  }
}

function setupMapControls() {
  const controls = [
    { id: "zoom-in-btn", action: () => map.zoomIn() },
    { id: "zoom-out-btn", action: () => map.zoomOut() },
    { id: "locate-me-btn", action: handleLocateMe },
    {
      id: "full-extent-btn",
      action: () => map.setView([2.05788, 102.57471], 13),
    },
    { id: "toggle-layers-btn", action: () => showModal("layerControlModal") },
  ];

  controls.forEach(({ id, action }) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("click", action);
    }
  });
}

function setupActionButtons() {
  const addPointBtn = document.getElementById("add-point-btn");
  if (addPointBtn) {
    addPointBtn.addEventListener("click", () => {
      resetForm("add-point-form");
      resetIdValidation();
      editMode = false;
      currentEditingId = null;
      window.currentEditingImages = null;

      const modalLabel = document.getElementById("addPointModalLabel");
      const saveBtn = document.getElementById("save-point-btn");

      if (modalLabel) {
        modalLabel.innerHTML =
          '<i class="fas fa-plus-circle me-2"></i>Add New Drainage Point';
      }
      if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Save Point';
      }

      showModal("addPointModal");
    });
  }

  const exportBtn = document.getElementById("export-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => showModal("exportModal"));
  }

  const floodReportBtn = document.querySelector(".flood-report-btn");
  if (floodReportBtn) {
    floodReportBtn.addEventListener("click", () => {
      resetForm("flood-report-form");
      showModal("floodReportModal");
    });
  }
}

function setupFormHandlers() {
  setupIdValidation();
  setupImagePreview();

  const pickLocationBtn = document.getElementById("pick-location-btn");
  if (pickLocationBtn) {
    pickLocationBtn.addEventListener("click", handlePickLocation);
  }

  const floodPickLocationBtn = document.getElementById(
    "flood-pick-location-btn"
  );
  if (floodPickLocationBtn) {
    floodPickLocationBtn.addEventListener("click", handleFloodPickLocation);
  }

  const savePointBtn = document.getElementById("save-point-btn");
  if (savePointBtn) {
    savePointBtn.addEventListener("click", handleAddPointFormWithImages);
  }

  const submitFloodReportBtn = document.getElementById(
    "submit-flood-report-btn"
  );
  if (submitFloodReportBtn) {
    submitFloodReportBtn.addEventListener("click", handleFloodReportForm);
  }

  const confirmExportBtn = document.getElementById("confirm-export-btn");
  if (confirmExportBtn) {
    confirmExportBtn.addEventListener("click", handleConfirmExport);
  }

  setupLayerControls();
  setupBasemapControls();
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
    .getElementById("layer-flood-prone")
    .addEventListener("change", (e) => {
      if (e.target.checked) {
        map.addLayer(floodProneAreasLayer);
      } else {
        map.removeLayer(floodProneAreasLayer);
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
  document
    .getElementById("basemap-terrain")
    .addEventListener("change", () => switchBasemap("terrain"));
}

function switchBasemap(type) {
  [osmTileLayer, satelliteTileLayer, terrainTileLayer].forEach((layer) => {
    map.removeLayer(layer);
  });

  const basemaps = {
    street: osmTileLayer,
    satellite: satelliteTileLayer,
    terrain: terrainTileLayer,
  };

  if (basemaps[type]) {
    map.addLayer(basemaps[type]);
  }
}

function removeExistingImage(index) {
  if (
    !window.currentEditingImages ||
    index < 0 ||
    index >= window.currentEditingImages.length
  ) {
    return;
  }

  const confirmRemove = confirm(
    `Are you sure you want to remove this existing image? This change will be saved when you update the point.`
  );
  if (!confirmRemove) return;

  // Remove from the array
  window.currentEditingImages.splice(index, 1);

  // Find the current point and update the display
  const point = allDrainageData.find((p) => p.id == currentEditingId);
  if (point) {
    point.images =
      window.currentEditingImages.length > 0
        ? window.currentEditingImages
        : null;
    displayExistingImagesInForm(point);
  }

  showNotification(
    "Image removed from list. Remember to save changes.",
    "info"
  );
}
// ==========================================
// USER MANAGEMENT FUNCTIONS
// ==========================================

async function loadUsers() {
  try {
    const response = await fetch("/DrainageInventory/api/users.php");
    if (response.ok) {
      users = await response.json();
      populateUserDropdowns();
    } else {
      users = [
        {
          id: 1,
          first_name: "System",
          last_name: "Administrator",
          role: "Admin",
        },
        {
          id: 4,
          first_name: "John",
          last_name: "Inspector",
          role: "Inspector",
        },
        { id: 5, first_name: "Sarah", last_name: "Operator", role: "Operator" },
      ];
      populateUserDropdowns();
    }
  } catch (error) {
    console.error("Error loading users:", error);
    users = [
      {
        id: 1,
        first_name: "System",
        last_name: "Administrator",
        role: "Admin",
      },
      { id: 4, first_name: "John", last_name: "Inspector", role: "Inspector" },
      { id: 5, first_name: "Sarah", last_name: "Operator", role: "Operator" },
    ];
    populateUserDropdowns();
  }
}

function populateUserDropdowns() {
  const maintenanceAssignedTo = document.getElementById(
    "maintenance-assigned-to"
  );
  if (maintenanceAssignedTo) {
    maintenanceAssignedTo.innerHTML =
      '<option value="">Select team member (optional)</option>';
    users.forEach((user) => {
      if (user.role === "Operator" || user.role === "Admin") {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = `${user.first_name} ${user.last_name} (${user.role})`;
        maintenanceAssignedTo.appendChild(option);
      }
    });
  }

  const inspectionInspector = document.getElementById("inspection-inspector");
  if (inspectionInspector) {
    inspectionInspector.innerHTML =
      '<option value="">Select inspector (optional)</option>';
    users.forEach((user) => {
      if (user.role === "Operator" || user.role === "Admin") {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = `${user.first_name} ${user.last_name} (${user.role})`;
        inspectionInspector.appendChild(option);
      }
    });
  }
}

function showRequestMaintenanceModal(pointId) {
  const point = allDrainageData.find((p) => p.id == pointId);
  if (!point) {
    showNotification("Point not found", "danger");
    return;
  }

  // Reset form first
  resetForm("maintenance-request-form");

  // Set the drainage point information
  document.getElementById("maintenance-drainage-point-id").value = point.id;
  document.getElementById("maintenance-point-name").value = `${point.name}`;

  console.log("Set maintenance drainage point ID:", point.id); // Debug log

  // Set default scheduled date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById("maintenance-scheduled-date").value = tomorrow
    .toISOString()
    .split("T")[0];

  // Show the modal
  showModal("requestMaintenanceModal");
}

function getCurrentUserId() {
  // Check both storage locations
  const localId = localStorage.getItem("user_id");
  const sessionId = sessionStorage.getItem("userId");
  const userId = localId || sessionId;

  console.log("Storage check:", {
    localStorage: localId,
    sessionStorage: sessionId,
    finalUserId: userId,
  });

  if (!userId) {
    console.warn("No user ID found in storage");
    // Redirect to login if no user ID found
    window.location.href = "/DrainageInventory/login.html?unauthorized=1";
    return null;
  }

  return parseInt(userId);
}
async function handleMaintenanceRequestForm() {
  const userId = getCurrentUserId();
  console.log("Submitting request with user ID:", userId);

  if (!userId) {
    showNotification(
      "You must be logged in to submit a maintenance request",
      "warning"
    );
    return;
  }

  const formData = {
    drainage_point_id: document.getElementById("maintenance-drainage-point-id")
      .value,
    request_type: document.getElementById("maintenance-type").value,
    priority: document.getElementById("maintenance-priority").value,
    description: document
      .getElementById("maintenance-description")
      .value.trim(),
    estimated_cost:
      document.getElementById("maintenance-estimated-cost").value || null,
    scheduled_date:
      document.getElementById("maintenance-scheduled-date").value || null,
    assigned_to:
      document.getElementById("maintenance-assigned-to").value || null,
    requested_by: userId, // This will be automatically set from getCurrentUserId()
    notes: document.getElementById("maintenance-notes").value.trim(),
  };

  // Validation
  if (!formData.drainage_point_id) {
    showNotification("Invalid drainage point selected", "warning");
    return;
  }

  if (!formData.request_type) {
    showNotification("Please select a maintenance type", "warning");
    document.getElementById("maintenance-type").focus();
    return;
  }

  // Check user ID before proceeding
  if (!userId) {
    showNotification(
      "You must be logged in to submit a maintenance request",
      "warning"
    );
    return;
  }

  // Validation
  if (!formData.drainage_point_id) {
    showNotification("Invalid drainage point selected", "warning");
    document.getElementById("maintenance-drainage-point-id").focus();
    return;
  }

  if (!formData.request_type) {
    showNotification("Please select a maintenance type", "warning");
    document.getElementById("maintenance-type").focus();
    return;
  }

  if (!formData.description) {
    showNotification("Please provide a description", "warning");
    document.getElementById("maintenance-description").focus();
    return;
  }

  console.log(
    "Sending maintenance request with ID:",
    formData.drainage_point_id
  ); // Debug log

  showLoading(true);

  try {
    const response = await fetch(
      "/drainageInventory/api/maintenance-requests.php", // Fixed URL case
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const result = await response.json();

    if (result.success) {
      showNotification(
        "Maintenance request submitted successfully!",
        "success"
      );
      resetForm("maintenance-request-form");
      hideModal("requestMaintenanceModal");
      hideModal("pointDetailsModal");
    } else {
      throw new Error(result.message || "Failed to submit maintenance request");
    }
  } catch (error) {
    console.error("Error submitting maintenance request:", error);
    showNotification(
      `Error submitting maintenance request: ${error.message}`,
      "danger"
    );
  } finally {
    showLoading(false);
  }
}

function showScheduleInspectionModal(pointId) {
  resetForm("inspection-schedule-form");

  const point = allDrainageData.find((p) => p.id == pointId);
  if (!point) {
    showNotification("Point not found", "danger");
    return;
  }

  document.getElementById("inspection-drainage-point-id").value = point.id;
  document.getElementById("inspection-point-name").value = `${point.name}`;

  console.log(
    "Set drainage point ID:",
    document.getElementById("inspection-drainage-point-id").value
  );

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.getElementById("inspection-scheduled-date").value = nextWeek
    .toISOString()
    .split("T")[0];
  document.getElementById("inspection-scheduled-time").value = "09:00";

  showModal("scheduleInspectionModal");
}

async function handleInspectionScheduleForm() {
  const drainagePointIdValue = document.getElementById(
    "inspection-drainage-point-id"
  ).value;
  console.log("Drainage Point ID:", drainagePointIdValue); // Debug

  const formData = {
    drainage_point_id: drainagePointIdValue,
    inspection_type: document.getElementById("inspection-type").value,
    scheduled_date: document.getElementById("inspection-scheduled-date").value,
    scheduled_time:
      document.getElementById("inspection-scheduled-time").value || null,
    priority: document.getElementById("inspection-priority").value,
    frequency: document.getElementById("inspection-frequency").value,
    operator_id: document.getElementById("inspection-inspector").value || null, // Changed from inspector_id to operator_id
    description: document.getElementById("inspection-description").value.trim(),
  };

  console.log("Sending inspection data:", formData);

  const checklist = [];
  if (document.getElementById("checklist-structural").checked) {
    checklist.push("Structural integrity assessment");
  }
  if (document.getElementById("checklist-blockage").checked) {
    checklist.push("Check for blockages or debris");
  }
  if (document.getElementById("checklist-flow").checked) {
    checklist.push("Water flow assessment");
  }
  if (document.getElementById("checklist-safety").checked) {
    checklist.push("Safety hazard identification");
  }
  if (document.getElementById("checklist-maintenance").checked) {
    checklist.push("Maintenance requirements evaluation");
  }
  if (document.getElementById("checklist-documentation").checked) {
    checklist.push("Photo documentation");
  }

  if (checklist.length > 0) {
    formData.inspection_checklist = checklist;
  }

  if (!formData.drainage_point_id) {
    showNotification("Invalid drainage point selected", "warning");
    document.getElementById("inspection-drainage-point-id").focus();
    return;
  }

  if (!formData.inspection_type) {
    showNotification("Please select an inspection type", "warning");
    document.getElementById("inspection-type").focus();
    return;
  }

  if (!formData.scheduled_date) {
    showNotification("Please select a scheduled date", "warning");
    document.getElementById("inspection-scheduled-date").focus();
    return;
  }

  showLoading(true);

  try {
    const response = await fetch(
      "/DrainageInventory/api/inspection-schedules.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const result = await response.json();

    if (result.success) {
      showNotification("Inspection scheduled successfully!", "success");
      resetForm("inspection-schedule-form");
      hideModal("scheduleInspectionModal");
      hideModal("pointDetailsModal");
    } else {
      throw new Error(result.message || "Failed to schedule inspection");
    }
  } catch (error) {
    console.error("Error scheduling inspection:", error);
    showNotification(`Error scheduling inspection: ${error.message}`, "danger");
  } finally {
    showLoading(false);
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

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
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? "flex" : "none";
  }
}

function resetForm(formId) {
  const form = document.getElementById(formId);
  if (form) form.reset();

  if (formId === "add-point-form") {
    resetIdValidation();
    currentEditingId = null;
    editMode = false;

    // Clear image preview
    const previewContainer = document.getElementById("image-preview-container");
    if (previewContainer) {
      previewContainer.innerHTML = "";
    }

    // Clear existing images container
    const existingContainer = document.getElementById(
      "existing-images-container"
    );
    if (existingContainer) {
      existingContainer.remove();
    }

    // Clear the global editing images variable
    window.currentEditingImages = null;
  }
}

function updateZoomLevel() {
  const zoom = map.getZoom();
  if (zoom > 15) {
    drainagePointsLayer.options.disableClusteringAtZoom = 16;
  }
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

function handleConfirmExport() {
  showNotification("Export feature coming soon", "info");
  hideModal("exportModal");
}

function openImageModal(imageUrl) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.8); z-index: 9999; display: flex; 
    align-items: center; justify-content: center; cursor: pointer;
  `;

  const img = document.createElement("img");
  img.src = imageUrl;
  img.style.cssText = "max-width: 90%; max-height: 90%; border-radius: 10px;";

  modal.appendChild(img);
  document.body.appendChild(modal);

  modal.addEventListener("click", () => modal.remove());

  setTimeout(() => {
    if (modal.parentNode) modal.remove();
  }, 10000);
}

// ==========================================
// SAMPLE DATA (FALLBACK)
// ==========================================

function getSampleDrainageData() {
  return [
    {
      id: "SAMPLE1",
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
      id: "SAMPLE2",
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
      id: "SAMPLE3",
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

async function logout() {
  try {
    showNotification("Logging out...", "info");

    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    await fetch("../api/logout.php", { method: "POST" });
    window.location.href = "../login.html?logout=1";
  } catch (error) {
    console.error("Logout failed:", error);
    window.location.href = "../login.html?logout=1";
  }
}

// Initialize everything when DOM is ready
console.log(
  "DrainTrack Map System with Enhanced Search and Image Upload functionality loaded successfully!"
);
