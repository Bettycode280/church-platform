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
        loadLiveFeed(); // Added to trigger live feed upon successful unlock

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
    const nameInput = document.getElementById('p_name');
    const phoneInput = document.getElementById('p_phone');
    const emailInput = document.getElementById('p_email');
    const msgInput = document.getElementById('p_msg');

    if (!nameInput || !msgInput || !nameInput.value.trim() || !msgInput.value.trim()) {
        alert("Please fill in your name and prayer message.");
        return;
    }

    try {
        const db = firebase.firestore();
        await db.collection("churchPrayers").add({ 
            type: "PRAYER", 
            name: nameInput.value.trim(), 
            phone: phoneInput ? phoneInput.value.trim() : '',
            email: emailInput ? emailInput.value.trim() : '',
            text: msgInput.value.trim(), 
            time: firebase.firestore.FieldValue.serverTimestamp() 
        });
        
        alert("Sent to Pastor."); 
        closeModals();
        nameInput.value = "";
        if(phoneInput) phoneInput.value = "";
        if(emailInput) emailInput.value = "";
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
            day: dayInput ? dayInput.value : "Monday", // Explicitly saved for targeted extraction
            timeSlot: timeInput ? timeInput.value : "14:00", // Saved cleanly
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
    const cleanName = userName.trim();

    db.collection("churchPrayers")
        .where("name", "==", cleanName)
        .where("type", "==", "APPOINTMENT")
        .onSnapshot((snapshot) => {
            const statusElement = document.getElementById("my-appointment-status");
            if (!statusElement) return;

            if (snapshot.empty) {
                statusElement.innerHTML = `<p style="color: #aaa; font-size: 13px;">No active appointment found for "${cleanName}".</p>`;
                return;
            }

            let latestDoc = null;
            let latestTime = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                const docTime = data.time ? data.time.toMillis ? data.time.toMillis() : 0 : 0;
                if (docTime >= latestTime) {
                    latestTime = docTime;
                    latestDoc = data;
                }
            });

            if (!latestDoc) return;

            let statusColor = "#f39c12"; // Pending
            if (latestDoc.status === "Accepted") statusColor = "#2ecc71"; 
            if (latestDoc.status === "Rejected") statusColor = "#e74c3c"; 
            if (latestDoc.status === "Rescheduled") statusColor = "#3498db"; 

            statusElement.innerHTML = `
                <div style="border: 1.5px solid ${statusColor}; background: rgba(212, 175, 55, 0.08); padding: 12px; border-radius: 8px; margin-top: 15px; color: #fff; text-align: left;">
                    <p style="margin: 0 0 4px 0;"><strong>Requested Time:</strong> ${latestDoc.text}</p>
                    <p style="margin: 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${latestDoc.status || 'Pending'}</span></p>
                </div>
            `;
        }, (error) => {
            console.error("Error watching appointment:", error);
            const statusElement = document.getElementById("my-appointment-status");
            if (statusElement) {
                statusElement.innerHTML = `<p style="color: #e74c3c; font-size: 13px;">Check console: Firestore index required for this query.</p>`;
            }
        });
}

window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('church_user_name');
    if (savedName) {
        watchMyAppointment(savedName);
    }

    if (document.getElementById('prayer-list')) {
        loadPrayers();
    }
    if (document.getElementById('pastor-feed-container')) {
        loadLiveFeed();
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
            day: newDay,
            timeSlot: newTime,
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

// --- ACTION HELPERS ---
async function markAsRead(docId) {
    if (!db) return;
    try {
        await db.collection("churchPrayers").doc(docId).update({ read: true });
    } catch (e) {
        console.error("Error marking as read:", e);
    }
}

async function archiveRequest(docId) {
    if (!db) return;
    try {
        await db.collection("churchPrayers").doc(docId).update({ status: "Archived", archived: true });
        alert("Request archived.");
    } catch (e) {
        console.error("Error archiving:", e);
    }
}

async function deleteRequest(docId) {
    if (!db) {
        alert("Database connection not found.");
        return;
    }
    
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
        await db.collection("churchPrayers").doc(docId).delete();
        console.log("Successfully deleted document:", docId);
    } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete request. Check console for permissions.");
    }
}

function shareRequest(name, text, phone, email) {
    const cleanName = name || 'Anonymous';
    const cleanText = text || 'No details provided.';
    const shareMessage = `Church Mission Request from ${cleanName}:\n"${cleanText}"\nPhone: ${phone || 'N/A'}\nEmail: ${email || 'N/A'}`;
    
    const choice = prompt("Choose sharing method:\nEnter 1 for WhatsApp\nEnter 2 for Email", "1");
    if (choice === "1") {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        window.open(whatsappUrl, '_blank');
    } else if (choice === "2") {
        const mailtoUrl = `mailto:${email || ''}?subject=${encodeURIComponent("Church Mission Request: " + cleanName)}&body=${encodeURIComponent(shareMessage)}`;
        window.open(mailtoUrl, '_blank');
    }
}

