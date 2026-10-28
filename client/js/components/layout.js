/** Shared public site chrome. DOM text is always inserted as text, never parsed as HTML. */

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

const makeLogo = className => {
  const link = document.createElement('a');
  link.href = 'index.html';
  link.className = className;
  link.setAttribute('aria-label', 'Bilunex home');
  const image = document.createElement('img');
  image.src = '../assets/images/logo.svg';
  image.alt = 'Bilunex — Education · Growth · Opportunity';
  image.width = 190;
  image.height = 48;
  link.appendChild(image);
  return link;
};

export function renderHeader(activeKey = '') {
  const host = document.getElementById('site-header');
  if (!host) return;
  const header = document.createElement('div');
  header.className = 'container header-inner';
  header.appendChild(makeLogo('brand-logo'));

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'primary-nav');
  toggle.setAttribute('aria-label', 'Open navigation menu');
  toggle.appendChild(document.createElement('span'));
  toggle.firstChild.className = 'nav-toggle-icon';
  toggle.firstChild.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 3; index += 1) {
    const bar = document.createElement('span');
    bar.className = 'nav-toggle-bar';
    toggle.firstChild.appendChild(bar);
  }

  const nav = document.createElement('nav');
  nav.id = 'primary-nav';
  nav.className = 'primary-nav';
  nav.setAttribute('aria-label', 'Primary navigation');
  const list = document.createElement('ul');
  list.className = 'nav-list';
  NAV_ITEMS.forEach(item => {
    const entry = document.createElement('li');
    const link = document.createElement('a');
    link.href = item.href;
    link.className = 'nav-link';
    link.textContent = item.label;
    if (item.key === activeKey) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
    entry.appendChild(link);
    list.appendChild(entry);
  });
  nav.appendChild(list);

  const drawerCta = document.createElement('a');
  drawerCta.href = 'parent-registration.html';
  drawerCta.className = 'btn btn-accent nav-register-mobile';
  drawerCta.textContent = 'Register Your Student';
  nav.appendChild(drawerCta);

  const desktopCta = document.createElement('a');
  desktopCta.href = 'parent-registration.html';
  desktopCta.className = 'btn btn-accent nav-register-desktop';
  desktopCta.textContent = 'Register Your Student';

  header.appendChild(toggle);
  header.appendChild(nav);
  header.appendChild(desktopCta);
  host.replaceChildren(header);
  ui.initMobileNav();
}

export function renderFooter() {
  const host = document.getElementById('site-footer');
  if (!host) return;
  const container = document.createElement('div');
  container.className = 'container';
  const grid = document.createElement('div');
  grid.className = 'footer-grid';

  const brand = document.createElement('div');
  brand.className = 'footer-col footer-brand';
  brand.appendChild(makeLogo('footer-logo'));
  const tagline = document.createElement('p');
  tagline.textContent = 'Education · Growth · Opportunity';
  brand.appendChild(tagline);
  grid.appendChild(brand);

  const links = document.createElement('div');
  links.className = 'footer-col';
  const linksTitle = document.createElement('h2');
  linksTitle.textContent = 'Quick links';
  const linkList = document.createElement('ul');
  linkList.className = 'footer-nav-list';
  NAV_ITEMS.forEach(item => {
    const entry = document.createElement('li');
    const link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.label;
    entry.appendChild(link);
    linkList.appendChild(entry);
  });
  links.append(linksTitle, linkList);
  grid.appendChild(links);

  const contact = document.createElement('div');
  contact.className = 'footer-col';
  const contactTitle = document.createElement('h2');
  contactTitle.textContent = 'Contact';
  const contactInfo = document.createElement('p');
  contactInfo.textContent = 'Email: [To be confirmed by Bilunex]';
  const location = document.createElement('p');
  location.textContent = 'Location: [To be confirmed by Bilunex]';
  const mentorLogin = document.createElement('a');
  mentorLogin.href = '../mentor/login.html';
  mentorLogin.textContent = 'Mentor portal login';
  contact.append(contactTitle, contactInfo, location, mentorLogin);
  grid.appendChild(contact);

  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';
  const copyright = document.createElement('p');
  copyright.textContent = `© ${new Date().getFullYear()} Bilunex`;
  bottom.appendChild(copyright);
  container.append(grid, bottom);
  host.replaceChildren(container);
}

export function initLayout(activeKey = '') {
  renderHeader(activeKey);
  renderFooter();
}

export function initPortalLayout() {
  const host = document.getElementById('portal-header');
  if (!host) return;
  const role = window.location.pathname.includes('/admin/') ? 'Admin' : 'Mentor';
  const identityId = role === 'Admin' ? 'admin-user-display' : 'mentor-display';
  const identityText = role === 'Admin' ? 'Admin' : 'Mentor';
  const header = document.createElement('div');
  header.className = 'container header-inner portal-header-inner';
  const logo = makeLogo('brand-logo');
  logo.href = '../public/index.html';
  header.appendChild(logo);
  const controls = document.createElement('div');
  controls.className = 'portal-header-controls';
  const badge = document.createElement('span');
  badge.className = 'brand-tag portal-role-tag';
  badge.textContent = `${role} Portal`;
  controls.appendChild(badge);
  if (!window.location.pathname.endsWith('/login.html')) {
    const identity = document.createElement('span');
    identity.id = identityId;
    identity.textContent = identityText;
    controls.appendChild(identity);
    const logout = document.createElement('button');
    logout.type = 'button';
    logout.id = 'logout-btn';
    logout.className = 'btn btn-outline btn-sm';
    logout.textContent = role === 'Admin' ? 'Logout' : 'Sign Out';
    controls.appendChild(logout);
  }
  header.appendChild(controls);
  host.replaceChildren(header);
}
