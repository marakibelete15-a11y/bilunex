import { setupAdmin, cell, table, paginationControls, loadList, dateText } from './admin-common.js';
if (setupAdmin()) {
  const form = document.getElementById('filters');
  let page = 1;
  const refresh = () =>
    loadList({
      endpoint: '/admin/student-support-reports',
      params: { page, limit: 20 },
      key: 'reports',
      statusHost: document.getElementById('list-state'),
      render: (items, p) => {
        const needle = (form.elements.search.value || '').toLowerCase();
        items = items.filter(item =>
          [
            item.student_name,
            item.mentor_name,
            item.mentor_email,
            item.mentor_university,
            item.support_need_observed,
            item.observations,
            item.recommended_action,
          ].some(value =>
            String(value || '')
              .toLowerCase()
              .includes(needle)
          )
        );
        const rows = items.map(item => {
          const row = document.createElement('tr');
          row.append(
            cell(item.report_id),
            cell(item.student_name),
            cell(item.mentor_name),
            cell(item.mentor_email),
            cell(item.mentor_university),
            cell(item.support_need_observed),
            cell(item.observations),
            cell(item.recommended_action),
            cell(dateText(item.created_at))
          );
          return row;
        });
        table(
          document.getElementById('reports-table'),
          [
            'ID',
            'Student',
            'Mentor',
            'Mentor email',
            'University',
            'Need observed',
            'Observations',
            'Recommended action',
            'Submitted',
          ],
          rows
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
