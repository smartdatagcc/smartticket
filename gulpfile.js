const { src, dest, series, parallel } = require('gulp');
const del = require('del');
const fs   = require('fs');
var path = require('path');
const zip = require('gulp-zip');
const log = require('fancy-log');
var exec = require('child_process').exec;

// gulp process to zip files for Elastic Beanstalk deployment
const paths = {
  prod_build: 'prod-build',
  server_file_name: 'server.js',
  server_folder_name: './server/**/*',
  angular_src: './dist/smartticket-upgrade/**/*',
  angular_dist: './prod-build/',
  zipped_file_name: 'smartticket-upgrade-prod.zip'
};

function clean()  {
  log('Removing old files in ' + paths.prod_build);
  return del('prod-build/**', {force:true});
}

function createProdBuildFolder() {
  const dir = paths.prod_build;
  if(!fs.existsSync(dir)) {  
    log('Creating ' + dir + '...');
    fs.mkdirSync(dir);
    log('📁  Folder created:', dir);
  }

  return Promise.resolve('...');
}

function buildAngularDEVTask(cb) {
  log('Building Angular code');
  return exec('ng build --prod --configuration=development', function (err, stdout, stderr) {
    log(stdout);
    log(stderr);
    cb(err);
  });
}

function buildAngularQATask(cb) {
  log('Building Angular code - QA (testing)');
  return exec('ng build --prod --configuration=testing', function (err, stdout, stderr) {
    log(stdout);
    log(stderr);
    cb(err);
  });
}

function buildAngularPRODTask(cb) {
  log('Building Angular code');
  return exec('ng build --prod --configuration=production', function (err, stdout, stderr) {
    log(stdout);
    log(stderr);
    cb(err);
  });
}

function copyAngularCodeTask() {
  console.log('Copying Angular code into ' + paths.prod_build);
  return src(`${paths.angular_src}`)
        .pipe(dest(`${paths.prod_build}`));
}

function copyNodeJSCodeTask() {
  console.log('Copying server & deployment code into ' + `${paths.prod_build}`);
  return src([
      `${paths.server_folder_name}`, 
        './.ebextensions/**/*', '.npmrc', 
        './.platform/**/*',
        'package.json', 
        'angular.json',
        `${paths.server_file_name}`], 
        { "base" : "./" })
        .pipe(dest(`${paths.prod_build}`));
}

function copyNginx (cb) {
  var copyFrom = './00_application.conf';
  var copyTo = './prod-build/.platform/nginx/conf.d/elasticbeanstalk/00_application.conf';
  console.log('Copying nginx HTTPS config ' + `${paths.prod_build}`);
  fs.copyFile(path.resolve(__dirname, copyFrom), path.resolve(__dirname, copyTo), cb);
}

function zippingTask() {
  log('Zipping');
  return src([
    `${paths.prod_build}/**/*`], { "dot" : true })
      .pipe(zip(`${paths.zipped_file_name}`))
      .pipe(dest(`${paths.prod_build}`));
}

exports.dev = series(
  clean,
  createProdBuildFolder,
  buildAngularDEVTask,
  parallel(copyAngularCodeTask, copyNodeJSCodeTask)
  , zippingTask
);

exports.qa = series(
  clean,
  createProdBuildFolder,
  buildAngularQATask,
  parallel(copyAngularCodeTask, copyNodeJSCodeTask)
  , zippingTask
);

exports.prod = series(
  clean,
  createProdBuildFolder,
  buildAngularPRODTask,
  parallel(copyAngularCodeTask, copyNodeJSCodeTask),
  copyNginx,
  zippingTask
);