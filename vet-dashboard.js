// ====== Vet Dashboard JS ======

// Check if vet is logged in
const session = JSON.parse(localStorage.getItem("ph_session"));
if (!session || session.role !== "vet") {
  window.location.href = "index.html";
}

document.getElementById("vet-name").textContent = session.name;

// ====== Navigation between panels ======
const navLinks = document.querySelectorAll('.nav-link');
const panels = document.querySelectorAll('.content-panel');

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    // Remove active from all buttons
    navLinks.forEach(btn => btn.classList.remove('active'));
    link.classList.add('active');

    // Hide all panels
    panels.forEach(panel => panel.classList.remove('active'));

    // Show target panel
    const target = link.dataset.panel;
    const panelToShow = document.getElementById(target);
    if (panelToShow) panelToShow.classList.add('active');
  });
});


const userSelect = document.getElementById("user-select");
const vetChatBox = document.getElementById("vet-chat-box");
const vetMessage = document.getElementById("vet-message");
const vetSend = document.getElementById("vet-send");

function loadChats() {
  return JSON.parse(localStorage.getItem("ph_chats") || "[]");
}
function saveChats(chats) {
  localStorage.setItem("ph_chats", JSON.stringify(chats));
}

function populateUsers() {
  const chats = loadChats();
  const uniqueUsers = [...new Set(chats.map(c => c.user))];
  userSelect.innerHTML = "";
  uniqueUsers.forEach(email => {
    const opt = document.createElement("option");
    opt.value = email;
    opt.textContent = email;
    userSelect.appendChild(opt);
  });
}

function renderVetChat() {
  const vetEmail = "vet@clinic.com";
  const selectedUser = userSelect.value;
  const chats = loadChats();
  const convo = chats.find(c => c.user === selectedUser && c.vet === vetEmail);

  vetChatBox.innerHTML = "";
  if (!convo || convo.messages.length === 0) {
    vetChatBox.innerHTML = "<p>No messages yet.</p>";
    return;
  }

  convo.messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = `chat-message ${msg.sender}`;
    div.textContent = msg.text;
    vetChatBox.appendChild(div);
  });

  vetChatBox.scrollTop = vetChatBox.scrollHeight;
}

vetSend.addEventListener("click", () => {
  const text = vetMessage.value.trim();
  if (!text) return;

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

// Auto-update chat when user sends a message
window.addEventListener("storage", (e) => {
  if (e.key === "ph_chats") renderVetChat();
});

userSelect.addEventListener("change", renderVetChat);

document.addEventListener("DOMContentLoaded", () => {
  populateUsers();
  renderVetChat();
});





// ====== Render All Pets ======
const vetPetsList = document.getElementById("vet-pets-list");
let allPets = [];

function loadAllPets() {
  // Load from the global pets list
  allPets = JSON.parse(localStorage.getItem("ph_all_pets") || "[]");
}

function renderPets() {
  loadAllPets();
  vetPetsList.innerHTML = "";
  if (allPets.length === 0) {
    vetPetsList.innerHTML = "<p>No registered pets found.</p>";
    return;
  }

  allPets.forEach((pet, index) => {
    const card = document.createElement("div");
    card.classList.add("pet-card");
    card.innerHTML = `
      ${pet.photo ? `<img src="${pet.photo}" alt="${pet.name}" class="pet-photo">` : ''}
      <h3>${pet.name}</h3>
      <p><strong>Owner:</strong> ${pet.owner || "—"}</p>
      <p><strong>Species:</strong> ${pet.species || "—"}</p>
      <p><strong>Weight:</strong> ${pet.weight ? pet.weight + " kg" : "—"}</p>
      <p><strong>Vaccination Notes:</strong> ${pet.vax || "—"}</p>
    `;
    vetPetsList.appendChild(card);
  });
}

// Initial render
renderPets();


// ====== Appointments Management ======
const vetAppointments = document.getElementById("vet-appointments-list");

function loadAppointments() {
  return JSON.parse(localStorage.getItem("ph_appointments") || "[]");
}

function saveAppointments(apps) {
  localStorage.setItem("ph_appointments", JSON.stringify(apps));
}

function refreshAppointments() {
  const apps = loadAppointments();
  vetAppointments.innerHTML = "";
  if (apps.length === 0) {
    vetAppointments.innerHTML = "<li>No appointment requests yet.</li>";
    return;
  }

  apps.forEach(app => {
    const li = document.createElement("li");
    li.classList.add("appointment-item");
    li.innerHTML = `
      <strong>${app.petName}</strong> — ${app.date}<br>
      Owner: ${app.ownerName || '—'}<br>
      Reason: ${app.reason}<br>
      Status: <b>${app.status}</b><br>
      ${app.status === "Pending" ? `
        <button class="confirm-btn" data-id="${app.id}">Confirm</button>
        <button class="reject-btn" data-id="${app.id}">Reject</button>
      ` : "<em>Action taken</em>"}
    `;
    vetAppointments.appendChild(li);
  });
}

// Confirm / Reject buttons
vetAppointments.addEventListener("click", (e) => {
  const apps = loadAppointments();
  if (e.target.classList.contains("confirm-btn")) {
    const id = Number(e.target.dataset.id);
    const app = apps.find(a => a.id === id);
    if (app) app.status = "Confirmed";
    saveAppointments(apps);
    refreshAppointments();
  } else if (e.target.classList.contains("reject-btn")) {
    const id = Number(e.target.dataset.id);
    const app = apps.find(a => a.id === id);
    if (app) app.status = "Rejected";
    saveAppointments(apps);
    refreshAppointments();
  }
});
refreshAppointments();

// ====== Logout ======
document.getElementById("logout-vet").addEventListener("click", () => {
  localStorage.removeItem("ph_session");
  window.location.href = "index.html";
});
