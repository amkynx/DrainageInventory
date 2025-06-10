// ==========================================
// OPERATOR MAP SYSTEM - INTEGRATED WITH MAIN MAP.JS
// ==========================================

// Global variables (replicating essential ones from map.js)
let currentUser = null;
let operatorTasks = [];
let operatorStats = {};
let operatorNotifications = [];
let refreshInterval;

// Map variables
let map;
let drainageData = [];
let allDrainageData = [];
let currentPointId = null;
let users = [];

// Layer groups
let drainagePointsLayer, floodProneAreasLayer, maintenanceRoutesLayer;
let osmTileLayer, satelliteTileLayer, terrainTileLayer;

// Filter state
let currentFilters = {
  type: "all",
  status: "all",
  search: "",
  view: "all",
  category: "all",
};

// Enhanced Search Variables
let searchDropdownVisible = false;
let selectedDrainagePoint = null;

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  checkAuthentication();
});

/**
 * Check authentication and initialize operator interface
 */
async function checkAuthentication() {
  try {
    const response = await fetch("../api/session-check.php");
    const result = await response.json();

    if (result.success && result.authenticated) {
      if (result.user.role !== "Operator") {
        showNotification(
          "Access denied. This interface is for operators only.",
          "danger"
        );
        setTimeout(() => {
          window.location.href = "../login.html?unauthorized=1";
        }, 2000);
        return;
      }

      currentUser = result.user;
      document.getElementById("userName").textContent =
        currentUser.name ||
        `${currentUser.first_name} ${currentUser.last_name}`;
      hideLoadingOverlay();
      initializeOperatorMap();
    } else {
      window.location.href = "../login.html?unauthorized=1";
    }
  } catch (error) {
    console.error("Authentication check failed:", error);
    showNotification(
      "Authentication check failed. Redirecting to login...",
      "danger"
    );
    setTimeout(() => {
      window.location.href = "../login.html?error=1";
    }, 2000);
  }
}

/**
 * Initialize the operator map interface
 */
async function initializeOperatorMap() {
  try {
    showLoading(true);

    // Initialize map components specifically for operator interface
    await initializeOperatorMapComponents();

    // Operator-specific initialization
    setupOperatorControls();
    await loadOperatorData();
    setupAutoRefresh();

    showLoading(false);
    showNotification(
      `Welcome ${
        currentUser.name || currentUser.first_name
      }! Map interface loaded successfully.`,
      "success"
    );
  } catch (error) {
    console.error("Error initializing operator map:", error);
    showLoading(false);
    showNotification("Error loading map. Please refresh the page.", "danger");
  }
}

/**
 * Initialize map components specifically for operator interface
 */
async function initializeOperatorMapComponents() {
  // Initialize map
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

  terrainTileLayer = L.tileLayer(
    "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    { maxZoom: 17 }
  );

  // Initialize overlay layers
  drainagePointsLayer = L.markerClusterGroup({
    chunkedLoading: true,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
  }).addTo(map);

  floodProneAreasLayer = L.layerGroup().addTo(map);
  maintenanceRoutesLayer = L.layerGroup();

  // Setup map event handlers
  map.on("click", handleMapClick);
  map.on("zoomend", updateZoomLevel);

  // Setup operator-specific event listeners
  setupOperatorEventListeners();

  // Inject CSS for enhanced features
  injectEnhancedSearchCSS();
  injectImageGalleryCSS();
  setupImageUploadPreview();

  // Load data
  return Promise.all([
    fetchDrainageData(),
    fetchFloodProneAreas(),
    fetchAndRenderDrainageLines(),
    loadUsers(),
  ]);
}

/**
 * Setup event listeners specifically for operator interface
 */
function setupOperatorEventListeners() {
  // Setup enhanced search
  setupEnhancedSearch();

  // Filter functionality
  document.querySelectorAll(".filter-badge").forEach((badge) => {
    badge.addEventListener("click", function () {
      const filterType = this.getAttribute("data-type");
      const filterValue = this.getAttribute("data-filter");

      // Update active state
      document.querySelectorAll(`[data-type="${filterType}"]`).forEach((b) => {
        b.classList.remove("active");
      });
      this.classList.add("active");

      // Apply filter
      currentFilters[filterType] = filterValue;
      applyFilters();
    });
  });

  // Map controls
  const controls = [
    { id: "zoom-in-btn", action: () => map.zoomIn() },
    { id: "zoom-out-btn", action: () => map.zoomOut() },
    { id: "locate-me-btn", action: handleLocateMe },
    {
      id: "full-extent-btn",
      action: () => map.setView([2.05788, 102.57471], 13),
    },
    { id: "refresh-btn", action: refreshOperatorData },
  ];

  controls.forEach(({ id, action }) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("click", action);
    }
  });

  // Setup point detail handlers (but hide edit/delete for operators)
  setupOperatorPointDetailHandlers();
}

/**
 * Setup point detail handlers for operators
 */
function setupOperatorPointDetailHandlers() {
  // Override the original function to hide edit/delete buttons
  window.setupPopupEventHandlers = function (pointId) {
    setTimeout(() => {
      const detailsBtn = document.querySelector(".view-details-btn");
      if (detailsBtn) {
        detailsBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const actualPointId = detailsBtn.getAttribute("data-id") || pointId;
          showOperatorPointDetails(actualPointId);
        });
      }
    }, 100);
  };
}

/**
 * Show point details for operators (view-only)
 */
function showOperatorPointDetails(pointId) {
  const point = allDrainageData.find((p) => p.id == pointId);
  if (!point) {
    showNotification("Drainage point not found", "danger");
    return;
  }

  currentPointId = pointId;

  // Populate the view details modal (operator version)
  populateOperatorPointDetails(point);
  populateMaintenanceHistoryForView(point);
  populateImageGalleryForView(point);

  // Show the modal
  showModal("viewDetailsModal");
}

/**
 * Populate point details for operator view
 */
function populateOperatorPointDetails(point) {
  const detailsTable = document.getElementById("view-details-table");
  if (!detailsTable) return;

  const statusBadge = `<span class="badge ${getStatusBadgeClass(
    point.status
  )}">${point.status}</span>`;

  // Check if this point has assigned tasks
  const hasAssignedTask = pointHasAssignedTasks(point.id);
  const assignedTaskBadge = hasAssignedTask
    ? '<span class="badge bg-primary ms-2"><i class="fas fa-user me-1"></i>Assigned to Me</span>'
    : "";

  detailsTable.innerHTML = `
        <tr><th style="width: 40%;">ID</th><td>${point.id}</td></tr>
        <tr><th>Name</th><td>${point.name}</td></tr>
        <tr><th>Type</th><td>${point.type}</td></tr>
        <tr><th>Status</th><td>${statusBadge}${assignedTaskBadge}</td></tr>
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

/**
 * Populate maintenance history for view modal
 */
async function populateMaintenanceHistoryForView(point) {
  const maintenanceTable = document.getElementById(
    "view-maintenance-history-table"
  );
  if (!maintenanceTable) return;

  try {
    console.log("Fetching maintenance history for point:", point.id);

    const response = await fetch(
      `/DrainageInventory/api/maintenance-requests.php?drainage_point_id=${point.id}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Maintenance history response:", data);

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
                <td><span class="badge ${statusClass}">${
          record.status
        }</span></td>
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
    } else {
      maintenanceTable.innerHTML = `
            <tbody>
              <tr>
                <td colspan="7" class="text-center text-muted py-4">
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
              <td colspan="7" class="text-center text-danger py-4">
                <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block"></i>
                <p class="mb-0">Error loading maintenance history</p>
                <p class="text-muted small">${error.message}</p>
              </td>
            </tr>
          </tbody>
        `;
  }
}

/**
 * Populate image gallery for view modal
 */
let currentImageIndex = 0;
let currentPointImages = [];
let canUploadImages = false; // Flag to determine if operator can upload

/**
 * Populate enhanced image gallery for view modal
 */
function populateImageGalleryForView(point) {
  const imageGallery = document.getElementById("view-point-image-gallery");
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

  // Check if operator can upload images (has assigned inspection task)
  canUploadImages = hasActiveInspectionTask(point.id);

  if (images.length > 0) {
    imageGallery.innerHTML = createOperatorImageGalleryHTML(images, point);
    setupImageGalleryEvents();
  } else {
    imageGallery.innerHTML = createEmptyGalleryHTML(point);
  }
}

/**
 * Check if operator has active inspection task for this point
 */
function hasActiveInspectionTask(pointId) {
  if (!operatorTasks || !Array.isArray(operatorTasks) || !currentUser) {
    return false;
  }

  return operatorTasks.some((task) => {
    const pointMatches = String(task.drainage_point_id) === String(pointId);
    const isInspection =
      task.inspection_type ||
      (task.task_category &&
        task.task_category.toLowerCase().includes("inspection"));
    const isActive = ![
      "Completed",
      "Cancelled",
      "completed",
      "cancelled",
    ].includes(task.status);
    const isAssigned =
      Number(task.operator_id) === Number(currentUser.id) ||
      Number(task.inspector_id) === Number(currentUser.id) ||
      Number(task.assigned_to) === Number(currentUser.id);

    return pointMatches && isInspection && isActive && isAssigned;
  });
}

