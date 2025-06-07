// Wait for document to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Simulate loading delay for demonstration
  setTimeout(() => {
    document.getElementById("loading-overlay").style.display = "none";
  }, 1500);

  // Initialize the map
  const map = L.map("map").setView([2.0508, 102.5689], 13);

  // Base map layers
  const streetMap = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "© OpenStreetMap contributors",
    }
  ).addTo(map);

  const satelliteMap = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    }
  );

  const terrainMap = L.tileLayer(
    "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    {
      attribution:
        "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)",
    }
  );

  const topoMap = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
    }
  );

  // Create layer groups for different areas
  const bentayanLayer = L.layerGroup().addTo(map);
  const bandar1Layer = L.layerGroup();
  const bandar2Layer = L.layerGroup();
  const maharaniLayer = L.layerGroup();
  const jlnBakriLayer = L.layerGroup();
  const paritBakarLayer = L.layerGroup();

  // Create layer groups for different data types
  const drainagePointsLayer = L.markerClusterGroup().addTo(map);
  const floodProneAreasLayer = L.layerGroup().addTo(map);
  const maintenanceRoutesLayer = L.layerGroup();
  const catchmentAreasLayer = L.layerGroup();
  const rainfallLayer = L.layerGroup();

  // Function to fetch feature and media data from the database
  function getFeatureAndMediaInfo(coordinates) {
    // In a real app, this would query the server
    // For now, return a mock promise with sample data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          feature: {
            name: "Sample Drainage Feature",
            description:
              "This is a sample drainage feature at coordinates " +
              coordinates.lat.toFixed(4) +
              ", " +
              coordinates.lng.toFixed(4),
            status: "Good",
            type: "Concrete Drain",
            depth: 1.5,
          },
          media: [
            { url: "/api/placeholder/100/100", title: "Sample Image 1" },
            { url: "/api/placeholder/100/100", title: "Sample Image 2" },
          ],
        });
      }, 200);
    });
  }

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

  // Function to get status color
  function getStatusColor(status) {
    switch (status) {
      case "Good":
        return "#28a745";
      case "Needs Maintenance":
        return "#ffc107";
      case "Critical":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  }

  // Create marker icons based on status
  function createMarkerIcon(status) {
    return L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: ${getStatusColor(
        status
      )}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }

  // Utility function to load and style GeoJSON
  function loadGeoJSON(url, targetLayer, color = "blue") {
    // In a production app, this would fetch from a real URL
    // For demo purposes, we'll simulate loading some sample data
    console.log(`Simulating loading of ${url} into layer`);

    // Sample GeoJSON data for simulation
    const sampleGeoJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: url.split("/").pop().replace(".geojson", ""),
            description: `Example drainage line for ${url
              .split("/")
              .pop()
              .replace(".geojson", "")}`,
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [102.5689 + Math.random() * 0.05, 2.0508 + Math.random() * 0.05],
              [102.5689 + Math.random() * 0.05, 2.0508 + Math.random() * 0.05],
              [102.5689 + Math.random() * 0.05, 2.0508 + Math.random() * 0.05],
            ],
          },
        },
      ],
    };

    const geojson = L.geoJSON(sampleGeoJSON, {
      style: {
        color: color,
        weight: 3,
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;

        // Add hover functionality for showing popups
        layer.on("mouseover", function (e) {
          const description = props.description || "No description available";
          layer
            .bindPopup(
              `<b>${props.name || "Drainage Line"}</b><br>${description}`
            )
            .openPopup();

          // Fetch and display feature and media details
          getFeatureAndMediaInfo(e.latlng).then((data) => {
            let mediaHTML = "";
            if (data.media && data.media.length > 0) {
              mediaHTML = "<br><strong>Related Media:</strong><br>";
              data.media.forEach((media) => {
                mediaHTML += `<img src="${media.url}" class="thumbnail" alt="Media">`;
              });
            }

            const featurePopupContent = `
              <b>${data.feature.name}</b><br>
              ${data.feature.description || "No description available"}<br>
              ${mediaHTML}
            `;
            layer.setPopupContent(featurePopupContent);
          });
        });

        // Hide popup when mouse leaves
        layer.on("mouseout", function () {
          layer.closePopup();
        });

        // Optional: add popup for clicking (with description)
        layer.bindPopup(
          `<b>${props.name || "Drainage Line"}</b><br>${
            props.description || "No description available"
          }`
        );
      },
    });
    geojson.addTo(targetLayer);
  }

  // Load GeoJSON files for different areas
  loadGeoJSON("data/bentayan jln bakri.geojson", bentayanLayer, "blue");
  loadGeoJSON("data/Mukim Bandar 1.geojson", bandar1Layer, "green");
  loadGeoJSON("data/Mukim Bandar 2.geojson", bandar2Layer, "purple");
  loadGeoJSON("data/Mukim Bandar Maharani.geojson", maharaniLayer, "orange");
  loadGeoJSON("data/Mukim Jalan Bakri.geojson", jlnBakriLayer, "red");
  loadGeoJSON("data/Zon Parit Bakar.geojson", paritBakarLayer, "darkblue");

  // Sample drainage data - in a real app, this would come from an API
  const drainageData = [
    {
      id: "D001",
      name: "Main Drain Junction A",
      type: "Concrete Drain",
      status: "Good",
      depth: 2.5,
      invert_level: "10.5m",
      reduced_level: "13.0m",
      coordinates: [2.0508, 102.5689],
      description:
        "Main concrete drain with good flow capacity. Last maintenance on 12/03/2023.",
      images: ["drain1.jpg", "drain2.jpg"],
      last_inspection: "2023-05-10",
    },
    {
      id: "D002",
      name: "Culvert Bridge B",
      type: "Box Culvert",
      status: "Needs Maintenance",
      depth: 1.8,
      invert_level: "8.2m",
      reduced_level: "10.0m",
      coordinates: [2.055, 102.57],
      description:
        "Box culvert showing signs of sedimentation and minor blockage. Scheduled for cleaning.",
      images: ["culvert1.jpg"],
      last_inspection: "2023-04-22",
    },
    {
      id: "D003",
      name: "Earth Channel C",
      type: "Earth Drain",
      status: "Critical",
      depth: 1.2,
      invert_level: "5.5m",
      reduced_level: "6.7m",
      coordinates: [2.045, 102.573],
      description:
        "Earth drain with significant erosion and vegetation overgrowth. Needs urgent attention.",
      images: ["earth1.jpg", "earth2.jpg"],
      last_inspection: "2023-05-01",
    },
    {
      id: "D004",
      name: "Pipe Drainage D",
      type: "Pipe Drain",
      status: "Good",
      depth: 0.9,
      invert_level: "7.8m",
      reduced_level: "8.7m",
      coordinates: [2.048, 102.563],
      description:
        "Standard 900mm concrete pipe in good condition. Regular flow observed.",
      images: ["pipe1.jpg"],
      last_inspection: "2023-05-15",
    },
  ];

  // Add drainage points to the map
  drainageData.forEach((point) => {
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
          <div class="property-label">ID:</div>
          <div>${point.id}</div>
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
          <div class="property-label">Last Inspection:</div>
          <div>${point.last_inspection}</div>
        </div>
        <div class="mt-2">
          <button class="btn btn-sm btn-primary view-details-btn" data-id="${
            point.id
          }">View Details</button>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);

    // Add click event to the marker
    marker.on("click", function () {
      // Store the current point data for use in the modal
      sessionStorage.setItem("currentPointData", JSON.stringify(point));
    });

    drainagePointsLayer.addTo(map);
    drainagePointsLayer.addLayer(marker);
  });

  // Add flood-prone areas (polygons)
  const floodProneAreas = [
    {
      name: "Junction 5 Area",
      coordinates: [
        [2.0508, 102.5689],
        [2.053, 102.57],
        [2.052, 102.572],
        [2.05, 102.571],
      ],
      risk_level: "High",
      last_flood: "2023-01-15",
    },
    {
      name: "Lowland Region",
      coordinates: [
        [2.045, 102.565],
        [2.047, 102.567],
        [2.046, 102.569],
        [2.044, 102.567],
      ],
      risk_level: "Medium",
      last_flood: "2022-12-05",
    },
  ];

  // Add flood prone areas to the map
  floodProneAreas.forEach((area) => {
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

  // Base maps for layer control
  const baseMaps = {
    "Street Map": streetMap,
    "Satellite Imagery": satelliteMap,
    Terrain: terrainMap,
    Topographic: topoMap,
  };

  // Overlay maps for layer control
  const overlayMaps = {
    "Drainage Points": drainagePointsLayer,
    "Flood-prone Areas": floodProneAreasLayer,
    "Bentayan Jln Bakri": bentayanLayer,
    "Mukim Bandar 1": bandar1Layer,
    "Mukim Bandar 2": bandar2Layer,
    Maharani: maharaniLayer,
    "Jalan Bakri": jlnBakriLayer,
    "Parit Bakar": paritBakarLayer,
  };

  // Add layer control to map
  L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

  // Function to handle the unselecting of layers and show popups when hovering
  map.on("overlayadd overlayremove", function (e) {
    console.log(
      `Layer ${e.name} was ${e.type === "overlayadd" ? "added" : "removed"}`
    );
  });

  // Map control buttons functionality
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
      map.locate({ setView: true, maxZoom: 16 });
    });

  document
    .getElementById("full-extent-btn")
    .addEventListener("click", function () {
      map.setView([2.0508, 102.5689], 13);
    });

  document
    .getElementById("toggle-layers-btn")
    .addEventListener("click", function () {
      const modal = new bootstrap.Modal(
        document.getElementById("layerControlModal")
      );
      modal.show();
    });

  // Layer control modal functionality
  document
    .getElementById("layer-drainage")
    .addEventListener("change", function (e) {
      if (e.target.checked) {
        map.addLayer(drainagePointsLayer);
      } else {
        map.removeLayer(drainagePointsLayer);
      }
    });

  document
    .getElementById("layer-flood-prone")
    .addEventListener("change", function (e) {
      if (e.target.checked) {
        map.addLayer(floodProneAreasLayer);
      } else {
        map.removeLayer(floodProneAreasLayer);
      }
    });

  document
    .getElementById("layer-maintenance")
    .addEventListener("change", function (e) {
      if (e.target.checked) {
        map.addLayer(maintenanceRoutesLayer);
      } else {
        map.removeLayer(maintenanceRoutesLayer);
      }
    });

  document
    .getElementById("layer-catchments")
    .addEventListener("change", function (e) {
      if (e.target.checked) {
        map.addLayer(catchmentAreasLayer);
      } else {
        map.removeLayer(catchmentAreasLayer);
      }
    });

  document
    .getElementById("layer-rainfall")
    .addEventListener("change", function (e) {
      if (e.target.checked) {
        map.addLayer(rainfallLayer);
      } else {
        map.removeLayer(rainfallLayer);
      }
    });

  // Base map radio buttons
  document
    .getElementById("basemap-street")
    .addEventListener("change", function () {
      if (this.checked) {
        map.removeLayer(satelliteMap);
        map.removeLayer(terrainMap);
        map.removeLayer(topoMap);
        map.addLayer(streetMap);
      }
    });

  document
    .getElementById("basemap-satellite")
    .addEventListener("change", function () {
      if (this.checked) {
        map.removeLayer(streetMap);
        map.removeLayer(terrainMap);
        map.removeLayer(topoMap);
        map.addLayer(satelliteMap);
      }
    });

  document
    .getElementById("basemap-terrain")
    .addEventListener("change", function () {
      if (this.checked) {
        map.removeLayer(streetMap);
        map.removeLayer(satelliteMap);
        map.removeLayer(topoMap);
        map.addLayer(terrainMap);
      }
    });

  document
    .getElementById("basemap-topo")
    .addEventListener("change", function () {
      if (this.checked) {
        map.removeLayer(streetMap);
        map.removeLayer(satelliteMap);
        map.removeLayer(terrainMap);
        map.addLayer(topoMap);
      }
    });

  document
    .getElementById("reset-layers-btn")
    .addEventListener("click", function () {
      // Reset layer checkboxes
      document.getElementById("layer-drainage").checked = true;
      document.getElementById("layer-flood-prone").checked = true;
      document.getElementById("layer-maintenance").checked = false;
      document.getElementById("layer-catchments").checked = false;
      document.getElementById("layer-rainfall").checked = false;

      // Reset base map radio
      document.getElementById("basemap-street").checked = true;

      // Apply changes to map
      map.addLayer(drainagePointsLayer);
      map.addLayer(floodProneAreasLayer);
      map.removeLayer(maintenanceRoutesLayer);
      map.removeLayer(catchmentAreasLayer);
      map.removeLayer(rainfallLayer);

      map.removeLayer(satelliteMap);
      map.removeLayer(terrainMap);
      map.removeLayer(topoMap);
      map.addLayer(streetMap);
    });

  // Filter overlay collapse/expand functionality
  document
    .getElementById("collapse-overlay")
    .addEventListener("click", function () {
      const overlay = document.getElementById("filter-overlay");
      overlay.classList.toggle("collapsed");

      const icon = this.querySelector("i");
      if (overlay.classList.contains("collapsed")) {
        icon.className = "fas fa-chevron-left";
      } else {
        icon.className = "fas fa-chevron-right";
      }
    });

  // Search functionality
  document
    .getElementById("search-input")
    .addEventListener("input", function (e) {
      const searchText = e.target.value.toLowerCase();

      drainagePointsLayer.eachLayer(function (layer) {
        const pointData = layer.options.title.toLowerCase();
        if (pointData.includes(searchText)) {
          layer.setOpacity(1);
        } else {
          layer.setOpacity(0.3);
        }
      });
    });

  // Filter badges
  document.querySelectorAll(".filter-badge").forEach((badge) => {
    badge.addEventListener("click", function () {
      const filterType = this.dataset.filter;
      const category = this.parentElement.previousElementSibling.textContent;

      // Toggle active class
      if (filterType === "all") {
        // If "All" is clicked, deactivate all others in the same category
        const siblings = this.parentElement.querySelectorAll(".filter-badge");
        siblings.forEach((sib) => sib.classList.remove("active"));
        this.classList.add("active");
      } else {
        // If specific filter is clicked, deactivate "All" in the same category
        const allBadge = this.parentElement.querySelector(
          '[data-filter="all"]'
        );
        allBadge.classList.remove("active");
        this.classList.toggle("active");
      }

      // Apply filters
      applyFilters();
    });
  });

  // Apply all active filters to the map
  function applyFilters() {
    const typeFilters = [];
    const statusFilters = [];

    // Get all active type filters
    document.querySelectorAll(".filter-badge.active").forEach((badge) => {
      const filterType = badge.dataset.filter;
      const category = badge.parentElement.previousElementSibling.textContent;

      if (category.includes("Type")) {
        if (filterType !== "all") typeFilters.push(filterType);
      } else if (category.includes("Status")) {
        if (filterType !== "all") statusFilters.push(filterType);
      }
    });

    // Apply filters to drainage points
    drainagePointsLayer.eachLayer(function (layer) {
      let showLayer = true;

      // Get point data from title or from stored data
      const pointTitle = layer.options.title;
      const pointData = drainageData.find((point) => point.name === pointTitle);

      if (pointData) {
        // Check type filters
        if (typeFilters.length > 0) {
          const matchesType = typeFilters.some((filter) => {
            return pointData.type.toLowerCase().includes(filter.toLowerCase());
          });
          if (!matchesType) showLayer = false;
        }

        // Check status filters
        if (statusFilters.length > 0) {
          const matchesStatus = statusFilters.some((filter) => {
            return (
              pointData.status.toLowerCase().replace(" ", "-") ===
              filter.toLowerCase()
            );
          });
          if (!matchesStatus) showLayer = false;
        }
      }

      // Show/hide layer based on filters
      if (showLayer) {
        layer.setOpacity(1);
      } else {
        layer.setOpacity(0.3);
      }
    });
  }

  // Depth range filter
  document
    .getElementById("depth-range")
    .addEventListener("input", function (e) {
      const depth = parseFloat(e.target.value);
      document.getElementById("depth-value").textContent = `0-${depth}m`;

      // Filter points by depth
      drainagePointsLayer.eachLayer(function (layer) {
        const pointTitle = layer.options.title;
        const pointData = drainageData.find(
          (point) => point.name === pointTitle
        );

        if (pointData) {
          if (pointData.depth <= depth) {
            layer.setOpacity(1);
          } else {
            layer.setOpacity(0.3);
          }
        }
      });
    });

  // Add Point modal functionality
  let pickLocationMode = false;

  document
    .getElementById("add-point-btn")
    .addEventListener("click", function () {
      const modal = new bootstrap.Modal(
        document.getElementById("addPointModal")
      );
      modal.show();
    });

  document
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
    }
  });

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
        id: "D" + Math.floor(1000 + Math.random() * 9000),
        name: name,
        type: type,
        status: status,
        depth: parseFloat(depth) || 0,
        invert_level: il || "N/A",
        reduced_level: rl || "N/A",
        coordinates: [parseFloat(lat), parseFloat(lng)],
        description: description || "No description available",
        images: [],
        last_inspection: new Date().toISOString().split("T")[0],
      };

      // Add point to data array
      drainageData.push(newPoint);

      // Add marker to map
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
          <div class="property-label">ID:</div>
          <div>${newPoint.id}</div>
        </div>
        <div class="property-row">
          <div class="property-label">Type:</div>
          <div>${newPoint.type}</div>
        </div>
        <div class="property-row">
          <div class="property-label">Depth:</div>
          <div>${newPoint.depth}m</div>
        </div>
        <div class="property-row">
          <div class="property-label">Last Inspection:</div>
          <div>${newPoint.last_inspection}</div>
        </div>
        <div class="mt-2">
          <button class="btn btn-sm btn-primary view-details-btn" data-id="${
            newPoint.id
          }">View Details</button>
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
      showNotification("New drainage point added successfully", "success");

      // Pan to new point
      map.panTo(newPoint.coordinates);
    });

  // Report Flood button
  document
    .querySelector(".flood-report-btn")
    .addEventListener("click", function () {
      const modal = new bootstrap.Modal(
        document.getElementById("floodReportModal")
      );
      modal.show();
    });

  // Flood report location picker
  let floodLocationMode = false;

  document
    .getElementById("flood-pick-location-btn")
    .addEventListener("click", function () {
      floodLocationMode = true;
      map.closePopup();

      // Change cursor and add message
      document.getElementById("map").style.cursor = "crosshair";

      // Show notification
      showNotification("Click on the map to select a flood location", "info");

      // Hide modal temporarily
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("floodReportModal")
      );
      modal.hide();
    });

  map.on("click", function (e) {
    if (floodLocationMode) {
      // Get coordinates
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);

      // Update form field
      document.getElementById("flood-location-input").value = `${lat}, ${lng}`;

      // Reset cursor and mode
      document.getElementById("map").style.cursor = "";
      floodLocationMode = false;

      // Show modal again
      const modal = new bootstrap.Modal(
        document.getElementById("floodReportModal")
      );
      modal.show();

      // Show confirmation
      showNotification("Flood location selected", "success");
    }
  });
});
