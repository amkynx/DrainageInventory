// Initialize the map
const map = L.map("map", {
  zoomControl: false,
  attributionControl: false,
}).setView([1.9911, 102.5875], 13); // Default center

// Add a tile layer (OpenStreetMap by default)
const osmTileLayer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
  }
).addTo(map);

// Define additional base maps
const satelliteTileLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
  }
);

const terrainTileLayer = L.tileLayer(
  "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 17,
  }
);

const topoTileLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
  }
);

// Layer groups
const drainagePointsLayer = L.markerClusterGroup().addTo(map);
const floodProneAreasLayer = L.layerGroup().addTo(map);
const maintenanceRoutesLayer = L.layerGroup();
const catchmentsLayer = L.layerGroup();
const rainfallLayer = L.layerGroup();

// Global variables
let pickLocationMode = false;
let floodReportLocationMode = false;
let currentPointId = null;
let drainageData = []; // Store all drainage points data

// Function to get status badge class
function getStatusBadgeClass(status) {
  switch (status) {
    case "Good":
      return "bg-success";
    case "Needs Maintenance":
      return "bg-warning";
    case "Critical":
      return "bg-danger";
    default:
      return "bg-secondary";
  }
}

// Function to create marker icons based on status
function createMarkerIcon(status) {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${
      status === "Good"
        ? "#28a745"
        : status === "Needs Maintenance"
        ? "#ffc107"
        : "#dc3545"
    }; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

// Fetch drainage data from the server
async function fetchDrainageData() {
  try {
    const response = await fetch("/DrainageInventory/api/drainage-points.php");
    const data = await response.json();
    console.log("Server Response:", data); // Debugging: Check the server response

    if (!Array.isArray(data)) {
      throw new Error("Invalid data format received from the server");
    }

    drainageData = data; // Store the data globally
    console.log("Drainage Data:", drainageData); // Debugging: Check the drainageData array
    renderDrainagePoints(data);
  } catch (error) {
    console.error("Error fetching drainage data:", error);
    showNotification(
      "Could not load drainage data. Please try again.",
      "danger"
    );
  }
}

// Render drainage points on the map
function renderDrainagePoints(data) {
  // Clear existing markers
  drainagePointsLayer.clearLayers();

  // Add drainage points to the map
  data.forEach((point) => {
    const marker = L.marker(point.coordinates, {
      icon: createMarkerIcon(point.status),
      draggable: false,
      title: point.name,
    });

    // Create popup content
    const popupContent = `
        <div class="popup-content">
          <h5>${point.name} <span class="badge ${getStatusBadgeClass(
      point.status
    )}">${point.status}</span></h5>
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
          <div class="text-center mt-2">
            <button class="btn btn-sm btn-primary view-details-btn" data-id="${
              point.id
            }">View Details</button>
          </div>
        </div>
      `;

    marker.bindPopup(popupContent);
    marker.on("popupopen", function () {
      setTimeout(() => {
        const detailsBtn = document.querySelector(".view-details-btn");
        if (detailsBtn) {
          console.log("View Details button found:", detailsBtn); // Debugging
          detailsBtn.addEventListener("click", function () {
            const pointId = this.getAttribute("data-id");
            console.log("View Details button clicked. Point ID:", pointId); // Debugging
            showPointDetails(pointId); // Call the function to show details
          });
        } else {
          console.error("View Details button not found in popup.");
        }
      }, 100); // Delay to ensure the popup content is rendered
    });

    drainagePointsLayer.addLayer(marker);
  });
}

// Function to show point details modal
// Function to show point details modal
function showPointDetails(pointId) {
  console.log("showPointDetails called with Point ID:", pointId);

  // Set the current point ID global variable
  currentPointId = pointId;
  console.log("currentPointId set to:", currentPointId);

  const point = drainageData.find((p) => p.id == pointId);
  if (!point) {
    console.error("Point not found in drainageData. Point ID:", pointId);
    return;
  }

  console.log("Point details found:", point);

  // Populate details table
  const detailsTable = document.getElementById("point-details-table");
  detailsTable.innerHTML = `
        <tr>
          <th>ID</th>
          <td>${point.id}</td>
        </tr>
        <tr>
          <th>Name</th>
          <td>${point.name}</td>
        </tr>
        <tr>
          <th>Type</th>
          <td>${point.type}</td>
        </tr>
        <tr>
          <th>Status</th>
          <td><span class="badge ${getStatusBadgeClass(point.status)}">${
    point.status
  }</span></td>
        </tr>
        <tr>
          <th>Depth</th>
          <td>${point.depth}m</td>
        </tr>
        <tr>
          <th>Invert Level</th>
          <td>${point.invert_level || "N/A"}</td>
        </tr>
        <tr>
          <th>Reduced Level</th>
          <td>${point.reduced_level || "N/A"}</td>
        </tr>
        <tr>
          <th>Coordinates</th>
          <td>${point.coordinates[0]}, ${point.coordinates[1]}</td>
        </tr>
        <tr>
          <th>Description</th>
          <td>${point.description || "No description available"}</td>
        </tr>
        <tr>
          <th>Last Updated</th>
          <td>${point.last_updated || "N/A"}</td>
        </tr>
      `;

  // Rest of your showPointDetails function remains the same...
  // Populate maintenance history
  const maintenanceTable = document.getElementById("maintenance-history-table");
  if (point.maintenance_history && point.maintenance_history.length > 0) {
    let tableContent = `
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
        `;

    point.maintenance_history.forEach((record) => {
      tableContent += `
            <tr>
              <td>${record.date}</td>
              <td>${record.type}</td>
              <td>${record.description}</td>
              <td><span class="badge ${getStatusBadgeClass(record.status)}">${
        record.status
      }</span></td>
            </tr>
          `;
    });

    tableContent += "</tbody>";
    maintenanceTable.innerHTML = tableContent;
  } else {
    maintenanceTable.innerHTML =
      '<tr><td colspan="4" class="text-center">No maintenance history available</td></tr>';
  }

  // Populate image gallery
  const imageGallery = document.getElementById("point-image-gallery");
  if (point.images) {
    // Check if it's a string (as in your database example)
    if (typeof point.images === "string") {
      // Split by space to separate multiple URLs
      const imageUrls = point.images.split(" https://");

      let galleryContent = "";
      imageUrls.forEach((url, index) => {
        // For all URLs except the first one, we need to add back the "https://"
        // that was removed by the split
        const fullUrl = index === 0 ? url : "https://" + url;
        galleryContent += `<img src="${fullUrl}" alt="Drainage point image" class="img-thumbnail gallery-img">`;
      });

      imageGallery.innerHTML = galleryContent;
    }
    // If it's already an array (as your original code expected)
    else if (Array.isArray(point.images) && point.images.length > 0) {
      let galleryContent = "";
      point.images.forEach((image) => {
        galleryContent += `<img src="${image}" alt="Drainage point image" class="img-thumbnail gallery-img">`;
      });
      imageGallery.innerHTML = galleryContent;
    } else {
      imageGallery.innerHTML =
        '<div class="text-center p-3">No images available</div>';
    }
  } else {
    imageGallery.innerHTML =
      '<div class="text-center p-3">No images available</div>';
  }

  // Make edit and delete buttons visible
  document.getElementById("edit-point-btn").style.display = "inline-block";
  document.getElementById("delete-point-btn").style.display = "inline-block";

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("pointDetailsModal")
  );
  modal.show();
}

