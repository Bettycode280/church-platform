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
// This function builds the cards the congregants see
function createSleekGrid(availabilityData) {
    const container = document.getElementById('availability-grid');
    container.innerHTML = ''; // Fresh start

    // Loop through our 9-5 hours
    const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

    hours.forEach(hour => {
        const status = availabilityData[hour] || 'available';
        
        // Create the card element
        const card = `
            <div class="time-card ${status}">
                <span class="status-dot"></span>
                <span class="time-label">${hour}</span>
                <span class="status-text">${status.toUpperCase()}</span>
            </div>
        `;
        container.innerHTML += card;
    });
function openModal(id) { 
    // 1. Close the navigation menu first
    const nav = document.getElementById('side-nav') || document.getElementById('side-menu');
    if (nav) nav.classList.remove('open'); 
    
    // 2. Find the modal we want to open
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('open'); 

        // 3. ✨ NEW: Check if this is the appointment modal
        if (id === 'booking-modal') {
            loadLiveAvailability(); // <--- Changed this line!
        }
    }
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
// ==========================================
// 4. DATA SUBMISSION & DASHBOARD
// ==========================================

async function submitBooking() {
    const name = document.getElementById('b_name').value;
    const day = document.getElementById('b_day').value;
    const time = document.getElementById('b_time').value;

    if (!name) return alert("Name required.");

    try {
        await db.collection("churchPrayers").add({ 
            type: "APPOINTMENT", 
            name, 
            text: `${day} at ${time}`, 
            time: firebase.firestore.FieldValue.serverTimestamp() 
        });

        alert("Request Sent."); 
        closeModals();
    } catch (error) {
        console.error("Error sending request: ", error);
        alert("Something went wrong. Please try again.");
    }
}
    

// ==========================================
// 5. NOTIFICATION LISTENERS
// ==========================================

function listenForUpdates(requestId) {
    db.collection("churchPrayers").doc(requestId)
        .onSnapshot((doc) => {
            const data = doc.data();
            // This checks if the Pastor has changed the status
            if (data && data.status !== "pending") {
                showSleekNotification(data.status);
            }
        });
}

function showSleekNotification(status) {
    // We will build the visual pop-up logic here next
    console.log("Status updated to: " + status);
    alert("Pastor has updated your request to: " + status);
}
// This function listens to Firebase and builds the grid with colors
function loadLiveAvailability() {
    const grid = document.getElementById('availability-grid');
    if (!grid) return;

    db.collection("pastorSchedule").orderBy("hour", "asc").onSnapshot(snap => {
        grid.innerHTML = ""; // Clear the grid
        
        snap.forEach(doc => {
            const data = doc.data();
            const status = data.status.toLowerCase(); 
            
            // This is where we set the color class based on status
            const card = document.createElement('div');
            card.className = `time-card ${status}`; // Will be 'available', 'busy', or 'away'
            
            card.innerHTML = `
                <div class="status-dot"></div>
                <span class="time-label">${data.displaytime}</span>
                <span class="status-text">${status.toUpperCase()}</span>
            `;
            
            // Make it clickable so it fills the booking form automatically
            card.onclick = () => {
                if(status === 'available') {
                    document.getElementById('b_time').value = data.displaytime;
                    alert("Selected " + data.displaytime);
                } else {
                    alert("This slot is " + status + ". Please choose a green slot.");
                }
            };

            grid.appendChild(card);
        });
    });
}

// Simple helper to make the time look pretty
function formatTime(hour) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
}
async function treatRequest(requestId) {
    try {
        // Targets the specific document to update it
        await db.collection("churchPrayers").doc(requestId).update({
            status: "treated",
            treatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Mission updated: Item archived.");
    } catch (error) {
        console.error("Error treating request: ", error);
        alert("Action failed. Check connection.");
    }
}
function loadPrayers() {
    const list = document.getElementById('prayer-list');
    if (!list) return;

    // We keep your descending order by time
    db.collection("churchPrayers").orderBy("time", "desc").onSnapshot(snap => {
        list.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            
            // Only show if status is NOT 'treated'
            if (data.status !== "treated") {
                list.innerHTML += `
                    <div class="request-card" style="border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 15px;">
                        <small class="gold-text">${data.type}</small>
                        <p class="form-hint" style="color: var(--velvet-blue); font-size: 1.8rem; font-weight: 800;">${data.name}</p>
                        <p class="form-hint" style="color: var(--velvet-blue); font-size: 1.2rem;">${data.text}</p>
                        
                        <button onclick="treatRequest('${doc.id}')" 
                                style="background: var(--gold-solid); color: #0A1128; border: none; padding: 10px 20px; cursor: pointer; font-weight: 900; margin-top: 10px; border-radius: 4px;">
                            DONE / ARCHIVE
                        </button>
                    </div>`;
            }
        });
    });
}

}