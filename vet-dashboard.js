// ====== Vet Dashboard JS ======

// Global Helper Functions ---

function loadAllPets() {
    return JSON.parse(localStorage.getItem("ph_all_pets") || "[]");
}

function saveAllPets(pets) {
    localStorage.setItem("ph_all_pets", JSON.stringify(pets));
}

function loadAppointments() {
    return JSON.parse(localStorage.getItem("ph_appointments") || "[]");
}

function saveAppointments(apps) {
    localStorage.setItem("ph_appointments", JSON.stringify(apps));
}

function loadChats() {
    return JSON.parse(localStorage.getItem("ph_chats") || "[]");
}

function saveChats(chats) {
    localStorage.setItem("ph_chats", JSON.stringify(chats));
}


// To store the pet whose records are being viewed/edited
let vetPetsList; 
let currentPetData = null;


// MODAL LOGIC (USED TO HANDLE ADD/EDIT)

// Function to open the records modal
function openRecordsModal(isEdit = true) {
    if (!currentPetData) return;

    const modal = document.getElementById("record-modal");
    const title = document.getElementById("record-modal-title");
    const petIdField = document.getElementById("record-pet-id");
    const vaxField = document.getElementById("record-vax");
    const medsField = document.getElementById("record-meds");

    petIdField.value = currentPetData.name; 

    if (isEdit) {
        title.textContent = `Update ${currentPetData.name}'s Health Notes`;
        vaxField.value = currentPetData.vax || '';
        medsField.value = currentPetData.meds || '';
    } else {
        title.textContent = `Add New Notes for ${currentPetData.name}`;
        vaxField.value = '';
        medsField.value = '';
    }

    modal.classList.remove('hidden');
}

// Function to handle form submission
function saveRecord(e) {
    e.preventDefault();

    const petName = document.getElementById("record-pet-id").value;
    const newVax = document.getElementById("record-vax").value;
    const newMeds = document.getElementById("record-meds").value;

    let allPets = loadAllPets();
    const petIndex = allPets.findIndex(p => p.name === petName);

    if (petIndex !== -1) {
        allPets[petIndex].vax = newVax;
        allPets[petIndex].meds = newMeds;

        saveAllPets(allPets);

        currentPetData = allPets[petIndex];
        renderPetRecordsVet(currentPetData); 

        document.getElementById("record-modal").classList.add('hidden');
    }
}


//  PETS AND HEALTH RECORDS  //
function handleViewRecords(petData) {
    currentPetData = petData; 

    document.getElementById("record-pet-name").textContent = petData.name + "'s";
    
    const navLinks = document.querySelectorAll('.nav-link');
    const panels = document.querySelectorAll('.content-panel');

    navLinks.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.nav-link[data-panel="pets"]').classList.add('active'); 
    panels.forEach(panel => panel.classList.remove('active'));
    document.getElementById('health-records').classList.add('active');

    renderPetRecordsVet(petData);

    document.querySelectorAll('#health-records .record-tabs .tab-link').forEach(tab => tab.classList.remove('active'));
    document.querySelector('#health-records .record-tabs .tab-link[data-record-type="visits"]').classList.add('active');
    document.querySelectorAll('#health-records .record-panel').forEach(panel => panel.classList.add('hidden'));
    document.getElementById(`records-visits`).classList.remove('hidden');
}