// Delete point functionality
document.addEventListener("DOMContentLoaded", function () {
  // Make sure the button exists in the DOM
  const deleteButton = document.getElementById("delete-point-btn");
  if (deleteButton) {
    deleteButton.addEventListener("click", function () {
      console.log("Delete button clicked, currentPointId:", currentPointId);

      if (!currentPointId) {
        showNotification("No point selected for deletion", "warning");
        return;
      }

      const confirmDelete = confirm(
        "Are you sure you want to delete this point?"
      );
      if (!confirmDelete) return;

      deletePoint(currentPointId);
    });
  } else {
    console.error("Delete button not found in the DOM");
  }

  // Edit point functionality
  const editButton = document.getElementById("edit-point-btn");
  if (editButton) {
    editButton.addEventListener("click", function () {
      console.log("Edit button clicked, currentPointId:", currentPointId);

      if (!currentPointId) {
        showNotification("No point selected for editing", "warning");
        return;
      }

      editPoint(currentPointId);
    });
  } else {
    console.error("Edit button not found in the DOM");
  }
});

// Function to delete a point
async function deletePoint(pointId) {
  try {
    console.log("Deleting point with ID:", pointId);

    // Create FormData object for the request
    const formData = new FormData();
    formData.append("id", pointId);

    // Send the DELETE request using fetch
    const response = await fetch(
      `/DrainageInventory/api/delete.php?id=${pointId}`,
      {
        method: "DELETE",
        headers: {
          // No Content-Type header for FormData
        },
        // No body for DELETE request as we're using URL parameters
      }
    );

    console.log("Delete response status:", response.status);

    // Check if response is OK and parse as JSON
    if (!response.ok) {
      const text = await response.text();
      console.error("Server error response:", text);
      throw new Error(`Server returned ${response.status}: ${text}`);
    }

    const result = await response.json();
    console.log("Delete result:", result);

    if (result.success) {
      // Close the details modal
      const detailsModal = bootstrap.Modal.getInstance(
        document.getElementById("pointDetailsModal")
      );
      if (detailsModal) {
        detailsModal.hide();
      }

      showNotification("Point deleted successfully", "success");
      // Refresh the drainage data
      fetchDrainageData();
    } else {
      showNotification("Failed to delete point: " + result.message, "danger");
    }
  } catch (error) {
    console.error("Error in deletePoint function:", error);
    showNotification("Error deleting point: " + error.message, "danger");
  }
}