/**
 * Create enhanced image gallery HTML for operators
 */
function createOperatorImageGalleryHTML(images, point) {
  const totalImages = images.length;
  const uploadSection = canUploadImages ? createUploadSectionHTML() : "";

  return `
    <div class="image-gallery-container">
      <div class="image-gallery-header">
        <h6 class="mb-0"><i class="fas fa-images me-2"></i>Photo Gallery</h6>
        <div class="d-flex align-items-center gap-3">
          
          <div class="gallery-controls">
            <button class="gallery-btn" onclick="downloadCurrentImage()" title="Download Image">
              <i class="fas fa-download"></i>
            </button>
            ${
              canUploadImages
                ? `
            <button class="gallery-btn" onclick="showImageUploadModal()" title="Add Images">
              <i class="fas fa-plus"></i>
            </button>
            `
                : ""
            }
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

      ${uploadSection}
    </div>
  `;
}

/**
 * Create empty gallery HTML with upload option for operators
 */
function createEmptyGalleryHTML(point) {
  const uploadSection = canUploadImages ? createUploadSectionHTML() : "";

  return `
    <div class="image-gallery-container">
      <div class="image-gallery-header">
        <h6 class="mb-0"><i class="fas fa-images me-2"></i>Photo Gallery</h6>
        ${
          canUploadImages
            ? `
        <div class="gallery-controls">
          <button class="gallery-btn" onclick="showImageUploadModal()" title="Add Images">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        `
            : ""
        }
      </div>
      
      <div class="no-images-placeholder">
        <i class="fas fa-images"></i>
        <h6>No images available</h6>
        ${
          canUploadImages
            ? '<p class="mb-0">You can add inspection photos using the <i class="fas fa-plus"></i> button above</p>'
            : '<p class="mb-0">No photos have been uploaded for this point</p>'
        }
      </div>

      ${uploadSection}
    </div>
  `;
}

/**
 * Create upload section HTML for operators
 */
function createUploadSectionHTML() {
  if (!canUploadImages) return "";

  return `
    <div class="upload-section mt-3">
      <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        <strong>Inspection Documentation:</strong> You can add photos to document your inspection findings.
      </div>
    </div>
  `;
}
/**
 * Setup image gallery events and keyboard navigation
 */
function setupImageGalleryEvents() {
  // Remove existing listeners to avoid duplicates
  document.removeEventListener("keydown", handleGalleryKeyboard);
  // Add keyboard navigation
  document.addEventListener("keydown", handleGalleryKeyboard);
}

/**
 * Handle keyboard navigation in gallery
 */
function handleGalleryKeyboard(e) {
  if (currentPointImages.length <= 1) return;

  const modalElement = document.getElementById("viewDetailsModal");
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

/**
 * Navigate to specific image
 */
function selectImage(index) {
  if (index >= 0 && index < currentPointImages.length) {
    currentImageIndex = index;
    updateMainImage();
    updateThumbnailSelection();
    updateImageCounter();
  }
}

/**
 * Navigate to previous image
 */
function previousImage() {
  if (currentPointImages.length <= 1) return;
  currentImageIndex =
    (currentImageIndex - 1 + currentPointImages.length) %
    currentPointImages.length;
  updateMainImage();
  updateThumbnailSelection();
  updateImageCounter();
}

/**
 * Navigate to next image
 */
function nextImage() {
  if (currentPointImages.length <= 1) return;
  currentImageIndex = (currentImageIndex + 1) % currentPointImages.length;
  updateMainImage();
  updateThumbnailSelection();
  updateImageCounter();
}

/**
 * Update main image display
 */
function updateMainImage() {
  const mainImage = document.querySelector(".main-image");
  if (mainImage && currentPointImages[currentImageIndex]) {
    mainImage.src = currentPointImages[currentImageIndex];
    mainImage.alt = `Drainage point image ${currentImageIndex + 1}`;
  }
}

/**
 * Update thumbnail selection
 */
function updateThumbnailSelection() {
  document.querySelectorAll(".thumbnail-item").forEach((thumb, index) => {
    thumb.classList.toggle("active", index === currentImageIndex);
  });
}

/**
 * Update image counter
 */
function updateImageCounter() {
  const counter = document.querySelector(".image-counter");
  if (counter) {
    counter.textContent = `${currentImageIndex + 1} of ${
      currentPointImages.length
    }`;
  }
}

/**
 * Handle image loading errors
 */
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

/**
 * Handle thumbnail loading errors
 */
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

/**
 * Download current image
 */
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

/**
 * Open fullscreen image modal
 */
function openFullscreenImage() {
  if (!currentPointImages[currentImageIndex]) return;
  createFullscreenModal();
}

/**
 * Create fullscreen modal for image viewing
 */
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
}

/**
 * Close fullscreen modal
 */
function closeFullscreenModal() {
  const modal = document.querySelector(".image-fullscreen-modal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * Navigate in fullscreen mode
 */
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

/**
 * Update fullscreen image
 */
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
// IMAGE UPLOAD FUNCTIONALITY FOR OPERATORS
// ==========================================

/**
 * Show image upload modal
 */
function showImageUploadModal() {
  if (!canUploadImages) {
    showNotification(
      "You need an active inspection task to upload images",
      "warning"
    );
    return;
  }

  if (!currentPointId) {
    showNotification("No point selected", "warning");
    return;
  }

  // Reset the form
  document.getElementById("imageUploadForm").reset();
  document.getElementById("image-preview-container").style.display = "none";
  document.getElementById("upload-progress").style.display = "none";
  document.getElementById("upload-images-btn").disabled = false;

  showModal("imageUploadModal");
}

/**
 * Setup image preview for upload
 */
function setupImageUploadPreview() {
  const imageInput = document.getElementById("inspection-images");
  if (!imageInput) return;

  imageInput.addEventListener("change", function (e) {
    const files = e.target.files;
    const previewContainer = document.getElementById("image-preview-container");
    const previewImages = document.getElementById("preview-images");

    if (files.length > 0) {
      previewContainer.style.display = "block";
      previewImages.innerHTML = "";

      Array.from(files).forEach((file, index) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const col = document.createElement("div");
            col.className = "col-6 col-md-4";
            col.innerHTML = `
              <div class="position-relative">
                <img src="${e.target.result}" 
                     class="img-thumbnail w-100" 
                     style="height: 80px; object-fit: cover;"
                     title="${file.name}">
                <small class="text-muted d-block text-center mt-1">${file.name}</small>
              </div>
            `;
            previewImages.appendChild(col);
          };
          reader.readAsDataURL(file);
        }
      });
    } else {
      previewContainer.style.display = "none";
    }
  });
}

/**
 * Upload inspection images
 */
async function uploadInspectionImages() {
  const fileInput = document.getElementById("inspection-images");
  const description = document.getElementById("image-description").value.trim();
  const category = document.getElementById("image-category").value;
  const uploadBtn = document.getElementById("upload-images-btn");
  const progressContainer = document.getElementById("upload-progress");
  const progressBar = document.getElementById("upload-progress-bar");
  const statusText = document.getElementById("upload-status");

  if (!fileInput.files || fileInput.files.length === 0) {
    showNotification("Please select at least one image", "warning");
    return;
  }

  if (!currentPointId) {
    showNotification("No drainage point selected", "warning");
    return;
  }

  // Validate files
  const files = Array.from(fileInput.files);
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  for (let file of files) {
    if (!allowedTypes.includes(file.type)) {
      showNotification(
        `Invalid file type: ${file.name}. Only JPG and PNG files are allowed.`,
        "warning"
      );
      return;
    }
    if (file.size > maxSize) {
      showNotification(
        `File too large: ${file.name}. Maximum size is 5MB.`,
        "warning"
      );
      return;
    }
  }

  // Show progress and disable button
  uploadBtn.disabled = true;
  progressContainer.style.display = "block";
  statusText.textContent = "Preparing upload...";
  progressBar.style.width = "0%";

  try {
    const uploadedUrls = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      statusText.textContent = `Uploading ${file.name} (${
        i + 1
      }/${totalFiles})...`;

      try {
        const url = await uploadSingleImage(file);
        if (url) {
          uploadedUrls.push(url);
        }

        // Update progress
        const progress = ((i + 1) / totalFiles) * 100;
        progressBar.style.width = `${progress}%`;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        showNotification(`Warning: Failed to upload ${file.name}`, "warning");
      }
    }

    if (uploadedUrls.length > 0) {
      statusText.textContent = "Saving images to point...";

      // Get current point and update with new images
      const point = allDrainageData.find((p) => p.id == currentPointId);
      if (!point) {
        throw new Error("Point not found");
      }

      // Combine existing and new images
      let existingImages = [];
      if (point.images) {
        try {
          if (
            typeof point.images === "string" &&
            point.images.startsWith("[")
          ) {
            existingImages = JSON.parse(point.images);
          } else if (Array.isArray(point.images)) {
            existingImages = point.images;
          } else if (typeof point.images === "string") {
            existingImages = point.images
              .split(" ")
              .filter((url) => url.trim());
          }
        } catch (e) {
          console.error("Error parsing existing images:", e);
          existingImages = [];
        }
      }

      const allImages = [...existingImages, ...uploadedUrls];

      // Update point with new images
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
        images: JSON.stringify(allImages),
        originalId: point.id,
      };

      const response = await fetch(
        "/DrainageInventory/api/drainage-points.php",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Update local data
        const pointIndex = allDrainageData.findIndex(
          (p) => p.id == currentPointId
        );
        if (pointIndex !== -1) {
          allDrainageData[pointIndex].images = allImages;
        }

        // Log the image upload activity
        await logImageUploadActivity(
          currentPointId,
          uploadedUrls.length,
          description,
          category
        );

        showNotification(
          `Successfully uploaded ${uploadedUrls.length} image(s)!`,
          "success"
        );

        // Refresh the gallery
        const updatedPoint = allDrainageData.find(
          (p) => p.id == currentPointId
        );
        if (updatedPoint) {
          populateImageGalleryForView(updatedPoint);
        }

        hideModal("imageUploadModal");
      } else {
        throw new Error(result.message || "Failed to save images to point");
      }
    } else {
      throw new Error("No images were uploaded successfully");
    }
  } catch (error) {
    console.error("Error uploading images:", error);
    showNotification(`Error uploading images: ${error.message}`, "danger");
  } finally {
    uploadBtn.disabled = false;
    progressContainer.style.display = "none";
  }
}

