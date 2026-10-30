import { api } from '../api.js';
import { auth } from '../auth.js';
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
      endpoint: '/admin/mentor-applications',
      params: { page, limit: 20, status: form.elements.status.value },
      key: 'applications',
      statusHost: document.getElementById('list-state'),
      render: (items, p) => {
        const needle = (form.elements.search.value || '').toLowerCase();
        items = items.filter(item =>
          [
            item.full_name,
            item.email,
            item.phone,
            item.university,
            item.campus,
            item.department,
            item.status,
          ].some(value =>
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
            cell(item.field_of_study),
            cell(dateText(item.created_at))
          );
          const statusCell = document.createElement('td');
          statusCell.append(statusBadge(item.status));
          const select = document.createElement('select');
          select.setAttribute('aria-label', `New status for ${item.full_name}`);
          [
            'application_received',
            'under_review',
            'interview_stage',
            'accepted',
            'rejected',
            'onboarding',
          ].forEach(s => {
            const o = el('option', s);
            o.value = s;
            o.selected = s === item.status;
            select.append(o);
          });
          const update = el('button', 'Save status', 'btn btn-outline btn-sm');
          update.type = 'button';
          update.addEventListener('click', async () => {
            try {
              await api.patch(`/admin/mentor-applications/${item.id}/status`, {
                status: select.value,
              });
              refresh();
            } catch (e) {
              message(document.getElementById('list-state'), e.message, 'error');
            }
          });
          statusCell.append(document.createElement('br'), select, update);
          row.append(statusCell);
          const details = document.createElement('td');
          const box = document.createElement('details');
          box.append(el('summary', 'View details'));
          [
            'telegram_handle',
            'campus',
            'field_of_study',
            'academic_year',
            'cgpa',
            'entrance_exam_stream',
            'entrance_exam_result',
            'has_teaching_experience',
            'teaching_experience_duration',
            'experience_details',
            'available_days',
            'available_hours',
            'availability',
            'commitment_agreement',
            'referral_source',
            'motivation',
            'subjects',
          ].forEach(key => {
            if (item[key] !== undefined && item[key] !== null)
              box.append(
                el(
                  'p',
                  `${key.replaceAll('_', ' ')}: ${Array.isArray(item[key]) ? item[key].join(', ') : item[key]}`
                )
              );
          });
          const docs = item.documents || [];
          docs.forEach(doc => {
            const b = el(
              'button',
              `Download ${doc.document_type} (${doc.original_filename})`,
              'btn btn-outline btn-sm'
            );
            b.type = 'button';
            b.addEventListener('click', async () => {
              try {
                const response = await fetch(`/api/v1/admin/documents/${doc.id}/download`, {
                  headers: { Authorization: `Bearer ${auth.getToken()}` },
                });
                if (response.status === 401) {
                  auth.clearSession();
                  window.location.replace('login.html');
                  return;
                }
                if (!response.ok) throw new Error('Document download failed.');
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = el('a', `Save ${doc.original_filename}`);
                link.href = url;
                link.download = doc.original_filename;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              } catch (e) {
                message(document.getElementById('list-state'), e.message, 'error');
              }
            });
            box.append(b);
          });
          const passwordLabel = el('label', 'Initial password (minimum 8 characters)');
          const password = el('input');
          password.type = 'password';
          password.minLength = 8;
          password.autocomplete = 'new-password';
          password.disabled = item.status !== 'accepted';
          passwordLabel.append(password);
          box.append(passwordLabel);
          const activate = el('button', 'Activate accepted application', 'btn btn-primary btn-sm');
          activate.type = 'button';
          activate.disabled = item.status !== 'accepted';
          activate.addEventListener('click', async () => {
            if (password.value.length < 8) {
              password.setCustomValidity('Enter an initial password of at least 8 characters.');
              password.reportValidity();
              return;
            }
            password.setCustomValidity('');
            try {
              const response = await api.post(`/admin/mentor-applications/${item.id}/activate`, {
                initial_password: password.value,
              });
              message(
                document.getElementById('list-state'),
                `Mentor profile created (ID ${response.data.id}).`,
                'success'
              );
              refresh();
            } catch (e) {
              message(document.getElementById('list-state'), e.message, 'error');
            }
          });
          box.append(activate);
          details.append(box);
          row.append(details);
          return row;
        });
        table(
          document.getElementById('applications-table'),
          [
            'ID',
            'Applicant',
            'Email',
            'Phone',
            'University',
            'Department',
            'Submitted',
            'Status / Update',
            'Application & Documents',
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
