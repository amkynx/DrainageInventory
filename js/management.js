// Global variables
let maintenanceRequests = [];
let inspectionSchedules = [];
let completionReports = [];
let drainagePoints = [];
let users = [];
let filteredMaintenanceRequests = [];
let filteredInspectionSchedules = [];
let filteredCompletionReports = [];
let currentUser = null;
let isLoading = false;

// Utility Functions
/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Invalid Date";
  }
}

/**
 * Show notification to user
 */
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `alert alert-${type} notification fade show`;
  notification.innerHTML = `
    <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  // Add to page
  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove("show");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 150);
    }
  }, 5000);
}

/**
 * Debounce function to limit rapid function calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  checkAuthentication();
});

/**
 * Check if user is authenticated and has appropriate role
 */
async function checkAuthentication() {
  try {
    const response = await fetch("../api/session-check.php");
    const result = await response.json();

    if (
      result.success &&
      result.authenticated &&
      result.user.role === "Admin"
    ) {
      currentUser = result.user;
      document.getElementById("userName").textContent = currentUser.name;
      hideLoadingOverlay();
      loadInitialData();
    } else {
      window.location.href = "../login.html?unauthorized=1";
    }
  } catch (error) {
    console.error("Authentication check failed:", error);
    showNotification(
      "Authentication check failed. Please try again.",
      "danger"
    );
    // Still load for demo purposes
    currentUser = { id: 1, name: "Demo Admin", role: "Admin" };
    document.getElementById("userName").textContent = currentUser.name;
    hideLoadingOverlay();
    loadInitialData();
  }
}

/**
 * Hide the loading overlay
 */
function hideLoadingOverlay() {
  const overlay = document.getElementById("loadingOverlay");
  overlay.style.opacity = "0";
  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
}

/**
 * Show/hide page loading overlay for actions
 */
function showLoading(show) {
  const overlay = document.getElementById("pageLoadingOverlay");
  if (show) {
    overlay.classList.add("show");
  } else {
    overlay.classList.remove("show");
  }
}

/**
 * Logout function
 */
async function logout() {
  try {
    showNotification("Logging out...", "info");
    await fetch("../api/logout.php", { method: "POST" });
    window.location.href = "../login.html?logout=1";
  } catch (error) {
    console.error("Logout failed:", error);
    window.location.href = "../login.html?logout=1";
  }
}

/**
 * Load all required data
 */
async function loadInitialData() {
  try {
    setLoadingState(true);

    await Promise.all([
      loadMaintenanceRequests(),
      loadInspectionSchedules(),
      loadCompletionReports(),
      loadDrainagePoints(),
      loadUsers(),
    ]);

    populateDropdowns();
    setupEventListeners();
    showNotification("Data loaded successfully", "success");
  } catch (error) {
    console.error("Error loading initial data:", error);
    showNotification(
      "Error loading some data. Please refresh the page.",
      "warning"
    );
  } finally {
    setLoadingState(false);
  }
}

/**
 * Set loading state for tables
 */
function setLoadingState(loading) {
  isLoading = loading;
  const maintenanceTable = document.getElementById("maintenance-table-body");
  const inspectionTable = document.getElementById("inspection-table-body");

  if (loading) {
    maintenanceTable.innerHTML = `
          <tr>
            <td colspan="10" class="text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading maintenance requests...</p>
            </td>
          </tr>
        `;

    inspectionTable.innerHTML = `
          <tr>
            <td colspan="10" class="text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading inspection schedules...</p>
            </td>
          </tr>
        `;
  }
}

/**
 * Load maintenance requests from API
 */
async function loadMaintenanceRequests() {
  try {
    const response = await fetch("../api/maintenance-requests.php");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Maintenance requests API response:", data);

    if (Array.isArray(data)) {
      maintenanceRequests = data;
    } else if (data.success && Array.isArray(data.data)) {
      maintenanceRequests = data.data;
    } else {
      throw new Error("Invalid data format received");
    }

    filteredMaintenanceRequests = [...maintenanceRequests];
    updateMaintenanceStatistics();
    setLoadingState(false);
    renderMaintenanceTable();

    console.log("Loaded maintenance requests:", maintenanceRequests.length);
  } catch (error) {
    console.error("Error loading maintenance requests:", error);
    showNotification(
      "Could not load maintenance requests from server",
      "warning"
    );

    // Show empty state instead of sample data
    maintenanceRequests = [];
    filteredMaintenanceRequests = [];
    setLoadingState(false);
    updateMaintenanceStatistics();
    renderMaintenanceTable();
  }
}

/**
 * Load inspection schedules from API
 */
async function loadInspectionSchedules() {
  try {
    const response = await fetch("../api/inspection-schedules.php");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Inspection schedules API response:", data);

    if (Array.isArray(data)) {
      inspectionSchedules = data;
    } else if (data.success && Array.isArray(data.data)) {
      inspectionSchedules = data.data;
    } else {
      throw new Error("Invalid data format received");
    }

    // Sort by created date (newest first)
    inspectionSchedules.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    filteredInspectionSchedules = [...inspectionSchedules];
    updateInspectionStatistics();
    setLoadingState(false);
    renderInspectionTable();

    console.log("Loaded inspection schedules:", inspectionSchedules.length);
  } catch (error) {
    console.error("Error loading inspection schedules:", error);
    showNotification(
      "Could not load inspection schedules from server",
      "warning"
    );

    // Show empty state instead of sample data
    inspectionSchedules = [];
    filteredInspectionSchedules = [];
    setLoadingState(false);
    updateInspectionStatistics();
    renderInspectionTable();
  }
}

/**
 * Load drainage points from API
 */
async function loadDrainagePoints() {
  try {
    const response = await fetch("../api/drainage-points.php");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Drainage points API response:", data);

    if (Array.isArray(data)) {
      drainagePoints = data;
    } else if (data.success && Array.isArray(data.data)) {
      drainagePoints = data.data;
    } else {
      throw new Error("Invalid data format received");
    }

    console.log("Loaded drainage points:", drainagePoints.length);
  } catch (error) {
    console.error("Error loading drainage points:", error);
    showNotification("Could not load drainage points from server", "warning");
    drainagePoints = [];
  }
}

/**
 * Load users from API
 */
async function loadUsers() {
  try {
    const response = await fetch("../api/users.php");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Users API response:", data);

    if (Array.isArray(data)) {
      users = data;
    } else if (data.success && Array.isArray(data.data)) {
      users = data.data;
    } else {
      throw new Error("Invalid data format received");
    }

    console.log("Loaded users:", users.length);
  } catch (error) {
    console.error("Error loading users:", error);
    showNotification("Could not load users from server", "warning");
    users = [];
  }
}

/**
 * Populate dropdowns with data
 */
function populateDropdowns() {
  // Populate drainage points dropdowns
  const pointSelects = ["modal-maintenance-point", "modal-inspection-point"];
  pointSelects.forEach((selectId) => {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '<option value="">Select drainage point</option>';
      drainagePoints.forEach((point) => {
        const option = document.createElement("option");
        option.value = point.id;
        option.textContent = point.name;
        select.appendChild(option);
      });
    }
  });

  // Populate user dropdowns
  const assignedToSelect = document.getElementById(
    "modal-maintenance-assigned"
  );
  if (assignedToSelect) {
    assignedToSelect.innerHTML = '<option value="">Select team member</option>';
    users.forEach((user) => {
      if (user.role === "Operator" || user.role === "Admin") {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = `${user.first_name} ${user.last_name} (${user.role})`;
        assignedToSelect.appendChild(option);
      }
    });
  }

  const inspectorSelect = document.getElementById("modal-inspection-inspector");
  if (inspectorSelect) {
    inspectorSelect.innerHTML = '<option value="">Select inspector</option>';
    users.forEach((user) => {
      if (user.role === "Operator" || user.role === "Admin") {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = `${user.first_name} ${user.last_name} (${user.role})`;
        inspectorSelect.appendChild(option);
      }
    });
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Maintenance form submission
  document
    .getElementById("saveMaintenanceBtn")
    .addEventListener("click", saveMaintenanceRequest);

  // Inspection form submission
  document
    .getElementById("saveInspectionBtn")
    .addEventListener("click", saveInspectionSchedule);

  // Filter inputs
  document
    .getElementById("maintenance-search")
    .addEventListener("input", debounce(applyMaintenanceFilters, 300));
  document
    .getElementById("inspection-search")
    .addEventListener("input", debounce(applyInspectionFilters, 300));

  // Reports filter inputs
  const reportsSearch = document.getElementById("reports-search");
  if (reportsSearch) {
    reportsSearch.addEventListener("input", debounce(applyReportsFilters, 300));
  }
}

/**
 * Update maintenance statistics
 */
function updateMaintenanceStatistics() {
  const total = maintenanceRequests.length;
  const pending = maintenanceRequests.filter(
    (r) => r.status === "Pending"
  ).length;
  const inProgress = maintenanceRequests.filter(
    (r) => r.status === "In Progress"
  ).length;
  const completed = maintenanceRequests.filter(
    (r) => r.status === "Completed"
  ).length;

  document.getElementById("maintenance-total").textContent = total;
  document.getElementById("maintenance-pending").textContent = pending;
  document.getElementById("maintenance-in-progress").textContent = inProgress;
  document.getElementById("maintenance-completed").textContent = completed;
}

/**
 * Update inspection statistics
 */
function updateInspectionStatistics() {
  const total = inspectionSchedules.length;
  const scheduled = inspectionSchedules.filter(
    (s) => s.status === "Scheduled"
  ).length;
  const overdue = inspectionSchedules.filter(
    (s) => s.status === "Overdue"
  ).length;
  const completed = inspectionSchedules.filter(
    (s) => s.status === "Completed"
  ).length;

  document.getElementById("inspection-total").textContent = total;
  document.getElementById("inspection-scheduled").textContent = scheduled;
  document.getElementById("inspection-overdue").textContent = overdue;
  document.getElementById("inspection-completed").textContent = completed;
}

/**
 * Render maintenance table
 */
function renderMaintenanceTable() {
  const tbody = document.getElementById("maintenance-table-body");

  if (isLoading) return;

  if (filteredMaintenanceRequests.length === 0) {
    tbody.innerHTML = `
          <tr>
            <td colspan="10" class="text-center text-muted py-4">
              <i class="fas fa-wrench fa-2x mb-2 d-block"></i>
              <p class="mb-0">No maintenance requests found</p>
              <button class="btn btn-primary btn-sm mt-2" onclick="showAddMaintenanceModal()">
                <i class="fas fa-plus me-1"></i>Add First Request
              </button>
            </td>
          </tr>
        `;
    document.getElementById("maintenance-count").textContent = "0";
    return;
  }

  tbody.innerHTML = "";

  filteredMaintenanceRequests.forEach((request) => {
    const row = document.createElement("tr");

    // Get drainage point name
    const point = drainagePoints.find((p) => p.id == request.drainage_point_id);

    const pointName =
      request.drainage_point_name || `Point ${request.drainage_point_id}`;

    // Get assigned user name
    const assignedUser = users.find(
      (u) => u.id === parseInt(request.assigned_to)
    );
    const assignedName = assignedUser
      ? `${assignedUser.first_name} ${assignedUser.last_name}`
      : request.assigned_to
      ? "User not found"
      : "Unassigned";

    row.innerHTML = `
          <td>${request.id}</td>
          <td>${pointName}</td>
          <td>${request.request_type}</td>
          <td><span class="badge priority-${request.priority.toLowerCase()}">${
      request.priority
    }</span></td>
          <td><span class="badge status-${request.status
            .toLowerCase()
            .replace(" ", "-")}">${request.status}</span></td>
          <td>${assignedName}</td>
          <td>${request.scheduled_date || "Not scheduled"}</td>
          <td>${
            request.estimated_cost
              ? `RM ${parseFloat(request.estimated_cost).toFixed(2)}`
              : "N/A"
          }</td>
          <td>${formatDate(request.created_at)}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-primary" onclick="editMaintenanceRequest(${
                request.id
              })" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-info" onclick="viewMaintenanceRequest(${
                request.id
              })" title="View">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="deleteMaintenanceRequest(${
                request.id
              })" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        `;
    tbody.appendChild(row);
  });

  document.getElementById("maintenance-count").textContent =
    filteredMaintenanceRequests.length;
  filteredMaintenanceRequests.forEach((request) => {
    console.log(
      "Maintenance request drainage_point_id:",
      request.drainage_point_id
    );
    const point = drainagePoints.find((p) => p.id == request.drainage_point_id);
    console.log("Found drainage point:", point);
  });
}

