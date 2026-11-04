import { api } from '../api.js';
import { setupMentor, showMessage, renderReports } from './mentor-common.js';
if (setupMentor()) {
  const form = document.getElementById('support-report-form');
  const feedback = document.getElementById('report-feedback');
  const reportsHost = document.getElementById('reports-table');
  let submissionUncertain = false;
  let submissionStartedAt = null;

  const matchesSubmission = (report, fields) => {
    const reportTime = Date.parse(report.created_at || '');
    return (
      Number.isFinite(reportTime) &&
      reportTime >= submissionStartedAt - 60_000 &&
      ['student_name', 'support_need_observed', 'observations', 'recommended_action'].every(
        key => String(report[key] || '').trim() === String(fields[key] || '').trim()
      )
    );
  };

  const refreshReports = async () => {
    const list = await api.get('/mentor/reports');
    renderReports(reportsHost, list.data || []);
    return list.data || [];
  };

  try {
    await refreshReports();
  } catch (error) {
    showMessage(reportsHost, error.message, 'error');
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    const originalLabel = 'File support report';
    const fields = Object.fromEntries(new FormData(form));

    // A timed out POST is ambiguous: the server may have saved it before the
    // connection closed. Reconcile with the mentor's report list before allowing
    // an explicit retry, so a blind second POST cannot create a duplicate.
    if (submissionUncertain) {
      button.disabled = true;
      try {
        const reports = await refreshReports();
        if (reports.some(report => matchesSubmission(report, fields))) {
          submissionUncertain = false;
          showMessage(feedback, 'Support report filed successfully.', 'success');
          form.reset();
          button.textContent = originalLabel;
          return;
        }
        submissionUncertain = false;
        button.textContent = originalLabel;
        showMessage(feedback, 'No matching report was found. You can submit again now.', 'error');
      } catch (error) {
        showMessage(
          feedback,
          'Submission status is still unknown. Check your connection and check status again before submitting.',
          'error'
        );
      } finally {
        button.disabled = false;
      }
      return;
    }

    button.disabled = true;
    submissionStartedAt = Date.now();
    try {
      await api.post('/mentor/reports', fields);
      showMessage(feedback, 'Support report filed successfully.', 'success');
      form.reset();
      try {
        await refreshReports();
      } catch (error) {
        showMessage(
          reportsHost,
          'The report was filed successfully, but the report list could not be refreshed.',
          'error'
        );
      }
    } catch (error) {
      if (error.status === 408 || error.status === 0) {
        submissionUncertain = true;
        button.textContent = 'Check report status';
        showMessage(
          feedback,
          'We could not confirm the response. Your report may have been saved. Check its status before submitting again.',
          'error'
        );
      } else {
        showMessage(feedback, error.message, 'error');
      }
    } finally {
      button.disabled = false;
    }
  });
}
