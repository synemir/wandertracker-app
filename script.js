let data = JSON.parse(localStorage.getItem("wanderdata")) || [];
let editIndex = null;

function formatKm(value) {
  return Number(value).toFixed(1);
}

function saveData() {
  localStorage.setItem("wanderdata", JSON.stringify(data));
}

function resetForm() {
  document.getElementById("date").value = "";
  document.getElementById("km").value = "";
  document.getElementById("route").value = "";

  editIndex = null;
  document.getElementById("formTitle").textContent = "Neue Wanderung";
  document.getElementById("saveButton").textContent = "Speichern";
  document.getElementById("cancelButton").style.display = "none";
}

function saveEntry() {
  const date = document.getElementById("date").value;
  const kmInput = document.getElementById("km").value;
  const route = document.getElementById("route").value.trim();

  if (!date || kmInput === "") {
    alert("Bitte Datum und Kilometer eingeben.");
    return;
  }

  const km = Math.round(parseFloat(kmInput) * 10) / 10;

  if (isNaN(km) || km < 0) {
    alert("Bitte gültige Kilometer eingeben.");
    return;
  }

  const entry = { date, km, route };

  if (editIndex === null) {
    data.push(entry);
  } else {
    data[editIndex] = entry;
  }

  saveData();
  resetForm();
  render();
}

function editEntry(index) {
  const item = data[index];

  document.getElementById("date").value = item.date;
  document.getElementById("km").value = item.km;
  document.getElementById("route").value = item.route || "";

  editIndex = index;
  document.getElementById("formTitle").textContent = "Wanderung bearbeiten";
  document.getElementById("saveButton").textContent = "Änderungen speichern";
  document.getElementById("cancelButton").style.display = "inline-block";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEdit() {
  resetForm();
}

function deleteEntry(index) {
  const confirmed = confirm("Diesen Eintrag wirklich löschen?");
  if (!confirmed) return;

  data.splice(index, 1);
  saveData();

  if (editIndex === index) {
    resetForm();
  }

  if (editIndex !== null && index < editIndex) {
    editIndex = editIndex - 1;
  }

  render();
}

function getMonthlyTotals() {
  const monthly = {};

  data.forEach(item => {
    const monthKey = item.date.slice(0, 7);
    if (!monthly[monthKey]) {
      monthly[monthKey] = 0;
    }
    monthly[monthKey] += Number(item.km);
  });

  return Object.entries(monthly)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({
      month,
      total: Math.round(total * 10) / 10
    }));
}

function getYearlyTotals() {
  const yearly = {};

  data.forEach(item => {
    const yearKey = item.date.slice(0, 4);
    if (!yearly[yearKey]) {
      yearly[yearKey] = 0;
    }
    yearly[yearKey] += Number(item.km);
  });

  return Object.entries(yearly)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, total]) => ({
      year,
      total: Math.round(total * 10) / 10
    }));
}

function renderDashboard(totalKm, totalEntries) {
  const avgKm = totalEntries > 0 ? totalKm / totalEntries : 0;

  document.getElementById("totalKm").textContent = formatKm(totalKm) + " km";
  document.getElementById("totalEntries").textContent = totalEntries;
  document.getElementById("avgKm").textContent = formatKm(avgKm) + " km";

  updateGoal(1000, totalKm, "goal1000Bar", "goal1000Text");
  updateGoal(2500, totalKm, "goal2500Bar", "goal2500Text");
  updateGoal(5000, totalKm, "goal5000Bar", "goal5000Text");
}

function updateGoal(goal, totalKm, barId, textId) {
  const percent = Math.min((totalKm / goal) * 100, 100);

  document.getElementById(barId).style.width = percent + "%";
  document.getElementById(textId).textContent =
    `${formatKm(totalKm)} / ${formatKm(goal)} km`;
}

function renderMonthlyOverview() {
  const container = document.getElementById("monthlyOverview");
  const monthly = getMonthlyTotals();

  if (monthly.length === 0) {
    container.innerHTML = '<div class="empty-note">Noch keine Einträge vorhanden.</div>';
    return;
  }

  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th>Monat</th>
          <th>Kilometer</th>
        </tr>
      </thead>
      <tbody>
  `;

  monthly.forEach(item => {
    html += `
      <tr>
        <td>${item.month}</td>
        <td>${formatKm(item.total)} km</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

function renderYearlyOverview() {
  const container = document.getElementById("yearlyOverview");
  const yearly = getYearlyTotals();

  if (yearly.length === 0) {
    container.innerHTML = '<div class="empty-note">Noch keine Einträge vorhanden.</div>';
    return;
  }

  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th>Jahr</th>
          <th>Kilometer</th>
        </tr>
      </thead>
      <tbody>
  `;

  yearly.forEach(item => {
    html += `
      <tr>
        <td>${item.year}</td>
        <td>${formatKm(item.total)} km</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

function renderEntries() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  if (data.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Noch keine Einträge vorhanden.";
    list.appendChild(li);
    return;
  }

  const sortedItems = data
    .map((item, index) => ({ ...item, originalIndex: index }))
    .sort((a, b) => b.date.localeCompare(a.date));

  sortedItems.forEach(item => {
    const li = document.createElement("li");
    li.className = "entry-item";
    li.innerHTML = `
      <div class="entry-content">
        <strong>${item.date}</strong> – ${formatKm(item.km)} km
        ${item.route ? "– " + item.route : ""}
      </div>
      <div class="entry-actions">
        <button class="small-btn" onclick="editEntry(${item.originalIndex})">Bearbeiten</button>
        <button class="small-btn danger-btn" onclick="deleteEntry(${item.originalIndex})">Löschen</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function render() {
  const totalKm = Math.round(
    data.reduce((sum, item) => sum + Number(item.km), 0) * 10
  ) / 10;

  const totalEntries = data.length;

  renderDashboard(totalKm, totalEntries);
  renderMonthlyOverview();
  renderYearlyOverview();
  renderEntries();
}

render();