/**
 * Render inspection table
 */
function renderInspectionTable() {
  const tbody = document.getElementById("inspection-table-body");

  if (isLoading) return;

  if (filteredInspectionSchedules.length === 0) {
    tbody.innerHTML = `
          <tr>
            <td colspan="10" class="text-center text-muted py-4">
              <i class="fas fa-clipboard-check fa-2x mb-2 d-block"></i>
              <p class="mb-0">No inspection schedules found</p>
              <button class="btn btn-primary btn-sm mt-2" onclick="showAddInspectionModal()">
                <i class="fas fa-plus me-1"></i>Add First Schedule
              </button>
            </td>
          </tr>
        `;
    document.getElementById("inspection-count").textContent = "0";
    return;
  }

  tbody.innerHTML = "";

  filteredInspectionSchedules.forEach((schedule) => {
    const row = document.createElement("tr");

    // Get drainage point name
    const point = drainagePoints.find(
      (p) => p.id == schedule.drainage_point_id
    );
    const pointName = point
      ? point.name
      : `Point ${schedule.drainage_point_id}`;

    // Get inspector name
    const inspector = users.find((u) => u.id == schedule.operator_id);
    const inspectorName = inspector
      ? `${inspector.first_name} ${inspector.last_name}`
      : "Unassigned";

    row.innerHTML = `
          <td>${schedule.id}</td>
          <td>${pointName}</td>
          <td>${schedule.inspection_type}</td>
          <td><span class="badge priority-${schedule.priority.toLowerCase()}">${
      schedule.priority
    }</span></td>
          <td><span class="badge status-${schedule.status
            .toLowerCase()
            .replace(" ", "-")}">${schedule.status}</span></td>
          <td>${inspectorName}</td>
          <td>${schedule.scheduled_date}${
      schedule.scheduled_time ? " " + schedule.scheduled_time : ""
    }</td>
          <td>${schedule.frequency}</td>
          <td>${formatDate(schedule.created_at)}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-primary" onclick="editInspectionSchedule(${
                schedule.id
              })" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-info" onclick="viewInspectionSchedule(${
                schedule.id
              })" title="View">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="deleteInspectionSchedule(${
                schedule.id
              })" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        `;
    tbody.appendChild(row);
  });

  document.getElementById("inspection-count").textContent =
    filteredInspectionSchedules.length;
}

/**
 * Apply maintenance filters
 */
