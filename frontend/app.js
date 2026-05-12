const state = {
  rows: [],
  categories: [],
};

const els = {
  totalCount: document.querySelector("#totalCount"),
  pastCount: document.querySelector("#pastCount"),
  upcomingCount: document.querySelector("#upcomingCount"),
  visibleCount: document.querySelector("#visibleCount"),
  loadState: document.querySelector("#loadState"),
  tableBody: document.querySelector("#tableBody"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  ratingFilter: document.querySelector("#ratingFilter"),
  sortSelect: document.querySelector("#sortSelect"),
};

async function loadData() {
  try {
    const [past, upcoming] = await Promise.all([
      fetch("/output/past_icos.json").then((response) => response.json()),
      fetch("/output/upcoming_icos.json").then((response) => response.json()),
    ]);

    state.rows = [...past, ...upcoming].map((row) => ({
      ...row,
      rating: calculateRating(row),
    }));

    state.categories = [...new Set(state.rows.map((row) => row.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

    hydrateCategories();
    updateSummary();
    render();
    els.loadState.textContent = "Loaded from output JSON";
  } catch (error) {
    els.loadState.textContent = `Failed to load data: ${error.message}`;
  }
}

function calculateRating(row) {
  let score = 20;
  const raised = Number(row.raised_amount || 0);
  const price = Number(row.token_price || 0);

  if (row.status === "upcoming") score += 18;
  if (row.category) score += 8;
  if (row.start_date) score += 8;
  if (row.end_date) score += 4;
  if (price > 0) score += 8;
  if (raised >= 10_000_000) score += 28;
  else if (raised >= 2_000_000) score += 22;
  else if (raised >= 500_000) score += 16;
  else if (raised > 0) score += 10;

  return Math.min(100, score);
}

function hydrateCategories() {
  const options = state.categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
  els.categoryFilter.insertAdjacentHTML("beforeend", options);
}

function updateSummary() {
  const past = state.rows.filter((row) => row.status === "past").length;
  const upcoming = state.rows.filter((row) => row.status === "upcoming").length;
  els.totalCount.textContent = formatNumber(state.rows.length);
  els.pastCount.textContent = formatNumber(past);
  els.upcomingCount.textContent = formatNumber(upcoming);
}

function render() {
  const search = els.searchInput.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  const category = els.categoryFilter.value;
  const minRating = Number(els.ratingFilter.value);

  let rows = state.rows.filter((row) => {
    const haystack = `${row.name || ""} ${row.symbol || ""}`.toLowerCase();
    return (
      (!search || haystack.includes(search)) &&
      (status === "all" || row.status === status) &&
      (category === "all" || row.category === category) &&
      row.rating >= minRating
    );
  });

  rows = sortRows(rows, els.sortSelect.value);
  els.visibleCount.textContent = `${formatNumber(rows.length)} rows`;
  els.tableBody.innerHTML = rows.slice(0, 1000).map(renderRow).join("");

  if (rows.length > 1000) {
    els.loadState.textContent = "Showing first 1,000 rows after filters";
  } else if (state.rows.length) {
    els.loadState.textContent = "Loaded from output JSON";
  }
}

function sortRows(rows, sortKey) {
  return [...rows].sort((a, b) => {
    if (sortKey === "raised_desc") {
      return Number(b.raised_amount || 0) - Number(a.raised_amount || 0);
    }
    if (sortKey === "date_desc") {
      return dateValue(b.start_date) - dateValue(a.start_date);
    }
    if (sortKey === "name_asc") {
      return String(a.name || "").localeCompare(String(b.name || ""));
    }
    return b.rating - a.rating;
  });
}

function renderRow(row) {
  const ratingClass = row.rating >= 75 ? "high" : row.rating >= 50 ? "mid" : "low";
  return `
    <tr>
      <td><span class="rating ${ratingClass}">${row.rating}</span></td>
      <td>
        <div class="project">
          <strong>${escapeHtml(row.name || "Unknown")}</strong>
          <span>${escapeHtml(row.symbol || "N/A")}</span>
        </div>
      </td>
      <td><span class="pill ${escapeHtml(row.status || "")}">${escapeHtml(row.status || "N/A")}</span></td>
      <td>${escapeHtml(row.category || "N/A")}</td>
      <td>${escapeHtml(row.start_date || "N/A")}</td>
      <td>${escapeHtml(row.end_date || "N/A")}</td>
      <td>${formatMoney(row.raised_amount)}</td>
      <td>${formatPrice(row.token_price)}</td>
    </tr>
  `;
}

function dateValue(value) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatMoney(value) {
  const number = Number(value || 0);
  if (!number) return '<span class="muted">N/A</span>';
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatPrice(value) {
  const number = Number(value || 0);
  if (!number) return '<span class="muted">N/A</span>';
  return `$${number.toLocaleString("en-US", { maximumFractionDigits: 8 })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

[
  els.searchInput,
  els.statusFilter,
  els.categoryFilter,
  els.ratingFilter,
  els.sortSelect,
].forEach((element) => element.addEventListener("input", render));

loadData();
