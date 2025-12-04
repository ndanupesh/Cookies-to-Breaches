/* userdashboard.js - Matched Logic & IDs */

// 1. IMPORT FIREBASE
import { auth, db } from '../../firebase.js'; 
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

console.log("🚀 Userdashboard Script Starting...");

// Global Variables
let prefs = { mode: null };
let currentUser = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM Loaded. Initializing...");

    if(window.lucide) window.lucide.createIcons();
    initParticles();
    setInterval(updateClock, 1000);

    // 3. Listen for User Login
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log("👤 User active:", user.email);
            updateProfileUI(user);
            await ensureUserInDB(user);
        } else {
            console.log("⚠️ No user logged in (Guest Mode)");
        }
    });

    setupCookieLogic();
    setupDashboardLinks();
    setupDropdown();
});

// --- NEW HELPER: ENSURE DB RECORD EXISTS ---
async function ensureUserInDB(user) {
    if (!db) return;
    try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
            email: user.email,
            lastSeen: new Date().toISOString(),
            uid: user.uid
        }, { merge: true });
        console.log("✅ Database record confirmed.");
    } catch (e) {
        console.error("❌ Firestore Error:", e);
    }
}

// --- CORE LOGIC: COOKIE SELECTION ---
function setupCookieLogic() {
    // IMPORTANT: These IDs match the HTML provided
    const cardAccept = document.getElementById('choice-accept');
    const cardDecline = document.getElementById('choice-decline');
    const cardCustom = document.getElementById('choice-custom');
    
    const customOptions = document.getElementById('custom-options');
    const btnWrapper = document.getElementById('continue-wrapper');
    const btnContinue = document.getElementById('btnContinue');

    function handleSelection(selectedCard, mode) {
        console.log("👉 Option Selected:", mode);
        prefs.mode = mode;

        [cardAccept, cardDecline, cardCustom].forEach(c => {
            if(c) c.classList.remove('selected');
        });
        if(selectedCard) selectedCard.classList.add('selected');

        if (mode === 'customize') {
            customOptions.classList.remove('hidden');
            if(window.gsap) {
                gsap.fromTo(customOptions, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.3 });
            } else {
                customOptions.style.display = 'block';
            }
        } else {
            customOptions.classList.add('hidden');
        }

        if(btnWrapper) btnWrapper.classList.remove('opacity-50', 'pointer-events-none');
    }

    if(cardAccept) cardAccept.addEventListener('click', () => handleSelection(cardAccept, 'accept'));
    if(cardDecline) cardDecline.addEventListener('click', () => handleSelection(cardDecline, 'decline'));
    if(cardCustom) cardCustom.addEventListener('click', () => handleSelection(cardCustom, 'customize'));

    if(btnContinue) {
        btnContinue.addEventListener('click', async () => {
            console.log("👉 Continue Clicked.");

            if(!prefs.mode) {
                alert("Please select a cookie choice first.");
                return;
            }

            // 1. Force LocalStorage Update
            localStorage.removeItem('ctb_prefs'); 
            localStorage.setItem('ctb_prefs', JSON.stringify(prefs));

            // 2. Save Preference to Firebase
            if (currentUser && db) {
                const originalText = btnContinue.innerText;
                btnContinue.innerText = "Saving...";
                try {
                    await setDoc(doc(db, "users", currentUser.uid), {
                        cookiePreference: prefs.mode,
                        dashboardInitialized: true,
                        lastActive: new Date().toISOString()
                    }, { merge: true });
                    console.log("✅ Preferences saved!");
                } catch (e) {
                    console.error("❌ Write Failed:", e);
                }
                btnContinue.innerText = originalText;
            }

           

            transitionToDashboard();
        });
    }
}

// --- CORE LOGIC: DASHBOARD LINKS ---
function setupDashboardLinks() {
    const bsim = document.getElementById('module-bsim');
    const map = document.getElementById('module-map');
    const learn = document.getElementById('module-learn');

    // Assumes files are in the same folder as userdashboard.html
    if(bsim) bsim.addEventListener('click', () => window.location.href = 'bsim.html');
    if(map) map.addEventListener('click', () => window.location.href = 'visualmap.html');
    if(learn) learn.addEventListener('click', () => window.location.href = 'learning.html');
}

// --- VISUALS: TRANSITION ANIMATION ---
function transitionToDashboard() {
    if(window.gsap) {
        const tl = gsap.timeline();
        tl.to("#stage-config", {
            opacity: 0,
            scale: 0.9,
            filter: "blur(10px)",
            duration: 0.6,
            ease: "power2.in",
            onComplete: () => {
                document.getElementById('stage-config').classList.add('hidden');
                document.getElementById('stage-dashboard').classList.remove('hidden');
            }
        })
        .to("#stage-dashboard", { opacity: 1, duration: 0 })
        .fromTo(".dash-card", 
            { opacity: 0, y: 50, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: "back.out(1.2)" }
        );
    } else {
        document.getElementById('stage-config').classList.add('hidden');
        document.getElementById('stage-dashboard').classList.remove('hidden');
    }
}

// --- UI HELPERS ---
function updateProfileUI(user) {
    const nameDisplay = document.getElementById('nav-username');
    const emailDisplay = document.getElementById('nav-email');
    const displayName = user.displayName || user.email.split('@')[0];
    
    if(nameDisplay) nameDisplay.textContent = displayName;
    if(emailDisplay) emailDisplay.textContent = user.email;
}

function setupDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    if(profileBtn && userDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => window.location.href = '../../index.html');
        });
    }
}

function updateClock() {
    const clock = document.getElementById('clock');
    if(clock) clock.textContent = new Date().toLocaleTimeString();
}

function initParticles() {
    const canvas = document.getElementById('bgCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2,
        color: Math.random() > 0.5 ? '#d946ef' : '#22d3ee'
    }));

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if(p.x < 0) p.x = width; if(p.x > width) p.x = 0;
            if(p.y < 0) p.y = height; if(p.y > height) p.y = 0;
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}