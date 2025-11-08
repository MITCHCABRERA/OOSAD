// Functional/Procedural part
function loadUsers() { return JSON.parse(localStorage.getItem('ph_users') || '[]'); }
function loadPets() { return JSON.parse(localStorage.getItem('pets')) || []; }
function savePets(pets) { localStorage.setItem('pets', JSON.stringify(pets)); }
function loadAppointments() {
    const session = JSON.parse(localStorage.getItem("ph_session"));
    const allApps = JSON.parse(localStorage.getItem("ph_appointments") || "[]");
    return allApps.filter(a => a.ownerEmail === session.email);
}
function saveAppointments(apps) {
    const session = JSON.parse(localStorage.getItem("ph_session"));
    let allApps = JSON.parse(localStorage.getItem("ph_appointments") || "[]");
    allApps = allApps.filter(a => a.ownerEmail !== session.email);
    localStorage.setItem("ph_appointments", JSON.stringify([...allApps, ...apps]));
}
function loadChats() { return JSON.parse(localStorage.getItem("ph_chats") || "[]"); }
function saveChats(chats) { localStorage.setItem("ph_chats", JSON.stringify(chats)); }
function loadReminders() { return JSON.parse(localStorage.getItem("ph_reminders") || "[]"); }
function saveReminders(reminders) { localStorage.setItem("ph_reminders", JSON.stringify(reminders)); }

/**
 * Reduces the size of a Base64 image string.
 * @param {string} base64Image
 * @returns {Promise<string>}
 */