// --- 1. ADMIN: LOAD PRAYER REQUESTS LIVE FEED ---
function loadPrayers() {
    if (!db) return;
    const listDiv = document.getElementById('prayer-list');
    if (!listDiv) return;

    db.collection("churchPrayers")
      .where("type", "==", "PRAYER")
      .onSnapshot((snapshot) => {
        listDiv.innerHTML = "";

        if (snapshot.empty) {
            listDiv.innerHTML = '<p style="opacity: 0.3; margin-top: 20px;">Waiting for prayer requests...</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id;
            const personName = data.name || data.fullName || data.userName || 'Anonymous';
            const isReadStyle = data.read ? "opacity: 0.5;" : "";

            listDiv.innerHTML += `
                <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px; border: 1px solid rgba(212,175,55,0.2); margin-bottom: 12px; text-align: left; color: #fff; ${isReadStyle}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: #D4AF37; font-size: 1rem;">PRAYER REQUEST: ${personName}</strong>
                        <span style="font-size: 0.75rem; background: #D4AF37; color: #000; padding: 3px 6px; border-radius: 4px; font-weight: bold;">${data.status || 'Active'}</span>
                    </div>
                    <p style="margin: 8px 0; font-size: 0.9rem; line-height: 1.4;">${data.text || 'No details provided.'}</p>
                    <p style="margin: 0; font-size: 0.75rem; opacity: 0.7;">Phone: ${data.phone || 'N/A'} | Email: ${data.email || 'N/A'}</p>
                    <div style="margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap;">
                        <button onclick="markAsRead('${docId}')" style="background: #27ae60; color: #fff; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold;">Read</button>
                        <button onclick="shareRequest('${personName}', '${data.text || ''}', '${data.phone || ''}', '${data.email || ''}')" style="background: #25D366; color: #fff; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold;">Share</button>
                        <button onclick="archiveRequest('${docId}')" style="background: #f39c12; color: #fff; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold;">Archive</button>
                        <button onclick="deleteRequest('${docId}')" style="background: #555; color: #fff; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold;">Delete</button>
                    </div>
                </div>
            `;
        });
    }, (error) => {
        console.error("Error loading prayers:", error);
    });
}