function renderPetRecordsVet(pet) {
    const allAppointments = loadAppointments();
    const petAppointments = allAppointments
        .filter(a => a.petName === pet.name)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const visitsList = document.getElementById("vet-visits-list");
    visitsList.innerHTML = petAppointments.length === 0 
        ? '<li>No visits recorded.</li>'
        : petAppointments.map(a => `
            <li>
                <strong>${a.date}${a.time ? ` at ${a.time}` : ''}</strong><br>
                Owner: ${a.ownerEmail} | Reason: ${a.reason} | Status: ${a.status}
            </li>
          `).join('');

    const medicationsList = document.getElementById("vet-medications-list");
    document.querySelector('#records-medications h3').innerHTML = `
        Medication History 
        <button class="btn secondary btn-edit-records">Edit Notes</button>
    `;
    medicationsList.innerHTML = pet.meds 
        ? `<li>${pet.meds.replace(/\n/g, '<br>')}</li>`
        : `<li>No specific medication records.</li>`;
    
    const vaccinationsList = document.getElementById("vet-vaccinations-list");
    document.querySelector('#records-vaccinations h3').innerHTML = `
        Vaccination History 
        <button class="btn secondary btn-edit-records">Edit Notes</button>
    `;
    vaccinationsList.innerHTML = pet.vax && pet.vax.trim() !== ''
        ? `<li>${pet.vax.replace(/\n/g, '<br>')}</li>`
        : `<li>No vaccination notes recorded.</li>`;

    document.querySelectorAll('.btn-edit-records').forEach(btn => {
        btn.addEventListener('click', () => openRecordsModal(true));
    });
}

// Function to render all pet cards
function renderPets() {
    const allPets = loadAllPets();
    if (!vetPetsList) return; 

    vetPetsList.innerHTML = "";
    if (allPets.length === 0) {
      vetPetsList.innerHTML = "<p>No registered pets found.</p>";
      return;
    }

    allPets.forEach((pet) => {
        const card = document.createElement("div");
        card.classList.add("pet-card");
        const ownerInfo = pet.ownerEmail || 'N/A';

        card.innerHTML = `
            ${pet.photo ? `<img src="${pet.photo}" alt="${pet.name}" class="pet-photo">` : ''}
            <h3>${pet.name}</h3>
            <p><strong>Owner:</strong> ${ownerInfo}</p>
            <p><strong>Species:</strong> ${pet.species || "—"}</p>
            <p><strong>Weight:</strong> ${pet.weight ? pet.weight + " kg" : "—"}</p>
            <div class="card-actions" style="margin-top: 1rem;">
                <button class="btn primary view-records-btn">View Records</button>
            </div>
        `;
        vetPetsList.appendChild(card);

        const viewRecordsBtn = card.querySelector('.view-records-btn');
        viewRecordsBtn.addEventListener('click', () => {
            handleViewRecords(pet);
        });
    });
}


// --- APPOINTMENTS ---

function refreshAppointments() {
    const vetAppointments = document.getElementById("appointments-container");
    if (!vetAppointments) return;

    const apps = loadAppointments();
    vetAppointments.innerHTML = "";
    if (apps.length === 0) {
      vetAppointments.innerHTML = "<li>No appointment requests yet.</li>";
      return;
    }

    apps.forEach(app => {
      const li = document.createElement("li");
      li.classList.add("appointment-card"); 
      li.classList.add("appointment-item");
      li.innerHTML = `
        <strong>${app.petName}</strong> — ${app.date}<br>
        Owner: ${app.ownerEmail || '—'}<br>
        Reason: ${app.reason}<br>
        Status: <b>${app.status}</b><br>
        ${app.status === "Pending" ? `
          <button class="confirm-btn" data-id="${app.id}">Confirm ✅</button>
          <button class="reject-btn" data-id="${app.id}">Reject ❌</button>
        ` : "<em>Action taken</em>"}
      `;
      vetAppointments.appendChild(li);
    });
}

// --- REPORTS & CHART  ---

