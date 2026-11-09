import { api, ApiError } from '../api.js';
import { initPortalLayout } from '../components/layout.js';

try {
  initPortalLayout();
} catch (error) {
  console.error('[admin-dashboard] Portal layout initialization error:', error);
}

// ---------------------------------------------------------------------------
// Tabs Navigation
// ---------------------------------------------------------------------------
const TABS = ['overview', 'parents', 'mentors', 'inquiries', 'reports'];

function activateTab(tabName) {
  const selected = TABS.includes(tabName) ? tabName : 'overview';
  TABS.forEach(t => {
    const section = document.getElementById(`tab-${t}`);
    if (section) section.hidden = t !== selected;
  });

  document.querySelectorAll('.portal-nav a').forEach(a => {
    const hash = a.getAttribute('href')?.split('#')[1];
    if (hash === selected) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    } else if (hash) {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    }
  });

  if (selected === 'overview') loadStats();
  else if (selected === 'parents') loadParents(1);
  else if (selected === 'mentors') loadMentors(1);
  else if (selected === 'inquiries') loadInquiries(1);
  else if (selected === 'reports') loadReports(1);
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  activateTab(hash);
});

// ---------------------------------------------------------------------------
// Global Modal Helpers
// ---------------------------------------------------------------------------
const modal = document.getElementById('admin-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalFooter = document.getElementById('modal-footer');
const modalCloseBtn = document.getElementById('modal-close-btn');

function closeModal() {
  if (modal) {
    if (typeof modal.close === 'function') modal.close();
    else modal.removeAttribute('open');
  }
}

modalCloseBtn?.addEventListener('click', closeModal);
modal?.addEventListener('click', event => {
  if (event.target === modal) closeModal();
});

function openModal(title, contentNodes = [], footerNodes = []) {
  if (!modal) return;
  modalTitle.textContent = title;
  modalBody.replaceChildren(...contentNodes);
  modalFooter.replaceChildren(...footerNodes);
  if (typeof modal.showModal === 'function') modal.showModal();
  else modal.setAttribute('open', '');
}

// ---------------------------------------------------------------------------
// Tab 1: Overview
// ---------------------------------------------------------------------------
const statsState = document.getElementById('stats-state');
const summaryCards = document.getElementById('summary-cards');

function createStatCard(title, mainNumber, details = []) {
  const card = document.createElement('article');
  card.className = 'card stat-card';

  const h3 = document.createElement('h3');
  h3.textContent = title;

  const count = document.createElement('div');
  count.className = 'stat-count';
  count.textContent = String(mainNumber);

  const ul = document.createElement('ul');
  ul.className = 'stat-details-list';
  details.forEach(([lbl, val]) => {
    const li = document.createElement('li');
    const spanLabel = document.createElement('span');
    spanLabel.textContent = lbl;
    const spanVal = document.createElement('strong');
    spanVal.textContent = String(val);
    li.append(spanLabel, spanVal);
    ul.appendChild(li);
  });

  card.append(h3, count, ul);
  return card;
}

async function loadStats() {
  if (statsState) statsState.textContent = 'Loading overview metrics…';
  try {
    const res = await api.get('/admin/stats');
    const stats = res.data || {};
    summaryCards.replaceChildren();

    const pByStatus = stats.registrationsByStatus || {};
    const pTotal = Object.values(pByStatus).reduce((a, b) => a + Number(b), 0);
    summaryCards.appendChild(
      createStatCard('Parent Registrations', pTotal, [
        ['Received', pByStatus.received || 0],
        ['Contacted', pByStatus.contacted || 0],
        ['Matched', pByStatus.matched || 0],
        ['Enrolled', pByStatus.enrolled || 0],
        ['Closed', pByStatus.closed || 0],
      ])
    );

    const mByStatus = stats.applicationsByStatus || {};
    const mTotal = Object.values(mByStatus).reduce((a, b) => a + Number(b), 0);
    summaryCards.appendChild(
      createStatCard('Mentor Applications', mTotal, [
        ['Received', mByStatus.application_received || 0],
        ['Screening', mByStatus.screening || 0],
        ['Accepted', mByStatus.accepted || 0],
        ['Onboarding', mByStatus.onboarding || 0],
        ['Rejected', mByStatus.rejected || 0],
      ])
    );

    const iByStatus = stats.inquiriesByStatus || {};
    const iTotal = Object.values(iByStatus).reduce((a, b) => a + Number(b), 0);
    summaryCards.appendChild(
      createStatCard('Public Inquiries', iTotal, [
        ['New', iByStatus.new || 0],
        ['In Progress', iByStatus.in_progress || 0],
        ['Resolved', iByStatus.resolved || 0],
        ['Closed', iByStatus.closed || 0],
      ])
    );

    summaryCards.appendChild(
      createStatCard('Student Reports', stats.totalReports || 0, [
        ['Total Filed', stats.totalReports || 0],
      ])
    );

    summaryCards.appendChild(
      createStatCard('Active Mentors', stats.totalActiveMentors || 0, [
        ['Activated Accounts', stats.totalActiveMentors || 0],
      ])
    );

    if (statsState) statsState.textContent = '';
  } catch (error) {
    if (statsState) statsState.textContent = `Could not load stats: ${error.message}`;
  }
}

// ---------------------------------------------------------------------------
// Pagination Renderer Helper
// ---------------------------------------------------------------------------
function renderPagination(navEl, pagination, onPageChange) {
  navEl.replaceChildren();
  if (!pagination || pagination.totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'btn btn-outline btn-sm';
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = pagination.page <= 1;
  prevBtn.addEventListener('click', () => onPageChange(pagination.page - 1));

  const info = document.createElement('span');
  info.className = 'pagination-info';
  info.textContent = `Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total)`;

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'btn btn-outline btn-sm';
  nextBtn.textContent = 'Next';
  nextBtn.disabled = pagination.page >= pagination.totalPages;
  nextBtn.addEventListener('click', () => onPageChange(pagination.page + 1));

  navEl.append(prevBtn, info, nextBtn);
}

// ---------------------------------------------------------------------------
// Tab 2: Parents
// ---------------------------------------------------------------------------
const parentsState = document.getElementById('parents-state');
const parentsTbody = document.getElementById('parents-tbody');
const parentsPagination = document.getElementById('parents-pagination');
const parentsFilterForm = document.getElementById('parents-filter-form');
let parentsPage = 1;

async function loadParents(page = 1) {
  parentsPage = page;
  if (parentsState) parentsState.textContent = 'Loading parent registrations…';
  parentsTbody.replaceChildren();

  const status = document.getElementById('parents-status-filter')?.value || 'all';
  const grade = document.getElementById('parents-grade-filter')?.value.trim() || '';
  const search = document.getElementById('parents-search')?.value.trim() || '';

  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (status !== 'all') params.set('status', status);
  if (grade) params.set('grade_level', grade);
  if (search) params.set('search', search);

  try {
    const res = await api.get(`/admin/parents?${params}`);
    const items = res.data?.registrations || [];
    const pagination = res.data?.pagination || {};

    if (items.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.textContent = 'No parent registrations found.';
      tr.appendChild(td);
      parentsTbody.appendChild(tr);
    } else {
      items.forEach(r => {
        const tr = document.createElement('tr');

        const tdDate = document.createElement('td');
        tdDate.textContent = r.created_at ? new Date(r.created_at).toLocaleDateString() : '';

        const tdParent = document.createElement('td');
        tdParent.textContent = `${r.preferred_title ? r.preferred_title + ' ' : ''}${r.parent_name}`;

        const tdChild = document.createElement('td');
        tdChild.textContent = r.child_name;

        const tdGrade = document.createElement('td');
        tdGrade.textContent = r.grade_level;

        const tdContact = document.createElement('td');
        const contactArr = [r.email, r.phone, r.telegram_handle].filter(Boolean);
        tdContact.textContent = contactArr.join(' · ');

        const tdStatus = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `badge status-badge badge-${r.status}`;
        badge.textContent = r.status;
        tdStatus.appendChild(badge);

        const tdActions = document.createElement('td');
        const updateBtn = document.createElement('button');
        updateBtn.type = 'button';
        updateBtn.className = 'btn btn-outline btn-sm';
        updateBtn.textContent = 'Update Status';
        updateBtn.addEventListener('click', () => openUpdateParentModal(r));
        tdActions.appendChild(updateBtn);

        tr.append(tdDate, tdParent, tdChild, tdGrade, tdContact, tdStatus, tdActions);
        parentsTbody.appendChild(tr);
      });
    }

    renderPagination(parentsPagination, pagination, p => loadParents(p));
    if (parentsState) parentsState.textContent = '';
  } catch (error) {
    if (parentsState) parentsState.textContent = `Could not load parents: ${error.message}`;
  }
}

function openUpdateParentModal(registration) {
  const container = document.createElement('div');

  const pInfo = document.createElement('p');
  pInfo.textContent = `Updating status for parent: ${registration.parent_name} (Student: ${registration.child_name})`;

  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';
  const label = document.createElement('label');
  label.className = 'form-label';
  label.textContent = 'Select New Status:';

  const select = document.createElement('select');
  select.className = 'form-control';
  ['new', 'contacted', 'matched', 'closed'].forEach(st => {
    const opt = document.createElement('option');
    opt.value = st;
    opt.textContent = st;
    if (st === registration.status) opt.selected = true;
    select.appendChild(opt);
  });
  formGroup.append(label, select);

  const errorP = document.createElement('p');
  errorP.className = 'form-error';

  container.append(pInfo, formGroup, errorP);

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Save Status';
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    errorP.textContent = '';
    try {
      await api.patch(`/admin/parents/${registration.id}/status`, {
        status: select.value,
      });
      closeModal();
      loadParents(parentsPage);
    } catch (err) {
      errorP.textContent = err.message || 'Could not update status.';
      saveBtn.disabled = false;
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-outline';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', closeModal);

  openModal('Update Registration Status', [container], [cancelBtn, saveBtn]);
}

parentsFilterForm?.addEventListener('submit', event => {
  event.preventDefault();
  loadParents(1);
});
document.getElementById('parents-refresh-btn')?.addEventListener('click', () => loadParents(1));

// ---------------------------------------------------------------------------
// Tab 3: Mentor Applications & Activation
// ---------------------------------------------------------------------------
const mentorsState = document.getElementById('mentors-state');
const mentorsTbody = document.getElementById('mentors-tbody');
const mentorsPagination = document.getElementById('mentors-pagination');
const mentorsFilterForm = document.getElementById('mentors-filter-form');
let mentorsPage = 1;

async function loadMentors(page = 1) {
  mentorsPage = page;
  if (mentorsState) mentorsState.textContent = 'Loading mentor applications…';
  mentorsTbody.replaceChildren();

  const status = document.getElementById('mentors-status-filter')?.value || 'all';
  const search = document.getElementById('mentors-search')?.value.trim() || '';

  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (status !== 'all') params.set('status', status);
  if (search) params.set('search', search);

  try {
    const res = await api.get(`/admin/mentor-applications?${params}`);
    const items = res.data?.applications || [];
    const pagination = res.data?.pagination || {};

    if (items.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = 'No mentor applications found.';
      tr.appendChild(td);
      mentorsTbody.appendChild(tr);
    } else {
      items.forEach(m => {
        const tr = document.createElement('tr');

        const tdDate = document.createElement('td');
        tdDate.textContent = m.created_at ? new Date(m.created_at).toLocaleDateString() : '';

        const tdName = document.createElement('td');
        tdName.textContent = m.full_name;

        const tdUni = document.createElement('td');
        tdUni.textContent = `${m.university || ''} (${m.field_of_study || ''})`;

        const tdContact = document.createElement('td');
        const contactArr = [m.email, m.phone, m.telegram_handle].filter(Boolean);
        tdContact.textContent = contactArr.join(' · ');

        const tdStage = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `badge status-badge badge-${m.status}`;
        badge.textContent = m.status;
        tdStage.appendChild(badge);

        const tdActions = document.createElement('td');
        tdActions.className = 'action-buttons-group';

        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'btn btn-outline btn-sm';
        viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', () => openViewMentorModal(m.id));

        const stageBtn = document.createElement('button');
        stageBtn.type = 'button';
        stageBtn.className = 'btn btn-outline btn-sm';
        stageBtn.textContent = 'Stage';
        stageBtn.addEventListener('click', () => openUpdateMentorStageModal(m));

        tdActions.append(viewBtn, stageBtn);

        if (m.status === 'accepted' || m.status === 'onboarding') {
          const activateBtn = document.createElement('button');
          activateBtn.type = 'button';
          activateBtn.className = 'btn btn-accent btn-sm';
          activateBtn.textContent = 'Activate';
          activateBtn.addEventListener('click', () => openActivateMentorModal(m));
          tdActions.appendChild(activateBtn);
        }

        tr.append(tdDate, tdName, tdUni, tdContact, tdStage, tdActions);
        mentorsTbody.appendChild(tr);
      });
    }

    renderPagination(mentorsPagination, pagination, p => loadMentors(p));
    if (mentorsState) mentorsState.textContent = '';
  } catch (error) {
    if (mentorsState) mentorsState.textContent = `Could not load mentors: ${error.message}`;
  }
}

async function openViewMentorModal(applicationId) {
  try {
    const res = await api.get(`/admin/mentor-applications/${applicationId}`);
    const m = res.data?.application || res.data;
    if (!m) return;

    const container = document.createElement('div');
    container.className = 'application-detail-view';

    const addRow = (label, value) => {
      const p = document.createElement('p');
      const b = document.createElement('strong');
      b.textContent = `${label}: `;
      const span = document.createElement('span');
      span.textContent = Array.isArray(value) ? value.join(', ') : value || '—';
      p.append(b, span);
      container.appendChild(p);
    };

    addRow('Full Name', m.full_name);
    addRow('Email', m.email);
    addRow('Phone', m.phone);
    addRow('Telegram', m.telegram_handle);
    addRow('University', m.university);
    addRow('Field of Study', m.field_of_study);
    addRow('Academic Year', m.academic_year);
    addRow('Subjects', m.subjects);
    addRow('Availability', m.availability);
    addRow('Available Hours', m.available_hours);
    addRow('Available Days', m.available_days);
    addRow('Motivation', m.motivation);
    addRow('Current Stage', m.status);
    addRow('Notes', m.notes);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-outline';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', closeModal);

    openModal(`Application: ${m.full_name}`, [container], [closeBtn]);
  } catch (err) {
    alert(`Could not load application details: ${err.message}`);
  }
}

function openUpdateMentorStageModal(application) {
  const container = document.createElement('div');

  const pInfo = document.createElement('p');
  pInfo.textContent = `Update recruitment stage for: ${application.full_name}`;

  const groupStage = document.createElement('div');
  groupStage.className = 'form-group';
  const labelStage = document.createElement('label');
  labelStage.className = 'form-label';
  labelStage.textContent = 'Recruitment Stage:';

  const select = document.createElement('select');
  select.className = 'form-control';
  [
    'application_received',
    'under_review',
    'interview_stage',
    'accepted',
    'onboarding',
    'rejected',
  ].forEach(st => {
    const opt = document.createElement('option');
    opt.value = st;
    opt.textContent = st;
    if (st === application.status) opt.selected = true;
    select.appendChild(opt);
  });
  groupStage.append(labelStage, select);

  const groupNotes = document.createElement('div');
  groupNotes.className = 'form-group';
  const labelNotes = document.createElement('label');
  labelNotes.className = 'form-label';
  labelNotes.textContent = 'Internal Review Notes:';
  const textarea = document.createElement('textarea');
  textarea.className = 'form-control';
  textarea.rows = 4;
  textarea.value = application.notes || application.admin_notes || '';
  groupNotes.append(labelNotes, textarea);

  const errorP = document.createElement('p');
  errorP.className = 'form-error';

  container.append(pInfo, groupStage, groupNotes, errorP);

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Save Stage & Notes';
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    errorP.textContent = '';
    try {
      await api.patch(`/admin/mentor-applications/${application.id}/status`, {
        status: select.value,
        admin_notes: textarea.value.trim() || undefined,
      });
      closeModal();
      loadMentors(mentorsPage);
    } catch (err) {
      errorP.textContent = err.message || 'Could not update mentor application.';
      saveBtn.disabled = false;
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-outline';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', closeModal);

  openModal('Update Candidate Stage', [container], [cancelBtn, saveBtn]);
}

function openActivateMentorModal(application) {
  const container = document.createElement('div');

  const pDesc = document.createElement('p');
  pDesc.textContent = `Activate ${application.full_name} as an active mentor. This creates their mentor profile and portal login credentials.`;

  const groupPass = document.createElement('div');
  groupPass.className = 'form-group';
  const labelPass = document.createElement('label');
  labelPass.className = 'form-label';
  labelPass.textContent = 'Assign Temporary Password (minimum 8 characters):';

  const inputPass = document.createElement('input');
  inputPass.type = 'password';
  inputPass.className = 'form-control';
  inputPass.minLength = 8;
  inputPass.required = true;
  groupPass.append(labelPass, inputPass);

  const errorP = document.createElement('p');
  errorP.className = 'form-error';

  container.append(pDesc, groupPass, errorP);

  const activateBtn = document.createElement('button');
  activateBtn.type = 'button';
  activateBtn.className = 'btn btn-accent';
  activateBtn.textContent = 'Confirm Activation';
  activateBtn.addEventListener('click', async () => {
    const pw = inputPass.value;
    if (!pw || pw.length < 8) {
      errorP.textContent = 'Password must be at least 8 characters long.';
      return;
    }
    activateBtn.disabled = true;
    errorP.textContent = '';
    try {
      await api.post(`/admin/mentor-applications/${application.id}/activate`, {
        initial_password: pw,
      });
      closeModal();
      alert(`Mentor ${application.full_name} has been activated successfully!`);
      loadMentors(mentorsPage);
    } catch (err) {
      errorP.textContent = err.message || 'Could not activate mentor.';
      activateBtn.disabled = false;
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-outline';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', closeModal);

  openModal(`Activate Mentor: ${application.full_name}`, [container], [cancelBtn, activateBtn]);
}

mentorsFilterForm?.addEventListener('submit', event => {
  event.preventDefault();
  loadMentors(1);
});
document.getElementById('mentors-refresh-btn')?.addEventListener('click', () => loadMentors(1));

// ---------------------------------------------------------------------------
// Tab 4: Inquiries
// ---------------------------------------------------------------------------
const inquiriesState = document.getElementById('inquiries-state');
const inquiriesTbody = document.getElementById('inquiries-tbody');
const inquiriesPagination = document.getElementById('inquiries-pagination');
const inquiriesFilterForm = document.getElementById('inquiries-filter-form');
let inquiriesPage = 1;

async function loadInquiries(page = 1) {
  inquiriesPage = page;
  if (inquiriesState) inquiriesState.textContent = 'Loading inquiries…';
  inquiriesTbody.replaceChildren();

  const status = document.getElementById('inquiries-status-filter')?.value || 'all';
  const type = document.getElementById('inquiries-type-filter')?.value || 'all';

  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (status !== 'all') params.set('status', status);
  if (type !== 'all') params.set('inquiry_type', type);

  try {
    const res = await api.get(`/admin/inquiries?${params}`);
    const items = res.data?.inquiries || [];
    const pagination = res.data?.pagination || {};

    if (items.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.textContent = 'No inquiries found.';
      tr.appendChild(td);
      inquiriesTbody.appendChild(tr);
    } else {
      items.forEach(inq => {
        const tr = document.createElement('tr');

        const tdDate = document.createElement('td');
        tdDate.textContent = inq.created_at ? new Date(inq.created_at).toLocaleDateString() : '';

        const tdName = document.createElement('td');
        tdName.textContent = inq.name;

        const tdType = document.createElement('td');
        tdType.textContent = inq.inquiry_type;

        const tdSnippet = document.createElement('td');
        tdSnippet.textContent =
          (inq.message || '').slice(0, 60) + ((inq.message || '').length > 60 ? '…' : '');

        const tdContact = document.createElement('td');
        tdContact.textContent = [inq.email, inq.phone].filter(Boolean).join(' · ');

        const tdStatus = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `badge status-badge badge-${inq.status}`;
        badge.textContent = inq.status;
        tdStatus.appendChild(badge);

        const tdActions = document.createElement('td');
        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'btn btn-outline btn-sm';
        viewBtn.textContent = 'View & Update';
        viewBtn.addEventListener('click', () => openInquiryModal(inq));
        tdActions.appendChild(viewBtn);

        tr.append(tdDate, tdName, tdType, tdSnippet, tdContact, tdStatus, tdActions);
        inquiriesTbody.appendChild(tr);
      });
    }

    renderPagination(inquiriesPagination, pagination, p => loadInquiries(p));
    if (inquiriesState) inquiriesState.textContent = '';
  } catch (error) {
    if (inquiriesState) inquiriesState.textContent = `Could not load inquiries: ${error.message}`;
  }
}

function openInquiryModal(inq) {
  const container = document.createElement('div');

  const addRow = (label, value) => {
    const p = document.createElement('p');
    const b = document.createElement('strong');
    b.textContent = `${label}: `;
    const span = document.createElement('span');
    span.textContent = value || '—';
    p.append(b, span);
    container.appendChild(p);
  };

  addRow('From', inq.name);
  addRow('Email', inq.email);
  addRow('Phone', inq.phone);
  addRow('Inquiry Type', inq.inquiry_type);
  addRow('Date', inq.created_at ? new Date(inq.created_at).toLocaleString() : '');

  const msgDiv = document.createElement('div');
  msgDiv.className = 'card inquiry-full-message';
  const msgP = document.createElement('p');
  msgP.textContent = inq.message;
  msgDiv.appendChild(msgP);
  container.appendChild(msgDiv);

  const groupStatus = document.createElement('div');
  groupStatus.className = 'form-group';
  const labelStatus = document.createElement('label');
  labelStatus.className = 'form-label';
  labelStatus.textContent = 'Update Inquiry Status:';

  const select = document.createElement('select');
  select.className = 'form-control';
  ['new', 'in_progress', 'resolved'].forEach(st => {
    const opt = document.createElement('option');
    opt.value = st;
    opt.textContent = st;
    if (st === inq.status) opt.selected = true;
    select.appendChild(opt);
  });
  groupStatus.append(labelStatus, select);
  container.appendChild(groupStatus);

  const errorP = document.createElement('p');
  errorP.className = 'form-error';
  container.appendChild(errorP);

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Save Status';
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    errorP.textContent = '';
    try {
      await api.patch(`/admin/inquiries/${inq.id}/status`, {
        status: select.value,
      });
      closeModal();
      loadInquiries(inquiriesPage);
    } catch (err) {
      errorP.textContent = err.message || 'Could not update inquiry status.';
      saveBtn.disabled = false;
    }
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn-outline';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', closeModal);

  openModal(`Inquiry from ${inq.name}`, [container], [closeBtn, saveBtn]);
}

inquiriesFilterForm?.addEventListener('submit', event => {
  event.preventDefault();
  loadInquiries(1);
});
document.getElementById('inquiries-refresh-btn')?.addEventListener('click', () => loadInquiries(1));

// ---------------------------------------------------------------------------
// Tab 5: Support Reports
// ---------------------------------------------------------------------------
const reportsState = document.getElementById('reports-state');
const reportsTbody = document.getElementById('reports-tbody');
const reportsPagination = document.getElementById('reports-pagination');
let reportsPage = 1;

async function loadReports(page = 1) {
  reportsPage = page;
  if (reportsState) reportsState.textContent = 'Loading support reports…';
  reportsTbody.replaceChildren();

  const params = new URLSearchParams({ page: String(page), limit: '10' });

  try {
    const res = await api.get(`/admin/support-reports?${params}`);
    const items = res.data?.reports || [];
    const pagination = res.data?.pagination || {};

    if (items.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'No support reports submitted yet.';
      tr.appendChild(td);
      reportsTbody.appendChild(tr);
    } else {
      items.forEach(rep => {
        const tr = document.createElement('tr');

        const tdDate = document.createElement('td');
        tdDate.textContent = rep.created_at ? new Date(rep.created_at).toLocaleDateString() : '';

        const tdStudent = document.createElement('td');
        tdStudent.textContent = rep.student_name;

        const tdNeed = document.createElement('td');
        tdNeed.textContent = rep.support_need;

        const tdMentor = document.createElement('td');
        tdMentor.textContent = rep.mentor_name || 'Mentor';

        const tdActions = document.createElement('td');
        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'btn btn-outline btn-sm';
        viewBtn.textContent = 'View Report';
        viewBtn.addEventListener('click', () => openViewReportModal(rep.id));
        tdActions.appendChild(viewBtn);

        tr.append(tdDate, tdStudent, tdNeed, tdMentor, tdActions);
        reportsTbody.appendChild(tr);
      });
    }

    renderPagination(reportsPagination, pagination, p => loadReports(p));
    if (reportsState) reportsState.textContent = '';
  } catch (error) {
    if (reportsState) reportsState.textContent = `Could not load reports: ${error.message}`;
  }
}

async function openViewReportModal(reportId) {
  try {
    const res = await api.get(`/admin/support-reports/${reportId}`);
    const rep = res.data?.report || res.data;
    if (!rep) return;

    const container = document.createElement('div');
    container.className = 'report-detail-view';

    const addRow = (label, value) => {
      const p = document.createElement('p');
      const b = document.createElement('strong');
      b.textContent = `${label}: `;
      const span = document.createElement('span');
      span.textContent = value || '—';
      p.append(b, span);
      container.appendChild(p);
    };

    addRow('Student Name', rep.student_name);
    addRow('Mentor Name', rep.mentor_name || 'Mentor');
    addRow('Date Submitted', rep.created_at ? new Date(rep.created_at).toLocaleString() : '');
    addRow('Support Need', rep.support_need);

    const obsTitle = document.createElement('h3');
    obsTitle.textContent = 'Observations:';
    const obsP = document.createElement('p');
    obsP.className = 'card';
    obsP.textContent = rep.observations;

    const actTitle = document.createElement('h3');
    actTitle.textContent = 'Recommended Action:';
    const actP = document.createElement('p');
    actP.className = 'card';
    actP.textContent = rep.recommended_action || 'None specified';

    container.append(obsTitle, obsP, actTitle, actP);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-outline';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', closeModal);

    openModal(`Report: ${rep.student_name}`, [container], [closeBtn]);
  } catch (err) {
    alert(`Could not load report details: ${err.message}`);
  }
}

document.getElementById('reports-refresh-btn')?.addEventListener('click', () => loadReports(1));

// ---------------------------------------------------------------------------
// Initial Boot
// ---------------------------------------------------------------------------
const initialHash = window.location.hash.replace('#', '') || 'overview';
activateTab(initialHash);
