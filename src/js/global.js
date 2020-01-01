const defaultOptions = {
  display_mode: 'INLINE',
  check_humanstxt: 'ON',
  color_theme: 'AUTO',
  host_cache_ttl: '24H'
};

/* jshint unused: false */
function getOption(option) {
  const result = localStorage.getItem(option);
  if (result !== null) {
    return result;
  }
  return defaultOptions[option];
}

function i18n(msg) {
  return ((window.chrome && typeof window.chrome.i18n === 'object') ?
      chrome.i18n.getMessage(msg) : msg) || msg;
}

const i18nTag = {
  generic: (element) => {
    let content;
    if (element.dataset.i18n) {
      content = i18n(element.dataset.i18n);
    } else if (element.id) {
      content = i18n(element.id);
    }
    if (content) {
      element.textContent = content;
    }
  },
  LABEL: (element) => {
    if (element.attributes.for) {
      const content = i18n(element.attributes.for.value);
      if (content) {
        element.textContent = content;
      }
    } else {
      i18nTag.generic(element);
    }
  },
  SELECT: (element) => {
    if (!element.id || !element.options.length) {
      return;
    }
    for (let i = 0; i < element.options.length; i++) {
      element.options[i].textContent = i18n(element.id + '_' + element.options[i].value);
    }
  }
};

function i18nHydrate() {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    if (i18nTag[element.tagName]) {
      i18nTag[element.tagName](element);
    } else {
      i18nTag.generic(element);
    }
  });
  document.querySelectorAll('.current-year').forEach((element) => {
    element.innerText = (new Date()).getFullYear();
  });
}