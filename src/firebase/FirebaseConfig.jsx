// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"
import {getAuth} from "firebase/auth"
import {getStorage} from "firebase/storage"
import { getMessaging } from "firebase/messaging"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhrkclfTBxl630MGoDMVThG3J6lxCkmnQ",
  authDomain: "stationaryweb.firebaseapp.com",
  projectId: "stationaryweb",
  storageBucket: "stationaryweb.appspot.com",
  messagingSenderId: "1012050590585",
  appId: "1:1012050590585:web:a67bd1db258990eae64da8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const fireDB = getFirestore(app);
const auth = getAuth(app);
const firestorage = getStorage(app); // Initialize Firebase Storage
const messaging = getMessaging(app);


export { fireDB, auth, firestorage, messaging};
