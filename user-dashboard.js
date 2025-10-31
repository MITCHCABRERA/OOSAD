// ====== Navigation between panels ======
const navLinks = document.querySelectorAll('.nav-link');
const panels = document.querySelectorAll('.panel');

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.forEach(btn => btn.classList.remove('active'));
    link.classList.add('active');

    const target = link.dataset.target;
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.id === target);
    });
  });
});

// ====== Add Pet Modal ======
const addPetBtn = document.getElementById('add-pet-btn');
const petModal = document.getElementById('pet-modal');
const cancelPet = document.getElementById('cancel-pet');
const petForm = document.getElementById('pet-form');
const petsList = document.getElementById('pets-list');

let pets = JSON.parse(localStorage.getItem('pets')) || [];
let editingIndex = null;

addPetBtn.addEventListener('click', () => {
  editingIndex = null;
  petForm.reset();
  document.getElementById('modal-title').textContent = 'Add Pet';
  petModal.classList.remove('hidden');
});
cancelPet.addEventListener('click', () => petModal.classList.add('hidden'));

// Add photo input dynamically if not in HTML
let petPhotoInput = document.getElementById('pet-photo');
if (!petPhotoInput) {
  petPhotoInput = document.createElement('input');
  petPhotoInput.type = 'file';
  petPhotoInput.accept = 'image/*';
  petPhotoInput.id = 'pet-photo';
  petPhotoInput.style.marginBottom = '0.5rem';
  petForm.insertBefore(petPhotoInput, petForm.querySelector('.modal-actions'));
}

// ====== Render Pets ======
function renderPets() {
  petsList.innerHTML = '';
  if (pets.length === 0) {
    petsList.innerHTML = '<p>No pets added yet.</p>';
    return;
  }

  pets.forEach((pet, index) => {
    const div = document.createElement('div');
    div.className = 'pet-card';
    div.innerHTML = `
      ${pet.photo ? `<img src="${pet.photo}" alt="${pet.name}" class="pet-photo">` : ''}
      <h4>${pet.name}</h4>
      <p>${pet.species || '—'}</p>
      <p>Weight: ${pet.weight || '—'} kg</p>
      <p>Birthday: ${pet.bday || '—'}</p>
      <p>${pet.vax || ''}</p>
      <button class="btn secondary edit-btn" data-index="${index}">Edit</button>
      <button class="btn secondary delete-btn" data-index="${index}">Delete</button>
    `;
    petsList.appendChild(div);
  });

  // Edit button
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = e.target.dataset.index;
      const pet = pets[index];
      editingIndex = index;

      document.getElementById('pet-name').value = pet.name;
      document.getElementById('pet-species').value = pet.species || '';
      document.getElementById('pet-bday').value = pet.bday || '';
      document.getElementById('pet-weight').value = pet.weight || '';
      document.getElementById('pet-vax').value = pet.vax || '';
      document.getElementById('modal-title').textContent = 'Edit Pet';
      petModal.classList.remove('hidden');
    });
  });

  // Delete button
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = e.target.dataset.index;
      pets.splice(index, 1);
      localStorage.setItem('pets', JSON.stringify(pets));

      // Remove from global vet list as well
      const loggedUser = JSON.parse(localStorage.getItem("ph_session"));
      let allPets = JSON.parse(localStorage.getItem("ph_all_pets") || "[]");
      allPets = allPets.filter(p => !(p.ownerEmail === loggedUser.email && p.name === pets[index]?.name));
      localStorage.setItem("ph_all_pets", JSON.stringify(allPets));

      renderPets();
      refreshPetOptions();
    });
  });
}

