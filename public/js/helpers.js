const BACKEND_PREFIX = "/api";
const SEARCH = new URL(document.location.href).searchParams;
const DATE_ISO_FORMAT = "yyyy-MM-DD";
const TIME_FORMAT = "HH:mm";
const DEFAULT_PROJECT_COLOR = "#3c4daf";

const WEEKDAY = {
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
    0: "sunday",
};
const WEEK_FORMAT = "YYYY-[W]WW";
const cacheStore = {};

async function request(path, method = "GET", data) {
    try {
        path = `${BACKEND_PREFIX}/${path}`;

        /** @type {RequestInit & Required<{ headers: HeadersInit }>} */
        const options = {
            method,
            headers: {},
        };

        if (method !== "GET") {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(data);
        } else if (data) {
            path += `?${new URLSearchParams(data)}`;
        }

        const response = await fetch(path, options);

        const result = await response.json();

        return result;
    } catch (error) {
        console.error("ReqError:", error);
        throw error;
    }
}

async function requestCached(path, method = "GET", data, cacheTimeoutMs = 5e3) {
    const key = `${method} ${path} ${data ? JSON.stringify(data) : null}`;

    if (cacheStore[key]) return cacheStore[key];

    const response = request(path, method, data);
    cacheStore[key] = response;

    const promise = response.catch((err) => {
        delete cacheStore[key];

        console.error(err);

        throw err;
    });

    setTimeout(() => {
        delete cacheStore[key];
    }, cacheTimeoutMs);

    return promise;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
}

/**
 *
 * @param {string} [err]
 * @returns {never}
 */
function never(err = "never appears") {
    throw new Error(err);
}

/**
 *
 * @param {keyof HTMLElementTagNameMap} tag
 * @param {string} [text]
 * @param {Record<string, string> | null} [props]
 * @param {string[]} [elements]
 * @returns
 */
function wrapTag(tag, text, props, elements) {
    let html = `<${tag}`;

    if (props) {
        for (const key in props) {
            html += ` ${key}="${props[key]}"`;
        }
    }

    html += ">";

    if (elements) {
        html += elements.join("");
    }

    if (text && elements && elements.length) {
        throw new Error("Cannot create text and elements. Use text as element");
    }

    html += `${text || ""}</${tag}>`;

    return html;
}

/**
 *
 * @param {HTMLSelectElement} dom
 * @param {string} apiPath
 * @param {string} [valueKey]
 * @param {string} [nameKey]
 * @param {(a: any, b: any) => number} [sorter]
 */
function createRemoteSelector(dom, apiPath, valueKey = "id", nameKey = "name", sorter) {
    return new Promise((resolve, reject) => {
        dom.onclick = async (e) => {
            const entities = await requestCached(apiPath, "GET").catch((err) => reject(err));
            if (!entities) return;

            resolve(entities);

            const lastSel = dom.options[dom.selectedIndex];

            while (dom.options.length) {
                dom.options.remove(0);
            }

            if (lastSel) {
                lastSel.hidden = true;
                dom.appendChild(lastSel);
            }

            const arr = Object.values(entities);

            if (!arr.length) return;

            if (sorter) {
                arr.sort(sorter);
            }

            for (const entity of arr) {
                const name = entity[nameKey];
                const value = entity[valueKey];

                const el = document.createElement("option");

                el.innerText = name;
                el.value = value;

                dom.appendChild(el);
            }

            if (!lastSel) {
                // Fix for auto-select
                dom.dispatchEvent(new Event("change"));
            }
        };
    });
}

function getSelectedOptionValue(dom) {
    const val = dom.options[dom.selectedIndex];

    if (!val) return null;

    return { value: val.value, text: val.innerText };
}

/**
 *
 * @param {string} selector
 * @returns
 */
function q(selector) {
    return document.querySelector(selector);
}

/**
 * @template {HTMLElement} T
 * @param {string} selector
 * @param {HTMLElement | Document | Element} [fromEl]
 * @param {new (args: any) => T} [type]
 * @returns {T}
 */
function qStrict(selector, fromEl = document, type) {
    const el = fromEl.querySelector(selector);

    if (!el) throw new Error(`${selector} not found`);

    // @ts-ignore
    return el;
}

