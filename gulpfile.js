'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var files = [
	'**/*.js',
	'!node_modules/**/*'
];

gulp.task('default', function() {
	return gulp.src(files)
	.pipe($.jshint())
	.pipe($.jshint.reporter(require('jshint-stylish')))
	.pipe($.jshint.reporter('fail'))
	.pipe($.jscs());
});


gulp.task('git-pre-commit', ['default']);