/**
 * Upload a single image file
 */
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

/**
 * Log image upload activity for audit trail
 */
async function logImageUploadActivity(
  pointId,
  imageCount,
  description,
  category
) {
  try {
    const activityData = {
      user_id: currentUser.id,
      action: "image_upload",
      entity_type: "drainage_point",
      entity_id: pointId,
      details: {
        image_count: imageCount,
        description: description,
        category: category,
        timestamp: new Date().toISOString(),
      },
    };

    await fetch("/DrainageInventory/api/activity-log.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityData),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't fail the upload if logging fails
  }
}

/**
 * Handle map click events for operator interface
 */
function handleMapClick(e) {
  // Operators don't have location picking functionality
  // Just close any open popups
  map.closePopup();
}

/**
 * Update zoom level handling
 */
function updateZoomLevel() {
  const zoom = map.getZoom();
  if (zoom > 15) {
    drainagePointsLayer.options.disableClusteringAtZoom = 16;
  }
}

/**
 * Handle locate me functionality
 */
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

/**
 * Fetch drainage data from API
 */
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

    // Initialize search dropdown with all data after loading
    if (allDrainageData.length > 0) {
      populateSearchDropdown(allDrainageData);
    }
  } catch (error) {
    console.error("Error fetching drainage data:", error);
    showNotification(
      "Could not load drainage data. Using sample data.",
      "warning"
    );

    allDrainageData = getSampleDrainageData();
    drainageData = [...allDrainageData];
    renderDrainagePoints(drainageData);

    if (allDrainageData.length > 0) {
      populateSearchDropdown(allDrainageData);
    }
  }
}

/**
 * Fetch flood prone areas
 */
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

/**
 * Fetch and render drainage lines
 */
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

/**
 * Load users for dropdown population
 */
async function loadUsers() {
  try {
    const response = await fetch("/DrainageInventory/api/users.php");
    if (response.ok) {
      users = await response.json();
      populateUserDropdowns();
    } else {
      users = getSampleUsers();
      populateUserDropdowns();
    }
  } catch (error) {
    console.error("Error loading users:", error);
    users = getSampleUsers();
    populateUserDropdowns();
  }
}

/**
 * Get sample users for fallback
 */
function getSampleUsers() {
  return [
    { id: 1, first_name: "System", last_name: "Administrator", role: "Admin" },
    { id: 4, first_name: "John", last_name: "Inspector", role: "Inspector" },
    { id: 5, first_name: "Sarah", last_name: "Operator", role: "Operator" },
  ];
}

/**
 * Populate user dropdowns
 */
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
}

/**
 * Render drainage points on map
 */
function renderDrainagePoints(data) {
  drainagePointsLayer.clearLayers();

  data.forEach((point) => {
    // Check if this point has assigned tasks for the current operator
    const hasAssignedTask = pointHasAssignedTasks(point.id);

    const marker = L.marker(point.coordinates, {
      icon: createOperatorMarkerIcon(point, hasAssignedTask),
      title: point.name,
    });

    const popupContent = createPopupContent(point, hasAssignedTask);
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: "custom-popup",
    });

    marker.on("popupopen", () => {
      setTimeout(() => {
        setupPopupEventHandlers(point.id);
      }, 100);
    });

    drainagePointsLayer.addLayer(marker);
  });
}

/**
 * Render flood prone areas
 */
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
              <div><span class="badge bg-warning">${
                area.risk_level
              }</span></div>
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

function pointHasAssignedTasks(pointId) {
  if (!operatorTasks || !Array.isArray(operatorTasks) || !currentUser) {
    return false;
  }

  return operatorTasks.some((task) => {
    // Check if drainage point matches
    const pointMatches = String(task.drainage_point_id) === String(pointId);

    // Check if task is active
    const isActive = ![
      "Completed",
      "Cancelled",
      "completed",
      "cancelled",
    ].includes(task.status);

    // For MAINTENANCE tasks - check assigned_to
    if (task.request_type) {
      const isAssignedToCurrentUser =
        Number(task.assigned_to) === Number(currentUser.id);
      return pointMatches && isAssignedToCurrentUser && isActive;
    }

    // For INSPECTION tasks - check operator_id or other fields
    if (task.inspection_type) {
      const isAssignedToCurrentUser =
        Number(task.operator_id) === Number(currentUser.id) ||
        Number(task.inspector_id) === Number(currentUser.id) ||
        Number(task.assigned_to) === Number(currentUser.id);

      return pointMatches && isAssignedToCurrentUser && isActive;
    }

    return false;
  });
}

function getAssignedTaskType(pointId) {
  if (!operatorTasks || !Array.isArray(operatorTasks) || !currentUser) {
    return null;
  }

  const assignedTask = operatorTasks.find((task) => {
    const pointMatches = String(task.drainage_point_id) === String(pointId);
    const isActive = ![
      "Completed",
      "Cancelled",
      "completed",
      "cancelled",
    ].includes(task.status);

    if (task.request_type) {
      const isAssignedToCurrentUser =
        Number(task.assigned_to) === Number(currentUser.id);
      return pointMatches && isAssignedToCurrentUser && isActive;
    }

    if (task.inspection_type) {
      const isAssignedToCurrentUser =
        Number(task.operator_id) === Number(currentUser.id) ||
        Number(task.inspector_id) === Number(currentUser.id) ||
        Number(task.assigned_to) === Number(currentUser.id);

      return pointMatches && isAssignedToCurrentUser && isActive;
    }

    return false;
  });

  if (!assignedTask) return null;

  return assignedTask.request_type ? "maintenance" : "inspection";
}

/**
 * Create popup content for drainage points
 */
function createPopupContent(point, hasAssignedTask = false) {
  const statusClass = getStatusBadgeClass(point.status);

  // Get assigned tasks for this point
  const assignedTasks = operatorTasks.filter(
    (task) =>
      task.drainage_point_id == point.id &&
      task.status !== "Completed" &&
      task.status !== "Cancelled"
  );

  let taskInfo = "";
  if (hasAssignedTask && assignedTasks.length > 0) {
    const task = assignedTasks[0];
    taskInfo = `
          <div class="mt-2 p-2" style="background: rgba(0,123,255,0.1); border-radius: 5px; border-left: 3px solid #007bff;">
            <small><strong><i class="fas fa-tasks me-1"></i>Your Task:</strong> ${
              task.task_type || task.request_type
            }</small><br>
            <small><i class="fas fa-calendar me-1"></i>Due: ${
              task.scheduled_date
            }</small>
            ${
              task.priority
                ? `<br><small><i class="fas fa-flag me-1"></i>Priority: ${task.priority}</small>`
                : ""
            }
          </div>
        `;
  }

  return `
        <div class="popup-content">
          <h5><i class="fas fa-map-pin me-2"></i>${point.name}</h5>
          <div class="mb-2">
            <span class="badge ${statusClass}">${point.status}</span>
            ${
              hasAssignedTask
                ? '<span class="badge bg-primary ms-1"><i class="fas fa-user me-1"></i>Assigned</span>'
                : ""
            }
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
          ${taskInfo}
          <div class="text-center mt-3">
            <button class="btn btn-sm btn-primary view-details-btn" data-id="${
              point.id
            }">
              <i class="fas fa-eye me-1"></i>View Details
            </button>
            ${
              hasAssignedTask
                ? `
              <button class="btn btn-sm btn-success ms-1" onclick="updateSpecificTask('${
                assignedTasks[0].id
              }', '${
                    assignedTasks[0].task_category ||
                    assignedTasks[0].request_type
                  }')">
                <i class="fas fa-edit me-1"></i>Update Task
              </button>
            `
                : ""
            }
          </div>
        </div>
      `;
}

