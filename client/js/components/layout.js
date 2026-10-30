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

const makeBrandMark = className => {
  const link = document.createElement('a');
  link.href = 'index.html';
  link.className = className;
  link.setAttribute('aria-label', 'Bilunex home');
  const mark = document.createElementNS(svgNamespace, 'svg');
  mark.setAttribute('viewBox', '0 0 100 100');
  mark.setAttribute('aria-hidden', 'true');
  mark.setAttribute('role', 'presentation');
  mark.setAttribute('focusable', 'false');
  const use = document.createElementNS(svgNamespace, 'use');
  use.setAttribute('href', '../assets/images/logo-mark.svg#bilunex-mark');
  mark.appendChild(use);
  link.appendChild(mark);
  return link;
};

const svgNamespace = 'http://www.w3.org/2000/svg';
const makeBrandLockup = className => {
  const link = makeBrandMark(className);
  const wordmark = document.createElement('span');
  wordmark.className = 'brand-wordmark';
  wordmark.textContent = 'Bilunex';
  const tagline = document.createElement('span');
  tagline.className = 'brand-tagline';
  tagline.textContent = 'EDUCATION · GROWTH · OPPORTUNITY';
  const text = document.createElement('span');
  text.className = 'brand-lockup-text';
  text.append(wordmark, tagline);
  link.appendChild(text);
  return link;
};

const makeLogo = makeBrandLockup;

function decorativeSvg(className, viewBox) {
  const svg = document.createElementNS(svgNamespace, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  return svg;
}

function renderBrandBanner(host, compact = false) {
  if (!host) return;
  const banner = document.createElement('div');
  banner.className = compact ? 'brand-banner login-brand-banner' : 'brand-banner';
  const art = decorativeSvg('brand-banner-art brand-network', '0 0 520 112');
  [
    ['path', 'M0 72 56 44 112 79 174 24 238 68 305 31'],
    ['path', 'M18 7 56 44 90 8 112 79 174 24 207 99 238 68 279 99 305 31 352 76'],
  ].forEach(([tag, d]) => {
    const path = document.createElementNS(svgNamespace, tag);
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1');
    art.appendChild(path);
  });
  [
    [18, 7],
    [56, 44],
    [90, 8],
    [112, 79],
    [174, 24],
    [207, 99],
    [238, 68],
    [279, 99],
    [305, 31],
    [352, 76],
  ].forEach(([cx, cy]) => {
    const node = document.createElementNS(svgNamespace, 'circle');
    node.setAttribute('cx', String(cx));
    node.setAttribute('cy', String(cy));
    node.setAttribute('r', '2.4');
    node.setAttribute('fill', 'currentColor');
    art.appendChild(node);
  });
  const book = decorativeSvg('brand-banner-art brand-book', '0 0 180 100');
  const bookPath = document.createElementNS(svgNamespace, 'path');
  bookPath.setAttribute(
    'd',
    'M12 18c24-8 47-3 78 10v55C59 70 36 66 12 74V18Zm156 0c-24-8-47-3-78 10v55c31-13 54-17 78-9V18ZM90 28v55'
  );
  bookPath.setAttribute('fill', 'none');
  bookPath.setAttribute('stroke', 'currentColor');
  bookPath.setAttribute('stroke-width', '2');
  bookPath.setAttribute('stroke-linecap', 'round');
  bookPath.setAttribute('stroke-linejoin', 'round');
  book.appendChild(bookPath);
  const inner = document.createElement('div');
  inner.className = 'container brand-banner-inner';
  inner.appendChild(makeBrandLockup('brand-lockup'));
  banner.append(art, book, inner);
  host.replaceChildren(banner);
}

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
  const compactMark = makeBrandMark('nav-brand-mark');
  compactMark.href = 'index.html';
  header.appendChild(compactMark);

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
  const bannerHost = document.getElementById('site-brand-banner');
  renderBrandBanner(bannerHost);
  if (bannerHost && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      host.classList.toggle('is-brand-visible', !entry.isIntersecting);
    });
    observer.observe(bannerHost);
  }
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
  const email = document.createElement('a');
  email.href = `mailto:${siteInfo.email}`;
  email.textContent = siteInfo.email;
  const contactInfo = document.createElement('p');
  contactInfo.append('Email: ', email);
  const phone = document.createElement('a');
  phone.href = `tel:${siteInfo.phoneHref}`;
  phone.textContent = siteInfo.phone;
  const phoneInfo = document.createElement('p');
  phoneInfo.append('Phone: ', phone);
  const location = document.createElement('p');
  location.textContent = `Location: ${siteInfo.address}`;
  const storyLink = document.createElement('a');
  storyLink.href = 'share-your-story.html';
  storyLink.textContent = 'Share Your Story';
  const mentorLogin = document.createElement('a');
  mentorLogin.href = '../mentor/login.html';
  mentorLogin.textContent = 'Mentor portal login';
  const telegram = document.createElement('a');
  telegram.href = siteInfo.telegramUrl;
  telegram.textContent = siteInfo.telegram;
  telegram.rel = 'noopener noreferrer';
  const telegramInfo = document.createElement('p');
  telegramInfo.append('Telegram: ', telegram);
  contact.append(
    contactTitle,
    contactInfo,
    phoneInfo,
    telegramInfo,
    location,
    storyLink,
    mentorLogin
  );
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
  addBannerDecorations();
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
  const logo = makeBrandMark('brand-logo');
  logo.href = '../public/index.html';
  header.appendChild(logo);
  if (window.location.pathname.endsWith('/login.html')) {
    renderBrandBanner(document.getElementById('portal-brand-banner'), true);
  }
  const layout = document.querySelector('.portal-layout');
  const navItems =
    role === 'Admin'
      ? [
          ['index.html', 'Dashboard'],
          ['registrations.html', 'Parent Registrations'],
          ['applications.html', 'Mentor Applications'],
          ['mentors.html', 'Active Mentors'],
          ['inquiries.html', 'Inquiries'],
          ['stories.html', 'Stories'],
          ['reports.html', 'Support Reports'],
        ]
      : [
          ['profile.html', 'My Profile'],
          ['report.html', 'Support Reports'],
        ];
  if (layout) {
    const currentPage = window.location.pathname.split('/').pop();
    const aside = document.createElement('aside');
    aside.className = 'portal-sidebar';
    aside.id = 'portal-navigation';
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', `${role} navigation`);
    const list = document.createElement('ul');
    list.className = 'portal-nav';
    navItems.forEach(([href, label]) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      if (href === currentPage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      item.appendChild(link);
      list.appendChild(item);
    });
    nav.appendChild(list);
    aside.appendChild(nav);
    layout.querySelector('.portal-sidebar')?.remove();
    layout.insertBefore(aside, layout.querySelector('.portal-main'));
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
    logout.addEventListener('click', () => auth.logout('login.html'));
  }
  header.appendChild(controls);
  host.replaceChildren(header);
}
