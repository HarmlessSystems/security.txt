# security.txt

Cross-platform browser extension for discovering security.txt and humans.txt files.

As you browse the web, this extension will check for a [security.txt](https://tools.ietf.org/html/draft-foudil-securitytxt-08) 
and [humans.txt](http://humanstxt.org) file on each site you visit. If either file exists, an icon (:information_source:) 
will be displayed which you can click to view the files.

## Install

- [Firefox Add-ons](https://addons.mozilla.org/addon/security-txt/)
- [Chrome Web Store](https://chrome.google.com/webstore/detail/securitytxt/enhcidlgmnmolephljjhbgfnjlfjnimd)
- [Edge Addons](https://microsoftedge.microsoft.com/addons/detail/hfhegbhdofjdepaelheapbihjlhkaofj)
- [Opera Addons (⏳ pending moderation approval)](https://addons.opera.com/en/extensions/details/securitytxt/)

## Building

``yarn && yarn build``

Each supported browser has a subdirectory within the `build` directory.

## [License](LICENSE)

This project is licensed under the [BSD-2-Clause](https://opensource.org/licenses/BSD-2-Clause) license except where otherwise noted in the source files.

- [awsm.css](https://github.com/igoradamenko/awsm.css) is under the [MIT](https://opensource.org/licenses/MIT) license.
- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) is under the [MPL-2.0](https://opensource.org/licenses/MPL-2.0) license.
- [minimatch](https://github.com/isaacs/minimatch) is under the [ISC](https://opensource.org/licenses/ISC) license.
- [async](https://github.com/caolan/async) is under the [MIT](https://github.com/caolan/async/blob/master/LICENSE) license.

See the [package.json](package.json) file for node modules used for building the project.
