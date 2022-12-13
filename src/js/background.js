/* globals i18n, minimatch, async, defaultOptions */

const httpRegExp = new RegExp('^http');
const matchOptions = {noext: true, nocase: true, dot: true};

// Set pageAction badge details
function setBadge(tabId, title, icon, action, popup) {
  browser.pageAction[action](tabId);

  browser.pageAction.setPopup({
    tabId,
    popup
  });

  browser.pageAction.setIcon({
    tabId,
    path: {
      '16': `img/${icon}.16.png`,
      '19': `img/${icon}.19.png`,
      '24': `img/${icon}.24.png`,
      '32': `img/${icon}.32.png`,
      '48': `img/${icon}.48.png`,
      '96': `img/${icon}.96.png`
    }
  });

  browser.pageAction.setTitle({
    tabId,
    title
  });
}

// Show/Hide pageAction badge and set title
function renderBadgeIcon(context, next) {
  const {tabId} = context;
  const {security, humans} = context.files;
  const {checkHumansTxt} = context.preferences;

  let title = i18n(checkHumansTxt ? 'found_nothing' : 'not_found_security_txt');
  let params;

  if (security && !humans) {
    title = i18n('found_security_txt');
    params = `?security=${security}`;
  } else if (!security && humans) {
    title = i18n('found_humans_txt');
    params = `?humans=${humans}`;
  } else if (security && humans) {
    title = i18n('found_security_and_humans_txt');
    params = `?security=${security}&humans=${humans}`;
  }

  if (security || humans) {
    setBadge(tabId, title, 'info', 'show', `popup.html${params}`);
  } else {
    setBadge(tabId, title, 'info.inactive', 'hide', '');
  }

  next(null, context);
}

// The server result is ok and plain text
function isPlainText(result) {
  if (!result || !result.ok) {
    return false;
  }
  if (result.status < 200 || result.status >= 400) {
    return false;
  }
  if (typeof result.headers.get('Content-Type') === 'string') {
    return result.headers.get('Content-Type').indexOf('text/plain') !== -1;
  }
  return false;
}

// Attempt to fetch desired files from a host
function fetchFilesFromHost(context, next) {
  const {host, protocol, options} = context;
  async.parallel({
    security: (done) => {
      async.tryEach([
        (complete) => {
          const url = `${protocol}//${host}/.well-known/security.txt`;
          fetch(url, options).then((result) => {
            complete(null, isPlainText(result) ? url : false);
          }, complete);
        },
        (complete) => {
          const url = `${protocol}//${host}/security.txt`;
          fetch(url, options).then((result) => {
            complete(null, isPlainText(result) ? url : false);
          }, complete);
        }
      ], (error, result) => {
        done(null, result);
      });
    },
    humans: (complete) => {
      if (!context.preferences.checkHumansTxt) {
        return complete(null, false);
      }
      // XXX I've encountered at least one site (netflix.com) where a HEAD 
      // doesn't work on a humans.txt file (403 response). While odd, in all 
      // fairness, the "humans.txt" files is intended for "humans" who wouldn't
      // be making HEAD requests but rather navigating to the URL manually.
      const url = `${protocol}//${host}/humans.txt`;
      fetch(url).then((result) => {
        complete(null, isPlainText(result) ? url : false);
      }, complete);
    }
  }, (error, files) => {
    context.files = files;
    next(null, context);
  });
}

// Check if host is blacklisted
function checkHostBlacklist(context, next) {
  const list = context.preferences.hostBlacklist;
  for (const index in list) {
    const host = list[index];
    if (minimatch(`${context.protocol}//${context.host}`, host, matchOptions)) {
      return next({graceful: 'blacklisted'});
    }
  }
  next(null, context);
}

// Get preferences from browser.storage.local
function getPreferences(context, next) {
  async.parallel({
      checkHumansTxt: (done) => {
        let check = true;
        browser.storage.local.get('check_humanstxt').then((result) => {
          if (result && result.hasOwnProperty('check_humanstxt') && 
              result.check_humanstxt === 'OFF') {
            check = false;
          }
          done(null, check);
        }).catch(done);
      },
      hostBlacklist: (done) => {
        let list = defaultOptions.host_blacklist;
        browser.storage.local.get('host_blacklist').then((result) => {
          if (result && result.hasOwnProperty('host_blacklist')) {
            list = result.host_blacklist;
          }
          list = list.split('\n').map(host => host.trim()).filter(v => v);
          done(null, list);
        }).catch(done);
      }
  }, (error, preferences) => {
     context.preferences = preferences;
     next(error, context);
  });
}

// Process a tab and it's current host
function processTab(tabId, tab) {
  async.waterfall([
    (next) => {
      const {host, protocol} = new URL(tab.url);
      next(null, {
        tabId,
        tab,
        host,
        protocol,
        fetchOptions: {
          method: 'HEAD',
          credentials: 'omit'
        }
      });
    },
    getPreferences,
    checkHostBlacklist,
    fetchFilesFromHost,
    renderBadgeIcon,
    (context, next) => {
      next(null, context);
    }
  ], (error) => {
    if (error && !error.graceful) {
      console.error(error);
    }
    if (error && error.graceful === 'blacklisted') {
      setBadge(tabId, i18n('found_blacklist'), 'info.inverse', 'show', 'options.html');
    }
  });
}

// Proceess a tab when the URL changes
function tabsOnUpdated(tabId, changeInfo, tab) {
  if (changeInfo.url && httpRegExp.test(changeInfo.url)) {
    processTab(tabId, tab);
  }
}

// Process each existing tab that's open when the extension is installed
function runtimeOnInstalled(details) {
  const manifest = browser.runtime.getManifest();
  browser.tabs.query({}).then((tabs) => {
    tabs.forEach((tab) => {
      if (httpRegExp.test(tab.url)) {
        processTab(tab.id, {url: tab.url});
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
        url: browser.runtime.getURL(`release-v${manifest.version}.html`)
      });
    break;
    default:
      console.warn('browser.runtime.onInstalled', details);
    break;
  }
}

// background.js entrypoint
(function main() {
  try {
    browser.tabs.onUpdated.addListener(tabsOnUpdated, {
      urls: ['http://*/*', 'https://*/*'],
      properties: ['url']
    });
  } catch (e) {
    // Chrome/Opera/Edge do not support filters on tabs.onUpdated
    console.log('Handled error:', e);
    browser.tabs.onUpdated.addListener(tabsOnUpdated);
  }
  browser.runtime.onInstalled.addListener(runtimeOnInstalled);
}());
