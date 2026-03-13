const BASE_EVENTS = [
  {
    id: "e01",
    title: "Tech Talk: Building with MERN",
    category: "Tech",
    organizer: "CS Club",
    location: "Seminar Hall A",
    start: "2026-03-20T14:00:00",
    end: "2026-03-20T15:30:00",
    description:
      "A beginner-friendly talk on MongoDB, Express, React, and Node. Q&A at the end.",
  },
  {
    id: "e02",
    title: "Cultural Fest Rehearsals",
    category: "Culture",
    organizer: "Cultural Committee",
    location: "Auditorium Stage",
    start: "2026-03-22T17:00:00",
    end: "2026-03-22T19:00:00",
    description: "Join the rehearsal schedule and meet your coordinators.",
  },
  {
    id: "e03",
    title: "Placement Prep: Resume Review",
    category: "Career",
    organizer: "Placement Cell",
    location: "Library Conference Room",
    start: "2026-03-25T10:30:00",
    end: "2026-03-25T12:00:00",
    description:
      "Bring your resume for quick feedback. Limited slots; register early.",
  },
  {
    id: "e04",
    title: "Sports Meet: Badminton Doubles",
    category: "Sports",
    organizer: "Sports Department",
    location: "Indoor Sports Complex",
    start: "2026-03-27T16:00:00",
    end: "2026-03-27T18:00:00",
    description: "Friendly tournament. All skill levels welcome.",
  },
  {
    id: "e05",
    title: "Hack Night",
    category: "Tech",
    organizer: "Innovation Cell",
    location: "Lab 204",
    start: "2026-03-29T18:30:00",
    end: "2026-03-29T22:00:00",
    description:
      "Build something small in 3 hours. Teams of 2–4. Snacks included.",
  },
];

const STORAGE_KEY = "cef.registrations.v1";
const NOTIFY_KEY = "cef.notifications.enabled.v1";
const SCHEDULED_KEY = "cef.notifications.scheduled.v1";
const EVENTS_KEY = "cef.events.custom.v1";
const EVENTS_REMOVED_KEY = "cef.events.removed.v1";
const ADMIN_PASS_KEY = "cef.admin.passcode.v1";
const STUDENT_MODE_KEY = "cef.role.student.v1";

const els = {
  events: document.getElementById("events"),
  eventCount: document.getElementById("eventCount"),
  registrations: document.getElementById("registrations"),
  regCount: document.getElementById("regCount"),
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  sortSelect: document.getElementById("sortSelect"),
  adminBtn: document.getElementById("adminBtn"),
  notifyBtn: document.getElementById("notifyBtn"),
  dialog: document.getElementById("registerDialog"),
  registerForm: document.getElementById("registerForm"),
  closeDialogBtn: document.getElementById("closeDialogBtn"),
  cancelBtn: document.getElementById("cancelBtn"),
  eventIdInput: document.getElementById("eventIdInput"),
  dialogEventMeta: document.getElementById("dialogEventMeta"),
  nameInput: document.getElementById("nameInput"),
  emailInput: document.getElementById("emailInput"),
  yearSelect: document.getElementById("yearSelect"),
  reminderSelect: document.getElementById("reminderSelect"),

  adminAuthDialog: document.getElementById("adminAuthDialog"),
  adminAuthForm: document.getElementById("adminAuthForm"),
  adminAuthModeNote: document.getElementById("adminAuthModeNote"),
  adminPassInput: document.getElementById("adminPassInput"),
  adminPassConfirmField: document.getElementById("adminPassConfirmField"),
  adminPassConfirmInput: document.getElementById("adminPassConfirmInput"),
  adminAuthSubmitBtn: document.getElementById("adminAuthSubmitBtn"),
  closeAdminAuthBtn: document.getElementById("closeAdminAuthBtn"),
  cancelAdminAuthBtn: document.getElementById("cancelAdminAuthBtn"),

  adminPanelDialog: document.getElementById("adminPanelDialog"),
  closeAdminPanelBtn: document.getElementById("closeAdminPanelBtn"),
  adminEventForm: document.getElementById("adminEventForm"),
  adminTitleInput: document.getElementById("adminTitleInput"),
  adminCategoryInput: document.getElementById("adminCategoryInput"),
  adminOrganizerInput: document.getElementById("adminOrganizerInput"),
  adminLocationInput: document.getElementById("adminLocationInput"),
  adminStartInput: document.getElementById("adminStartInput"),
  adminEndInput: document.getElementById("adminEndInput"),
  adminDescInput: document.getElementById("adminDescInput"),
  adminEventList: document.getElementById("adminEventList"),
};

function toLocalDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function escapeText(text) {
  return String(text).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return c;
    }
  });
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getRegistrations() {
  const parsed = readJSON(STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

function setRegistrations(list) {
  writeJSON(STORAGE_KEY, list);
}

function getNotificationEnabled() {
  return localStorage.getItem(NOTIFY_KEY) === "true";
}

function setNotificationEnabled(v) {
  localStorage.setItem(NOTIFY_KEY, v ? "true" : "false");
}

function getScheduledMap() {
  const parsed = readJSON(SCHEDULED_KEY, {});
  if (!parsed || typeof parsed !== "object") return {};
  return parsed;
}

function setScheduledMap(map) {
  writeJSON(SCHEDULED_KEY, map);
}

function isStudentMode() {
  return localStorage.getItem(STUDENT_MODE_KEY) === "true";
}

function setStudentMode(on) {
  localStorage.setItem(STUDENT_MODE_KEY, on ? "true" : "false");
}

function getCustomEvents() {
  const parsed = readJSON(EVENTS_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((e) => e && typeof e === "object" && typeof e.id === "string");
}

function setCustomEvents(list) {
  writeJSON(EVENTS_KEY, list);
}

function getRemovedEventIds() {
  const parsed = readJSON(EVENTS_REMOVED_KEY, []);
  if (!Array.isArray(parsed)) return new Set();
  return new Set(parsed.filter((x) => typeof x === "string"));
}

function setRemovedEventIds(set) {
  writeJSON(EVENTS_REMOVED_KEY, Array.from(set));
}

function getAllEvents() {
  const removed = getRemovedEventIds();
  const merged = [...BASE_EVENTS, ...getCustomEvents()].filter((e) => !removed.has(e.id));
  return merged;
}

function findEventById(eventId) {
  return getAllEvents().find((e) => e.id === eventId) || null;
}

function renderCategoryOptions() {
  const current = els.categorySelect.value || "all";
  const cats = Array.from(new Set(getAllEvents().map((e) => e.category))).sort();
  els.categorySelect.innerHTML = `<option value="all">All</option>`;
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    els.categorySelect.appendChild(opt);
  }
  const stillExists = current === "all" || cats.includes(current);
  els.categorySelect.value = stillExists ? current : "all";
}

function getFilteredEvents() {
  const q = (els.searchInput.value || "").trim().toLowerCase();
  const cat = els.categorySelect.value || "all";
  const sort = els.sortSelect.value || "soonest";

  let list = getAllEvents().slice();

  if (cat !== "all") list = list.filter((e) => e.category === cat);

  if (q) {
    list = list.filter((e) => {
      const hay = `${e.title} ${e.organizer} ${e.location} ${e.category}`.toLowerCase();
      return hay.includes(q);
    });
  }

  list.sort((a, b) => {
    const da = new Date(a.start).getTime();
    const db = new Date(b.start).getTime();
    return sort === "latest" ? db - da : da - db;
  });

  return list;
}

function isRegistered(eventId) {
  return getRegistrations().some((r) => r.eventId === eventId);
}

function renderEvents() {
  const list = getFilteredEvents();
  els.eventCount.textContent = `${list.length} event${list.length === 1 ? "" : "s"}`;

  if (list.length === 0) {
    els.events.innerHTML = `<div class="empty">No events match your filters.</div>`;
    return;
  }

  const regs = getRegistrations();
  const regByEvent = new Map(regs.map((r) => [r.eventId, r]));

  els.events.innerHTML = list
    .map((e) => {
      const reg = regByEvent.get(e.id);
      const status = reg ? `<span class="pill">Registered</span>` : "";
      const start = toLocalDateTime(e.start);
      const end = toLocalDateTime(e.end);

      const primaryAction = reg
        ? `<button class="btn btn-secondary" type="button" data-action="ics" data-id="${e.id}">Download .ics</button>`
        : `<button class="btn btn-primary" type="button" data-action="register" data-id="${e.id}">Register</button>`;

      const secondaryAction = reg
        ? `<button class="btn btn-danger" type="button" data-action="unregister" data-id="${e.id}">Cancel</button>`
        : `<button class="btn btn-secondary" type="button" data-action="ics" data-id="${e.id}">Add to calendar</button>`;

      return `
        <article class="event" data-event="${e.id}">
          <div class="event-top">
            <div>
              <h3>${escapeText(e.title)}</h3>
              <div class="event-meta">
                <span class="tag"><strong>When</strong>: ${escapeText(start)} → ${escapeText(end)}</span>
                <span class="tag"><strong>Where</strong>: ${escapeText(e.location)}</span>
                <span class="tag"><strong>Club</strong>: ${escapeText(e.organizer)}</span>
                <span class="tag"><strong>Category</strong>: ${escapeText(e.category)}</span>
              </div>
            </div>
            ${status}
          </div>
          <p class="event-desc">${escapeText(e.description)}</p>
          <div class="event-actions">
            ${primaryAction}
            ${secondaryAction}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderRegistrations() {
  const regs = getRegistrations()
    .slice()
    .sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());

  els.regCount.textContent = `${regs.length}`;

  if (regs.length === 0) {
    els.registrations.innerHTML = `<div class="empty">No registrations yet. Pick an event and click Register.</div>`;
    return;
  }

  const eventsById = new Map(getAllEvents().map((e) => [e.id, e]));

  els.registrations.innerHTML = regs
    .map((r) => {
      const e = eventsById.get(r.eventId);
      if (!e) return "";
      const start = toLocalDateTime(e.start);
      const reminderLabel =
        !r.reminderMinutes || r.reminderMinutes === 0
          ? "No reminder"
          : `${r.reminderMinutes} min before`;

      return `
        <div class="reg">
          <div class="reg-title">${escapeText(e.title)}</div>
          <p class="reg-meta">
            <strong>When</strong>: ${escapeText(start)}<br/>
            <strong>Reminder</strong>: ${escapeText(reminderLabel)}
          </p>
          <div class="reg-actions">
            <button class="btn btn-secondary" type="button" data-action="ics" data-id="${e.id}">Download .ics</button>
            <button class="btn btn-danger" type="button" data-action="unregister" data-id="${e.id}">Cancel</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function openRegisterDialog(eventId) {
  const e = findEventById(eventId);
  if (!e) return;

  els.eventIdInput.value = e.id;
  els.dialogEventMeta.textContent = `${e.organizer} • ${toLocalDateTime(e.start)} • ${e.location}`;

  const last = getRegistrations().find((r) => r.email) || null;
  if (last) {
    els.nameInput.value = last.name || "";
    els.emailInput.value = last.email || "";
    els.yearSelect.value = last.year || "";
  } else {
    els.nameInput.value = "";
    els.emailInput.value = "";
    els.yearSelect.value = "";
  }

  els.reminderSelect.value = "15";
  els.dialog.showModal();
}

function closeDialog() {
  if (els.dialog.open) els.dialog.close();
}

function upsertRegistration({ eventId, name, email, year, reminderMinutes }) {
  const now = new Date().toISOString();
  const list = getRegistrations();
  const existingIdx = list.findIndex((r) => r.eventId === eventId);

  const next = {
    eventId,
    name,
    email,
    year,
    reminderMinutes,
    registeredAt: existingIdx >= 0 ? list[existingIdx].registeredAt : now,
    updatedAt: now,
  };

  if (existingIdx >= 0) list[existingIdx] = next;
  else list.push(next);

  setRegistrations(list);
}

function unregister(eventId) {
  const list = getRegistrations().filter((r) => r.eventId !== eventId);
  setRegistrations(list);

  const map = getScheduledMap();
  delete map[eventId];
  setScheduledMap(map);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toICSDateUTC(iso) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const mo = pad2(d.getUTCMonth() + 1);
  const da = pad2(d.getUTCDate());
  const h = pad2(d.getUTCHours());
  const mi = pad2(d.getUTCMinutes());
  const s = pad2(d.getUTCSeconds());
  return `${y}${mo}${da}T${h}${mi}${s}Z`;
}

function icsEscape(v) {
  return String(v)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildICS(event) {
  const uid = `${event.id}@college-event-finder`;
  const dtStamp = toICSDateUTC(new Date().toISOString());
  const dtStart = toICSDateUTC(event.start);
  const dtEnd = toICSDateUTC(event.end);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//College Event Finder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `LOCATION:${icsEscape(event.location)}`,
    `DESCRIPTION:${icsEscape(`${event.description} (Organizer: ${event.organizer})`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

function downloadICS(eventId) {
  const e = findEventById(eventId);
  if (!e) return;

  const ics = buildICS(e);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    alert("Your browser doesn't support notifications.");
    setNotificationEnabled(false);
    updateNotifyButton();
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    setNotificationEnabled(false);
  } else {
    setNotificationEnabled(true);
    scheduleAllReminders();
    new Notification("Reminders enabled", {
      body: "We’ll notify you while this page is open.",
    });
  }
  updateNotifyButton();
}

function updateNotifyButton() {
  const enabled = getNotificationEnabled();
  els.notifyBtn.textContent = enabled ? "Reminders enabled" : "Enable reminders";
  els.notifyBtn.classList.toggle("btn-primary", enabled);
  els.notifyBtn.classList.toggle("btn-secondary", !enabled);
}

function scheduleAllReminders() {
  if (!getNotificationEnabled()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const regs = getRegistrations();
  const eventsById = new Map(getAllEvents().map((e) => [e.id, e]));
  const scheduled = getScheduledMap();

  for (const r of regs) {
    const minutes = Number(r.reminderMinutes || 0);
    if (!minutes || minutes <= 0) continue;
    if (scheduled[r.eventId]) continue;

    const e = eventsById.get(r.eventId);
    if (!e) continue;

    const startMs = new Date(e.start).getTime();
    const whenMs = startMs - minutes * 60 * 1000;
    const delay = whenMs - Date.now();

    if (delay <= 0) continue;

    scheduled[r.eventId] = {
      whenMs,
      minutes,
    };

    window.setTimeout(() => {
      try {
        new Notification("Event reminder", {
          body: `${e.title} starts in ${minutes} minutes. (${e.location})`,
        });
      } catch {
        // ignore
      } finally {
        const next = getScheduledMap();
        delete next[r.eventId];
        setScheduledMap(next);
      }
    }, delay);
  }

  setScheduledMap(scheduled);
}

function getAdminPasscode() {
  const raw = localStorage.getItem(ADMIN_PASS_KEY);
  return raw ? String(raw) : "";
}

function setAdminPasscode(passcode) {
  localStorage.setItem(ADMIN_PASS_KEY, String(passcode));
}

let isAdmin = false;
let adminAuthMode = "login"; // "setup" | "login"

function openAdminAuth() {
  const hasPass = Boolean(getAdminPasscode());
  adminAuthMode = hasPass ? "login" : "setup";

  els.adminAuthModeNote.textContent =
    adminAuthMode === "setup"
      ? "Set a new admin passcode."
      : "Enter your admin passcode.";

  els.adminPassConfirmField.style.display = adminAuthMode === "setup" ? "" : "none";
  els.adminPassConfirmInput.required = adminAuthMode === "setup";
  els.adminAuthSubmitBtn.textContent = adminAuthMode === "setup" ? "Set passcode" : "Login";

  els.adminPassInput.value = "";
  els.adminPassConfirmInput.value = "";
  els.adminAuthDialog.showModal();
  els.adminPassInput.focus();
}

function closeAdminAuth() {
  if (els.adminAuthDialog.open) els.adminAuthDialog.close();
}

function openAdminPanel() {
  isAdmin = true;
  renderAdminList();
  els.adminPanelDialog.showModal();
}

function closeAdminPanel() {
  if (els.adminPanelDialog.open) els.adminPanelDialog.close();
}

function makeId() {
  return `c_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function parseLocalDateTimeToISO(v) {
  // datetime-local gives "YYYY-MM-DDTHH:mm" (no timezone). Treat as local time.
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function toDatetimeLocalValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mo = pad2(d.getMonth() + 1);
  const da = pad2(d.getDate());
  const h = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${y}-${mo}-${da}T${h}:${mi}`;
}

function addCustomEvent({ title, category, organizer, location, start, end, description }) {
  const id = makeId();
  const ev = { id, title, category, organizer, location, start, end, description, source: "custom" };
  const list = getCustomEvents();
  list.push(ev);
  setCustomEvents(list);
}

function removeEvent(eventId) {
  const custom = getCustomEvents();
  const idx = custom.findIndex((e) => e.id === eventId);
  if (idx >= 0) {
    custom.splice(idx, 1);
    setCustomEvents(custom);
  } else {
    const removed = getRemovedEventIds();
    removed.add(eventId);
    setRemovedEventIds(removed);
  }

  // Remove registrations for deleted event.
  const regs = getRegistrations().filter((r) => r.eventId !== eventId);
  setRegistrations(regs);
}

function renderAdminList() {
  const list = getAllEvents()
    .slice()
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  if (list.length === 0) {
    els.adminEventList.innerHTML = `<div class="empty">No events found.</div>`;
    return;
  }

  els.adminEventList.innerHTML = list
    .map((e) => {
      const isCustom = getCustomEvents().some((c) => c.id === e.id);
      const badge = isCustom ? `<span class="pill">Custom</span>` : `<span class="pill">Default</span>`;
      return `
        <div class="admin-item">
          <div class="event-top">
            <div>
              <p class="admin-item-title">${escapeText(e.title)}</p>
              <p class="admin-item-meta">
                <strong>When</strong>: ${escapeText(toLocalDateTime(e.start))}<br/>
                <strong>Where</strong>: ${escapeText(e.location)}<br/>
                <strong>Organizer</strong>: ${escapeText(e.organizer)} • <strong>Category</strong>: ${escapeText(e.category)}
              </p>
            </div>
            ${badge}
          </div>
          <div class="event-actions">
            <button class="btn btn-danger" type="button" data-action="admin-remove" data-id="${e.id}">Remove</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function updateAdminVisibility() {
  if (!els.adminBtn) return;
  if (isStudentMode()) {
    els.adminBtn.style.display = "none";
  } else {
    els.adminBtn.style.display = "";
  }
}

function wireEvents() {
  els.searchInput.addEventListener("input", () => renderEvents());
  els.categorySelect.addEventListener("change", () => renderEvents());
  els.sortSelect.addEventListener("change", () => renderEvents());

  els.notifyBtn.addEventListener("click", async () => {
    if (getNotificationEnabled()) {
      setNotificationEnabled(false);
      updateNotifyButton();
      return;
    }
    await enableNotifications();
  });

  els.events.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    if (action === "register") openRegisterDialog(id);
    if (action === "ics") downloadICS(id);
    if (action === "unregister") {
      unregister(id);
      renderEvents();
      renderRegistrations();
    }
  });

  els.registrations.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    if (action === "ics") downloadICS(id);
    if (action === "unregister") {
      unregister(id);
      renderEvents();
      renderRegistrations();
    }
  });

  els.closeDialogBtn.addEventListener("click", closeDialog);
  els.cancelBtn.addEventListener("click", closeDialog);

  els.registerForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(els.registerForm);
    const eventId = String(fd.get("eventId") || "").trim();
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const year = String(fd.get("year") || "").trim();
    const reminderMinutes = Number(fd.get("reminderMinutes") || 0);

    if (!eventId || !name || !email || !year) return;

    upsertRegistration({ eventId, name, email, year, reminderMinutes });

    // Once a student has registered (treated as "logged in"), hide admin entry.
    setStudentMode(true);
    updateAdminVisibility();

    closeDialog();
    renderEvents();
    renderRegistrations();
    scheduleAllReminders();

    const e = findEventById(eventId);
    if (e) {
      const msg = reminderMinutes
        ? `Registered for "${e.title}". Reminder set for ${reminderMinutes} minutes before.`
        : `Registered for "${e.title}".`;
      alert(msg);
    }
  });

  els.adminBtn.addEventListener("click", () => {
    if (isAdmin) {
      openAdminPanel();
      return;
    }
    openAdminAuth();
  });

  els.closeAdminAuthBtn.addEventListener("click", closeAdminAuth);
  els.cancelAdminAuthBtn.addEventListener("click", closeAdminAuth);

  els.adminAuthForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(els.adminAuthForm);
    const pass = String(fd.get("passcode") || "").trim();
    const pass2 = String(fd.get("passcodeConfirm") || "").trim();

    if (adminAuthMode === "setup") {
      if (!pass || pass.length < 4) {
        alert("Passcode must be at least 4 characters.");
        return;
      }
      if (pass !== pass2) {
        alert("Passcodes do not match.");
        return;
      }
      setAdminPasscode(pass);
      closeAdminAuth();
      openAdminPanel();
      alert("Admin passcode set.");
      return;
    }

    const expected = getAdminPasscode();
    if (!expected) {
      // fallback: if storage got cleared
      closeAdminAuth();
      openAdminAuth();
      return;
    }
    if (pass !== expected) {
      alert("Incorrect passcode.");
      return;
    }
    closeAdminAuth();
    openAdminPanel();
  });

  els.closeAdminPanelBtn.addEventListener("click", closeAdminPanel);

  els.adminEventForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!isAdmin) return;

    const fd = new FormData(els.adminEventForm);
    const title = String(fd.get("title") || "").trim();
    const category = String(fd.get("category") || "").trim();
    const organizer = String(fd.get("organizer") || "").trim();
    const location = String(fd.get("location") || "").trim();
    const startLocal = String(fd.get("start") || "").trim();
    const endLocal = String(fd.get("end") || "").trim();
    const description = String(fd.get("description") || "").trim();

    const start = parseLocalDateTimeToISO(startLocal);
    const end = parseLocalDateTimeToISO(endLocal);

    if (!title || !category || !organizer || !location || !start || !end || !description) return;
    if (new Date(end).getTime() <= new Date(start).getTime()) {
      alert("End time must be after start time.");
      return;
    }

    addCustomEvent({ title, category, organizer, location, start, end, description });
    els.adminEventForm.reset();

    renderCategoryOptions();
    renderEvents();
    renderAdminList();
    alert("Event added.");
  });

  els.adminEventList.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (action !== "admin-remove" || !id) return;
    if (!isAdmin) return;

    const e = findEventById(id);
    if (!e) return;

    const ok = confirm(`Remove event: "${e.title}"?\n\nThis will also remove any registrations for it on this device.`);
    if (!ok) return;

    removeEvent(id);
    renderCategoryOptions();
    renderEvents();
    renderRegistrations();
    renderAdminList();
  });
}

function init() {
  renderCategoryOptions();
  updateNotifyButton();
  updateAdminVisibility();
  wireEvents();
  renderEvents();
  renderRegistrations();
  scheduleAllReminders();
}

init();