function updateReports() {
    const pets = loadAllPets();
    const appointments = loadAppointments();
    const pending = appointments.filter(a => a.status === "Pending");
    const vaccinated = pets.filter(p => p.vax && p.vax.length > 0);

    // Update Overview Stats
    const totalPets = document.getElementById("total-pets");
    if (totalPets) totalPets.textContent = pets.length;
    const totalAppointments = document.getElementById("total-appointments");
    if (totalAppointments) totalAppointments.textContent = appointments.length;
    const totalReminders = document.getElementById("total-reminders");
    if (totalReminders) totalReminders.textContent = "0";
    const totalMessages = document.getElementById("total-messages");
    if (totalMessages) totalMessages.textContent = loadChats().length;

    // Update Reports Section
    const reportTotalPets = document.getElementById("report-total-pets");
    if (reportTotalPets) reportTotalPets.textContent = pets.length;
    const reportTotalAppointments = document.getElementById("report-total-appointments");
    if (reportTotalAppointments) reportTotalAppointments.textContent = appointments.length;
    const reportPendingAppointments = document.getElementById("report-pending-appointments");
    if (reportPendingAppointments) reportPendingAppointments.textContent = pending.length;
    const reportVaccinations = document.getElementById("report-vaccinations");
    if (reportVaccinations) reportVaccinations.textContent = vaccinated.length;

    renderAppointmentsChart(appointments);
}

function renderAppointmentsChart(appointments) {
    const chartElement = document.getElementById("appointments-chart");
    if (!chartElement) return;

    const ctx = chartElement.getContext("2d");

    const confirmedCount = appointments.filter(a => a.status === "Confirmed").length;
    const pendingCount = appointments.filter(a => a.status === "Pending").length;
    const rejectedCount = appointments.filter(a => a.status === "Rejected").length;

    if (window.appChart) window.appChart.destroy();

    if (typeof Chart !== 'undefined') {
        window.appChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Confirmed", "Pending", "Rejected"],
                datasets: [{
                    data: [confirmedCount, pendingCount, rejectedCount],
                    backgroundColor: ["#3a5a98", "#f7c948", "#e74c3c"]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });
    }
}


// --- MAIN INITIALIZATION ---

