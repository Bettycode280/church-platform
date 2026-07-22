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
    const nav = document.getElementById('side-menu');
    if (nav) {
        nav.classList.toggle('open'); 
    }

}

function openModal(id) { 
    const nav = document.getElementById('side-menu');
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

let selectedDayValue = "Monday";

function selectDay(day, buttonElement) {
    selectedDayValue = day;
    document.getElementById('b_day').value = day;

    // Remove active highlight from all day buttons
    const buttons = document.querySelectorAll('.day-btn');
    buttons.forEach(btn => {
        btn.style.background = "rgba(255,255,255,0.08)";
        btn.style.borderColor = "rgba(212,175,55,0.3)";
    });

    // Highlight the clicked button in gold
    buttonElement.style.background = "rgba(212, 175, 55, 0.25)";
    buttonElement.style.borderColor = "#D4AF37";
}

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

// Function to submit prayer requests from congregants
async function submitPrayer() {
    const nameInput = document.getElementById('p_name');
    const msgInput = document.getElementById('p_msg');

    if (!nameInput || !msgInput || !nameInput.value.trim() || !msgInput.value.trim()) {
        alert("Please fill all fields.");
        return;
    }

    try {
        await db.collection("churchPrayers").add({ 
            type: "PRAYER", 
            name: nameInput.value.trim(), 
            text: msgInput.value.trim(), 
            time: firebase.firestore.FieldValue.serverTimestamp() 
        });
        
        alert("Sent to Pastor."); 
        closeModals();
        
        nameInput.value = "";
        msgInput.value = "";
    } catch (error) {
        console.error("Error submitting prayer: ", error);
        alert("Failed to send prayer request. Please check your connection.");
    }
}

// Function to submit booking with real-time tracker initialization
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

    const userName = nameInput.value.trim();

    try {
        await db.collection("churchPrayers").add({ 
            type: "APPOINTMENT", 
            name: userName, 
            email: emailInput ? emailInput.value.trim() : "",
            phone: phoneInput ? phoneInput.value.trim() : "",
            text: `${dayInput ? dayInput.value : "Monday"} at ${timeInput ? timeInput.value : "14:00"}`, 
            status: "Pending", 
            time: firebase.firestore.FieldValue.serverTimestamp() 
        });
        
        // Save name locally so the app remembers who you are
        localStorage.setItem('church_user_name', userName);

        alert("Request Sent."); 
        closeModals();
        
        // Start watching status immediately
        watchMyAppointment(userName);

    } catch (error) {
        console.error("Error submitting booking: ", error);
        alert("Failed to send request. Please try again.");
    }
}

// Single, clean real-time status listener function
function watchMyAppointment(userName) {
    if (!userName) return;

    db.collection("churchPrayers")
        .where("name", "==", userName)
        .where("type", "==", "APPOINTMENT")
        .onSnapshot((snapshot) => {
            const statusElement = document.getElementById("my-appointment-status");
            if (!statusElement) return;

            if (snapshot.empty) {
                statusElement.innerHTML = `<p style="color: #aaa; font-size: 13px;">No active appointment found.</p>`;
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                let statusColor = "#f39c12"; // Pending (Orange)
                if (data.status === "Accepted") statusColor = "#2ecc71"; // Green
                if (data.status === "Rejected") statusColor = "#e74c3c"; // Red
                if (data.status === "Rescheduled") statusColor = "#3498db"; // Blue

                statusElement.innerHTML = `
                    <div style="border: 1.5px solid ${statusColor}; background: rgba(212, 175, 55, 0.08); padding: 12px; border-radius: 8px; margin-top: 15px; color: #fff; text-align: left;">
                        <p style="margin: 0 0 4px 0;"><strong>Requested Time:</strong> ${data.text}</p>
                        <p style="margin: 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${data.status}</span></p>
                    </div>
                `;
            });
        });
}

// Automatically check status on page load if user already booked before
window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('church_user_name');
    if (savedName) {
        watchMyAppointment(savedName);
    }
});

// Function to update appointment status (Accept / Reject)
async function updateAppointmentStatus(docId, newStatus) {
    try {
        await db.collection("churchPrayers").doc(docId).update({
            status: newStatus
        });
        console.log(`Appointment status updated to: ${newStatus}`);
    } catch (error) {
        console.error("Error updating status: ", error);
        alert("Failed to update status.");
    }
}

// Function to reschedule an appointment
async function rescheduleAppointment(docId) {
    const newDay = prompt("Enter new day (e.g., Tuesday):");
    const newTime = prompt("Enter new time (e.g., 15:30):");
    
    if (!newDay || !newTime) return;

    try {
        await db.collection("churchPrayers").doc(docId).update({
            text: `${newDay} at ${newTime}`,
            status: "Rescheduled"
        });
        alert("Appointment rescheduled successfully.");
    } catch (error) {
        console.error("Error rescheduling: ", error);
        alert("Failed to reschedule.");
    }
}

