import { api } from '../api.js';
import { setupMentor, makeElement, showMessage, renderReports } from './mentor-common.js';

if (setupMentor()) {
  const metricsHost = document.getElementById('mentor-metrics');
  const reportsHost = document.getElementById('recent-reports-table');
  const stateHost = document.getElementById('dashboard-reports-state');
  const welcomeSub = document.getElementById('mentor-welcome-sub');

  async function initDashboard() {
    try {
      stateHost.textContent = 'Loading mentor data…';

      const [profileRes, reportsRes] = await Promise.all([
        api.get('/mentor/profile'),
        api.get('/mentor/reports'),
      ]);

      const profile = profileRes.data || {};
      const reports = reportsRes.data || [];

      stateHost.textContent = '';

      if (welcomeSub && profile.name) {
        welcomeSub.textContent = `Welcome, ${profile.name} (${profile.university || 'Mentor'}) — Bilunex Peer Mentorship Network.`;
      }

      // Render Metrics Grid
      metricsHost.replaceChildren();

      const makeCard = (title, count, subtext) => {
        const card = makeElement('div');
        card.className = 'metric-card';
        const header = makeElement('div');
        header.className = 'metric-card-header';
        const titleSpan = makeElement('span', title);
        titleSpan.className = 'metric-card-title';
        header.append(titleSpan);
        const val = makeElement('div', count);
        val.className = 'metric-card-value';
        const sub = makeElement('div', subtext);
        sub.className = 'metric-card-sub';
        card.append(header, val, sub);
        return card;
      };

      const specializationsCount = (profile.subject_specializations || []).length;

      metricsHost.append(
        makeCard(
          'Account Status',
          profile.account_status ? profile.account_status.toUpperCase() : 'ACTIVE',
          'Verified mentor credentials'
        ),
        makeCard('Support Inquiries', reports.length, 'Confidential reports submitted to admin'),
        makeCard(
          'Subjects / Areas',
          specializationsCount || 1,
          (profile.subject_specializations || ['General']).join(', ')
        ),
        makeCard(
          'Institution',
          profile.university || 'University',
          profile.field_of_study || 'Department'
        )
      );

      // Render Recent Reports
      renderReports(reportsHost, reports);
    } catch (err) {
      stateHost.textContent = '';
      showMessage(stateHost, err.message || 'Failed to load mentor dashboard data', 'error');
    }
  }

  initDashboard();
}
