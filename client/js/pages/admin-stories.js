import { api } from '../api.js';
import { setupAdmin, el, message } from './admin-common.js';
if (setupAdmin()) {
  const list = document.getElementById('admin-story-list');
  const detail = document.getElementById('admin-story-detail');
  const state = document.getElementById('stories-admin-state');
  const filter = document.getElementById('story-status-filter');
  const valueLine = (label, value) => {
    const p = document.createElement('p');
    p.textContent = `${label}: ${value ?? '—'}`;
    return p;
  };
  async function loadList() {
    try {
      const { data } = await api.get(`/admin/stories?status=${filter.value}&limit=50`);
      list.replaceChildren();
      data.stories.forEach(story => {
        const button = el('button', `${story.title} · ${story.status}`, 'btn btn-outline');
        button.type = 'button';
        button.addEventListener('click', () => loadDetail(story.id));
        list.append(button);
      });
      if (!data.stories.length) message(list, 'No stories in this status.');
    } catch (error) {
      message(state, error.message, 'error');
    }
  }
  async function loadDetail(id) {
    try {
      const { data } = await api.get(`/admin/stories/${id}`);
      const story = data;
      detail.replaceChildren(
        valueLine('Name (private)', story.full_name),
        valueLine('Display style', story.display_style),
        valueLine('Relationship', story.relationship),
        valueLine('Email (private)', story.email),
        valueLine('Phone (private)', story.phone),
        valueLine('Title', story.title),
        valueLine('Story', story.body),
        valueLine('Consent: genuine experience', story.consent_genuine),
        valueLine('Consent: publication', story.consent_publish),
        valueLine('Consent: child/guardian', story.consent_child_guardian),
        valueLine('Status', story.status)
      );
      const actions = document.createElement('div');
      actions.className = 'form-actions';
      [
        ['approved', 'Approve'],
        ['rejected', 'Reject'],
        ['pending', 'Move to pending'],
      ].forEach(([status, label]) => {
        const button = el('button', label, 'btn btn-primary');
        button.type = 'button';
        button.addEventListener('click', async () => {
          if (
            !window.confirm(
              `Confirm ${label.toLowerCase()}? Check that no child's full name or private detail appears in the story.`
            )
          )
            return;
          try {
            await api.patch(`/admin/stories/${id}/status`, { status });
            await loadList();
            await loadDetail(id);
          } catch (error) {
            message(state, error.message, 'error');
          }
        });
        actions.append(button);
      });
      detail.append(actions);
    } catch (error) {
      message(state, error.message, 'error');
    }
  }
  filter.addEventListener('change', loadList);
  loadList();
}
