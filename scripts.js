// ===============================================
// || BuddyDo scripts.js ||
// || Login + Encrypted CSV + Contacts CRUD ||
// || + Light/Dark Mode Toggle (icons) ||
// ===============================================

// ========== 1) DOM ELEMENTS ==========
const fileInput = document.getElementById("fileInput");
const fileMessage = document.getElementById("fileMessage");
const credentialsContainer = document.getElementById("credentialsContainer");
const userInput = document.getElementById("userInput");
const passInput = document.getElementById("passInput");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const showCreateLink = document.getElementById("showCreateLink");
const showLoginLink = document.getElementById("showLoginLink");
const creationSection = document.getElementById("creationSection");
const loginSection = document.getElementById("loginSection");
const newUserInput = document.getElementById("newUserInput");
const newPassInput = document.getElementById("newPassInput");
const confirmPassInput = document.getElementById("confirmPassInput");
const createFileButton = document.getElementById("createFileButton");
const createMessage = document.getElementById("createMessage");
const mainContainer = document.getElementById("mainContainer");
const appContainer = document.getElementById("appContainer");

// Activity Log (legacy Notes)
const notesList = document.getElementById("notesList");
const newNoteContent = document.getElementById("newNoteContent");
const addNoteButton = document.getElementById("addNoteButton");

// Save / Export
const saveButton = document.getElementById("saveButton");

// Contacts UI
const contactName = document.getElementById("contactName");
const contactEmail = document.getElementById("contactEmail");
const contactPhone = document.getElementById("contactPhone");
const contactTag = document.getElementById("contactTag");
const contactNote = document.getElementById("contactNote");
const addContactButton = document.getElementById("addContactButton");
const updateContactButton = document.getElementById("updateContactButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const contactsBody = document.getElementById("contactsBody");

// ========== 2) GLOBALS ==========
let csvData = []; // Array de objetos alineados a CORRECT_HEADERS
let editingContactId = null; // logID del contacto en edición

// Mantener headers originales para compatibilidad
const CORRECT_HEADERS = [
  "_RF",
  "testConteo",
  "user",
  "pass",
  "logID",
  "dateTime",
  "logType",
  "logContent",
  "LastLoaded",
  "LastLoaded2",
];

// ========== 3) ENCODE/DECODE Base64 (UTF-8 safe) ==========
function cifrarContenido(plainText) {
  try {
    return btoa(unescape(encodeURIComponent(plainText)));
  } catch (e) {
    console.error("Encrypt error:", e);
    return null;
  }
}
function descifrarContenido(encodedText) {
  try {
    return decodeURIComponent(escape(atob(encodedText)));
  } catch (e) {
    console.error("Decrypt error:", e);
    return null;
  }
}

// ========== 4) CSV PARSER (soporta comillas y comas) ==========
function parseCSV(text) {
  const lines = text.replace(/\r/g, "").trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const dataRows = lines.slice(1);

  return dataRows.map((row) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (const ch of row) {
      if (ch === '"' && inQuotes === false) {
        inQuotes = true;
      } else if (ch === '"' && inQuotes === true) {
        inQuotes = false;
      } else if (ch === "," && inQuotes === false) {
        values.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current);

    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] ?? "";
    });
    return obj;
  });
}

