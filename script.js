let data = JSON.parse(localStorage.getItem("wanderdata")) || [];

function addEntry() {
  const date = document.getElementById("date").value;
  const km = document.getElementById("km").value;
  const route = document.getElementById("route").value;

  if (!date || !km) return;

  data.push({ date, km, route });

  localStorage.setItem("wanderdata", JSON.stringify(data));

  render();
}

function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  let total = 0;

  data.forEach(item => {
    total += Number(item.km);

    const li = document.createElement("li");
    li.textContent = `${item.date} – ${item.km} km – ${item.route}`;
    list.appendChild(li);
  });

  const totalLi = document.createElement("li");
  totalLi.textContent = "Total: " + total + " km";
  totalLi.style.fontWeight = "bold";

  list.appendChild(totalLi);
}

render();
