(function () {
    "use strict";

    let Promise = require("bluebird"),
        _ = require('lodash'),
        Base = require('./base'),
        Boom = require('boom'),
        pdf = require('html-pdf'),
        //stream = require('stream'),
        Appointment;

    module.exports = class GeneratePDFService extends Base {
        constructor(request) {
            super(request);
            this.Appointment = this.getModel('Appointment');
            this.options = {
                format: 'Letter',
                border: '.5in',
                height: "10.5in",
                zoomFactor: "300.0/72.0",
                phantomArgs: [
                ]
            };
        }

        generateHTML(document){
            var server = this.server;
            return '<html style="zoom: 0.6"><head><link href="' + server.info.uri + '/main.css" type="text/css" rel="stylesheet" /></head><body class="markdown">' + document + '</body></html>';
        }
        
        generatePDF(document) {
            var options = this.options;
            //create a pdf
            return pdf.create(
                this.generateHTML(document),
                options
            );
        }
        

    };
})();
