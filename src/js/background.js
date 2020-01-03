const httpRegExp = new RegExp('^http');

function isPlainText(result) {
  if (typeof result.headers.get('Content-Type') === 'string') {
    return result.headers.get('Content-Type').indexOf('text/plain') !== -1;
  }
  return false;
}

function fetchError(error) {
  console.log('fetch() error:', error);
}

function tabsOnUpdated(tabId, changeInfo, tab) {
  if (changeInfo.url && httpRegExp.test(changeInfo.url)) {

    const tabURL = new URL(tab.url);
    const host = `${tabURL.protocol}//${tabURL.host}`;

    fetch(`${host}/.well-known/security.txt`).then((result) => {

      console.log('/.well-known/security.txt', result.status, result.headers.get('Content-Type'));

      if (!result.ok || !isPlainText(result)) {

        return fetch(`${host}/security.txt`).then((result) => {

          console.log('/security.txt', result.status, result.headers.get('Content-Type'));

          if (!result.ok || !isPlainText(result)) {
            return console.log({
              type: 'security.txt',
              found: false
            });
          }

          result.text().then((text) => {
            console.log({
              type: 'security.txt',
              path: `${host}/security.txt`,
              found: true,
              content: text
            });
          });

        }, fetchError);
      }

      result.text().then((text) => {
        console.log({
          type: 'security.txt',
          path: `${host}/.well-known/security.txt`,
          found: true,
          content: text
        });
      });

    }, fetchError);

    browser.storage.local.get('check_humanstxt').then((result) => {
      if (result && result.hasOwnProperty('check_humanstxt') && result.check_humanstxt === 'OFF') {
        console.log('humans.txt check disabled');
        return;
      }

      fetch(`${host}/humans.txt`).then((result) => {

        console.log('/humans.txt', result.status, result.headers.get('Content-Type'));

        if (!result.ok || !isPlainText(result)) {
          return console.log({
            type: 'humans.txt',
            found: false
          });
        }

        result.text().then((text) => {
          console.log({
            type: 'humans.txt',
            path: `${host}/humans.txt`,
            found: true,
            content: text
          });
        });

      }, fetchError);
    }, (error) => {
      console.error('ERROR: browser.storage.local.get(check_humanstxt)', error);
    });
  }
}

function runtimeOnInstalled(details) {
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