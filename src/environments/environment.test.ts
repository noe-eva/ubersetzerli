// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import {InitialNavigation} from '@angular/router';

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyBPg6tNJi_dW_l8OphZUdwJDchq_Ualts8',
    authDomain: 'ubersetzerli.firebaseapp.com',
    projectId: 'ubersetzerli',
    storageBucket: 'ubersetzerli.appspot.com',
    messagingSenderId: '254209171339',
    appId: '1:254209171339:web:e9d8b473ae0fe79b72598e',
    measurementId: 'G-23WMZM7W7Q',
  },
  initialNavigation: 'enabledNonBlocking' as InitialNavigation,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
