import { initLayout } from '../components/layout.js';
import { api } from '../api.js';
import { ui } from '../ui.js';
initLayout('stories');
ui.checkOriginBanner();
const list = document.getElementById('published-stories');
const empty = document.getElementById('stories-empty');
const more = document.getElementById('load-more-stories');
const state = document.getElementById('stories-state');
let page = 1;
let totalPages = 1;
async function loadStories() {
  more.disabled = true;
  state.textContent = 'Loading stories…';
  try {
    const result = await api.get(`/public/stories?page=${page}&limit=10`);
    result.data.stories.forEach(story => {
      const card = document.createElement('article');
      card.className = 'card story-card';
      const title = document.createElement('h2');
      title.textContent = story.title;
      const byline = document.createElement('p');
      byline.textContent = `${story.display_name} · ${story.relationship}`;
      const body = document.createElement('p');
      body.textContent = story.body;
      const date = document.createElement('time');
      date.dateTime = story.date;
      date.textContent = new Date(story.date).toLocaleDateString();
      card.append(title, byline, body, date);
      list.append(card);
    });
    totalPages = result.data.pagination.totalPages;
    empty.hidden = result.data.pagination.total > 0;
    page += 1;
    more.hidden = page > totalPages;
    state.textContent = '';
  } catch (error) {
    state.textContent = `Stories could not be loaded: ${error.message}`;
  }
  more.disabled = false;
}
more.addEventListener('click', loadStories);
loadStories();
