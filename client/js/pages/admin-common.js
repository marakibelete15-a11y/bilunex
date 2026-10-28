import { auth } from '../auth.js';
import { api } from '../api.js';
import { initPortalLayout } from '../components/layout.js';

export function setupAdmin() {
  if (!auth.protectPage('admin', 'login.html')) return false;
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
export function statusBadge(value) {
  return el(
    'span',
    value || 'unknown',
    `status-badge status-${String(value || '').replaceAll('_', '-')}`
  );
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
