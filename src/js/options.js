/* globals i18nHydrate, defaultOptions */

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

  document.querySelectorAll('select').forEach((element) => {
    browser.storage.local.get(element.id).then((result) => {
      if (result && result.hasOwnProperty(element.id)) {
        element.value = result[element.id];
      }
      element.addEventListener('change', (event) => {
        const pref = {};
        pref[event.target.id] = event.target.value;
        console.log(`Setting '${event.target.id}' to new value of '${event.target.value}'`);
        browser.storage.local.set(pref).then(storageLocalSet, storageLocalSetError);
      });
    }, storageLocalGetError);
  });

});

document.querySelector('button').addEventListener('click', () => {
  document.querySelectorAll('select').forEach((element) => {
    const pref = {};
    element.value = defaultOptions[element.id];
    pref[element.id] = element.value;
    console.log(`Setting '${element.id}' to default value of '${element.value}'`);
    browser.storage.local.set(pref).then(storageLocalSet, storageLocalSetError);
  });
});