// ========== 5) CSV BUILD (quote seguro) ==========
function convertirDatosACSV(rows) {
  const headerRow = CORRECT_HEADERS.join(",");
  const lines = rows.map((row) =>
    CORRECT_HEADERS.map((h) => {
      const raw = row[h] ?? "";
      const val = String(raw);
      // Quote si contiene comillas, comas o saltos de línea; siempre para logContent
      if (h === "logContent" || /[",\n]/.test(val)) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(",")
  );
  return [headerRow, ...lines].join("\n");
}

// ========== 6) VALIDATION ==========
function validateHeaders(rawText) {
  const firstLine = rawText.split("\n")[0].trim();
  const headers = firstLine.split(",").map((h) => h.trim());
  if (headers.length !== CORRECT_HEADERS.length) return false;
  return headers.every((h, i) => h === CORRECT_HEADERS[i]);
}

// ========== 7) AUTH FILE LOAD ==========
fileInput?.addEventListener("change", (ev) => {
  const file = ev.target.files?.[0];
  if (!file) return;
  credentialsContainer.style.display = "none";
  fileMessage.textContent = "Loading...";
  loginMessage.textContent = "";

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const content = e.target.result;
      const decrypted = descifrarContenido(content);
      if (!decrypted) throw new Error("Decryption failed.");
      if (validateHeaders(decrypted)) {
        csvData = parseCSV(decrypted);
        credentialsContainer.style.display = "block";
        fileMessage.textContent = "✅ Valid file.";
        fileMessage.style.color = "green";
      } else {
        throw new Error("Invalid file structure.");
      }
    } catch (err) {
      fileMessage.textContent = "Corrupt or invalid file.";
      fileMessage.style.color = "red";
      console.error(err);
    }
  };
  reader.readAsText(file);
});

// ========== 8) LOGIN ==========
loginButton?.addEventListener("click", () => {
  const u = userInput.value.trim();
  const p = passInput.value.trim();

  // Convención: primera fila con 'pass' no vacío es la fila de autenticación
  const authRow = csvData.find((r) => (r.pass ?? "") !== "");
  if (authRow && u === (authRow.user ?? "") && p === (authRow.pass ?? "")) {
    mainContainer.style.display = "none";
    appContainer.style.display = "block";
    renderNotes();
    renderContacts();
  } else {
    loginMessage.textContent = "❌ Incorrect username or password.";
  }
});

// ========== 9) CREAR NUEVO ARCHIVO ENCRIPTADO ==========
showCreateLink?.addEventListener("click", (e) => {
  e.preventDefault();
  loginSection.style.display = "none";
  creationSection.style.display = "block";
});
showLoginLink?.addEventListener("click", (e) => {
  e.preventDefault();
  creationSection.style.display = "none";
  loginSection.style.display = "block";
});

createFileButton?.addEventListener("click", () => {
  const u = newUserInput.value.trim();
  const p = newPassInput.value.trim();
  const c = confirmPassInput.value.trim();
  createMessage.textContent = "";

  if (!u || !p) {
    createMessage.textContent = "Username and password are required.";
    return;
  }
  if (p !== c) {
    createMessage.textContent = "Passwords do not match.";
    return;
  }

  csvData = [
    {
      _RF: "",
      testConteo: "",
      user: u,
      pass: p,
      logID: "AUTH" + Date.now(),
      dateTime: new Date().toLocaleString("sv-SE"),
      logType: "Auth",
      logContent: "BuddyDo Encrypted File",
      LastLoaded: "",
      LastLoaded2: "",
    },
  ];
  exportAndDownload(".buddydo");
  createMessage.textContent = "✅ File created. Keep it safe.";
});

// ========== 10) ACTIVITY LOG (legacy Notes) ==========
function renderNotes() {
  if (!notesList) return;
  notesList.innerHTML = "";

  const notes = csvData.filter(
    (r) => (r.logType ?? "") === "Note" && (r.logID ?? "").startsWith("L")
  );

  if (notes.length === 0) {
    notesList.innerHTML = "<p>No entries yet. Add one below.</p>";
    return;
  }

  notes.forEach((n) => {
    const div = document.createElement("div");
    div.className = "note-item";
    div.innerHTML = `<strong>ID: ${n.logID}</strong>
      <p>${escapeHtml(n.logContent ?? "")}</p>
      <small>Date: ${n.dateTime ?? ""}</small>`;
    notesList.appendChild(div);
  });
}

addNoteButton?.addEventListener("click", () => {
  const content = (newNoteContent.value || "").trim();
  if (!content) {
    alert("Log entry cannot be empty.");
    return;
  }
  csvData.push({
    _RF: "",
    testConteo: "",
    user: "",
    pass: "",
    logID: "L" + Date.now(),
    dateTime: new Date().toLocaleString("sv-SE"),
    logType: "Note",
    logContent: content,
    LastLoaded: "",
    LastLoaded2: "",
  });
  newNoteContent.value = "";
  renderNotes();
});

// ========== 11) CONTACTS (logType = "Contact", logContent = JSON) ==========
function renderContacts() {
  if (!contactsBody) return;
  contactsBody.innerHTML = "";

  const contacts = csvData.filter((r) => (r.logType ?? "") === "Contact");
  if (contacts.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td colspan="7" style="text-align:center;">No contacts yet. Add one above.</td>';
    contactsBody.appendChild(tr);
    return;
  }

  contacts.forEach((row) => {
    const payload = safeParseJSON(row.logContent ?? "{}");
    const name = payload.name ?? "";
    const email = payload.email ?? "";
    const phone = payload.phone ?? "";
    const tag = payload.tag ?? "";
    const note = payload.note ?? "";
    const updated = row.dateTime ?? "";

    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(name)}</td>
      <td>${escapeHtml(email)}</td>
      <td>${escapeHtml(phone)}</td>
      <td>${escapeHtml(tag)}</td>
      <td>${escapeHtml(note)}</td>
      <td>${escapeHtml(updated)}</td>
      <td>
        <button class="btn-edit" data-id="${row.logID}">Edit</button>
        <button class="btn-delete" data-id="${row.logID}">Delete</button>
      </td>`;
    contactsBody.appendChild(tr);
  });

  contactsBody.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => startEditContact(btn.dataset.id));
  });
  contactsBody.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteContact(btn.dataset.id));
  });
}

addContactButton?.addEventListener("click", () => {
  const name = contactName.value.trim();
  const email = contactEmail.value.trim();
  const phone = contactPhone.value.trim();
  const tag = contactTag.value.trim();
  const note = contactNote.value.trim();
  if (!name) {
    alert("Name is required.");
    return;
  }
  const logID = "C" + Date.now();
  const now = new Date().toLocaleString("sv-SE");
  const logContent = JSON.stringify({ name, email, phone, tag, note });
  csvData.push({
    _RF: "",
    testConteo: "",
    user: "",
    pass: "",
    logID,
    dateTime: now,
    logType: "Contact",
    logContent,
    LastLoaded: "",
    LastLoaded2: "",
  });
  clearContactForm();
  renderContacts();
});

function startEditContact(id) {
  const row = csvData.find((r) => r.logID === id && r.logType === "Contact");
  if (!row) return;
  const payload = safeParseJSON(row.logContent ?? "{}");
  contactName.value = payload.name ?? "";
  contactEmail.value = payload.email ?? "";
  contactPhone.value = payload.phone ?? "";
  contactTag.value = payload.tag ?? "";
  contactNote.value = payload.note ?? "";
  editingContactId = id;
  addContactButton.style.display = "none";
  updateContactButton.style.display = "inline-block";
  cancelEditButton.style.display = "inline-block";
}

updateContactButton?.addEventListener("click", () => {
  if (!editingContactId) return;
  const name = contactName.value.trim();
  const email = contactEmail.value.trim();
  const phone = contactPhone.value.trim();
  const tag = contactTag.value.trim();
  const note = contactNote.value.trim();
  if (!name) {
    alert("Name is required.");
    return;
  }
  const row = csvData.find(
    (r) => r.logID === editingContactId && r.logType === "Contact"
  );
  if (!row) return;
  row.logContent = JSON.stringify({ name, email, phone, tag, note });
  row.dateTime = new Date().toLocaleString("sv-SE");
  editingContactId = null;
  clearContactForm();
  addContactButton.style.display = "inline-block";
  updateContactButton.style.display = "none";
  cancelEditButton.style.display = "none";
  renderContacts();
});

cancelEditButton?.addEventListener("click", () => {
  editingContactId = null;
  clearContactForm();
  addContactButton.style.display = "inline-block";
  updateContactButton.style.display = "none";
  cancelEditButton.style.display = "none";
});

function deleteContact(id) {
  if (!confirm("Delete this contact?")) return;
  const idx = csvData.findIndex(
    (r) => r.logID === id && r.logType === "Contact"
  );
  if (idx >= 0) {
    csvData.splice(idx, 1);
    if (editingContactId === id) {
      editingContactId = null;
      clearContactForm();
      addContactButton.style.display = "inline-block";
      updateContactButton.style.display = "none";
      cancelEditButton.style.display = "none";
    }
    renderContacts();
  }
}

function clearContactForm() {
  contactName.value = "";
  contactEmail.value = "";
  contactPhone.value = "";
  contactTag.value = "";
  contactNote.value = "";
}

// ========== 12) SAVE / EXPORT ==========
saveButton?.addEventListener("click", () => {
  const authRow = csvData.find((r) => (r.pass ?? "") !== "");
  const now = new Date().toLocaleString("sv-SE");
  if (authRow) {
    authRow.LastLoaded = now;
    authRow.LastLoaded2 = now;
  }
  exportAndDownload(".buddydo");
});

function exportAndDownload(ext = ".buddydo") {
  const rawCSV = convertirDatosACSV(csvData);
  const encrypted = cifrarContenido(rawCSV);
  if (!encrypted) {
    alert("Encryption error. Could not save.");
    return;
  }
  const blob = new Blob([encrypted], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `buddydo_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ========== 13) THEME TOGGLE (🌙 / 🌞 con localStorage) ==========
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  const themeBtn = document.createElement("button");
  themeBtn.id = "themeToggle";
  themeBtn.style.float = "right";
  themeBtn.style.margin = "0.5em 0";
  header.appendChild(themeBtn);

  // Inicializar desde localStorage; si no hay preferencia, queda en light
  const savedTheme = localStorage.getItem("buddydo-theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
  updateThemeButtonIcon(themeBtn);

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("buddydo-theme", isDark ? "dark" : "light");
    updateThemeButtonIcon(themeBtn);
  });
});

function updateThemeButtonIcon(btn) {
  if (!btn) return;
  const isDark = document.body.classList.contains("dark-mode");
  btn.textContent = isDark ? "🌞 Light" : "🌙 Dark";
  btn.title = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
}

// ========== 14) UTILS ==========
function safeParseJSON(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
