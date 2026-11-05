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
  const metricsHost = document.getElementById('inquiries-metrics');
  const tableHost = document.getElementById('inquiries-table');
  const stateHost = document.getElementById('list-state');
  const paginationHost = document.getElementById('pagination');

  // Modal elements
  const modal = document.getElementById('inquiry-modal');
  const modalBody = document.getElementById('inquiry-modal-body-content');
  const modalCloseBtn = document.getElementById('inquiry-modal-close-btn');
  const modalCancelBtn = document.getElementById('inquiry-modal-cancel-btn');

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
      const items = data.inquiries || [];
      const total = items.reduce((sum, cur) => sum + Number(cur.count || 0), 0);
      const getCount = st => items.find(i => i.status === st)?.count || 0;

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
        makeCard('Total Inquiries', total, 'All submitted inquiries & messages'),
        makeCard('New / Unprocessed', getCount('new'), 'Requires review or initial response'),
        makeCard('In Progress', getCount('in_progress'), 'Currently being addressed by admin'),
        makeCard('Resolved', getCount('resolved'), 'Successfully answered or handled')
      );
    } catch {
      // Absorb metrics load failure
    }
  }

  function formatInquiryType(type) {
    if (!type) return 'General';
    return type
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  function openDetailsModal(inquiry) {
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

    addField('Inquiry ID', `#${inquiry.id}`);
    addField('Sender Name', inquiry.name);
    addField('Email Address', inquiry.email);
    addField('Phone Number', inquiry.phone || 'Not provided');
    addField('Inquiry Type', formatInquiryType(inquiry.inquiry_type));
    addField('Submitted Date', dateText(inquiry.created_at));

    const statusRow = el('div');
    statusRow.append(el('dt', 'Current Status'));
    const dd = el('dd');
    dd.append(statusBadge(inquiry.status));
    statusRow.append(dd);
    dl.append(statusRow);

    // Message box
    const msgSection = el('div');
    msgSection.style.marginBottom = '1.5rem';
    msgSection.append(el('h3', 'Inquiry Message', 'subheading'));
    const msgBox = el('div', inquiry.message, 'card');
    msgBox.style.whiteSpace = 'pre-wrap';
    msgBox.style.lineHeight = '1.6';
    msgBox.style.background = '#f8fafc';
    msgBox.style.border = '1px solid #e2e8f0';
    msgBox.style.padding = '1rem';
    msgBox.style.borderRadius = '0.5rem';
    msgSection.append(msgBox);

    // Status action controls
    const actionSection = el('div', null, 'card');
    actionSection.style.padding = '1rem';
    actionSection.style.background = '#f1f5f9';
    actionSection.style.borderRadius = '0.5rem';

    actionSection.append(el('h3', 'Change Status', 'subheading'));
    const actionFeedback = el('div', null, 'modal-feedback');
    actionSection.append(actionFeedback);

    const btnRow = el('div');
    btnRow.style.display = 'flex';
    btnRow.style.flexWrap = 'wrap';
    btnRow.style.gap = '0.75rem';
    btnRow.style.marginTop = '0.75rem';

    const createStatusBtn = (targetStatus, label, btnClass = 'btn-primary') => {
      const btn = el('button', label, `btn ${btnClass}`);
      btn.type = 'button';
      if (inquiry.status === targetStatus) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
      }
      btn.addEventListener('click', async () => {
        btnRow.querySelectorAll('button').forEach(b => (b.disabled = true));
        actionFeedback.replaceChildren(message('Updating inquiry status…', 'info'));
        try {
          await api.patch(`/admin/inquiries/${inquiry.id}/status`, { status: targetStatus });
          actionFeedback.replaceChildren(
            message(`Inquiry status updated to ${targetStatus}.`, 'success')
          );
          inquiry.status = targetStatus;
          loadMetrics();
          refresh();
          setTimeout(closeModal, 1200);
        } catch (err) {
          actionFeedback.replaceChildren(
            message(err.message || 'Failed to update status', 'error')
          );
          btnRow.querySelectorAll('button').forEach(b => (b.disabled = false));
        }
      });
      return btn;
    };

    if (inquiry.status !== 'in_progress') {
      btnRow.append(createStatusBtn('in_progress', 'Mark In Progress', 'btn-primary'));
    }
    if (inquiry.status !== 'resolved') {
      btnRow.append(createStatusBtn('resolved', 'Mark Resolved', 'btn-primary'));
    }
    if (inquiry.status !== 'archived') {
      btnRow.append(createStatusBtn('archived', 'Archive Inquiry', 'btn-outline'));
    }
    if (inquiry.status !== 'new') {
      btnRow.append(createStatusBtn('new', 'Re-open as New', 'btn-outline'));
    }

    actionSection.append(btnRow);

    modalBody.append(dl, msgSection, actionSection);
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
  }

  const refresh = () =>
    loadList({
      endpoint: '/admin/inquiries',
      params: {
        page,
        limit: 20,
        inquiry_type: form.elements.inquiry_type.value,
        status: form.elements.status.value,
      },
      key: 'inquiries',
      statusHost: stateHost,
      render: (items, p) => {
        const needle = (form.elements.search.value || '').toLowerCase();
        const filtered = items.filter(item =>
          [item.name, item.email, item.phone, item.message, item.inquiry_type, item.status].some(
            value =>
              String(value || '')
                .toLowerCase()
                .includes(needle)
          )
        );

        const rows = filtered.map(item => {
          const row = document.createElement('tr');
          row.append(
            cell(item.id),
            cell(item.name),
            cell(item.email),
            cell(item.phone || '—'),
            cell(formatInquiryType(item.inquiry_type))
          );

          const state = document.createElement('td');
          state.append(statusBadge(item.status));
          row.append(state, cell(dateText(item.created_at)));

          const actionTd = document.createElement('td');
          const viewBtn = el('button', 'Review', 'btn btn-outline btn-sm');
          viewBtn.type = 'button';
          viewBtn.addEventListener('click', () => openDetailsModal(item));
          actionTd.append(viewBtn);
          row.append(actionTd);

          return row;
        });

        table(
          tableHost,
          ['ID', 'Name', 'Email', 'Phone', 'Type', 'Status', 'Received', 'Actions'],
          rows,
          'No inquiries found matching your filters.'
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
