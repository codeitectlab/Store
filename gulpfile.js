var gulp = require('gulp'),
  plugins = require('gulp-load-plugins')(),
  nodemon = require('gulp-nodemon'),
  plumber = require('gulp-plumber'),
  exec = require('gulp-exec'),
  sass = require('gulp-sass'),
  rev = require('gulp-rev'),
  filenames = require("gulp-filenames"),
  file = require('gulp-file'),
  log = require('fancy-log'),
  data = require('gulp-data'),
  jsonTransform = require('gulp-json-transform'),
  fs = require('fs'),
  htmlclean = require('gulp-htmlclean');

gulp.task('set-local-var', function(){
  process.env.IS_LOCAL = true;
});

gulp.task('set-env-vars', function() {
  if(!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'devo';
  }

  if(process.env.NODE_ENV === 'devo') {
    process.env.DEBUG = 'store-space*';
  } else if(process.env.NODE_ENV === 'test') {
    process.env.DEBUG = 'store-space:debug*,store-space:error*';
  } else {
    process.env.DEBUG = 'store-space:error*';
  }

  process.env.DEBUG_COLORS = 'true';
});

gulp.task('process-email-templates', function() {
  gulp.src('./emailTemplates/*.html')
    .pipe(htmlclean())
//    .pipe(plugins.rename({suffix: '-cleaned'}))
    .pipe(gulp.dest('./emailTemplates/cleaned/'));

  return gulp.src('./emailTemplates/*.json')
    .pipe(jsonTransform(function(data, file) {
      var templateFile = './emailTemplates/cleaned/' + file.relative.split('.')[0] + '.html';
      var template = fs.readFileSync(templateFile);
      data.Template.HtmlPart = template.toString();
      console.log(data);
//      console.log(file);
      return data;
    }))
    .pipe(gulp.dest('./emailTemplates/cleaned'));
});

gulp.task('styles', function() {
  gulp.src('./public/styles/main.scss')
    .pipe(sass())
    .pipe(plugins.concat('main.css'))
    .pipe(plugins.cleanCss())
    .pipe(plugins.autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(filenames("noVersion"))
    .pipe(rev())
    .pipe(filenames("hasVersion"))
    .pipe(gulp.dest('./public/bundle/styles'));

  return gulp.src('./public/styles/vendor/skeleton.scss')
    .pipe(sass())
    .pipe(plugins.concat('skeleton.css'))
    .pipe(plugins.cleanCss())
    .pipe(plugins.autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(filenames("noVersion"))
    .pipe(rev())
    .pipe(filenames("hasVersion"))
    .pipe(gulp.dest('./public/bundle/styles'));

});

gulp.task('scripts', function() {
  gulp.src(['./public/scripts/admin.js'])
    .pipe(plumber())
    .pipe(exec(['node_modules/.bin/browserify -t vashify ./public/scripts/admin.js'], {pipeStdout: true, maxBuffer: 2000*1024}))
    .pipe(plugins.concat('admin.js'))
    .pipe(plugins.uglify())
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(filenames("noVersion"))
    .pipe(rev())
    .pipe(filenames("hasVersion"))
    .pipe(gulp.dest('./public/bundle/scripts'));

  return gulp.src(['./public/scripts/main.js'])
    .pipe(plumber())
    .pipe(exec(['node_modules/.bin/browserify -t vashify ./public/scripts/main.js'], {pipeStdout: true, maxBuffer: 2000*1024}))
    .pipe(plugins.concat('main.js'))
    .pipe(plugins.uglify())
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(filenames("noVersion"))
    .pipe(rev())
    .pipe(filenames("hasVersion"))
    .pipe(gulp.dest('./public/bundle/scripts'));

});

gulp.task('build-sync', [
  'styles',
  'scripts'
]);

gulp.task('assets-versioning', ['build-sync'], function(){
    var versions = {};
    for (var i=0; i<filenames.get("noVersion").length; i++){
      versions[filenames.get("noVersion")[i]] = filenames.get("hasVersion")[i];
    }

    return file('assetVersions.js', 'module.exports = ' + JSON.stringify(versions), { src: true })
      .pipe(gulp.dest('./config'));
});

gulp.task('develop', ['assets-versioning'], function() {
  var stream = nodemon({
    script: 'server.js',
    ext: 'js vash scss',
    ignore: ['bundle/*', 'config/assetVersions.js'],
    stdout: false,
    tasks: ['build']
  }).on('readable', function() {
    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  }).on('restart', function() {
    log('Restarted.');
  }).on('crash', function() {
    log('Crashed! Restarting in 10s');
    stream.emit('restart', 10);
  });
});

gulp.task('build', ['assets-versioning']);

gulp.task('default', [
  'set-env-vars',
  'develop'
]);

gulp.task('local', [
  'set-local-var',
  'set-env-vars',
  'develop'
]);

gulp.task('local-debug', [
  'set-local-var',
  'set-env-vars'
], function() {
  var stream = nodemon({
    script: 'server.js',
    args: ['--debug'],
    ext: 'js vash scss',
    ignore: ['bundle/*', 'config/assetVersions.js'],
    stdout: false,
    tasks: ['build']
  }).on('readable', function() {
    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  }).on('restart', function() {
    log('Restarted.');
  }).on('crash', function() {
    log('Crashed! Restarting in 10s');
    stream.emit('restart', 10);
  });
});
