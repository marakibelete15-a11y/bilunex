import { api, ApiError } from '../api.js';
import { initPortalLayout } from '../components/layout.js';
import { createStatusBadge, getStatusLabel } from './admin-common.js';

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
    if (modalBody) modalBody.replaceChildren();
    if (modalFooter) modalFooter.replaceChildren();
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
// Password Management & Security Helpers
// ---------------------------------------------------------------------------
function generateStrongPassword(length = 16) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = lowercase + uppercase + digits + symbols;

  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);

  const pwdChars = [
    lowercase[array[0] % lowercase.length],
    uppercase[array[1] % uppercase.length],
    digits[array[2] % digits.length],
    symbols[array[3] % symbols.length],
  ];

  for (let i = 4; i < length; i++) {
    pwdChars.push(allChars[array[i] % allChars.length]);
  }

  // Shuffle using Fisher-Yates
  const shuffleArr = new Uint32Array(length);
  window.crypto.getRandomValues(shuffleArr);
  for (let i = length - 1; i > 0; i--) {
    const j = shuffleArr[i] % (i + 1);
    const temp = pwdChars[i];
    pwdChars[i] = pwdChars[j];
    pwdChars[j] = temp;
  }

  return pwdChars.join('');
}

function createPasswordInputWithControls({
  id = '',
  name = 'password',
  autocomplete = 'new-password',
  placeholder = '',
  minLength = 8,
  required = true,
  includeGenerator = true,
  onGenerate = null,
} = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'password-input-wrap';
  wrap.style.display = 'flex';
  wrap.style.gap = '0.5rem';
  wrap.style.alignItems = 'center';

  const input = document.createElement('input');
  input.type = 'password';
  if (id) input.id = id;
  input.name = name;
  input.className = 'form-control';
  input.autocomplete = autocomplete;
  if (placeholder) input.placeholder = placeholder;
  if (minLength) input.minLength = minLength;
  input.required = required;
  input.style.flex = '1';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'btn btn-outline btn-sm';
  toggleBtn.textContent = 'Show';
  toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
  toggleBtn.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
      toggleBtn.textContent = 'Hide';
    } else {
      input.type = 'password';
      toggleBtn.textContent = 'Show';
    }
  });

  wrap.append(input, toggleBtn);

  if (includeGenerator) {
    const genBtn = document.createElement('button');
    genBtn.type = 'button';
    genBtn.className = 'btn btn-outline btn-sm';
    genBtn.textContent = 'Generate';
    genBtn.title = 'Generate strong password';
    genBtn.addEventListener('click', () => {
      const strongPw = generateStrongPassword(16);
      input.value = strongPw;
      input.type = 'text';
      toggleBtn.textContent = 'Hide';
      if (typeof onGenerate === 'function') onGenerate(strongPw);
    });
    wrap.appendChild(genBtn);
  }

  return { wrap, input, toggleBtn };
}

function showOneTimePasswordDisplay(container, password, onDone) {
  container.replaceChildren();

  const card = document.createElement('div');
  card.className = 'card';
  card.style.background = '#f0fdf4';
  card.style.border = '1px solid #86efac';
  card.style.padding = '1.25rem';
  card.style.marginTop = '0.75rem';

  const title = document.createElement('h3');
  title.style.margin = '0 0 0.5rem 0';
  title.style.color = '#166534';
  title.style.fontSize = '1.1rem';
  title.textContent = 'Password Set Successfully';

  const pNote = document.createElement('p');
  pNote.style.color = '#15803d';
  pNote.style.fontSize = '0.95rem';
  pNote.style.marginBottom = '1rem';
  pNote.textContent = 'Share this with the mentor securely. It will not be shown again.';

  const displayWrap = document.createElement('div');
  displayWrap.style.display = 'flex';
  displayWrap.style.alignItems = 'center';
  displayWrap.style.gap = '0.5rem';
  displayWrap.style.marginBottom = '1rem';

  const code = document.createElement('code');
  code.style.padding = '0.5rem 0.75rem';
  code.style.background = '#ffffff';
  code.style.border = '1px solid #bbf7d0';
  code.style.borderRadius = '4px';
  code.style.fontSize = '1.1rem';
  code.style.fontWeight = 'bold';
  code.style.letterSpacing = '0.05em';
  code.style.flex = '1';
  code.textContent = password;

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'btn btn-outline btn-sm';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(password);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    } catch {
      copyBtn.textContent = 'Copied!';
    }
  });

  displayWrap.append(code, copyBtn);

  const doneBtn = document.createElement('button');
  doneBtn.type = 'button';
  doneBtn.className = 'btn btn-accent';
  doneBtn.textContent = 'Done';
  doneBtn.addEventListener('click', () => {
    code.textContent = '';
    closeModal();
    if (typeof onDone === 'function') onDone();
  });

  card.append(title, pNote, displayWrap, doneBtn);
  container.appendChild(card);
}

