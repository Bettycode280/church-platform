// ==========================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDhLq4p_W0ArYVXYHmOZbsuyyvLqWde6js",
    authDomain: "glorywheels-507df.firebaseapp.com",
    projectId: "glorywheels-507df",
    storageBucket: "glorywheels-507df.firebasestorage.app",
    messagingSenderId: "369831733781",
    appId: "1:369831733781:web:a7402fd123de519d7e3c1c"
};
    if (typeof firebase !== 'undefined') {
        safeDb = firebase.firestore();
    }
    console.error("Firebase running offline mode:", e);

// ==========================================
// 2. UNLOCK ENGINE & DRAWER CONTROLS
// ==========================================
function checkPass() {
    const passwordInput = document.getElementById('pass-input');
    const loginOverlay = document.getElementById('login-overlay');
    const sideNav = document.getElementById('side-nav');
    
    if (!passwordInput || !loginOverlay || !sideNav) return;

    const rawValue = passwordInput.value || "";
    const userEnteredKey = rawValue.replace(/\s+/g, '').toUpperCase(); 

    if (userEnteredKey === "DLCC2026") {
        // Closes login security gate modal layout
        loginOverlay.classList.remove('open');
        
        // Slide out the control pane immediately using your style configurations
        sideNav.classList.add('open');
        console.log("Mission UI unlocked.");
    } else {
        alert("ACCESS DENIED: Unauthorized Security Key.");
        passwordInput.value = ""; 
    }
}

function toggleMenu() { 
    const nav = document.getElementById('side-nav');
    if (nav) {
        nav.classList.toggle('open'); 
    }
}

// ==========================================
// 3. FIRESTORE TRANS-ACTIONS
// ==========================================
async function updateSermon() {
    const topicInput = document.getElementById('sermon-input');
    if (!topicInput || !safeDb) return;
    
    const titleToSend = topicInput.value ? topicInput.value.trim() : ""; 
    try {
        await safeDb.collection("churchSettings").doc("live_topic").set({ 
            title: titleToSend, 
            time: firebase.firestore.FieldValue.serverTimestamp() 
        });
        alert(titleToSend === "" ? "Broadcast Reset." : "Update Sent Live!");
    } catch (error) {
        alert("Update failed. Running offline environment.");
    }
}

function loadPrayers() {
    const list = document.getElementById('prayer-list');
    if (!list || !safeDb) return;
    try {
        safeDb.collection("churchPrayers").orderBy("time", "desc").onSnapshot(snap => {
            list.innerHTML = "";
            snap.forEach(doc => {
                const data = doc.data();
                list.innerHTML += `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 4px; border-left: 4px solid #D4AF37; margin-bottom: 10px; text-align: left;">
                        <small style="color:#D4AF37; font-weight:bold;">${data.type || 'REQUEST'}</small>
                        <p style="margin: 2px 0; font-size: 0.95rem;"><strong>${data.name || 'Anonymous'}</strong></p>
                        <p style="margin: 0; color: #ccc; font-size: 0.85rem;">${data.text || ''}</p>
                    </div>`;
            });
        });
    } catch (err) {
        console.warn(err);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('prayer-list')) loadPrayers();
});

// ==========================================
// 4. LIVE FEED PRAYER DATA READS
// ==========================================
function loadPrayers() {
    const list = document.getElementById('prayer-list');
    if (!list || !safeDb) return;

    try {
        safeDb.collection("churchPrayers").orderBy("time", "desc").onSnapshot(snap => {
            list.innerHTML = "";
            snap.forEach(doc => {
                const data = doc.data();
                list.innerHTML += `
                    <div class="request-card" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 4px; border-left: 4px solid #D4AF37; margin-bottom: 10px;">
                        <small style="color:#D4AF37; font-weight:bold;">${data.type || 'REQUEST'}</small>
                        <p style="margin: 5px 0;"><strong>${data.name || 'Anonymous'}</strong></p>
                        <p style="margin: 5px 0; color: #ccc;">${data.text || ''}</p>
                    </div>`;
            });
        }, error => {
            console.error("Firestore real-time sync stream failed:", error);
        });
    } catch (err) {
        console.error("Failed to setup real-time prayer listener:", err);
    }
}

// ==========================================
// 5. SECURE SAFE EXECUTION RUNNERS
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('prayer-list')) {
        loadPrayers();
    }
});