import { initLayout } from '../components/layout.js';
import { ui } from '../ui.js';

initLayout('stories');
ui.checkOriginBanner();

const list = document.getElementById('published-stories');
const empty = document.getElementById('stories-empty');
const more = document.getElementById('load-more-stories');
const state = document.getElementById('stories-state');

if (more) {
  more.hidden = true;
}

async function loadStories() {
  if (state) state.textContent = 'Loading stories…';
  try {
    const response = await fetch('../assets/data/stories.json');
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const stories = await response.json();
    if (list) list.replaceChildren();

    if (!Array.isArray(stories) || stories.length === 0) {
      if (empty) empty.hidden = false;
      if (state) state.textContent = '';
      return;
    }

    if (empty) empty.hidden = true;
    stories.forEach(story => {
      const card = document.createElement('article');
      card.className = 'card story-card';
      const title = document.createElement('h2');
      title.textContent = story.title || '';
      const byline = document.createElement('p');
      byline.textContent = `${story.display_name || ''} · ${story.relationship || ''}`;
      const body = document.createElement('p');
      body.textContent = story.body || '';
      const date = document.createElement('time');
      if (story.date) {
        date.dateTime = story.date;
        date.textContent = new Date(story.date).toLocaleDateString();
      }
      card.append(title, byline, body, date);
      if (list) list.append(card);
    });
    if (state) state.textContent = '';
  } catch (error) {
    if (empty) empty.hidden = false;
    if (state) state.textContent = '';
  }
}

loadStories();