// --- FULLY WRAPPED LIVE FEED LISTENER FUNCTION ---
function loadLiveFeed() {
    if (!db) return;
    const feedContainer = document.getElementById('pastor-feed-container');
    if (!feedContainer) return;

    db.collection("churchPrayers").orderBy("time", "desc").onSnapshot((snapshot) => {
        feedContainer.innerHTML = ""; // Clear current feed

        if (snapshot.empty) {
            feedContainer.innerHTML = '<p style="opacity: 0.3; margin-top: 20px; text-align: center; color: #fff;">No live feed items yet...</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id;
            const item = document.createElement('div');
            item.className = 'feed-item';
            // Common Date/Time formatting helper
            let formattedDate = 'Just now';
            if (data.time && typeof data.time.toDate === 'function') {
                formattedDate = data.time.toDate().toLocaleString();
            } else if (data.time) {
                formattedDate = new Date(data.time).toLocaleString();
            }

            // Conditional Check for APPOINTMENT versus standard Prayer Request
            if (data.type === "APPOINTMENT") {
                item.style.cssText = "background: rgba(212,175,55,0.08); padding: 14px; border-radius: 8px; border: 1px solid rgba(212,175,55,0.4); margin-bottom: 12px; text-align: left; color: #fff;";
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="background:#D4AF37; color:#000; padding:2px 6px; font-size:10px; font-weight: bold; border-radius:4px;">APPOINTMENT</span>
                        <span style="font-size: 0.75rem; opacity: 0.7;">📅 ${formattedDate}</span>
                    </div>
                    <h3 style="margin: 0 0 4px 0; color: #D4AF37;">${data.name || 'Anonymous'}</h3>
                    <p style="margin: 0 0 6px 0; font-size: 0.85rem; opacity: 0.8;">📧 ${data.email || 'N/A'} | 📞 ${data.phone || 'N/A'}</p>
                    <p style="margin: 0 0 6px 0; font-size: 0.95rem;"><strong>Meeting Requested:</strong> ${data.day || 'N/A'} at ${data.timeSlot || data.time || 'N/A'}</p>
                    <p style="margin: 0 0 10px 0; font-size: 0.9rem;">${data.text || 'No message provided.'}</p>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                        <button onclick="updateAppointmentStatus('${docId}', 'Accepted')" style="background: #2ecc71; color: #fff; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold;">Accept</button>
                        <button onclick="updateAppointmentStatus('${docId}', 'Rejected')" style="background: #e74c3c; color: #fff; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold;">Reject</button>
                        <button onclick="deleteFeedItem('${docId}')" style="background: #555; color: #fff; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Delete</button>
                    </div>
                `;
            } else {
                // Standard Prayer Request Layout (No Read button, includes Date & Action buttons)
                item.style.cssText = "background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px; border: 1px solid rgba(52,152,219,0.3); margin-bottom: 12px; text-align: left; color: #fff;";
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="background:#007BFF; color:#fff; padding:2px 6px; font-size:10px; font-weight: bold; border-radius:4px;">PRAYER</span>
                        <span style="font-size: 0.75rem; opacity: 0.7;">📅 ${formattedDate}</span>
                    </div>
                    <h3 style="margin: 0 0 4px 0; color: #3498db;">${data.name || 'Anonymous'}</h3>
                    <p style="margin: 0 0 6px 0; font-size: 0.85rem; opacity: 0.8;">📧 ${data.email || 'N/A'} | 📞 ${data.phone || 'N/A'}</p>
                    <p style="margin: 0 0 10px 0; font-size: 0.9rem;">${data.text || 'No message provided.'}</p>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                        <button onclick="shareFeedItem('${docId}')" style="background: #3498db; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Share</button>
                        <button onclick="archiveFeedItem('${docId}')" style="background: #e67e22; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Archive</button>
                        <button onclick="deleteFeedItem('${docId}')" style="background: #e74c3c; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Delete</button>
                    </div>
                `;
            }

            feedContainer.appendChild(item);
        });
    }, (error) => {
        console.error("Error loading live feed:", error);
    });
}
// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Delete function to remove items from Firestore
async function deleteFeedItem(id) {
    if (confirm("Are you sure you want to remove this from the live feed?")) {
        try {
            await firebase.firestore().collection("churchPrayers").doc(id).delete();
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    }
}

// Share function
async function shareFeedItem(id) {
    try {
        const docRef = await firebase.firestore().collection("churchPrayers").doc(id).get();
        if (!docRef.exists) return;
        const data = docRef.data();

        const shareText = `🕊️ Prayer Request from ${data.name || 'Anonymous'}:\n"${data.text || ''}"\nContact: ${data.email || 'N/A'} | ${data.phone || 'N/A'}`;

        if (navigator.share) {
            await navigator.share({
                title: 'Church Prayer Request',
                text: shareText
            });
        } else {
            await navigator.clipboard.writeText(shareText);
            alert("Prayer request copied to clipboard!");
        }
    } catch (error) {
        console.error("Error sharing item: ", error);
    }
}

// Archive function
async function archiveFeedItem(id) {
    if (confirm("Move this item to the archive?")) {
        try {
            const db = firebase.firestore();
            const docRef = db.collection("churchPrayers").doc(id);
            const docSnap = await docRef.get();
            
            if (docSnap.exists) {
                await db.collection("churchArchive").add({
                    ...docSnap.data(),
                    archivedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                await docRef.delete();
                alert("Item moved to archive.");
            }
        } catch (error) {
            console.error("Error archiving document: ", error);
            alert("Failed to archive item.");
        }
    }
}
// Archive Modal Controls
function openArchiveModal() {
    const modal = document.getElementById('archive-modal');
    if (modal) modal.style.display = 'flex';
    loadArchivedFeed();
}

function closeArchiveModal() {
    const modal = document.getElementById('archive-modal');
    if (modal) modal.style.display = 'none';
}

// Scrollable archive loader with individual deletion support
async function loadArchivedFeed() {
    const container = document.getElementById('archive-feed-container');
    if (!container) return;
    
    // Enforce scrollability so it never becomes a long continuous wall of text
    container.style.maxHeight = "50vh";
    container.style.overflowY = "auto";
    container.style.paddingRight = "5px";
    container.innerHTML = "<p>Loading archive...</p>";

    try {
        const snapshot = await firebase.firestore().collection("churchArchive").orderBy("archivedAt", "desc").get();
        if (snapshot.empty) {
            container.innerHTML = "<p style='opacity:0.5;'>No archived items found.</p>";
            return;
        }

        container.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;
            const item = document.createElement('div');
            item.style.cssText = "background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; margin-bottom: 8px; border: 1px solid rgba(230,126,34,0.2);";
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                    <h4 style="margin:0; color:#e67e22;">${data.name || 'Anonymous'}</h4>
                    <button type="button" onclick="deleteArchivedItem('${id}')" style="background: #e74c3c; color: #fff; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer; font-size: 0.7rem;">🗑 Delete</button>
                </div>
                <p style="margin:0 0 4px 0; font-size:0.8rem; opacity:0.8;">📧 ${data.email || 'N/A'} | 📞 ${data.phone || 'N/A'}</p>
                <p style="margin:0; font-size:0.85rem;">${data.text || ''}</p>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error("Error loading archive: ", error);
        container.innerHTML = "<p style='color:red;'>Failed to load archive.</p>";
    }
}

// Permanent deletion function for archived items
async function deleteArchivedItem(id) {
    if (confirm("Are you sure you want to permanently delete this archived item?")) {
        try {
            await firebase.firestore().collection("churchArchive").doc(id).delete();
            loadArchivedFeed(); // Refresh the modal view automatically
        } catch (error) {
            console.error("Error deleting archived document: ", error);
            alert("Failed to delete item from archive.");
        }
    }
}

// Delete function to remove items from live feed
async function deleteFeedItem(id) {
    if (confirm("Are you sure you want to remove this from the live feed?")) {
        try {
            await firebase.firestore().collection("churchPrayers").doc(id).delete();
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    }
}