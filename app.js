// Simple in-memory "database" in the browser
let employees = [];

// ONLINE API base
const API_BASE = "https://ems-backend-dczs.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready, initializing...");

  // Navigation
  const navItems = document.querySelectorAll(".nav__item");
  const sections = document.querySelectorAll(".section");
  navItems.forEach(btn => {
    btn.addEventListener("click", () => {
      navItems.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.section;
      sections.forEach(sec =>
        sec.id === target
          ? sec.classList.add("section--active")
          : sec.classList.remove("section--active")
      );
    });
  });

  // Add employee
  const empForm = document.getElementById("empForm");
  const formMsg = document.getElementById("formMsg");

  if (empForm) {
    empForm.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(empForm);
      const emp = Object.fromEntries(fd.entries());

      try {
        console.log("Posting employee:", emp);
        const res = await fetch(API_BASE + "/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emp)
        });

        if (!res.ok) {
          formMsg.textContent = "Backend error while adding employee.";
          formMsg.style.color = "#f97373";
          return;
        }

        formMsg.textContent = "Employee added via backend.";
        formMsg.style.color = "#22c55e";
        empForm.reset();

        await loadEmployeesFromServer();
      } catch (err) {
        console.error(err);
        formMsg.textContent = "Network error.";
        formMsg.style.color = "#f97373";
      }
    });
  }

  // Search filter
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", renderAll);
  }

  // Expose delete function globally
  window.deleteEmp = function (id) {
    employees = employees.filter(e => e.emp_id !== id);
    renderAll();
  };

  // ---------- Render helpers ----------

  function renderAll() {
    renderCards();
    renderRecent();
    renderTable();
  }

  function filteredEmployees() {
    const q = searchInput ? searchInput.value.trim().toLowerCase() : "";
    if (!q) return employees;
    return employees.filter(e =>
      String(e.emp_id).toLowerCase().includes(q) ||
      String(e.emp_name).toLowerCase().includes(q)
    );
  }

  function renderCards() {
    const total = employees.length;
    const active = employees.filter(e => e.emp_status === "Active").length;
    const avg =
      total === 0
        ? 0
        : employees.reduce((s, e) => s + (e.emp_net_pay || 0), 0) / total;

    const cardTotal = document.getElementById("cardTotalEmp");
    const cardActive = document.getElementById("cardActiveEmp");
    const cardAvg = document.getElementById("cardAvgPay");

    if (cardTotal) cardTotal.textContent = total;
    if (cardActive) cardActive.textContent = active;
    if (cardAvg) {
      cardAvg.textContent =
        "₹" + Math.round(avg).toLocaleString("en-IN");
    }
  }

  function renderRecent() {
    const tbody = document.getElementById("recentEmployees");
    if (!tbody) return;
    tbody.innerHTML = "";
    const rec = [...employees].slice(-5).reverse();
    rec.forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${e.emp_id}</td>
        <td>${e.emp_name}</td>
        <td>${e.emp_dept}</td>
        <td>₹${e.emp_salary}</td>
        <td>₹${(e.emp_net_pay || 0).toFixed(2)}</td>
        <td>${e.emp_status}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderTable() {
    const tbody = document.getElementById("empTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    filteredEmployees().forEach((e, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${e.emp_id}</td>
        <td>${e.emp_name}</td>
        <td>${e.emp_dept}</td>
        <td>${e.emp_phone}</td>
        <td>₹${e.emp_salary}</td>
        <td>₹${(e.emp_net_pay || 0).toFixed(2)}</td>
        <td>${e.emp_status}</td>
        <td>
          <div class="actions">
            <button class="btn btn--danger" onclick="deleteEmp('${e.emp_id}')">
              Delete
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ---------- Load from backend ----------

  async function loadEmployeesFromServer() {
    try {
      console.log("Fetching employees from server...");
      const res = await fetch(API_BASE + "/employees");
      console.log("Response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log("Employees loaded:", data);
      employees = Array.isArray(data) ? data : [];
      renderAll();
    } catch (err) {
      console.error("Error loading employees:", err);
      employees = [];
      renderAll();
    }
  }

  // Initial load
  loadEmployeesFromServer();
});
