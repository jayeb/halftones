var gulp = require('gulp'),
    setupGulpTasks = require('web-tools/tools/gulp-tasks', gulp),
    configFactory = require('./web-tools.config.js');

gulp = setupGulpTasks(gulp, configFactory);
gulpMetadata = require('web-tools/tools/gulp-metadata.js')(gulp);