function applyMaintenanceFilters() {
  const search = document
    .getElementById("maintenance-search")
    .value.toLowerCase();
  const status = document.getElementById("maintenance-status-filter").value;
  const priority = document.getElementById("maintenance-priority-filter").value;
  const type = document.getElementById("maintenance-type-filter").value;

  filteredMaintenanceRequests = maintenanceRequests.filter((request) => {
    const point = drainagePoints.find((p) => p.id == request.drainage_point_id);
    const pointName = point ? point.name : "";

    const matchesSearch =
      !search ||
      pointName.toLowerCase().includes(search) ||
      request.description?.toLowerCase().includes(search) ||
      request.request_type?.toLowerCase().includes(search);

    const matchesStatus = !status || request.status === status;
    const matchesPriority = !priority || request.priority === priority;
    const matchesType = !type || request.request_type === type;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  renderMaintenanceTable();
}

/**
 * Apply inspection filters
 */
function applyInspectionFilters() {
  const search = document
    .getElementById("inspection-search")
    .value.toLowerCase();
  const status = document.getElementById("inspection-status-filter").value;
  const priority = document.getElementById("inspection-priority-filter").value;
  const frequency = document.getElementById(
    "inspection-frequency-filter"
  ).value;

  filteredInspectionSchedules = inspectionSchedules.filter((schedule) => {
    const point = drainagePoints.find(
      (p) => p.id == schedule.drainage_point_id
    );
    const pointName = point ? point.name : "";

    const matchesSearch =
      !search ||
      pointName.toLowerCase().includes(search) ||
      schedule.description?.toLowerCase().includes(search) ||
      schedule.inspection_type?.toLowerCase().includes(search);

    const matchesStatus = !status || schedule.status === status;
    const matchesPriority = !priority || schedule.priority === priority;
    const matchesFrequency = !frequency || schedule.frequency === frequency;

    return (
      matchesSearch && matchesStatus && matchesPriority && matchesFrequency
    );
  });

  // Maintain sort order after filtering
  filteredInspectionSchedules.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  renderInspectionTable();
}

/**
 * Show add maintenance modal
 */
function showAddMaintenanceModal() {
  document.getElementById("maintenanceModalTitle").innerHTML =
    '<i class="fas fa-wrench me-2"></i>Add Maintenance Request';
  document.getElementById("saveMaintenanceBtn").innerHTML =
    '<i class="fas fa-save me-1"></i>Save Request';
  document.getElementById("maintenanceForm").reset();
  document.getElementById("maintenance-id").value = "";

  const modal = new bootstrap.Modal(
    document.getElementById("maintenanceModal")
  );
  modal.show();
}

/**
 * Show add inspection modal
 */
function showAddInspectionModal() {
  document.getElementById("inspectionModalTitle").innerHTML =
    '<i class="fas fa-clipboard-check me-2"></i>Add Inspection Schedule';
  document.getElementById("saveInspectionBtn").innerHTML =
    '<i class="fas fa-save me-1"></i>Save Schedule';
  document.getElementById("inspectionForm").reset();
  document.getElementById("inspection-id").value = "";

  const modal = new bootstrap.Modal(document.getElementById("inspectionModal"));
  modal.show();
}

/**
 * Edit maintenance request
 */
function editMaintenanceRequest(id) {
  const request = maintenanceRequests.find((r) => r.id === id);
  if (!request) {
    showNotification("Maintenance request not found", "danger");
    return;
  }

  document.getElementById("maintenanceModalTitle").innerHTML =
    '<i class="fas fa-wrench me-2"></i>Edit Maintenance Request';
  document.getElementById("saveMaintenanceBtn").innerHTML =
    '<i class="fas fa-save me-1"></i>Update Request';

  console.log("Editing maintenance request:", request);
  console.log("Drainage point ID:", request.drainage_point_id);
  // Populate form
  document.getElementById("maintenance-id").value = request.id;
  document.getElementById("modal-maintenance-point").value =
    request.drainage_point_id ? request.drainage_point_id.toString() : "";
  document.getElementById("modal-maintenance-type").value =
    request.request_type;
  document.getElementById("modal-maintenance-priority").value =
    request.priority;
  document.getElementById("modal-maintenance-status").value = request.status;
  document.getElementById("modal-maintenance-cost").value =
    request.estimated_cost;
  document.getElementById("modal-maintenance-assigned").value =
    request.assigned_to ? request.assigned_to.toString() : "";
  document.getElementById("modal-maintenance-scheduled").value =
    request.scheduled_date || "";
  document.getElementById("modal-maintenance-description").value =
    request.description;
  document.getElementById("modal-maintenance-notes").value =
    request.notes || "";

  const modal = new bootstrap.Modal(
    document.getElementById("maintenanceModal")
  );
  modal.show();
}

/**
 * Edit inspection schedule
 */
function editInspectionSchedule(id) {
  const schedule = inspectionSchedules.find((s) => s.id === id);
  if (!schedule) {
    showNotification("Inspection schedule not found", "danger");
    return;
  }

  document.getElementById("inspectionModalTitle").innerHTML =
    '<i class="fas fa-clipboard-check me-2"></i>Edit Inspection Schedule';
  document.getElementById("saveInspectionBtn").innerHTML =
    '<i class="fas fa-save me-1"></i>Update Schedule';

  // Populate form
  document.getElementById("inspection-id").value = schedule.id;
  document.getElementById("modal-inspection-point").value =
    schedule.drainage_point_id;
  document.getElementById("modal-inspection-type").value =
    schedule.inspection_type;
  document.getElementById("modal-inspection-priority").value =
    schedule.priority;
  document.getElementById("modal-inspection-status").value = schedule.status;
  document.getElementById("modal-inspection-date").value =
    schedule.scheduled_date;
  document.getElementById("modal-inspection-time").value =
    schedule.scheduled_time;
  document.getElementById("modal-inspection-frequency").value =
    schedule.frequency;
  document.getElementById("modal-inspection-inspector").value =
    schedule.operator_id;
  document.getElementById("modal-inspection-description").value =
    schedule.description || "";
  document.getElementById("modal-inspection-findings").value =
    schedule.findings || "";
  document.getElementById("modal-inspection-recommendations").value =
    schedule.recommendations || "";

  const modal = new bootstrap.Modal(document.getElementById("inspectionModal"));
  modal.show();
}

/**
 * Save maintenance request
 */
async function saveMaintenanceRequest() {
  const formData = {
    drainage_point_id: document.getElementById("modal-maintenance-point").value,
    request_type: document.getElementById("modal-maintenance-type").value,
    priority: document.getElementById("modal-maintenance-priority").value,
    status: document.getElementById("modal-maintenance-status").value,
    estimated_cost:
      document.getElementById("modal-maintenance-cost").value || null,
    assigned_to:
      document.getElementById("modal-maintenance-assigned").value || null,
    scheduled_date:
      document.getElementById("modal-maintenance-scheduled").value || null,
    description: document.getElementById("modal-maintenance-description").value,
    notes: document.getElementById("modal-maintenance-notes").value || null,
    requested_by: currentUser.id,
  };

  const id = document.getElementById("maintenance-id").value;

  // Validation
  if (!formData.drainage_point_id) {
    showNotification("Please select a drainage point", "warning");
    return;
  }

  if (!formData.request_type) {
    showNotification("Please select a maintenance type", "warning");
    return;
  }

  if (!formData.description.trim()) {
    showNotification("Please provide a description", "warning");
    return;
  }

  try {
    const method = id ? "PUT" : "POST";
    const url = "../api/maintenance-requests.php";

    if (id) {
      formData.id = id;
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      showNotification(
        id
          ? "Maintenance request updated successfully!"
          : "Maintenance request created successfully!",
        "success"
      );

      bootstrap.Modal.getInstance(
        document.getElementById("maintenanceModal")
      ).hide();
      await loadMaintenanceRequests(); // Reload data
    } else {
      throw new Error(result.message || "Failed to save maintenance request");
    }
  } catch (error) {
    console.error("Error saving maintenance request:", error);
    showNotification(
      `Error saving maintenance request: ${error.message}`,
      "danger"
    );
  }
}

/**
 * Save inspection schedule
 */
async function saveInspectionSchedule() {
  const formData = {
    drainage_point_id: document.getElementById("modal-inspection-point").value,
    inspection_type: document.getElementById("modal-inspection-type").value,
    priority: document.getElementById("modal-inspection-priority").value,
    status: document.getElementById("modal-inspection-status").value,
    scheduled_date: document.getElementById("modal-inspection-date").value,
    scheduled_time:
      document.getElementById("modal-inspection-time").value || null,
    frequency: document.getElementById("modal-inspection-frequency").value,
    operator_id:
      document.getElementById("modal-inspection-inspector").value || null,
    description:
      document.getElementById("modal-inspection-description").value || null,
    findings:
      document.getElementById("modal-inspection-findings").value || null,
    recommendations:
      document.getElementById("modal-inspection-recommendations").value || null,
    created_by: currentUser.id,
  };

  const id = document.getElementById("inspection-id").value;

  // Validation
  if (!formData.drainage_point_id) {
    showNotification("Please select a drainage point", "warning");
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

  try {
    const method = id ? "PUT" : "POST";
    const url = "../api/inspection-schedules.php";

    if (id) {
      formData.id = id;
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      showNotification(
        id
          ? "Inspection schedule updated successfully!"
          : "Inspection schedule created successfully!",
        "success"
      );

      bootstrap.Modal.getInstance(
        document.getElementById("inspectionModal")
      ).hide();
      await loadInspectionSchedules(); // Reload data
    } else {
      throw new Error(result.message || "Failed to save inspection schedule");
    }
  } catch (error) {
    console.error("Error saving inspection schedule:", error);
    showNotification(
      `Error saving inspection schedule: ${error.message}`,
      "danger"
    );
  }
}

/**
 * Delete maintenance request
 */
async function deleteMaintenanceRequest(id) {
  if (!confirm("Are you sure you want to delete this maintenance request?"))
    return;

  try {
    const response = await fetch(`../api/maintenance-requests.php?id=${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Maintenance request deleted successfully", "success");
      await loadMaintenanceRequests(); // Reload data
    } else {
      throw new Error(result.message || "Failed to delete maintenance request");
    }
  } catch (error) {
    console.error("Error deleting maintenance request:", error);
    showNotification(
      `Error deleting maintenance request: ${error.message}`,
      "danger"
    );
  }
}

/**
 * Delete inspection schedule
 */
async function deleteInspectionSchedule(id) {
  if (!confirm("Are you sure you want to delete this inspection schedule?"))
    return;

  try {
    const response = await fetch(`../api/inspection-schedules.php?id=${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Inspection schedule deleted successfully", "success");
      await loadInspectionSchedules(); // Reload data
    } else {
      throw new Error(result.message || "Failed to delete inspection schedule");
    }
  } catch (error) {
    console.error("Error deleting inspection schedule:", error);
    showNotification(
      `Error deleting inspection schedule: ${error.message}`,
      "danger"
    );
  }
}

/**
 * View maintenance request details
 */
function viewMaintenanceRequest(id) {
  const request = maintenanceRequests.find((r) => r.id === id);
  if (!request) {
    showNotification("Maintenance request not found", "danger");
    return;
  }

  const point = drainagePoints.find((p) => p.id == request.drainage_point_id);
  const pointName = point ? point.name : `Point ${request.drainage_point_id}`;

  const assignedUser = users.find((u) => u.id == request.assigned_to);
  const assignedName = assignedUser
    ? `${assignedUser.first_name} ${assignedUser.last_name}`
    : "Unassigned";

  alert(
    `Maintenance Request Details:\n\nID: ${
      request.id
    }\nPoint: ${pointName}\nType: ${request.request_type}\nPriority: ${
      request.priority
    }\nStatus: ${request.status}\nAssigned To: ${assignedName}\nScheduled: ${
      request.scheduled_date || "Not scheduled"
    }\nCost: ${
      request.estimated_cost ? `RM ${request.estimated_cost}` : "N/A"
    }\nDescription: ${request.description}`
  );
}

/**
 * View inspection schedule details
 */
function viewInspectionSchedule(id) {
  const schedule = inspectionSchedules.find((s) => s.id === id);
  if (!schedule) {
    showNotification("Inspection schedule not found", "danger");
    return;
  }

  const point = drainagePoints.find((p) => p.id == schedule.drainage_point_id);
  const pointName = point ? point.name : `Point ${schedule.drainage_point_id}`;

  const inspector = users.find((u) => u.id == schedule.operator_id);
  const inspectorName = inspector
    ? `${inspector.first_name} ${inspector.last_name}`
    : "Unassigned";

  alert(
    `Inspection Schedule Details:\n\nID: ${
      schedule.id
    }\nPoint: ${pointName}\nType: ${schedule.inspection_type}\nPriority: ${
      schedule.priority
    }\nStatus: ${schedule.status}\nInspector: ${inspectorName}\nScheduled: ${
      schedule.scheduled_date
    } ${schedule.scheduled_time || ""}\nFrequency: ${
      schedule.frequency
    }\nDescription: ${schedule.description || "N/A"}`
  );
}

/**
 * Refresh maintenance data
 */
async function refreshMaintenanceData() {
  try {
    await loadMaintenanceRequests();
    showNotification("Maintenance data refreshed", "success");
  } catch (error) {
    showNotification("Error refreshing maintenance data", "danger");
  }
}

/**
 * Refresh inspection data
 */
async function refreshInspectionData() {
  try {
    await loadInspectionSchedules();
    showNotification("Inspection data refreshed", "success");
  } catch (error) {
    showNotification("Error refreshing inspection data", "danger");
  }
}

// ==========================================
// COMPLETION REPORTS FUNCTIONALITY (COMPLETE FIXED VERSION)
// ==========================================

/**
 * Load completion reports from API
 */
async function loadCompletionReports() {
  try {
    console.log("Loading completion reports...");

    const response = await fetch("../api/completion-reports.php");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Completion reports API response:", data);

    if (data.success && Array.isArray(data.data)) {
      completionReports = data.data;

      // Update statistics
      if (data.stats) {
        updateReportsStatistics(data.stats);
      } else {
        // Calculate stats if not provided
        const stats = calculateReportsStatistics(completionReports);
        updateReportsStatistics(stats);
      }
    } else {
      throw new Error("Invalid data format received");
    }

    filteredCompletionReports = [...completionReports];
    renderCompletionReportsTable();

    console.log("Loaded completion reports:", completionReports.length);
  } catch (error) {
    console.error("Error loading completion reports:", error);
    showNotification(
      "Could not load completion reports from server",
      "warning"
    );

    // Show empty state
    completionReports = [];
    filteredCompletionReports = [];
    updateReportsStatistics({
      total: 0,
      pending_review: 0,
      approved: 0,
      follow_up_required: 0,
    });
    renderCompletionReportsTable();
  }
}

/**
 * Calculate statistics from reports data
 */
function calculateReportsStatistics(reports) {
  return {
    total: reports.length,
    pending_review: reports.filter((r) => r.status === "pending_review").length,
    approved: reports.filter((r) => r.status === "approved").length,
    follow_up_required: reports.filter((r) => r.status === "follow_up_required")
      .length,
  };
}

/**
 * Update reports statistics in the UI
 */
function updateReportsStatistics(stats) {
  document.getElementById("reports-total").textContent = stats.total || 0;
  document.getElementById("reports-pending").textContent =
    stats.pending_review || 0;
  document.getElementById("reports-approved").textContent = stats.approved || 0;
  document.getElementById("reports-followup").textContent =
    stats.follow_up_required || 0;
}

/**
 * Render completion reports table with proper data formatting
 */
function renderCompletionReportsTable() {
  const tbody = document.getElementById("reports-table-body");

  if (filteredCompletionReports.length === 0) {
    tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">
            <i class="fas fa-file-alt fa-2x mb-2 d-block"></i>
            <p class="mb-0">No completion reports found</p>
            <p class="text-muted small">Complete some maintenance or inspection tasks to see reports here</p>
          </td>
        </tr>
      `;
    document.getElementById("reports-count").textContent = "0";
    return;
  }

  tbody.innerHTML = "";

  filteredCompletionReports.forEach((report) => {
    const row = document.createElement("tr");

    const statusBadge = getReportStatusBadge(report.status || "pending_review");
    const taskId = report.task_number || report.id;
    const hoursDisplay = report.hours_worked
      ? `${report.hours_worked}h`
      : "N/A";
    const completionDate = report.completion_date || report.updated_at;

    row.innerHTML = `
        <td>
          <span class="fw-bold">${taskId}</span>
          <br><small class="text-muted">${report.task_type}</small>
        </td>
        <td>
          <span class="fw-bold">${report.type_detail || "Unknown"}</span>
          ${
            report.priority
              ? `<br><span class="badge priority-${report.priority.toLowerCase()}">${
                  report.priority
                }</span>`
              : ""
          }
        </td>
        <td>
          <span class="fw-bold">${report.location || "Unknown"}</span>
          ${
            report.estimated_cost
              ? `<br><small class="text-muted">Est: RM${parseFloat(
                  report.estimated_cost
                ).toFixed(2)}</small>`
              : ""
          }
        </td>
        <td>
          <span class="fw-bold">${report.operator_name || "Unknown"}</span>
        </td>
        <td>
          <span class="fw-bold">${formatDate(completionDate)}</span>
          <br><small class="text-muted">${formatTime(completionDate)}</small>
        </td>
        <td>
          <span class="fw-bold">${hoursDisplay}</span>
          ${
            report.completion_percentage
              ? `<br><small class="text-muted">${report.completion_percentage}% complete</small>`
              : ""
          }
        </td>
        <td>${statusBadge}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="viewCompletionReport('${
              report.id
            }', '${report.task_type}')" title="View Report">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-success" onclick="downloadCompletionReport('${
              report.id
            }', '${report.task_type}')" title="Download PDF">
              <i class="fas fa-download"></i>
            </button>
            ${
              report.status === "pending_review"
                ? `
              <button class="btn btn-sm btn-warning" onclick="approveCompletionReport('${report.id}', '${report.task_type}')" title="Approve">
                <i class="fas fa-check"></i>
              </button>
              <button class="btn btn-sm btn-info" onclick="requestFollowUp('${report.id}', '${report.task_type}')" title="Request Follow-up">
                <i class="fas fa-redo"></i>
              </button>
            `
                : ""
            }
            <button class="btn btn-sm btn-danger" onclick="deleteCompletionReport('${
              report.id
            }')" title="Delete Report">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
    tbody.appendChild(row);
  });

  document.getElementById("reports-count").textContent =
    filteredCompletionReports.length;
}

/**
 * Format time from datetime string
 */
function formatTime(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "";
  }
}