function loadPrayers() {
    const list = document.getElementById('prayer-list');
    if (!list) return;

    db.collection("churchPrayers").orderBy("time", "desc").onSnapshot(snap => {
        list.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            const docId = doc.id;
            
            let detailsContent = "";
            let actionButtons = "";

            if (data.type === "APPOINTMENT") {
                const currentStatus = data.status || "Pending";
                let statusColor = "#f39c12"; // Pending (Orange)
                if (currentStatus === "Accepted") statusColor = "#2ecc71"; // Green
                if (currentStatus === "Rejected") statusColor = "#e74c3c"; // Red
                if (currentStatus === "Rescheduled") statusColor = "#3498db"; // Blue

                detailsContent = `
                    <p style="margin: 4px 0;"><strong>Name:</strong> ${data.name}</p>
                    <p style="margin: 2px 0; font-size: 13px; color: #D4AF37;">📧 <strong>Email:</strong> ${data.email || 'N/A'}</p>
                    <p style="margin: 2px 0; font-size: 13px; color: #D4AF37;">☎️ <strong>Phone:</strong> ${data.phone || 'N/A'}</p>
                    <p style="margin: 4px 0; opacity: 0.9;">📅 <strong>Requested:</strong> ${data.text}</p>
                    <p style="margin: 4px 0 8px 0; font-size: 12px;">Status: <span style="color: ${statusColor}; font-weight: bold;">${currentStatus}</span></p>
                `;

                actionButtons = `
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button onclick="updateAppointmentStatus('${docId}', 'Accepted')" style="background: #2ecc71; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 650;">Accept</button>
                        <button onclick="updateAppointmentStatus('${docId}', 'Rejected')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 650;">Reject</button>
                        <button onclick="rescheduleAppointment('${docId}')" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 650;">Reschedule</button>
                        <button onclick="deleteFeedItem('${docId}')" style="background: #555; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 650;">Delete</button>
                    </div>
                `;
            } else {
                detailsContent = `
                    <p style="margin: 4px 0;"><strong>Name:</strong> ${data.name}</p>
                    <p style="margin: 0 0 8px 0; opacity: 0.9;">${data.text}</p>
                `;
                actionButtons = `
                    <button onclick="deleteFeedItem('${docId}')" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">Delete</button>
                `;
            }

            list.innerHTML += `
                <div class="request-card" style="margin-bottom: 12px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                    <div style="margin-bottom: 8px;">
                        <small style="color:#D4AF37; font-weight:bold;">${data.type}</small>
                        ${detailsContent}
                    </div>
                    ${actionButtons}
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
// --- OTHER PREVIOUS FUNCTIONS IN church-logic.js ---

function messageIndividualWhatsApp(phoneNumber, memberName) {
    const customMessage = document.getElementById('wa_quick_message').value.trim();
    const textToSend = customMessage ? customMessage : `Hello ${memberName}, God bless you! Checking in from the church.`;
    const encodedMessage = encodeURIComponent(textToSend);
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
}


// --- PASTE THE LIVE FEED CODE RIGHT HERE AT THE BOTTOM ---

function loadAdminLiveFeed() {
    if (typeof firebase === 'undefined') return;
    
    const db = firebase.firestore();
    const prayerListContainer = document.getElementById('prayer-list');
    
    if (!prayerListContainer) return;

    db.collection("prayers_or_messages")
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
          prayerListContainer.innerHTML = "";
          
          if (snapshot.empty) {
              prayerListContainer.innerHTML = '<p style="opacity: 0.3; margin-top: 20px;">Waiting for mission data...</p>';
              return;
          }

          snapshot.forEach((doc) => {
              const data = doc.data();
              const itemCard = document.createElement('div');
              itemCard.style.cssText = "background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.3); padding: 12px; border-radius: 8px; margin-bottom: 10px; text-align: left;";
              
              itemCard.innerHTML = `
                  <strong style="color: var(--gold-solid); font-size: 0.85rem; display: block; margin-bottom: 4px;">${data.name || 'Anonymous Member'}</strong>
                  <p style="color: #fff; font-size: 0.9rem; margin: 0;">${data.message || data.prayer || 'No message content'}</p>
              `;
              
              prayerListContainer.appendChild(itemCard);
          });
      }, (error) => {
          console.error("Error loading live feed: ", error);
          prayerListContainer.innerHTML = '<p style="color: #ff4444; margin-top: 20px;">Error syncing live feed data.</p>';
      });
}

document.addEventListener("DOMContentLoaded", () => {
    loadAdminLiveFeed();
});