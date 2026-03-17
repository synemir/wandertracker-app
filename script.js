const SUPABASE_URL = "https://xturhoyqgghdwshvedwe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_neu9v3BfF6p8cqI_-TwHdQ_I9gMp45z";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let data = [];
let editId = null;
let currentUser = null;

function formatKm(value) {
  return Number(value).toFixed(1);
}

function resetForm() {
  document.getElementById("date").value = "";
  document.getElementById("km").value = "";
  document.getElementById("route").value = "";

  editId = null;
  document.getElementById("formTitle").textContent = "Neue Wanderung";
  document.getElementById("saveButton").textContent = "Speichern";

  const cancelButton = document.getElementById("cancelButton");
  if (cancelButton) {
    cancelButton.style.display = "none";
  }
}

function cancelEdit() {
  resetForm();
}

async function sendMagicLink() {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Bitte E-Mail eingeben.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname
    }
  });

  if (error) {
    alert("Fehler beim Senden des Magic Links: " + error.message);
    return;
  }

  alert("Magic Link wurde gesendet.");
}

async function logout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  data = [];
  updateAuthStatus();
  render();
}

function updateAuthStatus() {
  const authStatus = document.getElementById("authStatus");
  if (!authStatus) return;

  if (currentUser) {
    authStatus.textContent = "Eingeloggt als: " + currentUser.email;
  } else {
    authStatus.textContent = "Noch nicht eingeloggt.";
  }
}

async function loadSession() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  currentUser = sessionData.session?.user || null;
  updateAuthStatus();
}

async function loadEntries() {
  if (!currentUser) {
    data = [];
    render();
    return;
  }

  const { data: rows, error } = await supabaseClient
    .from("hikes")
    .select("*")
    .order("date", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    alert("Fehler beim Laden: " + error.message);
    return;
  }

  data = rows || [];
  render();
}

async function saveEntry() {
  if (!currentUser) {
    alert("Bitte zuerst einloggen.");
    return;
  }

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

  if (editId === null) {
    const { error } = await supabaseClient.from("hikes").insert({
      user_id: currentUser.id,
      date,
      km,
      route
    });

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }
  } else {
    const { error } = await supabaseClient
      .from("hikes")
      .update({ date, km, route })
      .eq("id", editId);

    if (error) {
      alert("Fehler beim Aktualisieren: " + error.message);
      return;
    }
  }

  resetForm();
  await loadEntries();
}

function editEntry(id) {
  const item = data.find(entry => entry.id === id);
  if (!item) return;

  document.getElementById("date").value = item.date;
  document.getElementById("km").value = item.km;
  document.getElementById("route").value = item.route || "";

  editId = id;
  document.getElementById("formTitle").textContent = "Wanderung bearbeiten";
  document.getElementById("saveButton").textContent = "Änderungen speichern";

  const cancelButton = document.getElementById("cancelButton");
  if (cancelButton) {
    cancelButton.style.display = "inline-block";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteEntry(id) {
  const confirmed = confirm("Diesen Eintrag wirklich löschen?");
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("hikes")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Fehler beim Löschen: " + error.message);
    return;
  }

  if (editId === id) {
    resetForm();
  }

  await loadEntries();
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
  const bar = document.getElementById(barId);
  const text = document.getElementById(textId);

  if (bar) {
    const percent = Math.min((totalKm / goal) * 100, 100);
    bar.style.width = percent + "%";
  }

  if (text) {
    text.textContent = `${formatKm(totalKm)} / ${formatKm(goal)} km`;
  }
}

function renderMonthlyOverview() {
  const container = document.getElementById("monthlyOverview");
  if (!container) return;

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
  if (!container) return;

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

function renderMonthlyChart() {
  const canvas = document.getElementById("monthlyChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const monthly = getMonthlyTotals();

  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 800;
  const cssHeight = 220;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  if (monthly.length === 0) {
    ctx.font = "14px Arial";
    ctx.fillStyle = "#777";
    ctx.fillText("Noch keine Daten vorhanden.", 12, 30);
    return;
  }

  const maxValue = Math.max(...monthly.map(item => item.total), 10);
  const paddingLeft = 24;
  const paddingBottom = 28;
  const paddingTop = 20;
  const chartHeight = cssHeight - paddingTop - paddingBottom;
  const gap = 10;
  const barWidth = Math.max(18, (cssWidth - paddingLeft - 10) / monthly.length - gap);

  monthly.forEach((item, index) => {
    const x = paddingLeft + index * (barWidth + gap);
    const barHeight = (item.total / maxValue) * chartHeight;
    const y = cssHeight - paddingBottom - barHeight;

    ctx.fillStyle = "#111";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#555";
    ctx.font = "11px Arial";
    ctx.fillText(item.month.slice(5), x, cssHeight - 8);

    ctx.fillStyle = "#111";
    ctx.fillText(formatKm(item.total), x, y - 6);
  });
}

function renderEntries() {
  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = "";

  if (data.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Noch keine Einträge vorhanden.";
    list.appendChild(li);
    return;
  }

  data.forEach(item => {
    const li = document.createElement("li");
    li.className = "entry-item";
    li.innerHTML = `
      <div class="entry-content">
        <strong>${item.date}</strong> – ${formatKm(item.km)} km
        ${item.route ? "– " + item.route : ""}
      </div>
      <div class="entry-actions">
        <button class="small-btn" onclick="editEntry(${item.id})">Bearbeiten</button>
        <button class="small-btn danger-btn" onclick="deleteEntry(${item.id})">Löschen</button>
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
  renderMonthlyChart();
  renderEntries();
}

async function init() {
  await loadSession();
  await loadEntries();

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    updateAuthStatus();
    await loadEntries();
  });
}

init();
window.addEventListener("resize", renderMonthlyChart);