/**
 * Get report status badge
 */
function getReportStatusBadge(status) {
  const badges = {
    pending_review:
      '<span class="badge bg-warning text-dark">Pending Review</span>',
    approved: '<span class="badge bg-success">Approved</span>',
    follow_up_required: '<span class="badge bg-info">Follow-up Required</span>',
    rejected: '<span class="badge bg-danger">Rejected</span>',
  };
  return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
}

/**
 * Apply reports filters with improved search
 */
function applyReportsFilters() {
  const search = document.getElementById("reports-search").value.toLowerCase();
  const status = document.getElementById("reports-status-filter").value;
  const type = document.getElementById("reports-type-filter").value;
  const date = document.getElementById("reports-date-filter").value;

  filteredCompletionReports = completionReports.filter((report) => {
    const matchesSearch =
      !search ||
      (report.location && report.location.toLowerCase().includes(search)) ||
      (report.operator_name &&
        report.operator_name.toLowerCase().includes(search)) ||
      (report.task_type && report.task_type.toLowerCase().includes(search)) ||
      (report.type_detail &&
        report.type_detail.toLowerCase().includes(search)) ||
      (report.task_number && report.task_number.toLowerCase().includes(search));

    const matchesStatus =
      !status || (report.status || "pending_review") === status;

    const matchesType =
      !type || (report.task_type && report.task_type.toLowerCase() === type);

    const matchesDate =
      !date ||
      (report.completion_date &&
        new Date(report.completion_date).toISOString().split("T")[0] === date);

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  renderCompletionReportsTable();
}

/**
 * Delete completion report with confirmation (FIXED)
 */
async function deleteCompletionReport(reportId) {
  if (
    !confirm(
      "Are you sure you want to delete this completion report?\n\nThis will reset the task status and remove all completion data."
    )
  ) {
    return;
  }

  try {
    showLoading(true);

    // Extract numeric ID if it has prefix
    const numericId = reportId.toString().replace(/^(MR-|IS-)/, "");

    const response = await fetch(
      `../api/completion-reports.php?id=${numericId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      showNotification("Completion report deleted successfully", "success");

      // Remove from local data
      const index = completionReports.findIndex(
        (r) =>
          r.id === reportId || r.id === numericId || r.task_number === reportId
      );
      if (index !== -1) {
        completionReports.splice(index, 1);
        filteredCompletionReports = [...completionReports];

        // Update statistics
        const stats = calculateReportsStatistics(completionReports);
        updateReportsStatistics(stats);

        renderCompletionReportsTable();
      }

      // Also refresh other data that might be affected
      await Promise.all([loadMaintenanceRequests(), loadInspectionSchedules()]);
    } else {
      throw new Error(result.message || "Failed to delete completion report");
    }
  } catch (error) {
    console.error("Error deleting completion report:", error);
    showNotification(`Error deleting report: ${error.message}`, "danger");
  } finally {
    showLoading(false);
  }
}

/**
 * View completion report details with robust fallback (FIXED)
 */
async function viewCompletionReport(reportId, taskType) {
  try {
    showLoading(true);
    console.log(`🔍 Loading completion report:`, { reportId, taskType });

    // Extract numeric ID for API call
    const numericId = reportId.toString().replace(/^(MR-|IS-)/, "");
    const apiUrl = `../api/task-completion-report.php?task_id=${numericId}&task_type=${taskType}`;

    console.log(`📡 API URL: ${apiUrl}`);

    // Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    console.log(
      `📊 Response status: ${response.status} ${response.statusText}`
    );
    console.log(`📋 Content-Type: ${response.headers.get("content-type")}`);

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`, errorText);

      throw new Error(
        `HTTP ${response.status}: ${
          response.statusText
        }\n\nServer response: ${errorText.substring(0, 200)}${
          errorText.length > 200 ? "..." : ""
        }`
      );
    }

    // Get response text first to check format
    const responseText = await response.text();
    console.log(`📝 Raw response preview:`, responseText.substring(0, 200));

    // Check if response looks like JSON
    if (
      !responseText.trim().startsWith("{") &&
      !responseText.trim().startsWith("[")
    ) {
      console.error(
        `❌ Invalid response format. Expected JSON, got:`,
        responseText.substring(0, 500)
      );

      throw new Error(
        `Server returned invalid response format. Expected JSON but got:\n\n${responseText.substring(
          0,
          300
        )}${responseText.length > 300 ? "..." : ""}`
      );
    }

    // Parse JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`❌ JSON Parse Error:`, parseError);
      console.error(`Raw response:`, responseText);

      throw new Error(
        `Failed to parse server response as JSON:\n\n${
          parseError.message
        }\n\nResponse preview:\n${responseText.substring(0, 200)}${
          responseText.length > 200 ? "..." : ""
        }`
      );
    }

    console.log("✅ Parsed API response:", result);

    // Check API success
    if (!result.success) {
      console.error("❌ API returned error:", result);
      throw new Error(result.message || "API returned unsuccessful response");
    }

    if (!result.data) {
      throw new Error("No data returned from API");
    }

    // SUCCESS: Show modal with real data
    showCompletionReportModal(result.data);
    console.log("✅ Modal displayed successfully");
  } catch (error) {
    console.error("❌ Error in viewCompletionReport:", error);

    if (error.name === "AbortError") {
      showNotification("Request timed out. Please try again.", "warning");
    } else if (error.message.includes("fetch")) {
      showNotification(
        "Network error. Please check your connection and try again.",
        "warning"
      );
    } else {
      // Show detailed error for debugging
      showNotification(
        `Cannot load completion report: ${error.message}`,
        "danger"
      );
    }

    // Show basic info as fallback
    showBasicReportInfoFallback(reportId, taskType);
  } finally {
    showLoading(false);
  }
}
/**
 * Show basic report info when detailed data is not available
 */
function showBasicReportInfoFallback(reportId, taskType) {
  console.log(`📋 Showing basic report info for ${reportId}`);

  // Find the basic report from the summary data
  const basicReport = completionReports.find(
    (r) => r.id == reportId || r.task_number == reportId
  );

  if (!basicReport) {
    console.warn("⚠️ Report not found in local data");
    showNotification("Report not found in local data", "warning");
    return;
  }

  // Create a simple modal instead of an alert
  showBasicReportModal(basicReport, reportId, taskType);
}

/**
 * Show basic report modal when detailed data is not available (NEW)
 */
