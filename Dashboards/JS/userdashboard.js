/* userdashboard.js - Debug Version */

// 1. IMPORT FIREBASE
// If this path is wrong, the whole script stops. Ensure firebase.js is in the same folder.
import { auth, db } from '../../firebase.js'; 
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

console.log("🚀 Userdashboard Script Starting...");

document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ DOM Loaded. finding elements...");

  // DOM Elements
  const screen1 = document.getElementById('screen-1');
  const screen2 = document.getElementById('screen-2');
  const choiceAccept = document.getElementById('choiceAccept');
  const choiceDecline = document.getElementById('choiceDecline');
  const choiceCustomize = document.getElementById('choiceCustomize');
  const customRow = document.getElementById('customRow');
  const btnContinue = document.getElementById('btnContinue');
  const btnBack = document.getElementById('btnBack');
  
  // Verify critical button exists
  if (!btnContinue) {
    console.error("❌ ERROR: Could not find button with ID 'btnContinue' in HTML");
    return;
  }

  let prefs = { mode: null };
  let currentUser = null;

  // 2. LISTEN FOR USER LOGIN
  try {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUser = user;
        console.log("👤 User active:", user.email);
      } else {
        console.log("⚠️ No user logged in (Guest Mode)");
      }
    });
  } catch (e) {
    console.error("Auth Error (Is firebase.js correct?):", e);
  }

  // 3. COOKIE UI LOGIC
  function setChoice(mode) {
    console.log("Clicked:", mode); // Debug click
    
    // Remove active class from all
    if(choiceAccept) choiceAccept.classList.remove('selected');
    if(choiceDecline) choiceDecline.classList.remove('selected');
    if(choiceCustomize) choiceCustomize.classList.remove('selected');
    
    // Add active class to clicked
    if(mode === 'accept' && choiceAccept) choiceAccept.classList.add('selected');
    if(mode === 'decline' && choiceDecline) choiceDecline.classList.add('selected');
    if(mode === 'customize' && choiceCustomize) {
      choiceCustomize.classList.add('selected');
      if(customRow) customRow.style.display = 'block';
    } else {
      if(customRow) customRow.style.display = 'none';
    }
    
    prefs.mode = mode;
  }

  // Attach Listeners safely
  if(choiceAccept) choiceAccept.addEventListener('click', () => setChoice('accept'));
  if(choiceDecline) choiceDecline.addEventListener('click', () => setChoice('decline'));
  if(choiceCustomize) choiceCustomize.addEventListener('click', () => setChoice('customize'));

  // 4. CONTINUE BUTTON (Save & Transition)
  btnContinue.addEventListener('click', async () => {
    console.log("👉 Continue Clicked. Mode:", prefs.mode);

    if(!prefs.mode) {
      alert("Please select a cookie choice first.");
      return;
    }
    
    // A. Save Locally
    localStorage.setItem('ctb_prefs', JSON.stringify(prefs));

    // B. Save to Firebase
    if (currentUser && db) {
      try {
        console.log("Attempting to save to DB...");
        await setDoc(doc(db, "users", currentUser.uid), {
          cookiePreference: prefs.mode,
          lastActive: new Date().toISOString()
        }, { merge: true });
        console.log("✅ Saved to Firestore!");
      } catch (e) {
        console.error("❌ Database Write Failed:", e);
        // We do NOT stop the transition if DB fails, so the app still 'works'
      }
    } else {
      console.warn("Skipping DB save: No User or DB connection.");
    }

    // C. Visual Transition
    if(screen1 && screen2) {
      screen1.classList.add('hidden'); 
      screen1.classList.remove('visible');
      screen2.classList.remove('hidden'); 
      screen2.classList.add('visible');
    }
  });

  // 5. BACK BUTTON
  if(btnBack) {
    btnBack.addEventListener('click', () => {
      screen2.classList.add('hidden'); 
      screen2.classList.remove('visible');
      screen1.classList.remove('hidden'); 
      screen1.classList.add('visible');
    });
  }
  
  // 6. Particle Background (Visuals)
});
 initParticles();


function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  let particles = [];
  
  function resize() { 
    W = canvas.width = window.innerWidth; 
    H = canvas.height = window.innerHeight; 
    particles = Array.from({length:40}, () => ({x:Math.random()*W, y:Math.random()*H, r:Math.random()*2, s:Math.random()*0.5, o:Math.random()*0.5})); 
  }
  
  function draw() { 
    ctx.clearRect(0, 0, W, H); 
    particles.forEach(p => { 
      ctx.globalAlpha = p.o; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fillStyle = '#bfefff'; ctx.fill(); 
      p.y -= p.s; if (p.y < 0) p.y = H; 
    }); 
    requestAnimationFrame(draw); 
  }
  
  window.addEventListener('resize', resize); 
  resize(); 
  draw();
}