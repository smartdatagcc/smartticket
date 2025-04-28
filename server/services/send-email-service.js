"use strict";

let common = require('../common'),
    config = common.config(),
    path = require('path'),
    templatesDir = path.resolve(__dirname, '..', 'templates'),
    emailTemplates = require('email-templates'),
    Base = require('./base.js'),
    fromEmail = 'smartticket@smartdatasystems.net',
    smartTicketUrl = config.tokenIssuer;

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.sendgrid_api_password || process.env.SENDGRID_API_PASSWORD);

module.exports = class EmailService {

    notSmartDataEmail(email) {
        return email.indexOf("smartdatasystems.net") === -1 && email.indexOf("smartdataglobal.in") === -1 && email.indexOf("smartdata.net") === -1;
    }

    sendMailOnUpdate(user, credentials, ticket) {

        if (config.restrictEmail && user && this.notSmartDataEmail(user.email)) {
            //restricted - make sure contains:
            console.log("Invalid email - not sending - restricted email is enabled - must be a smartdatasystems.net");
        } else {
            emailTemplates(templatesDir, (err, template) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let locals = {
                        id: ticket.id,
                        email: user.email,
                        name: user.name,
                        responder: credentials.name,
                        url: `${config.tokenIssuer}/${ticket.tenantId}/ticket/${ticket.formId}/${ticket.id}`,
                        formName: ticket.form.name,
                        smartTicketUrl: smartTicketUrl
                    };

                    ////config.tokenIssuer + "/" + emailModel.ticket.get('tenantId') + "/ticket/" + emailModel.ticket.get('formId') + "/" +  emailModel.ticket.get('id'),
                    //http://localhost:9001/1017/ticket/51/1323

                    // Send a single email
                    template('send-ticket-changed-email', locals, (err, html, text) => {
                        if (err) {
                            console.log(err);
                        } else {

                            const msg = {
                                to: locals.email,
                                from: `SmartTicket <${fromEmail}>`, // Use the email address or domain you verified above
                                subject: `SmartTicket - ${ticket.form.name} Updated`,
                                text: text,
                                html: html,
                            };

                            sgMail
                                .send(msg)
                                .then(() => { }, error => {
                                    console.error("Error sending email: ", error);

                                    if (error.response) {
                                        console.error("Error message: ", error.response.body)
                                    }
                                });
                        }
                    });
                }
            });
        }
    }

    sendMailOnComment(user, credentials, ticket) {
        if (config.restrictEmail && user && this.notSmartDataEmail(user.email)) {
            //restricted - make sure contains:
            console.log("Invalid email - not sending - restricted email is enabled - must be a smartdatasystems.net");
        } else {
            emailTemplates(templatesDir, (err, template) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let locals = {
                        id: ticket.id,
                        email: user.email,
                        name: user.name,
                        responder: credentials.name,
                        url: `${config.tokenIssuer}/${ticket.tenantId}/ticket/${ticket.formId}/${ticket.id}`,
                        formName: ticket.form.name,
                        smartTicketUrl: smartTicketUrl
                    };

                    // Send a single email
                    template('send-comment-email', locals, (err, html, text) => {
                        if (err) {
                            console.log(err);
                        } else {

                            const msg = {
                                to: locals.email,
                                from: `SmartTicket <${fromEmail}>`, // Use the email address or domain you verified above
                                subject: 'SmartTicket - Comment Added',
                                text: text,
                                html: html,
                            };

                            sgMail
                                .send(msg)
                                .then(() => { }, error => {
                                    console.error("Error sending email: ", error);

                                    if (error.response) {
                                        console.error("Error message: ", error.response.body)
                                    }
                                });
                        }
                    });
                }
            });
        }
    }

    sendMailOnNote(user, credentials, ticket) {
        if (config.restrictEmail && user && this.notSmartDataEmail(user.email)) {
            //restricted - make sure contains:
            console.log("Invalid email - not sending - restricted email is enabled - must be a smartdatasystems.net");
        } else {
            emailTemplates(templatesDir, (err, template) => {
                if (err) {
                    console.log("Error in email template: ", err);
                }
                else {
                    let locals = {
                        id: ticket.id,
                        email: user.email,
                        name: user.name,
                        responder: credentials.name,
                        url: `${config.tokenIssuer}/${ticket.tenantId}/ticket/${ticket.formId}/${ticket.id}/notes`,
                        formName: ticket.form.name,
                        smartTicketUrl: smartTicketUrl
                    };

                    // Send a single email
                    template('send-note-email', locals, (err, html, text) => {
                        if (err) {
                            console.log("Error in email: ", err);
                        } else {

                            const msg = {
                                to: locals.email,
                                from: `SmartTicket <${fromEmail}>`, // Use the email address or domain you verified above
                                subject: 'SmartTicket - Note Added',
                                text: text,
                                html: html,
                            };

                            sgMail
                                .send(msg)
                                .then(() => { }, error => {
                                    console.error("Error sending email: ", error);

                                    if (error.response) {
                                        console.error("Error message: ", error.response.body)
                                    }
                                });
                        }
                    });
                }
            });
        }
    }

    sendMailOnAssignedToTicket(user, credentials, ticket) { //emailTo, tenantName, tenantId, formId, ticketId) {
        if (config.restrictEmail && user && this.notSmartDataEmail(user.email)) {
            //restricted - make sure contains:
            console.log("Invalid email - not sending - restricted email is enabled - must be a smartdatasystems.net");
        } else {
            emailTemplates(templatesDir, (err, template) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let locals = {
                        id: ticket.id,
                        email: user.email,
                        name: user.name,
                        responder: credentials.name,
                        url: config.tokenIssuer + "/" + ticket.tenantId + "/ticket/" + ticket.formId + '/' + ticket.id,
                        formName: ticket.form.name,
                        smartTicketUrl: smartTicketUrl
                    };

                    // Send a single email
                    template('send-assignedto-ticket-email', locals, (err, html, text) => {
                        if (err) {
                            console.log(err);
                        } else {

                            const msg = {
                                to: locals.email,
                                from: `SmartTicket <${fromEmail}>`, // Use the email address or domain you verified above
                                subject: 'SmartTicket - Assigned To Ticket',
                                text: text,
                                html: html,
                            };

                            sgMail
                                .send(msg)
                                .then((result) => {
                                    console.log('SENDGRID sent', result);
                                }, error => {
                                    console.error("Error sending email: ", error);

                                    if (error.response) {
                                        console.error("Error message: ", error.response.body)
                                    }
                                });

                        }
                    });
                }
            });
        }
    }

    sendMailOnForgotPassword(emailTo, token) {
        if (config.restrictEmail && this.notSmartDataEmail(emailTo)) {
            //restricted - make sure contains:
            console.log("Invalid email - not sending - restricted email is enabled - must be a smartdatasystems.net");
        } else {
            emailTemplates(templatesDir, (err, template) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let locals = {
                        linkToTicket: config.tokenIssuer + "/reset-password/" + token,
                        smartTicketUrl: smartTicketUrl
                    };

                    // Send a single email
                    template('send-forgot-password-email', locals, (err, html, text) => {
                        if (err) {
                            console.log(err);
                        } else {

                            const msg = {
                                to: emailTo,
                                from: `SmartTicket <${fromEmail}>`, // Use the email address or domain you verified above
                                subject: 'SmartTicket - Forgotten Password',
                                text: text,
                                html: html,
                            };

                            sgMail
                                .send(msg)
                                .then(() => { }, error => {
                                    console.error("Error sending email: ", error);

                                    if (error.response) {
                                        console.error("Error message: ", error.response.body)
                                    }
                                });
                        }
                    });
                }
            });
        }
    }

    sendAddUserToTenantEmail(emailTo, tenantName, tenantId, token) {
        if (config.restrictEmail && this.notSmartDataEmail(emailTo)) {
            //restricted - make sure contains:
            console.log("Invalid email - not sending - restricted email is enabled - must be a smartdatasystems.net");
        } else {
            emailTemplates(templatesDir, (err, template) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let locals = {
                        linkToCreateAccount: config.tokenIssuer + "/" + tenantId + "/registration/" + token,
                        tenantName: tenantName,
                        smartTicketUrl: smartTicketUrl
                    };


                    // Send a single email
                    template('send-add-user-tenant-email', locals, (err, html, text) => {
                        if (err) {
                            console.log(err);
                        } else {

                            const msg = {
                                to: emailTo,
                                from: `SmartTicket <${fromEmail}>`, // Use the email address or domain you verified above
                                subject: `SmartTicket - Added to ${tenantName}`,
                                text: text,
                                html: html,
                            };

                            sgMail
                                .send(msg)
                                .then(() => { }, error => {
                                    console.error("Error sending email: ", error);

                                    if (error.response) {
                                        console.error("Error message: ", error.response.body)
                                    }
                                });
                        }
                    });
                }
            });
        }
    }

    sendRegistrationConfirmationEmail(emailTo, tenantName, tenantId, token) {
        if (config.restrictEmail && this.notSmartDataEmail(emailTo)) {
            //restricted - make sure contains:
            console.log("Invalid email - not sending - restricted email is enabled - must be a smartdatasystems.net");
        } else {
            emailTemplates(templatesDir, (err, template) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let locals = {
                        linkToCreateAccount: config.tokenIssuer + "/" + tenantId + "/confirmation/" + token,
                        smartTicketUrl: smartTicketUrl
                    };

                    // Send a single email
                    template('send-registration-confirmation-email', locals, (err, html, text) => {
                        if (err) {
                            console.log(err);
                        } else {

                            const msg = {
                                to: emailTo,
                                from: `SmartTicket <${fromEmail}>`, // Use the email address or domain you verified above
                                subject: 'SmartTicket - Registration Confirmation',
                                text: text,
                                html: html,
                            };

                            sgMail
                                .send(msg)
                                .then(() => { }, error => {
                                    console.error("Error sending email: ", error);

                                    if (error.response) {
                                        console.error("Error message: ", error.response.body)
                                    }
                                });
                        }
                    });
                }
            });
        }
    }

    sendEmailOnNewsLetterSubscription(emailTo, payload) {
        emailTemplates(templatesDir, (err, template) => {
            if (err) {
                console.log(err);
            }
            else {
                let locals = {
                    name: payload.name,
                    linkToSuDashboard: config.tokenIssuer + "/su-dashboard",
                    smartTicketUrl: smartTicketUrl
                };

                // Send a single email
                template('send-newsletter-subscription-email', locals, (err, html, text) => {
                    if (err) {
                        console.log(err);
                    } else {

                        const msg = {
                            to: emailTo,
                            from: `SmartTicket <${fromEmail}>`, // Use the email address or domain you verified above
                            subject: 'SmartTicket - Invite Request',
                            text: text,
                            html: html,
                        };

                        sgMail
                            .send(msg)
                            .then(() => { }, error => {
                                console.error("Error sending email: ", error);

                                if (error.response) {
                                    console.error("Error message: ", error.response.body)
                                }
                            });
                    }
                });
            }
        });
    }

    sendResetPasswordEmail(emailTo, token) {
        if (config.restrictEmail && this.notSmartDataEmail(emailTo)) {
            //restricted - make sure contains:
            console.log("Invalid email - not sending - restricted email is enabled - must be a smartdatasystems.net");
        } else {
            emailTemplates(templatesDir, (err, template) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let locals = {
                        linkToTicket: config.tokenIssuer + "/reset-password/" + token,
                        smartTicketUrl: smartTicketUrl
                    };

                    // Send a single email
                    template('send-reset-password-request', locals, (err, html, text) => {
                        if (err) {
                            console.log(err);
                        } else {

                            const msg = {
                                to: emailTo,
                                from: `SmartTicket <${fromEmail}>`, // Use the email address or domain you verified above
                                subject: 'SmartTicket - Reset Password',
                                text: text,
                                html: html,
                            };

                            sgMail
                                .send(msg)
                                .then(() => { }, error => {
                                    console.error("Error sending email: ", error);

                                    if (error.response) {
                                        console.error("Error message: ", error.response.body)
                                    }
                                });
                        }
                    });
                }
            });
        }
    }

    sendPasswordChangedEmail(emailTo) {
        if (config.restrictEmail && this.notSmartDataEmail(emailTo)) {
            //restricted - make sure contains:
            console.log("Invalid email - not sending - restricted email is enabled - must be a smartdatasystems.net");
        } else {
            emailTemplates(templatesDir, (err, template) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let locals = {
                        smartTicketUrl: smartTicketUrl
                    };

                    // Send a single email
                    template('send-password-changed-email', locals, (err, html, text) => {
                        if (err) {
                            console.log(err);
                        } else {

                            const msg = {
                                to: emailTo,
                                from: `SmartTicket <${fromEmail}>`, // Use the email address or domain you verified above
                                subject: 'SmartTicket - Password Changed',
                                text: text,
                                html: html,
                            };

                            sgMail
                                .send(msg)
                                .then(() => { }, error => {
                                    console.error("Error sending email: ", error);

                                    if (error.response) {
                                        console.error("Error message: ", error.response.body)
                                    }
                                });
                        }
                    });
                }
            });
        }
    }
};


