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
// ==========================================
// 2. NAVIGATION & UI CONTROLS
// ==========================================

function checkPass() {
    const passwordInput = document.getElementById('pass-input');
    const loginOverlay = document.getElementById('login-overlay');
    const adminUi = document.getElementById('admin-ui');
    
    if (!passwordInput || !loginOverlay || !adminUi) {
        console.error("Layout target error: One or more dashboard IDs are missing from your HTML structure.");
        return;
    }

    // Force pull value directly and sanitize immediately
    const rawValue = passwordInput.value || "";
    const userEnteredKey = rawValue.replace(/\s+/g, '').toUpperCase(); 

    // Diagnostic console logs — look at your browser F12 inspection tool to view these
    console.log("Raw text received from input:", rawValue);
    console.log("Cleaned text comparing against target:", userEnteredKey);

    // Hardcoded direct validation check
    if (userEnteredKey === "DLCC2026") {
        // Force-hide the login overlay card
        loginOverlay.style.setProperty('display', 'none', 'important');
        loginOverlay.classList.remove('open');
        
        // Force-reveal the management platform interface panel
        adminUi.style.setProperty('display', 'block', 'important');
        console.log("Access Granted. Mission Control UI unlocked.");
    } else {
        alert("ACCESS DENIED: Unauthorized Security Key.");
        passwordInput.value = ""; 
    }
}

function openModal(id) { 
    const nav = document.getElementById('side-nav') || document.getElementById('side-menu');
    if (nav) nav.classList.remove('open'); // Close menu first
    
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open'); 
}

function closeModals() { 
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('open')); 
}

// ==========================================
// 3. LIVE SERMON BROADCAST (RED ALERT)
// ==========================================
const broadcastTag = document.getElementById('broadcast-tag');
const alertSound = document.getElementById('alert-sound');

function startSermonListener() {
    if (broadcastTag) {
        db.collection("churchSettings").doc("live_topic").onSnapshot(doc => {
            if (doc.exists && doc.data().title && doc.data().title.trim() !== "") { 
                const sermonTitle = doc.data().title.trim();
                
                broadcastTag.innerText = "🚨 LIVE NOW: " + sermonTitle.toUpperCase();
                broadcastTag.classList.add('red-alert');
                
                if (alertSound) {
                    alertSound.play().catch(e => console.log("Sound blocked by browser until user clicks."));
                }
            } else {
                broadcastTag.innerText = "CONNECTING TO MISSION...";
                broadcastTag.classList.remove('red-alert');
                
                if (alertSound) {
                    alertSound.pause();
                    alertSound.currentTime = 0;
                }
            }
        }, error => {
            console.error("Database stream error: Check Firebase Firestore rule access.", error);
        });
    }
}

// ==========================================
// 4. DATA SUBMISSION & DASHBOARD
// ==========================================

async function updateSermon() {
    const topicInput = document.getElementById('sermon-input');
    if (!topicInput) return;
    
    const topic = topicInput.value;
    const titleToSend = topic ? topic.trim() : ""; 

    try {
        await db.collection("churchSettings").doc("live_topic").set({ 
            title: titleToSend, 
            time: firebase.firestore.FieldValue.serverTimestamp() 
        });
        
        if (titleToSend === "") {
            alert("Broadcast Ended. All congregant screens reset.");
        } else {
            alert("Update Sent! All screens updated.");
        }
    } catch (error) {
        console.error("Error updating sermon: ", error);
        alert("Mission Update Failed. Make sure your Firestore Rules allow public writes.");
    }
}

async function submitPrayer() {
    const nameEl = document.getElementById('p_name');
    const msgEl = document.getElementById('p_msg');
    if (!nameEl || !msgEl) return;

    const name = nameEl.value.trim();
    const text = msgEl.value.trim();
    if(!name || !text) return alert("Fill all fields.");
    
    await db.collection("churchPrayers").add({ 
        type: "PRAYER", 
        name, 
        text, 
        time: firebase.firestore.FieldValue.serverTimestamp() 
    });
    alert("Sent to Pastor."); 
    nameEl.value = "";
    msgEl.value = "";
    closeModals();
}

async function submitBooking() {
    const nameEl = document.getElementById('b_name');
    const dayEl = document.getElementById('b_day');
    const timeEl = document.getElementById('b_time');
    if (!nameEl || !dayEl || !timeEl) return;

    const name = nameEl.value.trim();
    const day = dayEl.value;
    const time = timeEl.value;
    if(!name) return alert("Name required.");
    
    await db.collection("churchPrayers").add({ 
        type: "APPOINTMENT", 
        name, 
        text: `${day} at ${time}`, 
        time: firebase.firestore.FieldValue.serverTimestamp() 
    });
    alert("Request Sent."); 
    nameEl.value = "";
    closeModals();
}

function loadPrayers() {
    const list = document.getElementById('prayer-list');
    if (!list) return;

    db.collection("churchPrayers").orderBy("time", "desc").onSnapshot(snap => {
        list.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            list.innerHTML += `
                <div class="request-card">
                    <small style="color:#D4AF37; font-weight:bold;">${data.type}</small>
                    <p><strong>${data.name || 'Anonymous'}</strong></p>
                    <p>${data.text || ''}</p>
                </div>`;
        });
    }, error => {
        console.error("Prayer feed connection error: ", error);
    });
}

// ==========================================
// 5. INITIALIZATION RUNNERS
// ==========================================
if (document.getElementById('prayer-list')) {
    loadPrayers();
}
if (document.getElementById('broadcast-tag')) {
    startSermonListener();
}