import { auth } from '../auth.js';
import { api } from '../api.js';
import { initPortalLayout } from '../components/layout.js';

export function setupAdmin() {
  if (!auth.protectPage('admin', '/admin/login.html')) return false;
  initPortalLayout();
  const user = auth.getUser();
  const identity = document.getElementById('admin-user-display');
  if (identity) identity.textContent = user?.email || 'Admin';
  return true;
}

export function el(tag, text = '', className = '') {
  const node = document.createElement(tag);
  if (text !== null) node.textContent = String(text);
  if (className) node.className = className;
  return node;
}

export function message(host, text, kind = 'info') {
  host.replaceChildren(el('p', text, `feedback feedback-${kind}`));
}

export function table(host, headers, rows, empty = 'No records found.') {
  const wrap = el('div', null, 'table-responsive');
  const tableNode = el('table', null, 'data-table');
  const thead = el('thead');
  const headRow = el('tr');
  headers.forEach(label => headRow.append(el('th', label)));
  thead.append(headRow);
  const body = el('tbody');
  if (!rows.length) {
    const row = el('tr');
    const cell = el('td', empty);
    cell.colSpan = headers.length;
    row.append(cell);
    body.append(row);
  } else rows.forEach(row => body.append(row));
  tableNode.append(thead, body);
  wrap.append(tableNode);
  host.replaceChildren(wrap);
  return body;
}

export function cell(value) {
  return el('td', value ?? '—');
}
export const STATUS_LABELS = {
  // Parent registrations
  new: 'New',
  contacted: 'Contacted',
  matched: 'Matched',
  closed: 'Closed',

  // Mentor applications
  application_received: 'Received',
  under_review: 'Under review',
  interview_stage: 'Interview',
  accepted: 'Accepted',
  onboarding: 'Onboarding',
  rejected: 'Rejected',

  // Inquiries
  in_progress: 'In progress',
  resolved: 'Resolved',

  // Mentor account / general
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
};

export const STATUS_CLASSES = {
  // Green pill (Success): matched, accepted, active, resolved
  matched: 'status-success',
  accepted: 'status-success',
  active: 'status-success',
  resolved: 'status-success',

  // Amber/Orange pill (Warning): new, application_received, under_review, pending
  new: 'status-warning',
  application_received: 'status-warning',
  under_review: 'status-warning',
  pending: 'status-warning',

  // Blue pill (Info): contacted, interview_stage, onboarding, in_progress
  contacted: 'status-info',
  interview_stage: 'status-info',
  onboarding: 'status-info',
  in_progress: 'status-info',

  // Red/Coral pill (Danger): closed, rejected, inactive
  closed: 'status-danger',
  rejected: 'status-danger',
  inactive: 'status-danger',
};

export function getStatusLabel(rawStatus) {
  if (!rawStatus) return '—';
  const key = String(rawStatus).toLowerCase().trim();
  return STATUS_LABELS[key] || String(rawStatus).replace(/_/g, ' ');
}

export function createStatusBadge(rawStatus) {
  const badge = document.createElement('span');
  const normalized = String(rawStatus || '')
    .toLowerCase()
    .trim();
  const semanticClass = STATUS_CLASSES[normalized] || 'status-neutral';
  badge.className = `status-badge ${semanticClass} status-${normalized.replace(/_/g, '-')}`;
  badge.textContent = getStatusLabel(normalized);
  return badge;
}

export function statusBadge(value) {
  return createStatusBadge(value);
}
export function dateText(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

export function paginationControls(host, page, totalPages, onChange) {
  host.replaceChildren();
  const previous = el('button', 'Previous', 'btn btn-outline btn-sm');
  previous.type = 'button';
  previous.disabled = page <= 1;
  previous.addEventListener('click', () => onChange(page - 1));
  const label = el('span', `Page ${page} of ${totalPages}`);
  const next = el('button', 'Next', 'btn btn-outline btn-sm');
  next.type = 'button';
  next.disabled = page >= totalPages;
  next.addEventListener('click', () => onChange(page + 1));
  host.append(previous, label, next);
}

export async function loadList({ endpoint, params, key, render, statusHost }) {
  message(statusHost, 'Loading records…');
  try {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value != null)
      )
    );
    const result = await api.get(`${endpoint}?${query}`);
    statusHost.replaceChildren();
    render(result.data[key] || [], result.data.pagination || { page: 1, totalPages: 1 });
  } catch (error) {
    message(statusHost, error.message, 'error');
  }
}
