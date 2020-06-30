/* globals i18nHydrate, defaultOptions, BROWSER_QUIRKS, confirm, i18n */

function storageLocalSet() {
  console.log('storageLocalSet OK');
}

function storageLocalSetError(error) {
  console.error('storageLocalSetError', error);
}

function storageLocalGetError(error) {
  console.error('storageLocalGetError', error);
}

window.addEventListener('DOMContentLoaded', () => {
  i18nHydrate();

  document.querySelectorAll('select,textarea').forEach((element) => {
    browser.storage.local.get(element.id).then((result) => {
      if (result && result.hasOwnProperty(element.id)) {
        element.value = result[element.id];
      } else {
        element.value = defaultOptions[element.id];
      }
      element.addEventListener('change', (event) => {
        const pref = {};
        pref[event.target.id] = event.target.value;
        console.log(`Setting '${event.target.id}' to new value of: ` + 
          event.target.value);
        browser.storage.local.set(pref).then(storageLocalSet,
          storageLocalSetError);
        document.getElementById('saved').style.opacity = 1;
        setTimeout(() => {
          document.getElementById('saved').style.opacity = 0;
        }, 3500);
      });
    }, storageLocalGetError);
  });

  document.getElementById('reset').addEventListener('click', () => {
    // On Chrome and Edge, when viewing the options in the embedded
    // view, confirm() will always, silently return false. This is
    // difficult to test as viewing the options page in a tab works
    // without issue, so foregoing the user warning on those browsers.
    if (BROWSER_QUIRKS === 'firefox') {
      const answer = confirm(i18n('reset_default'));
      if (!answer) {
        return;
      }
    }

    document.querySelectorAll('select,textarea').forEach((element) => {
      const pref = {};
      element.value = defaultOptions[element.id];
      pref[element.id] = element.value;
      console.log(`Setting '${element.id}' to default value of: ` +
        element.value);
      browser.storage.local.set(pref).then(storageLocalSet, storageLocalSetError);
    });
  });

  document.getElementById('save').addEventListener('click', () => {
    document.querySelectorAll('select,textarea').forEach((element) => {
      const pref = {};
      pref[element.id] = element.value;
      console.log(`Setting '${element.id}' to new value of: ` +
        element.value);
      browser.storage.local.set(pref).then(storageLocalSet,
        storageLocalSetError);
      document.getElementById('saved').style.opacity = 1;
      setTimeout(() => {
        document.getElementById('saved').style.opacity = 0;
      }, 3500);
    }, storageLocalGetError);
  });
});
