// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyAhrkclfTBxl630MGoDMVThG3J6lxCkmnQ",
    authDomain: "stationaryweb.firebaseapp.com",
    databaseURL: "https://stationaryweb-default-rtdb.firebaseio.com",
    projectId: "stationaryweb",
    storageBucket: "stationaryweb.appspot.com",
    messagingSenderId: "1012050590585",
    appId: "1:1012050590585:web:a67bd1db258990eae64da8"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();