function compressImage(base64Image) {
    return new Promise((resolve) => {
        const MAX_WIDTH = 400;
        const image = new Image();
        image.src = base64Image;

        image.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let width = image.width;
            let height = image.height;

            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(image, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        image.onerror = () => resolve(base64Image);
    });
}

// DASHBOARD CLASS
class PetOwnerDashboard {
    constructor() {
        // State/Session Management
        this.session = JSON.parse(localStorage.getItem("ph_session"));
        if (!this.session || this.session.role !== "owner") {
            window.location.href = "index.html";
            return;
        }

        this.pets = loadPets().filter(p => p.ownerEmail === this.session.email);
        this.editingIndex = null;
        this.editingAppId = null;
        this.editingRemId = null;

        // DOM Element
        this.navLinks = document.querySelectorAll('.nav-link');
        this.panels = document.querySelectorAll('.content-panel');
        this.logoutBtn = document.getElementById("logout");
        this.petsList = document.getElementById('pets-list');
        this.petForm = document.getElementById('pet-form');
        this.petModal = document.getElementById('pet-modal');
        this.cancelPet = document.getElementById('cancel-pet');
        this.addPetBtn = document.getElementById('add-pet-btn');
        this.appointmentForm = document.getElementById('appointment-form');
        this.appointmentsList = document.getElementById("appointments-list");
        this.reminderForm = document.getElementById("reminder-form");
        this.remindersList = document.getElementById("reminders-list");
        this.chatBox = document.getElementById("chat-box");
        this.chatMessageInput = document.getElementById("chat-message");
        this.sendMessageBtn = document.getElementById("send-message");
        this.monthSelect = document.getElementById("calendar-month");
        this.yearSelect = document.getElementById("calendar-year");
        this.calendarGrid = document.getElementById("calendar-days");
        this.popup = document.getElementById("calendar-popup");
        this.closePopup = document.getElementById("close-calendar-popup");

        this.setOwnerName();
        this.ensurePetPhotoInput();
    }

    openEditAppointment(app) {
        this.editingAppId = app.id;

        document.getElementById("appointment-pet").value = app.petName;
        document.getElementById("appointment-date").value = app.date;
        document.getElementById("appointment-time").value = app.time;
        document.getElementById("appointment-reason").value = app.reason;
        
        this.appointmentForm.querySelector('button[type="submit"]').textContent = 'Update Appointment';
        document.querySelector('.nav-link[data-panel="bookings"]').click();

    }

    openEditReminder(reminder) {
        this.refreshPetOptions(); 

        this.editingRemId = reminder.id;

        document.getElementById("reminder-pet").value = reminder.petName;
        document.getElementById("reminder-date").value = reminder.date;
        document.getElementById("reminder-time").value = reminder.time || '';
        document.getElementById("reminder-text").value = reminder.text;
        
        this.reminderForm.querySelector('button[type="submit"]').textContent = 'Update Reminder';
        document.querySelector('.nav-link[data-panel="reminders"]').click();
    }

    setOwnerName() {
        const nameSpans = document.querySelectorAll("#owner-name, #owner-name-2");
        nameSpans.forEach(span => {
            span.textContent = this.session.name;
        });
    }

    ensurePetPhotoInput() {
        let petPhotoInput = document.getElementById('pet-photo');
        if (!petPhotoInput) {
            petPhotoInput = document.createElement('input');
            petPhotoInput.type = 'file';
            petPhotoInput.accept = 'image/*';
            petPhotoInput.id = 'pet-photo';
            petPhotoInput.style.marginBottom = '0.5rem';
            this.petForm.insertBefore(petPhotoInput, this.petForm.querySelector('.modal-actions'));
        }
    }

    // INITIALIZATION AND NAVIGATION
    init() {
        this.setupNavigation();
        this.setupPetManagement();
        this.setupAppointmentManagement();
        this.setupReminderManagement();
        this.setupChat();
        this.setupCalendar();

        this.renderPets();
        this.refreshAppointments();
        this.renderReminders();
        this.refreshPetOptions();
    }

    setupNavigation() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', this.handleNavigation.bind(this));
        });
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener("click", this.handleLogout.bind(this));
        }
    }

    handleNavigation(e) {
        const link = e.currentTarget;
        this.navLinks.forEach(btn => btn.classList.remove('active'));
        link.classList.add('active');

        const target = link.dataset.panel;
        this.panels.forEach(panel => {
            panel.classList.toggle('active', panel.id === target);
        });

        if (target === 'chat') this.renderChat();
        if (target === 'reminders') this.renderReminders();
    }

    handleLogout() {
        localStorage.removeItem("ph_session");
        window.location.href = "index.html";
    }

    // PET MANAGEMENT METHODS
    setupPetManagement() {
        this.addPetBtn.addEventListener('click', this.openAddPetModal.bind(this));
        this.cancelPet.addEventListener('click', this.closePetModal.bind(this));
        this.petForm.addEventListener('submit', this.handlePetFormSubmit.bind(this));
    }

    openAddPetModal() {
        this.editingIndex = null;
        this.petForm.reset();
        document.getElementById('modal-title').textContent = 'Add Pet';
        this.petModal.classList.remove('hidden');
    }

    closePetModal() {
        this.petModal.classList.add('hidden');
    }

    renderPets() {
        this.pets = loadPets().filter(p => p.ownerEmail === this.session.email);
        this.petsList.innerHTML = '';
        if (this.pets.length === 0) {
            this.petsList.innerHTML = '<p>No pets added yet.</p>';
            document.getElementById('stat-pets').textContent = '0';
            return;
        }

        this.pets.forEach((pet, index) => {
            const div = document.createElement('div');
            div.className = 'pet-card';
            div.innerHTML = `
                <div class="pet-image-container">
                    ${pet.photo ? `<img src="${pet.photo}" alt="${pet.name}" class="pet-image">` : '🐾'}
                </div>
                <div class="pet-details">
                    <h3>${pet.name}</h3>
                    <p>Species: ${pet.species || '—'}</p>
                    <p>Weight: ${pet.weight || '—'} kg</p>
                    <p>Birthday: ${pet.bday || '—'}</p>
                </div>
                <div class="pet-card-actions">
                    <button class="btn secondary edit-btn" data-index="${index}">Edit</button>
                    <button class="btn danger delete-btn" data-index="${index}">Delete</button>
                </div>
            `;
            this.petsList.appendChild(div);
        });

        document.getElementById('stat-pets').textContent = this.pets.length;

        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', this.openEditPetModal.bind(this)));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', this.handleDeletePet.bind(this)));

        this.refreshPetOptions();
    }

    openEditPetModal(e) {
        const index = e.currentTarget.dataset.index;
        const pet = this.pets[index];
        this.editingIndex = index;

        document.getElementById('pet-name').value = pet.name;
        document.getElementById('pet-species').value = pet.species || '';
        document.getElementById('pet-bday').value = pet.bday || '';
        document.getElementById('pet-weight').value = pet.weight || '';
        document.getElementById('pet-vax').value = pet.vax || '';
        document.getElementById('modal-title').textContent = 'Edit Pet';
        this.petModal.classList.remove('hidden');
    }

    handleDeletePet(e) {
        const index = e.currentTarget.dataset.index;
        const deletedPet = this.pets[index];

        this.pets.splice(index, 1);
        savePets(this.pets);

        let allPets = JSON.parse(localStorage.getItem("ph_all_pets") || "[]");
        allPets = allPets.filter(p => !(p.ownerEmail === this.session.email && p.name === deletedPet.name));
        localStorage.setItem("ph_all_pets", JSON.stringify(allPets));

        this.renderPets();
    }

    handlePetFormSubmit(e) {
        e.preventDefault();
        const fileInput = document.getElementById('pet-photo');
        const file = fileInput.files[0];

        const save = async (photoData) => {
            const petData = {
                ownerEmail: this.session.email,
                name: document.getElementById('pet-name').value,
                species: document.getElementById('pet-species').value,
                bday: document.getElementById('pet-bday').value,
                weight: document.getElementById('pet-weight').value,
                vax: document.getElementById('pet-vax').value,
                photo: photoData || (this.editingIndex !== null ? this.pets[this.editingIndex].photo : null)
            };

            let allPets = JSON.parse(localStorage.getItem("ph_all_pets") || "[]");

            if (this.editingIndex !== null) {
                const oldPet = this.pets[this.editingIndex];
                this.pets[this.editingIndex] = petData;

                const globalIndex = allPets.findIndex(p => p.ownerEmail === this.session.email && p.name === oldPet.name);
                if (globalIndex !== -1) {
                    allPets[globalIndex] = petData;
                }
            } else {
                if (this.pets.some(p => p.name === petData.name)) {
                    alert("You already have a pet with this name.");
                    return;
                }
                this.pets.push(petData);
                allPets.push(petData);
            }

            savePets(this.pets);
            localStorage.setItem("ph_all_pets", JSON.stringify(allPets));

            this.closePetModal();
            this.renderPets();
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const compressedPhoto = await compressImage(e.target.result);
                save(compressedPhoto);
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                alert("Error reading photo file. Saving pet without new image.");
                save(null);
            };
            reader.readAsDataURL(file);
        } else {
            save(null);
        }
    }

    // APPOINTMENT MANAGEMENT METHODS
    setupAppointmentManagement() {
        this.appointmentForm.addEventListener("submit", this.handleAppointmentSubmit.bind(this));
    }

    refreshPetOptions() {
        const appointmentPetSelect = document.getElementById("appointment-pet");
        const reminderPetSelect = document.getElementById("reminder-pet");
        
        appointmentPetSelect.innerHTML = '';
        reminderPetSelect.innerHTML = '';

        if (this.pets.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No saved pets yet - Add one first!';
            option.value = '';
            
            appointmentPetSelect.appendChild(option.cloneNode(true)); 
            reminderPetSelect.appendChild(option); 
            
            return;
        }

        const defaultOpt = document.createElement('option');
        defaultOpt.textContent = 'Select a pet';
        defaultOpt.value = '';
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        
        appointmentPetSelect.appendChild(defaultOpt.cloneNode(true));
        reminderPetSelect.appendChild(defaultOpt);

        this.pets.forEach(pet => {
            const opt = document.createElement('option');
            opt.value = pet.name;
            opt.textContent = pet.name;
            
            appointmentPetSelect.appendChild(opt.cloneNode(true));
            reminderPetSelect.appendChild(opt);
        });
    }

    refreshAppointments() {
        const apps = loadAppointments();
        const upcomingApps = apps.filter(a => a.status !== "Completed" && a.status !== "Rejected" && a.status !== "Cancelled").sort((a, b) => new Date(a.date) - new Date(b.date));
        const appointmentsList = document.getElementById("appointments-list");

        appointmentsList.innerHTML = '';
        if (upcomingApps.length === 0) {
            appointmentsList.innerHTML = '<p class="no-appointments">No upcoming appointments.</p>';
            document.getElementById('stat-appointments').textContent = '0';
            return;
        }

        upcomingApps.forEach(app => {
            const div = document.createElement('div');
            div.className = 'appointment-item';
            div.innerHTML = `
                <div class="appointment-header">
                    <span class="pet-name">${app.petName}</span>
                    <span class="status ${app.status.toLowerCase()}">${app.status}</span>
                </div>
                <div class="appointment-details">
                    <p>Date: ${app.date}</p>
                    <p>Time: ${app.time}</p>
                    <p>Reason: ${app.reason}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn primary action-btn" data-id="${app.id}" data-action="edit">Reschedule</button>
                    <button class="btn secondary action-btn" data-id="${app.id}" data-action="cancel">Cancel</button>
                </div>
            `;
            appointmentsList.appendChild(div);
        });
        document.getElementById('stat-appointments').textContent = upcomingApps.length;

        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', this.handleAppointmentAction.bind(this));
        });
    }

    handleAppointmentSubmit(e) {
        e.preventDefault();
        const appointmentPetSelect = document.getElementById("appointment-pet");
        let apps = loadAppointments();
        const submitButton = this.appointmentForm.querySelector('button[type="submit"]');

        const appData = {
            ownerEmail: this.session.email,
            petName: appointmentPetSelect.value,
            date: document.getElementById("appointment-date").value,
            time: document.getElementById("appointment-time").value,
            reason: document.getElementById("appointment-reason").value,
        };

        if (this.editingAppId !== null) {
            // Edit existing appointment
            const appIndex = apps.findIndex(a => a.id === this.editingAppId);
            if (appIndex !== -1) {
                apps[appIndex] = { ...apps[appIndex], ...appData }; 
                alert("Appointment successfully updated!");
            }
            this.editingAppId = null;
            submitButton.textContent = 'Request Appointment';
        } else {
            // New appointment
            const newApp = {
                id: Date.now(),
                ...appData,
                status: "Pending"
            };

            apps.push(newApp);
            alert("Appointment request sent successfully! Awaiting confirmation from the vet.");
        }

        saveAppointments(apps);
        this.appointmentForm.reset();
        this.refreshAppointments();
        this.renderDays();
    }

    handleAppointmentAction(e) {
        const appId = parseInt(e.currentTarget.dataset.id);
        const action = e.currentTarget.dataset.action;
        let apps = loadAppointments();

        const appIndex = apps.findIndex(a => a.id === appId);
        if (appIndex === -1) return;
        const appToEdit = apps[appIndex];

        if (action === 'cancel') {
            apps[appIndex].status = "Cancelled";
            saveAppointments(apps);
            alert("Appointment successfully cancelled.");
            this.refreshAppointments();
        } else if (action === 'edit') {
            this.openEditAppointment(appToEdit);
        }
    }

    // CHAT MANAGEMENT METHODS
    setupChat() {
        this.sendMessageBtn.addEventListener("click", this.handleSendMessage.bind(this));
        this.chatMessageInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') {
                this.handleSendMessage();
            }
        });
        this.renderChat();
    }

    renderChat() {
        const chats = loadChats();
        const vetEmail = "vet@clinic.com";
        let convo = chats.find(c => c.user === this.session.email && c.vet === vetEmail);

        this.chatBox.innerHTML = "";
        if (!convo || convo.messages.length === 0) {
            this.chatBox.innerHTML = "<p class='no-messages'>Start a conversation with your vet.</p>";
            return;
        }

        convo.messages.forEach(msg => {
            const messageDiv = document.createElement("div");
            messageDiv.className = `chat-message ${msg.sender}`;
            const bubble = document.createElement("div");
            bubble.className = "chat-bubble";
            bubble.textContent = msg.text;
            messageDiv.appendChild(bubble);
            this.chatBox.appendChild(messageDiv);
        });
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    handleSendMessage() {
        const text = this.chatMessageInput.value.trim();
        if (!text) return;

        const chats = loadChats();
        const vetEmail = "vet@clinic.com";
        let convo = chats.find(c => c.user === this.session.email && c.vet === vetEmail);

        const newMessage = { sender: 'user', text, timestamp: Date.now() };

        if (convo) {
            convo.messages.push(newMessage);
        } else {
            convo = { user: this.session.email, vet: vetEmail, messages: [newMessage] };
            chats.push(convo);
        }

        saveChats(chats);
        this.chatMessageInput.value = '';
        this.renderChat();
    }


    // REMINDERS MANAGEMENT
    setupReminderManagement() {
        this.reminderForm.addEventListener("submit", this.handleReminderSubmit.bind(this));
    }

    renderReminders() {
        const allReminders = loadReminders();
        const userReminders = allReminders.filter(r => r.user === this.session.email).sort((a, b) => new Date(a.date) - new Date(b.date));

        this.remindersList.innerHTML = "";
        if (userReminders.length === 0) {
            this.remindersList.innerHTML = "<p>No reminders set.</p>";
            document.getElementById('stat-reminders').textContent = '0';
            return;
        }

        userReminders.forEach(r => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="reminder-text">${r.text} for ${r.petName || 'All Pets'}</span>
                <span class="reminder-date">
                    ${r.date}${r.time ? ` at ${r.time}` : ''}
                </span>
                <div class="reminder-actions">
                    <button class="btn primary edit-reminder" data-id="${r.id}">Edit</button>
                    <button class="delete-reminder" data-id="${r.id}">Delete</button>
                </div>
            `;
            this.remindersList.appendChild(li);
        });
        document.getElementById('stat-reminders').textContent = userReminders.length;

        // Listener for the DELETE button
        document.querySelectorAll(".delete-reminder").forEach(btn => {
            btn.addEventListener("click", this.handleDeleteReminder.bind(this));
        });
        
        // Listener for the EDIT button
        document.querySelectorAll('.edit-reminder').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reminderId = parseInt(e.currentTarget.dataset.id);
                const allReminders = loadReminders(); 
                const reminderToEdit = allReminders.find(r => r.id === reminderId);
                
                if (reminderToEdit) {
                    this.openEditReminder(reminderToEdit);
                }
            });
        });
    }

        handleReminderSubmit(e) {
        e.preventDefault();
        
        let reminders = loadReminders();
        const submitButton = this.reminderForm.querySelector('button[type="submit"]');

        const reminderData = {
            user: this.session.email,
            petName: document.getElementById("reminder-pet").value,
            date: document.getElementById("reminder-date").value,
            time: document.getElementById("reminder-time").value || '',
            text: document.getElementById("reminder-text").value,
        };

        if (this.editingRemId !== null) {
            // Edit existing reminder
            const remIndex = reminders.findIndex(r => r.id === this.editingRemId);
            if (remIndex !== -1) {
                reminders[remIndex] = { ...reminders[remIndex], ...reminderData }; 
                alert("Reminder successfully updated!");
            }
            this.editingRemId = null;
            submitButton.textContent = 'Set Reminder';

        } else {
            const newReminder = {
                id: Date.now(),
                ...reminderData
            };
            reminders.push(newReminder);
            alert("Reminder set successfully!");
        }

        saveReminders(reminders);
        this.reminderForm.reset();
        this.renderReminders();
        this.renderDays(); 
    }

    handleDeleteReminder(e) {
        const id = parseInt(e.currentTarget.dataset.id);
        let allReminders = loadReminders();

        allReminders = allReminders.filter(r => r.id !== id);
        
        saveReminders(allReminders);
        this.renderReminders();
        this.renderDays();
    }

    // CALENDAR MANAGEMENT
    setupCalendar() {
        this.monthSelect.addEventListener("change", this.renderDays.bind(this));
        this.yearSelect.addEventListener("change", this.renderDays.bind(this));
        this.closePopup.addEventListener("click", () => this.popup.classList.add("hidden"));

        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 2;
        this.yearSelect.innerHTML = Array.from({ length: 5 }, (_, i) => {
            const year = startYear + i;
            return `<option value="${year}" ${year === currentYear ? "selected" : ""}>${year}</option>`;
        }).join("");

        this.monthSelect.value = new Date().getMonth();
        this.yearSelect.value = new Date().getFullYear();
        this.renderDays();
    }

    renderDays() {
        this.calendarGrid.innerHTML = "";
        const month = +this.monthSelect.value;
        const year = +this.yearSelect.value;
        const appointments = loadAppointments();
        const reminders = loadReminders();
        const session = this.session;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        for (let i = 0; i < firstDay.getDay(); i++) {
            this.calendarGrid.insertAdjacentHTML('beforeend', '<div class="calendar-day empty"></div>');
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasApp = appointments.some(a => a.date === dateStr);
            const hasRem = reminders.some(r => r.date === dateStr && r.user === session.email);

            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            cell.textContent = day;
            if (hasApp || hasRem) cell.classList.add("marked");

            cell.addEventListener("click", () => this.openPopup(dateStr));
            this.calendarGrid.appendChild(cell);
        }
    }

    openPopup(dateStr) {
        const popupDate = document.getElementById("popup-date");
        const popupList = document.getElementById("popup-list");
        const appointments = loadAppointments();
        const reminders = loadReminders();
        const session = this.session;

        popupDate.textContent = dateStr;
        popupList.innerHTML = "";

        const events = [
            ...appointments.filter(a => a.date === dateStr),
            ...reminders.filter(r => r.date === dateStr && r.user === session.email)
        ];

        if (events.length === 0) {
            popupList.innerHTML = "<li>No events on this date.</li>";
        } else {
            events.forEach(ev => {
                const li = document.createElement("li");
                const eventTime = ev.time ? ` at ${ev.time}` : '';

                li.textContent = ev.petName
                    ? `${ev.petName} — ${ev.reason || "Check-up"} (${ev.status})${eventTime}`
                    : `🔔 ${ev.text}${eventTime}`;
                popupList.appendChild(li);
            });
        }

        this.popup.classList.remove("hidden");
    }
}

// Instantiate and Initialize the Dashboard Class
document.addEventListener("DOMContentLoaded", () => {
    const dashboard = new PetOwnerDashboard();
    if (dashboard.session) {
        dashboard.init();
    }
});