function showBasicReportModal(basicReport, reportId, taskType) {
  const modalHtml = `
      <div class="modal fade" id="basicReportModal" tabindex="-1" aria-labelledby="basicReportModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-warning">
              <h5 class="modal-title text-dark" id="basicReportModalLabel">
                <i class="fas fa-exclamation-triangle me-2"></i>Basic Report Info
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="alert alert-warning">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Limited Data Available:</strong> Detailed completion data could not be loaded from the server. 
                Showing basic information from the summary only.
              </div>
              
              <div class="row">
                <div class="col-md-6">
                  <h6><i class="fas fa-info-circle me-2"></i>Task Information</h6>
                  <table class="table table-bordered table-sm">
                    <tr><th width="40%">Task ID:</th><td>${
                      basicReport.task_number || basicReport.id
                    }</td></tr>
                    <tr><th>Type:</th><td>${basicReport.task_type} - ${
    basicReport.type_detail || "Unknown"
  }</td></tr>
                    <tr><th>Location:</th><td>${
                      basicReport.location || "Unknown"
                    }</td></tr>
                    <tr><th>Priority:</th><td><span class="badge priority-${(
                      basicReport.priority || "medium"
                    ).toLowerCase()}">${
    basicReport.priority || "Medium"
  }</span></td></tr>
                    <tr><th>Operator:</th><td>${
                      basicReport.operator_name || "Unknown"
                    }</td></tr>
                  </table>
                </div>
                
                <div class="col-md-6">
                  <h6><i class="fas fa-clock me-2"></i>Completion Summary</h6>
                  <table class="table table-bordered table-sm">
                    <tr><th width="40%">Completed:</th><td>${formatDate(
                      basicReport.completion_date || basicReport.updated_at
                    )}</td></tr>
                    <tr><th>Hours:</th><td>${
                      basicReport.hours_worked || "Not specified"
                    }</td></tr>
                    <tr><th>Status:</th><td><span class="badge ${getStatusBadgeClass(
                      basicReport.status
                    )}">${
    basicReport.status || "pending_review"
  }</span></td></tr>
                    <tr><th>Est. Cost:</th><td>${
                      basicReport.estimated_cost
                        ? "RM " + basicReport.estimated_cost
                        : "N/A"
                    }</td></tr>
                    <tr><th>Actual Cost:</th><td>${
                      basicReport.actual_cost
                        ? "RM " + basicReport.actual_cost
                        : "N/A"
                    }</td></tr>
                  </table>
                </div>
              </div>
  
              <div class="mt-3">
                <h6><i class="fas fa-comment-alt me-2"></i>Available Notes</h6>
                <div class="card">
                  <div class="card-body">
                    <p class="mb-0">${
                      basicReport.work_summary ||
                      basicReport.completion_notes ||
                      basicReport.findings ||
                      "No detailed notes available in summary data."
                    }</p>
                  </div>
                </div>
              </div>
  
              <div class="mt-3 alert alert-info">
                <i class="fas fa-lightbulb me-2"></i>
                <strong>Troubleshooting:</strong> If you need detailed completion data (photos, work logs, etc.), 
                please check:
                <ul class="mb-0 mt-2">
                  <li>Database connectivity</li>
                  <li>API server status</li>
                  <li>Task completion was properly saved</li>
                </ul>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" onclick="downloadBasicReport('${
                basicReport.task_number || basicReport.id
              }', basicReport)">
                <i class="fas fa-download me-1"></i>Download Basic Report
              </button>
              ${
                basicReport.status === "pending_review"
                  ? `
                <button type="button" class="btn btn-success" onclick="approveCompletionReport('${reportId}', '${taskType}'); $('#basicReportModal').modal('hide');">
                  <i class="fas fa-check me-1"></i>Approve
                </button>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;

  // Remove existing modal if any
  const existingModal = document.getElementById("basicReportModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to page and show
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modal = new bootstrap.Modal(
    document.getElementById("basicReportModal")
  );
  modal.show();

  // Clean up when modal is hidden
  document.getElementById("basicReportModal").addEventListener(
    "hidden.bs.modal",
    function () {
      this.remove();
    },
    { once: true }
  );
}

/**
 * Approve completion report (FIXED)
 */
async function approveCompletionReport(reportId, taskType) {
  const notes = prompt("Approval notes (optional):");

  if (notes === null) return; // User cancelled

  try {
    showLoading(true);

    // Extract numeric ID for API call
    const numericId = reportId.toString().replace(/^(MR-|IS-)/, "");

    const response = await fetch("../api/completion-reports.php", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: numericId,
        action: "approve",
        notes: notes,
        approved_by: currentUser.id,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      showNotification("Completion report approved successfully!", "success");

      // Close any open modals
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("completionReportViewModal")
      );
      if (modal) modal.hide();

      // Refresh reports data
      await loadCompletionReports();
    } else {
      throw new Error(result.message || "Failed to approve report");
    }
  } catch (error) {
    console.error("Error approving report:", error);

    // Fallback: Update local data
    const reportIndex = completionReports.findIndex(
      (r) => r.id == reportId || r.task_number == reportId
    );

    if (reportIndex !== -1) {
      completionReports[reportIndex].status = "approved";
      filteredCompletionReports = [...completionReports];
      renderCompletionReportsTable();

      showNotification(
        "Report approved locally (server update failed)",
        "warning"
      );

      // Close modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("completionReportViewModal")
      );
      if (modal) modal.hide();
    } else {
      showNotification(`Error approving report: ${error.message}`, "danger");
    }
  } finally {
    showLoading(false);
  }
}

/**
 * Get appropriate CSS class for status badges
 */
function getStatusBadgeClass(status) {
  const classes = {
    pending_review: "bg-warning text-dark",
    approved: "bg-success",
    follow_up_required: "bg-info",
    rejected: "bg-danger",
    Completed: "bg-success",
  };
  return classes[status] || "bg-secondary";
}
/**
 * Request follow-up work (FIXED)
 */
async function requestFollowUp(reportId, taskType) {
  const reason = prompt("Reason for follow-up request:");

  if (!reason || !reason.trim()) {
    showNotification("Follow-up reason is required", "warning");
    return;
  }

  const followUpType =
    prompt(
      "Follow-up work type (e.g., Re-inspection, Additional Maintenance):"
    ) || "Follow-up Required";
  const priority =
    prompt("Priority (Low/Medium/High/Critical):", "Medium") || "Medium";

  try {
    showLoading(true);

    // Extract numeric ID for API call
    const numericId = reportId.toString().replace(/^(MR-|IS-)/, "");

    const response = await fetch("../api/completion-reports.php", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: numericId,
        action: "follow_up",
        reason: reason.trim(),
        follow_up_type: followUpType,
        priority: priority,
        requested_by: currentUser.id,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      showNotification("Follow-up work requested successfully!", "success");

      // Close any open modals
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("completionReportViewModal")
      );
      if (modal) modal.hide();

      // Refresh reports data
      await loadCompletionReports();
    } else {
      throw new Error(result.message || "Failed to request follow-up");
    }
  } catch (error) {
    console.error("Error requesting follow-up:", error);

    // Fallback: Update local data
    const reportIndex = completionReports.findIndex(
      (r) => r.id == reportId || r.task_number == reportId
    );

    if (reportIndex !== -1) {
      completionReports[reportIndex].status = "follow_up_required";
      filteredCompletionReports = [...completionReports];
      renderCompletionReportsTable();

      showNotification(
        "Follow-up requested locally (server update failed)",
        "warning"
      );

      // Close modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("completionReportViewModal")
      );
      if (modal) modal.hide();
    } else {
      showNotification(
        `Error requesting follow-up: ${error.message}`,
        "danger"
      );
    }
  } finally {
    showLoading(false);
  }
}

/**
 * Enhanced error handling for API calls
 */
