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
        console.log("Firebase Engine successfully initialized.");
    }
 
    console.error("Firebase critical initialization failure, running offline mode:", e);


// ==========================================
// 2. NAVIGATION & UI CONTROLS (ISOLATED & SAFE)
// ==========================================
function checkPass() {
    console.log("UNLOG & ENTER button clicked.");
    
    const passwordInput = document.getElementById('pass-input');
    const loginOverlay = document.getElementById('login-overlay');
    const adminUi = document.getElementById('admin-ui');
    
    if (!passwordInput || !loginOverlay || !adminUi) {
        console.error("UI Layout Error: Dashboard containers are missing from the DOM.");
        alert("System Error: Layout wrapper targets not found.");
        return;
    }

    const rawValue = passwordInput.value || "";
    // Strips out all spaces and forces characters to uppercase
    const userEnteredKey = rawValue.replace(/\s+/g, '').toUpperCase(); 

    console.log("Processed input key matching check:", userEnteredKey);

    if (userEnteredKey === "DLCC2026") {
        // Remove overlay panel immediately using direct styles
        loginOverlay.style.display = 'none';
        
        // Expose management engine console view grid
        adminUi.style.display = 'block';
        console.log("Access Granted. Mission Control UI unlocked.");
    } else {
        alert("ACCESS DENIED: Unauthorized Security Key.");
        passwordInput.value = ""; 
    }
}

// ==========================================
// 3. LIVE SERMON BROADCAST ENGINE
// ==========================================
async function updateSermon() {
    const topicInput = document.getElementById('sermon-input');
    if (!topicInput) return;
    if (!safeDb) {
        alert("Database connection offline. Unable to update sermon topic.");
        return;
    }
    
    const topic = topicInput.value;
    const titleToSend = topic ? topic.trim() : ""; 

    try {
        await safeDb.collection("churchSettings").doc("live_topic").set({ 
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
        alert("Firestore transaction failed. Check security rules permissions.");
    }
}

// ==========================================
// 4. LIVE FEED PRAYER DATA READS
// ==========================================
function loadPrayers() {
    const list = document.getElementById('prayer-list');
    if (!list || !safeDb) {
        console.warn("Prayer list container or database context missing. Skipping feed hook.");
        return;
    }

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