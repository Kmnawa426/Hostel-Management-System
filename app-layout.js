(function () {
  const path = (window.location.pathname.split('/').pop() || '').toLowerCase();
  if (!path || path === 'login.html' || path === 'index.html') return;
  const isHomePage = path === 'dashboard.html';

  const pageMap = {
    'dashboard.html': 'Dashboard',
    'add-student.html': 'Add Student',
    'students.html': 'Students',
    'manage-students.html': 'Manage Students',
    'rooms.html': 'Rooms',
    'room-details.html': 'Room Details',
    'attendance.html': 'Attendance',
    'installments.html': 'Installments',
    'transactions.html': 'Transactions',
    'notifications.html': 'Notifications',
    'complaints.html': 'Complaints',
    'college.html': 'College',
    'events.html': 'Hostel Events'
  };

  const navItems = [
    { href: 'dashboard.html', label: 'Dashboard' },
    { href: 'add-student.html', label: 'Add Student' },
    { href: 'students.html', label: 'Students' },
    { href: 'manage-students.html', label: 'Manage Students' },
    { href: 'rooms.html', label: 'Rooms' },
    { href: 'attendance.html', label: 'Attendance' },
    { href: 'installments.html', label: 'Installments' },
    { href: 'transactions.html', label: 'Transactions' },
    { href: 'notifications.html', label: 'Notifications' },
    { href: 'complaints.html', label: 'Complaints' },
    { href: 'college.html', label: 'College' },
    { href: 'events.html', label: 'Hostel Events' }
  ];

  function inferTitle() {
    if (pageMap[path]) return pageMap[path];
    const raw = document.title || 'Page';
    return raw.split('|')[0].split('-')[0].trim();
  }

  function buildDrawer() {
    if (isHomePage) return null;

    const wrap = document.createElement('div');
    wrap.className = 'app-drawer-wrap';

    const backdrop = document.createElement('div');
    backdrop.className = 'app-drawer-backdrop';
    backdrop.id = 'appDrawerBackdrop';

    const drawer = document.createElement('aside');
    drawer.className = 'app-drawer';
    drawer.id = 'appDrawer';
    drawer.innerHTML = '<h3 class="app-drawer-title">Menu</h3>';

    const nav = document.createElement('nav');
    nav.className = 'app-drawer-nav';

    navItems.forEach((item) => {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = 'app-drawer-link' + (item.href === path ? ' active' : '');
      a.textContent = item.label;
      a.addEventListener('click', function (event) {
        event.preventDefault();
        closeDrawer();
        if (item.href !== path) {
          window.setTimeout(function () {
            window.location.href = item.href;
          }, 140);
        }
      });
      nav.appendChild(a);
    });

    drawer.appendChild(nav);
    wrap.appendChild(backdrop);
    wrap.appendChild(drawer);
    return wrap;
  }

  function openDrawer() {
    document.body.classList.add('drawer-open');
  }

  function closeDrawer() {
    document.body.classList.remove('drawer-open');
  }

  function closeExportModal() {
    const modal = document.getElementById('appExportModal');
    if (modal) modal.remove();
  }

  function escHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function csvEscape(value) {
    return '"' + String(value ?? '').replace(/"/g, '""') + '"';
  }

  function getStudentsExportRows() {
    if (typeof allStudents === 'undefined' || !Array.isArray(allStudents)) return [];
    return allStudents.map(function (s) {
      const roomName = typeof getRoomLabel === 'function' ? getRoomLabel(s, '-') : (s.rooms && s.rooms.room_number ? s.rooms.room_number : '-');
      const pending = typeof getPendingAmount === 'function' ? getPendingAmount(s) : '';
      return {
        name: s.name || '',
        hst: s.hst_number || '',
        class_name: s.class || '',
        room: roomName || '-',
        status: (s.status || 'present').toUpperCase(),
        remaining: pending,
        father_name: s.father_name || '',
        father_phone: s.father_phone || '',
        mother_name: s.mother_name || '',
        mother_phone: s.mother_phone || '',
        student_phone: s.student_phone || ''
      };
    });
  }

  function getAttendanceExportRows(statusFilter) {
    const source = (typeof allAttendance !== 'undefined' && Array.isArray(allAttendance))
      ? allAttendance
      : [];

    return source.map(function (s) {
      const status = String(s.status || 'present').toLowerCase();
      return {
        name: String(s.name || '').trim(),
        hst: String(s.hst_number || '').trim(),
        room: String((s.rooms && s.rooms.room_number) || '-').trim(),
        status: status.toUpperCase(),
        note: String(s.note || '-').trim(),
        absent_since: (status === 'absent' && s.absent_since)
          ? new Date(s.absent_since).toLocaleDateString()
          : '-',
        __status: status
      };
    }).filter(function (row) {
      if (!statusFilter || statusFilter === 'all') return true;
      return row.__status === statusFilter;
    });
  }

  function getExportProvider() {
    if (path === 'students.html') {
      return {
        title: 'Export Students',
        fields: [
          { key: 'name', label: 'Name' },
          { key: 'hst', label: 'HST' },
          { key: 'class_name', label: 'Class' },
          { key: 'room', label: 'Room' },
          { key: 'status', label: 'Status' },
          { key: 'remaining', label: 'Remaining Installments' },
          { key: 'father_name', label: 'Father Name' },
          { key: 'father_phone', label: 'Father Phone' },
          { key: 'mother_name', label: 'Mother Name' },
          { key: 'mother_phone', label: 'Mother Phone' },
          { key: 'student_phone', label: 'Student Phone' }
        ],
        getRows: function () {
          return getStudentsExportRows();
        }
      };
    }

    if (path === 'attendance.html') {
      return {
        title: 'Export Attendance',
        filters: [{ key: 'status_filter', label: 'Attendance', type: 'select', options: [
          { value: 'all', label: 'All' },
          { value: 'present', label: 'Present' },
          { value: 'absent', label: 'Absent' }
        ] }],
        fields: [
          { key: 'name', label: 'Student Name' },
          { key: 'hst', label: 'HST' },
          { key: 'room', label: 'Room' },
          { key: 'status', label: 'Status' },
          { key: 'note', label: 'Last Note' },
          { key: 'absent_since', label: 'Absent Since' }
        ],
        getRows: function (options) {
          return getAttendanceExportRows(options.status_filter || 'all');
        }
      };
    }

    return null;
  }

  function runConfiguredExport(provider) {
    const checks = Array.from(document.querySelectorAll('.app-export-check'));
    const selectedKeys = checks.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
    if (!selectedKeys.length) {
      window.alert('Select at least one field to export.');
      return;
    }

    const options = {};
    (provider.filters || []).forEach(function (filter) {
      const el = document.getElementById('appExportFilter_' + filter.key);
      options[filter.key] = el ? el.value : '';
    });

    const rows = provider.getRows(options);
    if (!rows || !rows.length) {
      window.alert('No data found for selected export options.');
      return;
    }

    const fieldMap = {};
    provider.fields.forEach(function (f) { fieldMap[f.key] = f; });
    const headers = selectedKeys.map(function (key) { return fieldMap[key] ? fieldMap[key].label : key; });

    const csvLines = [];
    csvLines.push(headers.map(csvEscape).join(','));
    rows.forEach(function (row) {
      csvLines.push(selectedKeys.map(function (key) { return csvEscape(row[key]); }).join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = (inferTitle().toLowerCase().replace(/\s+/g, '-') || 'export') + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    closeExportModal();
  }

  function openConfiguredExportModal(provider) {
    closeExportModal();

    const modal = document.createElement('div');
    modal.id = 'appExportModal';
    modal.className = 'app-export-modal';

    const filterHtml = (provider.filters || []).map(function (filter) {
      if (filter.type === 'select') {
        const opts = filter.options.map(function (opt) {
          return '<option value="' + escHtml(opt.value) + '">' + escHtml(opt.label) + '</option>';
        }).join('');
        return '<div class="app-export-filter"><label for="appExportFilter_' + escHtml(filter.key) + '">' + escHtml(filter.label) + '</label><select id="appExportFilter_' + escHtml(filter.key) + '">' + opts + '</select></div>';
      }
      return '';
    }).join('');

    const options = provider.fields.map(function (field) {
      return '<label class="app-export-item"><input type="checkbox" class="app-export-check" value="' + escHtml(field.key) + '" checked> ' + escHtml(field.label) + '</label>';
    }).join('');

    modal.innerHTML =
      '<div class="app-export-content">' +
      '<div class="app-export-header"><h3>' + escHtml(provider.title || 'Export Data') + '</h3></div>' +
      '<div class="app-export-body">' +
      (filterHtml ? ('<div class="app-export-filters">' + filterHtml + '</div>') : '') +
      '<label class="app-export-item app-export-select-all"><input type="checkbox" id="appExportSelectAll" checked> Select All</label>' +
      '<div class="app-export-grid">' + options + '</div>' +
      '</div>' +
      '<div class="app-export-footer">' +
      '<button type="button" class="secondary" id="appExportCancelBtn">Cancel</button>' +
      '<button type="button" class="primary" id="appExportRunBtn">Download CSV</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(modal);

    const selectAll = document.getElementById('appExportSelectAll');
    const checks = Array.from(document.querySelectorAll('.app-export-check'));
    const cancelBtn = document.getElementById('appExportCancelBtn');
    const runBtn = document.getElementById('appExportRunBtn');

    function syncSelectAllState() {
      if (!selectAll) return;
      const allChecked = checks.length > 0 && checks.every(function (item) { return item.checked; });
      selectAll.checked = allChecked;
      selectAll.indeterminate = false;
    }

    if (selectAll) {
      selectAll.addEventListener('change', function () {
        checks.forEach(function (check) { check.checked = selectAll.checked; });
        selectAll.indeterminate = false;
      });
    }

    checks.forEach(function (check) {
      check.addEventListener('change', function () {
        syncSelectAllState();
      });
    });

    syncSelectAllState();

    if (cancelBtn) cancelBtn.addEventListener('click', closeExportModal);
    if (runBtn) runBtn.addEventListener('click', function () { runConfiguredExport(provider); });
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeExportModal();
    });
  }

  async function appLogout() {
    if (typeof window.__existingLogout === 'function') {
      await window.__existingLogout();
      return;
    }
    try {
      if (typeof window.getSupabaseClient === 'function') {
        const client = window.getSupabaseClient();
        await client.auth.signOut();
      }
    } catch (error) {
      // Ignore and continue to login screen.
    }
    window.location.href = 'login.html';
  }

  function appExport() {
    if (typeof window.openExportModal === 'function') {
      window.openExportModal();
      return;
    }
    const provider = getExportProvider();
    if (!provider) {
      window.alert('Export is not available on this page.');
      return;
    }
    openConfiguredExportModal(provider);
  }

  async function syncTopbarNotifications() {
    const notifBtn = document.getElementById('appNotificationsBtn');
    if (!notifBtn) return;

    if (window.HostelNotifications && typeof window.HostelNotifications.refreshNotificationBadges === 'function') {
      try {
        await window.HostelNotifications.refreshNotificationBadges();
      } catch (error) {
        // Keep the top bar usable even if notifications fail to load.
      }
    }
  }

  window.addEventListener('DOMContentLoaded', function () {
    const legacyTopbars = Array.from(document.querySelectorAll('.topbar'));
    legacyTopbars.forEach((el) => el.remove());

    const title = inferTitle();
    window.__existingLogout = typeof window.logout === 'function' ? window.logout : null;
    window.logout = appLogout;

    const topbar = document.createElement('header');
    topbar.className = 'app-topbar';
    topbar.innerHTML =
      '<div class="app-topbar-left">' +
      '<button type="button" class="app-menu-toggle" id="appMenuToggle" aria-label="Open menu">&#9776;</button>' +
      '<h1 class="app-brand">Hostel Management System</h1>' +
      '</div>' +
      '<div class="app-topbar-right">' +
      '<button type="button" class="primary" id="appExportBtn">Export</button>' +
      '<button type="button" class="app-icon-btn" id="appNotificationsBtn" aria-label="Notifications" title="Notifications">' +
      '<span class="app-icon-btn-svg" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6h-1V11a6 6 0 1 0-12 0v5H5a1 1 0 0 0 0 2h14a1 1 0 1 0 0-2Zm-3 0H8V11a4 4 0 1 1 8 0v5Z" fill="currentColor"/></svg>' +
      '</span>' +
      '<span class="app-notif-badge" data-notif-badge style="display:none;"></span>' +
      '</button>' +
      '<button type="button" class="danger" id="appLogoutBtn">Logout</button>' +
      '</div>';

    const heading = document.createElement('section');
    heading.className = 'app-page-header';
    heading.innerHTML = '<h2 class="app-page-title">' + title + '</h2>';

    const frag = document.createDocumentFragment();
    const drawer = buildDrawer();
    frag.appendChild(topbar);
    frag.appendChild(heading);
    if (drawer) frag.appendChild(drawer);

    document.body.insertBefore(frag, document.body.firstChild);

    if (!document.querySelector('.app-watermark')) {
      const watermark = document.createElement('div');
      watermark.className = 'app-watermark';
      watermark.innerHTML = '<img src="assets/trisha-logo.png" alt="Trisha Logo">'; // CHANGE REQUIRED: replace watermark logo file and alt text
      document.body.appendChild(watermark);
    }

    const exportBtn = document.getElementById('appExportBtn');
    const notificationsBtn = document.getElementById('appNotificationsBtn');
    const logoutBtn = document.getElementById('appLogoutBtn');
    const menuToggle = document.getElementById('appMenuToggle');
    const drawerBackdrop = document.getElementById('appDrawerBackdrop');

    const exportPages = new Set(['students.html', 'attendance.html', 'installments.html']);
    if (exportBtn && exportPages.has(path)) {
      exportBtn.addEventListener('click', appExport);
    } else if (exportBtn) {
      exportBtn.style.display = 'none';
    }
    if (notificationsBtn) {
      notificationsBtn.addEventListener('click', function () {
        if (path !== 'notifications.html') {
          window.location.href = 'notifications.html';
        }
      });
    }
    if (logoutBtn) logoutBtn.addEventListener('click', appLogout);
    if (menuToggle && !isHomePage) {
      menuToggle.addEventListener('click', openDrawer);
    } else if (menuToggle) {
      menuToggle.style.display = 'none';
    }
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);
    syncTopbarNotifications();

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeDrawer();
    });
  });
})();