// Function to edit a point
function editPoint(pointId) {
  console.log("Editing point with ID:", pointId);

  // Find the point in the data
  const point = drainageData.find((p) => p.id == pointId);
  if (!point) {
    showNotification("Point not found", "danger");
    return;
  }

  console.log("Point data to edit:", point);

  // Populate the Add Point Modal with the current point's details
  document.getElementById("point-name").value = point.name;
  document.getElementById("point-type").value = point.type;
  document.getElementById("point-depth").value = point.depth;
  document.getElementById("point-status").value = point.status;
  document.getElementById("point-il").value = point.invert_level || "";
  document.getElementById("point-rl").value = point.reduced_level || "";
  document.getElementById("point-lat").value = point.coordinates[0];
  document.getElementById("point-lng").value = point.coordinates[1];
  document.getElementById("point-description").value = point.description || "";

  // Close the details modal first
  const detailsModal = bootstrap.Modal.getInstance(
    document.getElementById("pointDetailsModal")
  );
  if (detailsModal) {
    detailsModal.hide();
  }

  // Show the Add Point Modal for editing
  setTimeout(() => {
    const editModal = new bootstrap.Modal(
      document.getElementById("addPointModal")
    );
    editModal.show();

    // Function to save the updated point to the server
    async function saveUpdatedPoint(updatedPoint) {
      try {
        const response = await fetch(
          "/DrainageInventory/api/drainage-points.php",
          {
            method: "PUT", // Use PUT for updating
            headers: {
              "Content-Type": "application/json", // Send JSON data
            },
            body: JSON.stringify(updatedPoint), // Convert the updated point to JSON
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update drainage point");
        }

        const result = await response.json();
        if (result.success) {
          showNotification("Point updated successfully", result);
          return true;
        } else {
          showNotification(
            "Failed to update point: " + result.message,
            "danger"
          );
          return false;
        }
      } catch (error) {
        console.error("Error updating point:", error);
        showNotification("Error updating point. Please try again.", "danger");
        return false;
      }
    }
    // Update the Save button to handle editing
    // Replace the save button with a fresh clone to remove all existing listeners
    const oldSaveButton = document.getElementById("save-point-btn");
    const newSaveButton = oldSaveButton.cloneNode(true);
    oldSaveButton.parentNode.replaceChild(newSaveButton, oldSaveButton);

    // Attach a new handler specifically for updating
    newSaveButton.addEventListener("click", async function () {
      const updatedPoint = {
        id: pointId,
        name: document.getElementById("point-name").value,
        type: document.getElementById("point-type").value,
        depth: parseFloat(document.getElementById("point-depth").value) || 0,
        status: document.getElementById("point-status").value,
        invert_level: document.getElementById("point-il").value || "N/A",
        reduced_level: document.getElementById("point-rl").value || "N/A",
        coordinates: [
          parseFloat(document.getElementById("point-lat").value),
          parseFloat(document.getElementById("point-lng").value),
        ],
        description: document.getElementById("point-description").value || "",
      };

      console.log("Saving updated point:", updatedPoint);

      const success = await saveUpdatedPoint(updatedPoint);
      if (success) {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("addPointModal")
        );
        if (modal) {
          modal.hide();
        }

        fetchDrainageData(); // Reload map data
      }
    }); // Small delay to ensure the details modal has closed
  }, 500);
}

// Fetch flood-prone areas from the server
async function fetchFloodProneAreas() {
  try {
    // In a real app, you would fetch from your API
    let response;
    try {
      response = await fetch("/DrainageInventory/api/flood-prone-areas.php");
      if (!response.ok) throw new Error("API not available");
    } catch (err) {
      // If API fails, use sample data
      renderFloodProneAreas(getSampleFloodProneAreas());
      return;
    }

    const data = await response.json();
    renderFloodProneAreas(data);
  } catch (error) {
    console.error("Error fetching flood-prone areas:", error);
    showNotification(
      "Could not load flood-prone areas. Using sample data instead.",
      "warning"
    );
    renderFloodProneAreas(getSampleFloodProneAreas());
  }
}

// Render flood-prone areas on the map
function renderFloodProneAreas(data) {
  // Clear existing layers
  floodProneAreasLayer.clearLayers();

  // Add flood-prone areas to the map
  data.forEach((area) => {
    const polygon = L.polygon(area.coordinates, {
      color: "#17a2b8",
      fillColor: "#17a2b8",
      fillOpacity: 0.3,
      weight: 2,
    }).addTo(floodProneAreasLayer);

    const popupContent = `
        <div class="popup-content">
          <h5>${area.name}</h5>
          <div class="property-row">
            <div class="property-label">Risk Level:</div>
            <div>${area.risk_level}</div>
          </div>
          <div class="property-row">
            <div class="property-label">Last Flood:</div>
            <div>${area.last_flood}</div>
          </div>
        </div>
      `;

    polygon.bindPopup(popupContent);
  });
}

