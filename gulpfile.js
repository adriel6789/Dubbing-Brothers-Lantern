var gulp  = require('gulp');
var del = require('del');
var cachebust = require('gulp-cache-bust');
var replace = require('gulp-string-replace');
var versionTimeStamp = "" + Date.now();

gulp.task('timestamps', function(){
  return gulp.src('app/index.html')
    .pipe(cachebust({
      type: 'timestamp'
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('cachebuster', function(){
  return gulp.src('app/js/htmlcachebuster.js')
    .pipe(replace('___REPLACE_IN_GULP___', versionTimeStamp))
    .pipe(gulp.dest('app/js'));
});

gulp.task('default', gulp.series('timestamps', 'cachebuster'));
