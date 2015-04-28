var fs, gulp, gulpBump, conventionalChangelog, connect;
fs = require('fs');
gulp = require('gulp');
gulpBump = require('gulp-bump');
conventionalChangelog = require('conventional-changelog');
connect = require('gulp-connect');

var watch = require('gulp-watch');
var batch = require('gulp-batch');
var concat = require('gulp-concat');
var uglify = require('gulp-uglifyjs');
var gzip = require('gulp-gzip');

gulp.task('release', ['build', 'bump'], function(done) {
    function changeParsed(err, log) {
        if (err) {
            return done(err);
        }
        fs.writeFile('CHANGELOG.md', log, done);
    }
    fs.readFile('./package.json', 'utf8', function(err, data) {
        var ref$, repository, version;
        ref$ = JSON.parse(data), repository = ref$.repository, version = ref$.version;
        conventionalChangelog({
            repository: repository.url,
            version: version
        }, changeParsed);
    });
});

gulp.task('build', function() {
    gulp.src('src/*.js')
        .pipe(concat('pow.js'))
        .pipe(gulp.dest('.'))
    gulp.src('pow.js')
        .pipe(uglify('pow.min.js', {
            outSourceMap: true
        }))
        .pipe(gulp.dest('.'))

    gulp.src('pow.js')
        .pipe(gzip({ gzipOptions: { level: 9 } }))
        .pipe(gulp.dest('.'));

    gulp.src('pow.min.js')
        .pipe(gzip({ gzipOptions: { level: 9 } }))
        .pipe(gulp.dest('.'));
})

gulp.task('bump', function() {
    return gulp.src('package.json').pipe(gulpBump({
        type: process.env.TYPE || 'patch'
    })).pipe(gulp.dest('.'));
});

// default test
gulp.task('default', function() {
    gulp.watch(['test/**', 'src/**'], batch(function(events) {
        return events.pipe(connect.reload());
    }));

    connect.server({
        root: ['test', 'src'],
        port: 8080,
        livereload: true
    })
});