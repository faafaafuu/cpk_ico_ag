const state = {
  rows: [],
  pastRows: [],
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
    benchmarkEyebrow: "Past-project benchmark",
    benchmarkTitle: "What historically produced ATH multiples",
    ath10x: "ATH 10x+",
    ath50x: "ATH 50x+",
    ath100x: "ATH 100x+",
    failedBucket: "ATH below 0.25x",
    median10xRaise: "Median 10x+ raise",
    usedInRating: "Used in rating bonus",
    top10xCategories: "Top 10x+ categories",
    top10xBackers: "Top 10x+ backers",
    top10xLaunchpads: "Top 10x+ launchpads",
    ofAthSample: "of ATH sample",
    athSample: "ATH sample",
    topPicksEyebrow: "Analytical shortlist",
    topPicksTitle: "Deep-research shortlist",
    notFinancialAdvice: "Not financial advice",
    allocation: "Deposit",
    saleTerms: "Sale terms",
    why: "Why it can work",
    risks: "Why skip / wait",
    sources: "Sources",
    participate: "Participate",
    observe: "Observe",
    skip: "Skip",
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
    benchmarkEyebrow: "Исторический benchmark",
    benchmarkTitle: "Что чаще давало ATH-иксы",
    ath10x: "ATH 10x+",
    ath50x: "ATH 50x+",
    ath100x: "ATH 100x+",
    failedBucket: "ATH ниже 0.25x",
    median10xRaise: "Медианный raise 10x+",
    usedInRating: "Используется в бонусе рейтинга",
    top10xCategories: "Топ категорий 10x+",
    top10xBackers: "Топ инвесторов 10x+",
    top10xLaunchpads: "Топ launchpads 10x+",
    ofAthSample: "от ATH-выборки",
    athSample: "ATH-выборка",
    topPicksEyebrow: "Аналитический шортлист",
    topPicksTitle: "Шортлист глубокого ресерча",
    notFinancialAdvice: "Не финансовый совет",
    allocation: "Депозит",
    saleTerms: "Sale / вестинг",
    why: "Почему может сработать",
    risks: "Почему скип / ждать",
    sources: "Источники",
    participate: "Участвовать",
    observe: "Наблюдать",
    skip: "Скип",
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

const researchNotes = {
  "zkcross-network": {
    verdict: "observe",
    allocation: 0.25,
    confidence: "medium",
    terms: {
      en: "IDO TBA; price $0.025; CryptoRank shows ~$7.47M target raise. Public/IDO rounds: 20% TGE, 3M cliff, 6M vesting. Supply 2.1B CROSSAI; FDV ~$52.5M; team 18%, 12M cliff + 36M vesting.",
      ru: "IDO TBA; цена $0.025; CryptoRank показывает цель сбора около $7.47M. Public/IDO: 20% TGE, 3 мес. cliff, 6 мес. vesting. Supply 2.1B CROSSAI; FDV ~$52.5M; team 18%, 12 мес. cliff + 36 мес. vesting.",
    },
    positives: {
      en: ["DeFi + chain abstraction narrative matches strong 10x+ historical categories.", "Tokenomics page is public and has explicit cliff/vesting schedule.", "Low initial unlock excluding liquidity is documented at ~4.9%."],
      ru: ["DeFi + chain abstraction совпадает с сильными историческими 10x+ категориями.", "Есть публичная tokenomics-страница с cliff/vesting.", "Документирован низкий initial unlock без liquidity около 4.9%."],
    },
    risks: {
      en: ["Public round has only 6M vesting after 3M cliff, so sell pressure can arrive quickly.", "TGE date is still TBA.", "Only one visible named backer in our data, so investor signal is not strong."],
      ru: ["У public round всего 6 мес. vesting после 3 мес. cliff — давление продаж может прийти быстро.", "Дата TGE пока TBA.", "В наших данных виден только один named backer, investor-signal слабый."],
    },
    sources: [
      ["CryptoRank", "https://cryptorank.io/ico/zkcross-network"],
      ["Tokenomics", "https://zkcross-network.gitbook.io/zkcrossnetwork/the-cross-token/crossai-tokenomics"],
      ["Token utility", "https://zkcross-network.gitbook.io/zkcrossnetwork/the-cross-token/crossai-token-utilites"],
    ],
  },
  zesh: {
    verdict: "observe",
    allocation: 0.25,
    confidence: "medium",
    terms: {
      en: "Price $0.006; raise in our data $420K, TokenRadar shows ~$570K total. IDO terms mention 35% at TGE + 3M cliff on some rounds. Sale allocation ~17%; team 12%; strategic 7.6%.",
      ru: "Цена $0.006; в наших данных raise $420K, TokenRadar показывает около $570K. По IDO-условиям встречается 35% TGE + 3 мес. cliff. Sale allocation ~17%; team 12%; strategic 7.6%.",
    },
    positives: {
      en: ["AI/social growth tooling is a live narrative, not just a meme category.", "Public team page exists with named roles.", "Small raise is closer to historical 10x+ median than oversized sales."],
      ru: ["AI/social growth tooling — актуальный narrative, не просто meme.", "Есть публичная team page с ролями.", "Небольшой raise ближе к исторической медиане 10x+, чем раздутые продажи."],
    },
    risks: {
      en: ["35% TGE unlock is high and can create early sell pressure.", "Need independent verification of product traction and real customers.", "Some leadership role info is incomplete/TBA."],
      ru: ["35% unlock на TGE — высокий, может дать раннее давление.", "Нужно независимо проверить traction и реальных клиентов.", "Часть team info неполная/TBA."],
    },
    sources: [
      ["CryptoRank", "https://cryptorank.io/ico/zesh"],
      ["Website", "https://zesh.ai/"],
      ["TokenRadar", "https://tokenradar.io/ico/zesh"],
      ["CoinCarp", "https://www.coincarp.com/currencies/zesh/project-info/"],
    ],
  },
  "datai-network": {
    verdict: "observe",
    allocation: 0.5,
    confidence: "medium",
    terms: {
      en: "Upcoming IDO; price $0.025; raise $600K in our data; ChainGPT Pad. Max supply 1B DATAI; CMC self-reported circulating supply ~41.22M. Vesting/cliff not found in reliable public source yet.",
      ru: "Upcoming IDO; цена $0.025; raise $600K в наших данных; ChainGPT Pad. Max supply 1B DATAI; CMC self-reported circulating supply ~41.22M. Надёжный публичный vesting/cliff пока не найден.",
    },
    positives: {
      en: ["Product claims concrete usage metrics: smart contracts labeled, API requests, indexed transactions.", "Docs show testnet/dev flow, not only marketing copy.", "AI x on-chain data fits current market narrative."],
      ru: ["Есть конкретные product metrics: размеченные smart contracts, API-запросы, indexed transactions.", "Docs показывают testnet/dev flow, не только маркетинг.", "AI x on-chain data хорошо ложится в текущий narrative."],
    },
    risks: {
      en: ["No reliable vesting/cliff source found, so allocation must stay small.", "Need GitHub/code and customer verification.", "Multiple lookalike domains exist, so source hygiene matters."],
      ru: ["Надёжный vesting/cliff не найден — размер позиции только малый.", "Нужно проверить GitHub/code и клиентов.", "Есть похожие домены, нужна аккуратная проверка источников."],
    },
    sources: [
      ["CryptoRank", "https://cryptorank.io/ico/datai-network"],
      ["Website", "https://datai.network/"],
      ["Docs", "https://datai.network/docs/introduction/overview/"],
      ["CoinMarketCap", "https://coinmarketcap.com/currencies/datai-network"],
    ],
  },
  "spin-fi": {
    verdict: "observe",
    allocation: 0.25,
    confidence: "low",
    terms: {
      en: "Price $0.04; public raise $3.15M in our data; Tokensoft. Total raised shown in our data ~$12.43M. TGE/vesting/cliff need confirmation before entry.",
      ru: "Цена $0.04; public raise $3.15M в наших данных; Tokensoft. Total raised в данных около $12.43M. TGE/vesting/cliff нужно подтвердить до входа.",
    },
    positives: {
      en: ["Strong investor signal in our data: Spartan Group, GSR, Lemniscap, LongHash, Lattice.", "Blockchain infrastructure category is represented in historical winners.", "Tokensoft sale venue is a positive process signal."],
      ru: ["Сильный investor-signal: Spartan Group, GSR, Lemniscap, LongHash, Lattice.", "Blockchain infrastructure встречалась среди исторических winners.", "Tokensoft как площадка продажи — плюс к процессу."],
    },
    risks: {
      en: ["Insufficient public tokenomics/vesting in verified sources.", "Tech complexity is high; needs testnet, audits and real developer usage.", "Total raise is not tiny, so valuation discipline matters."],
      ru: ["Не хватает подтверждённой публичной tokenomics/vesting.", "Техническая сложность высокая: нужны testnet, audits и dev usage.", "Total raise немаленький, важна valuation discipline."],
    },
    sources: [
      ["CryptoRank", "https://cryptorank.io/ico/spin-fi"],
      ["Website", "https://multivm.io/"],
      ["Tokensoft", "https://www.tokensoft.com/"],
    ],
  },
  quranium: {
    verdict: "observe",
    allocation: 0.25,
    confidence: "medium",
    terms: {
      en: "Price $0.0667; raise $200K in our data; Animoca Brands visible as backer. Max supply listed by CMC as 2.1B QRN. Vesting/cliff and sale venue need confirmation.",
      ru: "Цена $0.0667; raise $200K в наших данных; среди backers виден Animoca Brands. Max supply по CMC — 2.1B QRN. Vesting/cliff и sale venue нужно подтвердить.",
    },
    positives: {
      en: ["Animoca signal is historically relevant in 100x+ clusters.", "Post-quantum L1 is differentiated versus generic L1 copycats.", "Website claims testnet, QSafe wallet, Swiss HQ and 200k+ community."],
      ru: ["Animoca — исторически релевантный сигнал в 100x+ кластерах.", "Post-quantum L1 отличается от обычных L1-клонов.", "Сайт заявляет testnet, QSafe wallet, Swiss HQ и 200k+ community."],
    },
    risks: {
      en: ["Deep tech thesis needs code/audit validation.", "L1 market is brutally competitive.", "Vesting and unlocks are not clear enough for participate verdict."],
      ru: ["Deep-tech тезис требует проверки кода/audit.", "L1 рынок крайне конкурентный.", "Vesting/unlocks недостаточно ясны для verdict 'участвовать'."],
    },
    sources: [
      ["CryptoRank", "https://cryptorank.io/ico/quranium"],
      ["Website", "https://www.quranium.org/"],
      ["About", "https://www.quranium.org/about-us"],
      ["CoinMarketCap", "https://coinmarketcap.com/currencies/quranium/"],
    ],
  },
  cineflicks: {
    verdict: "skip",
    allocation: 0,
    confidence: "medium",
    terms: {
      en: "Start shown as May 19, 2026; token price $0.0025; our data shows $75.5M raise and no visible investors/launchpads.",
      ru: "Старт указан 19 мая 2026; цена $0.0025; в наших данных raise $75.5M и нет видимых инвесторов/launchpads.",
    },
    positives: {
      en: ["Consumer streaming narrative is easy to understand.", "CMC preview page exists."],
      ru: ["Consumer streaming narrative легко понять.", "Есть CMC preview page."],
    },
    risks: {
      en: ["Oversized raise with no visible backer/launchpad signal in our data.", "Watch-to-earn has weak historical quality unless there is real user traction.", "No strong evidence yet for token demand or defensible moat."],
      ru: ["Слишком большой raise без видимых backers/launchpad в наших данных.", "Watch-to-earn исторически слаб без реального traction.", "Пока нет сильных доказательств token demand или moat."],
    },
    sources: [
      ["CryptoRank", "https://cryptorank.io/ico/cineflicks"],
      ["CoinMarketCap", "https://coinmarketcap.com/currencies/cineflicks/"],
    ],
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
  ath10xShare: document.querySelector("#ath10xShare"),
  ath50xShare: document.querySelector("#ath50xShare"),
  ath100xShare: document.querySelector("#ath100xShare"),
  failedCount: document.querySelector("#failedCount"),
  failedShare: document.querySelector("#failedShare"),
  median10xRaise: document.querySelector("#median10xRaise"),
  benchmarkSample: document.querySelector("#benchmarkSample"),
  topCategories: document.querySelector("#topCategories"),
  topBackers: document.querySelector("#topBackers"),
  topLaunchpads: document.querySelector("#topLaunchpads"),
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

    state.pastRows = past;
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
    .filter((row) => row.status === "upcoming" && researchNotes[row.id])
    .map((row) => ({ ...row, research: researchNotes[row.id] }))
    .sort((a, b) => verdictWeight(b.research.verdict) - verdictWeight(a.research.verdict) || b.rating - a.rating);

  if (!picks.length) {
    els.topPicks.innerHTML = `<div class="pickCard"><span class="muted">${escapeHtml(t("noPicks"))}</span></div>`;
    return;
  }

  els.topPicks.innerHTML = picks.map(renderPick).join("");
}

function renderPick(row) {
  const note = row.research;
  const verdictText = t(note.verdict);
  return `
    <article class="pickCard ${escapeHtml(note.verdict)}">
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
        <span class="miniBadge verdictBadge">${escapeHtml(verdictText)}</span>
        <span class="miniBadge">${escapeHtml(row.category || t("notAvailable"))}</span>
        <span class="miniBadge">${formatMoney(row.raised_amount)}</span>
        <span class="miniBadge">${escapeHtml(t("rating"))}: ${row.rating}</span>
      </div>
      <div class="allocation">${escapeHtml(t("allocation"))}: ${note.allocation}%</div>
      <div class="termsBlock">
        <strong>${escapeHtml(t("saleTerms"))}</strong>
        <p>${escapeHtml(localized(note.terms))}</p>
      </div>
      <strong class="reasonTitle">${escapeHtml(t("why"))}</strong>
      <ul class="reasonList">
        ${localized(note.positives).map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
      </ul>
      <strong class="reasonTitle">${escapeHtml(t("risks"))}</strong>
      <ul class="reasonList">
        ${localized(note.risks).map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
      </ul>
      <div class="sourceLinks">
        ${note.sources.map(([label, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`).join("")}
      </div>
    </article>
  `;
}

function localized(value) {
  return value[state.language] || value.en;
}

function verdictWeight(verdict) {
  return { participate: 3, observe: 2, skip: 1 }[verdict] || 0;
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
  const count10x = withAth.filter((row) => Number(row.ath_roi) >= 10).length;
  const count50x = withAth.filter((row) => Number(row.ath_roi) >= 50).length;
  const count100x = withAth.filter((row) => Number(row.ath_roi) >= 100).length;
  const failed = withAth.filter((row) => Number(row.ath_roi) <= 0.25).length;

  els.benchmarkSample.textContent = `${t("athSample")}: ${formatNumber(withAth.length)}`;
  els.ath10xCount.textContent = formatNumber(count10x);
  els.ath50xCount.textContent = formatNumber(count50x);
  els.ath100xCount.textContent = formatNumber(count100x);
  els.failedCount.textContent = formatNumber(failed);
  els.ath10xShare.textContent = `${formatPercent(count10x, withAth.length)} ${t("ofAthSample")}`;
  els.ath50xShare.textContent = `${formatPercent(count50x, withAth.length)} ${t("ofAthSample")}`;
  els.ath100xShare.textContent = `${formatPercent(count100x, withAth.length)} ${t("ofAthSample")}`;
  els.failedShare.textContent = `${formatPercent(failed, withAth.length)} ${t("ofAthSample")}`;
  els.median10xRaise.textContent = formatMoney(state.historicalPatterns.medianRaise10x);

  els.topCategories.innerHTML = renderPatternChips(
    state.historicalPatterns.categories10x,
    7,
    "category"
  );
  els.topBackers.innerHTML = renderPatternChips(state.historicalPatterns.investors10x, 7);
  els.topLaunchpads.innerHTML = renderPatternChips(state.historicalPatterns.launchpads10x, 7);
  els.topCategories.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      els.categoryFilter.value = button.dataset.category;
      els.statusFilter.value = "all";
      render();
    });
  });
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

function renderPatternChips(map, limit, type = "") {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => {
      const attrs = type === "category"
        ? ` data-category="${escapeHtml(name)}" class="patternChip clickable"`
        : ` class="patternChip"`;
      const tag = type === "category" ? "button" : "span";
      return `<${tag}${attrs}>${escapeHtml(name)} · ${formatNumber(count)}</${tag}>`;
    })
    .join("");
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

function formatPercent(value, total) {
  if (!total) return "0%";
  return `${trimDecimals((value / total) * 100, 1)}%`;
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
  updateInsights(state.pastRows);
  renderTopPicks();
  render();
});

applyTranslations();
loadData();
