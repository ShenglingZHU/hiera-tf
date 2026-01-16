// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
(() => {
  const DEFAULT_LANG = "en";
  const STORAGE_KEY = "htf-lang";
  const dataEl = document.getElementById("i18n-data");
  let translations = {};

  if (dataEl) {
    try {
      translations = JSON.parse(dataEl.textContent || "{}") || {};
    } catch (err) {
      console.warn("Failed to parse i18n data.", err);
    }
  }

  const i18n = {
    lang: DEFAULT_LANG,
    data: translations,
    t(key, vars = {}) {
      if (!key) {
        return "";
      }
      const table = translations[i18n.lang] || {};
      const fallback = translations[DEFAULT_LANG] || {};
      let value = table[key];
      if (value == null) {
        value = fallback[key];
      }
      if (value == null) {
        return key;
      }
      if (typeof value !== "string") {
        return String(value);
      }
      return value.replace(/\{(\w+)\}/g, (match, name) => {
        if (Object.prototype.hasOwnProperty.call(vars, name)) {
          return String(vars[name]);
        }
        return "";
      });
    },
  };

  function applyI18n(root = document) {
    const nodes = root.querySelectorAll("[data-i18n]");
    nodes.forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (!key) {
        return;
      }
      const value = i18n.t(key);
      if (value === key) {
        return;
      }
      const attrs = node.getAttribute("data-i18n-attr");
      if (attrs) {
        attrs
          .split(",")
          .map((attr) => attr.trim())
          .filter(Boolean)
          .forEach((attr) => node.setAttribute(attr, value));
        return;
      }
      node.textContent = value;
    });
  }

  function updateLangClass(lang) {
    if (document.documentElement) {
      document.documentElement.lang = lang;
    }
    if (!document.body) {
      return;
    }
    document.body.classList.forEach((cls) => {
      if (cls.startsWith("lang-")) {
        document.body.classList.remove(cls);
      }
    });
    document.body.classList.add(`lang-${lang}`);
  }

  function syncLangSwitch(lang) {
    const options = document.querySelectorAll(".lang-option[data-lang]");
    options.forEach((option) => {
      const isActive = option.dataset.lang === lang;
      option.classList.toggle("is-active", isActive);
      if (isActive) {
        option.setAttribute("aria-current", "true");
      } else {
        option.removeAttribute("aria-current");
      }
    });
  }

  function setLang(nextLang, options = {}) {
    const lang = translations[nextLang] ? nextLang : DEFAULT_LANG;
    i18n.lang = lang;
    updateLangClass(lang);
    syncLangSwitch(lang);
    applyI18n();
    if (options.persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (err) {
        // Ignore storage failures.
      }
    }
    window.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang } }));
  }

  function getInitialLang() {
    let stored = "";
    try {
      stored = localStorage.getItem(STORAGE_KEY) || "";
    } catch (err) {
      stored = "";
    }
    if (stored && translations[stored]) {
      return stored;
    }
    return DEFAULT_LANG;
  }

  function handleLangInteraction(event) {
    const option = event.target.closest(".lang-option[data-lang]");
    if (!option) {
      return;
    }
    const lang = option.dataset.lang;
    if (!lang || lang === i18n.lang) {
      return;
    }
    setLang(lang);
  }

  document.addEventListener("click", handleLangInteraction);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const option = event.target.closest(".lang-option[data-lang]");
    if (!option) {
      return;
    }
    event.preventDefault();
    handleLangInteraction(event);
  });

  i18n.setLang = setLang;
  i18n.getLang = () => i18n.lang;
  i18n.apply = () => applyI18n();
  window.i18n = i18n;

  const init = () => {
    setLang(getInitialLang(), { persist: false });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
