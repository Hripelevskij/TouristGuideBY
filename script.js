const LANG_KEY = "lang";

// Глобальное хранилище текущих переводов — используется всеми модулями
let currentTranslations = {};

function t(key) {
    return currentTranslations[key] || key;
}

async function loadTranslations(lang) {
    const response = await fetch(`locales/${lang}.json`);
    return response.json();
}

async function applyTranslations(translations) {
    currentTranslations = translations;

    // Все элементы с data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (!translations[key]) return;

        if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
            el.placeholder = translations[key];
        } else {
            el.textContent = translations[key];
        }
    });

    // Кнопка смены языка
    const langBtn = document.getElementById("toggle-lang");
    if (langBtn && translations["lang_btn"]) {
        langBtn.textContent = translations["lang_btn"];
    }

    // Кнопка темы — перерисовать с новым текстом
    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);

    // Перерисовать открытый регион (если есть)
    const regionInfo = document.getElementById("regionInfo");
    if (regionInfo && regionInfo.dataset.currentRegion) {
        showRegion(regionInfo.dataset.currentRegion);
    }

    // Перерисовать метки на карте
    rebuildMapPlacemarks();

    // Обновить кнопки избранного
    updateFavoriteButtons();

    // Перерисовать профиль и список избранного с правильными переводами
    if (typeof renderAuthState === "function") {
        renderAuthState();
    }

    // Перерисовать открытое модальное окно объекта (если есть) с правильными переводами
    if (typeof openAttractionModal === "function" && typeof attractionKeyMap !== "undefined") {
        const modal = document.getElementById("attraction-modal");
        const hashId = window.location.hash.replace("#", "");
        if (modal && modal.classList.contains("active") && hashId && attractionKeyMap[hashId]) {
            openAttractionModal(hashId);
        }
    }
}

async function initLang() {
    const saved = localStorage.getItem(LANG_KEY) || "ru";
    const translations = await loadTranslations(saved);
    await applyTranslations(translations);

    const langBtn = document.getElementById("toggle-lang");
    if (!langBtn) return;

    langBtn.addEventListener("click", async () => {
        const current = localStorage.getItem(LANG_KEY) || "ru";
        const next = current === "ru" ? "en" : "ru";
        localStorage.setItem(LANG_KEY, next);
        const newTranslations = await loadTranslations(next);
        await applyTranslations(newTranslations);
    });
}

document.addEventListener("DOMContentLoaded", initLang);


// =====================
// ПЕРЕКЛЮЧЕНИЕ ТЕМЫ
// =====================

const toggleBtn = document.getElementById("toggle-theme");
const body = document.body;

function applyTheme(theme) {
    if (theme === "light") {
        body.classList.add("light-theme");
        if (toggleBtn) toggleBtn.textContent = t("theme_dark");
    } else {
        body.classList.remove("light-theme");
        if (toggleBtn) toggleBtn.textContent = t("theme_light");
    }
}

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        const isLight = body.classList.toggle("light-theme");
        const theme = isLight ? "light" : "dark";
        localStorage.setItem("theme", theme);
        applyTheme(theme);
    });
}


// =====================
// ИНФОРМАЦИЯ ПО ОБЛАСТЯМ
// =====================