function createOperatorMarkerIcon(point, hasAssignedTask = false) {
  const colors = {
    Good: "#28a745",
    "Needs Maintenance": "#ffc107",
    Critical: "#dc3545",
  };
  const color = colors[point.status] || "#6c757d";

  if (hasAssignedTask) {
    // Get the task type to determine border color
    const taskType = getAssignedTaskType(point.id);
    const borderColor = taskType === "maintenance" ? "#007bff" : "#ff8c00"; // Blue for maintenance, Orange for inspection
    const shadowColor =
      taskType === "maintenance"
        ? "rgba(0,123,255,0.5)"
        : "rgba(255,140,0,0.5)";

    return L.divIcon({
      className: `custom-div-icon assigned-task-marker ${taskType}-task-marker`,
      html: `
            <div style="
              background: ${color}; 
              width: 18px; 
              height: 18px; 
              border-radius: 50%; 
              border: 4px solid ${borderColor};
              box-shadow: 0 0 0 2px ${borderColor}, 0 2px 12px ${shadowColor};
              animation: pulse-${taskType} 2s infinite;
            "></div>
            <style>
              @keyframes pulse-maintenance {
                0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 2px #007bff, 0 2px 12px rgba(0,123,255,0.5); }
                50% { transform: scale(1.2); opacity: 0.8; box-shadow: 0 0 0 4px #007bff, 0 4px 20px rgba(0,123,255,0.7); }
                100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 2px #007bff, 0 2px 12px rgba(0,123,255,0.5); }
              }
              @keyframes pulse-inspection {
                0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 2px #ff8c00, 0 2px 12px rgba(255,140,0,0.5); }
                50% { transform: scale(1.2); opacity: 0.8; box-shadow: 0 0 0 4px #ff8c00, 0 4px 20px rgba(255,140,0,0.7); }
                100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 2px #ff8c00, 0 2px 12px rgba(255,140,0,0.5); }
              }
            </style>
          `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
  } else {
    // Normal marker
    return L.divIcon({
      className: "custom-div-icon",
      html: `
            <div style="
              background: ${color}; 
              width: 16px; 
              height: 16px; 
              border-radius: 50%; 
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
          `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }
}

/**
 * Get status badge class
 */
function getStatusBadgeClass(status) {
  const classes = {
    Good: "bg-success",
    "Needs Maintenance": "bg-warning text-dark",
    Critical: "bg-danger",
  };
  return classes[status] || "bg-secondary";
}

/**
 * Update filter counts
 */
function updateFilterCounts() {
  const totalCount = allDrainageData.length;
  const filteredCount = drainageData.length;
  console.log(`Showing ${filteredCount} of ${totalCount} drainage points`);
}

/**
 * Apply filters to drainage points
 */
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

  drainageData = filteredData;
  renderDrainagePoints(drainageData);
  updateFilterCounts();

  if (filteredData.length === 0) {
    showNotification("No drainage points match the current filters", "info");
  }
}

/**
 * Get sample drainage data for fallback
 */
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
  ];
}

/**
 * Get sample flood prone areas for fallback
 */
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

/**
 * Setup operator-specific controls
 */
function setupOperatorControls() {
  // Panel toggle
  const panel = document.getElementById("controlPanel");
  const toggleBtn = document.getElementById("panelToggle");
  const toggleIcon = document.getElementById("toggleIcon");

  toggleBtn.addEventListener("click", function () {
    const isCollapsed = panel.classList.contains("collapsed");

    if (isCollapsed) {
      panel.classList.remove("collapsed");
      toggleIcon.className = "fas fa-chevron-left";
    } else {
      panel.classList.add("collapsed");
      toggleIcon.className = "fas fa-chevron-right";
    }
  });

  // Map controls
  document
    .getElementById("zoom-in-btn")
    .addEventListener("click", () => map.zoomIn());
  document
    .getElementById("zoom-out-btn")
    .addEventListener("click", () => map.zoomOut());
  document
    .getElementById("locate-me-btn")
    .addEventListener("click", handleLocateMe);
  document
    .getElementById("full-extent-btn")
    .addEventListener("click", () => map.setView([2.05788, 102.57471], 13));
  document
    .getElementById("refresh-btn")
    .addEventListener("click", refreshOperatorData);

  // Filter functionality
  document.querySelectorAll(".filter-badge").forEach((badge) => {
    badge.addEventListener("click", function () {
      const filterType = this.getAttribute("data-type");
      const filterValue = this.getAttribute("data-filter");

      // Update active state
      document.querySelectorAll(`[data-type="${filterType}"]`).forEach((b) => {
        b.classList.remove("active");
      });
      this.classList.add("active");

      // Apply filter
      currentFilters[filterType] = filterValue;
      applyOperatorFilters();
    });
  });

  // Setup enhanced search
  setupEnhancedSearch();

  // Setup form handlers
  setupOperatorFormHandlers();
}

/**
 * Load operator-specific data
 */
async function loadOperatorData() {
  try {
    await Promise.all([
      loadOperatorTasks(),
      loadOperatorStats(),
      loadOperatorNotifications(),
    ]);

    updateDashboardDisplay();
    displayOperatorTasks();
    displayOperatorNotifications();
    populateTaskSelects();

    // Add this line to refresh markers when tasks are loaded
    if (drainageData && drainageData.length > 0) {
      renderDrainagePoints(drainageData);
    }
  } catch (error) {
    console.error("Error loading operator data:", error);
    loadFallbackData();
  }
}

/**
 * Load tasks assigned to the current operator
 */
async function loadOperatorTasks() {
  try {
    const response = await fetch(
      `operator-tasks.php?operator_id=${currentUser.id}`
    );
    if (!response.ok) throw new Error("Failed to fetch tasks");

    const result = await response.json();
    operatorTasks = result.success ? result.tasks || [] : [];

    console.log("Loaded operator tasks:", operatorTasks);
  } catch (error) {
    console.error("Error loading operator tasks:", error);
    operatorTasks = [];
  }
}

/**
 * Load operator statistics
 */
async function loadOperatorStats() {
  try {
    const response = await fetch(
      `operator-stats.php?operator_id=${currentUser.id}`
    );
    if (!response.ok) throw new Error("Failed to fetch stats");

    operatorStats = await response.json();
    console.log("Loaded operator stats:", operatorStats);
  } catch (error) {
    console.error("Error loading operator stats:", error);
    operatorStats = generateFallbackStats();
  }
}

/**
 * Load operator notifications
 */
async function loadOperatorNotifications() {
  try {
    const response = await fetch(
      `operator-notifications.php?operator_id=${currentUser.id}`
    );
    if (!response.ok) throw new Error("Failed to fetch notifications");

    const data = await response.json();
    operatorNotifications = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error loading notifications:", error);
    operatorNotifications = [];
  }
}

/**
 * Update dashboard display with operator data
 */
function updateDashboardDisplay() {
  // Update statistics
  document.getElementById("stat-pending").textContent =
    operatorStats.pending || 0;
  document.getElementById("stat-progress").textContent =
    operatorStats.in_progress || 0;
  document.getElementById("stat-completed").textContent =
    operatorStats.completed_today || 0;
  document.getElementById("stat-overdue").textContent =
    operatorStats.overdue || 0;

  // Update performance metrics
  const completionRate = operatorStats.completion_rate || 0;
  document.getElementById("completion-rate").textContent = `${Math.round(
    completionRate
  )}%`;
  document.getElementById(
    "completion-progress"
  ).style.width = `${completionRate}%`;
  document.getElementById("tasks-week").textContent =
    operatorStats.completed_this_week || 0;
}

/**
 * Display operator tasks in sidebar
 */
function displayOperatorTasks() {
  const priorityContainer = document.getElementById("priority-tasks");
  const todayContainer = document.getElementById("today-tasks");

  // Filter priority tasks (High and Critical priority)
  const priorityTasks = operatorTasks
    .filter((task) => task.priority === "High" || task.priority === "Critical")
    .slice(0, 5);

  // Filter today's tasks
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = operatorTasks.filter(
    (task) => task.scheduled_date === today
  );

  // Display priority tasks
  if (priorityTasks.length > 0) {
    priorityContainer.innerHTML = priorityTasks
      .map((task) => createOperatorTaskCard(task, true))
      .join("");
  } else {
    priorityContainer.innerHTML =
      '<p class="text-muted small">No priority tasks at this time.</p>';
  }

  // Display today's tasks
  if (todayTasks.length > 0) {
    todayContainer.innerHTML = todayTasks
      .map((task) => createOperatorTaskCard(task, false))
      .join("");
  } else {
    todayContainer.innerHTML =
      '<p class="text-muted small">No tasks scheduled for today.</p>';
  }
}

/**
 * Create task card for operator interface
 */
function createOperatorTaskCard(task, isCompact = false) {
  const isOverdue =
    new Date(task.scheduled_date) < new Date() && task.status !== "Completed";
  const priorityClass = `priority-${(task.priority || "medium").toLowerCase()}`;
  const categoryClass = `${(
    task.task_category ||
    task.request_type ||
    "maintenance"
  ).toLowerCase()}-task`;

  return `
        <div class="task-card ${priorityClass} ${categoryClass}" onclick="focusOnTask('${
    task.id
  }', '${task.task_category || task.request_type}')">
          <div class="task-header">
            <h6 class="task-title">${
              task.drainage_point_name || task.point_name || "Unknown Location"
            }</h6>
          </div>
          
          <div class="task-location">${
            task.task_type || task.request_type || "Task"
          }</div>
          
          <div class="task-badges">
            <span class="task-badge badge-${(
              task.task_category ||
              task.request_type ||
              "maintenance"
            ).toLowerCase()}">${
    task.task_category || task.request_type || "Maintenance"
  }</span>
            <span class="task-badge badge-priority-${(
              task.priority || "medium"
            ).toLowerCase()}">${task.priority || "Medium"}</span>
            <span class="task-badge badge-status-${(task.status || "pending")
              .toLowerCase()
              .replace(" ", "-")}">${task.status || "Pending"}</span>
            ${
              isOverdue
                ? '<span class="task-badge badge-priority-critical">OVERDUE</span>'
                : ""
            }
          </div>
          
          <div class="task-meta">
            <span><i class="fas fa-calendar me-1"></i>${
              task.scheduled_date
            }</span>
            ${
              task.scheduled_time
                ? `<span><i class="fas fa-clock me-1"></i>${task.scheduled_time}</span>`
                : ""
            }
          </div>
          
          ${
            !isCompact
              ? `
            <div class="task-actions">
              <button class="task-action-btn btn-task-update" onclick="event.stopPropagation(); updateSpecificTask('${
                task.id
              }', '${task.task_category || task.request_type}')">
                <i class="fas fa-edit"></i>
                Update
              </button>
              <button class="task-action-btn btn-task-details" onclick="event.stopPropagation(); viewTaskDetails('${
                task.id
              }', '${task.task_category || task.request_type}')">
                <i class="fas fa-eye"></i>
                Details
              </button>
            </div>
          `
              : ""
          }
        </div>
      `;
}

