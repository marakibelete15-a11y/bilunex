/**
 * Bilunex - Shared Layout Component (ES Module)
 * Reusable accessible Header (with exactly 7 public navigation items) and Footer.
 * Avoids template duplication across public HTML pages.
 * The Admin area is strictly omitted from the public navigation.
 */

import { ui } from '../ui.js';

export const NAV_ITEMS = [
  { key: 'home', label: 'Home', href: 'index.html' },
  { key: 'about', label: 'About Us', href: 'about.html' },
  { key: 'services', label: 'Services', href: 'services.html' },
  { key: 'for-parents', label: 'For Parents', href: 'for-parents.html' },
  { key: 'become-a-mentor', label: 'Become a Mentor', href: 'become-a-mentor.html' },
  { key: 'stories', label: 'Stories & Resources', href: 'stories.html' },
  { key: 'contact', label: 'Contact Us', href: 'contact.html' },
];

/**
 * Render the shared accessible header and navigation
 * @param {string} activeKey - Identifier of the active page (e.g. 'for-parents')
 */
export function renderHeader(activeKey = '') {
  const headerContainer = document.getElementById('site-header');
  if (!headerContainer) return;

  // Clear container
  while (headerContainer.firstChild) {
    headerContainer.removeChild(headerContainer.firstChild);
  }

  headerContainer.className = 'site-header';

  const inner = document.createElement('div');
  inner.className = 'container header-inner';

  // 1. Brand Logo
  const logo = document.createElement('a');
  logo.href = 'index.html';
  logo.className = 'brand-logo';
  logo.setAttribute('aria-label', 'Bilunex Support Hub Homepage');

  const logoText = document.createTextNode('Bilunex ');
  const tag = document.createElement('span');
  tag.className = 'brand-tag';
  tag.textContent = 'Support Hub';

  logo.appendChild(logoText);
  logo.appendChild(tag);
  inner.appendChild(logo);

  // 2. Mobile Navigation Toggle Button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'nav-toggle';
  toggleBtn.setAttribute('type', 'button');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.setAttribute('aria-controls', 'primary-nav');
  toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');

  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'nav-toggle-icon';
  toggleIcon.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < 3; i++) {
    const bar = document.createElement('span');
    bar.className = 'nav-toggle-bar';
    toggleIcon.appendChild(bar);
  }

  toggleBtn.appendChild(toggleIcon);
  inner.appendChild(toggleBtn);

  // 3. Primary Navigation Menu (Exactly 7 public items)
  const nav = document.createElement('nav');
  nav.id = 'primary-nav';
  nav.className = 'primary-nav';
  nav.setAttribute('aria-label', 'Primary navigation');

  const list = document.createElement('ul');
  list.className = 'nav-list';

  NAV_ITEMS.forEach(item => {
    const li = document.createElement('li');
    li.className = 'nav-item';

    const a = document.createElement('a');
    a.href = item.href;
    a.className = 'nav-link';
    a.textContent = item.label;

    if (item.key === activeKey) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }

    li.appendChild(a);
    list.appendChild(li);
  });

  nav.appendChild(list);
  inner.appendChild(nav);

  headerContainer.appendChild(inner);

  // Wire mobile navigation toggle behavior
  ui.initMobileNav();
}

/**
 * Render the shared accessible footer
 */
export function renderFooter() {
  const footerContainer = document.getElementById('site-footer');
  if (!footerContainer) return;

  while (footerContainer.firstChild) {
    footerContainer.removeChild(footerContainer.firstChild);
  }

  footerContainer.className = 'site-footer';

  const container = document.createElement('div');
  container.className = 'container';

  const grid = document.createElement('div');
  grid.className = 'footer-grid';

  // Column 1: About & Mission
  const col1 = document.createElement('div');
  col1.className = 'footer-col';
  const c1Title = document.createElement('h3');
  c1Title.textContent = 'Bilunex Support Hub';
  const c1Desc = document.createElement('p');
  c1Desc.textContent =
    'Connecting students with compassionate academic tutoring, structured 1-on-1 mentorship, and professional counseling care under a safe community framework.';
  const c1Privacy = document.createElement('p');
  c1Privacy.textContent = 'Student safety and confidentiality are prioritized across all programs.';
  col1.appendChild(c1Title);
  col1.appendChild(c1Desc);
  col1.appendChild(c1Privacy);
  grid.appendChild(col1);

  // Column 2: Navigation Links (All 7 public items)
  const col2 = document.createElement('div');
  col2.className = 'footer-col';
  const c2Title = document.createElement('h4');
  c2Title.textContent = 'Navigation';
  const c2List = document.createElement('ul');
  c2List.className = 'footer-nav-list';
  NAV_ITEMS.forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    li.appendChild(a);
    c2List.appendChild(li);
  });
  col2.appendChild(c2Title);
  col2.appendChild(c2List);
  grid.appendChild(col2);

  // Column 3: Services Summary
  const col3 = document.createElement('div');
  col3.className = 'footer-col';
  const c3Title = document.createElement('h4');
  c3Title.textContent = 'Support Programs';
  const c3List = document.createElement('ul');
  c3List.className = 'footer-nav-list';
  [
    'Academic Tutoring (K-12 & Prep)',
    '1-on-1 Youth Mentorship',
    'Student Counseling & Wellbeing',
    'Holistic Combined Support',
  ].forEach(serviceText => {
    const li = document.createElement('li');
    li.textContent = serviceText;
    c3List.appendChild(li);
  });
  col3.appendChild(c3Title);
  col3.appendChild(c3List);
  grid.appendChild(col3);

  // Column 4: Contact & Location (Truthful placeholders)
  const col4 = document.createElement('div');
  col4.className = 'footer-col';
  const c4Title = document.createElement('h4');
  c4Title.textContent = 'Contact & Support';
  const c4Desc = document.createElement('p');
  c4Desc.textContent =
    'Have questions before registering? Reach out through our contact form or official channels:';
  const c4List = document.createElement('ul');
  c4List.className = 'footer-nav-list';

  const liContact = document.createElement('li');
  const aContact = document.createElement('a');
  aContact.href = 'contact.html';
  aContact.textContent = 'Send a Message via Contact Page';
  liContact.appendChild(aContact);

  const liOffice = document.createElement('li');
  liOffice.textContent = 'Location: [To be confirmed by Bilunex]';

  const liHours = document.createElement('li');
  liHours.textContent = 'Hours: [To be confirmed by Bilunex]';

  c4List.appendChild(liContact);
  c4List.appendChild(liOffice);
  c4List.appendChild(liHours);

  col4.appendChild(c4Title);
  col4.appendChild(c4Desc);
  col4.appendChild(c4List);
  grid.appendChild(col4);

  container.appendChild(grid);

  // Bottom Copyright Bar
  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';

  const copy = document.createElement('p');
  copy.textContent = `© ${new Date().getFullYear()} Bilunex Platform. All rights reserved.`;

  const safeTag = document.createElement('p');
  safeTag.textContent = 'Committed to safe, accessible, and supportive education.';

  bottom.appendChild(copy);
  bottom.appendChild(safeTag);
  container.appendChild(bottom);

  footerContainer.appendChild(container);
}

/**
 * Initialize shared layout for a page
 * @param {string} activeKey - Identifier of the active page (e.g. 'for-parents')
 */
export function initLayout(activeKey = '') {
  renderHeader(activeKey);
  renderFooter();
}
