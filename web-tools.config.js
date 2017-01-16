var path = require('path'),
    _ = require('lodash');

module.exports = function(task, args) {
  var name = 'halftones',
      appBase = '.',
      baseServerPort = 9550,
      banner = '/* ' + name + ' - Built: ' + Date.now() + ' */\n',
      allEnvs = ['dev', 'prod'],
      env, // Used to store global env, once it's decided
      isProd,
      appSrcBase,
      appContentBase,
      appDestBase;

  if (process.env.NODE_ENV && _.includes(allEnvs, process.env.NODE_ENV)) {
    env = process.env.NODE_ENV;
  } else if (args.env && _.includes(allEnvs, args.env)) {
    env = args.env;
  } else {
    env = 'dev';
  }

  isProd = (env === 'prod');
  appSrcBase = path.join(appBase, 'app');
  appDestBase = path.join(appBase, '.' + env + '_srv');

  return {
    name: name,
    destPath: appDestBase,

    appAssets: {
        js: {
            src: [
                path.join(appSrcBase, 'scripts', '*.js')
              ],
            dest: path.join(appDestBase, 'scripts'),
            build: true,
            buildOptions: {
                doCheck: true,
                doMinify: isProd,
                doConcat: isProd,
                doBanner: isProd,
                doVersioning: isProd,
                doSourceMaps: isProd,
                concatName: name + '.js',
                banner: banner
              }
          },
        css: {
            src: [
                path.join(appSrcBase, 'styles', 'app.vars.css'),
                path.join(appSrcBase, 'styles', 'base.css'),
                path.join(appSrcBase, 'styles', '*.css')
              ],
            dest: path.join(appDestBase, 'styles'),
            build: true,
            buildOptions: {
                doMinify: isProd,
                doConcat: isProd,
                doBanner: isProd,
                doVersioning: isProd,
                doSourceMaps: isProd,
                concatName: name + '.css',
                banner: banner,
                pluginOptions: {
                    'postcss-import': {
                        root: appBase,
                        path: appSrcBase
                      }
                  }
              }
          },
        misc: {
            src: [
                path.join(appSrcBase, 'static', 'misc', '**', '*.*')
              ],
            dest: appDestBase
          },
        headerPartials: {
            src: [
                path.join(appSrcBase, 'partials', 'header.*.html')
              ],
            dest: path.join(appBase, '.tmp', 'partials'),
            build: true,
            builder: 'html',
            buildOptions: {
                doCheck: false, // Turn off checking because we don't have control over some of these snippets
                doMinify: false, // No need to ever minify here, since minifying the whole page will take care of it
                processOptions: {
                    environment: env
                  }
              }
          },
        footerPartials: {
            src: [
                path.join(appSrcBase, 'partials', 'footer.*.html')
              ],
            dest: path.join(appBase, '.tmp', 'partials'),
            build: true,
            builder: 'html',
            buildOptions: {
                doCheck: false, // Turn off checking because we don't have control over some of these snippets
                doMinify: false, // No need to ever minify here, since minifying the whole page will take care of it
                processOptions: {
                    environment: env
                  }
              }
          },
        html: {
            src: [
                path.join(appSrcBase, '*.html')
              ],
            dest: appDestBase,
            build: true,
            buildOptions: {
                doCheck: true,
                doMinify: isProd,
                doInject: true,
                injectOptions: {
                    ignorePath: appDestBase
                  },
                processOptions: {
                    environment: env,
                  }
              },
            appAssetDependencies: [
                'js',
                'css',
                'headerPartials',
                'footerPartials'
              ],
            extAssetDependencies: [
                'js',
                'css'
              ]
          }
      },

    extAssets: {
        js: {
            build: true,
            buildOptions: {
                doCheck: false,
                doMinify: isProd,
                doConcat: isProd,
                doBanner: false,
                doVersioning: isProd,
                doSourceMaps: isProd,
                uglifyOptions: {
                    mangle: false
                  },
                concatName: 'libs.js'
              },
            dest: path.join(appDestBase, 'scripts', 'libs')
          },
        css: {
            build: true,
            buildOptions: {
                doCheck: false,
                doMinify: isProd,
                doConcat: isProd,
                doBanner: false,
                doVersioning: isProd,
                doSourceMaps: isProd,
                concatName: 'libs.css'
              },
            dest: path.join(appDestBase, 'styles', 'libs')
          }
      },

    bower: {
        json: path.join(appBase, 'bower.json'),
        components: path.join(appBase, 'bower_components')
      },

    server: {
        port: process.env.PORT || (baseServerPort + allEnvs.indexOf(env)),
        hostname: 'localhost',
        root: appDestBase,
        setup: 'spa',
        options: {
            cacheAge: isProd ? 365 * 24 * 60 * 60 * 1000 : 0,
            gzip: isProd
          }
      }
  };
}