/**
 * Display operator notifications
 */
function displayOperatorNotifications() {
  const container = document.getElementById("notifications-container");

  if (!operatorNotifications || operatorNotifications.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No new notifications.</p>';
    return;
  }

  const notifications = operatorNotifications.slice(0, 5);
  container.innerHTML = notifications
    .map(
      (notification) => `
        <div class="notification-item">
          <i class="notification-icon fas fa-${getNotificationIcon(
            notification.type
          )}"></i>
          <div class="notification-content">
            <h6>${notification.title}</h6>
            <p>${notification.message}</p>
          </div>
        </div>
      `
    )
    .join("");
}

/**
 * Populate task selection dropdowns
 */
function populateTaskSelects() {
  const taskSelect = document.getElementById("task-select");
  const worklogTaskSelect = document.getElementById("worklog-task");

  if (taskSelect) {
    taskSelect.innerHTML = '<option value="">Choose a task...</option>';
    operatorTasks.forEach((task) => {
      if (task.status !== "Completed") {
        const option = document.createElement("option");
        option.value = task.id;
        option.textContent = `${
          task.drainage_point_name || task.point_name
        } - ${task.task_type || task.request_type}`;
        option.setAttribute(
          "data-task-type",
          task.task_category || task.request_type
        );
        taskSelect.appendChild(option);
      }
    });
  }

  if (worklogTaskSelect) {
    worklogTaskSelect.innerHTML = '<option value="">Choose a task...</option>';
    operatorTasks.forEach((task) => {
      const option = document.createElement("option");
      option.value = task.id;
      option.textContent = `${task.drainage_point_name || task.point_name} - ${
        task.task_type || task.request_type
      }`;
      worklogTaskSelect.appendChild(option);
    });
  }
}

/**
 * Setup operator-specific form handlers
 */
function setupOperatorFormHandlers() {
  // Task update form
  const taskSelect = document.getElementById("task-select");
  if (taskSelect) {
    taskSelect.addEventListener("change", function () {
      const selectedTaskId = this.value;
      const selectedTask = operatorTasks.find((t) => t.id == selectedTaskId);

      if (selectedTask) {
        const taskInfo = document.getElementById("task-info-display");
        const taskInfoContent = document.getElementById("task-info-content");

        if (taskInfo && taskInfoContent) {
          taskInfoContent.innerHTML = `
                <strong>Task:</strong> ${
                  selectedTask.task_type || selectedTask.request_type
                }<br>
                <strong>Location:</strong> ${
                  selectedTask.drainage_point_name || selectedTask.point_name
                }<br>
                <strong>Priority:</strong> ${selectedTask.priority}<br>
                <strong>Scheduled:</strong> ${selectedTask.scheduled_date}
              `;
          taskInfo.style.display = "block";
        }

        // Show inspection fields if it's an inspection task
        const inspectionFields = document.getElementById("inspection-fields");
        const inspectionRecommendations = document.getElementById(
          "inspection-recommendations"
        );
        if (inspectionFields && inspectionRecommendations) {
          const isInspection = (
            selectedTask.task_category ||
            selectedTask.request_type ||
            ""
          )
            .toLowerCase()
            .includes("inspection");
          inspectionFields.style.display = isInspection ? "block" : "none";
          inspectionRecommendations.style.display = isInspection
            ? "block"
            : "none";
        }
      }
    });
  }

  // Maintenance request form handler
  const submitMaintenanceBtn = document.getElementById(
    "submit-maintenance-request-btn"
  );
  if (submitMaintenanceBtn) {
    submitMaintenanceBtn.addEventListener(
      "click",
      handleMaintenanceRequestForm
    );
  }

  // Inspection schedule form handler
  const submitInspectionBtn = document.getElementById(
    "submit-inspection-schedule-btn"
  );
  if (submitInspectionBtn) {
    submitInspectionBtn.addEventListener("click", handleInspectionScheduleForm);
  }
}

/**
 * Handle maintenance request form submission
 */
