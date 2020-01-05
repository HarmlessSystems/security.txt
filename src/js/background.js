/* globals i18n */

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

  const finalResults = {
    now: Date.now(),
    host: tabURL.host,
    security: false,
    humans: false
  };

  let humansTxtCheck = true;

  fetch(`${host}/.well-known/security.txt`).then((result) => {

    console.log('/.well-known/security.txt', result.status,
      result.headers.get('Content-Type'));

    if (!result.ok || !isPlainText(result)) {

      return fetch(`${host}/security.txt`).then((result) => {

        console.log('/security.txt', result.status,
          result.headers.get('Content-Type'));

        if (result.ok && isPlainText(result)) {
          result.text().then((text) => {
            finalResults.security = {
              path: `${host}/security.txt`,
              text
            };
          });
        }
      }, fetchError);
    }

    return result.text().then((text) => {
      finalResults.security = {
        path: `${host}/.well-known/security.txt`,
        text
      };
    });

  }, fetchError).finally(() => {

    browser.storage.local.get('check_humanstxt').then((result) => {

      if (result && result.hasOwnProperty('check_humanstxt') && result.check_humanstxt === 'OFF') {
        humansTxtCheck = false;
        return console.log('humans.txt check disabled');
      }

      return fetch(`${host}/humans.txt`).then((result) => {

        console.log('/humans.txt', result.status,
          result.headers.get('Content-Type'));

        if (result.ok && isPlainText(result)) {
          return result.text().then((text) => {
            finalResults.humans = {
              path: `${host}/humans.txt`,
              text
            };
          });
        }
      }, fetchError);

    }, fetchError).finally(() => {
      console.log('finalResults', finalResults);

      let title = i18n((humansTxtCheck) ?
        'found_nothing' : 'not_found_security_txt');

      if (finalResults.security && !finalResults.humans) {
        title = i18n('found_security_txt');
      } else if (!finalResults.security && finalResults.humans) {
        title = i18n('found_humans_txt');
      } else if (finalResults.security && finalResults.humans) {
        title = i18n('found_security_and_humans_txt');
      }
      
      // XXX Need to change icons for Chrome/Edge bug with pageAction.hide()
      // interesting enough, the bug doesn't impact Opera
      if (finalResults.security || finalResults.humans) {
        localStorage.setItem(finalResults.host, JSON.stringify(finalResults));
        browser.pageAction.show(tabId);
        browser.pageAction.setPopup({
          tabId: tabId,
          popup: 'popup.html#' + finalResults.host
        });
      } else {
        localStorage.removeItem(finalResults.host);
        browser.pageAction.hide(tabId);
        browser.pageAction.setPopup({
          tabId: tabId,
          // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/pageAction/setPopup
          // If an empty string ("") is passed here, the popup is disabled, and 
          // the extension will receive pageAction.onClicked events.
          popup: ''
        });
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

  // process each existing tab that's open when the extension is installed
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