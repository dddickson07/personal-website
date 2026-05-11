/* ═══════════════════════════════════════════════════════════
   macOS Desktop — JavaScript
   Window management, dock, Finder sidebar, Notes, Calendar
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── State ──────────────────────────────────────────────────── */
const state = {
  topZ: 300,
  openWindows: new Set(),
  activeNote: null,
  activeFinderFolder: 'about',
  activePhotosAlbum: 'all',
  activeMusicTab: 'good-reads',
};

/* ── Window Management ──────────────────────────────────────── */

function openApp(winId) {
  const win = document.getElementById('win-' + winId);
  if (!win) return;

  if (state.openWindows.has(winId)) {
    // Already open — bring to front
    bringToFront(win);
    return;
  }

  state.openWindows.add(winId);

  // Set initial position with slight cascade for multiple windows
  const offset = (state.openWindows.size - 1) * 22;
  win.style.top  = (parseInt(win.dataset.defaultTop  || win.style.top  || 60) + offset) + 'px';
  win.style.left = (parseInt(win.dataset.defaultLeft || win.style.left || 60) + offset) + 'px';

  win.classList.add('visible', 'opening');
  setTimeout(() => win.classList.remove('opening'), 200);

  bringToFront(win);
  updateDockDot(winId, true);

  // Special init per app
  if (winId === 'notes')    initNotes();
  if (winId === 'calendar') renderCalendar();
}

function closeApp(winId) {
  const win = document.getElementById('win-' + winId);
  if (!win) return;

  win.classList.add('closing');
  setTimeout(() => {
    win.classList.remove('visible', 'closing');
    state.openWindows.delete(winId);
    updateDockDot(winId, false);
  }, 160);
}

function minimizeApp(winId) {
  const win = document.getElementById('win-' + winId);
  if (!win) return;
  win.classList.add('closing');
  setTimeout(() => {
    win.classList.remove('visible', 'closing');
    // Keep in openWindows — it's minimized, not closed
    updateDockDot(winId, false);
  }, 160);
}

function bringToFront(win) {
  state.topZ += 1;
  win.style.zIndex = state.topZ;
}

function updateDockDot(winId, open) {
  const dots = document.querySelectorAll(`.dock-item[data-app="${winId}"] .dock-dot`);
  dots.forEach(d => d.style.opacity = open ? '1' : '0');
}

/* ── Window Dragging ────────────────────────────────────────── */

function initDragging() {
  document.querySelectorAll('.win-chrome').forEach(chrome => {
    const win = chrome.closest('.macos-window');
    if (!win) return;

    let startX, startY, startLeft, startTop, dragging = false;

    chrome.addEventListener('mousedown', e => {
      // Don't drag when clicking traffic lights or buttons
      if (e.target.closest('.traffic-lights') || e.target.closest('button')) return;

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(win.style.left) || win.offsetLeft;
      startTop  = parseInt(win.style.top)  || win.offsetTop;

      bringToFront(win);
      win.style.transition = 'none';

      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newLeft = Math.max(0, startLeft + dx);
      const newTop  = Math.max(28, startTop  + dy); // 28 = menubar height

      win.style.left = newLeft + 'px';
      win.style.top  = newTop  + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        win.style.transition = '';
      }
    });

    // Bring to front on click
    win.addEventListener('mousedown', () => bringToFront(win));
  });
}

/* ── Menu Bar Clock ─────────────────────────────────────────── */

function updateClock() {
  const el = document.getElementById('menubar-time');
  if (!el) return;
  const now = new Date();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day  = days[now.getDay()];
  const mon  = months[now.getMonth()];
  const date = now.getDate();
  let hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  el.textContent = `${day} ${mon} ${date}  ${hours}:${mins} ${ampm}`;
}

/* ── Finder Sidebar ─────────────────────────────────────────── */

function showFinderFolder(folderId) {
  // Update sidebar active state
  document.querySelectorAll('.finder-sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.folder === folderId);
  });

  // Show correct pane
  document.querySelectorAll('.finder-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === 'fp-' + folderId);
  });

  state.activeFinderFolder = folderId;
}

/* ── Notes Sidebar ──────────────────────────────────────────── */

function initNotes() {
  // Auto-select first note
  const firstItem = document.querySelector('.notes-list-item');
  if (firstItem) firstItem.click();
}

function showNote(noteId) {
  // Sidebar active state
  document.querySelectorAll('.notes-list-item').forEach(item => {
    item.classList.toggle('active', item.dataset.noteId === noteId);
  });

  // Hide all note bodies, show selected
  document.querySelectorAll('.note-body').forEach(body => {
    body.classList.toggle('active', body.id === 'note-' + noteId);
  });

  // Hide the empty state
  const empty = document.getElementById('notes-empty-state');
  if (empty) empty.style.display = 'none';

  state.activeNote = noteId;
}

/* ── Photos Sidebar ─────────────────────────────────────────── */

function showPhotosAlbum(albumId) {
  document.querySelectorAll('.photos-sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.album === albumId);
  });
  document.querySelectorAll('.photos-album-pane').forEach(pane => {
    pane.style.display = pane.id === 'album-' + albumId ? 'block' : 'none';
  });
  state.activePhotosAlbum = albumId;
}

/* ── Music / Good Reads Sidebar ─────────────────────────────── */

function showMusicTab(tabId) {
  document.querySelectorAll('.music-sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });
  document.querySelectorAll('.music-tab-pane').forEach(pane => {
    pane.style.display = pane.id === 'mtab-' + tabId ? 'block' : 'none';
  });
  state.activeMusicTab = tabId;
}

/* ── Calendar ───────────────────────────────────────────────── */

let calMonth, calYear;

function renderCalendar() {
  const now = new Date();
  if (!calMonth) { calMonth = now.getMonth(); calYear = now.getFullYear(); }

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];

  const titleEl = document.getElementById('cal-month-title');
  if (titleEl) titleEl.textContent = `${monthNames[calMonth]} ${calYear}`;

  const daysEl = document.getElementById('cal-days');
  if (!daysEl) return;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev  = new Date(calYear, calMonth, 0).getDate();

  let html = '';

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month">${daysInPrev - i}</div>`;
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
    html += `<div class="cal-day${isToday ? ' today' : ''}">${d}</div>`;
  }

  // Next month leading days
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day other-month">${i}</div>`;
  }

  daysEl.innerHTML = html;
}

function calPrevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function calNextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

/* ── Desktop Icon double-click ──────────────────────────────── */
function initDesktopIcons() {
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    let clicks = 0;
    icon.addEventListener('click', () => {
      clicks++;
      if (clicks === 1) {
        icon.classList.add('selected');
        setTimeout(() => { clicks = 0; }, 300);
      } else if (clicks === 2) {
        icon.classList.remove('selected');
        clicks = 0;
        const app = icon.dataset.app;
        if (app) openApp(app);
      }
    });
  });
}

/* ── Boot ───────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initDragging();
  initDesktopIcons();
  updateClock();
  setInterval(updateClock, 30000);

  // Open About window by default
  openApp('about');
});
