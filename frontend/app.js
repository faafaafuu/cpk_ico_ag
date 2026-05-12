const state = {
  rows: [],
  categories: [],
  language: localStorage.getItem("icoDashboardLanguage") || "en",
  sortColumn: "rating",
  sortDirection: "desc",
};

const translations = {
  en: {
    title: "ICO Dashboard",
    language: "Language",
    total: "Total",
    past: "Past",
    upcoming: "Upcoming",
    search: "Search",
    searchPlaceholder: "Name or symbol",
    status: "Status",
    all: "All",
    category: "Category",
    allCategories: "All categories",
    minRating: "Min rating",
    any: "Any",
    sort: "Sort",
    sortRating: "Rating high to low",
    sortRoi: "ROI high to low",
    sortAthRoi: "ATH ROI high to low",
    sortRaised: "Raised high to low",
    sortDate: "Date newest",
    sortName: "Name A-Z",
    rating: "Rating",
    project: "Project",
    start: "Start",
    end: "End",
    raised: "Raised",
    tokenPrice: "Token price",
    currentPrice: "Current price",
    roi: "ROI",
    athRoi: "ATH ROI",
    investors: "Investors",
    launchpads: "Launchpads",
    rows: "rows",
    loaded: "Loaded from output JSON",
    loading: "Loading data...",
    failed: "Failed to load data",
    showingFirst: "Showing first 1,000 rows after filters",
    unknown: "Unknown",
    notAvailable: "N/A",
  },
  ru: {
    title: "ICO Дашборд",
    language: "Язык",
    total: "Всего",
    past: "Прошедшие",
    upcoming: "Предстоящие",
    search: "Поиск",
    searchPlaceholder: "Название или символ",
    status: "Статус",
    all: "Все",
    category: "Категория",
    allCategories: "Все категории",
    minRating: "Мин. рейтинг",
    any: "Любой",
    sort: "Сортировка",
    sortRating: "Рейтинг по убыванию",
    sortRoi: "ROI по убыванию",
    sortAthRoi: "ATH ROI по убыванию",
    sortRaised: "Сборы по убыванию",
    sortDate: "Сначала новые даты",
    sortName: "Название A-Z",
    rating: "Рейтинг",
    project: "Проект",
    start: "Старт",
    end: "Конец",
    raised: "Собрано",
    tokenPrice: "Цена токена",
    currentPrice: "Текущая цена",
    roi: "ROI",
    athRoi: "ATH ROI",
    investors: "Инвесторы",
    launchpads: "Лаунчпады",
    rows: "строк",
    loaded: "Загружено из output JSON",
    loading: "Загрузка данных...",
    failed: "Не удалось загрузить данные",
    showingFirst: "Показаны первые 1 000 строк после фильтров",
    unknown: "Неизвестно",
    notAvailable: "Нет данных",
  },
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
  languageSelect: document.querySelector("#languageSelect"),
};

function t(key) {
  return translations[state.language][key] || translations.en[key] || key;
}

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
    applyTranslations();
    render();
    els.loadState.textContent = t("loaded");
  } catch (error) {
    els.loadState.textContent = `${t("failed")}: ${error.message}`;
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
  if (Number(row.roi || 0) > 1) score += 8;
  if (Number(row.ath_roi || 0) > 5) score += 8;
  if (Array.isArray(row.investors) && row.investors.length) score += 10;
  if (raised >= 10_000_000) score += 28;
  else if (raised >= 2_000_000) score += 22;
  else if (raised >= 500_000) score += 16;
  else if (raised > 0) score += 10;

  return Math.min(100, score);
}

function hydrateCategories() {
  els.categoryFilter
    .querySelectorAll("option:not([value='all'])")
    .forEach((option) => option.remove());
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

  rows = sortRows(rows);
  els.visibleCount.textContent = `${formatNumber(rows.length)} ${t("rows")}`;
  els.tableBody.innerHTML = rows.slice(0, 1000).map(renderRow).join("");
  updateSortHeaders();

  if (rows.length > 1000) {
    els.loadState.textContent = t("showingFirst");
  } else if (state.rows.length) {
    els.loadState.textContent = t("loaded");
  }
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const result = compareRows(a, b, state.sortColumn);
    return state.sortDirection === "asc" ? result : -result;
  });
}

function compareRows(a, b, column) {
  if (["rating", "raised_amount", "token_price", "current_price", "roi", "ath_roi"].includes(column)) {
    return Number(a[column] || 0) - Number(b[column] || 0);
  }

  if (["investors", "launchpads"].includes(column)) {
    return countItems(a[column]) - countItems(b[column]);
  }

  if (["start_date", "end_date"].includes(column)) {
    return dateValue(a[column]) - dateValue(b[column]);
  }

  return String(a[column] || "").localeCompare(String(b[column] || ""));
}

function countItems(value) {
  return Array.isArray(value) ? value.length : 0;
}

