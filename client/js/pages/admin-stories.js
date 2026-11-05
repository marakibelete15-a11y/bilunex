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
  const metricsHost = document.getElementById('stories-metrics');
  const tableHost = document.getElementById('stories-table');
  const stateHost = document.getElementById('stories-admin-state');
  const paginationHost = document.getElementById('pagination');

  // Modal elements
  const modal = document.getElementById('story-modal');
  const modalBody = document.getElementById('story-modal-body-content');
  const modalCloseBtn = document.getElementById('story-modal-close-btn');
  const modalCancelBtn = document.getElementById('story-modal-cancel-btn');

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
      const items = data.stories || [];
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
        makeCard('Total Submissions', total, 'All submitted community stories'),
        makeCard('Pending Moderation', getCount('pending'), 'Awaiting administrative review'),
        makeCard('Approved & Published', getCount('approved'), 'Visible on public stories page'),
        makeCard('Rejected', getCount('rejected'), 'Declined or private')
      );
    } catch {
      // Absorb metrics load failure
    }
  }

  function openDetailsModal(story) {
    modalBody.replaceChildren();

    const dl = el('dl', null, 'mentor-identity');
    dl.style.display = 'grid';
    dl.style.gridTemplateColumns = 'repeat(auto-fit, minmax(14rem, 1fr))';
    dl.style.gap = '1rem';

    const addField = (label, val) => {
      const box = el('div');
      box.style.background = '#f8fafc';
      box.style.padding = '0.75rem';
      box.style.borderRadius = '0.35rem';
      box.style.border = '1px solid #e2e8f0';
      box.append(el('dt', label, 'help-text'), el('dd', val || '—', 'font-medium'));
      dl.append(box);
    };

    addField('Author Name (Private)', story.full_name);
    addField('Display Preference', story.display_style);
    addField('Relationship to Bilunex', story.relationship);
    addField('Email Address (Private)', story.email);
    addField('Phone Number (Private)', story.phone);
    addField('Moderation Status', story.status);
    addField('Submitted Date', dateText(story.created_at));

    const contentBox = el('div');
    contentBox.style.marginTop = '1rem';
    contentBox.style.padding = '1.25rem';
    contentBox.style.background = '#ffffff';
    contentBox.style.border = '1px solid #cbd5e1';
    contentBox.style.borderRadius = '0.5rem';

    const storyTitle = el('h3', story.title, 'font-bold');
    storyTitle.style.marginBottom = '0.5rem';
    storyTitle.style.fontSize = '1.15rem';

    const storyBody = el('p', story.body);
    storyBody.style.lineHeight = '1.6';
    storyBody.style.whiteSpace = 'pre-line';

    contentBox.append(storyTitle, storyBody);

    const consentBox = el('div');
    consentBox.style.marginTop = '1rem';
    consentBox.style.fontSize = '0.85rem';
    consentBox.style.color = '#475569';
    consentBox.innerHTML = `
      <p><strong>Consent Verifications:</strong></p>
      <ul>
        <li>Genuine Experience: ${story.consent_genuine ? 'Confirmed' : 'No'}</li>
        <li>Public Sharing Consent: ${story.consent_publish ? 'Confirmed' : 'No'}</li>
        <li>Child / Guardian Consent: ${story.consent_child_guardian ? 'Confirmed' : 'No'}</li>
      </ul>
    `;

    // Moderation controls
    const actionBox = el('div');
    actionBox.style.marginTop = '1.25rem';
    actionBox.style.padding = '1rem';
    actionBox.style.background = '#f1f5f9';
    actionBox.style.borderRadius = '0.4rem';
    actionBox.append(el('h3', 'Moderation Decision', 'font-medium'));

    const btnGroup = el('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.flexWrap = 'wrap';
    btnGroup.style.gap = '0.5rem';
    btnGroup.style.marginTop = '0.5rem';

    const decisions = [
      ['approved', 'Approve & Publish'],
      ['rejected', 'Reject Submission'],
      ['pending', 'Move to Pending'],
    ];

    decisions.forEach(([st, label]) => {
      const btn = el('button', label, 'btn btn-sm');
      if (story.status === st) {
        btn.classList.add('btn-primary');
        btn.disabled = true;
      } else {
        btn.classList.add(st === 'approved' ? 'btn-primary' : 'btn-outline');
        btn.addEventListener('click', async () => {
          if (st === 'approved') {
            const confirmed = window.confirm(
              "Confirm approval? Verify that no child's full name, private details, or sensitive identifying data appears in the story body."
            );
            if (!confirmed) return;
          }
          btn.disabled = true;
          try {
            await api.patch(`/admin/stories/${story.id}/status`, { status: st });
            closeModal();
            refresh();
            loadMetrics();
          } catch (err) {
            message(stateHost, err.message, 'error');
            btn.disabled = false;
          }
        });
      }
      btnGroup.append(btn);
    });

    actionBox.append(btnGroup);
    modalBody.append(dl, contentBox, consentBox, actionBox);

    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
  }

  const refresh = () =>
    loadList({
      endpoint: '/admin/stories',
      params: {
        page,
        limit: 20,
        status: form.elements.status.value,
      },
      key: 'stories',
      statusHost: stateHost,
      render: (items, p) => {
        const needle = (form.elements.search.value || '').toLowerCase();
        items = items.filter(item =>
          [item.full_name, item.title, item.body, item.relationship, item.status].some(val =>
            String(val || '')
              .toLowerCase()
              .includes(needle)
          )
        );

        const rows = items.map(item => {
          const row = document.createElement('tr');
          row.append(
            cell(item.id),
            cell(item.full_name),
            cell(item.relationship || 'Community Member'),
            cell(item.title)
          );

          const statusTd = document.createElement('td');
          statusTd.append(statusBadge(item.status));
          row.append(statusTd, cell(dateText(item.created_at)));

          const actionTd = document.createElement('td');
          const reviewBtn = el('button', 'Review Story', 'btn btn-outline btn-sm');
          reviewBtn.type = 'button';
          reviewBtn.addEventListener('click', () => openDetailsModal(item));
          actionTd.append(reviewBtn);
          row.append(actionTd);

          return row;
        });

        table(
          tableHost,
          ['ID', 'Author', 'Relationship', 'Story Title', 'Status', 'Submitted', 'Actions'],
          rows,
          'No stories found matching your criteria.'
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
