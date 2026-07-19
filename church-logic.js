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

function closeModals() { 
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('open')); 
}

// ==========================================
// 3. LIVE SERMON BROADCAST (RED ALERT)
// ==========================================
const broadcastTag = document.getElementById('broadcast-tag');
const alertSound = document.getElementById('alert-sound');

// Runs automatically on page load now
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
            list.innerHTML += `
                <div class="request-card">
                    <small style="color:#D4AF37; font-weight:bold;">${data.type}</small>
                    <p><strong>${data.name}</strong></p>
                    <p>${data.text}</p>
                </div>`;
        });
    }, error => {
        console.error("Prayer feed connection error: ", error);
    });
}

// ==========================================
// 5. INITIALIZATION RUNNERS
// ==========================================
// Auto-start data feeds immediately upon loading the page
loadPrayers();
startSermonListener();

