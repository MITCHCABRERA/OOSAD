// ====== Vet Dashboard JS ======

// Wait until DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {

  // ====== Check if vet is logged in ======
  const session = JSON.parse(localStorage.getItem("ph_session"));
  if (!session || session.role !== "vet") {
    window.location.href = "index.html";
    return;
  }

  // Display vet's name
  document.getElementById("vet-name").textContent = session.name;

  // ====== Navigation between panels ======
  const navLinks = document.querySelectorAll('.nav-link');
  const panels = document.querySelectorAll('.content-panel');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(btn => btn.classList.remove('active'));
      link.classList.add('active');

      panels.forEach(panel => panel.classList.remove('active'));

      const target = link.dataset.panel;
      const panelToShow = document.getElementById(target);
      if (panelToShow) panelToShow.classList.add('active');
    });
  });

  // ====== Logout Button ======
  const logoutBtn = document.getElementById("logout-vet");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("ph_session");
      window.location.href = "index.html";
    });
  }

  // ====== Chat Setup ======
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

  window.addEventListener("storage", (e) => {
    if (e.key === "ph_chats") renderVetChat();
  });

  userSelect.addEventListener("change", renderVetChat);

  populateUsers();
  renderVetChat();

  // ====== Render All Pets ======
  const vetPetsList = document.getElementById("vet-pets-list");

  function loadAllPets() {
    return JSON.parse(localStorage.getItem("ph_all_pets") || "[]");
  }

  function renderPets() {
    const allPets = loadAllPets();
    vetPetsList.innerHTML = "";
    if (allPets.length === 0) {
      vetPetsList.innerHTML = "<p>No registered pets found.</p>";
      return;
    }

    allPets.forEach((pet) => {
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

  renderPets();

  // ====== Appointments ======
const vetAppointments = document.getElementById("appointments-container");


  function loadAppointments() {
    // Ensure only real user-booked appointments are loaded
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
      li.classList.add("appointment-card"); 
      li.classList.add("appointment-item");
      li.innerHTML = `
        <strong>${app.petName}</strong> — ${app.date}<br>
        Owner: ${app.ownerName || '—'}<br>
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

  // Approve / Reject logic
  vetAppointments.addEventListener("click", (e) => {
    const apps = loadAppointments();
    const id = Number(e.target.dataset.id);
    if (e.target.classList.contains("confirm-btn")) {
      const app = apps.find(a => a.id === id);
      if (app) app.status = "Confirmed";
      saveAppointments(apps);
      refreshAppointments();
    } else if (e.target.classList.contains("reject-btn")) {
      const app = apps.find(a => a.id === id);
      if (app) app.status = "Rejected";
      saveAppointments(apps);
      refreshAppointments();
    }
  });

  refreshAppointments();

  // ====== Calendar (Overview) ======
  function renderCalendar() {
    const calendar = document.getElementById("calendar");
    if (!calendar) return;

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    calendar.innerHTML = `<div style="grid-column: span 7; font-weight:bold; margin-bottom:5px;">
      ${monthNames[month]} ${year}
    </div>`;

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekdays.forEach(day => {
      const div = document.createElement("div");
      div.innerHTML = `<strong>${day}</strong>`;
      calendar.appendChild(div);
    });

    for (let i = 0; i < firstDay; i++) {
      const div = document.createElement("div");
      calendar.appendChild(div);
    }

    for (let date = 1; date <= lastDate; date++) {
      const div = document.createElement("div");
      div.textContent = date;
      if (date === now.getDate()) div.classList.add("today");
      calendar.appendChild(div);
    }
  }

  renderCalendar();

});


// chart
document.addEventListener("DOMContentLoaded", () => {

  function loadPets() {
    return JSON.parse(localStorage.getItem("ph_all_pets") || "[]");
  }

  function loadAppointments() {
    return JSON.parse(localStorage.getItem("ph_appointments") || "[]");
  }

  function updateReports() {
    const pets = loadPets();
    const appointments = loadAppointments();
    const pending = appointments.filter(a => a.status === "Pending");
    const vaccinated = pets.filter(p => p.vax && p.vax.length > 0);

    document.getElementById("report-total-pets").textContent = pets.length;
    document.getElementById("report-total-appointments").textContent = appointments.length;
    document.getElementById("report-pending-appointments").textContent = pending.length;
    document.getElementById("report-vaccinations").textContent = vaccinated.length;

    renderAppointmentsChart(appointments);
  }

  function renderAppointmentsChart(appointments) {
    const ctx = document.getElementById("appointments-chart").getContext("2d");

    const confirmedCount = appointments.filter(a => a.status === "Confirmed").length;
    const pendingCount = appointments.filter(a => a.status === "Pending").length;
    const rejectedCount = appointments.filter(a => a.status === "Rejected").length;

    // Destroy previous chart if exists
    if (window.appChart) window.appChart.destroy();

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

  updateReports();

  // Update dynamically if appointments or pets change
  window.addEventListener("storage", updateReports);
});
