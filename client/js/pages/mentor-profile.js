import { api } from '../api.js';
import { setupMentor, showMessage } from './mentor-common.js';

if (setupMentor()) {
  const feedback = document.getElementById('profile-feedback');
  const form = document.getElementById('profile-form');
  const editBtn = document.getElementById('edit-profile-btn');

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const section = document.getElementById('edit-profile-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        form.elements.name?.focus();
      }
    });
  }

  const renderProfileData = profile => {
    document.getElementById('profile-name').textContent = profile.name || '—';
    document.getElementById('profile-email').textContent = profile.email || '—';
    document.getElementById('profile-university').textContent = profile.university || '—';
    document.getElementById('profile-field').textContent = profile.field_of_study || '—';

    const subjDisp = document.getElementById('profile-subjects-display');
    if (subjDisp) {
      subjDisp.textContent =
        (Array.isArray(profile.subject_specializations)
          ? profile.subject_specializations
          : []
        ).join(', ') || 'General';
    }

    const availDisp = document.getElementById('profile-avail-display');
    if (availDisp) {
      availDisp.textContent = profile.availability || 'Flexible';
    }

    if (form.elements.name) form.elements.name.value = profile.name || '';
    if (form.elements.university) form.elements.university.value = profile.university || '';
    if (form.elements.field_of_study)
      form.elements.field_of_study.value = profile.field_of_study || '';
    if (form.elements.availability) form.elements.availability.value = profile.availability || '';
    if (form.elements.subject_specializations) {
      form.elements.subject_specializations.value = (
        Array.isArray(profile.subject_specializations) ? profile.subject_specializations : []
      ).join(', ');
    }
  };

  try {
    const profileResponse = await api.get('/mentor/profile');
    renderProfileData(profileResponse.data);
  } catch (error) {
    showMessage(feedback, error.message, 'error');
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

      const payload = {
        name: fields.get('name')?.trim() || undefined,
        university: fields.get('university')?.trim() || undefined,
        field_of_study: fields.get('field_of_study')?.trim() || undefined,
        availability: fields.get('availability')?.trim() || undefined,
        subject_specializations: subjects.length ? subjects : undefined,
      };

      const response = await api.patch('/mentor/profile', payload);
      renderProfileData(response.data);
      showMessage(feedback, 'Your profile has been updated.', 'success');
    } catch (error) {
      showMessage(feedback, error.message, 'error');
    } finally {
      button.disabled = false;
    }
  });
}
