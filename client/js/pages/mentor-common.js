import { auth } from '../auth.js';
import { initPortalLayout } from '../components/layout.js';

export function setupMentor() {
  if (!auth.protectPage('mentor', 'login.html')) return null;
  initPortalLayout();
  const user = auth.getUser();
  const identity = document.getElementById('mentor-display');
  if (identity) identity.textContent = user?.name || user?.email || 'Mentor';
  return user;
}

export function makeElement(tag, text = '') {
  const element = document.createElement(tag);
  element.textContent = text == null ? '' : String(text);
  return element;
}

export function showMessage(host, text, type = 'info') {
  const message = makeElement('p', text);
  message.className = `feedback feedback-${type}`;
  host.replaceChildren(message);
}

export function renderReports(host, reports) {
  const table = document.createElement('table');
  table.className = 'data-table';
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Submitted', 'Student', 'Support need observed', 'Observations', 'Recommended action'].forEach(
    label => {
      headRow.append(makeElement('th', label));
    }
  );
  head.append(headRow);
  const body = document.createElement('tbody');
  if (!reports.length) {
    const row = document.createElement('tr');
    const empty = makeElement('td', 'No reports filed yet.');
    empty.colSpan = 5;
    row.append(empty);
    body.append(row);
  } else {
    reports.forEach(report => {
      const row = document.createElement('tr');
      [
        report.created_at ? new Date(report.created_at).toLocaleString() : '—',
        report.student_name,
        report.support_need_observed,
        report.observations,
        report.recommended_action,
      ].forEach(value => {
        row.append(makeElement('td', value));
      });
      body.append(row);
    });
  }
  table.append(head, body);
  const wrap = document.createElement('div');
  wrap.className = 'table-responsive';
  wrap.append(table);
  host.replaceChildren(wrap);
}