// ---------------------------------------------------------------------------
// Empty State Helper
// ---------------------------------------------------------------------------
function createEmptyStateRow(colSpan, messageText) {
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = colSpan;
  td.className = 'empty-state-cell';

  const wrap = document.createElement('div');
  wrap.className = 'empty-state';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '1.5');
  icon.setAttribute('aria-hidden', 'true');
  icon.classList.add('empty-state-icon');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute(
    'd',
    'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4a2 2 0 00-2 2v1a2 2 0 01-2 2h-4a2 2 0 01-2-2v-1a2 2 0 00-2-2H4'
  );
  icon.appendChild(path);

  const p = document.createElement('p');
  p.className = 'empty-state-text';
  p.textContent = messageText;

  wrap.append(icon, p);
  td.appendChild(wrap);
  tr.appendChild(td);
  return tr;
}

// ---------------------------------------------------------------------------
// Tab 1: Overview
// ---------------------------------------------------------------------------
const statsState = document.getElementById('stats-state');
const summaryCards = document.getElementById('summary-cards');

function createStatCard(title, mainNumber, details = []) {
  const card = document.createElement('article');
  card.className = 'card stat-card';

  const header = document.createElement('div');
  header.className = 'stat-card-header';
  const h3 = document.createElement('h3');
  h3.className = 'stat-card-title';
  h3.textContent = title;
  header.appendChild(h3);

  const count = document.createElement('div');
  count.className = 'stat-count';
  count.textContent = String(mainNumber);

  const ul = document.createElement('ul');
  ul.className = 'stat-details-list';
  details.forEach(item => {
    const li = document.createElement('li');
    li.className = 'stat-detail-row';

    const labelSpan = item.status ? createStatusBadge(item.status) : document.createElement('span');
    if (!item.status) {
      labelSpan.className = 'stat-detail-label';
      labelSpan.textContent = item.label;
    }

    const valStrong = document.createElement('strong');
    valStrong.className = 'stat-detail-count';
    valStrong.textContent = String(item.count);

    li.append(labelSpan, valStrong);
    ul.appendChild(li);
  });

  card.append(header, count, ul);
  return card;
}

function extractStatusCounts(data) {
  const counts = {};
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item && item.status) counts[item.status] = Number(item.count) || 0;
    });
  } else if (data && typeof data === 'object') {
    Object.entries(data).forEach(([key, val]) => {
      counts[key] = Number(val) || 0;
    });
  }
  return counts;
}

