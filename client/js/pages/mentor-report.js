import { api } from '../api.js';
import { setupMentor, showMessage } from './mentor-common.js';

if (setupMentor()) {
  const form = document.getElementById('support-report-form');
  const feedback = document.getElementById('report-feedback');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;

    try {
      const need =
        formData.get('support_need_observed')?.trim() || formData.get('support_need')?.trim();
      const payload = {
        student_name: formData.get('student_name')?.trim(),
        support_need: need,
        observations: formData.get('observations')?.trim(),
        recommended_action: formData.get('recommended_action')?.trim(),
      };

      await api.post('/mentor/reports', payload);
      form.reset();
      showMessage(feedback, 'Your report has been submitted to the Bilunex team.', 'success');
    } catch (error) {
      showMessage(feedback, error.message || 'Failed to submit report', 'error');
    } finally {
      button.disabled = false;
    }
  });
}
