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

// Initialize Firebase
if (!firebase.apps.length) { 
    firebase.initializeApp(firebaseConfig); 
}
const db = firebase.firestore();

// ==========================================
// 2. NAVIGATION & UI CONTROLS
// ==========================================

function toggleMenu() { 
    const nav = document.getElementById('side-nav') || document.getElementById('side-menu') || document.querySelector('.nav-overlay');
    if (nav) {
        nav.classList.toggle('open'); 
    }
}

function openModal(id) { 
    const nav = document.getElementById('side-nav') || document.getElementById('side-menu') || document.querySelector('.nav-overlay');
    if (nav) nav.classList.remove('open'); // Close menu first
    
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open'); 
}

// Function to close all open modals
function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('open');
    });
}

// Function to submit the booking data to Firestore (Includes Email & Phone)
async function submitBooking() {
    const nameInput = document.getElementById('b_name');
    const emailInput = document.getElementById('b_email');
    const phoneInput = document.getElementById('b_phone');
    const dayInput = document.getElementById('b_day');
    const timeInput = document.getElementById('b_time');

    if (!nameInput || !nameInput.value.trim()) {
        alert("Name required.");
        return;
    }

    try {
        await db.collection("churchPrayers").add({ 
            type: "APPOINTMENT", 
            name: nameInput.value.trim(), 
            email: emailInput ? emailInput.value.trim() : "",
            phone: phoneInput ? phoneInput.value.trim() : "",
            text: `${dayInput ? dayInput.value : "Monday"} at ${timeInput ? timeInput.value : "14:00"}`, 
            time: firebase.firestore.FieldValue.serverTimestamp() 
        });
        
        alert("Request Sent."); 
        closeModals();
    } catch (error) {
        console.error("Error submitting booking: ", error);
        alert("Failed to send request. Please try again.");
    }
}

// ==========================================
// 3. MISSION CONTROL SECURITY
// ==========================================

function checkPass() {
    const input = document.getElementById('pass-input').value;
    if (input === "DLCC2026") {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('admin-ui').style.display = 'block';
        loadPrayers(); // Load the dashboard data
        console.log("Mission Control Unlocked.");
    } else { 
        alert("Unauthorized Key."); 
    }
}

// ==========================================
// 4. LIVE SERMON BROADCAST (RED ALERT)
// ==========================================
const broadcastTag = document.getElementById('broadcast-tag');
const alertSound = document.getElementById('alert-sound');

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
    });
}

// ==========================================
// 5. DATA SUBMISSION & DASHBOARD
// ==========================================

async function updateSermon() {
    const topic = document.getElementById('sermon-input').value;
    const titleToSend = topic ? topic : ""; 

    try {
        await db.collection("churchSettings").doc("live_topic").set({ 
            title: titleToSend, 
            time: firebase.firestore.FieldValue.serverTimestamp() 
        });
        
        if (titleToSend === "") {
            alert("Broadcast Ended. All congregant screens reset.");
        } else {
            alert("Update Sent!");
        }
    } catch (error) {
        console.error("Error updating sermon: ", error);
        alert("Mission Update Failed. Check Connection.");
    }
}

async function submitPrayer() {
    const name = document.getElementById('p_name').value;
    const text = document.getElementById('p_msg').value;
    if(!name || !text) return alert("Fill all fields.");
    
    await db.collection("churchPrayers").add({ 
        type: "PRAYER", 
        name, 
        text, 
        time: firebase.firestore.FieldValue.serverTimestamp() 
    });
    alert("Sent to Pastor."); 
    closeModals();
}

function loadPrayers() {
    const list = document.getElementById('prayer-list');
    if (!list) return;

    db.collection("churchPrayers").orderBy("time", "desc").onSnapshot(snap => {
        list.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            const docId = doc.id;
            
            // Format contact details cleanly inside the admin view feed card if present
            const contactDetails = (data.email || data.phone) ? 
                `<p style="margin: 2px 0; font-size: 13px; opacity: 0.8;">📧 ${data.email || 'N/A'} | ☎️ ${data.phone || 'N/A'}</p>` : '';

            list.innerHTML += `
                <div class="request-card" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                    <div style="flex-grow: 1; padding-right: 15px;">
                        <small style="color:#D4AF37; font-weight:bold;">${data.type}</small>
                        <p style="margin: 4px 0;"><strong>${data.name}</strong></p>
                        ${contactDetails}
                        <p style="margin: 4px 0 0 0; opacity: 0.9;">${data.text}</p>
                    </div>
                    <button class="delete-feed-btn" onclick="deleteFeedItem('${docId}')" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">Delete</button>
                </div>`;
        });
    });
}

function deleteFeedItem(docId) {
    if (confirm("Remove this item from the Mission Control feed permanently?")) {
        db.collection("churchPrayers").doc(docId).delete()
        .then(() => {
            console.log("Feed item successfully deleted.");
        })
        .catch((error) => {
            console.error("Error removing document: ", error);
            alert("Delete action failed. Check connection.");
        });
    }
}