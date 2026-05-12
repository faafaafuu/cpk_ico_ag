const state = {
  rows: [],
  categories: [],
  historicalPatterns: {
    categories10x: new Map(),
    investors10x: new Map(),
    launchpads10x: new Map(),
    medianRaise10x: 0,
  },
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
    ath10x: "ATH 10x+",
    ath50x: "ATH 50x+",
    ath100x: "ATH 100x+",
    top10xCategories: "Top 10x+ categories",
    top10xBackers: "Top 10x+ backers",
    topPicksEyebrow: "Analytical shortlist",
    topPicksTitle: "Top projects to research",
    notFinancialAdvice: "Not financial advice",
    allocation: "Deposit",
    why: "Why",
    noPicks: "No qualifying upcoming projects",
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
    ath10x: "ATH 10x+",
    ath50x: "ATH 50x+",
    ath100x: "ATH 100x+",
    top10xCategories: "Топ категорий 10x+",
    top10xBackers: "Топ инвесторов 10x+",
    topPicksEyebrow: "Аналитический шортлист",
    topPicksTitle: "Топ проектов для ресерча",
    notFinancialAdvice: "Не финансовый совет",
    allocation: "Депозит",
    why: "Почему",
    noPicks: "Нет подходящих upcoming-проектов",
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
  ath10xCount: document.querySelector("#ath10xCount"),
  ath50xCount: document.querySelector("#ath50xCount"),
  ath100xCount: document.querySelector("#ath100xCount"),
  topCategories: document.querySelector("#topCategories"),
  topBackers: document.querySelector("#topBackers"),
  topPicks: document.querySelector("#topPicks"),
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

    buildHistoricalPatterns(past);

    state.rows = [...past, ...upcoming].map((row) => ({
      ...row,
      rating: calculateRating(row),
    }));

    state.categories = [...new Set(state.rows.map((row) => row.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

    hydrateCategories();
    updateSummary();
    updateInsights(past);
    renderTopPicks();
    applyTranslations();
    render();
    els.loadState.textContent = t("loaded");
  } catch (error) {
    els.loadState.textContent = `${t("failed")}: ${error.message}`;
  }
}

function renderTopPicks() {
  const picks = state.rows
    .filter((row) => row.status === "upcoming")
    .map((row) => ({ ...row, pickReasons: pickReasons(row), allocation: allocationFor(row) }))
    .filter((row) => row.rating >= 45 && row.pickReasons.length >= 2 && row.allocation > 0)
    .sort((a, b) => b.rating - a.rating || b.allocation - a.allocation)
    .slice(0, 6);

  if (!picks.length) {
    els.topPicks.innerHTML = `<div class="pickCard"><span class="muted">${escapeHtml(t("noPicks"))}</span></div>`;
    return;
  }

  els.topPicks.innerHTML = picks.map(renderPick).join("");
}

function renderPick(row) {
  return `
    <article class="pickCard">
      <div class="pickTop">
        ${renderLogo(row)}
        <div class="projectText">
          <a href="${escapeHtml(row.cryptorank_url || "#")}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(row.name || t("unknown"))}
          </a>
          <span>${escapeHtml(row.symbol || t("notAvailable"))}</span>
        </div>
      </div>
      <div class="pickMeta">
        <span class="miniBadge">${escapeHtml(row.category || t("notAvailable"))}</span>
        <span class="miniBadge">${formatMoney(row.raised_amount)}</span>
        <span class="miniBadge">${escapeHtml(t("rating"))}: ${row.rating}</span>
      </div>
      <div class="allocation">${escapeHtml(t("allocation"))}: ${row.allocation}%</div>
      <ul class="reasonList">
        ${row.pickReasons.slice(0, 4).map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function pickReasons(row) {
  const reasons = [];
  const patterns = state.historicalPatterns;
  if (rankInMap(patterns.categories10x, row.category) <= 8) {
    reasons.push(state.language === "ru" ? "Категория часто встречалась у 10x+ past" : "Category appears often in 10x+ past projects");
  }
  if ((row.investors || []).some((item) => rankInMap(patterns.investors10x, item.name) <= 12)) {
    reasons.push(state.language === "ru" ? "Есть инвесторы из исторического 10x+ кластера" : "Has backers from historical 10x+ cluster");
  }
  if ((row.launchpads || []).some((item) => rankInMap(patterns.launchpads10x, item.name) <= 10)) {
    reasons.push(state.language === "ru" ? "Launchpad совпадает с успешными past-кейсами" : "Launchpad overlaps with successful past cases");
  }
  if (Number(row.raised_amount || 0) > 0 && Number(row.raised_amount || 0) <= 5_000_000) {
    reasons.push(state.language === "ru" ? "Raise не выглядит чрезмерно раздутым" : "Raise is not aggressively inflated");
  }
  if (row.token_price) {
    reasons.push(state.language === "ru" ? "Есть цена токена для оценки входа" : "Token price is available for entry analysis");
  }
  return reasons;
}

function allocationFor(row) {
  if (row.rating >= 70) return 1;
  if (row.rating >= 60) return 0.75;
  if (row.rating >= 50) return 0.5;
  if (row.rating >= 45) return 0.25;
  return 0;
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
  score += historicalPatternBonus(row);
  if (raised >= 10_000_000) score += 28;
  else if (raised >= 2_000_000) score += 22;
  else if (raised >= 500_000) score += 16;
  else if (raised > 0) score += 10;

  return Math.min(100, score);
}

function buildHistoricalPatterns(pastRows) {
  const winners = pastRows.filter((row) => Number(row.ath_roi || 0) >= 10);
  state.historicalPatterns.categories10x = countBy(winners, (row) => row.category);
  state.historicalPatterns.investors10x = countByNested(winners, "investors");
  state.historicalPatterns.launchpads10x = countByNested(winners, "launchpads");
  state.historicalPatterns.medianRaise10x = median(
    winners.map((row) => Number(row.raised_amount || 0)).filter(Boolean)
  );
}

function historicalPatternBonus(row) {
  let bonus = 0;
  const patterns = state.historicalPatterns;
  const categoryRank = rankInMap(patterns.categories10x, row.category);
  if (categoryRank > 0 && categoryRank <= 8) bonus += 6;

  const investorHit = (row.investors || []).some((item) => rankInMap(patterns.investors10x, item.name) <= 12);
  const launchpadHit = (row.launchpads || []).some((item) => rankInMap(patterns.launchpads10x, item.name) <= 10);
  if (investorHit) bonus += 8;
  if (launchpadHit) bonus += 5;

  const raised = Number(row.raised_amount || 0);
  const medianRaise = patterns.medianRaise10x;
  if (raised && medianRaise && raised <= medianRaise * 4) bonus += 4;
  return bonus;
}

function updateInsights(pastRows) {
  const withAth = pastRows.filter((row) => Number(row.ath_roi || 0) > 0);
  els.ath10xCount.textContent = formatNumber(withAth.filter((row) => Number(row.ath_roi) >= 10).length);
  els.ath50xCount.textContent = formatNumber(withAth.filter((row) => Number(row.ath_roi) >= 50).length);
  els.ath100xCount.textContent = formatNumber(withAth.filter((row) => Number(row.ath_roi) >= 100).length);
  els.topCategories.textContent = topLabels(state.historicalPatterns.categories10x, 4);
  els.topBackers.textContent = topLabels(state.historicalPatterns.investors10x, 4);
}

function countBy(rows, getter) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = getter(row);
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return counts;
}

function countByNested(rows, key) {
  const counts = new Map();
  rows.forEach((row) => {
    (row[key] || []).forEach((item) => {
      if (item.name) counts.set(item.name, (counts.get(item.name) || 0) + 1);
    });
  });
  return counts;
}

function topLabels(map, limit) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name)
    .join(", ");
}

function rankInMap(map, value) {
  if (!value || !map.has(value)) return Infinity;
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.findIndex(([name]) => name === value) + 1;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
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
      <td>${formatDate(row.start_date)}</td>
      <td>${formatDate(row.end_date)}</td>
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

function formatDate(value) {
  if (!value) return `<span class="muted">${escapeHtml(t("notAvailable"))}</span>`;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return escapeHtml(value);
  return new Intl.DateTimeFormat(state.language === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  }).format(new Date(parsed));
}

function formatMoney(value) {
  const number = Number(value || 0);
  if (!number) return `<span class="muted">${escapeHtml(t("notAvailable"))}</span>`;
  return `$${formatCompactNumber(number)}`;
}

function formatPrice(value) {
  const number = Number(value || 0);
  if (!number) return `<span class="muted">${escapeHtml(t("notAvailable"))}</span>`;
  if (number >= 1) {
    return `$${trimDecimals(number, 2)}`;
  }
  if (number >= 0.01) {
    return `$${trimDecimals(number, 4)}`;
  }
  return `$${trimDecimals(number, 6)}`;
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

function formatCompactNumber(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${trimDecimals(value / 1_000_000_000, 1)}B`;
  if (abs >= 1_000_000) return `${trimDecimals(value / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `${trimDecimals(value / 1_000, 1)}K`;
  return trimDecimals(value, 0);
}

function trimDecimals(value, digits) {
  return Number(value)
    .toFixed(digits)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
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
  renderTopPicks();
  render();
});

applyTranslations();
loadData();
