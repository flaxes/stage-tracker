const BACKEND_PREFIX = "/api";
const SEARCH = new URL(document.location).searchParams;
const DATE_ISO_FORMAT = "yyyy-MM-DD";
const TIME_FORMAT = "HH:mm";

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

        /** @type {RequestInit} */
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
    dom.onclick = async (e) => {
        const entities = await requestCached(apiPath, "GET");
        const lastSel = dom.options[dom.selectedIndex];

        while (dom.options.length) {
            dom.options.remove(0);
        }

        if (lastSel) {
            lastSel.hidden = true;
            dom.appendChild(lastSel);
        }

        const arr = Object.values(entities);

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
    };
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
 * @param {new () => T} [type]
 * @returns {T}
 */
function qStrict(selector, fromEl = document, type = HTMLElement) {
    const el = fromEl.querySelector(selector);

    if (!el) throw new Error(`${selector} not found`);

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
        if (value === NaN || value === undefined) {
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

function L(str, mode, modeCount) {
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
}

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

const getTimeFromDate = (date) => date.slice(11, 16);

const sorters = {
    alphabetAscByName: (a, b) => (a.name > b.name ? 1 : -1),
};
