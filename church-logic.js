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
// Initialize Firebase safely
if (typeof firebase !== 'undefined' && !firebase.apps.length) { 
    firebase.initializeApp(firebaseConfig); 
}

// Only declare 'db' globally once
const db = (typeof firebase !== 'undefined') ? firebase.firestore() : null;

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

        loadPrayers();
        loadMemberDirectory();
        loadSavedSermons(); 

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

if (broadcastTag && db) {
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
    if (!db) return;
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
    if (!db) return;
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
    if (!db) return;
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
    if (!userName || !db) return;

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
    if (!db) return;
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
    if (!db) return;
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

let editingSermonId = null;

// 1. Load Saved Sermons & Render Cards
function loadSavedSermons() {
    if (!db) return;
    const listDiv = document.getElementById('saved-sermons-list');
    if (!listDiv) return;

    db.collection("sermons").orderBy("time", "desc").onSnapshot((snapshot) => {
        listDiv.innerHTML = "";

        if (snapshot.empty) {
            listDiv.innerHTML = '<p style="opacity: 0.3; text-align: center; padding: 10px;">No saved messages yet.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id;
            
            let dateString = "Recent";
            if (data.time && typeof data.time.toDate === 'function') {
                dateString = data.time.toDate().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }

            const fullShareText = encodeURIComponent(`*${data.title}*\n\n${data.content}`);
            const emailSubject = encodeURIComponent(data.title);
            const emailBody = encodeURIComponent(`${data.title}\n\n${data.content}`);

            const safeTitle = (data.title || '').replace(/'/g, "\\'");
            const safeContent = (data.content || '').replace(/'/g, "\\'").replace(/\n/g, '\\n');
            const timestampMillis = data.time && data.time.toMillis ? data.time.toMillis() : Date.now();

            listDiv.innerHTML += `
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(212,175,55,0.2); margin-bottom: 8px; text-align: left; color: #fff;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; gap: 8px;">
                        <strong style="color: #D4AF37; font-size: 1rem; line-height: 1.2;">${data.title}</strong>
                        <span style="font-size: 0.7rem; color: #aaa; background: rgba(255,255,255,0.08); padding: 3px 6px; border-radius: 4px; white-space: nowrap;">📅 ${dateString}</span>
                    </div>
                    
                    <p style="margin: 0 0 10px 0; font-size: 0.9rem; opacity: 0.9; white-space: pre-wrap;">${data.content}</p>
                    
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                        <button onclick="editSermon('${docId}', '${safeTitle}', '${safeContent}', ${timestampMillis})" style="background: #f39c12; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">Edit</button>
                        <a href="https://wa.me/?text=${fullShareText}" target="_blank" style="background: #25D366; color: white; text-decoration: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">WhatsApp</a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=&quote=${fullShareText}" target="_blank" style="background: #1877F2; color: white; text-decoration: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">Facebook</a>
                        <a href="mailto:?subject=${emailSubject}&body=${emailBody}" style="background: #9b59b6; color: white; text-decoration: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">Email</a>
                        <a href="https://www.tiktok.com" target="_blank" style="background: #000000; color: white; text-decoration: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid #333;">TikTok</a>
                        <a href="https://www.youtube.com" target="_blank" style="background: #FF0000; color: white; text-decoration: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">YouTube</a>
                        <button onclick="deleteSermon('${docId}')" style="background: #e74c3c; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-left: auto;">Delete</button>
                    </div>
                </div>
            `;
        });
    });
}

// 2. Load Sermon Data into Form Inputs for Editing
function editSermon(docId, title, content, timestampMillis) {
    editingSermonId = docId;
    
    const titleInput = document.getElementById('sermon_title');
    const contentInput = document.getElementById('sermon_content');
    const dateInput = document.getElementById('sermon_date');
    const saveButton = document.querySelector('button[onclick="saveSermonNotes()"]');

    if (titleInput && contentInput) {
        titleInput.value = title;
        contentInput.value = content;
        titleInput.scrollIntoView({ behavior: 'smooth' });
    }

    if (dateInput && timestampMillis) {
        const dateObj = new Date(timestampMillis);
        const localIsoString = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        dateInput.value = localIsoString;
    }

    if (saveButton) {
        saveButton.innerText = "UPDATE SERMON NOTES";
        saveButton.style.background = "#f39c12";
    }
}

// 3. Save or Update Sermon Notes in Firebase
async function saveSermonNotes() {
    if (!db) return;
    const titleInput = document.getElementById('sermon_title');
    const contentInput = document.getElementById('sermon_content');
    const dateInput = document.getElementById('sermon_date');
    const saveButton = document.querySelector('button[onclick="saveSermonNotes()"]');

    if (!titleInput || !contentInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    let sermonTime = firebase.firestore.FieldValue.serverTimestamp();
    if (dateInput && dateInput.value) {
        sermonTime = firebase.firestore.Timestamp.fromDate(new Date(dateInput.value));
    }

    if (!title || !content) {
        alert("Please fill in both the title and content.");
        return;
    }

    try {
        if (editingSermonId) {
            await db.collection("sermons").doc(editingSermonId).update({
                title: title,
                content: content,
                time: sermonTime
            });
            alert("Sermon updated successfully!");
            editingSermonId = null;
            if (saveButton) {
                saveButton.innerText = "SAVE SERMON NOTES";
                saveButton.style.background = "#d4af37";
            }
        } else {
            await db.collection("sermons").add({
                title: title,
                content: content,
                time: sermonTime
            });
            alert("Sermon notes saved successfully!");
        }

        titleInput.value = '';
        contentInput.value = '';
        if (dateInput) dateInput.value = '';
        loadSavedSermons();
    } catch (error) {
        console.error("Error saving sermon notes: ", error);
        alert("Failed to save sermon notes. Check connection.");
    }
}

// 4. Delete Sermon Function
async function deleteSermon(docId) {
    if (!db) return;
    if (confirm("Are you sure you want to delete this saved message?")) {
        try {
            await db.collection("sermons").doc(docId).delete();
            loadSavedSermons();
        } catch (error) {
            console.error("Error deleting sermon: ", error);
            alert("Failed to delete sermon.");
        }
    }
}

// 5. Member Directory Functions
function deleteMember(docId, memberName) {
    if (!db) return;
    
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
    const dbInstance = firebase.firestore();
    const directoryContainer = document.getElementById('member-directory-list');
    
    if (!directoryContainer) return;

    directoryContainer.style.display = "flex";
    directoryContainer.style.flexDirection = "column";
    directoryContainer.style.maxHeight = "350px";
    directoryContainer.style.overflowY = "auto";
    directoryContainer.style.overflowX = "hidden";
    directoryContainer.style.paddingRight = "5px";

    dbInstance.collection("members")
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