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
    if (nav) nav.classList.remove('open');
    
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open'); 
}

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
    const inputField = document.getElementById('pass-input');
    if (!inputField) return;

    const input = inputField.value.trim();
    if (input === "DLCC2026") {
        const overlay = document.getElementById('login-overlay');
        if (overlay) overlay.style.display = 'none';

        const adminUI = document.getElementById('admin-ui');
        if (adminUI) adminUI.style.display = 'block';

        // Load dashboard data immediately upon login
        loadPrayers();
        loadMemberDirectory();

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

if (broadcastTag && typeof firebase !== 'undefined') {
    const db = firebase.firestore();
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
    const dayInput = document.getElementById('b_day');
    if (dayInput) dayInput.value = day;

    const buttons = document.querySelectorAll('.day-btn');
    buttons.forEach(btn => {
        btn.style.background = "rgba(255,255,255,0.08)";
        btn.style.borderColor = "rgba(212,175,55,0.3)";
    });

    buttonElement.style.background = "rgba(212, 175, 55, 0.25)";
    buttonElement.style.borderColor = "#D4AF37";
}

async function updateSermon() {
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
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
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
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

async function submitBooking() {
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
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
        
        localStorage.setItem('church_user_name', userName);
        alert("Request Sent."); 
        closeModals();
        watchMyAppointment(userName);

    } catch (error) {
        console.error("Error submitting booking: ", error);
        alert("Failed to send request. Please try again.");
    }
}

function watchMyAppointment(userName) {
    if (!userName || typeof firebase === 'undefined') return;
    const db = firebase.firestore();

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
                let statusColor = "#f39c12"; 
                if (data.status === "Accepted") statusColor = "#2ecc71"; 
                if (data.status === "Rejected") statusColor = "#e74c3c"; 
                if (data.status === "Rescheduled") statusColor = "#3498db"; 

                statusElement.innerHTML = `
                    <div style="border: 1.5px solid ${statusColor}; background: rgba(212, 175, 55, 0.08); padding: 12px; border-radius: 8px; margin-top: 15px; color: #fff; text-align: left;">
                        <p style="margin: 0 0 4px 0;"><strong>Requested Time:</strong> ${data.text}</p>
                        <p style="margin: 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${data.status}</span></p>
                    </div>
                `;
            });
        });
}

window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('church_user_name');
    if (savedName) {
        watchMyAppointment(savedName);
    }
});

async function updateAppointmentStatus(docId, newStatus) {
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
    try {
        await db.collection("churchPrayers").doc(docId).update({
            status: newStatus
        });
    } catch (error) {
        console.error("Error updating status: ", error);
        alert("Failed to update status.");
    }
}

