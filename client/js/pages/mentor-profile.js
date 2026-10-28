import { api } from '../api.js';
import { setupMentor, showMessage, renderReports } from './mentor-common.js';
if (setupMentor()) {
  const feedback = document.getElementById('profile-feedback');
  const form = document.getElementById('profile-form');
  const reportsHost = document.getElementById('reports-table');
  try {
    const [profileResponse, reportResponse] = await Promise.all([
      api.get('/mentor/profile'),
      api.get('/mentor/reports'),
    ]);
    const profile = profileResponse.data;
    document.getElementById('profile-name').textContent = profile.name;
    document.getElementById('profile-email').textContent = profile.email;
    document.getElementById('profile-university').textContent = profile.university || '—';
    document.getElementById('profile-field').textContent = profile.field_of_study || '—';
    form.elements.phone.value = profile.phone || '';
    form.elements.availability.value = profile.availability || '';
    form.elements.subject_specializations.value = (profile.subject_specializations || []).join(
      ', '
    );
    renderReports(reportsHost, reportResponse.data || []);
  } catch (error) {
    showMessage(feedback, error.message, 'error');
    showMessage(reportsHost, 'Reports could not be loaded.');
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const fields = new FormData(form);
      const subjects = fields
        .get('subject_specializations')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
      const response = await api.patch('/mentor/profile', {
        phone: fields.get('phone') || null,
        availability: fields.get('availability'),
        subject_specializations: subjects,
      });
      form.elements.phone.value = response.data.phone || '';
      form.elements.availability.value = response.data.availability || '';
      form.elements.subject_specializations.value = (
        response.data.subject_specializations || []
      ).join(', ');
      showMessage(feedback, 'Profile updated.', 'success');
    } catch (error) {
      showMessage(feedback, error.message, 'error');
    } finally {
      button.disabled = false;
    }
  });
}
