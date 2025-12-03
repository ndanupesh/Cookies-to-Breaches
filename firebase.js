  // firebase.js
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
  
  import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBjyPmf6ZOxJ2ySyMIgnpz3lx_ySe6_Kdc",
    authDomain: "cookiestobreaches.firebaseapp.com",
    projectId: "cookiestobreaches",
    storageBucket: "cookiestobreaches.appspot.com",
    messagingSenderId: "693372601215",
    appId: "1:693372601215:web:7673f7a94ace9a2a74504a",
    measurementId: "G-T5RPQZV3ZN"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  const auth = getAuth(app);
  const db = getFirestore(app);

  // Export to use in signup.js / login.js
  export { auth, db };