async function rescheduleAppointment(docId) {
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
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
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
    const list = document.getElementById('prayer-list');
    if (!list) return;

    db.collection("churchPrayers").orderBy("time", "desc").onSnapshot(snap => {
        list.innerHTML = "";
        
        if (snap.empty) {
            list.innerHTML = '<p style="opacity: 0.3; margin-top: 20px;">Waiting for mission data...</p>';
            return;
        }

        snap.forEach(doc => {
            const data = doc.data();
            const docId = doc.id;
            
            let detailsContent = "";
            let actionButtons = "";

            if (data.type === "APPOINTMENT") {
                const currentStatus = data.status || "Pending";
                let statusColor = "#f39c12"; 
                if (currentStatus === "Accepted") statusColor = "#2ecc71"; 
                if (currentStatus === "Rejected") statusColor = "#e74c3c"; 
                if (currentStatus === "Rescheduled") statusColor = "#3498db"; 

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
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
    if (confirm("Remove this item from the Mission Control feed permanently?")) {
        db.collection("churchPrayers").doc(docId).delete().catch((error) => {
            console.error("Error removing document: ", error);
            alert("Delete action failed. Check connection.");
        });
    }
}
// ==========================================
// 6. WHATSAPP & MEMBER DIRECTORY
// ==========================================

function messageIndividualWhatsApp(phoneNumber, memberName) {
    const quickMsgInput = document.getElementById('wa_quick_message');
    const customMessage = quickMsgInput ? quickMsgInput.value.trim() : '';
    const textToSend = customMessage ? customMessage : `Hello ${memberName}, God bless you! Checking in from the church.`;
    const encodedMessage = encodeURIComponent(textToSend);
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
}

function saveNewMember() {
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
    const nameInput = document.getElementById('new_member_name');
    const phoneInput = document.getElementById('new_member_phone');

    if (!nameInput || !phoneInput) return;
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
        alert("Please enter both a name and a phone number.");
        return;
    }

    db.collection("members").add({
        name: name,
        phone: phone,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert(`${name} added successfully!`);
        nameInput.value = '';
        phoneInput.value = '';
    })
    .catch((error) => {
        console.error("Error adding member: ", error);
        alert("Failed to save member.");
    });
}

function deleteMember(docId, memberName) {
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
    
    if (confirm(`Are you sure you want to remove ${memberName} from the directory?`)) {
        db.collection("members").doc(docId).delete()
        .then(() => {
            console.log("Member successfully deleted.");
        })
        .catch((error) => {
            console.error("Error removing member: ", error);
            alert("Failed to delete member. Check connection.");
        });
    }
}

function loadMemberDirectory() {
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
    const directoryContainer = document.getElementById('member-directory-list');
    
    if (!directoryContainer) return;

    // Set container to support side scrolling or vertical scrolling window
    directoryContainer.style.display = "flex";
    directoryContainer.style.flexDirection = "column";
    directoryContainer.style.maxHeight = "350px";
    directoryContainer.style.overflowY = "auto";
    directoryContainer.style.overflowX = "hidden";
    directoryContainer.style.paddingRight = "5px";

    db.collection("members")
      .orderBy("name", "asc")
      .onSnapshot((snapshot) => {
          directoryContainer.innerHTML = "";

          if (snapshot.empty) {
              directoryContainer.innerHTML = '<p style="opacity: 0.3; text-align: center; padding: 10px;">No members saved yet.</p>';
              return;
          }

          snapshot.forEach((doc) => {
              const data = doc.data();
              const docId = doc.id;
              const memberCard = document.createElement('div');
              
              // Each card uses a side-scrolling inner container for actions if needed
              memberCard.style.cssText = "background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 8px; border: 1px solid rgba(212,175,55,0.2); margin-bottom: 8px;";
              
              memberCard.innerHTML = `
                  <div style="color: #fff; text-align: left;">
                      <strong style="display: block; font-size: 0.95rem;">${data.name}</strong>
                      <span style="font-size: 0.75rem; color: #aaa;">${data.phone}</span>
                  </div>
                  <div style="display: flex; gap: 6px; overflow-x: auto; white-space: nowrap; padding-bottom: 4px; scrollbar-width: thin;">
                      <button class="premium-gold-btn" onclick="messageIndividualWhatsApp('${data.phone}', '${data.name}')" style="margin: 0; padding: 6px 12px; font-size: 0.65rem; background: #25D366; color: #fff; border: none; border-radius: 4px; cursor: pointer; flex-shrink: 0;">WhatsApp</button>
                      <button onclick="window.location.href='tel:${data.phone}'" style="margin: 0; padding: 6px 12px; font-size: 0.65rem; background: #3498db; color: #fff; border: none; border-radius: 4px; cursor: pointer; flex-shrink: 0;">Call</button>
                      <button onclick="deleteMember('${docId}', '${data.name}')" style="margin: 0; padding: 6px 12px; font-size: 0.65rem; background: #e74c3c; color: #fff; border: none; border-radius: 4px; cursor: pointer; flex-shrink: 0;">Delete</button>
                  </div>
              `;
              
              directoryContainer.appendChild(memberCard);
          });
      });
}