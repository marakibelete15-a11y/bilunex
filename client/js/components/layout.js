/** Shared public site chrome. DOM text is always inserted as text, never parsed as HTML. */

import { ui } from '../ui.js';
import { auth } from '../auth.js';
import { siteInfo } from '../config/site-info.js';

export const NAV_ITEMS = [
  { key: 'home', label: 'Home', href: 'index.html' },
  { key: 'about', label: 'About Us', href: 'about.html' },
  { key: 'services', label: 'Services', href: 'services.html' },
  { key: 'for-parents', label: 'For Parents', href: 'for-parents.html' },
  { key: 'become-a-mentor', label: 'Become a Mentor', href: 'become-a-mentor.html' },
  { key: 'stories', label: 'Stories & Resources', href: 'stories.html' },
  { key: 'contact', label: 'Contact Us', href: 'contact.html' },
];

const makeLogo = (className, href = 'index.html') => {
  const link = document.createElement('a');
  link.href = href;
  link.className = className;
  link.setAttribute('aria-label', 'Bilunex home');
  const mark = document.createElement('span');
  mark.className = 'brand-mark-slot';
  mark.dataset.brandMark = '';
  mark.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('span');
  copy.className = 'brand-copy';
  const wordmark = document.createElement('span');
  wordmark.className = 'brand-wordmark';
  wordmark.textContent = 'Bilunex';
  const tagline = document.createElement('span');
  tagline.className = 'brand-tagline';
  tagline.textContent = 'Education · Growth · Opportunity';
  copy.append(wordmark, tagline);
  link.append(mark, copy);
  return link;
};

async function loadLogoMarks() {
  const slots = [...document.querySelectorAll('[data-brand-mark]')];
  if (!slots.length) return;
  try {
    const response = await fetch(new URL('../../assets/images/logo-mark.svg', import.meta.url));
    if (!response.ok) throw new Error(`Logo request failed with HTTP ${response.status}`);
    const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    const svg = source.documentElement;
    if (svg.localName !== 'svg' || source.querySelector('parsererror')) {
      throw new Error('The Bilunex logo asset is not valid SVG.');
    }
    slots.forEach((slot, index) => {
      const mark = document.importNode(svg, true);
      const idMap = new Map();
      mark.querySelectorAll('[id]').forEach(node => {
        const originalId = node.id;
        const uniqueId = `${originalId}-${index + 1}`;
        idMap.set(originalId, uniqueId);
        node.id = uniqueId;
      });
      mark.querySelectorAll('*').forEach(node => {
        [...node.attributes].forEach(attribute => {
          let value = attribute.value;
          idMap.forEach((uniqueId, originalId) => {
            value = value.replaceAll(`url(#${originalId})`, `url(#${uniqueId})`);
            if (value === `#${originalId}`) value = `#${uniqueId}`;
          });
          if (value !== attribute.value) node.setAttribute(attribute.name, value);
        });
        if (node.localName === 'style') {
          let css = node.textContent;
          idMap.forEach((uniqueId, originalId) => {
            css = css.replaceAll(`url(#${originalId})`, `url(#${uniqueId})`);
          });
          node.textContent = css;
        }
      });
      mark.setAttribute('aria-hidden', 'true');
      mark.setAttribute('focusable', 'false');
      mark.removeAttribute('role');
      mark.removeAttribute('aria-labelledby');
      mark.querySelectorAll('title, desc').forEach(node => node.remove());
      slot.replaceChildren(mark);
    });
  } catch (error) {
    console.error('Could not load the Bilunex logo mark.', error);
  }
}

