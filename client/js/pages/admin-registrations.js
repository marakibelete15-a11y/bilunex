import { api } from '../api.js';
import {
  setupAdmin,
  el,
  cell,
  table,
  message,
  paginationControls,
  loadList,
  dateText,
  statusBadge,
} from './admin-common.js';

if (setupAdmin()) {
  const form = document.getElementById('filters');
  const metricsHost = document.getElementById('registration-metrics');
  const tableHost = document.getElementById('registrations-table');
  const listStateHost = document.getElementById('list-state');
  const paginationHost = document.getElementById('pagination');

  // Modal elements
  const modal = document.getElementById('registration-modal');
  const modalBody = document.getElementById('modal-body-content');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalActions = document.getElementById('modal-actions');

  let page = 1;

  function closeModal() {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  async function loadMetrics() {
    try {
      const { data } = await api.get('/admin/reports/summary');
      const items = data.parent_registrations || [];
      const total = items.reduce((sum, cur) => sum + Number(cur.count || 0), 0);
      const getCount = st => Number(items.find(i => i.status === st)?.count || 0);

      const pending = getCount('new');
      const contacted = getCount('contacted') + getCount('enrolled');
      const notContacted = total >= contacted ? total - contacted : 0;

      metricsHost.replaceChildren();

      const makeCard = (title, count, subtext) => {
        const card = el('div', null, 'metric-card');
        const header = el('div', null, 'metric-card-header');
        header.append(el('span', title, 'metric-card-title'));
        const val = el('div', count, 'metric-card-value');
        const sub = el('div', subtext, 'metric-card-sub');
        card.append(header, val, sub);
        return card;
      };

      metricsHost.append(
        makeCard('Total Parents', total, 'All registered families'),
        makeCard('Pending Review', pending, 'Awaiting initial intake review'),
        makeCard('Contacted', contacted, 'Outreach completed or active'),
        makeCard('Not Contacted', notContacted, 'Pending outreach from staff')
      );
    } catch {
      // Absorb metrics load failure without breaking table
    }
  }

  function openDetailsModal(item) {
    modalBody.replaceChildren();

    const dl = el('dl', null, 'portal-detail-grid');

    const addField = (label, val) => {
      const box = el('div', null, 'portal-detail-box');
      box.append(
        el('dt', label, 'portal-detail-label'),
        el('dd', val || '—', 'portal-detail-value')
      );
      dl.append(box);
    };

    addField('Parent Name', `${item.preferred_title || ''} ${item.parent_name}`.trim());
    addField('Email Address', item.email);
    addField('Primary Phone', item.phone);
    addField('Secondary Phone', item.secondary_phone);
    addField(
      'Telegram Handle',
      item.telegram_handle ? `@${item.telegram_handle.replace(/^@/, '')}` : null
    );
    addField(
      'Preferred Contact',
      Array.isArray(item.preferred_communication_method)
        ? item.preferred_communication_method.join(', ')
        : item.preferred_communication_method
    );
    addField('Student Name', item.child_name);
    addField('Grade Level', item.grade_level);
    addField(
      'Requested Subjects',
      Array.isArray(item.subjects) ? item.subjects.join(', ') : item.subjects
    );
    addField('Support Category', item.support_category);
    addField('Current Status', item.status);
    addField('Registered Date', dateText(item.created_at));

    const notesSection = el('div', null, 'portal-notes-section');
    notesSection.append(
      el('h3', 'Parent Notes / Context', 'portal-section-title'),
      el('p', item.notes || 'No additional notes provided by parent.', 'portal-notes-content')
    );

    const statusSection = el('div', null, 'portal-status-section');
    statusSection.append(el('h3', 'Update Registration Status', 'portal-section-title'));

    const btnGroup = el('div', null, 'portal-btn-group');

    const statuses = [
      ['new', 'Mark as Pending Review'],
      ['contacted', 'Mark as Contacted'],
      ['enrolled', 'Mark as Enrolled'],
      ['archived', 'Archive Registration'],
    ];

    statuses.forEach(([st, label]) => {
      const btn = el('button', label, 'btn btn-sm');
      if (item.status === st) {
        btn.classList.add('btn-primary');
        btn.disabled = true;
      } else {
        btn.classList.add('btn-outline');
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            await api.patch(`/admin/parent-registrations/${item.id}/status`, { status: st });
            closeModal();
            refresh();
            loadMetrics();
          } catch (err) {
            message(listStateHost, err.message, 'error');
            btn.disabled = false;
          }
        });
      }
      btnGroup.append(btn);
    });

    statusSection.append(btnGroup);
    modalBody.append(dl, notesSection, statusSection);

    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
  }

  const refresh = () =>
    loadList({
      endpoint: '/admin/parent-registrations',
      params: { page, limit: 20, ...Object.fromEntries(new FormData(form)) },
      key: 'registrations',
      statusHost: listStateHost,
      render: (items, p) => {
        const rows = items.map(item => {
          const row = document.createElement('tr');

          // 1. ID
          row.append(cell(item.id));

          // 2. Parent Name (+ preferred title, email below)
          const parentTd = document.createElement('td');
          const title = item.preferred_title ? `${item.preferred_title} ` : '';
          parentTd.append(el('div', `${title}${item.parent_name}`, 'font-semibold'));
          if (item.email) {
            parentTd.append(el('div', item.email, 'text-xs text-subtle'));
          }
          row.append(parentTd);

          // 3. Student Name
          const studentTd = document.createElement('td');
          studentTd.append(el('span', item.child_name || '—', 'font-medium'));
          row.append(studentTd);

          // 4. Grade Level
          row.append(cell(item.grade_level || '—'));

          // 5. Requested Subjects (badges)
          const subjectsTd = document.createElement('td');
          const subs = Array.isArray(item.subjects) ? item.subjects : [];
          if (subs.length) {
            const tagWrap = el('div', null, 'subject-tags');
            subs.forEach(s => tagWrap.append(el('span', s, 'subject-tag')));
            subjectsTd.append(tagWrap);
          } else {
            subjectsTd.append(el('span', 'General', 'text-subtle'));
          }
          row.append(subjectsTd);

          // 6. Support Category
          row.append(cell(item.support_category || 'Combined Support'));

          // 7. Phone / Telegram
          const contactTd = document.createElement('td');
          contactTd.append(el('div', item.phone || '—', 'font-medium'));
          if (item.telegram_handle) {
            const handle = item.telegram_handle.startsWith('@')
              ? item.telegram_handle
              : `@${item.telegram_handle}`;
            contactTd.append(el('div', handle, 'text-xs text-subtle'));
          }
          if (item.secondary_phone) {
            contactTd.append(el('div', `Alt: ${item.secondary_phone}`, 'text-xs text-subtle'));
          }
          row.append(contactTd);

          // 8. Review Status (Image 1 style: Reviewed / Pending)
          const reviewTd = document.createElement('td');
          const isPending = item.status === 'new';
          const isArchived = item.status === 'archived';
          const reviewLabel = isPending ? 'Pending' : isArchived ? 'Archived' : 'Reviewed';
          const reviewClass = isPending
            ? 'status-pending'
            : isArchived
              ? 'status-archived'
              : 'status-reviewed';
          reviewTd.append(el('span', reviewLabel, `status-badge ${reviewClass}`));
          row.append(reviewTd);

          // 9. Contact Status (Image 1 style: Contacted / Not Contacted / Enrolled)
          const contactStatusTd = document.createElement('td');
          let contactLabel = 'Not Contacted';
          let contactClass = 'status-not-contacted';
          if (item.status === 'contacted') {
            contactLabel = 'Contacted';
            contactClass = 'status-contacted';
          } else if (item.status === 'enrolled') {
            contactLabel = 'Enrolled';
            contactClass = 'status-enrolled';
          } else if (item.status === 'archived') {
            contactLabel = 'Archived';
            contactClass = 'status-archived';
          }
          contactStatusTd.append(el('span', contactLabel, `status-badge ${contactClass}`));
          row.append(contactStatusTd);

          // 10. Registered Date
          row.append(cell(dateText(item.created_at)));

          // 11. Actions
          const actionTd = document.createElement('td');
          const viewBtn = el('button', 'View & Manage', 'btn btn-outline btn-sm');
          viewBtn.type = 'button';
          viewBtn.addEventListener('click', () => openDetailsModal(item));
          actionTd.append(viewBtn);
          row.append(actionTd);

          return row;
        });

        table(
          tableHost,
          [
            'ID',
            'Parent Name',
            'Student Name',
            'Grade Level',
            'Requested Subjects',
            'Support Category',
            'Phone / Telegram',
            'Review Status',
            'Contact Status',
            'Registered',
            'Actions',
          ],
          rows,
          'No parent registrations found matching your criteria.'
        );

        paginationControls(paginationHost, p.page, p.totalPages, next => {
          page = next;
          refresh();
        });
      },
    });

  form.addEventListener('submit', e => {
    e.preventDefault();
    page = 1;
    refresh();
  });

  document.getElementById('reset-filters').addEventListener('click', () => {
    form.reset();
    page = 1;
    refresh();
  });

  loadMetrics();
  refresh();
}