// Save new drainage point
async function saveNewDrainagePoint(newPoint) {
  try {
    const response = await fetch("/DrainageInventory/api/drainage-points.php", {
      method: "POST", // Ensure the method is POST
      headers: {
        "Content-Type": "application/json", // Set the content type to JSON
      },
      body: JSON.stringify(newPoint), // Send the newPoint object as JSON
    });

    if (!response.ok) {
      throw new Error("Failed to save drainage point to the server");
    }

    const result = await response.json();
    if (result.success) {
      return true; // Successfully saved
    } else {
      console.error("Server error:", result.message);
      return false; // Server returned an error
    }
  } catch (error) {
    console.error("Error saving drainage point:", error);
    return false; // Network or other error
  }
}
// Submit flood report
async function submitFloodReport(reportData) {
  try {
    const response = await fetch("/DrainageInventory/api/flood-reports.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData),
    });
    const result = await response.json();
    if (result.success) {
      showNotification("Flood report submitted successfully.", "success");
      return true;
    } else {
      showNotification(
        "Failed to submit flood report: " + result.message,
        "danger"
      );
      return false;
    }
  } catch (error) {
    showNotification("Error submitting flood report.", "danger");
    return false;
  }
}

// Utility function to show notifications
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `alert alert-${type} alert-dismissible fade show notification`;
  notification.role = "alert";
  notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
  document.body.appendChild(notification);

  // Position the notification
  notification.style.position = "fixed";
  notification.style.top = "20px";
  notification.style.right = "20px";
  notification.style.zIndex = "9999";
  notification.style.maxWidth = "400px";

  // Automatically remove the notification after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Show/hide loading overlay
// Show/hide loading overlay
function showLoading(show) {
  let loadingOverlay = document.getElementById("loading-overlay");

  if (!loadingOverlay) {
    // Create loading overlay if it doesn't exist
    loadingOverlay = document.createElement("div");
    loadingOverlay.id = "loading-overlay";
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML = `
        <div class="spinner-container">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
          <div class="mt-3">Loading map data...</div>
        </div>
      `;
    document.body.appendChild(loadingOverlay);
  }

  loadingOverlay.style.display = show ? "flex" : "none";
}

// Usage:
document.addEventListener("DOMContentLoaded", function () {
  showLoading(true); // Show loading

  setTimeout(() => {
    showLoading(false); // Hide after 1.5 seconds
  }, 1500);

  // Rest of your initialization code...
});

