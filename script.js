let data = JSON.parse(localStorage.getItem("wanderdata")) || [];

function formatKm(value) {
  return Number(value).toFixed(1);
}

function addEntry() {
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

  data.push({ date, km, route });

  localStorage.setItem("wanderdata", JSON.stringify(data));

  document.getElementById("date").value = "";
  document.getElementById("km").value = "";
  document.getElementById("route").value = "";

  render();
}

function deleteEntry(index) {
  data.splice(index, 1);
  localStorage.setItem("wanderdata", JSON.stringify(data));
  render();
}

function getMonthlyTotals() {
  const monthly = {};

  data.forEach(item => {
    const monthKey = item.date.slice(0, 7); // YYYY-MM
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
    const yearKey = item.date.slice(0, 4); // YYYY
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

  const sortedData = [...data].sort((a, b) => b.date.localeCompare(a.date));

  sortedData.forEach(item => {
    const originalIndex = data.findIndex(
      d => d.date === item.date && d.km === item.km && d.route === item.route
    );

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.date}</strong> – ${formatKm(item.km)} km
      ${item.route ? "– " + item.route : ""}
      <button class="delete-btn" onclick="deleteEntry(${originalIndex})">Löschen</button>
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