// ====== Pet Form Submit ======
petForm.addEventListener('submit', e => {
  e.preventDefault();
  const file = petPhotoInput.files[0];

  const savePet = (photoData) => {
    const petData = {
      name: document.getElementById('pet-name').value,
      species: document.getElementById('pet-species').value,
      bday: document.getElementById('pet-bday').value,
      weight: document.getElementById('pet-weight').value,
      vax: document.getElementById('pet-vax').value,
      photo: photoData || (editingIndex !== null ? pets[editingIndex].photo : null)
    };

    if (editingIndex !== null) {
      pets[editingIndex] = petData; // update
      editingIndex = null;
    } else {
      pets.push(petData); // add
    }

    localStorage.setItem('pets', JSON.stringify(pets));

    // ✅ Save to global vet list
    const loggedUser = JSON.parse(localStorage.getItem("ph_session"));
    const allPets = JSON.parse(localStorage.getItem("ph_all_pets") || "[]");
    allPets.push({ ...petData, owner: loggedUser.name, ownerEmail: loggedUser.email });
    localStorage.setItem("ph_all_pets", JSON.stringify(allPets));

    petForm.reset();
    petModal.classList.add('hidden');
    renderPets();
    refreshPetOptions();
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function() {
      savePet(reader.result);
    };
    reader.readAsDataURL(file);
  } else {
    savePet(null);
  }
});

// ====== Refresh pet dropdown for appointments ======
function refreshPetOptions() {
  const appointmentPetSelect = document.getElementById("appointment-pet");
  appointmentPetSelect.innerHTML = '';
  if (pets.length === 0) {
    const option = document.createElement('option');
    option.textContent = 'No saved pets yet';
    option.disabled = true;
    option.selected = true;
    appointmentPetSelect.appendChild(option);
    return;
  }

  const defaultOpt = document.createElement('option');
  defaultOpt.textContent = 'Select a pet';
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  appointmentPetSelect.appendChild(defaultOpt);

  pets.forEach(pet => {
    const opt = document.createElement('option');
    opt.value = pet.name;
    opt.textContent = pet.name;
    appointmentPetSelect.appendChild(opt);
  });
}

// ====== CHAT SYSTEM ======
const chatBox = document.getElementById("chat-box");
const chatMessage = document.getElementById("chat-message");
const sendMessageBtn = document.getElementById("send-message");

function loadChats() {
  return JSON.parse(localStorage.getItem("ph_chats") || "[]");
}
function saveChats(chats) {
  localStorage.setItem("ph_chats", JSON.stringify(chats));
}