// Event Handlers for UI Elements
document.addEventListener("DOMContentLoaded", function () {
  // Initialize map data
  fetchDrainageData();
  fetchFloodProneAreas();

  // Filter overlay toggle
  const collapseBtn = document.getElementById("collapse-overlay");
  const overlay = document.getElementById("filter-overlay");

  collapseBtn.addEventListener("click", () => {
    overlay.classList.toggle("collapsed");
    const icon = collapseBtn.querySelector("i");
    icon.classList.toggle("fa-chevron-right");
    icon.classList.toggle("fa-chevron-left");
  });

  // Add point modal

  // Pick location button
  /*  document
    .getElementById("pick-location-btn")
    .addEventListener("click", function () {
      pickLocationMode = true;
      map.closePopup();

      // Change cursor and add message
      document.getElementById("map").style.cursor = "crosshair";

      // Show notification
      showNotification("Click on the map to select a location", "info");

      // Hide modal temporarily
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("addPointModal")
      );
      modal.hide();
    });

  // Map click event for picking location
  */
  map.on("click", function (e) {
    if (pickLocationMode) {
      // Get coordinates
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);

      // Update form fields
      document.getElementById("point-lat").value = lat;
      document.getElementById("point-lng").value = lng;

      // Reset cursor and mode
      document.getElementById("map").style.cursor = "";
      pickLocationMode = false;

      // Show modal again
      const modal = new bootstrap.Modal(
        document.getElementById("addPointModal")
      );
      modal.show();

      // Show confirmation
      showNotification("Location selected: " + lat + ", " + lng, "success");
    } else if (floodReportLocationMode) {
      // Get coordinates for flood report
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);

      // Reset cursor and mode
      document.getElementById("map").style.cursor = "";
      floodReportLocationMode = false;

      // Update form field (this would typically store the coordinates)
      document.getElementById("flood-location-input").value = `${lat}, ${lng}`;
      document
        .getElementById("flood-location-input")
        .setAttribute("data-lat", lat);
      document
        .getElementById("flood-location-input")
        .setAttribute("data-lng", lng);

      // Show modal again
      const modal = new bootstrap.Modal(
        document.getElementById("floodReportModal")
      );
      modal.show();

      // Show confirmation
      showNotification(
        "Flood location selected: " + lat + ", " + lng,
        "success"
      );
    }
  });
  /*
  // Save point button
  document
    .getElementById("save-point-btn")
    .addEventListener("click", function () {
      // Get form values
      const name = document.getElementById("point-name").value;
      const type = document.getElementById("point-type").value;
      const depth = document.getElementById("point-depth").value;
      const status = document.getElementById("point-status").value;
      const il = document.getElementById("point-il").value;
      const rl = document.getElementById("point-rl").value;
      const lat = document.getElementById("point-lat").value;
      const lng = document.getElementById("point-lng").value;
      const description = document.getElementById("point-description").value;

      // Validate form
      if (!name || !type || !status || !lat || !lng) {
        showNotification("Please fill all required fields", "warning");
        return;
      }

      // Create new point object
      const newPoint = {
        name,
        type,
        status,
        depth: parseFloat(depth) || 0,
        invert_level: il || "N/A",
        reduced_level: rl || "N/A",
        coordinates: [parseFloat(lat), parseFloat(lng)],
        description: description || "No description available",
        last_updated: new Date().toISOString().split("T")[0],
      };

      // Save to server/database
      saveNewDrainagePoint(newPoint).then((result) => {
        if (result.success) {
          // Add the new point to the map
          const marker = L.marker(newPoint.coordinates, {
            icon: createMarkerIcon(newPoint.status),
            draggable: false,
            title: newPoint.name,
          });

          // Create popup content
          const popupContent = `
        <div class="popup-content">
          <h5>${newPoint.name} <span class="badge ${getStatusBadgeClass(
            newPoint.status
          )}">${newPoint.status}</span></h5>
          <div class="property-row">
            <div class="property-label">Type:</div>
            <div>${newPoint.type}</div>
          </div>
          <div class="property-row">
            <div class="property-label">Depth:</div>
            <div>${newPoint.depth}m</div>
          </div>
          <div class="property-row">
            <div class="property-label">Description:</div>
            <div>${newPoint.description || "No description available"}</div>
          </div>
        </div>
      `;

          marker.bindPopup(popupContent);
          drainagePointsLayer.addLayer(marker);

          // Hide modal
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("addPointModal")
          );
          modal.hide();

          // Reset form
          document.getElementById("add-point-form").reset();

          // Show success notification
          showNotification("New point added successfully!", "success");
        } else {
          // Show error notification
          showNotification(
            "Failed to add new point: " + result.message,
            "danger"
          );
        }
      });
    });

  // Adjusted saveNewDrainagePoint function
  async function saveNewDrainagePoint(newPoint) {
    try {
      const response = await fetch(
        "/DrainageInventory/api/drainage-points.php",
        {
          method: "POST", // Ensure the method is POST
          headers: {
            "Content-Type": "application/json", // Set the content type to JSON
          },
          body: JSON.stringify(newPoint), // Send the newPoint object as JSON
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save drainage point to the server");
      }

      const result = await response.json();
      return result; // Return the server response
    } catch (error) {
      console.error("Error saving drainage point:", error);
      return { success: false, message: error.message }; // Return error response
    }
  }
*/
  // Report Flooding button
  document
    .querySelector(".flood-report-btn")
    .addEventListener("click", function () {
      const modal = new bootstrap.Modal(
        document.getElementById("floodReportModal")
      );
      modal.show();
    });

  // Flood report pick location button
  document
    .getElementById("flood-pick-location-btn")
    .addEventListener("click", function () {
      floodReportLocationMode = true;
      map.closePopup();

      // Change cursor
      document.getElementById("map").style.cursor = "crosshair";

      // Show notification
      showNotification("Click on the map to select the flood location", "info");

      // Hide modal temporarily
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("floodReportModal")
      );
      modal.hide();
    });

  // Submit flood report button
  document
    .getElementById("submit-flood-report-btn")
    .addEventListener("click", function () {
      // Get form values
      const locationInput = document.getElementById(
        "flood-location-input"
      ).value;
      const severity = document.getElementById("flood-severity").value;
      const waterDepth = document.getElementById("flood-water-depth").value;
      const description = document.getElementById("flood-description").value;
      const contact = document.getElementById("reporter-contact").value;

      // Get coordinates if they were set
      const lat = document
        .getElementById("flood-location-input")
        .getAttribute("data-lat");
      const lng = document
        .getElementById("flood-location-input")
        .getAttribute("data-lng");

      // Validate form
      if (!locationInput || !severity || !description) {
        showNotification("Please fill all required fields", "warning");
        return;
      }

      // Create report object
      const reportData = {
        location: locationInput,
        coordinates: lat && lng ? [parseFloat(lat), parseFloat(lng)] : null,
        severity,
        water_depth: parseFloat(waterDepth) || 0,
        description,
        contact,
        timestamp: new Date().toISOString(),
      };

      // Submit report
      submitFloodReport(reportData).then((success) => {
        if (success) {
          // Hide modal
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("floodReportModal")
          );
          modal.hide();

          // Reset form
          document.getElementById("flood-report-form").reset();
        }
      });
    });

  // Map control buttons
  document.getElementById("zoom-in-btn").addEventListener("click", function () {
    map.zoomIn();
  });

  document
    .getElementById("zoom-out-btn")
    .addEventListener("click", function () {
      map.zoomOut();
    });

  document
    .getElementById("locate-me-btn")
    .addEventListener("click", function () {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setView([lat, lng], 16);
            showNotification("Location found", "success");
          },
          function (error) {
            console.error("Error getting location:", error);
            showNotification(
              "Could not get your location. Please check your device settings.",
              "warning"
            );
          }
        );
      } else {
        showNotification(
          "Geolocation is not supported by your browser",
          "warning"
        );
      }
    });

  document
    .getElementById("full-extent-btn")
    .addEventListener("click", function () {
      map.setView([2.05788, 102.57471], 13);
    });

  document
    .getElementById("toggle-layers-btn")
    .addEventListener("click", function () {
      const modal = new bootstrap.Modal(
        document.getElementById("layerControlModal")
      );
      modal.show();
    });

  // Layer control modal
  document
    .getElementById("layer-drainage")
    .addEventListener("change", function () {
      if (this.checked) {
        map.addLayer(drainagePointsLayer);
      } else {
        map.removeLayer(drainagePointsLayer);
      }
    });

  document
    .getElementById("layer-flood-prone")
    .addEventListener("change", function () {
      if (this.checked) {
        map.addLayer(floodProneAreasLayer);
      } else {
        map.removeLayer(floodProneAreasLayer);
      }
    });

  document
    .getElementById("layer-maintenance")
    .addEventListener("change", function () {
      if (this.checked) {
        map.addLayer(maintenanceRoutesLayer);
        // Here you would load the maintenance routes data if it's not already loaded
      } else {
        map.removeLayer(maintenanceRoutesLayer);
      }
    });

  document
    .getElementById("layer-catchments")
    .addEventListener("change", function () {
      if (this.checked) {
        map.addLayer(catchmentsLayer);
        // Here you would load the catchment data if it's not already loaded
      } else {
        map.removeLayer(catchmentsLayer);
      }
    });

  document
    .getElementById("layer-rainfall")
    .addEventListener("change", function () {
      if (this.checked) {
        map.addLayer(rainfallLayer);
        // Here you would load the rainfall data if it's not already loaded
      } else {
        map.removeLayer(rainfallLayer);
      }
    });

  // Base map radios
  document
    .getElementById("basemap-street")
    .addEventListener("change", function () {
      if (this.checked) {
        map.removeLayer(satelliteTileLayer);
        map.removeLayer(terrainTileLayer);
        map.removeLayer(topoTileLayer);
        map.addLayer(osmTileLayer);
      }
    });

  document
    .getElementById("basemap-satellite")
    .addEventListener("change", function () {
      if (this.checked) {
        map.removeLayer(osmTileLayer);
        map.removeLayer(terrainTileLayer);
        map.removeLayer(topoTileLayer);
        map.addLayer(satelliteTileLayer);
      }
    });

  document
    .getElementById("basemap-terrain")
    .addEventListener("change", function () {
      if (this.checked) {
        map.removeLayer(osmTileLayer);
        map.removeLayer(satelliteTileLayer);
        map.removeLayer(topoTileLayer);
        map.addLayer(terrainTileLayer);
      }
    });

  document
    .getElementById("basemap-topo")
    .addEventListener("change", function () {
      if (this.checked) {
        map.removeLayer(osmTileLayer);
        map.removeLayer(satelliteTileLayer);
        map.removeLayer(terrainTileLayer);
        map.addLayer(topoTileLayer);
      } else {
        map.removeLayer(topoTileLayer);
      }
    });

  async function fetchAndRenderDrainageLines() {
    try {
      const response = await fetch("/DrainageInventory/api/drainage-lines.php");
      if (!response.ok) {
        throw new Error("Failed to fetch drainage lines");
      }

      const geojsonData = await response.json();
      console.log("Drainage Lines Data:", geojsonData); // Debugging

      // Add drainage lines to the map
      const drainageLineLayer = L.geoJSON(geojsonData, {
        style: {
          color: "#007bff", // Line color
          weight: 3, // Line thickness
        },
      }).addTo(map);

      drainageLineLayer.setZIndex(10);

      // Fit the map to the bounds of the drainage lines
      map.fitBounds(drainageLineLayer.getBounds());
    } catch (error) {
      console.error("Error fetching drainage lines:", error);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize the map
    const map = L.map("map").setView([1.9911, 102.5875], 13);

    // Add a tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Fetch and render drainage lines
    fetchAndRenderDrainageLines();
  });
  fetchAndRenderDrainageLines();

  // Filter overlay complete functionality
  document.addEventListener("DOMContentLoaded", function () {
    // ======== 1. TOGGLE OVERLAY FUNCTIONALITY ========
    const collapseBtn = document.getElementById("collapse-overlay");
    const overlay = document.getElementById("filter-overlay");

    // Initialize the overlay state based on any saved preference
    const savedState = localStorage.getItem("filterOverlayCollapsed");
    if (savedState === "true") {
      overlay.classList.add("collapsed");
      updateButtonIcon(true);
    } else {
      overlay.classList.remove("collapsed");
      updateButtonIcon(false);
    }

    // Add click event listener to the collapse button
    collapseBtn.addEventListener("click", () => {
      // Toggle the collapsed class on the overlay
      const isCollapsed = overlay.classList.toggle("collapsed");

      // Update the button icon based on the collapsed state
      updateButtonIcon(isCollapsed);

      // Save user preference
      localStorage.setItem("filterOverlayCollapsed", isCollapsed);
    });

    // Function to update button icon based on collapsed state
    function updateButtonIcon(isCollapsed) {
      const icon = collapseBtn.querySelector("i");
      if (isCollapsed) {
        icon.classList.remove("fa-chevron-left");
        icon.classList.add("fa-chevron-right");
        // Update the button title
        collapseBtn.setAttribute("title", "Expand Overlay");
      } else {
        icon.classList.remove("fa-chevron-right");
        icon.classList.add("fa-chevron-left");
        // Update the button title
        collapseBtn.setAttribute("title", "Collapse Overlay");
      }
    }

    // ======== 2. SEARCH BOX FUNCTIONALITY ========
    // Search Input Functionality
    document.addEventListener("DOMContentLoaded", function () {
      const searchInput = document.getElementById("search-input");

      searchInput.addEventListener("input", function () {
        const searchTerm = this.value.trim();
        if (searchTerm) {
          fetchFilteredPoints(searchTerm);
        } else {
          fetchDrainageData(); // Show all points if search is empty
        }
      });

      async function fetchFilteredPoints(searchTerm) {
        try {
          const response = await fetch(
            `/DrainageInventory/api/drainage-points.php?search=${encodeURIComponent(
              searchTerm
            )}`
          );
          if (!response.ok) throw new Error("Failed to fetch filtered points");
          const filteredPoints = await response.json();
          renderDrainagePoints(filteredPoints);
          if (filteredPoints.length === 0) {
            showNotification("No matching drainage points found", "warning");
          }
        } catch (error) {
          showNotification("Error fetching filtered points.", "danger");
        }
      }

      // Update the map with filtered points
      function updateMapMarkers(filteredPoints) {
        // Clear existing markers
        drainagePointsLayer.clearLayers();

        // Add filtered points to the map
        filteredPoints.forEach((point) => {
          const marker = L.marker(point.coordinates, {
            icon: createMarkerIcon(point.status),
            title: point.name,
          });

          // Create popup content
          const popupContent = `
          <div class="popup-content">
            <h5>${point.name} <span class="badge ${getStatusBadgeClass(
            point.status
          )}">${point.status}</span></h5>
            <div class="property-row">
              <div class="property-label">Type:</div>
              <div>${point.type}</div>
            </div>
            <div class="property-row">
              <div class="property-label">Depth:</div>
              <div>${point.depth}m</div>
            </div>
          </div>
        `;

          marker.bindPopup(popupContent);
          drainagePointsLayer.addLayer(marker);
        });
      }
    });

    // ======== 3. FILTER BADGES FUNCTIONALITY ========
    const filterBadges = document.querySelectorAll(".filter-badge");

    // Active filters storage (default to 'all')
    const activeFilters = {
      type: "all",
      status: "all",
    };

    // Add click event to all filter badges
    filterBadges.forEach((badge) => {
      badge.addEventListener("click", function () {
        // Get parent filter category (type or status)
        const filterCategory =
          this.parentElement.previousElementSibling.textContent
            .toLowerCase()
            .includes("type")
            ? "type"
            : "status";

        // Remove active class from all badges in this category
        this.parentElement.querySelectorAll(".filter-badge").forEach((b) => {
          b.classList.remove("active");
        });

        // Add active class to the clicked badge
        this.classList.add("active");

        // Update the active filters
        activeFilters[filterCategory] = this.getAttribute("data-filter");

        // Apply all active filters
        applyFilters();
      });
    });

    function applyFilters() {
      console.log("Applying filters:", activeFilters);

      // Filter points based on active filters
      let filteredPoints = drainagePoints;

      // Apply type filter
      if (activeFilters.type !== "all") {
        filteredPoints = filteredPoints.filter(
          (point) => point.type === activeFilters.type
        );
      }

      // Apply status filter
      if (activeFilters.status !== "all") {
        filteredPoints = filteredPoints.filter(
          (point) => point.status === activeFilters.status
        );
      }

      // Apply depth filter (handled separately)

      // This would update the map in a real application
      console.log("Filtered points after applying filters:", filteredPoints);

      // If integrated with a map:
      // updateMapMarkers(filteredPoints);
    }

    // ======== 4. DEPTH RANGE SLIDER FUNCTIONALITY ========
    const depthSlider = document.getElementById("depth-range");
    const depthValue = document.getElementById("depth-value");

    // Set initial depth value display
    depthValue.textContent = `0-${depthSlider.value}m`;

    // Add event listener for range slider
    depthSlider.addEventListener("input", function () {
      // Update the displayed value
      depthValue.textContent = `0-${this.value}m`;

      // Filter points based on depth
      filterByDepth(this.value);
    });

    function filterByDepth(maxDepth) {
      console.log(`Filtering by depth: 0-${maxDepth}m`);

      // Filter points by depth
      const filteredPoints = drainagePoints.filter(
        (point) => point.depth <= maxDepth
      );

      // This would update the map in a real application
      console.log("Filtered points by depth:", filteredPoints);

      // If integrated with a map:
      // updateMapMarkers(filteredPoints);
    }

    // ======== 5. RECENT ACTIVITY FUNCTIONALITY ========
    const recentActivityItems = document.querySelectorAll(".list-group-item");

    // Add click event to recent activity items to highlight related points
    recentActivityItems.forEach((item) => {
      item.addEventListener("click", function () {
        // Get the activity text
        const activityText = this.querySelector("span:first-child").textContent;

        // Highlight in UI
        this.classList.add("bg-light");
        setTimeout(() => this.classList.remove("bg-light"), 2000);

        // Extract drain ID or relevant info
        const matches = activityText.match(/#(\d+)/);
        if (matches && matches[1]) {
          const pointId = matches[1];
          highlightPoint(pointId);
        }
      });
    });

    function highlightPoint(pointId) {
      console.log(`Highlighting point with ID: ${pointId}`);

      // In a real application, this would:
      // 1. Center the map on the point
      // 2. Open its popup or info window
      // 3. Possibly animate the marker

      // Example code:
      // const point = drainagePoints.find(p => p.id === parseInt(pointId));
      // if (point) {
      //   map.setView([point.lat, point.lng], 16);
      //   markers[point.id].openPopup();
      // }
    }

    // ======== 6. COMBINED FILTER FUNCTION ========
    // This function would combine all filters when integrated with a map
    function applyAllFilters() {
      const searchTerm = searchInput.value.toLowerCase();
      const maxDepth = parseFloat(depthSlider.value);

      let filteredPoints = drainagePoints;

      // Apply search filter
      if (searchTerm) {
        filteredPoints = filteredPoints.filter(
          (point) =>
            point.name.toLowerCase().includes(searchTerm) ||
            point.type.toLowerCase().includes(searchTerm)
        );
      }

      // Apply type filter
      if (activeFilters.type !== "all") {
        filteredPoints = filteredPoints.filter(
          (point) => point.type === activeFilters.type
        );
      }

      // Apply status filter
      if (activeFilters.status !== "all") {
        filteredPoints = filteredPoints.filter(
          (point) => point.status === activeFilters.status
        );
      }

      // Apply depth filter
      filteredPoints = filteredPoints.filter(
        (point) => point.depth <= maxDepth
      );

      // Update map (in a real application)
      console.log("Final filtered points:", filteredPoints);

      // If integrated with a map:
      // updateMapMarkers(filteredPoints);

      // Update filter summary display (optional)
      updateFilterSummary(filteredPoints.length);
    }

    function updateFilterSummary(count) {
      console.log(`Showing ${count} drainage points that match filters`);
      // Could update a UI element like:
      // document.getElementById("filter-summary").textContent = `Showing ${count} drainage points`;
    }

    // ======== 7. INITIALIZE MAP RENDERING (PLACEHOLDER) ========
    // This function would initialize the map with all points
    function initializeMap() {
      console.log("Initializing map with all drainage points");

      // In a real application:
      // 1. Create a Leaflet map
      // 2. Add base layers
      // 3. Create markers for all drain points
      // 4. Add them to marker clusters
      // 5. Set up click handlers for markers
    }

    // Initialize map rendering (in a real app)
    // initializeMap();
  });
});