async function makeApiRequest(url, options = {}) {
  try {
    console.log(`Making API request to: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    console.log(`API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;

        // Log debug information if available
        if (errorData.debug) {
          console.error("API Debug information:", errorData.debug);
        }
      } catch (parseError) {
        console.warn("Could not parse error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("API Response data:", data);

    return data;
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
}

/**
 * Test API connectivity
 */
async function testApiConnectivity() {
  try {
    console.log("Testing API connectivity...");

    // Test session check endpoint
    const sessionResponse = await fetch("../api/session-check.php");
    console.log("Session check:", sessionResponse.status);

    // Test basic maintenance requests endpoint
    const maintenanceResponse = await fetch("../api/maintenance-requests.php");
    console.log("Maintenance requests:", maintenanceResponse.status);

    // Test database connectivity by trying to get user info
    const usersResponse = await fetch("../api/users.php");
    console.log("Users endpoint:", usersResponse.status);

    return {
      session: sessionResponse.ok,
      maintenance: maintenanceResponse.ok,
      users: usersResponse.ok,
    };
  } catch (error) {
    console.error("API connectivity test failed:", error);
    return { error: error.message };
  }
}

/**
 * Show completion report modal with improved accessibility
 */
function showCompletionReportModal(reportData) {
  const photos = reportData.completion_data?.photos || [];
  const hasPhotos = photos.length > 0;

  const modalHtml = `
    <div class="modal fade" id="completionReportViewModal" tabindex="-1" aria-labelledby="completionReportModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-primary">
            <h5 class="modal-title text-white" id="completionReportModalLabel">
              <i class="fas fa-file-alt me-2"></i>Completion Report - ${
                reportData.task_id
              }
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            
            <!-- Task Information Cards -->
            <div class="row mb-4">
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Task Information</h6>
                  </div>
                  <div class="card-body">
                    <table class="table table-borderless table-sm">
                      <tbody>
                        <tr><th width="35%">Task ID:</th><td>${
                          reportData.task_id
                        }</td></tr>
                        <tr><th>Type:</th><td>${reportData.task_type} (${
    reportData.type_detail || ""
  })</td></tr>
                        <tr><th>Location:</th><td>${
                          reportData.location || "Unknown"
                        }</td></tr>
                        <tr><th>Priority:</th><td><span class="badge priority-${(
                          reportData.priority || "medium"
                        ).toLowerCase()}">${
    reportData.priority || "Medium"
  }</span></td></tr>
                        <tr><th>Operator:</th><td>${
                          reportData.operator_name || "Unknown"
                        }</td></tr>
                        <tr><th>Scheduled:</th><td>${
                          reportData.scheduled_date || "N/A"
                        }${
    reportData.scheduled_time ? " " + reportData.scheduled_time : ""
  }</td></tr>
                        <tr><th>Completed:</th><td>${formatDate(
                          reportData.completion_data?.completed_at ||
                            reportData.updated_at
                        )}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fas fa-clipboard-check me-2"></i>Completion Details</h6>
                  </div>
                  <div class="card-body">
                    <table class="table table-borderless table-sm">
                      <tbody>
                        <tr><th width="35%">Hours Worked:</th><td>${
                          reportData.completion_data?.hours_worked ||
                          reportData.hours_worked ||
                          "Not specified"
                        }</td></tr>
                        <tr><th>Completion:</th><td>
                          <div class="progress" style="height: 20px;">
                            <div class="progress-bar bg-success" style="width: ${
                              reportData.completion_data
                                ?.completion_percentage || 100
                            }%">
                              ${
                                reportData.completion_data
                                  ?.completion_percentage || 100
                              }%
                            </div>
                          </div>
                        </td></tr>
                        <tr><th>Estimated Cost:</th><td>${
                          reportData.estimated_cost
                            ? "RM " +
                              parseFloat(reportData.estimated_cost).toFixed(2)
                            : "N/A"
                        }</td></tr>
                        <tr><th>Actual Cost:</th><td>${
                          reportData.actual_cost
                            ? "RM " +
                              parseFloat(reportData.actual_cost).toFixed(2)
                            : "N/A"
                        }</td></tr>
                        <tr><th>Materials Used:</th><td>${
                          reportData.completion_data?.materials_used ||
                          "Not specified"
                        }</td></tr>
                        <tr><th>Photos:</th><td><span class="badge bg-info">${
                          photos.length
                        } ${
    photos.length === 1 ? "photo" : "photos"
  }</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Work Summary Section -->
            <div class="row mb-4">
              <div class="col-12">
                <div class="card">
                  <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fas fa-comment-alt me-2"></i>Work Summary & Notes</h6>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <strong><i class="fas fa-clipboard-list me-1"></i> Work Summary:</strong>
                      <div class="mt-2 p-3 bg-light rounded">
                        ${
                          reportData.completion_data?.notes ||
                          reportData.work_summary ||
                          "No work summary provided"
                        }
                      </div>
                    </div>
                    
                    ${
                      reportData.completion_data?.findings ||
                      reportData.findings
                        ? `
                      <div class="mb-3">
                        <strong><i class="fas fa-search me-1"></i> Inspection Findings:</strong>
                        <div class="mt-2 p-3 bg-light rounded">
                          ${
                            reportData.completion_data?.findings ||
                            reportData.findings
                          }
                        </div>
                      </div>
                    `
                        : ""
                    }
                    
                    ${
                      reportData.completion_data?.recommendations ||
                      reportData.recommendations
                        ? `
                      <div class="mb-3">
                        <strong><i class="fas fa-lightbulb me-1"></i> Recommendations:</strong>
                        <div class="mt-2 p-3 bg-light rounded">
                          ${
                            reportData.completion_data?.recommendations ||
                            reportData.recommendations
                          }
                        </div>
                      </div>
                    `
                        : ""
                    }
                    
                    ${
                      reportData.completion_data?.work_performed
                        ? `
                      <div class="mb-3">
                        <strong><i class="fas fa-tools me-1"></i> Work Performed:</strong>
                        <div class="mt-2 p-3 bg-light rounded">
                          ${reportData.completion_data.work_performed}
                        </div>
                      </div>
                    `
                        : ""
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Enhanced Photo Gallery Section -->
            ${
              hasPhotos
                ? `
              <div class="row">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                      <h6 class="mb-0">
                        <i class="fas fa-camera me-2"></i>Completion Photos Gallery 
                        <span class="badge bg-primary ms-2">${
                          photos.length
                        }</span>
                      </h6>
                      <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="toggleGalleryView('grid')" id="gridViewBtn">
                          <i class="fas fa-th"></i> Grid
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="toggleGalleryView('list')" id="listViewBtn">
                          <i class="fas fa-list"></i> List
                        </button>
                        <button type="button" class="btn btn-sm btn-success" onclick="downloadAllPhotos('${
                          reportData.task_id
                        }')">
                          <i class="fas fa-download"></i> Download All
                        </button>
                      </div>
                    </div>
                    <div class="card-body">
                      
                      <!-- Gallery Grid View -->
                      <div id="galleryGridView" class="gallery-view active">
                        <div class="row g-3">
                          ${photos
                            .map(
                              (photo, index) => `
                            <div class="col-lg-3 col-md-4 col-sm-6">
                              <div class="gallery-item position-relative">
                                <div class="image-container" style="height: 200px; overflow: hidden; border-radius: 8px; position: relative; cursor: pointer;" 
                                     onclick="openGalleryLightbox(${index})">
                                  <img src="${
                                    typeof photo === "string"
                                      ? photo
                                      : photo.url
                                  }" 
                                       class="img-fluid w-100 h-100" 
                                       style="object-fit: cover; transition: transform 0.3s ease;" 
                                       alt="Completion photo ${index + 1}"
                                       onmouseover="this.style.transform='scale(1.05)'"
                                       onmouseout="this.style.transform='scale(1)'">
                                  
                                  <!-- Image overlay -->
                                  <div class="image-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                                       style="background: rgba(0,0,0,0.7); opacity: 0; transition: opacity 0.3s ease;">
                                    <div class="text-white text-center">
                                      <i class="fas fa-search-plus fa-2x mb-2"></i>
                                      <div>Click to view</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <!-- Image info -->
                                <div class="mt-2">
                                  <small class="text-muted d-block">
                                    <i class="fas fa-camera me-1"></i>Photo ${
                                      index + 1
                                    }
                                    ${
                                      photo.description
                                        ? `<br><i class="fas fa-comment me-1"></i>${photo.description}`
                                        : ""
                                    }
                                    ${
                                      photo.category
                                        ? `<br><i class="fas fa-tag me-1"></i>${photo.category}`
                                        : ""
                                    }
                                  </small>
                                  <div class="mt-1">
                                    <button class="btn btn-sm btn-outline-primary me-1" onclick="viewSinglePhoto(${index})" title="View Full Size">
                                      <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-success" onclick="downloadSinglePhoto('${
                                      typeof photo === "string"
                                        ? photo
                                        : photo.url
                                    }', '${reportData.task_id}_photo_${
                                index + 1
                              }')" title="Download">
                                      <i class="fas fa-download"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          `
                            )
                            .join("")}
                        </div>
                      </div>

                      <!-- Gallery List View -->
                      <div id="galleryListView" class="gallery-view" style="display: none;">
                        <div class="list-group">
                          ${photos
                            .map(
                              (photo, index) => `
                            <div class="list-group-item">
                              <div class="row align-items-center">
                                <div class="col-md-2">
                                  <img src="${
                                    typeof photo === "string"
                                      ? photo
                                      : photo.url
                                  }" 
                                       class="img-thumbnail" 
                                       style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;" 
                                       onclick="openGalleryLightbox(${index})"
                                       alt="Photo ${index + 1}">
                                </div>
                                <div class="col-md-7">
                                  <h6 class="mb-1">Photo ${index + 1}</h6>
                                  <p class="mb-1 text-muted">${
                                    photo.description ||
                                    "No description available"
                                  }</p>
                                  <small class="text-muted">
                                    Category: ${photo.category || "General"} | 
                                    Uploaded: ${
                                      photo.uploaded_at
                                        ? formatDate(photo.uploaded_at)
                                        : "Unknown"
                                    }
                                  </small>
                                </div>
                                <div class="col-md-3 text-end">
                                  <button class="btn btn-sm btn-outline-primary me-1" onclick="viewSinglePhoto(${index})" title="View">
                                    <i class="fas fa-eye"></i>
                                  </button>
                                  <button class="btn btn-sm btn-outline-success" onclick="downloadSinglePhoto('${
                                    typeof photo === "string"
                                      ? photo
                                      : photo.url
                                  }', '${reportData.task_id}_photo_${
                                index + 1
                              }')" title="Download">
                                    <i class="fas fa-download"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          `
                            )
                            .join("")}
                        </div>
                      </div>

                      <!-- Upload New Photos Section (for updates) -->
                      <div class="mt-4 pt-3 border-top">
                        <h6><i class="fas fa-plus me-2"></i>Add Additional Photos</h6>
                        <div class="row">
                          <div class="col-md-8">
                            <input type="file" class="form-control" id="additionalPhotos" multiple accept="image/*" onchange="previewAdditionalPhotos(this)">
                            <small class="text-muted">Select multiple images (JPG, PNG, GIF). Max 5MB per image.</small>
                          </div>
                          <div class="col-md-4">
                            <button type="button" class="btn btn-success w-100" onclick="uploadAdditionalPhotos('${
                              reportData.task_id
                            }')">
                              <i class="fas fa-upload me-1"></i>Upload Photos
                            </button>
                          </div>
                        </div>
                        <div id="photoPreviewContainer" class="mt-3"></div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            `
                : `
              <!-- No Photos Section -->
              <div class="row">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header bg-light">
                      <h6 class="mb-0"><i class="fas fa-camera me-2"></i>Completion Photos</h6>
                    </div>
                    <div class="card-body text-center py-5">
                      <i class="fas fa-images fa-3x text-muted mb-3"></i>
                      <h5 class="text-muted">No Photos Available</h5>
                      <p class="text-muted">No completion photos were uploaded for this task.</p>
                      
                      <!-- Upload Section for tasks without photos -->
                      <div class="mt-4">
                        <h6>Add Completion Photos</h6>
                        <div class="row justify-content-center">
                          <div class="col-md-6">
                            <input type="file" class="form-control mb-3" id="completionPhotos" multiple accept="image/*" onchange="previewCompletionPhotos(this)">
                            <button type="button" class="btn btn-primary" onclick="uploadCompletionPhotos('${reportData.task_id}')">
                              <i class="fas fa-upload me-1"></i>Upload Photos
                            </button>
                          </div>
                        </div>
                        <div id="photoPreviewContainer" class="mt-3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `
            }

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="fas fa-times me-1"></i>Close
            </button>
            <button type="button" class="btn btn-success" onclick="approveCompletionReport('${
              reportData.task_id
            }', '${reportData.task_type}')">
              <i class="fas fa-check me-1"></i>Approve Report
            </button>
            <button type="button" class="btn btn-warning" onclick="requestFollowUp('${
              reportData.task_id
            }', '${reportData.task_type}')">
              <i class="fas fa-redo me-1"></i>Request Follow-up
            </button>
            <button type="button" class="btn btn-primary" onclick="downloadCompletionReport('${
              reportData.task_id
            }', '${reportData.task_type}')">
              <i class="fas fa-download me-1"></i>Download PDF
            </button>
            ${
              hasPhotos
                ? `
              <button type="button" class="btn btn-info" onclick="startPhotoSlideshow()">
                <i class="fas fa-play me-1"></i>Slideshow
              </button>
            `
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("completionReportViewModal");
  if (existingModal) {
    const existingModalInstance = bootstrap.Modal.getInstance(existingModal);
    if (existingModalInstance) {
      existingModalInstance.dispose();
    }
    existingModal.remove();
  }

  // Add modal to page
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Store photos data globally for gallery functions
  window.currentGalleryPhotos = photos;
  window.currentReportData = reportData;

  // Add hover effects for grid items
  setTimeout(() => {
    const galleryItems = document.querySelectorAll(
      ".gallery-item .image-container"
    );
    galleryItems.forEach((item) => {
      item.addEventListener("mouseenter", function () {
        const overlay = this.querySelector(".image-overlay");
        if (overlay) overlay.style.opacity = "1";
      });
      item.addEventListener("mouseleave", function () {
        const overlay = this.querySelector(".image-overlay");
        if (overlay) overlay.style.opacity = "0";
      });
    });
  }, 100);

  // Create and show modal
  const modalElement = document.getElementById("completionReportViewModal");
  const modal = new bootstrap.Modal(modalElement, {
    backdrop: true,
    keyboard: true,
    focus: true,
  });

  modal.show();

  // Clean up when modal is hidden
  modalElement.addEventListener(
    "hidden.bs.modal",
    function () {
      modal.dispose();
      modalElement.remove();
      // Clean up global variables
      delete window.currentGalleryPhotos;
      delete window.currentReportData;
    },
    { once: true }
  );
}
/**
 * Debug function to help troubleshoot completion report issues
 */
