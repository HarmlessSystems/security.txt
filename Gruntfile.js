'use strict';

const browsers = ['firefox', 'chrome', 'opera', 'edge'];

module.exports = function(grunt) {
 
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    package: grunt.file.readJSON('package.json'),
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
      all: {
        files: browsers.map((browser) => {
          return {
            expand: true,
            cwd: 'src/',
            src: ['**', '!manifest*json'],
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
      }
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

  grunt.registerTask('lint', [
    'jshint:extension',
    'jshint:node',
  ]);

  grunt.registerTask('default', [
    'lint',
    'clean',
    'mkdir',
    'manifests',
    'copy',
    'copy:polyfill',
    'quirks'
  ]);
};