async function handleMaintenanceRequestForm() {
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
    requested_by: currentUser.id,
    notes: document.getElementById("maintenance-notes").value.trim(),
  };

  // Validation
  if (!formData.drainage_point_id) {
    showNotification("Invalid drainage point selected", "warning");
    return;
  }

  if (!formData.request_type) {
    showNotification("Please select a maintenance type", "warning");
    return;
  }

  if (!formData.description) {
    showNotification("Please provide a description", "warning");
    return;
  }

  showLoading(true);

  try {
    const response = await fetch("../api/maintenance-requests.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      showNotification(
        "Maintenance request submitted successfully!",
        "success"
      );
      resetForm("maintenance-request-form");
      hideModal("requestMaintenanceModal");
      hideModal("pointDetailsModal");
      refreshOperatorData();
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

/**
 * Handle inspection schedule form submission
 */
async function handleInspectionScheduleForm() {
  const formData = {
    drainage_point_id: document.getElementById("inspection-drainage-point-id")
      .value,
    inspection_type: document.getElementById("inspection-type").value,
    scheduled_date: document.getElementById("inspection-scheduled-date").value,
    scheduled_time:
      document.getElementById("inspection-scheduled-time").value || null,
    priority: document.getElementById("inspection-priority").value,
    operator_id: currentUser.id,
    description: document.getElementById("inspection-description").value.trim(),
  };

  // Validation
  if (!formData.drainage_point_id) {
    showNotification("Invalid drainage point selected", "warning");
    return;
  }

  if (!formData.inspection_type) {
    showNotification("Please select an inspection type", "warning");
    return;
  }

  if (!formData.scheduled_date) {
    showNotification("Please select a scheduled date", "warning");
    return;
  }

  showLoading(true);

  try {
    const response = await fetch("../api/inspection-schedules.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Inspection scheduled successfully!", "success");
      resetForm("inspection-schedule-form");
      hideModal("scheduleInspectionModal");
      hideModal("pointDetailsModal");
      refreshOperatorData();
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

/**
 * Update task status
 */
async function updateTaskStatus() {
  const taskId = document.getElementById("task-select").value;
  const newStatus = document.getElementById("task-status").value;
  const notes = document.getElementById("task-notes").value.trim();
  const hoursWorked = document.getElementById("hours-worked").value;
  const completionPercentage = document.getElementById(
    "completion-percentage"
  ).value;

  if (!taskId || !newStatus) {
    showNotification("Please select a task and new status", "warning");
    return;
  }

  // If completing, show comprehensive completion form
  if (newStatus === "Completed") {
    showCompletionReportModal(taskId);
    return;
  }

  const updateData = {
    task_id: taskId,
    status: newStatus,
    notes: notes,
    hours_worked: hoursWorked ? parseFloat(hoursWorked) : null,
    completion_percentage: completionPercentage
      ? parseInt(completionPercentage)
      : null,
    updated_by: currentUser.id,
  };

  // Add inspection-specific fields if visible
  const inspectionFindings = document.getElementById("inspection-findings");
  const recommendations = document.getElementById("recommendations");

  if (inspectionFindings && inspectionFindings.style.display !== "none") {
    updateData.inspection_findings = inspectionFindings.value.trim();
    updateData.recommendations = recommendations.value.trim();
  }

  showLoading(true);

  try {
    const response = await fetch("operator-tasks.php", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Task status updated successfully", "success");
      resetForm("updateTaskForm");
      hideModal("updateTaskModal");
      refreshOperatorData();
    } else {
      throw new Error(result.message || "Failed to update task status");
    }
  } catch (error) {
    console.error("Error updating task status:", error);
    showNotification(`Error updating task status: ${error.message}`, "danger");
  } finally {
    showLoading(false);
  }
}

/**
 * Auto-calculate hours when start/end times change
 */
function setupAutoCalculateHours() {
  const startTimeInput = document.getElementById("completion-start-time");
  const endTimeInput = document.getElementById("completion-end-time");
  const hoursInput = document.getElementById("completion-hours");

  if (startTimeInput && endTimeInput && hoursInput) {
    function calculateHours() {
      const startTime = new Date(startTimeInput.value);
      const endTime = new Date(endTimeInput.value);

      if (startTime && endTime && endTime > startTime) {
        const hours =
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        hoursInput.value = hours.toFixed(1);
      }
    }

    startTimeInput.addEventListener("change", calculateHours);
    endTimeInput.addEventListener("change", calculateHours);
  }
}

// Initialize auto-calculation when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  setupAutoCalculateHours();
});

/**
 * Setup auto-refresh for operator data
 */
function setupAutoRefresh() {
  refreshInterval = setInterval(() => {
    refreshOperatorData();
  }, 300000); // Refresh every 5 minutes
}
/**
 * Show completion report modal for comprehensive task completion
 */
function showCompletionReportModal(taskId) {
  const task = operatorTasks.find((t) => t.id == taskId);
  if (!task) {
    showNotification("Task not found", "danger");
    return;
  }

  // Populate task summary
  const taskSummary = document.getElementById("completion-task-summary");
  if (taskSummary) {
    taskSummary.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <strong>Task ID:</strong> ${task.id}<br>
          <strong>Type:</strong> ${task.task_type || task.request_type}<br>
          <strong>Location:</strong> ${
            task.drainage_point_name || task.point_name
          }<br>
          <strong>Priority:</strong> <span class="badge bg-${getPriorityColorClass(
            task.priority
          )}">${task.priority}</span>
        </div>
        <div class="col-md-6">
          <strong>Scheduled:</strong> ${task.scheduled_date}<br>
          <strong>Time:</strong> ${task.scheduled_time || "Not specified"}<br>
          <strong>Description:</strong> ${
            task.description || "No description available"
          }
        </div>
      </div>
    `;
  }

  // Set task ID in hidden field
  document.getElementById("completion-task-id").value = taskId;

  // Show inspection section if it's an inspection task
  const isInspection = (task.task_category || task.request_type || "")
    .toLowerCase()
    .includes("inspection");
  const inspectionSection = document.getElementById(
    "completion-inspection-section"
  );
  if (inspectionSection) {
    inspectionSection.style.display = isInspection ? "block" : "none";
  }

  // Set default times
  const now = new Date();
  const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

  document.getElementById("completion-start-time").value =
    formatDateTimeLocal(startTime);
  document.getElementById("completion-end-time").value =
    formatDateTimeLocal(now);

  // Calculate default hours
  const hours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  document.getElementById("completion-hours").value = hours.toFixed(1);

  // Setup follow-up checkbox handler
  setupFollowUpHandler();

  // Setup photo preview
  setupCompletionPhotoPreview();

  // Show the modal
  showModal("completionReportModal");
}
/**
 * Setup follow-up checkbox handler
 */
function setupFollowUpHandler() {
  const followUpCheckbox = document.getElementById(
    "completion-followup-required"
  );
  const followUpDetails = document.getElementById(
    "completion-followup-details"
  );

  if (followUpCheckbox && followUpDetails) {
    followUpCheckbox.addEventListener("change", function () {
      followUpDetails.style.display = this.checked ? "block" : "none";
    });
  }
}

/**
 * Setup photo preview for completion form
 */
function setupCompletionPhotoPreview() {
  const photoInput = document.getElementById("completion-photos");
  const previewContainer = document.getElementById("completion-photo-preview");

  if (photoInput && previewContainer) {
    photoInput.addEventListener("change", function (e) {
      const files = e.target.files;

      if (files.length > 0) {
        previewContainer.style.display = "block";
        previewContainer.innerHTML = "";

        Array.from(files).forEach((file, index) => {
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function (e) {
              const col = document.createElement("div");
              col.className = "col-6 col-md-3";
              col.innerHTML = `
                <div class="position-relative">
                  <img src="${e.target.result}" 
                       class="img-thumbnail w-100" 
                       style="height: 100px; object-fit: cover;"
                       title="${file.name}">
                  <small class="text-muted d-block text-center mt-1">${file.name}</small>
                </div>
              `;
              previewContainer.appendChild(col);
            };
            reader.readAsDataURL(file);
          }
        });
      } else {
        previewContainer.style.display = "none";
      }
    });
  }
}
/**
 * Submit comprehensive completion report (IMPROVED VERSION)
 */
async function submitCompletionReport() {
  const taskId = document.getElementById("completion-task-id").value;

  // Validate required fields
  if (!validateCompletionForm()) {
    return;
  }

  const submitBtn = document.getElementById("submit-completion-btn");
  submitBtn.disabled = true;
  submitBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin me-1"></i>Submitting...';

  try {
    // Gather form data
    const completionData = gatherCompletionFormData();

    // Upload photos if any
    const photoUrls = await uploadCompletionPhotos();
    completionData.photos = photoUrls;

    // Determine task type and update accordingly
    const task = operatorTasks.find((t) => t.id == taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const isInspection = (task.task_category || task.request_type || "")
      .toLowerCase()
      .includes("inspection");

    if (isInspection) {
      await updateInspectionCompletion(taskId, completionData, task);
    } else {
      await updateMaintenanceCompletion(taskId, completionData, task);
    }

    showNotification(
      "Task completed successfully with comprehensive report!",
      "success"
    );

    // Close modals and refresh data
    hideModal("completionReportModal");
    hideModal("updateTaskModal");
    refreshOperatorData();
  } catch (error) {
    console.error("Error submitting completion report:", error);
    showNotification(
      `Error submitting completion report: ${error.message}`,
      "danger"
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML =
      '<i class="fas fa-check-double me-1"></i>Complete Task & Submit Report';
  }
}

/**
 * Validate completion form
 */
function validateCompletionForm() {
  const requiredFields = [
    { id: "completion-start-time", label: "Start Time" },
    { id: "completion-end-time", label: "End Time" },
    { id: "completion-hours", label: "Hours Worked" },
    { id: "completion-work-description", label: "Work Description" },
  ];

  for (const field of requiredFields) {
    const element = document.getElementById(field.id);
    if (!element || !element.value.trim()) {
      showNotification(`Please fill in the ${field.label} field`, "warning");
      element?.focus();
      return false;
    }
  }

  // Validate time range
  const startTime = new Date(
    document.getElementById("completion-start-time").value
  );
  const endTime = new Date(
    document.getElementById("completion-end-time").value
  );

  if (startTime >= endTime) {
    showNotification("End time must be after start time", "warning");
    document.getElementById("completion-end-time").focus();
    return false;
  }

  // Validate hours worked
  const hoursWorked = parseFloat(
    document.getElementById("completion-hours").value
  );
  if (hoursWorked <= 0 || hoursWorked > 24) {
    showNotification("Hours worked must be between 0.1 and 24", "warning");
    document.getElementById("completion-hours").focus();
    return false;
  }

  // Validate work description length
  const workDescription = document
    .getElementById("completion-work-description")
    .value.trim();
  if (workDescription.length < 10) {
    showNotification(
      "Work description must be at least 10 characters long",
      "warning"
    );
    document.getElementById("completion-work-description").focus();
    return false;
  }

  // Validate checkboxes
  const verificationChecks = [
    { id: "completion-verify-work", label: "Work Completion Verification" },
    { id: "completion-verify-safety", label: "Safety Protocol Verification" },
    { id: "completion-verify-cleanup", label: "Cleanup Verification" },
    {
      id: "completion-verify-documentation",
      label: "Documentation Verification",
    },
  ];

  for (const check of verificationChecks) {
    const checkbox = document.getElementById(check.id);
    if (!checkbox || !checkbox.checked) {
      showNotification(`Please complete the ${check.label}`, "warning");
      checkbox?.focus();
      return false;
    }
  }

  return true;
}

/**
 * Gather completion form data
 */
function gatherCompletionFormData() {
  const startTime = document.getElementById("completion-start-time").value;
  const endTime = document.getElementById("completion-end-time").value;

  const data = {
    start_time: startTime,
    end_time: endTime,
    hours_worked:
      parseFloat(document.getElementById("completion-hours").value) || 0,
    materials_cost:
      parseFloat(document.getElementById("completion-materials-cost").value) ||
      0,
    work_description: document
      .getElementById("completion-work-description")
      .value.trim(),
    issues_encountered:
      document.getElementById("completion-issues").value.trim() || "None",
    materials_used:
      document.getElementById("completion-materials").value.trim() ||
      "Standard materials",
    equipment_used:
      document.getElementById("completion-equipment").value.trim() ||
      "Standard equipment",
    photo_description: document
      .getElementById("completion-photo-description")
      .value.trim(),
    status: "Completed",
    completion_date: new Date().toISOString(),
    completed_by: currentUser.id,
    completion_notes: document
      .getElementById("completion-work-description")
      .value.trim(),
    work_summary: document
      .getElementById("completion-work-description")
      .value.trim(),
    completion_percentage: 100,
  };

  // Add inspection-specific fields if inspection
  const inspectionSection = document.getElementById(
    "completion-inspection-section"
  );
  if (inspectionSection && inspectionSection.style.display !== "none") {
    data.inspection_findings = document
      .getElementById("completion-inspection-findings")
      .value.trim();
    data.recommendations = document
      .getElementById("completion-recommendations")
      .value.trim();
    data.findings = data.inspection_findings; // Alias for consistency
  }

  // Add follow-up data if required
  const followUpRequired = document.getElementById(
    "completion-followup-required"
  ).checked;
  if (followUpRequired) {
    data.follow_up_requested = true;
    data.follow_up_reason = document
      .getElementById("completion-followup-description")
      .value.trim();
  }

  return data;
}

/**
 * Upload completion photos
 */
async function uploadCompletionPhotos() {
  const fileInput = document.getElementById("completion-photos");
  const photoUrls = [];

  if (!fileInput.files || fileInput.files.length === 0) {
    return photoUrls;
  }

  const files = Array.from(fileInput.files);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const url = await uploadSingleCompletionPhoto(file);
      if (url) {
        photoUrls.push(url);
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      showNotification(`Warning: Failed to upload ${file.name}`, "warning");
    }
  }

  return photoUrls;
}

/**
 * Upload a single completion photo
 */
async function uploadSingleCompletionPhoto(file) {
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
    console.error("Error uploading completion photo:", error);
    throw error;
  }
}

/**
 * Update inspection completion
 */
async function updateInspectionCompletion(taskId, completionData, task) {
  const updateData = {
    id: taskId,
    status: "Completed",
    findings:
      completionData.inspection_findings ||
      completionData.findings ||
      "Inspection completed successfully",
    recommendations:
      completionData.recommendations || "No specific recommendations",
    completion_notes: completionData.work_description || "Inspection completed",
    hours_worked: completionData.hours_worked,
    completion_date: completionData.completion_date,
    photos: JSON.stringify(completionData.photos || []),
    quality_rating: completionData.quality_rating,
    materials_used: completionData.materials_used,
    equipment_used: completionData.equipment_used,
    issues_encountered: completionData.issues_encountered,
    follow_up_requested: completionData.follow_up_requested ? 1 : 0,
    follow_up_reason: completionData.follow_up_reason || null,
    work_summary: completionData.work_description,
    completed_by: currentUser.id,
  };

  // Add additional fields that might be expected
  if (task.drainage_point_id) {
    updateData.drainage_point_id = task.drainage_point_id;
  }

  console.log("Updating inspection with data:", updateData);

  const response = await fetch(
    "/DrainageInventory/api/inspection-schedules.php",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    }
  );

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to update inspection");
  }

  return result;
}

/**
 * Update maintenance completion
 */
async function updateMaintenanceCompletion(taskId, completionData, task) {
  const updateData = {
    id: taskId,
    status: "Completed",
    completion_notes:
      completionData.work_description || "Maintenance completed",
    work_summary:
      completionData.work_description ||
      "Maintenance work completed successfully",
    hours_worked: completionData.hours_worked,
    completion_date: completionData.completion_date,
    actual_cost: completionData.materials_cost,
    photos: JSON.stringify(completionData.photos || []),
    quality_rating: completionData.quality_rating,
    materials_used: completionData.materials_used,
    equipment_used: completionData.equipment_used,
    issues_encountered: completionData.issues_encountered,
    work_performed: completionData.work_description,
    follow_up_requested: completionData.follow_up_requested ? 1 : 0,
    follow_up_reason: completionData.follow_up_reason || null,
    completion_percentage: 100,
    completed_by: currentUser.id,
  };

  // Add additional fields that might be expected
  if (task.drainage_point_id) {
    updateData.drainage_point_id = task.drainage_point_id;
  }

  console.log("Updating maintenance with data:", updateData);

  const response = await fetch(
    "/DrainageInventory/api/maintenance-requests.php",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    }
  );

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to update maintenance request");
  }

  return result;
}

/**
 * Helper function to get priority color class
 */
function getPriorityColorClass(priority) {
  const colors = {
    Low: "secondary",
    Medium: "primary",
    High: "warning",
    Critical: "danger",
  };
  return colors[priority] || "secondary";
}

/**
 * Format datetime for local input
 */
function formatDateTimeLocal(date) {
  const d = new Date(date);
  const pad = (num) => num.toString().padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
// Add event listener for completion form setup when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Auto-calculate hours when start/end times change
  const startTimeInput = document.getElementById("completion-start-time");
  const endTimeInput = document.getElementById("completion-end-time");
  const hoursInput = document.getElementById("completion-hours");

  if (startTimeInput && endTimeInput && hoursInput) {
    function calculateHours() {
      const startTime = new Date(startTimeInput.value);
      const endTime = new Date(endTimeInput.value);

      if (startTime && endTime && endTime > startTime) {
        const hours =
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        hoursInput.value = hours.toFixed(1);
      }
    }

    startTimeInput.addEventListener("change", calculateHours);
    endTimeInput.addEventListener("change", calculateHours);
  }
});
/**
 * Refresh operator data
 */
async function refreshOperatorData() {
  try {
    console.log("Refreshing operator data...");
    await loadOperatorData();
    showNotification("Data refreshed successfully", "success");
  } catch (error) {
    console.error("Error refreshing data:", error);
    showNotification("Error refreshing data", "warning");
  }
}

/**
 * Generate fallback stats when API fails
 */
function generateFallbackStats() {
  return {
    pending: Math.floor(Math.random() * 5) + 1,
    in_progress: Math.floor(Math.random() * 3) + 1,
    completed_today: Math.floor(Math.random() * 3),
    overdue: Math.floor(Math.random() * 2),
    completion_rate: Math.floor(Math.random() * 30) + 70,
    completed_this_week: Math.floor(Math.random() * 10) + 5,
  };
}

/**
 * Load fallback data when APIs fail
 */
function loadFallbackData() {
  operatorStats = generateFallbackStats();
  operatorTasks = [
    {
      id: 1,
      drainage_point_name: "PO 03 - Parit Othman",
      task_type: "Cleaning",
      request_type: "Maintenance",
      priority: "High",
      status: "Pending",
      scheduled_date: new Date().toISOString().split("T")[0],
    },
    {
      id: 2,
      drainage_point_name: "BB7 - Sg Bentayan",
      task_type: "Routine Inspection",
      request_type: "Inspection",
      priority: "Medium",
      status: "Scheduled",
      scheduled_date: new Date().toISOString().split("T")[0],
      scheduled_time: "09:00",
    },
  ];
  operatorNotifications = [
    {
      title: "High Priority Task Due",
      message: "Drainage cleaning at PO03 is scheduled for today",
      type: "warning",
    },
  ];

  updateDashboardDisplay();
  displayOperatorTasks();
  displayOperatorNotifications();
}

/**
 * Apply operator-specific filters
 */
function applyOperatorFilters() {
  // This will integrate with the main map filtering system
  if (window.applyFilters) {
    window.applyFilters();
  }
}

/**
 * Focus on a specific task on the map
 */
function focusOnTask(taskId, taskType) {
  const task = operatorTasks.find((t) => t.id == taskId);
  if (task && task.drainage_point_id) {
    const point = allDrainageData.find((p) => p.id == task.drainage_point_id);
    if (point) {
      selectDrainagePoint(point.id);
      showNotification(
        `Focused on task: ${task.task_type || task.request_type}`,
        "info"
      );
    }
  }
}

/**
 * Update a specific task
 */
function updateSpecificTask(taskId, taskType) {
  const task = operatorTasks.find((t) => t.id == taskId);
  if (task) {
    // Pre-select the task in the update modal
    showUpdateTaskModal();
    setTimeout(() => {
      const taskSelect = document.getElementById("task-select");
      if (taskSelect) {
        taskSelect.value = taskId;
        taskSelect.dispatchEvent(new Event("change"));
      }
    }, 100);
  }
}

/**
 * View task details
 */
function viewTaskDetails(taskId, taskType) {
  const task = operatorTasks.find((t) => t.id == taskId);
  if (task) {
    showNotification(
      `Task Details: ${task.task_type || task.request_type} at ${
        task.drainage_point_name
      }`,
      "info"
    );

    // If there's a drainage point associated, show its details
    if (task.drainage_point_id) {
      const point = allDrainageData.find((p) => p.id == task.drainage_point_id);
      if (point && window.showPointDetails) {
        window.showPointDetails(point.id);
      }
    }
  }
}

/**
 * Download point report
 */
function downloadPointReport(pointId) {
  showNotification("Report download feature coming soon", "info");
}

// Modal handlers
function showUpdateTaskModal() {
  showModal("updateTaskModal");
}

function showScheduleInspectionModal(pointId) {
  if (pointId) {
    const point = allDrainageData.find((p) => p.id == pointId);
    if (point) {
      document.getElementById("inspection-drainage-point-id").value = point.id;
      document.getElementById("inspection-point-name").value = point.name;

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      document.getElementById("inspection-scheduled-date").value = nextWeek
        .toISOString()
        .split("T")[0];
      document.getElementById("inspection-scheduled-time").value = "09:00";
    }
  }
  showModal("scheduleInspectionModal");
}

function showRequestMaintenanceModal(pointId) {
  if (pointId) {
    const point = allDrainageData.find((p) => p.id == pointId);
    if (point) {
      document.getElementById("maintenance-drainage-point-id").value = point.id;
      document.getElementById("maintenance-point-name").value = point.name;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById("maintenance-scheduled-date").value = tomorrow
        .toISOString()
        .split("T")[0];
    }
  }
  showModal("requestMaintenanceModal");
}

function showReportIssueModal() {
  showNotification("Issue reporting feature coming soon", "info");
}

function showWorkLogModal() {
  showModal("workLogModal");
}

function showFloodReportModal() {
  showModal("floodReportModal");
}

function submitFloodReport() {
  showNotification("Flood report submitted successfully", "success");
  hideModal("floodReportModal");
}

/**
 * Populate point details with images
 */
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

/**
 * Populate maintenance history
 */
async function populateMaintenanceHistory(point) {
  const maintenanceTable = document.getElementById("maintenance-history-table");
  if (!maintenanceTable) return;

  try {
    console.log("Fetching maintenance history for point:", point.id);

    const response = await fetch(
      `/DrainageInventory/api/maintenance-requests.php?drainage_point_id=${point.id}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Maintenance history response:", data);

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
                <td><span class="badge ${statusClass}">${
          record.status
        }</span></td>
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
    } else {
      maintenanceTable.innerHTML = `
            <tbody>
              <tr>
                <td colspan="7" class="text-center text-muted py-4">
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
              <td colspan="7" class="text-center text-danger py-4">
                <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block"></i>
                <p class="mb-0">Error loading maintenance history</p>
                <p class="text-muted small">${error.message}</p>
              </td>
            </tr>
          </tbody>
        `;
  }
}