// Конфигурация регионов: только картинки и ключи переводов
const regionConfig = {
    minsk: {
        coats: [
            { src: "images/gerb_minsk.png",  captionKey: "region_minsk_coat_caption" },
            { src: "images/gerb_minsk2.png", captionKey: "region_minsk_coat2_caption" }
        ],
        populationKey: "region_minsk_population",
        gallery: [
            { src: "images/minsk/minsk1.jpg" },
            { src: "images/minsk/minsk2.jpg", },
            { src: "images/minsk/minsk3.jpg", }
        ]
    },
    brest: {
        coats: [{ src: "images/gerb_brest.png", captionKey: "region_brest_coat_caption" }],
        gallery: [
            { src: "images/brest/brest1.jpg", },
            { src: "images/brest/brest2.jpg", },
            { src: "images/brest/brest3.jpg", }
        ]
    },
    grodno: {
        coats: [{ src: "images/gerb_grodno.png", captionKey: "region_grodno_coat_caption" }],
        gallery: [
            { src: "images/grodnozam.jpg",},
            { src: "images/grodno/grodno2.jpg", },
            { src: "images/grodno/grodno3.jpg",}
        ]
    },
    vitebsk: {
        coats: [{ src: "images/gerb_vitebsk.png", captionKey: "region_vitebsk_coat_caption" }],
        gallery: [
            { src: "images/vitebsk/vitebsk.jpg",  },
            { src: "images/vitebsk/vitebsk2.jpg", },
            { src: "images/sobor.jpg", }
        ]
    },
    mogilev: {
        coats: [{ src: "images/gerb_mogilev.png", captionKey: "region_mogilev_coat_caption" }],
        gallery: [
            { src: "images/mogilev/mogilev.jpg", },
            { src: "images/mogilev/mogilev2.jpg", },
            { src: "images/ratus.jpg", }
        ]
    },
    gomel: {
        coats: [{ src: "images/gerb_gomel.png", captionKey: "region_gomel_coat_caption" }],
        gallery: [
            { src: "images/ansambl.jpg", alt: "Дворец Румянцевых-Паскевичей" },
            { src: "images/gomel/gomel.jpg", },
            { src: "images/gomel/gomel2.jpg", }
        ]
    }
};

function buildRegionHTML(region) {
    const cfg = regionConfig[region];
    if (!cfg) return "";

    const coatsHTML = cfg.coats.map(c => `
        <div style="text-align:center;">
            <img src="${c.src}" style="max-width:80px; height:auto;">
            <p style="font-size:12px; margin:4px 0 0;">${t(c.captionKey)}</p>
        </div>
    `).join("");

    const coatsWrapper = cfg.coats.length > 1
        ? `<div style="display:flex; gap:20px; align-items:flex-start; margin-bottom:10px;">${coatsHTML}</div>`
        : `<div style="text-align:center; max-width:100px; margin-bottom:10px;">${coatsHTML}</div>`;

    const populationRow = cfg.populationKey
        ? `<p><strong>${t("region_label_population")}</strong> ${t(`region_${region}_population`)}</p>`
        : "";

    const galleryHTML = cfg.gallery
        ? cfg.gallery.map(g => `
            <img src="${g.src}" alt="${g.alt}" style="flex:1; min-width:140px; height:120px; object-fit:cover; border-radius:10px;">
        `).join("")
        : "";

    return `
        ${coatsWrapper}
        <p><strong>${t("region_label_center")}</strong> ${t(`region_${region}_center`)}</p>
        <p><strong>${t("region_label_area")}</strong> ${t(`region_${region}_area`)}</p>
        ${populationRow}
        <p>${t(`region_${region}_text`)}</p>
        <div class="region-gallery" style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">
            ${galleryHTML}
        </div>
    `;
}

function showRegion(region) {
    const info = document.getElementById("regionInfo");
    if (!info || !regionConfig[region]) return;

    // Запоминаем текущий регион для перерисовки при смене языка
    info.dataset.currentRegion = region;

    info.innerHTML = `<h3>${t(`region_${region}_title`)}</h3>${buildRegionHTML(region)}`;
    info.classList.add("active");
    info.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Lightbox для новых картинок
    setTimeout(initLightbox, 50);
}

document.querySelectorAll(".region-svg").forEach(item => item.classList.remove("active"));


// =====================
// ЯНДЕКС КАРТА
// =====================

let map;
let searchMarker = null;
let mapPlacemarks = [];

