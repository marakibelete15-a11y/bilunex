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
  let page = 1;
  const refresh = () =>
    loadList({
      endpoint: '/admin/parent-registrations',
      params: { page, limit: 20, ...Object.fromEntries(new FormData(form)) },
      key: 'registrations',
      statusHost: document.getElementById('list-state'),
      render: (items, p) => {
        const rows = items.map(item => {
          const row = document.createElement('tr');
          row.append(
            cell(item.id),
            cell(item.parent_name),
            cell(item.email),
            cell(item.phone),
            cell(item.child_name),
            cell(item.grade_level),
            cell((item.subjects || []).join(', ')),
            cell(item.support_category),
            cell(item.status),
            cell(dateText(item.created_at))
          );
          const detail = document.createElement('details');
          const summary = el('summary', 'Details');
          detail.append(
            summary,
            el(
              'p',
              `Secondary phone: ${item.secondary_phone || '—'} · Contact: ${item.preferred_communication_method || '—'} · Notes: ${item.notes || '—'}`
            )
          );
          const c = document.createElement('td');
          c.append(detail);
          row.append(c);
          return row;
        });
        table(
          document.getElementById('registrations-table'),
          [
            'ID',
            'Parent',
            'Email',
            'Phone',
            'Student',
            'Grade',
            'Subjects',
            'Support',
            'Status',
            'Received',
            'More',
          ],
          rows
        );
        paginationControls(document.getElementById('pagination'), p.page, p.totalPages, next => {
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
  refresh();
}
