import { api, ApiError } from '../api.js';
import { setupMentor, showMessage } from './mentor-common.js';

if (setupMentor()) {
  const profileFeedback = document.getElementById('profile-feedback');
  const profileForm = document.getElementById('profile-form');
  const editBtn = document.getElementById('edit-profile-btn');

  const passwordFeedback = document.getElementById('password-feedback');
  const passwordForm = document.getElementById('password-form');

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const section = document.getElementById('edit-profile-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        profileForm.elements.full_name?.focus();
      }
    });
  }

  const renderProfileData = profile => {
    document.getElementById('profile-name').textContent = profile.full_name || '—';
    document.getElementById('profile-email').textContent = profile.email || '—';

    const statusEl = document.getElementById('profile-status');
    if (statusEl) {
      statusEl.replaceChildren();
      const badge = document.createElement('span');
      badge.className = `badge status-badge badge-${profile.account_status || 'active'}`;
      badge.textContent = profile.account_status || 'active';
      statusEl.appendChild(badge);
    }

    document.getElementById('profile-university').textContent = profile.university || '—';
    document.getElementById('profile-field').textContent = profile.field_of_study || '—';

    const subjDisp = document.getElementById('profile-subjects-display');
    if (subjDisp) {
      const subjects = Array.isArray(profile.subjects)
        ? profile.subjects
        : Array.isArray(profile.subject_specializations)
          ? profile.subject_specializations
          : [];
      subjDisp.textContent = subjects.join(', ') || 'General';
    }

    const availDisp = document.getElementById('profile-avail-display');
    if (availDisp) {
      availDisp.textContent = profile.availability || 'Flexible';
    }

    // Populate Edit Form
    if (profileForm.elements.full_name)
      profileForm.elements.full_name.value = profile.full_name || '';
    if (profileForm.elements.university)
      profileForm.elements.university.value = profile.university || '';
    if (profileForm.elements.field_of_study)
      profileForm.elements.field_of_study.value = profile.field_of_study || '';
    if (profileForm.elements.availability)
      profileForm.elements.availability.value = profile.availability || '';
    if (profileForm.elements.subjects) {
      const subjects = Array.isArray(profile.subjects)
        ? profile.subjects
        : Array.isArray(profile.subject_specializations)
          ? profile.subject_specializations
          : [];
      profileForm.elements.subjects.value = subjects.join(', ');
    }
  };

  async function loadProfile() {
    try {
      const response = await api.get('/mentor/me');
      renderProfileData(response.data);
    } catch (error) {
      showMessage(profileFeedback, error.message || 'Could not load profile.', 'error');
    }
  }

  loadProfile();

  profileForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = profileForm.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    try {
      const fields = new FormData(profileForm);
      const subjects = (fields.get('subjects') || '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);

      const payload = {
        full_name: fields.get('full_name')?.trim() || undefined,
        university: fields.get('university')?.trim() || undefined,
        field_of_study: fields.get('field_of_study')?.trim() || undefined,
        availability: fields.get('availability')?.trim() || undefined,
        subjects: subjects.length ? subjects : undefined,
      };

      const response = await api.patch('/mentor/me', payload);
      renderProfileData(response.data);
      showMessage(profileFeedback, 'Your profile has been updated.', 'success');
    } catch (error) {
      showMessage(profileFeedback, error.message || 'Could not update profile.', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  });

  passwordForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = passwordForm.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    const current_password = passwordForm.elements.current_password.value;
    const new_password = passwordForm.elements.new_password.value;

    if (!new_password || new_password.length < 8) {
      showMessage(passwordFeedback, 'New password must be at least 8 characters.', 'error');
      if (button) button.disabled = false;
      return;
    }

    try {
      await api.patch('/mentor/me/password', {
        current_password,
        new_password,
      });
      passwordForm.reset();
      showMessage(passwordFeedback, 'Password changed successfully.', 'success');
    } catch (error) {
      showMessage(passwordFeedback, error.message || 'Could not change password.', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  });
}
