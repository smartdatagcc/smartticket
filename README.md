# SmartticketUpgrade

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.5.

# SETUP:
## Node version
Install node version between 10 & 12

## Clone the Project
Run `git clone https://github.com/SMARTDATASYSTEMSLLC/smartticket-upgrade.git` from command line interface for clone the project from git.

## Install dependencies
Run `npm install` to install all dependencies to a project

## Run Client
Run `ng serve` for a dev client. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Run Server
Run `node server.js` or `npm start` for a dev server.

# ANGULAR CODE SCAFFOLDING:
Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

Run `ng g s service-name` to generate a new service. 

## Building/compiling assets
Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests
Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests
Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further Angular help
To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

# DEPLOYMENT:
Source files can be deployed through Elastic Beanstalk:
1. Create the source bundle:
  - Run `gulp` tasks to compile distribution files into a folder, & zip.
    - `gulp dev` to build files for Dev configuration
    - `gulp qa` for QA/test configuration
    - `gulp prod` for Production configuration; will copy nginx configuration with HTTPS redirect & proxy pass
    AWS Reference: [Create a Source Bundle](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/applications-sourcebundle.html)
2. [Upload to Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.deploy-existing-version.html#deployments-newversion)
  - Upload the zip file in 'Application Versions'.
3. Deploy
  - Select the application version to deploy.
  - Choose Actions, and then choose Deploy.
  - Select an environment (Development, QA, Production), and then choose Deploy.

### .ebextensions
- As of 7/2021 - install `01_install_phantomjs.config` is used to force install phantomJS (deprecated) and library dependencies