function renderChat() {
  const session = JSON.parse(localStorage.getItem("ph_session"));
  const vetEmail = "vet@clinic.com"; // same vet reference
  const chats = loadChats();
  const convo = chats.find(c => c.user === session.email && c.vet === vetEmail);

  chatBox.innerHTML = "";
  if (!convo || convo.messages.length === 0) {
    chatBox.innerHTML = "<p>No messages yet.</p>";
    return;
  }

  convo.messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = `chat-message ${msg.sender}`;
    div.textContent = msg.text;
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

sendMessageBtn.addEventListener("click", () => {
  const text = chatMessage.value.trim();
  if (!text) return;

  const session = JSON.parse(localStorage.getItem("ph_session"));
  const vetEmail = "vet@clinic.com";
  const chats = loadChats();
  let convo = chats.find(c => c.user === session.email && c.vet === vetEmail);

  if (!convo) {
    convo = { user: session.email, vet: vetEmail, messages: [] };
    chats.push(convo);
  }

  convo.messages.push({
    sender: "user",
    text,
    time: new Date().toLocaleString()
  });

  saveChats(chats);
  chatMessage.value = "";
  renderChat();
});

// Update automatically if another tab changes localStorage (vet replies)
window.addEventListener("storage", (e) => {
  if (e.key === "ph_chats") renderChat();
});

document.addEventListener("DOMContentLoaded", renderChat);




// ====== Appointments ======
function loadAppointments() {
  return JSON.parse(localStorage.getItem("ph_appointments") || "[]");
}
function saveAppointments(apps) {
  localStorage.setItem("ph_appointments", JSON.stringify(apps));
}
const appointmentForm = document.getElementById("appointment-form");
const appointmentsList = document.getElementById("appointments-list");

function refreshAppointments() {
  const apps = loadAppointments();
  appointmentsList.innerHTML = "";

  if (apps.length === 0) {
    appointmentsList.innerHTML = "<li>No appointments yet.</li>";
    return;
  }

  apps.forEach(app => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${app.petName}</strong> — ${app.date} <br>
      Reason: ${app.reason} <br>
      Status: <span style="font-weight:bold; color:${app.status === 'Confirmed' ? 'green' : app.status === 'Rejected' ? 'red' : 'orange'}">
        ${app.status}
      </span>
    `;
    appointmentsList.appendChild(li);
  });
}

appointmentForm.addEventListener("submit", e => {
  e.preventDefault();
  const appointmentPetSelect = document.getElementById("appointment-pet");
  const apps = loadAppointments();
  const newApp = {
    id: Date.now(),
    petName: appointmentPetSelect.value,
    date: document.getElementById("appointment-date").value,
    reason: document.getElementById("appointment-reason").value,
    status: "Pending"
  };
  apps.push(newApp);
  saveAppointments(apps);
  alert("Appointment booked successfully!");
  appointmentForm.reset();
  refreshAppointments();
});

// ====== Initial Load ======
document.addEventListener("DOMContentLoaded", () => {
  renderPets();
  refreshPetOptions();
  refreshAppointments();
});

// ====== Logout ======
document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('ph_session');
  window.location.href = 'index.html';
});


// ===== SIMPLE REMINDERS DISPLAY =====
function renderReminders() {
  const session = JSON.parse(localStorage.getItem("ph_session"));
  const allReminders = JSON.parse(localStorage.getItem("ph_reminders") || "[]");
  const userReminders = allReminders.filter(r => r.user === session.email);

  const remindersList = document.getElementById("reminders-list");
  remindersList.innerHTML = "";

  if (userReminders.length === 0) {
    remindersList.innerHTML = "<li>No reminders yet.</li>";
    return;
  }

  userReminders.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${r.text}</strong> — <em>${r.date}</em>`;
    remindersList.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", renderReminders);


// ====== DASHBOARD SUMMARY ======
function renderDashboard() {
  const pets = JSON.parse(localStorage.getItem("ph_pets") || "[]");
  const appointments = JSON.parse(localStorage.getItem("ph_appointments") || "[]");
  const reminders = JSON.parse(localStorage.getItem("ph_reminders") || "[]");
  const session = JSON.parse(localStorage.getItem("ph_session"));

  // Stats
  document.getElementById("stat-pets").textContent = pets.length;
  document.getElementById("stat-appointments").textContent = appointments.filter(a => a.ownerEmail === session.email).length;
  document.getElementById("stat-reminders").textContent = reminders.filter(r => r.user === session.email).length;

  // Next Appointment
  const userAppointments = appointments.filter(a => a.ownerEmail === session.email);
  const nextApp = userAppointments.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const nextAppBox = document.getElementById("next-appointment");
  nextAppBox.innerHTML = nextApp
    ? `<p><strong>${nextApp.petName}</strong> — ${nextApp.date}<br><em>${nextApp.reason}</em></p>`
    : "<p>No upcoming appointments yet.</p>";

  // Recent Pets
  const recentPetsList = document.getElementById("recent-pets");
  recentPetsList.innerHTML = pets.length
    ? pets.slice(-3).map(p => `<li>${p.name} — ${p.species}</li>`).join("")
    : "<li>No pets added yet.</li>";

  // Recent Reminders
  const recentRemindersList = document.getElementById("recent-reminders");
  const userReminders = reminders.filter(r => r.user === session.email);
  recentRemindersList.innerHTML = userReminders.length
    ? userReminders.slice(-3).map(r => `<li>${r.text} — <em>${r.date}</em></li>`).join("")
    : "<li>No reminders yet.</li>";
}

document.addEventListener("DOMContentLoaded", renderDashboard);