document.addEventListener("DOMContentLoaded", () => {

    // VET SESSION
    const session = JSON.parse(localStorage.getItem("ph_session"));
    if (!session || session.role !== "vet") {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("vet-name").textContent = session.name;

    vetPetsList = document.getElementById("vet-pets-list");

    const navLinks = document.querySelectorAll('.nav-link');
    const panels = document.querySelectorAll('.content-panel');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(btn => btn.classList.remove('active'));
            link.classList.add('active');

            panels.forEach(panel => panel.classList.remove('active'));

            const target = link.dataset.panel;
            
            if (target === 'pets') {
                document.getElementById('pets').classList.add('active');
                const recordsPanel = document.getElementById('health-records');
                if (recordsPanel) recordsPanel.classList.remove('active');
                renderPets(); 
                return;
            }
            
            const panelToShow = document.getElementById(target);
            if (panelToShow) panelToShow.classList.add('active');
        });
    });

    const logoutBtn = document.getElementById("logout-vet");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("ph_session");
            window.location.href = "index.html";
        });
    }

    // CHAT SETUP
    const userSelect = document.getElementById("user-select");
    const vetChatBox = document.getElementById("vet-chat-box");
    const vetMessage = document.getElementById("vet-message");
    const vetSend = document.getElementById("vet-send");

    function populateUsers() {
        const chats = loadChats();
        const allPets = loadAllPets();
        const uniqueUsers = [...new Set(allPets.map(p => p.ownerEmail).filter(e => e))]; 
        
        userSelect.innerHTML = "";
        uniqueUsers.forEach(email => {
          const opt = document.createElement("option");
          opt.value = email;
          opt.textContent = email;
          userSelect.appendChild(opt);
        });
        if (uniqueUsers.length > 0) {
             if (vetSend) vetSend.disabled = false;
        } else if (vetSend) { 
             vetChatBox.innerHTML = "<p>No registered pet owners to chat with.</p>";
             vetSend.disabled = true;
        }
    }

    function renderVetChat() {
        const vetEmail = "vet@clinic.com";
        const selectedUser = userSelect.value;
        if (!selectedUser) return;
        
        const chats = loadChats();
        const convo = chats.find(c => c.user === selectedUser && c.vet === vetEmail);

        vetChatBox.innerHTML = "";
        if (!convo || convo.messages.length === 0) {
            vetChatBox.innerHTML = "<p>No messages yet.</p>";
            return;
        }

        convo.messages.forEach(msg => {
            const messageDiv = document.createElement("div");
            messageDiv.className = `chat-message ${msg.sender}`;
            const bubble = document.createElement("div");
            bubble.className = "chat-bubble";
            bubble.textContent = msg.text;
            messageDiv.appendChild(bubble);
            vetChatBox.appendChild(messageDiv);
        });

        vetChatBox.scrollTop = vetChatBox.scrollHeight;
    }

    if (vetSend) {
        vetSend.addEventListener("click", () => {
            const text = vetMessage.value.trim();
            if (!text || !userSelect.value) return;

            const vetEmail = "vet@clinic.com";
            const selectedUser = userSelect.value;
            const chats = loadChats();
            let convo = chats.find(c => c.user === selectedUser && c.vet === vetEmail);

            if (!convo) {
                convo = { user: selectedUser, vet: vetEmail, messages: [] };
                chats.push(convo);
            }

            convo.messages.push({
                sender: "vet",
                text,
                time: new Date().toLocaleString()
            });

            saveChats(chats);
            vetMessage.value = "";
            renderVetChat();
        });
    }

    window.addEventListener("storage", (e) => {
        if (e.key === "ph_chats") renderVetChat();
    });

    userSelect.addEventListener("change", renderVetChat);

    populateUsers();
    renderVetChat();

    // HEALTH RECORDS TAB MANAGEMENT
    const recordTabs = document.querySelectorAll("#health-records .record-tabs .tab-link");
    if (recordTabs.length > 0) {
        recordTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.recordType;
                recordTabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('#health-records .record-panel').forEach(panel => panel.classList.add('hidden'));
                e.target.classList.add('active');
                document.getElementById(`records-${type}`).classList.remove('hidden');
            });
        });
    }

    // ADD/EDIT RECORD MODAL SETUP
    const recordForm = document.getElementById("record-form");
    const cancelRecordBtn = document.getElementById("cancel-record");
    const recordModal = document.getElementById("record-modal");
    const addRecordBtn = document.getElementById("add-record-btn"); 
    
    if (recordForm) recordForm.addEventListener("submit", saveRecord);
    
    if (cancelRecordBtn) {
        cancelRecordBtn.addEventListener("click", () => {
            recordModal.classList.add('hidden');
        });
    }

    if (addRecordBtn) {
        addRecordBtn.addEventListener('click', () => {
            if (currentPetData) {
                openRecordsModal(false); 
            } else {
                alert("Please select a pet's records first by clicking 'View Records' on the Pets page.");
            }
        });
    }
    
    //  INITIAL PAGE RENDERING
    renderPets(); 
    
    // APPOINTMENTS 
    const vetAppointments = document.getElementById("appointments-container");
    if (vetAppointments) {
        // Approve / Reject
        vetAppointments.addEventListener("click", (e) => {
            const apps = loadAppointments();
            const id = Number(e.target.dataset.id);
            if (e.target.classList.contains("confirm-btn")) {
                const app = apps.find(a => a.id === id);
                if (app) app.status = "Confirmed";
                saveAppointments(apps);
                refreshAppointments();
                updateReports(); 
            } else if (e.target.classList.contains("reject-btn")) {
                const app = apps.find(a => a.id === id);
                if (app) app.status = "Rejected";
                saveAppointments(apps);
                refreshAppointments();
                updateReports(); 
            }
        });
        refreshAppointments();
    }


    // 10. REPORTS AND OVERVIEW
    updateReports(); 

    // Update dynamically if appointments or pets change
    window.addEventListener("storage", updateReports);
});