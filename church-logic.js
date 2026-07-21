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
// Function to open any modal by its ID
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
    } else {
        console.error("Modal not found with ID: " + modalId);
    }
}

// Function to close all active modals
function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('open');
    });
}

function openLive() {
    window.open("https://youtube.com/@DivineLifeChristianCentre/live", "_blank");
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

// Hypothesis 2: Add try...catch to submitPrayer() to handle network or permission errors safely
async function submitPrayer() {
    const name = document.getElementById('p_name').value;
    const text = document.getElementById('p_msg').value;
    if(!name || !text) return alert("Fill all fields.");
    
    try {
        await db.collection("churchPrayers").add({
            type: "PRAYER",
            name,
            text,
            time: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Sent to Pastor.");

        document.getElementById("p_name").value = "";
        document.getElementById("p_msg").value = "";

        closeModals();

    } catch (error) {
        console.error(error);
        alert("Unable to send prayer request.");
    }
}

// Hypothesis 1: Add try...catch to submitBooking() and save with separated fields and optional email
async function submitBooking() {
    const name = document.getElementById('b_name').value;
    const email = document.getElementById('b_email').value;
    const phone = document.getElementById('b_phone').value;
    const day = document.getElementById('b_day').value;
    const time = document.getElementById('b_time').value;
    const purpose = document.getElementById('b_purpose').value;
    
    // Validates that required fields are filled (email is optional)
    if(!name || !phone || !purpose) return alert("Please fill all required appointment fields.");
    
    try {
        await db.collection("appointments").add({
            type: "APPOINTMENT",
            name: name,
            phone: phone,
            email: email,
            purpose: purpose,
            day: day,
            appointmentTime: time,
            status: "Pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Request Sent.");

        // Clear out the form fields after successful submission
        document.getElementById("b_name").value = "";
        document.getElementById("b_email").value = "";
        document.getElementById("b_phone").value = "";
        document.getElementById("b_day").selectedIndex = 0;
        document.getElementById("b_time").value = "14:00";
        document.getElementById("b_purpose").selectedIndex = 0;

        closeModals();

    } catch (error) {
        console.error(error);
        alert("Unable to submit appointment.");
    }
}

// Hypothesis 3: Avoid nested snapshot listeners by managing separate cache states and a unified renderer
let prayersCache = [];
let appointmentsCache = [];

function loadPrayers() {
    const list = document.getElementById('prayer-list');
    if (!list) return;

    function renderCombinedFeed() {
        list.innerHTML = "";
        let items = [];

        prayersCache.forEach(doc => {
            items.push({ 
                id: doc.id, 
                collection: "churchPrayers", 
                ...doc.data(), 
                timeField: doc.data().time 
            });
        });

        appointmentsCache.forEach(doc => {
            const data = doc.data();
            items.push({ 
                id: doc.id, 
                collection: "appointments", 
                type: "APPOINTMENT",
                name: data.name,
                email: data.email,
                phone: data.phone,
                text: `Purpose: ${data.purpose ? data.purpose.toUpperCase() : ''} | Day: ${data.day} at ${data.appointmentTime}`,
                timeField: data.createdAt 
            });
        });

        // Sort combined feeds chronologically descending
        items.sort((a, b) => {
            if (!a.timeField) return 1;
            if (!b.timeField) return -1;
            return b.timeField.toMillis() - a.timeField.toMillis();
        });

        items.forEach(data => {
            list.innerHTML += `
                <div class="request-card" id="${data.id}" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                    <div style="flex-grow: 1; padding-right: 15px; word-break: break-word; overflow-wrap: break-word; white-space: normal;">
                        <small style="color:#D4AF37; font-weight:bold;">${data.type}</small>
                        <p style="margin: 4px 0; word-break: break-word; overflow-wrap: break-word;"><strong>${data.name}</strong></p>
                        ${data.email ? `<p style="margin: 2px 0; font-size: 13px; opacity: 0.8;">Email: ${data.email}</p>` : ''}
                        ${data.phone ? `<p style="margin: 2px 0; font-size: 13px; opacity: 0.8;">Phone: ${data.phone}</p>` : ''}
                        <p style="margin: 4px 0 0 0; opacity: 0.9; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap;">${data.text}</p>
                    </div>
                    <button class="delete-feed-btn" onclick="deleteFeedItem('${data.id}', '${data.collection}')" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; flex-shrink: 0;">Delete</button>
                </div>`;
        });
    }

    // Independent top-level snapshot listeners
    db.collection("churchPrayers").orderBy("time", "desc").onSnapshot(prayerSnap => {
        prayersCache = prayerSnap.docs;
        renderCombinedFeed();
    });

    db.collection("appointments").orderBy("createdAt", "desc").onSnapshot(apptSnap => {
        appointmentsCache = apptSnap.docs;
        renderCombinedFeed();
    });
}

// Delete function handles correct collection routing dynamically
async function deleteFeedItem(id, collectionName) {
    try {
        const targetCollection = collectionName ? collectionName : "churchPrayers";
        console.log("Deleting document:", id, "from collection:", targetCollection);

        await db.collection(targetCollection).doc(id).delete();

        console.log("Document deleted successfully.");
        alert("Deleted successfully!");

    } catch (error) {
        console.error("DELETE ERROR:", error);
        alert("Delete failed:\n" + error.message);
    }
}