import {
  setupAdmin,
  cell,
  table,
  paginationControls,
  loadList,
  dateText,
  message,
} from './admin-common.js';
if (setupAdmin()) {
  const form = document.getElementById('filters');
  let page = 1;
  const refresh = () =>
    loadList({
      endpoint: '/admin/mentor-applications',
      params: { status: 'onboarding', page, limit: 20 },
      key: 'applications',
      statusHost: document.getElementById('list-state'),
      render: (items, p) => {
        const needle = (form.elements.search.value || '').toLowerCase();
        items = items.filter(item =>
          [item.full_name, item.email, item.phone, item.university, item.department].some(value =>
            String(value || '')
              .toLowerCase()
              .includes(needle)
          )
        );
        const rows = items.map(item => {
          const row = document.createElement('tr');
          row.append(
            cell(item.id),
            cell(item.full_name),
            cell(item.email),
            cell(item.phone),
            cell(item.university),
            cell(item.department),
            cell(dateText(item.updated_at))
          );
          return row;
        });
        table(
          document.getElementById('mentors-table'),
          ['Application ID', 'Mentor', 'Email', 'Phone', 'University', 'Department', 'Activated'],
          rows,
          'No onboarding applications are currently listed.'
        );
        paginationControls(document.getElementById('pagination'), p.page, p.totalPages, next => {
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
  refresh();
}
