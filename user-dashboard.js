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


function renderDashboard() {
  const pets = JSON.parse(localStorage.getItem("pets") || "[]");
  const appointments = JSON.parse(localStorage.getItem("ph_appointments") || "[]");
  const reminders = JSON.parse(localStorage.getItem("ph_reminders") || "[]");
  const session = JSON.parse(localStorage.getItem("ph_session"));

  // Stats
  document.getElementById("stat-pets").textContent = pets.length;
  document.getElementById("stat-appointments").textContent = appointments.length;
  document.getElementById("stat-reminders").textContent =
    reminders.filter(r => r.user === session.email).length;

  // Next Appointment
  const nextApp = appointments.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
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

      // Calendar
function renderCalendarWithDropdown() {
  const calendarGrid = document.getElementById("calendar-grid");
  const monthSelect = document.getElementById("calendar-month");
  const yearSelect = document.getElementById("calendar-year");

  const appointments = JSON.parse(localStorage.getItem("ph_appointments") || "[]");
  const reminders = JSON.parse(localStorage.getItem("ph_reminders") || "[]");
  const session = JSON.parse(localStorage.getItem("ph_session")) || { email: "" };

  const currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  // --- Populate dropdowns ---
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  monthSelect.innerHTML = months.map((m, i) =>
    `<option value="${i}" ${i === currentMonth ? "selected" : ""}>${m}</option>`
  ).join("");

  const startYear = 2020;
  const endYear = 2030;
  yearSelect.innerHTML = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const year = startYear + i;
    return `<option value="${year}" ${year === currentYear ? "selected" : ""}>${year}</option>`;
  }).join("");

  // --- Function to render calendar ---
  function renderDays(month, year) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let daysHTML = "";

    // Fill empty slots before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      daysHTML += `<div class="calendar-day empty"></div>`;
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const hasAppointments = appointments.some(a => a.date === dateStr);
      const hasReminders = reminders.some(r => r.user === session.email && r.date === dateStr);

      const classes = [
        "calendar-day",
        hasAppointments ? "appointment" : "",
        hasReminders ? "reminder" : ""
      ].join(" ");

      daysHTML += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
    }

    calendarGrid.innerHTML = daysHTML;

    // Click event for details
    document.querySelectorAll(".calendar-day").forEach(dayEl => {
      dayEl.addEventListener("click", () => {
        const selectedDate = dayEl.dataset.date;
        if (!selectedDate) return;

        const dayAppointments = appointments.filter(a => a.date === selectedDate);
        const dayReminders = reminders.filter(r => r.user === session.email && r.date === selectedDate);

        showCalendarPopup(selectedDate, dayAppointments, dayReminders);
      });
    });
  }

  // Initial render
  renderDays(currentMonth, currentYear);

  // Re-render when dropdown changes
  monthSelect.addEventListener("change", () => {
    currentMonth = parseInt(monthSelect.value);
    renderDays(currentMonth, currentYear);
  });

  yearSelect.addEventListener("change", () => {
    currentYear = parseInt(yearSelect.value);
    renderDays(currentMonth, currentYear);
  });
}

// Popup show/hide
function showCalendarPopup(date, appointments, reminders) {
  const popup = document.getElementById("calendar-popup");
  const popupDate = document.getElementById("popup-date");
  const popupList = document.getElementById("popup-list");

  popupDate.textContent = date;

  if (!appointments.length && !reminders.length) {
    popupList.innerHTML = "<li>No events for this date.</li>";
  } else {
    popupList.innerHTML = `
      ${appointments.map(a => `<li><strong>🐾 ${a.petName}</strong> — ${a.reason}</li>`).join("")}
      ${reminders.map(r => `<li><strong>🔔 Reminder:</strong> ${r.text}</li>`).join("")}
    `;
  }

  popup.classList.remove("hidden");
}

document.getElementById("close-calendar-popup").addEventListener("click", () => {
  document.getElementById("calendar-popup").classList.add("hidden");
});

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
  renderCalendarWithDropdown();
});


function renderCalendarWithDropdown() {
  const calendarGrid = document.getElementById("calendar-grid");
  const monthSelect = document.getElementById("calendar-month");
  const yearSelect = document.getElementById("calendar-year");
  const appointments = JSON.parse(localStorage.getItem("ph_appointments") || "[]");
  const reminders = JSON.parse(localStorage.getItem("ph_reminders") || "[]");
  const session = JSON.parse(localStorage.getItem("ph_session"));

  // Fill months
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  months.forEach((m, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });

  // Fill years (5 years range)
  const thisYear = new Date().getFullYear();
  for (let y = thisYear - 2; y <= thisYear + 2; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }

  // Draw Calendar
  function renderDays() {
    calendarGrid.innerHTML = "";
    const month = +monthSelect.value;
    const year = +yearSelect.value;
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "day empty";
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const cell = document.createElement("div");
      cell.className = "day";
      cell.textContent = day;

      // Highlight booked appointments or reminders
      const hasApp = appointments.some(a => a.date === dateStr);
      const hasRem = reminders.some(r => r.date === dateStr && r.user === session.email);

      if (hasApp || hasRem) cell.classList.add("marked");

      cell.addEventListener("click", () => openPopup(dateStr));
      calendarGrid.appendChild(cell);
    }
  }

  // Popup
  const popup = document.getElementById("calendar-popup");
  const popupDate = document.getElementById("popup-date");
  const popupList = document.getElementById("popup-list");
  const closePopup = document.getElementById("close-calendar-popup");

  function openPopup(dateStr) {
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
        li.textContent = ev.petName
          ? `${ev.petName} — ${ev.reason || "Check-up"}`
          : `🔔 ${ev.text}`;
        popupList.appendChild(li);
      });
    }

    popup.classList.remove("hidden");
  }

  closePopup.addEventListener("click", () => popup.classList.add("hidden"));

  monthSelect.value = new Date().getMonth();
  yearSelect.value = new Date().getFullYear();
  renderDays();

  monthSelect.addEventListener("change", renderDays);
  yearSelect.addEventListener("change", renderDays);
}

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
  renderCalendarWithDropdown();
});
