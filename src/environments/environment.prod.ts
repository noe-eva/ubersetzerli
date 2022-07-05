import {InitialNavigation} from '@angular/router';

export const environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyBPg6tNJi_dW_l8OphZUdwJDchq_Ualts8',
    authDomain: 'ubersetzerli.firebaseapp.com',
    projectId: 'ubersetzerli',
    storageBucket: 'ubersetzerli.appspot.com',
    messagingSenderId: '254209171339',
    appId: '1:254209171339:web:e9d8b473ae0fe79b72598e',
    measurementId: 'G-23WMZM7W7Q',
  },
  initialNavigation: 'enabledBlocking' as InitialNavigation,
};
