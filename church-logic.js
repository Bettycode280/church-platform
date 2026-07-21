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
    // Checks both possible IDs from your screenshots
    const nav = document.getElementById('side-nav') || document.getElementById('side-menu');
    if (nav) {
        nav.classList.toggle('open'); 
    }
}

function openModal(id) { 
    const nav = document.getElementById('side-nav') || document.getElementById('side-menu');
    if (nav) nav.classList.remove('open'); // Close menu first
    
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open'); 
}

// ==========================================
// 3. MISSION CONTROL SECURITY
// ==========================================

function checkPass() {
    const input = document.getElementById('pass-input').value;
    // Your updated password
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
            
            // 1. Update text to uppercase
            broadcastTag.innerText = "🚨 LIVE NOW: " + sermonTitle.toUpperCase();
            
            // 2. Turn on RED and FLASHING styles
            broadcastTag.classList.add('red-alert');
            
            // 3. Play the Sound
            if (alertSound) {
                alertSound.play().catch(e => console.log("Sound blocked by browser until user clicks."));
            }
        } else {
            // 4. RESET to Normal
            broadcastTag.innerText = "CONNECTING TO MISSION...";
            broadcastTag.classList.remove('red-alert'); // Kills the blinking
            
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
    
    // This allows an empty topic to be sent, which stops the Red Alert
    const titleToSend = topic ? topic : ""; 

    try {
        await db.collection("churchSettings").doc("live_topic").set({ 
            title: titleToSend, 
            time: firebase.firestore.FieldValue.serverTimestamp() 
        });
        
        if (titleToSend === "") {
            // This confirms the "End Broadcast" worked
            alert("Broadcast Ended. All congregant screens reset.");
        } else {
            // This confirms a new "Live" topic was sent
            alert("Update Sent! All 1,500 phones updated.");
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

async function submitBooking() {
    const name = document.getElementById('b_name').value;
    const day = document.getElementById('b_day').value;
    const time = document.getElementById('b_time').value;
    if(!name) return alert("Name required.");
    
    await db.collection("churchPrayers").add({ 
        type: "APPOINTMENT", 
        name, 
        text: `${day} at ${time}`, 
        time: firebase.firestore.FieldValue.serverTimestamp() 
    });
    alert("Request Sent."); 
    closeModals();
}

function loadPrayers() {
    const list = document.getElementById('prayer-list');
    if (!list) return;

    db.collection("churchPrayers").orderBy("time", "desc").onSnapshot(snap => {
        list.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            const docId = doc.id; // Get the unique document ID for deletion
            
            // UPDATED: Added a flex container wrap and a premium delete button action layout
            list.innerHTML += `
                <div class="request-card" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                    <div style="flex-grow: 1; padding-right: 15px;">
                        <small style="color:#D4AF37; font-weight:bold;">${data.type}</small>
                        <p style="margin: 4px 0;"><strong>${data.name}</strong></p>
                        <p style="margin: 0; opacity: 0.9;">${data.text}</p>
                    </div>
                    <button class="delete-feed-btn" onclick="deleteFeedItem('${docId}')" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">Delete</button>
                </div>`;
        });
    });
}

// NEW FUNCTION: Enables Pastor to wipe old items out of the churchPrayers data model feed
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