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
  let page = 1;
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
      statusHost: document.getElementById('list-state'),
      render: (items, p) => {
        const needle = (form.elements.search.value || '').toLowerCase();
        items = items.filter(item =>
          [item.name, item.email, item.phone, item.message, item.inquiry_type, item.status].some(
            value =>
              String(value || '')
                .toLowerCase()
                .includes(needle)
          )
        );
        const rows = items.map(item => {
          const row = document.createElement('tr');
          row.append(
            cell(item.id),
            cell(item.name),
            cell(item.email),
            cell(item.phone),
            cell(item.inquiry_type)
          );
          const messageCell = cell(item.message);
          messageCell.className = 'long-cell';
          row.append(messageCell);
          const state = document.createElement('td');
          state.append(statusBadge(item.status));
          row.append(state, cell(dateText(item.created_at)));
          return row;
        });
        table(
          document.getElementById('inquiries-table'),
          ['ID', 'Name', 'Email', 'Phone', 'Type', 'Message', 'Status', 'Received'],
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
