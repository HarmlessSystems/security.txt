browser.runtime.onInstalled.addListener((details) => {
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
});