async function loadStats() {
  if (statsState) statsState.textContent = 'Loading overview metrics…';
  try {
    const res = await api.get('/admin/stats');
    const stats = res.data || {};
    summaryCards.replaceChildren();

    // 1. Parent Registrations (new, contacted, matched, closed)
    const pByStatus = extractStatusCounts(
      stats.parent_registrations || stats.registrationsByStatus
    );
    const pStatuses = [
      ['new', 'New'],
      ['contacted', 'Contacted'],
      ['matched', 'Matched'],
      ['closed', 'Closed'],
    ];
    const pTotal = pStatuses.reduce((sum, [st]) => sum + (pByStatus[st] || 0), 0);
    const pDetails = pStatuses.map(([st, label]) => ({
      status: st,
      label,
      count: pByStatus[st] || 0,
    }));
    summaryCards.appendChild(createStatCard('Parent Registrations', pTotal, pDetails));

    // 2. Mentor Applications (application_received, under_review, interview_stage, accepted, onboarding, rejected)
    const mByStatus = extractStatusCounts(stats.mentor_applications || stats.applicationsByStatus);
    const mStatuses = [
      ['application_received', 'Received'],
      ['under_review', 'Under review'],
      ['interview_stage', 'Interview'],
      ['accepted', 'Accepted'],
      ['onboarding', 'Onboarding'],
      ['rejected', 'Rejected'],
    ];
    const mTotal = mStatuses.reduce((sum, [st]) => sum + (mByStatus[st] || 0), 0);
    const mDetails = mStatuses.map(([st, label]) => ({
      status: st,
      label,
      count: mByStatus[st] || 0,
    }));
    summaryCards.appendChild(createStatCard('Mentor Applications', mTotal, mDetails));

    // 3. Public Inquiries (new, in_progress, resolved)
    const iByStatus = extractStatusCounts(stats.inquiries || stats.inquiriesByStatus);
    const iStatuses = [
      ['new', 'New'],
      ['in_progress', 'In progress'],
      ['resolved', 'Resolved'],
    ];
    const iTotal = iStatuses.reduce((sum, [st]) => sum + (iByStatus[st] || 0), 0);
    const iDetails = iStatuses.map(([st, label]) => ({
      status: st,
      label,
      count: iByStatus[st] || 0,
    }));
    summaryCards.appendChild(createStatCard('Public Inquiries', iTotal, iDetails));

    // 4. Student Reports
    const reportsTotal = Number(stats.support_reports_count ?? stats.totalReports ?? 0);
    summaryCards.appendChild(
      createStatCard('Student Reports', reportsTotal, [
        { label: 'Total Filed', count: reportsTotal },
      ])
    );

    // 5. Active Mentors
    const mentorsTotal = Number(stats.active_mentors ?? stats.totalActiveMentors ?? 0);
    summaryCards.appendChild(
      createStatCard('Active Mentors', mentorsTotal, [
        { label: 'Activated Accounts', count: mentorsTotal, status: 'matched' },
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
      parentsTbody.appendChild(createEmptyStateRow(7, 'No parent registrations found.'));
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
        tdStatus.appendChild(createStatusBadge(r.status));

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
    opt.textContent = getStatusLabel(st);
    if (st === registration.status) opt.selected = true;
    select.appendChild(opt);
  });
  formGroup.append(label, select);

  const errorP = document.createElement('p');
  errorP.className = 'form-error';

  container.append(pInfo, formGroup, errorP);

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-accent';
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
      mentorsTbody.appendChild(createEmptyStateRow(6, 'No mentor applications found.'));
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
        tdStage.appendChild(createStatusBadge(m.status));

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
    addRow('Current Stage', getStatusLabel(m.status));
    addRow('Notes', m.notes);
    if (m.mentor_profile_id) {
      addRow('Mentor Profile ID', `#${m.mentor_profile_id}`);
      addRow('Account Status', m.account_status || 'active');
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-outline';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', closeModal);

    const footerButtons = [closeBtn];

    if (m.mentor_profile_id) {
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'btn btn-accent';
      resetBtn.textContent = 'Reset Password';
      resetBtn.addEventListener('click', () => {
        openResetMentorPasswordModal(m);
      });
      footerButtons.push(resetBtn);
    }

    openModal(`Application: ${m.full_name}`, [container], footerButtons);
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
    opt.textContent = getStatusLabel(st);
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
  saveBtn.className = 'btn btn-accent';
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

  const { wrap, input } = createPasswordInputWithControls({
    autocomplete: 'new-password',
    minLength: 8,
    required: true,
    includeGenerator: true,
  });
  groupPass.append(labelPass, wrap);

  const errorP = document.createElement('p');
  errorP.className = 'form-error';

  container.append(pDesc, groupPass, errorP);

  const activateBtn = document.createElement('button');
  activateBtn.type = 'button';
  activateBtn.className = 'btn btn-accent';
  activateBtn.textContent = 'Confirm Activation';
  activateBtn.addEventListener('click', async () => {
    const pw = input.value;
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
      input.value = '';
      modalFooter.replaceChildren();
      showOneTimePasswordDisplay(container, pw, () => {
        loadMentors(mentorsPage);
      });
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

function openResetMentorPasswordModal(application) {
  const container = document.createElement('div');

  const pDesc = document.createElement('p');
  pDesc.textContent = `Reset password for active mentor: ${application.full_name} (${application.email})`;

  const groupPass = document.createElement('div');
  groupPass.className = 'form-group';
  const labelPass = document.createElement('label');
  labelPass.className = 'form-label';
  labelPass.textContent = 'New Password (minimum 8 characters):';

  const { wrap, input } = createPasswordInputWithControls({
    autocomplete: 'new-password',
    minLength: 8,
    required: true,
    includeGenerator: true,
  });
  groupPass.append(labelPass, wrap);

  const errorP = document.createElement('p');
  errorP.className = 'form-error';

  container.append(pDesc, groupPass, errorP);

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-accent';
  saveBtn.textContent = 'Save Password';
  saveBtn.addEventListener('click', async () => {
    const pw = input.value;
    if (!pw || pw.length < 8) {
      errorP.textContent = 'Password must be at least 8 characters long.';
      return;
    }
    saveBtn.disabled = true;
    errorP.textContent = '';
    try {
      await api.post(`/admin/mentors/${application.mentor_profile_id}/reset-password`, {
        new_password: pw,
      });
      input.value = '';
      modalFooter.replaceChildren();
      showOneTimePasswordDisplay(container, pw, () => {
        loadMentors(mentorsPage);
      });
    } catch (err) {
      errorP.textContent = err.message || 'Could not reset mentor password.';
      saveBtn.disabled = false;
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-outline';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', closeModal);

  openModal(`Reset Password: ${application.full_name}`, [container], [cancelBtn, saveBtn]);
}

function openAdminChangePasswordModal() {
  const container = document.createElement('div');

  const pDesc = document.createElement('p');
  pDesc.textContent = 'Update your administrator portal password.';

  // Current password
  const groupCur = document.createElement('div');
  groupCur.className = 'form-group';
  const labelCur = document.createElement('label');
  labelCur.className = 'form-label';
  labelCur.textContent = 'Current Password:';
  const curCtrl = createPasswordInputWithControls({
    autocomplete: 'current-password',
    minLength: 1,
    required: true,
    includeGenerator: false,
  });
  groupCur.append(labelCur, curCtrl.wrap);

  // New password
  const groupNew = document.createElement('div');
  groupNew.className = 'form-group';
  const labelNew = document.createElement('label');
  labelNew.className = 'form-label';
  labelNew.textContent = 'New Password (minimum 8 characters):';
  const newCtrl = createPasswordInputWithControls({
    autocomplete: 'new-password',
    minLength: 8,
    required: true,
    includeGenerator: true,
  });
  groupNew.append(labelNew, newCtrl.wrap);

  // Confirm password
  const groupConfirm = document.createElement('div');
  groupConfirm.className = 'form-group';
  const labelConfirm = document.createElement('label');
  labelConfirm.className = 'form-label';
  labelConfirm.textContent = 'Confirm New Password:';
  const confirmCtrl = createPasswordInputWithControls({
    autocomplete: 'new-password',
    minLength: 8,
    required: true,
    includeGenerator: false,
  });
  groupConfirm.append(labelConfirm, confirmCtrl.wrap);

  const errorP = document.createElement('p');
  errorP.className = 'form-error';

  container.append(pDesc, groupCur, groupNew, groupConfirm, errorP);

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-accent';
  saveBtn.textContent = 'Update Password';
  saveBtn.addEventListener('click', async () => {
    const curPw = curCtrl.input.value;
    const newPw = newCtrl.input.value;
    const confirmPw = confirmCtrl.input.value;

    if (!curPw) {
      errorP.className = 'form-error';
      errorP.textContent = 'Current password is required.';
      return;
    }
    if (!newPw || newPw.length < 8) {
      errorP.className = 'form-error';
      errorP.textContent = 'New password must be at least 8 characters long.';
      return;
    }
    if (newPw !== confirmPw) {
      errorP.className = 'form-error';
      errorP.textContent = 'New password and confirmation do not match.';
      return;
    }
    if (newPw === curPw) {
      errorP.className = 'form-error';
      errorP.textContent = 'New password cannot be the same as the current password.';
      return;
    }

    saveBtn.disabled = true;
    errorP.textContent = '';
    try {
      await api.patch('/admin/me/password', {
        current_password: curPw,
        new_password: newPw,
      });

      curCtrl.input.value = '';
      newCtrl.input.value = '';
      confirmCtrl.input.value = '';

      errorP.className = 'form-success';
      errorP.style.color = '#15803d';
      errorP.textContent = 'Password changed successfully.';

      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      errorP.className = 'form-error';
      errorP.style.color = '';
      errorP.textContent = err.message || 'Could not change password.';
      saveBtn.disabled = false;
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-outline';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', closeModal);

  openModal('Change Administrator Password', [container], [cancelBtn, saveBtn]);
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
      inquiriesTbody.appendChild(createEmptyStateRow(7, 'No inquiries found.'));
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
        tdStatus.appendChild(createStatusBadge(inq.status));

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
    opt.textContent = getStatusLabel(st);
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
  saveBtn.className = 'btn btn-accent';
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
      reportsTbody.appendChild(createEmptyStateRow(5, 'No support reports submitted yet.'));
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
    obsTitle.className = 'report-section-title';
    obsTitle.textContent = 'Observations:';
    const obsP = document.createElement('p');
    obsP.className = 'report-detail-card';
    obsP.textContent = rep.observations;

    const actTitle = document.createElement('h3');
    actTitle.className = 'report-section-title';
    actTitle.textContent = 'Recommended Action:';
    const actP = document.createElement('p');
    actP.className = 'report-detail-card';
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
document
  .getElementById('admin-change-pw-btn')
  ?.addEventListener('click', openAdminChangePasswordModal);

// ---------------------------------------------------------------------------
// Initial Boot
// ---------------------------------------------------------------------------
const initialHash = window.location.hash.replace('#', '') || 'overview';
activateTab(initialHash);
