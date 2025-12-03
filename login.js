// login.js
import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const role = docSnap.data().role;

        if (role === "user") {
          window.location.href = "Dashboards/userdashboard.html";
        } else if (role === "admin") {
          window.location.href = "Dashboards/admindashboard.html";
        } else {
          alert("No role assigned. Contact support.");
        }
      } else {
        alert("No user data found.");
      }
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });
}
