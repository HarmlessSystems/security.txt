// Loads either the dark or light awsm theme based on the browser's color scheme
// preference (e.g. "Dark" or "Light" mode)
const colorScheme = '(prefers-color-scheme: dark)';
const themeCss = document.createElement('link');
themeCss.id = 'theme';
themeCss.rel = 'stylesheet';
themeCss.href = 'css/awsm.css';

if (window.matchMedia && window.matchMedia(colorScheme).matches) {
  themeCss.href = 'css/awsm.dark.css';
}

document.head.append(themeCss);

window.matchMedia(colorScheme).addEventListener('change', (event) => {
  if (event.matches) {
    themeCss.href = 'css/awsm.dark.css';
  } else {
    themeCss.href = 'css/awsm.css';
  }
});