// Только координаты, картинки и ключи переводов — без текстов напрямую
const attractionsConfig = [
    { c:[53.4528, 26.4725], img:"images/mir.jpg",       titleKey:"modal_mir_title",       descKey:"cat_mir_desc",         link:"catalog.html#mir"              },
    { c:[53.2224, 26.6916], img:"images/nesvizh.jpg",   titleKey:"modal_nesvizh_title",   descKey:"cat_nesvizh_desc",     link:"catalog.html#nesvizh"          },
    { c:[52.0976, 23.7341], img:"images/brest.jpg",      titleKey:"modal_brest_title",     descKey:"cat_brest_desc",       link:"catalog.html#brest-fortress"   },
    { c:[52.5850, 23.8000], img:"images/bialowieza.jpg",titleKey:"modal_bialowieza_title",descKey:"cat_bialowieza_desc",  link:"catalog.html#bialowieza"       },
    { c:[52.5056, 23.9283], img:"images/main.jpg",      titleKey:"modal_bela_vezha_title",descKey:"cat_belaya_vezha_desc",link:"catalog.html#bela-vezha"       },
    { c:[55.4833, 28.7667], img:"images/sobor.jpg",      titleKey:"modal_sofia_title",     descKey:"cat_sofia_desc",       link:"catalog.html#sofia-cathedral"  },
    { c:[55.1833, 30.1667], img:"images/repin.jpg",      titleKey:"modal_repin_title",     descKey:"cat_repin_desc",       link:"catalog.html#repin-museum"     },
    { c:[52.4333, 31.0000], img:"images/ansambl.jpg",      titleKey:"modal_gomel_title",     descKey:"cat_gomel_desc",       link:"catalog.html#gomel-palace"     },
    { c:[53.6833, 23.8333], img:"images/grodnozam.jpg",      titleKey:"modal_grodno_title",    descKey:"cat_grodno_desc",      link:"catalog.html#grodno-castle"    },
    { c:[53.6000, 25.8167], img:"images/novogrudok.jpg",      titleKey:"modal_novogrudok_title",descKey:"cat_novogrudok_desc",  link:"catalog.html#novogrudok-castle"},
    { c:[54.3333, 28.3833], img:"images/khatyn.jpg",      titleKey:"modal_khatyn_title",    descKey:"cat_khatyn_desc",      link:"catalog.html#khatyn"           },
    { c:[53.9006, 27.5590], img:"images/up.jpg",      titleKey:"modal_uppertown_title", descKey:"cat_uppertown_desc",   link:"catalog.html#upper-town"       },
    { c:[53.9000, 30.3333], img:"images/ratus.jpg",      titleKey:"modal_mogilev_title",   descKey:"cat_mogilev_desc",     link:"catalog.html#mogilev-townhall" },
    { c:[53.0167, 28.8667], img:"images/bobr.jpg",      titleKey:"modal_bobruisk_title",  descKey:"cat_bobruisk_desc",    link:"catalog.html#bobruisk-fortress"},
];

function buildBalloonHtml(place) {
    const title = t(place.titleKey);
    const desc  = t(place.descKey);
    const more  = t("map_balloon_more");
    return `
        <div style="max-width:240px;">
            <img src="${place.img}" alt="${title}"
                 style="width:100%; height:140px; object-fit:cover; border-radius:8px; margin-bottom:8px;">
            <h3 style="margin:0 0 6px;">${title}</h3>
            <p style="margin:0 0 10px; font-size:13px; color:#444;">${desc}</p>
            <a href="${place.link}"
               style="display:inline-block; padding:6px 14px; background:#cc3333; color:#fff;
                      border-radius:8px; text-decoration:none; font-size:13px;">
                ${more}
            </a>
        </div>
    `;
}

function rebuildMapPlacemarks() {
    if (!map || typeof ymaps === "undefined") return;

    // Удаляем старые метки
    mapPlacemarks.forEach(pm => map.geoObjects.remove(pm));
    mapPlacemarks = [];

    attractionsConfig.forEach(function (place) {
        const pm = new ymaps.Placemark(
            place.c,
            { balloonContent: buildBalloonHtml(place), hintContent: t(place.titleKey) },
            { preset: "islands#redDotIcon" }
        );
        map.geoObjects.add(pm);
        mapPlacemarks.push(pm);
    });
}

if (typeof ymaps !== "undefined") {
    ymaps.ready(function () {
        map = new ymaps.Map("map", {
            center: [53.9006, 27.5590],
            zoom: 7,
            controls: ["zoomControl", "fullscreenControl", "geolocationControl"]
        });

        rebuildMapPlacemarks();

        const si = document.getElementById("searchInput");
        if (si) si.addEventListener("keydown", e => { if (e.key === "Enter") searchPlace(); });
    });
}


// =====================
// ГЕОКОДЕР (Nominatim OSM)
// =====================

function geocode(query) {
    const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=by&q=" +
        encodeURIComponent(query);
    return fetch(url, { headers: { "Accept-Language": "ru" } })
        .then(r => r.json())
        .then(function (data) {
            if (!data.length) return null;
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        });
}


// =====================
// ПОИСК
// =====================