const svgNamespace = 'http://www.w3.org/2000/svg';
const learningIcons = [
  [
    ['path', 'M7 8.5c4-2 8-2 12 0v12c-4-2-8-2-12 0z'],
    ['path', 'M19 8.5c4-2 8-2 12 0v12c-4-2-8-2-12 0z'],
    ['path', 'M19 8v13'],
  ],
  [
    ['circle', 'cx="19" cy="19" r="3"'],
    ['ellipse', 'cx="19" cy="19" rx="15" ry="6"'],
    ['ellipse', 'cx="19" cy="19" rx="6" ry="15"'],
  ],
  [
    ['path', 'M5 15h28l-14 9z'],
    ['path', 'M19 24v7'],
    ['path', 'M12 31h14'],
    ['path', 'M12 15l-5-6'],
    ['path', 'M26 15l5-6'],
  ],
  [
    ['path', 'M19 4a10 10 0 0 0-6 18v5h12v-5a10 10 0 0 0-6-18z'],
    ['path', 'M14 32h10'],
    ['path', 'M15 27h8'],
  ],
  [
    ['path', 'M19 5c-8-7-16 1-13 10 2 8 8 13 13 13s11-5 13-13c3-9-5-17-13-10z'],
    ['path', 'M19 10c-5-3-9 2-7 7 1 3 4 5 7 5'],
    ['path', 'M19 10c5-3 9 2 7 7-1 3-4 5-7 5'],
  ],
  [
    ['path', 'M6 9h26v16H18l-8 6v-6H6z'],
    ['path', 'M12 17h14'],
    ['path', 'M12 21h9'],
  ],
  [
    ['path', 'M12 5h14'],
    ['path', 'M15 5v11L7 30a3 3 0 0 0 3 4h18a3 3 0 0 0 3-4l-8-14V5'],
    ['path', 'M11 27h17'],
  ],
  [
    ['path', 'M8 6l21 21'],
    ['path', 'M6 8l5-5 21 21-5 5z'],
    ['path', 'M8 26l-3 6 6-3'],
  ],
];

function addBannerDecorations() {
  document.querySelectorAll('.page-hero, .home-hero').forEach(banner => {
    const decoration = document.createElement('div');
    decoration.className = 'banner-decorations';
    decoration.setAttribute('aria-hidden', 'true');
    decoration.setAttribute('inert', '');
    learningIcons.forEach((paths, index) => {
      const icon = document.createElementNS(svgNamespace, 'svg');
      icon.setAttribute('viewBox', '0 0 38 38');
      icon.setAttribute('focusable', 'false');
      icon.classList.add('banner-icon', `banner-icon-${index + 1}`);
      paths.forEach(([tag, data]) => {
        const shape = document.createElementNS(svgNamespace, tag);
        if (tag === 'circle' || tag === 'ellipse') {
          for (const match of data.matchAll(/([a-z]+)="([^"]+)"/g)) {
            shape.setAttribute(match[1], match[2]);
          }
        } else shape.setAttribute('d', data);
        shape.setAttribute('fill', 'none');
        shape.setAttribute('stroke', 'currentColor');
        shape.setAttribute('stroke-width', '1.5');
        shape.setAttribute('stroke-linecap', 'round');
        shape.setAttribute('stroke-linejoin', 'round');
        icon.appendChild(shape);
      });
      decoration.appendChild(icon);
    });
    banner.appendChild(decoration);
  });
}

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
  nav.className = 'primary-nav header-actions';
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

  const registerCta = document.createElement('a');
  registerCta.href = 'parent-registration.html';
  registerCta.className = 'btn btn-accent nav-register-cta';
  registerCta.textContent = 'Register Your Student';
  nav.appendChild(registerCta);

  header.appendChild(toggle);
  header.appendChild(nav);
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
  const storyEntry = document.createElement('li');
  const storyLink = document.createElement('a');
  storyLink.href = 'share-your-story.html';
  storyLink.textContent = 'Share Your Story';
  storyEntry.appendChild(storyLink);
  linkList.appendChild(storyEntry);
  links.append(linksTitle, linkList);
  grid.appendChild(links);

  const contact = document.createElement('div');
  contact.className = 'footer-col';
  const contactTitle = document.createElement('h2');
  contactTitle.textContent = 'Contact';
  const email = document.createElement('a');
  email.href = `mailto:${siteInfo.email}`;
  email.textContent = siteInfo.email;
  const contactList = document.createElement('ul');
  contactList.className = 'footer-nav-list';
  const addContactLink = (label, link) => {
    const entry = document.createElement('li');
    const prefix = document.createElement('span');
    prefix.textContent = `${label}: `;
    entry.append(prefix, link);
    contactList.appendChild(entry);
  };
  addContactLink('Email', email);
  const phone = document.createElement('a');
  phone.href = `tel:${siteInfo.phoneHref}`;
  phone.textContent = siteInfo.phone;
  addContactLink('Phone', phone);
  const location = document.createElement('p');
  location.textContent = `Location: ${siteInfo.address}`;
  const mentorLogin = document.createElement('a');
  mentorLogin.href = '../mentor/login.html';
  mentorLogin.textContent = 'Mentor portal login';
  const telegram = document.createElement('a');
  telegram.href = siteInfo.telegramUrl;
  telegram.textContent = siteInfo.telegram;
  telegram.rel = 'noopener noreferrer';
  addContactLink('Telegram', telegram);
  contact.append(contactTitle, contactList, location);
  grid.appendChild(contact);

  const mentors = document.createElement('div');
  mentors.className = 'footer-col footer-mentors';
  const mentorsTitle = document.createElement('h2');
  mentorsTitle.textContent = 'For mentors';
  const mentorList = document.createElement('ul');
  mentorList.className = 'footer-nav-list';
  const mentorEntry = document.createElement('li');
  mentorEntry.appendChild(mentorLogin);
  mentorList.appendChild(mentorEntry);
  mentors.append(mentorsTitle, mentorList);
  grid.appendChild(mentors);

  const admin = document.createElement('div');
  admin.className = 'footer-col footer-admin';
  const adminTitle = document.createElement('h2');
  adminTitle.textContent = 'For administrators';
  const adminList = document.createElement('ul');
  adminList.className = 'footer-nav-list';
  const adminEntry = document.createElement('li');
  const adminLogin = document.createElement('a');
  adminLogin.href = '../admin/login.html';
  adminLogin.textContent = 'Admin portal login';
  adminEntry.appendChild(adminLogin);
  adminList.appendChild(adminEntry);
  admin.append(adminTitle, adminList);
  grid.appendChild(admin);

  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';
  const copyright = document.createElement('p');
  copyright.textContent = `© ${new Date().getFullYear()} Bilunex`;
  bottom.appendChild(copyright);
  container.append(grid, bottom);
  host.replaceChildren(container);
}

