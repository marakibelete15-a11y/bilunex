import { api } from '../api.js';
import { setupMentor } from './mentor-common.js';

if (setupMentor()) {
  const welcomeSub = document.getElementById('mentor-welcome-sub');

  async function initDashboard() {
    try {
      const profileRes = await api.get('/mentor/profile');
      const profile = profileRes.data || {};

      if (welcomeSub && profile.name) {
        welcomeSub.textContent = `Welcome, ${profile.name} (${profile.university || 'Mentor'}) — Bilunex Peer Mentorship Network.`;
      }
    } catch {
      // Absorb load failure
    }
  }

  initDashboard();
}
