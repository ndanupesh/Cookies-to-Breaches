// signup.js
console.log("🔥 signup.js loaded!");

import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Signup form submitted!");


    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = document.getElementById("role").value;
    const name = document.getElementById("name").value;


    // Check password match
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return; // Stop form submission
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: email,
        name: name,
        role: role
      });

      // Redirect based on role

      window.location.href = "login.html";
      
    } catch (error) {
      alert("Signup failed: " + error.message);
    }
  });
}
