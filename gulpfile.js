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
var replace = require('gulp-replace');

gulp.task('release', ['bump'], function(done) {
    function changeParsed(err, log) {
        if (err) {
            return done(err);
        }
        fs.writeFile('CHANGELOG.md', log, done);
    }

    gulp.run('build')

    gulp.src('build/pow.js').pipe(gulp.dest('dist'))

    gulp.src('build/pow.js')
        .pipe(uglify('pow.min.js', {
            outSourceMap: true
        }))
        .pipe(gulp.dest('dist'))

    gulp.src('build/pow.js')
        .pipe(gzip({
            gzipOptions: {
                level: 9
            }
        }))
        .pipe(gulp.dest('dist'))
        .pipe(gzip({
            gzipOptions: {
                level: 9
            }
        }))
        .pipe(gulp.dest('dist'));

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
    var version = JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;

    return gulp.src('src/*.js')
        .pipe(concat('pow.js', {
            newLine: ';\n\n'
        })).pipe(replace('@version', version))
        .pipe(gulp.dest('build'))
})

gulp.task('bump', function() {
    return gulp.src('./package.json').pipe(gulpBump({
        type: 'patch'
    })).pipe(gulp.dest('./'));
});

gulp.task('watch', function() {
    if (!fs.exists('build/pow.js')) {
        gulp.run('build')
    }

    gulp.watch(['src/**'], batch(function(events) {
        gulp.run('build')
    }));

    gulp.watch(['test/**', 'build/pow.js'], batch(function(events) {
        events.pipe(connect.reload());
    }));
})

// default test
gulp.task('default', ['watch'], function() {

    connect.server({
        root: ['test', 'build'],
        host: '0.0.0.0',
        port: 6060,
        livereload: true
    })
});

// powjs.github.io
gulp.task('powjs', ['watch'], function() {
    var index = fs.readFileSync('../powjs.github.io/index.html', 'utf8')
        .replace(/src="js\/gohub.js">/, 'src="pow.js">');

    gulp.watch(['../powjs.github.io/**'], batch(function(events) {
        events.pipe(connect.reload());
    }));

    // build 目录必须在前
    connect.server({
        root: ['build', "../powjs.github.io"],
        host: '0.0.0.0',
        port: 6060,
        livereload: true
    })
});