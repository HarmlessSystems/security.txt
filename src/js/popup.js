/* globals i18n, i18nHydrate */

window.addEventListener('DOMContentLoaded', () => {
  const host = document.location.hash.replace('#', '');

  const securityTxt = document.querySelector('#securityTxt > textarea');
  const securityTab = document.querySelector('#securityTabLabel');
  const securityInput = document.querySelector('#securityTab');

  const humansTxt = document.querySelector('#humansTxt > textarea');
  const humansTab = document.querySelector('#humansTabLabel');
  const humansInput = document.querySelector('#humansTab');

  const clipboardSecurity = document.querySelector('#securityTxt button');
  const clipboardHumans = document.querySelector('#humansTxt button');
  const msgTimeout = 3000;

  let hostJSON = localStorage.getItem(host);
  let hostData;

  i18nHydrate();

  if (hostJSON) {
    try {
      hostData = JSON.parse(hostJSON);
    } catch (e) {
      console.error(host, hostJSON, e);
      return;
    }
  }

  if (hostData.security) {
    securityTxt.value = hostData.security.text;
  } else {
    securityTab.style.display = 'none';
  }

  if (hostData.humans) {
    humansTxt.value = hostData.humans.text;
  } else {
    humansTab.style.display = 'none';
  }

  if (hostData.humans && !hostData.security) {
    securityInput.checked = false;
    humansInput.checked = true;
  }

  clipboardSecurity.addEventListener('click', () => {
    securityTxt.select();
    document.execCommand('copy');
    clipboardSecurity.innerText = i18n('copied_security_to_clipboard');
    setTimeout(() => {
      clipboardSecurity.innerText = i18n('copy_security_clipboard');
    }, msgTimeout);
  });

  clipboardHumans.addEventListener('click', () => {
    humansTxt.select();
    document.execCommand('copy');
    clipboardHumans.innerText = i18n('copied_humans_to_clipboard');
    setTimeout(() => {
      clipboardHumans.innerText = i18n('copy_humans_clipboard');
    }, msgTimeout);
  });

});