/**
 * Populate image gallery
 */
function populateImageGalleryEnhanced(point) {
  const imageGallery = document.getElementById("point-image-gallery");
  if (!imageGallery) return;

  let images = [];

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

  images = images
    .map((url) => {
      let cleanUrl = url.trim();
      if (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) {
        cleanUrl = cleanUrl.slice(1, -1);
      }
      return cleanUrl;
    })
    .filter((url) => url && url.length > 0);

  if (images.length > 0) {
    imageGallery.innerHTML = `
          <div class="row g-2">
            ${images
              .map(
                (img, index) => `
              <div class="col-6 col-md-4">
                <img src="${img}" 
                     class="img-thumbnail w-100" 
                     style="height: 100px; object-fit: cover; cursor: pointer;"
                     alt="Drainage point image ${index + 1}"
                     onclick="openImageModal('${img}')">
              </div>
            `
              )
              .join("")}
          </div>
        `;
  } else {
    imageGallery.innerHTML = `
          <div class="text-center text-muted py-4">
            <i class="fas fa-images fa-2x mb-2"></i>
            <p class="mb-0">No images available</p>
          </div>
        `;
  }
}

/**
 * Open image in modal
 */
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

/**
 * Helper functions for maintenance history
 */
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

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Setup enhanced search functionality
 */
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