async function debugCompletionReport(reportId, taskType) {
  console.log("=== DEBUG COMPLETION REPORT ===");
  console.log("Report ID:", reportId);
  console.log("Task Type:", taskType);

  // Check if report exists in local data
  const localReport = completionReports.find(
    (r) => r.id == reportId || r.task_number == reportId
  );
  console.log("Local report found:", !!localReport);
  if (localReport) {
    console.log("Local report data:", localReport);
  }

  // Test API connectivity
  const connectivity = await testApiConnectivity();
  console.log("API Connectivity:", connectivity);

  // Try the specific API endpoint
  try {
    const response = await fetch(
      `../api/completion-report.php?task_id=${reportId}&task_type=${taskType}`
    );
    console.log("Completion report API status:", response.status);

    const data = await response.json();
    console.log("Completion report API response:", data);
  } catch (error) {
    console.error("Completion report API error:", error);
  }

  console.log("=== END DEBUG ===");
}

// Add this to the global scope for debugging
window.debugCompletionReport = debugCompletionReport;

/**
 * Open image in modal for viewing
 */
function openImageModal(imageSrc) {
  const imageModalHtml = `
    <div class="modal fade" id="imageViewModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-camera me-2"></i>Completion Photo
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <img src="${imageSrc}" class="img-fluid" style="max-height: 70vh;" alt="Completion photo">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <a href="${imageSrc}" download class="btn btn-primary">
              <i class="fas fa-download me-1"></i>Download
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing image modal if any
  const existingImageModal = document.getElementById("imageViewModal");
  if (existingImageModal) {
    existingImageModal.remove();
  }

  // Add modal to page and show
  document.body.insertAdjacentHTML("beforeend", imageModalHtml);
  new bootstrap.Modal(document.getElementById("imageViewModal")).show();
}
/**
 * Toggle between grid and list view for gallery
 */
function toggleGalleryView(viewType) {
  const gridView = document.getElementById("galleryGridView");
  const listView = document.getElementById("galleryListView");
  const gridBtn = document.getElementById("gridViewBtn");
  const listBtn = document.getElementById("listViewBtn");

  if (viewType === "grid") {
    gridView.style.display = "block";
    listView.style.display = "none";
    gridBtn.classList.add("active");
    listBtn.classList.remove("active");
  } else {
    gridView.style.display = "none";
    listView.style.display = "block";
    gridBtn.classList.remove("active");
    listBtn.classList.add("active");
  }
}

/**
 * Open gallery lightbox for photo viewing
 */
function openGalleryLightbox(photoIndex) {
  const photos = window.currentGalleryPhotos || [];
  if (photoIndex < 0 || photoIndex >= photos.length) return;

  const currentPhoto = photos[photoIndex];
  const photoUrl =
    typeof currentPhoto === "string" ? currentPhoto : currentPhoto.url;

  const lightboxHtml = `
    <div class="modal fade" id="galleryLightboxModal" tabindex="-1" style="z-index: 1060;">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content bg-dark">
          <div class="modal-header border-0">
            <h5 class="modal-title text-white">
              <i class="fas fa-camera me-2"></i>Photo ${photoIndex + 1} of ${
    photos.length
  }
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center p-0 position-relative">
            <img src="${photoUrl}" 
                 class="img-fluid w-100" 
                 style="max-height: 70vh; object-fit: contain;" 
                 alt="Photo ${photoIndex + 1}">
            
            <!-- Navigation arrows -->
            ${
              photos.length > 1
                ? `
              <button class="btn btn-light position-absolute top-50 start-0 translate-middle-y ms-3" 
                      onclick="navigateGallery(${photoIndex - 1})" 
                      ${photoIndex === 0 ? "disabled" : ""}>
                <i class="fas fa-chevron-left"></i>
              </button>
              <button class="btn btn-light position-absolute top-50 end-0 translate-middle-y me-3" 
                      onclick="navigateGallery(${photoIndex + 1})" 
                      ${photoIndex === photos.length - 1 ? "disabled" : ""}>
                <i class="fas fa-chevron-right"></i>
              </button>
            `
                : ""
            }
          </div>
          <div class="modal-footer border-0 bg-dark">
            <div class="w-100 d-flex justify-content-between align-items-center text-white">
              <div>
                ${
                  currentPhoto.description
                    ? `<strong>Description:</strong> ${currentPhoto.description}`
                    : ""
                }
                ${
                  currentPhoto.category
                    ? `<br><strong>Category:</strong> ${currentPhoto.category}`
                    : ""
                }
              </div>
              <div>
                <button class="btn btn-outline-light me-2" onclick="downloadSinglePhoto('${photoUrl}', 'photo_${
    photoIndex + 1
  }')">
                  <i class="fas fa-download me-1"></i>Download
                </button>
                <button class="btn btn-outline-light" data-bs-dismiss="modal">
                  <i class="fas fa-times me-1"></i>Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing lightbox
  const existingLightbox = document.getElementById("galleryLightboxModal");
  if (existingLightbox) existingLightbox.remove();

  // Add and show lightbox
  document.body.insertAdjacentHTML("beforeend", lightboxHtml);
  const lightboxModal = new bootstrap.Modal(
    document.getElementById("galleryLightboxModal")
  );
  lightboxModal.show();

  // Store current index for navigation
  window.currentLightboxIndex = photoIndex;
}

/**
 * Navigate through gallery in lightbox
 */
function navigateGallery(newIndex) {
  const photos = window.currentGalleryPhotos || [];
  if (newIndex < 0 || newIndex >= photos.length) return;

  // Close current lightbox and open new one
  const currentLightbox = bootstrap.Modal.getInstance(
    document.getElementById("galleryLightboxModal")
  );
  if (currentLightbox) currentLightbox.hide();

  setTimeout(() => {
    openGalleryLightbox(newIndex);
  }, 300);
}

/**
 * View single photo in modal
 */
function viewSinglePhoto(photoIndex) {
  openGalleryLightbox(photoIndex);
}

/**
 * Download single photo
 */
function downloadSinglePhoto(photoUrl, filename) {
  try {
    const link = document.createElement("a");
    link.href = photoUrl;
    link.download = filename || "completion_photo.jpg";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("Photo download started", "success");
  } catch (error) {
    console.error("Error downloading photo:", error);
    showNotification("Error downloading photo", "danger");
  }
}

/**
 * Download all photos as zip (simplified version)
 */
async function downloadAllPhotos(taskId) {
  try {
    const photos = window.currentGalleryPhotos || [];
    if (photos.length === 0) {
      showNotification("No photos to download", "warning");
      return;
    }

    showNotification(`Downloading ${photos.length} photos...`, "info");

    // Download each photo individually (since we don't have zip library)
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const photoUrl = typeof photo === "string" ? photo : photo.url;
      const filename = `${taskId}_completion_photo_${i + 1}.jpg`;

      setTimeout(() => {
        downloadSinglePhoto(photoUrl, filename);
      }, i * 500); // Stagger downloads
    }

    showNotification("All photos download started", "success");
  } catch (error) {
    console.error("Error downloading photos:", error);
    showNotification("Error downloading photos", "danger");
  }
}

/**
 * Preview additional photos before upload
 */
function previewAdditionalPhotos(input) {
  previewPhotos(input, "photoPreviewContainer");
}

/**
 * Preview completion photos before upload
 */
function previewCompletionPhotos(input) {
  previewPhotos(input, "photoPreviewContainer");
}

/**
 * Generic photo preview function
 */
function previewPhotos(input, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (input.files && input.files.length > 0) {
    const previewHtml = `
      <h6><i class="fas fa-eye me-2"></i>Photo Preview (${
        input.files.length
      } files)</h6>
      <div class="row g-2">
        ${Array.from(input.files)
          .map(
            (file, index) => `
          <div class="col-md-3">
            <div class="card">
              <img id="preview_${index}" class="card-img-top" style="height: 150px; object-fit: cover;" alt="Preview ${
              index + 1
            }">
              <div class="card-body p-2">
                <small class="text-muted">${file.name}</small><br>
                <small class="text-muted">${(file.size / 1024 / 1024).toFixed(
                  2
                )} MB</small>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    container.innerHTML = previewHtml;

    // Load preview images
    Array.from(input.files).forEach((file, index) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const img = document.getElementById(`preview_${index}`);
          if (img) img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

/**
 * Upload additional photos to existing report
 */
async function uploadAdditionalPhotos(taskId) {
  const input = document.getElementById("additionalPhotos");
  if (!input.files || input.files.length === 0) {
    showNotification("Please select photos to upload", "warning");
    return;
  }

  try {
    showLoading(true);
    showNotification("Uploading photos...", "info");

    const formData = new FormData();
    formData.append("task_id", taskId);
    formData.append("action", "add_photos");

    for (let i = 0; i < input.files.length; i++) {
      formData.append("photos[]", input.files[i]);
    }

    const response = await fetch("../api/completion-photos.php", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Photos uploaded successfully!", "success");

      // Refresh the modal with updated data
      setTimeout(() => {
        // Close current modal and reload report
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("completionReportViewModal")
        );
        if (modal) modal.hide();

        // Reload the completion report with new photos
        setTimeout(() => {
          viewCompletionReport(
            taskId,
            window.currentReportData?.task_type || "maintenance"
          );
        }, 500);
      }, 1000);
    } else {
      throw new Error(result.message || "Failed to upload photos");
    }
  } catch (error) {
    console.error("Error uploading photos:", error);
    showNotification(`Error uploading photos: ${error.message}`, "danger");
  } finally {
    showLoading(false);
  }
}

/**
 * Upload completion photos for reports without photos
 */
async function uploadCompletionPhotos(taskId) {
  const input = document.getElementById("completionPhotos");
  if (!input.files || input.files.length === 0) {
    showNotification("Please select photos to upload", "warning");
    return;
  }

  // Use the same upload function
  await uploadAdditionalPhotos(taskId);
}

/**
 * Start photo slideshow
 */
function startPhotoSlideshow() {
  const photos = window.currentGalleryPhotos || [];
  if (photos.length === 0) return;

  let currentIndex = 0;
  openGalleryLightbox(currentIndex);

  // Auto-advance slideshow
  const slideInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % photos.length;

    // Check if lightbox is still open
    const lightbox = document.getElementById("galleryLightboxModal");
    if (lightbox && lightbox.classList.contains("show")) {
      navigateGallery(currentIndex);
    } else {
      clearInterval(slideInterval);
    }
  }, 3000); // Change slide every 3 seconds

  // Store interval ID to clear it when modal closes
  window.currentSlideInterval = slideInterval;
}