function renderRow(row) {
  const ratingClass = row.rating >= 75 ? "high" : row.rating >= 50 ? "mid" : "low";
  return `
    <tr>
      <td><span class="rating ${ratingClass}">${row.rating}</span></td>
      <td>
        <div class="project">
          ${renderLogo(row)}
          <div class="projectText">
            <a href="${escapeHtml(row.cryptorank_url || "#")}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(row.name || t("unknown"))}
            </a>
            <span>${escapeHtml(row.symbol || t("notAvailable"))}</span>
          </div>
        </div>
      </td>
      <td><span class="pill ${escapeHtml(row.status || "")}">${escapeHtml(translateStatus(row.status))}</span></td>
      <td>${escapeHtml(row.category || t("notAvailable"))}</td>
      <td>${renderNamedList(row.investors)}</td>
      <td>${renderNamedList(row.launchpads)}</td>
      <td>${escapeHtml(row.start_date || t("notAvailable"))}</td>
      <td>${escapeHtml(row.end_date || t("notAvailable"))}</td>
      <td>${formatMoney(row.raised_amount)}</td>
      <td>${formatPrice(row.token_price)}</td>
      <td>${formatPrice(row.current_price)}</td>
      <td>${formatMultiple(row.roi)}</td>
      <td>${formatMultiple(row.ath_roi)}</td>
    </tr>
  `;
}

function renderLogo(row) {
  if (!row.image) {
    return '<span class="projectLogo" aria-hidden="true"></span>';
  }
  return `<img class="projectLogo" src="${escapeHtml(row.image)}" alt="" loading="lazy" />`;
}

function renderNamedList(items) {
  if (!Array.isArray(items) || !items.length) {
    return `<span class="muted">${escapeHtml(t("notAvailable"))}</span>`;
  }
  const names = items
    .map((item) => item && item.name)
    .filter(Boolean)
    .slice(0, 4);
  const suffix = items.length > names.length ? ` +${items.length - names.length}` : "";
  return `<span class="compactList" title="${escapeHtml(names.join(", "))}">${escapeHtml(names.join(", ") + suffix)}</span>`;
}

function dateValue(value) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatMoney(value) {
  const number = Number(value || 0);
  if (!number) return `<span class="muted">${escapeHtml(t("notAvailable"))}</span>`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatPrice(value) {
  const number = Number(value || 0);
  if (!number) return `<span class="muted">${escapeHtml(t("notAvailable"))}</span>`;
  return `$${number.toLocaleString("en-US", { maximumFractionDigits: 8 })}`;
}

function formatMultiple(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    return `<span class="muted">${escapeHtml(t("notAvailable"))}</span>`;
  }
  const className = number >= 1 ? "positive" : "negative";
  return `<span class="${className}">${number.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}x</span>`;
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

function translateStatus(status) {
  if (status === "past") return t("past");
  if (status === "upcoming") return t("upcoming");
  return t("notAvailable");
}

function applyTranslations() {
  document.documentElement.lang = state.language;
  els.languageSelect.value = state.language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  if (!state.rows.length) {
    els.loadState.textContent = t("loading");
  }
}

[
  els.searchInput,
  els.statusFilter,
  els.categoryFilter,
  els.ratingFilter,
].forEach((element) => element.addEventListener("input", render));

els.sortSelect.addEventListener("input", () => {
  const [column, direction] = sortSelectToState(els.sortSelect.value);
  state.sortColumn = column;
  state.sortDirection = direction;
  render();
});

document.querySelectorAll(".sortHeader").forEach((button) => {
  button.addEventListener("click", () => {
    const column = button.dataset.sortColumn;
    if (state.sortColumn === column) {
      state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
    } else {
      state.sortColumn = column;
      state.sortDirection = defaultDirection(column);
    }
    syncSortSelect();
    render();
  });
});

function sortSelectToState(value) {
  const mapping = {
    rating_desc: ["rating", "desc"],
    roi_desc: ["roi", "desc"],
    ath_roi_desc: ["ath_roi", "desc"],
    raised_desc: ["raised_amount", "desc"],
    date_desc: ["start_date", "desc"],
    name_asc: ["name", "asc"],
  };
  return mapping[value] || ["rating", "desc"];
}

function defaultDirection(column) {
  if (["name", "status", "category"].includes(column)) {
    return "asc";
  }
  return "desc";
}

function syncSortSelect() {
  const key = `${state.sortColumn}_${state.sortDirection}`;
  const reverseMapping = {
    rating_desc: "rating_desc",
    roi_desc: "roi_desc",
    ath_roi_desc: "ath_roi_desc",
    raised_amount_desc: "raised_desc",
    start_date_desc: "date_desc",
    name_asc: "name_asc",
  };
  els.sortSelect.value = reverseMapping[key] || "rating_desc";
}

function updateSortHeaders() {
  document.querySelectorAll(".sortHeader").forEach((button) => {
    const isActive = button.dataset.sortColumn === state.sortColumn;
    button.classList.toggle("active", isActive);
    button.classList.toggle("asc", isActive && state.sortDirection === "asc");
    button.classList.toggle("desc", isActive && state.sortDirection === "desc");
  });
}

els.languageSelect.addEventListener("change", () => {
  state.language = els.languageSelect.value;
  localStorage.setItem("icoDashboardLanguage", state.language);
  applyTranslations();
  updateSummary();
  render();
});

applyTranslations();
loadData();
