/* globals i18n, BROWSER_QUIRKS */

const httpRegExp = new RegExp('^http');

function isPlainText(result) {
  if (typeof result.headers.get('Content-Type') === 'string') {
    return result.headers.get('Content-Type').indexOf('text/plain') !== -1;
  }
  return false;
}

function fetchError(error) {
  console.log('fetch() fail:', error);
}

function fetchFiles(tabId, tab) {
  const tabURL = new URL(tab.url);
  const host = `${tabURL.protocol}//${tabURL.host}`;
  const fetchOptions = {method: 'HEAD'};

  const finalResults = {
    security: '',
    humans: ''
  };

  let humansTxtCheck = true;

  fetch(`${host}/.well-known/security.txt`, fetchOptions).then((result) => {

    console.log(`${host}/.well-known/security.txt`, result.status,
      result.headers.get('Content-Type'));

    if (!result.ok || !isPlainText(result)) {

      return fetch(`${host}/security.txt`, fetchOptions).then((result) => {

        console.log(`${host}/security.txt`, result.status,
          result.headers.get('Content-Type'));

        if (result.ok && isPlainText(result)) {
          finalResults.security = `${host}/security.txt`;
        }
      }, fetchError);
    }

    finalResults.security =`${host}/.well-known/security.txt`;

  }, fetchError).finally(() => {

    browser.storage.local.get('check_humanstxt').then((result) => {

      if (result && result.hasOwnProperty('check_humanstxt') && result.check_humanstxt === 'OFF') {
        humansTxtCheck = false;
        return console.log('humans.txt check disabled');
      }

      // XXX I've encountered at least one site (netflix.com) where a HEAD 
      // doesn't work on a humans.txt file (403 response). While odd, in all 
      // fairness, the "humans.txt" files is inteded for "humans" who wouldn't
      // be making HEAD requests but rather navigating to the URL manually...
      return fetch(`${host}/humans.txt`/*, fetchOptions*/).then((result) => {

        console.log(`${host}/humans.txt`, result.status,
          result.headers.get('Content-Type'));

        if (result.ok && isPlainText(result)) {
          finalResults.humans = `${host}/humans.txt`;
        }
      }, fetchError);

    }, fetchError).finally(() => {

      let title = i18n((humansTxtCheck) ?
        'found_nothing' : 'not_found_security_txt');

      if (finalResults.security && !finalResults.humans) {
        title = i18n('found_security_txt');
      } else if (!finalResults.security && finalResults.humans) {
        title = i18n('found_humans_txt');
      } else if (finalResults.security && finalResults.humans) {
        title = i18n('found_security_and_humans_txt');
      }

      // Mote that we need to change icons for Chrome/Edge bug with pageAction.hide()
      // interesting enough, the bug doesn't impact Opera
      if (finalResults.security || finalResults.humans) {
        localStorage.setItem(finalResults.host, JSON.stringify(finalResults));
        browser.pageAction.show(tabId);
        browser.pageAction.setPopup({
          tabId: tabId,
          popup: `popup.html?security=${finalResults.security}` +
            `&humans=${finalResults.humans}`
        });

        if (BROWSER_QUIRKS === 'chrome' || BROWSER_QUIRKS === 'edge') {
          browser.pageAction.setIcon({
            tabId: tabId,
            path: {
              '16': 'img/info.16.png',
              '19': 'img/info.19.png',
              '24': 'img/info.24.png',
              '32': 'img/info.32.png',
              '48': 'img/info.48.png',
              '96': 'img/info.96.png'
            }
          });
        }
      } else {
        browser.pageAction.hide(tabId);
        browser.pageAction.setPopup({
          tabId: tabId,
          // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/pageAction/setPopup
          // If an empty string ("") is passed here, the popup is disabled, and 
          // the extension will receive pageAction.onClicked events.
          popup: ''
        });

        if (BROWSER_QUIRKS === 'chrome' || BROWSER_QUIRKS === 'edge') {
          browser.pageAction.setIcon({
            tabId: tabId,
            path: {
              '16': 'img/info.inactive.16.png',
              '19': 'img/info.inactive.19.png',
              '24': 'img/info.inactive.24.png',
              '32': 'img/info.inactive.32.png',
              '48': 'img/info.inactive.48.png',
              '96': 'img/info.inactive.96.png'
            }
          });
        }
      }

      browser.pageAction.setTitle({
        tabId,
        title
      });
    });
  });
}

function tabsOnUpdated(tabId, changeInfo, tab) {
  if (changeInfo.url && httpRegExp.test(changeInfo.url)) {
    fetchFiles(tabId, tab);
  }
}

function runtimeOnInstalled(details) {

  // Process each existing tab that's open when the extension is installed
  browser.tabs.query({}).then((tabs) => {
    tabs.forEach((tab) => {
      if (httpRegExp.test(tab.url)) {
        fetchFiles(tab.id, {url: tab.url});
      }
    });
  });

  switch (details.reason) {
    case 'install': 
      browser.tabs.create({
        url: browser.runtime.getURL('install.html')
      });
    break;
    case 'update':
      browser.tabs.create({
        url: browser.runtime.getURL('release.html')
      });
    break;
    default:
      console.log('browser.runtime.onInstalled', details);
    break;
  }
}

try {
  browser.tabs.onUpdated.addListener(tabsOnUpdated, {
    urls: ['http://*/*', 'https://*/*'],
    properties: ['status']
  });
} catch (e) {
  // Chrome/Opera/Edge doesn't support filters on tabs.onUpdated
  console.log('Handled error:', e);
  browser.tabs.onUpdated.addListener(tabsOnUpdated);
}

browser.runtime.onInstalled.addListener(runtimeOnInstalled);