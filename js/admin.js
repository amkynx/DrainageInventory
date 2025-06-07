// admin.js

document.addEventListener("DOMContentLoaded", function () {
  fetchDrainageData();

  // Handle form submission
  document
    .getElementById("drainageForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      saveDrainageData();
    });
});

function fetchDrainageData() {
  fetch("api/get_drainage.php")
    .then((response) => response.json())
    .then((data) => populateTable(data))
    .catch((error) => console.error("Error fetching data:", error));
}

function populateTable(data) {
  const tbody = document.getElementById("drainageTableBody");
  tbody.innerHTML = "";

  data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.type}</td>
        <td>${item.depth}</td>
        <td>${item.il}</td>
        <td>${item.rl}</td>
        <td>${item.description}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick='editDrainage(${JSON.stringify(
            item
          )})'>Edit</button>
          <button class="btn btn-sm btn-danger" onclick='deleteDrainage(${
            item.id
          })'>Delete</button>
        </td>
      `;
    tbody.appendChild(row);
  });
}

function openModal() {
  const form = document.getElementById("drainageForm");
  form.reset();
  document.getElementById("drainageId").value = "";
  new bootstrap.Modal(document.getElementById("drainageModal")).show();
}

function editDrainage(data) {
  document.getElementById("drainageId").value = data.id;
  document.getElementById("drainageName").value = data.name;
  document.getElementById("drainageType").value = data.type;
  document.getElementById("drainageDepth").value = data.depth;
  document.getElementById("drainageIL").value = data.il;
  document.getElementById("drainageRL").value = data.rl;
  document.getElementById("drainageDesc").value = data.description;
  new bootstrap.Modal(document.getElementById("drainageModal")).show();
}

function saveDrainageData() {
  const formData = new FormData(document.getElementById("drainageForm"));

  fetch("api/save_drainage.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        bootstrap.Modal.getInstance(
          document.getElementById("drainageModal")
        ).hide();
        fetchDrainageData();
      } else {
        alert("Failed to save data.");
      }
    })
    .catch((error) => console.error("Save error:", error));
}

function deleteDrainage(id) {
  if (!confirm("Are you sure you want to delete this record?")) return;

  fetch("api/delete_drainage.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        fetchDrainageData();
      } else {
        alert("Failed to delete.");
      }
    })
    .catch((error) => console.error("Delete error:", error));
}
