var gulp = require('gulp');
var sass = require('gulp-sass');


gulp.task('watch', function() {
  gulp.watch(['./sass/*.scss'], ['default']); 
});
gulp.task('default', function() {
  gulp.src('./sass/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('./src/public/css'));
});