function searchPlace() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    if (!query) return;

    // Ищем среди своих меток по переведённому названию
    const found = attractionsConfig.find(p => t(p.titleKey).toLowerCase().includes(query));
    if (found) {
        map.setCenter(found.c, 13, { duration: 400 });
        return;
    }

    // Иначе — через геокодер
    geocode(query).then(function (coords) {
        if (!coords) { alert(t("map_not_found")); return; }
        map.setCenter(coords, 13, { duration: 400 });
        if (searchMarker) map.geoObjects.remove(searchMarker);
        searchMarker = new ymaps.Placemark(coords, { balloonContent: query }, { preset: "islands#blueDotIcon" });
        map.geoObjects.add(searchMarker);
    }).catch(() => alert(t("map_search_error")));
}


// =====================
// ФИЛЬТР ПО КАТЕГОРИЯМ
// =====================

function initFilters() {
    const select = document.getElementById("category");
    if (!select) return;

    select.addEventListener("change", function () {
        const value = select.value;
        document.querySelectorAll(".attraction").forEach(function (item) {
            if (value === "all" || item.dataset.category === value) {
                item.style.display = "";
            } else {
                item.style.display = "none";
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", initFilters);


// =====================
// ПОДРОБНАЯ ИНФОРМАЦИЯ ОБ ОБЪЕКТАХ (для модального окна)
// =====================

// Только картинки — тексты берём из переводов через ключи
const attractionImages = {
    "mir":              ["images/mir.jpg",         "images/mir2.jpg",        "images/mir3.jpg"       ],
    "nesvizh":          ["images/nesvizh.jpg",     "images/nesvizh2.jpg",    "images/nesvizh.jpg"    ],
    "brest-fortress":   ["images/brest.jpg",       "images/brest2.jpg",      "images/brest3.jpg"     ],
    "bialowieza":       ["images/bialowieza.jpg",  "images/bialowieza2.jpg", "images/bialowieza3.jpg"],
    "bela-vezha":       ["images/main.jpg",        "images/kamenets.jpg",    "images/kamenets2.jpg"  ],
    "sofia-cathedral":  ["images/main_light.jpg",  "images/sobor.jpg",       "images/sobor2.jpg"     ],
    "repin-museum":     ["images/repin.jpg",       "images/repin2.jpg",      "images/repin3.jpg"     ],
    "gomel-palace":     ["images/ansambl.jpg",     "images/ansambl2.jpg",    "images/ansambl3.jpg"   ],
    "grodno-castle":    ["images/grodnozam.jpg",   "images/grodnozam3.jpg",  "images/grodnozam3.jpg" ],
    "novogrudok-castle":["images/novogrudok.jpg",  "images/novogrudok2.jpg", "images/novogrudok3.jpg"],
    "khatyn":           ["images/khatyn.jpg",      "images/khatyn2.jpg",     "images/khatyn3.jpg"    ],
    "upper-town":       ["images/up2.jpg",         "images/up3.jpg",         "images/up4.jpg"        ],
    "mogilev-townhall": ["images/ratus.jpg",       "images/ratus2.jpg",      "images/ratus3.jpg"     ],
    "bobruisk-fortress":["images/bobr.jpg",        "images/bobr2.jpg",        "images/bobr3.jpg"       ],
    "art-museum":       ["images/museum.jpg",      "images/museum2.jpg",     "images/museum3.jpg"    ]
};

// Соответствие id карточки → префикс ключа перевода
const attractionKeyMap = {
    "mir":               "mir",
    "nesvizh":           "nesvizh",
    "brest-fortress":    "brest",
    "bialowieza":        "bialowieza",
    "bela-vezha":        "bela_vezha",
    "sofia-cathedral":   "sofia",
    "repin-museum":      "repin",
    "gomel-palace":      "gomel",
    "grodno-castle":     "grodno",
    "novogrudok-castle": "novogrudok",
    "khatyn":            "khatyn",
    "upper-town":        "uppertown",
    "mogilev-townhall":  "mogilev",
    "bobruisk-fortress": "bobruisk",
    "art-museum":        "artmuseum"
};

function getAttractionData(id) {
    const key = attractionKeyMap[id];
    if (!key) return null;
    return {
        title:       t(`modal_${key}_title`),
        address:     t(`modal_${key}_address`),
        description: t(`modal_${key}_desc`),
        images:      attractionImages[id] || []
    };
}


// =====================
// МОДАЛЬНОЕ ОКНО КАТАЛОГА
// =====================

function openAttractionModal(id) {
    const data = getAttractionData(id);
    if (!data) return;

    const modal = document.getElementById("attraction-modal");
    if (!modal) return;

    document.getElementById("modal-title").textContent = data.title;
    document.getElementById("modal-address").textContent = "📍 " + data.address;
    document.getElementById("modal-description").textContent = data.description;

    const gallery = document.getElementById("modal-gallery");
    gallery.innerHTML = "";
    data.images.forEach(function (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = data.title;
        gallery.appendChild(img);
    });

    const routeBtn = document.getElementById("modal-route-btn");
    routeBtn.href = "https://yandex.ru/maps/?text=" + encodeURIComponent(data.address);

    const favBtn = document.getElementById("modal-favorite-btn");
    if (favBtn) {
        favBtn.dataset.id = id;
        updateFavoriteButtons();
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    setTimeout(initLightbox, 50);
}

function closeAttractionModal() {
    const modal = document.getElementById("attraction-modal");
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("attraction-modal");
    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === modal || e.target.classList.contains("modal-close")) {
                closeAttractionModal();
            }
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeAttractionModal();
    });

    document.querySelectorAll(".attraction").forEach(function (card) {
        const link = card.querySelector("a");
        if (link && attractionKeyMap[card.id]) {
            link.addEventListener("click", function (e) {
                e.preventDefault();
                openAttractionModal(card.id);
            });
        }
    });

    const hashId = window.location.hash.replace("#", "");
    if (hashId && attractionKeyMap[hashId]) {
        openAttractionModal(hashId);
    }
});


// =====================
// БОКОВАЯ ПАНЕЛЬ И АВТОРИЗАЦИЯ
// =====================

const CURRENT_USER_KEY = "tg_currentUser";
const USERS_DB_KEY = "tg_users_db";   // хранит объект вида { "users": { "имя": { password, favorites } } }
const OLD_USERS_KEY = "tg_users";     // старый формат хранения (для миграции)

function loadUsersDB() {
    try {
        const raw = localStorage.getItem(USERS_DB_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.users === "object" && parsed.users !== null) return parsed;
        return null;
    } catch {
        return null;
    }
}

function saveUsersDB(db) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
}

// Загружает базу пользователей в формате JSON (data/users.json) при первом запуске
// или переносит данные из старого формата хранения, если они есть.
async function initUsersDB() {
    let db = loadUsersDB();
    if (db) return db;

    // Миграция со старого формата (tg_users → tg_users_db)
    try {
        const oldRaw = localStorage.getItem(OLD_USERS_KEY);
        if (oldRaw) {
            const oldUsers = JSON.parse(oldRaw);
            if (oldUsers && typeof oldUsers === "object") {
                db = { users: oldUsers };
                saveUsersDB(db);
                return db;
            }
        }
    } catch {
        // игнорируем повреждённые данные старого формата
    }

    // Первый запуск — подгружаем начальную базу из data/users.json
    try {
        const response = await fetch("data/users.json");
        const data = await response.json();
        db = (data && typeof data.users === "object") ? data : { users: {} };
    } catch {
        db = { users: {} };
    }

    saveUsersDB(db);
    return db;
}

function getUsers() {
    const db = loadUsersDB() || { users: {} };
    return db.users;
}

function saveUsers(users) {
    saveUsersDB({ users: users });
}

function getCurrentUser() {
    return localStorage.getItem(CURRENT_USER_KEY);
}

function setCurrentUser(username) {
    localStorage.setItem(CURRENT_USER_KEY, username);
}

function logoutUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
}

// Скачать текущую базу пользователей в виде файла users.json
function exportUsersDB() {
    const db = loadUsersDB() || { users: {} };
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "users.json";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// Загрузить базу пользователей из выбранного файла users.json
function importUsersDB(file, callback) {
    const reader = new FileReader();

    reader.onload = function () {
        try {
            const data = JSON.parse(reader.result);
            if (!data || typeof data.users !== "object" || data.users === null) {
                throw new Error("invalid format");
            }
            saveUsersDB(data);
            callback(true);
        } catch {
            callback(false);
        }
    };

    reader.onerror = function () {
        callback(false);
    };

    reader.readAsText(file);
}

function getFavorites(username) {
    const users = getUsers();
    if (!users[username]) return [];
    return users[username].favorites || [];
}

function toggleFavorite(username, id) {
    const users = getUsers();
    if (!users[username]) return;
    const favs = users[username].favorites || [];
    const idx = favs.indexOf(id);
    if (idx === -1) {
        favs.push(id);
    } else {
        favs.splice(idx, 1);
    }
    users[username].favorites = favs;
    saveUsers(users);
    renderFavorites();
    updateFavoriteButtons();
}

function isFavorite(id) {
    const username = getCurrentUser();
    if (!username) return false;
    return getFavorites(username).includes(id);
}


// =====================
// РЕНДЕР ПРОФИЛЯ И ИЗБРАННОГО
// =====================

function renderAuthState() {
    const username = getCurrentUser();
    const authForms = document.getElementById("auth-forms");
    const profile = document.getElementById("user-profile");
    if (!authForms || !profile) return;

    if (username) {
        authForms.style.display = "none";
        profile.style.display = "block";
        document.getElementById("profile-username").textContent = "👤 " + username;
        renderFavorites();
    } else {
        authForms.style.display = "block";
        profile.style.display = "none";
    }

    updateFavoriteButtons();
}

function renderFavorites() {
    const username = getCurrentUser();
    const list = document.getElementById("favorites-list");
    const empty = document.getElementById("favorites-empty");
    if (!list || !empty) return;

    const favs = username ? getFavorites(username) : [];
    list.innerHTML = "";

    if (!favs.length) {
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";

    favs.forEach(function (id) {
        const data = getAttractionData(id);
        const title = data ? data.title : id;

        const li = document.createElement("li");

        const a = document.createElement("a");
        a.href = "catalog.html#" + id;
        a.textContent = title;
        li.appendChild(a);

        const btn = document.createElement("button");
        btn.className = "remove-favorite";
        btn.innerHTML = "&times;";
        btn.title = t("favorite_remove_title");
        btn.addEventListener("click", function () {
            toggleFavorite(username, id);
        });
        li.appendChild(btn);

        list.appendChild(li);
    });
}

function updateFavoriteButtons() {
    document.querySelectorAll("[data-favorite-btn]").forEach(function (btn) {
        const card = btn.closest(".attraction");
        if (!card) return;
        const id = card.id;
        if (isFavorite(id)) {
            btn.classList.add("active");
            btn.textContent = t("favorite_in_list");
        } else {
            btn.classList.remove("active");
            btn.textContent = t("favorite_btn");
        }
    });

    const modalBtn = document.getElementById("modal-favorite-btn");
    if (modalBtn && modalBtn.dataset.id) {
        if (isFavorite(modalBtn.dataset.id)) {
            modalBtn.classList.add("active");
            modalBtn.textContent = t("favorite_in_list");
        } else {
            modalBtn.classList.remove("active");
            modalBtn.textContent = t("favorite_btn");
        }
    }
}


// =====================
// ИНИЦИАЛИЗАЦИЯ ПАНЕЛИ
// =====================

async function initSidebar() {
    const hamburger = document.getElementById("hamburger-btn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const closeBtn = document.getElementById("sidebar-close");

    if (!hamburger || !sidebar || !overlay) return;

    // Загружаем (или мигрируем/создаём) базу пользователей из data/users.json
    await initUsersDB();

    function openSidebar() {
        sidebar.classList.add("active");
        overlay.classList.add("active");
    }

    function closeSidebar() {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    }

    hamburger.addEventListener("click", openSidebar);
    overlay.addEventListener("click", closeSidebar);
    if (closeBtn) closeBtn.addEventListener("click", closeSidebar);

    const showRegister = document.getElementById("show-register");
    const showLogin = document.getElementById("show-login");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (showRegister) {
        showRegister.addEventListener("click", function (e) {
            e.preventDefault();
            loginForm.style.display = "none";
            registerForm.style.display = "block";
        });
    }
    if (showLogin) {
        showLogin.addEventListener("click", function (e) {
            e.preventDefault();
            registerForm.style.display = "none";
            loginForm.style.display = "block";
        });
    }

    // Регистрация
    const registerSubmit = document.getElementById("register-submit");
    if (registerSubmit) {
        registerSubmit.addEventListener("click", function () {
            const username = document.getElementById("register-username").value.trim();
            const password = document.getElementById("register-password").value;
            const errorEl = document.getElementById("register-error");

            if (!username || !password) {
                errorEl.textContent = t("auth_fill_fields");
                return;
            }

            const users = getUsers();
            if (users[username]) {
                errorEl.textContent = t("auth_user_exists");
                return;
            }

            users[username] = { password: password, favorites: [] };
            saveUsers(users);
            setCurrentUser(username);
            errorEl.textContent = "";
            renderAuthState();
        });
    }

    // Вход
    const loginSubmit = document.getElementById("login-submit");
    if (loginSubmit) {
        loginSubmit.addEventListener("click", function () {
            const username = document.getElementById("login-username").value.trim();
            const password = document.getElementById("login-password").value;
            const errorEl = document.getElementById("login-error");

            const users = getUsers();
            if (!users[username] || users[username].password !== password) {
                errorEl.textContent = t("auth_wrong_credentials");
                return;
            }

            setCurrentUser(username);
            errorEl.textContent = "";
            renderAuthState();
        });
    }

    // Выход из аккаунта
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            logoutUser();
            renderAuthState();
        });
    }

    // Экспорт базы пользователей в users.json
    const exportBtn = document.getElementById("export-users-btn");
    if (exportBtn) {
        exportBtn.addEventListener("click", function () {
            exportUsersDB();
        });
    }

    // Импорт базы пользователей из users.json
    const importInput = document.getElementById("import-users-input");
    if (importInput) {
        importInput.addEventListener("change", function () {
            const file = importInput.files && importInput.files[0];
            if (!file) return;

            importUsersDB(file, function (success) {
                const msgEl = document.getElementById("users-db-message");
                if (msgEl) {
                    msgEl.textContent = success ? t("auth_import_success") : t("auth_import_error");
                    msgEl.classList.toggle("auth-error", !success);
                    msgEl.classList.toggle("auth-success", success);
                }
                if (success) renderAuthState();
                importInput.value = "";
            });
        });
    }

    renderAuthState();
}


// =====================
// КНОПКИ "В ИЗБРАННОЕ"
// =====================

function initFavoriteButtons() {
    document.querySelectorAll("[data-favorite-btn]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            const username = getCurrentUser();
            if (!username) {
                alert(t("auth_login_required"));
                return;
            }
            const card = btn.closest(".attraction");
            if (!card) return;
            toggleFavorite(username, card.id);
        });
    });

    const modalBtn = document.getElementById("modal-favorite-btn");
    if (modalBtn) {
        modalBtn.addEventListener("click", function () {
            const username = getCurrentUser();
            if (!username) {
                alert(t("auth_login_required"));
                return;
            }
            const id = modalBtn.dataset.id;
            if (!id) return;
            toggleFavorite(username, id);
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    initSidebar();
    initFavoriteButtons();
});


// =====================
// УВЕЛИЧЕНИЕ ИЗОБРАЖЕНИЙ (LIGHTBOX)
// =====================

function initLightbox() {
    let lightbox = document.getElementById("lightbox-overlay");
    if (!lightbox) {
        lightbox = document.createElement("div");
        lightbox.id = "lightbox-overlay";
        lightbox.className = "lightbox-overlay";
        lightbox.innerHTML = '<img id="lightbox-img" src="" alt="">';
        document.body.appendChild(lightbox);

        lightbox.addEventListener("click", function () {
            lightbox.classList.remove("active");
            document.body.style.overflow = "";
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                lightbox.classList.remove("active");
                document.body.style.overflow = "";
            }
        });
    }

    const lightboxImg = document.getElementById("lightbox-img");

    const selectors = [
        ".attraction img",
        ".place-card img",
        ".modal-gallery img",
        ".region-gallery img",
        ".discover-image img"
    ];

    document.querySelectorAll(selectors.join(",")).forEach(function (img) {
        if (img.dataset.lightboxBound) return;
        img.dataset.lightboxBound = "true";
        img.style.cursor = "zoom-in";

        img.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt || "";
            lightbox.classList.add("active");
            document.body.style.overflow = "hidden";
        });
    });
}

document.addEventListener("DOMContentLoaded", initLightbox);