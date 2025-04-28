// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081',
  landingPageURLs: {
    requestInviteURL: 'http://localhost:8081/public-api/1003/tickets',
    successURL: 'http://help.getsmartticket.com/wordpress/forms/success/?id=invite-request',
    errorURL: 'http://help.getsmartticket.com/wordpress/forms/error/?id=invite-request',
    apiKey: '498d6ae8c3668efda6f187631726aaf2',
    formId: '167'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