// Add keyboard navigation for gallery
document.addEventListener("keydown", function (event) {
  const lightbox = document.getElementById("galleryLightboxModal");
  if (lightbox && lightbox.classList.contains("show")) {
    if (event.key === "ArrowLeft") {
      const currentIndex = window.currentLightboxIndex || 0;
      navigateGallery(currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      const currentIndex = window.currentLightboxIndex || 0;
      navigateGallery(currentIndex + 1);
    } else if (event.key === "Escape") {
      const modal = bootstrap.Modal.getInstance(lightbox);
      if (modal) modal.hide();
    }
  }
});

// Add CSS for gallery animations (add this to your CSS file or in a <style> tag)
const galleryStyles = `
<style>
.gallery-item {
  transition: transform 0.3s ease;
}

.gallery-item:hover {
  transform: translateY(-5px);
}

.image-overlay {
  border-radius: 8px;
}

.btn-group .btn.active {
  background-color: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.gallery-view {
  transition: opacity 0.3s ease;
}

.modal-xl .modal-body {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .gallery-item .col-lg-3,
  .gallery-item .col-md-4 {
    flex: 0 0 50%;
    max-width: 50%;
  }
}
</style>
`;

// Inject styles if not already present
if (!document.getElementById("galleryStyles")) {
  const styleElement = document.createElement("div");
  styleElement.id = "galleryStyles";
  styleElement.innerHTML = galleryStyles;
  document.head.appendChild(styleElement);
}
/**
 * Download completion report
 */
async function downloadCompletionReport(reportId, taskType) {
  try {
    showNotification("Generating report...", "info");

    // Find the report data
    const report = completionReports.find(
      (r) => r.id === reportId || r.task_number === reportId
    );
    if (!report) {
      throw new Error("Report not found");
    }

    // Generate a text-based report as fallback
    const reportContent = `
DRAINAGE MAINTENANCE COMPLETION REPORT
=====================================

Report ID: ${report.task_number || report.id}
Task Type: ${report.type_detail || report.task_type}
Location: ${report.location || "Unknown"}
Operator: ${report.operator_name || "Unknown"}
Priority: ${report.priority || "Medium"}

Completion Details:
------------------
Completed: ${formatDate(report.completion_date || report.updated_at)}
Hours Worked: ${report.hours_worked || "N/A"}
Completion: ${report.completion_percentage || 100}%
Status: ${report.status || "pending_review"}

Work Summary:
------------
${report.work_summary || "No work summary available"}

Findings:
---------
${report.findings || "No findings recorded"}

Recommendations:
---------------
${report.recommendations || "No recommendations"}

Materials Used:
--------------
${report.materials_used || "Standard materials"}

Cost Information:
----------------
Estimated Cost: ${report.estimated_cost ? `RM ${report.estimated_cost}` : "N/A"}
Actual Cost: ${report.actual_cost ? `RM ${report.actual_cost}` : "N/A"}

Generated on: ${new Date().toLocaleString()}
System: DrainTrack Management System
    `;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `completion-report-${reportId
      .toString()
      .replace(/[^a-zA-Z0-9]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showNotification("Report downloaded successfully", "success");
  } catch (error) {
    console.error("Error downloading report:", error);
    showNotification("Error generating report", "danger");
  }
}
/**
 * Download basic report
 */
function downloadBasicReport(reportId, reportData) {
  const reportContent = `
  DRAINAGE MAINTENANCE BASIC REPORT
  ================================
  
  Report ID: ${reportData.task_number || reportData.id}
  Task Type: ${reportData.type_detail || reportData.task_type}
  Location: ${reportData.location || "Unknown"}
  Operator: ${reportData.operator_name || "Unknown"}
  Priority: ${reportData.priority || "Medium"}
  
  Completion Summary:
  ------------------
  Completed: ${formatDate(reportData.completion_date || reportData.updated_at)}
  Hours Worked: ${reportData.hours_worked || "N/A"}
  Status: ${reportData.status || "pending_review"}
  
  Available Notes:
  ---------------
  ${
    reportData.work_summary ||
    reportData.completion_notes ||
    reportData.findings ||
    "No detailed notes available"
  }
  
  Cost Information:
  ----------------
  Estimated Cost: ${
    reportData.estimated_cost ? `RM ${reportData.estimated_cost}` : "N/A"
  }
  Actual Cost: ${
    reportData.actual_cost ? `RM ${reportData.actual_cost}` : "N/A"
  }
  
  ⚠️ NOTE: This is a basic report with limited data.
     Detailed completion information was not available.
  
  Generated on: ${new Date().toLocaleString()}
  System: DrainTrack Management System
    `;

  const blob = new Blob([reportContent], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `basic-report-${reportId
    .toString()
    .replace(/[^a-zA-Z0-9]/g, "-")}.txt`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  showNotification("Basic report downloaded", "success");
}

/**
 * Enhanced debug function for API issues
 */
async function debugCompletionReportAPI(reportId, taskType) {
  console.log("=== 🔧 COMPLETION REPORT API DEBUG ===");
  console.log("Report ID:", reportId);
  console.log("Task Type:", taskType);
  console.log("Current User:", currentUser);

  // Check local data
  const localReport = completionReports.find(
    (r) => r.id == reportId || r.task_number == reportId
  );
  console.log("📋 Local report found:", !!localReport);
  if (localReport) {
    console.log("📋 Local report data:", localReport);
  }

  // Test API connectivity with multiple endpoints
  console.log("🌐 Testing API connectivity...");

  const endpoints = [
    "../api/session-check.php",
    "../api/maintenance-requests.php",
    "../api/inspection-schedules.php",
    "../api/completion-reports.php",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);

      const contentType = response.headers.get("content-type");
      console.log(`   Content-Type: ${contentType}`);

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log(
          `   Response:`,
          data.success ? "✅ Success" : "❌ Error",
          data.message || ""
        );
      }
    } catch (error) {
      console.error(`❌ ${endpoint}: ${error.message}`);
    }
  }

  // Test the specific completion report endpoint
  const numericId = reportId.toString().replace(/^(MR-|IS-)/, "");
  const specificUrl = `../api/task-completion-report.php?task_id=${numericId}&task_type=${taskType}`;

  console.log("🎯 Testing specific endpoint:", specificUrl);

  try {
    const response = await fetch(specificUrl);
    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get("content-type")}`);

    const responseText = await response.text();
    console.log(`📝 Response length: ${responseText.length} characters`);
    console.log(`📝 Response preview:`, responseText.substring(0, 500));

    if (responseText.trim().startsWith("{")) {
      try {
        const data = JSON.parse(responseText);
        console.log("✅ JSON parsed successfully:", data);
      } catch (parseError) {
        console.error("❌ JSON parse failed:", parseError);
      }
    } else {
      console.error("❌ Response is not JSON format");
    }
  } catch (error) {
    console.error("❌ Specific endpoint error:", error);
  }

  console.log("=== 🔧 END DEBUG ===");
}

// Add debug function to global scope
window.debugCompletionReportAPI = debugCompletionReportAPI;

/**
 * Test function to verify all completion report functionality
 */
async function testCompletionReportSystem() {
  console.log("🧪 Testing Completion Report System...");

  if (completionReports.length === 0) {
    console.warn("⚠️ No completion reports found for testing");
    showNotification("No completion reports available for testing", "warning");
    return;
  }

  const testReport = completionReports[0];
  console.log("🧪 Testing with report:", testReport);

  // Test the view function
  await debugCompletionReportAPI(
    testReport.id || testReport.task_number,
    testReport.task_type || "maintenance"
  );
}

// Add test function to global scope
window.testCompletionReportSystem = testCompletionReportSystem;
/**
 * Generate a text-based report as fallback
 */
function generateTextReport(report, reportId) {
  const reportContent = `
DRAINAGE MAINTENANCE COMPLETION REPORT
=====================================

Report ID: ${report.task_number || report.id}
Task Type: ${report.type_detail || report.task_type || "N/A"}
Location: ${report.location || "Unknown"}
Operator: ${report.operator_name || "Unknown"}
Completion Date: ${formatDate(report.completion_date || report.updated_at)}
Hours Worked: ${report.hours_worked || "N/A"}
Status: ${report.status || "pending_review"}

Generated on: ${new Date().toLocaleString()}
System: DrainTrack Management System
  `;

  const blob = new Blob([reportContent], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `completion-report-${reportId}.txt`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Refresh completion reports data
 */
async function refreshReportsData() {
  try {
    showLoading(true);
    await loadCompletionReports();
    showNotification("Reports data refreshed", "success");
  } catch (error) {
    showNotification("Error refreshing reports data", "danger");
  } finally {
    showLoading(false);
  }
}

/**
 * Export all reports
 */
async function exportAllReports() {
  try {
    showNotification("Exporting reports...", "info");

    if (completionReports.length === 0) {
      showNotification("No reports to export", "warning");
      return;
    }

    const csvContent = generateReportsCSV(completionReports);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `completion-reports-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showNotification("Reports exported successfully", "success");
  } catch (error) {
    console.error("Error exporting reports:", error);
    showNotification("Error exporting reports", "danger");
  }
}

/**
 * Generate CSV content for reports
 */
function generateReportsCSV(reports) {
  const headers = [
    "Report ID",
    "Task Type",
    "Type Detail",
    "Location",
    "Operator",
    "Priority",
    "Completed Date",
    "Hours Worked",
    "Status",
    "Work Summary",
    "Findings",
    "Recommendations",
    "Estimated Cost",
    "Actual Cost",
  ];

  let csvContent = headers.join(",") + "\n";

  reports.forEach((report) => {
    const row = [
      report.task_number || report.id,
      report.task_type || "",
      report.type_detail || "",
      report.location || "",
      report.operator_name || "",
      report.priority || "",
      report.completion_date || report.updated_at || "",
      report.hours_worked || "",
      report.status || "pending_review",
      report.work_summary || "",
      report.findings || "",
      report.recommendations || "",
      report.estimated_cost || "",
      report.actual_cost || "",
    ];

    // Escape quotes and wrap in quotes
    csvContent +=
      row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",") +
      "\n";
  });

  return csvContent;
}
window.debugCompletionReportAPI = debugCompletionReportAPI;
window.testCompletionReportSystem = testCompletionReportSystem;
