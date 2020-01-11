/* globals i18n, i18nHydrate, URLSearchParams */

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(new URL(window.location).search);

  const securityTxt = document.querySelector('#securityTxt > textarea');
  const securityTab = document.querySelector('#securityTabLabel');
  const securityInput = document.querySelector('#securityTab');

  const humansTxt = document.querySelector('#humansTxt > textarea');
  const humansTab = document.querySelector('#humansTabLabel');
  const humansInput = document.querySelector('#humansTab');

  const clipboardSecurity = document.querySelector('#securityTxt button');
  const clipboardHumans = document.querySelector('#humansTxt button');
  const msgTimeout = 3000;


  if (params.get('security')) {
    fetch(params.get('security')).then((result) => {
      result.text().then((text) => {
        securityTxt.value = text;
        securityTab.title = params.get('security');
      });
    });
  } else {
    securityTab.style.display = 'none';
  }

  if (params.get('humans')) {
    fetch(params.get('humans')).then((result) => {
      result.text().then((text) => {
        humansTxt.value = text;
        humansTab.title = params.get('humans');
        if (!params.get('security')) {
          securityInput.checked = false;
          humansInput.checked = true;
        }
      });
    });
  } else {
    humansTab.style.display = 'none';
  }

  i18nHydrate();

  clipboardSecurity.addEventListener('click', () => {
    securityTxt.select();
    document.execCommand('copy');
    clipboardSecurity.innerText = i18n('copied_security_to_clipboard');
    clipboardSecurity.disabled = true;
    setTimeout(() => {
      clipboardSecurity.innerText = i18n('copy_security_clipboard');
      clipboardSecurity.disabled = false;
    }, msgTimeout);
  });

  clipboardHumans.addEventListener('click', () => {
    humansTxt.select();
    document.execCommand('copy');
    clipboardHumans.innerText = i18n('copied_humans_to_clipboard');
    clipboardHumans.disabled = true;
    setTimeout(() => {
      clipboardHumans.innerText = i18n('copy_humans_clipboard');
      clipboardHumans.disabled = false;
    }, msgTimeout);
  });

});