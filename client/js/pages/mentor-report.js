import { api } from '../api.js';
import { setupMentor, showMessage, renderReports } from './mentor-common.js';
if (setupMentor()) {
  const form = document.getElementById('support-report-form');
  const feedback = document.getElementById('report-feedback');
  const reportsHost = document.getElementById('reports-table');
  try {
    const response = await api.get('/mentor/reports');
    renderReports(reportsHost, response.data || []);
  } catch (error) {
    showMessage(reportsHost, error.message, 'error');
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    const fields = new FormData(form);
    try {
      const response = await api.post('/mentor/reports', Object.fromEntries(fields));
      showMessage(feedback, 'Support report filed successfully.', 'success');
      form.reset();
      const list = await api.get('/mentor/reports');
      renderReports(reportsHost, list.data || []);
    } catch (error) {
      showMessage(feedback, error.message, 'error');
    } finally {
      button.disabled = false;
    }
  });
}