export function initLayout(activeKey = '') {
  addBannerDecorations();
  renderHeader(activeKey);
  renderFooter();
  loadLogoMarks();
}

export function initPortalLayout() {
  const host = document.getElementById('portal-header');
  if (!host) return;
  const role = window.location.pathname.includes('/admin/') ? 'Admin' : 'Mentor';
  const identityId = role === 'Admin' ? 'admin-user-display' : 'mentor-display';
  const identityText = role === 'Admin' ? 'Admin' : 'Mentor';
  const header = document.createElement('div');
  header.className = 'container header-inner portal-header-inner';
  const logo = makeBrandMark('brand-logo');
  logo.href = '/public/index.html';
  header.appendChild(logo);
  const layout = document.querySelector('.portal-layout');
  const navItems =
    role === 'Admin'
      ? [
          [
            '/admin/index.html',
            'Dashboard',
            '<svg class="portal-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
          ],
          [
            '/admin/registrations.html',
            'Parent Registrations',
            '<svg class="portal-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',
          ],
          [
            '/admin/applications.html',
            'Mentor Applications',
            '<svg class="portal-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M22 10v6M2 10l10-5 10 5-10 5z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>',
          ],
          [
            '/admin/stories.html',
            'Stories & Resources',
            '<svg class="portal-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
          ],
          [
            '/admin/inquiries.html',
            'Inquiries & Contact',
            '<svg class="portal-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4a2 2 0 00-2 2v1a2 2 0 01-2 2h-4a2 2 0 01-2-2v-1a2 2 0 00-2-2H4"/></svg>',
          ],
          [
            '/admin/reports.html',
            'Student Support Reports',
            '<svg class="portal-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
          ],
          [
            '/admin/mentors.html',
            'Active Mentors',
            '<svg class="portal-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
          ],
        ]
      : [
          [
            '/mentor/index.html',
            'Dashboard',
            '<svg class="portal-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
          ],
          [
            '/mentor/profile.html',
            'My Profile',
            '<svg class="portal-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
          ],
          [
            '/mentor/report.html',
            'Student Support Reports',
            '<svg class="portal-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
          ],
        ];

  if (layout) {
    const currentPage = window.location.pathname;
    const aside = document.createElement('aside');
    aside.className = 'portal-sidebar';
    aside.id = 'portal-navigation';

    // Top section: Brand / Dashboard title (Matching Image 2 ADMIN PANEL header)
    const brandDiv = document.createElement('div');
    brandDiv.className = 'sidebar-brand';
    brandDiv.innerHTML = `
      <svg class="portal-brand-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
      </svg>
      <span class="sidebar-title">${role === 'Admin' ? 'ADMIN PANEL' : 'MENTOR PORTAL'}</span>
    `;
    aside.appendChild(brandDiv);

    // Nav list with icons
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', `${role} navigation`);
    const list = document.createElement('ul');
    list.className = 'portal-nav';
    navItems.forEach(([href, label, iconSvg]) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = href;
      link.innerHTML = `${iconSvg}<span>${label}</span>`;
      if (
        href === currentPage ||
        (href.endsWith('/index.html') &&
          (currentPage.endsWith('/admin/') || currentPage.endsWith('/mentor/')))
      ) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      item.appendChild(link);
      list.appendChild(item);
    });
    nav.appendChild(list);
    aside.appendChild(nav);

    // Bottom section: User Info & Logout
    const user = auth.getUser();
    const userEmail = user?.email || identityText;
    const initial = (user?.name || userEmail)[0]?.toUpperCase() || 'U';

    const userFooter = document.createElement('div');
    userFooter.className = 'sidebar-user-footer';
    userFooter.innerHTML = `
      <div class="sidebar-user-info">
        <div class="sidebar-avatar" aria-hidden="true">${initial}</div>
        <div class="sidebar-user-meta">
          <span class="sidebar-user-name" title="${userEmail}">${userEmail}</span>
          <span class="sidebar-user-role">${role}</span>
        </div>
      </div>
      <button type="button" class="sidebar-logout-btn">Log out</button>
    `;
    userFooter.querySelector('.sidebar-logout-btn').addEventListener('click', () => {
      auth.logout(role === 'Admin' ? '/admin/login.html' : '/mentor/login.html');
    });
    aside.appendChild(userFooter);

    layout.querySelector('.portal-sidebar')?.remove();
    layout.insertBefore(aside, layout.querySelector('.portal-main'));

    // Mobile Hamburger
    const menu = document.createElement('button');
    menu.type = 'button';
    menu.className = 'portal-menu-toggle';
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-controls', 'portal-navigation');
    menu.textContent = 'Menu';
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      aside.classList.toggle('is-open', open);
    });
    header.appendChild(menu);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && aside.classList.contains('is-open')) {
        aside.classList.remove('is-open');
        menu.setAttribute('aria-expanded', 'false');
        menu.focus();
      }
    });

    document.addEventListener('click', event => {
      if (
        aside.classList.contains('is-open') &&
        !aside.contains(event.target) &&
        !menu.contains(event.target)
      ) {
        aside.classList.remove('is-open');
        menu.setAttribute('aria-expanded', 'false');
      }
    });
  }

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
    logout.addEventListener('click', () =>
      auth.logout(role === 'Admin' ? '/admin/login.html' : '/mentor/login.html')
    );
  }
  header.appendChild(controls);
  host.replaceChildren(header);
  if (window.location.pathname.endsWith('/login.html')) {
    document
      .querySelector('.admin-login-card')
      ?.prepend(makeLogo('brand-logo login-brand-logo', '../public/index.html'));
  }
  loadLogoMarks();
}
