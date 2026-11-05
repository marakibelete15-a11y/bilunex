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
} from './admin-common.js';

if (setupAdmin()) {
  const form = document.getElementById('filters');
  const metricsHost = document.getElementById('reports-metrics');
  const tableHost = document.getElementById('reports-table');
  const stateHost = document.getElementById('list-state');
  const paginationHost = document.getElementById('pagination');

  // Modal elements
  const modal = document.getElementById('report-modal');
  const modalBody = document.getElementById('report-modal-body-content');
  const modalCloseBtn = document.getElementById('report-modal-close-btn');
  const modalCancelBtn = document.getElementById('report-modal-cancel-btn');

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
      const totalReports = data.support_reports_count || items.length || 0;

      const uniqueStudents = new Set(items.map(r => (r.student_name || '').trim().toLowerCase()))
        .size;
      const uniqueMentors = new Set(
        items.map(r => r.mentor_id || (r.mentor_name || '').trim().toLowerCase())
      ).size;
      const neurodiverseCount = items.filter(
        r =>
          (r.support_need_observed || '').toLowerCase().includes('autism') ||
          (r.support_need_observed || '').toLowerCase().includes('neuro') ||
          (r.observations || '').toLowerCase().includes('autism')
      ).length;

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
        makeCard('Total Reports', totalReports, 'Confidential mentor inquiries & reports'),
        makeCard('Unique Students', uniqueStudents, 'Students receiving targeted support'),
        makeCard('Mentors Reporting', uniqueMentors, 'Active mentors submitting inquiries'),
        makeCard(
          'Autism / Neurodivergence',
          neurodiverseCount,
          'Identified special educational needs'
        )
      );
    } catch {
      // Absorb metrics load failure
    }
  }

  function openDetailsModal(report) {
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

    addField('Report ID', `#${report.report_id || report.id}`);
    addField('Student Name', report.student_name);
    addField('Reporting Mentor', report.mentor_name);
    addField('Mentor Email', report.mentor_email);
    addField('Mentor University', report.mentor_university || '—');
    addField('Date Submitted', dateText(report.created_at));

    // Support Need Callout
    const needCard = el('div', null, 'card');
    needCard.style.padding = '0.85rem 1rem';
    needCard.style.marginBottom = '1.25rem';
    needCard.style.borderLeft = '4px solid #3b82f6';
    needCard.style.background = '#eff6ff';
    needCard.innerHTML = `<span style="font-weight: 600; color: #1e40af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.25rem;">Support Need Observed</span><span style="font-size: 1.05rem; font-weight: 600; color: #1e3a8a;">${report.support_need_observed}</span>`;

    // Observations
    const obsSection = el('div');
    obsSection.style.marginBottom = '1.25rem';
    obsSection.append(el('h3', 'Mentor Observations & Context', 'subheading'));
    const obsBox = el('div', report.observations, 'card');
    obsBox.style.whiteSpace = 'pre-wrap';
    obsBox.style.lineHeight = '1.6';
    obsBox.style.background = '#f8fafc';
    obsBox.style.border = '1px solid #e2e8f0';
    obsBox.style.padding = '1rem';
    obsBox.style.borderRadius = '0.5rem';
    obsSection.append(obsBox);

    // Recommended Action
    const recSection = el('div');
    recSection.style.marginBottom = '1.25rem';
    recSection.append(el('h3', 'Recommended Action / Next Steps', 'subheading'));
    const recBox = el('div', report.recommended_action || 'None specified.', 'card');
    recBox.style.whiteSpace = 'pre-wrap';
    recBox.style.lineHeight = '1.6';
    recBox.style.background = '#f8fafc';
    recBox.style.border = '1px solid #e2e8f0';
    recBox.style.padding = '1rem';
    recBox.style.borderRadius = '0.5rem';
    recSection.append(recBox);

    modalBody.append(dl, needCard, obsSection, recSection);
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
  }

  const refresh = () =>
    loadList({
      endpoint: '/admin/student-support-reports',
      params: { page, limit: 20 },
      key: 'reports',
      statusHost: stateHost,
      render: (items, p) => {
        loadMetrics(items);

        const needle = (form.elements.search.value || '').toLowerCase();
        const filtered = items.filter(item =>
          [
            item.student_name,
            item.mentor_name,
            item.mentor_email,
            item.mentor_university,
            item.support_need_observed,
            item.observations,
            item.recommended_action,
          ].some(value =>
            String(value || '')
              .toLowerCase()
              .includes(needle)
          )
        );

        const rows = filtered.map(item => {
          const row = document.createElement('tr');
          row.append(
            cell(item.report_id || item.id),
            cell(item.student_name),
            cell(item.mentor_name),
            cell(item.mentor_university || '—')
          );

          const needTd = document.createElement('td');
          const badge = el('span', item.support_need_observed, 'status-badge status-onboarding');
          badge.style.fontWeight = '600';
          needTd.append(badge);
          row.append(needTd);

          row.append(cell(dateText(item.created_at)));

          const actionTd = document.createElement('td');
          const viewBtn = el('button', 'View Report', 'btn btn-outline btn-sm');
          viewBtn.type = 'button';
          viewBtn.addEventListener('click', () => openDetailsModal(item));
          actionTd.append(viewBtn);
          row.append(actionTd);

          return row;
        });

        table(
          tableHost,
          ['ID', 'Student', 'Mentor', 'University', 'Need Observed', 'Submitted', 'Actions'],
          rows,
          'No student support reports found.'
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