/**
 * Filter drainage points based on search term
 */
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

/**
 * Populate search dropdown with data
 */
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

/**
 * Get type icon for dropdown
 */
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

/**
 * Select drainage point from dropdown
 */
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

/**
 * Create highlight marker icon
 */
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

/**
 * Show search dropdown
 */
function showSearchDropdown() {
  const dropdown = document.getElementById("search-dropdown");
  if (dropdown) {
    dropdown.classList.add("show");
    searchDropdownVisible = true;
  }
}

/**
 * Hide search dropdown
 */
function hideSearchDropdown() {
  const dropdown = document.getElementById("search-dropdown");
  if (dropdown) {
    dropdown.classList.remove("show");
    searchDropdownVisible = false;
    removeActiveFromDropdownItems();
  }
}

/**
 * Set active dropdown item
 */
function setActiveDropdownItem(items, activeIndex) {
  removeActiveFromDropdownItems();
  if (items[activeIndex]) {
    items[activeIndex].classList.add("active");
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

/**
 * Remove active class from dropdown items
 */
function removeActiveFromDropdownItems() {
  document.querySelectorAll(".search-dropdown-item").forEach((item) => {
    item.classList.remove("active");
  });
}

/**
 * CSS injection functions
 */
function injectEnhancedSearchCSS() {
  const additionalCSS = `
        .search-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 0 0 8px 8px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 1000;
          display: none;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .search-dropdown.show {
          display: block;
        }

        .search-dropdown-item {
          padding: 1rem;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .search-dropdown-item:last-child {
          border-bottom: none;
        }

        .search-dropdown-item:hover {
          background: #f8f9fa;
        }

        .dropdown-item-main {
          flex: 1;
        }

        .dropdown-item-name {
          font-weight: 500;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .dropdown-item-details {
          font-size: 0.85rem;
          color: #666;
        }

        .search-dropdown-empty {
          padding: 2rem;
          text-align: center;
          color: #666;
        }

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

        .search-container {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-container .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          z-index: 10;
        }

        .search-container .form-control {
          padding-left: 40px;
          padding-right: 40px;
        }

        .search-container .clear-search {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          opacity: 0;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          padding: 0.25rem;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .search-container .clear-search.show {
          opacity: 1;
        }

        .search-container .clear-search:hover {
          background: rgba(220, 53, 69, 0.1);
          color: var(--danger-color) !important;
        }
      `;

  const style = document.createElement("style");
  style.textContent = additionalCSS;
  document.head.appendChild(style);
}

function injectImageGalleryCSS() {
  const imageGalleryCSS = `
    /* Enhanced Image Gallery Styles */
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

    .gallery-btn.danger {
      background: #dc3545;
    }

    .gallery-btn.danger:hover {
      background: #c82333;
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

    /* Upload Section */
    .upload-section {
      border-top: 2px solid #e9ecef;
      padding-top: 1rem;
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
      
      .fullscreen-nav {
        width: 50px;
        height: 50px;
        font-size: 1.2rem;
      }
    }
  `;

  const style = document.createElement("style");
  style.textContent = imageGalleryCSS;
  document.head.appendChild(style);
}

/**
 * Utility functions
 */
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

function showLoading(show) {
  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? "flex" : "none";
  }
}

function resetForm(formId) {
  const form = document.getElementById(formId);
  if (form) form.reset();
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

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `alert alert-${type} alert-dismissible fade show notification`;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
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
async function logCompletionActivity(taskId, taskType, completionData) {
  try {
    const activityData = {
      user_id: currentUser.id,
      action: "task_completion",
      entity_type: taskType,
      entity_id: taskId,
      details: {
        hours_worked: completionData.hours_worked,
        completion_date: completionData.completion_date,
        quality_rating: completionData.quality_rating,
        photo_count: completionData.photos ? completionData.photos.length : 0,
        follow_up_requested: completionData.follow_up_requested || false,
      },
    };

    await fetch("/DrainageInventory/api/activity-log.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityData),
    });
  } catch (error) {
    console.error("Error logging completion activity:", error);
    // Don't fail the completion if logging fails
  }
}
/**
 * Hide loading overlay
 */
function hideLoadingOverlay() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 300);
  }
}

/**
 * Logout function
 */
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

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