/**
 * @template {HTMLElement} T
 * @param {string} selector
 * @param {HTMLElement | Document | Element} [fromEl]
 * @param {new (args: any) => T} [type]
 * @returns {NodeListOf<T>}
 */
function qqStrict(selector, fromEl = document, type) {
    const el = fromEl.querySelectorAll(selector);

    // @ts-ignore
    return el;
}

/**
 *
 * @param {string} selector
 * @returns
 */
function qq(selector) {
    return document.querySelectorAll(selector);
}

function checkObjectForEmpty(obj, isStrict) {
    for (const [key, value] of Object.entries(obj)) {
        if (Number.isNaN(value) || value === undefined) {
            return key;
        }

        if (isStrict && !value) {
            return key;
        }
    }
}

function minutesToSummary(minutes) {
    minutes = Number(minutes);

    const cascade = (inMinutes) => {
        const val = Math.floor(minutes / inMinutes);

        minutes = minutes % inMinutes;

        return val;
    };

    const weeks = cascade(2400);
    const days = cascade(480);
    const hours = cascade(60);

    const result = {
        w: weeks,
        d: days,
        h: hours,
        m: minutes,
    };

    let str = "";
    for (const [letter, amount] of Object.entries(result)) {
        if (amount) str += `${amount}${letter} `;
    }

    return str;
}

/* function L(str, mode, modeCount) {
    str = str.trim();
    const words = str.split(" ");

    const MODES = {
        U: (key) => key.toUpperCase(),
        l: (key) => key,
        C: (key) => key[0].toUpperCase() + key.slice(1),
    };

    words.forEach((word, i) => {
        let trans = TRANS[word];

        if (trans) {
            if (mode && (!modeCount || modeCount > i)) {
                trans = MODES[mode](trans);
            }

            str = str.replace(word, trans);
        }
    });

    return str;
} */

function refreshWithNewSearch(key, value) {
    if (!value) SEARCH.delete(key);
    else SEARCH.set(key, value);

    let searchParams = SEARCH + "";

    if (searchParams) searchParams = `?${searchParams}`;

    const url = `${window.location.pathname}${searchParams}`;

    window.location.href = url;
}

function calcHeight(value) {
    let numberOfLineBreaks = (value.match(/\n/g) || []).length;
    // min-height + lines x line-height + padding + border
    let newHeight = 20 + numberOfLineBreaks * 20 + 12 + 2;
    return newHeight;
}

function getParent(el, count) {
    let target = el;

    while (count--) {
        if (!target.parentElement) break;

        target = target.parentElement;
    }

    return target;
}

/**
 *
 * @param {string | HTMLElement} el
 * @param {string} storageKey
 * @param {HTMLButtonElement} button
 */
function createElementHideButton(el, storageKey, button) {
    if (typeof el === "string") {
        el = qStrict(el);
    }

    if (localStorage.getItem(storageKey) === "1") {
        el.classList.add("d-none");
        button.textContent = "Show";
    }

    const fn = (_e) => {
        const isHidden = el.classList.contains("d-none");

        if (isHidden) {
            el.classList.remove("d-none");
            button.textContent = "Hide";
        } else {
            el.classList.add("d-none");
            button.textContent = "Show";
        }

        localStorage.setItem(storageKey, isHidden ? "0" : "1");
    };

    button.onclick = fn;

    return fn;
}

function getLuminance(hex) {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) {
        hex = hex
            .split("")
            .map((x) => x + x)
            .join("");
    }
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance;
}

function getButtonStyleColors(hex) {
    const isWhite = getLuminance(hex) < 0.5;

    const textColor = isWhite ? "#e0e0e0" : "#1e1e1e";

    return { backgroundColor: hex, color: textColor };
}

function getButtonStyleColorsText(hex) {
    const { backgroundColor, color } = getButtonStyleColors(hex);

    return `background-color: ${backgroundColor}; color: ${color}`;
}

/**
 *
 * @param {HTMLButtonElement} button
 * @param {string} hex
 */
function setButtonColor(button, hex) {
    for (const [key, value] of Object.entries(getButtonStyleColors(hex))) {
        button.style[key] = value;
    }

    return button;
}

const getTimeFromDate = (date) => date.slice(11, 16);

const sorters = {
    alphabetAscByName: (a, b) => (a.name > b.name ? 1 : -1),
};
