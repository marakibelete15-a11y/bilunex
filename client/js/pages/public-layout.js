import { initLayout } from '../components/layout.js';

const pageKey = window.location.pathname.split('/').pop().replace('.html', '');
const activeKey = pageKey === 'index' ? 'home' : pageKey;
initLayout(activeKey);
