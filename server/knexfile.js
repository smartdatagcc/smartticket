// Update with your config settings.
var path = require('path');
module.exports = {
    local: {
        client: 'postgresql',
        connection: {
            // host: 'dbsupportticket.crzqpu8yygjb.us-east-1.rds.amazonaws.com',
            // user: 'sdsDevServer',
            // password: 'N2j&X!BMqBWFXV',
            // database: 'SupportTicketDev',
            // port: 5432


            // host: 'dbsupportticket.crzqpu8yygjb.us-east-1.rds.amazonaws.com',
            // user: 'sdsDevServer',
            // password: 'N2j&X!BMqBWFXV',
            // database: 'SupportTicketUpgrade',
            // port: 5432
            
            // host: 'dbsupportticket.crzqpu8yygjb.us-east-1.rds.amazonaws.com',
            // user: 'sdsQAServer',
            // password: '45hrH&CXppc^X',
            // database: 'SupportTicketQA',
            // port: 5432

            // host: 'dbsupportticket.crzqpu8yygjb.us-east-1.rds.amazonaws.com',
            // user: 'sdsDevServer',
            // password: 'N2j&X!BMqBWFXV',
            // database: 'SupportTicketUpgrade',
            // port: 5432

            host: 'localhost',
            user: 'postgres',
            password: 'postgres',
            database: 'SmartTicket',
            port: 5432
        },
        debug: true,
        migrations: {
            tableName: 'migrations'
        },
        seeds: {
            directory: path.join(__dirname, './fixtures')
        },
        pool: {
            min: 0,
            max: 2
        }
    },
    dev: {
        client: 'postgresql',
        connection: {
            host: 'dbsupportticket.crzqpu8yygjb.us-east-1.rds.amazonaws.com',
            user: 'sdsDevServer',
            password: 'N2j&X!BMqBWFXV',
            database: 'SupportTicketDev',
            port: 5432


            // host: 'dbsupportticket.crzqpu8yygjb.us-east-1.rds.amazonaws.com',
            // user: 'sdsDevServer',
            // password: 'N2j&X!BMqBWFXV',
            // database: 'SupportTicketUpgrade',
            // port: 5432
            
        },
        debug: true,
        migrations: {
            tableName: 'migrations'
        },
        seeds: {
            directory: path.join(__dirname, './fixtures')
        },
        pool: {
            min: 0,
            max: 2
        }
    },
    test: {
        client: 'postgresql',
        connection: {
            host: 'dbsupportticket.crzqpu8yygjb.us-east-1.rds.amazonaws.com',
            user: 'sdsDevServer',
            password: 'N2j&X!BMqBWFXV',
            database: 'SupportTicketDev',
            port: 5432
        },
        debug: true,
        migrations: {
            tableName: 'migrations'
        },
        seeds: {
            directory: path.join(__dirname, './fixtures')
        },
        pool: {
            min: 0,
            max: 2
        }
    },
    qa: {
        client: 'postgresql',
        connection: {
            // host: 'dbsupportticket.crzqpu8yygjb.us-east-1.rds.amazonaws.com',
            // user: 'sdsQAServer',
            // password: '45hrH&CXppc^X',
            // // user: 'sdsAdmin',
            // // password: '1q2w3e4r',
            // database: 'SupportTicketQA',
            // port: 5432

            host: 'dbsupportticket.crzqpu8yygjb.us-east-1.rds.amazonaws.com',
            user: 'sdsDevServer',
            password: 'N2j&X!BMqBWFXV',
            database: 'SupportTicketUpgrade',
            port: 5432
        },
        migrations: {
            tableName: 'migrations'
        },
        seeds: {
            directory: path.join(__dirname, './fixtures')
        },
        pool: {
            min: 0,
            max: 2
        }
    },
    demo: {
        client: 'postgresql',
        connection: {
            host: 'dbsupportticket.crzqpu8yygjb.us-east-1.rds.amazonaws.com',
            user: 'sdsAdmin',
            password: '1q2w3e4r',
            database: 'SupportTicketDemo',
            port: 5432
        },
        migrations: {
            tableName: 'migrations'
        },
        seeds: {
            directory: path.join(__dirname, './fixtures')
        },
        pool: {
            min: 0,
            max: 2
        }
    },
    production: {
        client: 'postgresql',
        connection: process.env.DATABASE_URL,
        migrations: {
            tableName: 'migrations'
        },
        seeds: {
            directory: path.join(__dirname, './fixtures')
        },
        pool: {
            min: 0,
            max: 8
        }
    }
};
