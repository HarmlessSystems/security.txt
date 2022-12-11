'use strict';

const browsers = ['firefox', 'chrome', 'edge'];

module.exports = function(grunt) {
 
  require('load-grunt-tasks')(grunt);

  const packageJSON = grunt.file.readJSON('package.json');

  grunt.initConfig({
    package: packageJSON,
    manifest: grunt.file.readJSON('src/manifest.json'),
    browsers: browsers,
    mkdir: {
      all: {
        options: {
          create: browsers.map(browser => `build/${browser}`)
        }
      }
    },
    clean: {
      all: ['build']
    },
    copy: {
      src: {
        files: browsers.map((browser) => {
          return {
            expand: true,
            cwd: 'src/',
            src: ['**', '!manifest*json'],
            dest: `build/${browser}`
          };
        })
      },
      misc: {
        files: browsers.map((browser) => {
          return {
            expand: true,
            cwd: '.',
            src: ['security.txt', 'LICENSE'],
            dest: `build/${browser}`
          };
        })
      },
      polyfill: {
        files: browsers.map((browser) => {
          return {
            src: 'node_modules/webextension-polyfill/dist/browser-polyfill.js',
            dest: `build/${browser}/js/browser-polyfill.js`
          };
        })
      },
      polyfillMap: {
        files: browsers.map((browser) => {
          return {
            src: 'node_modules/webextension-polyfill/dist/browser-polyfill.js.map',
            dest: `build/${browser}/js/browser-polyfill.js.map`
          };
        })
      },
      async: {
        files: browsers.map((browser) => {
          return {
            src: 'node_modules/async/dist/async.js',
            dest: `build/${browser}/js/async.js`
          };
        })
      },

    },
    jshint: {
      extension: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: [
          'src/js/**.js'
        ]
      },
      node: {
        options: {
          jshintrc: '.jshintrc.node'
        },
        src: ['Gruntfile.js']
      },
    },
    compress: {
      firefox: {
        options: {
          archive: `build/release/${packageJSON.name}-${packageJSON.version}-firefox.zip`
        },
        files: [{
          expand: true,
          cwd: 'build/firefox',
          src: ['**'],
          dest: '/'
        }]
      },
      chrome: {
        options: {
          archive: `build/release/${packageJSON.name}-${packageJSON.version}-chrome.zip`
        },
        files: [{
          expand: true,
          cwd: 'build/chrome',
          src: ['**'],
          dest: '/'
        }]
      },
      edge: {
        options: {
          archive: `build/release/${packageJSON.name}-${packageJSON.version}-edge.zip`
        },
        files: [{
          expand: true,
          cwd: 'build/edge',
          src: ['**'],
          dest: '/'
        }]
      }
    },
    browserify: {
      minimatch: {
        options: {
          banner: "// browserify'd build of https://github.com/isaacs/minimatch",
          browserifyOptions: {
            standalone: 'minimatch'
          }
        },
        files: browsers.map((browser) => {
          return {
            src: 'node_modules/minimatch/minimatch.js',
            dest: `build/${browser}/js/minimatch.js`
          };
        })
      }
    }
  });

  grunt.registerTask('manifests', 'Combine manifest.json files', () => {
    const {merge} = require('lodash/object');
    function rmNotes(obj) {
      const notesRegExp = new RegExp('^_notes_');
      Object.keys(obj).forEach((key) => {
        if (notesRegExp.test(key)) {
          delete obj[key];
        }
      });
    }

    const pkg = grunt.config.get('package');
    const manifest = grunt.config.get('manifest');

    manifest.name = pkg.name;
    manifest.version = pkg.version;
    manifest.author = pkg.author;
    manifest.homepage_url = pkg.homepage;

    rmNotes(manifest);
    
    grunt.log.subhead('Creating browser specific manifest files');

    browsers.forEach((browser) => {
      const browserManifest = grunt.file.readJSON(`src/manifest.${browser}.json`);
      const manifestCopy = Object.assign({}, manifest);
      const filePath = `build/${browser}/manifest.json`;
      rmNotes(browserManifest);
      merge(manifestCopy, browserManifest);
      grunt.file.write(filePath, JSON.stringify(manifestCopy, null, 2));
      grunt.log.ok(filePath);
    });
  });

  grunt.registerTask('quirks', 'Append browser global to work around quirks', () => {
    const {appendFileSync} = require('fs');
    browsers.forEach((browser) => {
      appendFileSync(`build/${browser}/js/global.js`, `\nconst BROWSER_QUIRKS = '${browser}';`);
    });
  });

  // All locales should have the same keys as the english version.
  grunt.registerTask('i18n', 'Sanity check i18n files', () => {
    const {isEqual} = require('lodash/lang');
    const keys = Object.keys(grunt.file.readJSON('src/_locales/en/messages.json')).sort();
    grunt.file.recurse('src/_locales', (abspath) => {
      const langKeys = Object.keys(grunt.file.readJSON(abspath)).sort();
      if (!isEqual(langKeys, keys)) {
        grunt.log.error(abspath + ' has missing or additional keys');
        process.exit(1);
      } else {
        grunt.log.ok(abspath);
      }
    }); 
  });

  grunt.registerTask('lint', [
    'jshint:extension',
    'jshint:node',
    'i18n'
  ]);

  grunt.registerTask('default', [
    'lint',
    'clean',
    'mkdir',
    'manifests',
    'copy:src',
    'copy:polyfill',
    'copy:async',
    'copy:misc',
    'browserify:minimatch',
    'quirks'
  ]);

  grunt.registerTask('release', [
    'default',
    'compress:firefox',
    'compress:chrome',
    'compress:opera',
    'compress:edge'
  ]);
};
