import { api } from '../api.js';
import { setupAdmin, el, message } from './admin-common.js';
if (setupAdmin()) {
  const host = document.getElementById('dashboard-state');
  try {
    message(host, 'Loading operational summary…');
    const { data } = await api.get('/admin/reports/summary');
    const groups = [
      ['Parent registrations', data.parent_registrations],
      ['Mentor applications', data.mentor_applications],
      ['Inquiries', data.inquiries],
    ];
    const grid = document.getElementById('summary-cards');
    grid.replaceChildren();
    groups.forEach(([title, items]) => {
      const card = el('section', null, 'card stat-card');
      card.append(el('h2', title));
      (items || []).forEach(item => card.append(el('p', `${item.status}: ${item.count}`)));
      grid.append(card);
    });
    document.getElementById('failed-notifications').textContent = String(
      data.failed_notifications_last_7_days ?? 0
    );
    host.replaceChildren();
  } catch (error) {
    message(host, error.message, 'error');
  }
}
