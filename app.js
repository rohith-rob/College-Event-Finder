const EVENTS = [
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

const els = {
  events: document.getElementById("events"),
  eventCount: document.getElementById("eventCount"),
  registrations: document.getElementById("registrations"),
  regCount: document.getElementById("regCount"),
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  sortSelect: document.getElementById("sortSelect"),
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

function getRegistrations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function setRegistrations(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getNotificationEnabled() {
  return localStorage.getItem(NOTIFY_KEY) === "true";
}

function setNotificationEnabled(v) {
  localStorage.setItem(NOTIFY_KEY, v ? "true" : "false");
}

function getScheduledMap() {
  try {
    const raw = localStorage.getItem(SCHEDULED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function setScheduledMap(map) {
  localStorage.setItem(SCHEDULED_KEY, JSON.stringify(map));
}

function deriveCategories() {
  const cats = Array.from(new Set(EVENTS.map((e) => e.category))).sort();
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    els.categorySelect.appendChild(opt);
  }
}

function getFilteredEvents() {
  const q = (els.searchInput.value || "").trim().toLowerCase();
  const cat = els.categorySelect.value || "all";
  const sort = els.sortSelect.value || "soonest";

  let list = EVENTS.slice();

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

  const eventsById = new Map(EVENTS.map((e) => [e.id, e]));

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
  const e = EVENTS.find((x) => x.id === eventId);
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
  const e = EVENTS.find((x) => x.id === eventId);
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
  const eventsById = new Map(EVENTS.map((e) => [e.id, e]));
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

    closeDialog();
    renderEvents();
    renderRegistrations();
    scheduleAllReminders();

    const e = EVENTS.find((x) => x.id === eventId);
    if (e) {
      const msg = reminderMinutes
        ? `Registered for "${e.title}". Reminder set for ${reminderMinutes} minutes before.`
        : `Registered for "${e.title}".`;
      alert(msg);
    }
  });
}

function init() {
  deriveCategories();
  updateNotifyButton();
  wireEvents();
  renderEvents();
  renderRegistrations();
  scheduleAllReminders();
}

init();

