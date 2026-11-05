import { api } from '../api.js';
import {
  setupAdmin,
  el,
  cell,
  table,
  paginationControls,
  loadList,
  dateText,
  statusBadge,
} from './admin-common.js';

if (setupAdmin()) {
  const form = document.getElementById('filters');
  const metricsHost = document.getElementById('mentors-metrics');
  const tableHost = document.getElementById('mentors-table');
  const stateHost = document.getElementById('list-state');
  const paginationHost = document.getElementById('pagination');

  // Modal elements
  const modal = document.getElementById('mentor-details-modal');
  const modalBody = document.getElementById('mentor-details-modal-body-content');
  const modalCloseBtn = document.getElementById('mentor-details-modal-close-btn');
  const modalCancelBtn = document.getElementById('mentor-details-modal-cancel-btn');

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

  async function loadMetrics(items = []) {
    try {
      const { data } = await api.get('/admin/reports/summary');
      const activeCount = data.active_mentors_count || 0;
      const onboardingCount =
        (data.mentors || []).find(m => m.status === 'onboarding')?.count || items.length || 0;
      const universities = new Set(items.map(m => (m.university || '').trim()).filter(Boolean))
        .size;

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
        makeCard('Active Mentor Accounts', activeCount, 'Activated mentors with portal access'),
        makeCard('In Onboarding', onboardingCount, 'Accepted candidates completing setup'),
        makeCard('Partner Universities', universities || 1, 'Top institutions represented')
      );
    } catch {
      // Absorb metrics load failure
    }
  }

  function openDetailsModal(mentor) {
    modalBody.replaceChildren();

    const dl = el('dl', null, 'mentor-identity');
    dl.style.display = 'grid';
    dl.style.gridTemplateColumns = 'repeat(auto-fit, minmax(14rem, 1fr))';
    dl.style.gap = '0.75rem';
    dl.style.marginBottom = '1.25rem';

    const addField = (label, value) => {
      const div = el('div');
      div.append(el('dt', label), el('dd', value || '—'));
      dl.append(div);
    };

    addField('Application ID', `#${mentor.id}`);
    addField('Full Name', mentor.full_name);
    addField('Email Address', mentor.email);
    addField('Phone Number', mentor.phone || 'Not provided');
    addField('University', mentor.university);
    addField('Department / Field', mentor.department || mentor.field_of_study || '—');
    addField('High School Exam Score', mentor.exam_score || '—');
    addField('University GPA', mentor.gpa || '—');
    addField('Availability', mentor.availability || 'Flexible');
    addField('Subjects', (mentor.subjects || []).join(', ') || 'General');

    const statusRow = el('div');
    statusRow.append(el('dt', 'Portal Status'));
    const dd = el('dd');
    dd.append(statusBadge(mentor.status));
    statusRow.append(dd);
    dl.append(statusRow);

    modalBody.append(dl);

    // Prior Experience
    if (mentor.experience) {
      const expSec = el('div');
      expSec.style.marginBottom = '1.25rem';
      expSec.append(el('h3', 'Teaching & Mentoring Experience', 'subheading'));
      const expBox = el('div', mentor.experience, 'card');
      expBox.style.whiteSpace = 'pre-wrap';
      expBox.style.lineHeight = '1.6';
      expBox.style.background = '#f8fafc';
      expBox.style.border = '1px solid #e2e8f0';
      expBox.style.padding = '1rem';
      expBox.style.borderRadius = '0.5rem';
      expSec.append(expBox);
      modalBody.append(expSec);
    }

    // Motivation Statement
    if (mentor.motivation) {
      const motSec = el('div');
      motSec.style.marginBottom = '1.25rem';
      motSec.append(el('h3', 'Motivation Statement', 'subheading'));
      const motBox = el('div', mentor.motivation, 'card');
      motBox.style.whiteSpace = 'pre-wrap';
      motBox.style.lineHeight = '1.6';
      motBox.style.background = '#f8fafc';
      motBox.style.border = '1px solid #e2e8f0';
      motBox.style.padding = '1rem';
      motBox.style.borderRadius = '0.5rem';
      motSec.append(motBox);
      modalBody.append(motSec);
    }

    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
  }

  const refresh = () =>
    loadList({
      endpoint: '/admin/mentor-applications',
      params: { status: 'onboarding', page, limit: 20 },
      key: 'applications',
      statusHost: stateHost,
      render: (items, p) => {
        loadMetrics(items);

        const needle = (form.elements.search.value || '').toLowerCase();
        const filtered = items.filter(item =>
          [item.full_name, item.email, item.phone, item.university, item.department].some(value =>
            String(value || '')
              .toLowerCase()
              .includes(needle)
          )
        );

        const rows = filtered.map(item => {
          const row = document.createElement('tr');
          row.append(
            cell(item.id),
            cell(item.full_name),
            cell(item.email),
            cell(item.phone || '—'),
            cell(item.university),
            cell(item.department || item.field_of_study || '—')
          );

          const state = document.createElement('td');
          state.append(statusBadge(item.status));
          row.append(state, cell(dateText(item.updated_at || item.created_at)));

          const actionTd = document.createElement('td');
          const viewBtn = el('button', 'View Profile', 'btn btn-outline btn-sm');
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
            'Mentor',
            'Email',
            'Phone',
            'University',
            'Department',
            'Status',
            'Activated',
            'Actions',
          ],
          rows,
          'No active or onboarding mentors found matching your filters.'
        );

        paginationControls(paginationHost, p.page, p.totalPages, next => {
          page = next;
          refresh();
        });
      },
    });

  form.addEventListener('submit', event => {
    event.preventDefault();
    page = 1;
    refresh();
  });

  document.getElementById('reset-filters').addEventListener('click', () => {
    form.reset();
    page = 1;
    refresh();
  });

  refresh();
}
