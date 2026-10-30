const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { globSync } = require('node:fs');

const repoRoot = path.resolve(__dirname, '../..');
const layoutSource = fs
  .readFileSync(path.join(repoRoot, 'client/js/components/layout.js'), 'utf8')
  .replace(/^import .*;\s*$/gm, '')
  .replace(/^export /gm, '');
const layoutCss = fs.readFileSync(path.join(repoRoot, 'client/css/layout.css'), 'utf8');
const pageCss = fs.readFileSync(path.join(repoRoot, 'client/css/pages.css'), 'utf8');
const componentCss = fs.readFileSync(path.join(repoRoot, 'client/css/components.css'), 'utf8');

class Element {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.classList = {
      add: (...names) => names.forEach(name => this.classes.add(name)),
      toggle: (name, force) => {
        const shouldAdd = force ?? !this.classes.has(name);
        if (shouldAdd) this.classes.add(name);
        else this.classes.delete(name);
        return shouldAdd;
      },
    };
    this.classes = new Set();
    this.firstChild = null;
    this._textContent = '';
    this.id = '';
  }

  set className(value) {
    this.classes = new Set(value.split(/\s+/).filter(Boolean));
  }

  get className() {
    return [...this.classes].join(' ');
  }

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  get textContent() {
    return this._textContent + this.children.map(child => child.textContent).join('');
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  appendChild(child) {
    this.children.push(child);
    this.firstChild ??= child;
    return child;
  }

  append(...children) {
    children.forEach(child =>
      this.appendChild(
        typeof child === 'string' ? Object.assign(new Element('#text'), { _textContent: child }) : child
      )
    );
  }

  replaceChildren(...children) {
    this.children = children;
  }
}

function renderLayout() {
  const host = new Element('header');
  const bannerHost = new Element('div');
  const footerHost = new Element('footer');
  bannerHost.id = 'site-brand-banner';
  footerHost.id = 'site-footer';
  const hosts = {
    'site-header': host,
    'site-brand-banner': bannerHost,
    'site-footer': footerHost,
  };
  const document = {
    createElement: tagName => new Element(tagName),
    createElementNS: (_namespace, tagName) => new Element(tagName),
    getElementById: id => hosts[id] || null,
  };
  const context = {
    document,
    window: { location: { pathname: '/public/index.html' } },
    ui: { initMobileNav() {} },
    auth: { logout() {} },
    siteInfo: {
      email: 'hello@example.test',
      phoneHref: '+251900000000',
      phone: '+251 90 000 0000',
      telegramUrl: 'https://t.me/example',
      telegram: '@example',
      address: 'Hawassa, Ethiopia',
    },
    console,
  };
  vm.createContext(context);
  vm.runInContext(
    `${layoutSource}\nthis.renderHeader = renderHeader; this.renderBrandBanner = renderBrandBanner; this.renderFooter = renderFooter; this.NAV_ITEMS = NAV_ITEMS;`,
    context
  );
  context.renderHeader('home');
  context.renderFooter();
  return {
    header: host.children[0],
    banner: bannerHost.children[0],
    footer: footerHost.children[0],
    navItems: context.NAV_ITEMS,
  };
}

function descendants(node) {
  return [node, ...node.children.flatMap(descendants)];
}

function byClass(node, className) {
  return descendants(node).find(child => child.className.split(/\s+/).includes(className));
}

test('shared header has one registration CTA after the seven-item nav list', () => {
  const { header, navItems } = renderLayout();
  const nav = header.children.find(child => child.id === 'primary-nav');
  const navList = nav.children.find(child => child.className === 'nav-list');
  const ctas = nav.children.filter(child => child.textContent.trim() === 'Register Your Student');
  const allHeaderCtas = [...header.children, ...nav.children].filter(
    child => child.textContent.trim() === 'Register Your Student'
  );

  assert.equal(navItems.length, 7);
  assert.deepEqual(
    Array.from(navItems, item => item.label),
    [
      'Home',
      'About Us',
      'Services',
      'For Parents',
      'Become a Mentor',
      'Stories & Resources',
      'Contact Us',
    ]
  );
  assert.equal(nav.className, 'primary-nav header-actions');
  assert.equal(ctas.length, 1, 'header actions contain exactly one CTA');
  assert.equal(allHeaderCtas.length, 1, 'the rendered header contains exactly one CTA total');
  assert.equal(
    navList.children.some(item => item.textContent.trim() === 'Register Your Student'),
    false
  );
  assert.equal(
    nav.children.filter(child => child.className === 'btn btn-accent nav-register-cta').length,
    1
  );
  assert.equal(ctas[0].href, 'parent-registration.html');
});

test('drawer CTA is the same single element and CSS shares the hamburger breakpoint', () => {
  const { header } = renderLayout();
  const nav = header.children.find(child => child.id === 'primary-nav');
  const cta = nav.children.find(child => child.className.includes('nav-register-cta'));
  const desktopRule = layoutCss.match(/@media\s*\(min-width:\s*(1200)px\)\s*\{/);
  const desktopStyles = desktopRule
    ? layoutCss.slice(
        desktopRule.index,
        layoutCss.indexOf('/* Main Content Wrapper */', desktopRule.index)
      )
    : '';

  assert.ok(
    cta,
    'one CTA is placed in the drawer after the nav list and doubles as desktop header action'
  );
  assert.match(layoutCss, /\.primary-nav\s*\{[^}]*display:\s*none;/);
  assert.match(layoutCss, /\.primary-nav\.is-open\s*\{\s*display:\s*flex;/);
  assert.ok(desktopRule, 'desktop breakpoint exists');
  assert.match(desktopStyles, /\.nav-toggle\s*\{\s*display:\s*none;/);
  assert.match(desktopStyles, /\.primary-nav\s*\{\s*display:\s*flex;/);
  assert.match(desktopStyles, /\.nav-register-cta\s*\{/);
  assert.match(desktopStyles, /\.primary-nav\s*\{[^}]*justify-content:\s*space-between/s);
  assert.equal(desktopRule[1], '1200');
  assert.match(layoutCss, /@media\s*\(min-width:\s*1200px\)/);
});

test('shared banner is one accessible code-built SVG lockup with no raster image', () => {
  const { banner } = renderLayout();
  const bannerNodes = descendants(banner);
  const lockup = byClass(banner, 'brand-lockup');

  assert.ok(banner, 'shared component renders the brand banner');
  assert.equal(bannerNodes.filter(node => node.tagName === 'img').length, 0);
  assert.ok(lockup, 'one linked brand lockup is rendered');
  assert.equal(lockup.attributes['aria-label'], 'Bilunex home');
  assert.equal(lockup.children.find(node => node.tagName === 'svg').attributes['aria-hidden'], 'true');
  assert.equal(
    bannerNodes.filter(node => node.className === 'brand-wordmark').length,
    1
  );
  assert.equal(
    bannerNodes.find(node => node.className === 'brand-wordmark').textContent,
    'Bilunex'
  );
  assert.equal(
    bannerNodes.find(node => node.className === 'brand-tagline').textContent,
    'EDUCATION · GROWTH · OPPORTUNITY'
  );
  assert.equal(
    lockup.children.find(node => node.tagName === 'svg').children[0].attributes.href,
    '../assets/images/logo-mark.svg',
    'the single external mark file can be replaced without changing the component'
  );
});

test('every public HTML page mounts the single shared banner above its sticky navigation', () => {
  const publicPages = globSync('client/public/*.html', { cwd: repoRoot });

  assert.equal(publicPages.length, 9);
  publicPages.forEach(page => {
    const html = fs.readFileSync(path.join(repoRoot, page), 'utf8');
    assert.equal((html.match(/id="site-brand-banner"/g) || []).length, 1, page);
    assert.ok(
      html.indexOf('id="site-brand-banner"') < html.indexOf('id="site-header"'),
      `${page} places the brand banner before sticky navigation`
    );
  });
  for (const page of ['client/admin/login.html', 'client/mentor/login.html']) {
    const html = fs.readFileSync(path.join(repoRoot, page), 'utf8');
    assert.equal((html.match(/id="portal-brand-banner"/g) || []).length, 1, page);
    assert.ok(html.indexOf('id="portal-brand-banner"') < html.indexOf('id="portal-header"'));
  }
});

test('footer quick, mentor, and contact links are separate list items', () => {
  const { footer } = renderLayout();
  const lists = descendants(footer).filter(node => node.tagName === 'ul');
  const listItems = lists.flatMap(list => list.children);
  const listText = listItems.map(item => item.textContent.trim());
  const anchors = descendants(footer).filter(node => node.tagName === 'a');
  const listedAnchors = descendants(footer)
    .filter(node => node.tagName === 'li')
    .flatMap(item => descendants(item).filter(child => child.tagName === 'a'));

  assert.ok(listText.includes('Share Your Story'));
  assert.ok(listText.includes('Mentor portal login'));
  assert.equal(anchors.length - 1, listedAnchors.length, 'only the footer brand link sits outside a list');
  assert.equal(byClass(footer, 'footer-mentor-group').children[0].textContent, 'For mentors');
  assert.equal(byClass(footer, 'footer-brand').children[0].children[1].children[1].textContent,
    'EDUCATION · GROWTH · OPPORTUNITY');
});

test('banner size is controlled only by the shared CSS tokens', () => {
  const styles = globSync('client/**/*.css', { cwd: repoRoot });
  const tokenDeclarations = /--brand-banner-height\s*:/g;
  const declaringFiles = styles.filter(file =>
    tokenDeclarations.test(fs.readFileSync(path.join(repoRoot, file), 'utf8'))
  );
  const declarations = layoutCss.match(tokenDeclarations) || [];

  assert.deepEqual(declaringFiles, ['client/css/layout.css']);
  assert.equal(declarations.length, 3, 'one value per responsive breakpoint');
  assert.match(layoutCss, /\.brand-banner\s*\{[^}]*height:\s*var\(--brand-banner-height\)/s);
  assert.match(layoutCss, /@media\s*\(max-width:\s*1199px\)[\s\S]*?--brand-banner-height:\s*88px/);
  assert.match(layoutCss, /@media\s*\(max-width:\s*767px\)[\s\S]*?--brand-banner-height:\s*72px/);
  assert.match(layoutCss, /@media\s*\(max-width:\s*360px\)[\s\S]*?\.brand-banner \.brand-tagline\s*\{[^}]*display:\s*none/s);
  assert.doesNotMatch(pageCss + componentCss, /brand-banner|brand-banner-height/);
  for (const file of globSync('client/**/*.html', { cwd: repoRoot })) {
    const html = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    assert.doesNotMatch(html, /style\s*=\s*['"][^'"]*(?:brand-banner|height\s*:)/i, file);
  }
});

test('footer colors keep all text and links at WCAG AA contrast on navy', () => {
  const luminance = hex => {
    const channels = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255);
    const linear = channels.map(value =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const contrast = (foreground, background) => {
    const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
  };
  const footerColors = ['#cbd5e1', '#e2e8f0', '#94a3b8', '#f0d08e', '#e5d5a9', '#ffffff'];

  footerColors.forEach(color => {
    assert.ok(contrast(color, '#0b1329') >= 4.5, `${color} must pass WCAG AA on the footer navy`);
  });
  assert.match(layoutCss, /\.footer-nav-list a\s*\{[^}]*min-height:\s*2\.75rem/s);
  assert.match(layoutCss, /\.footer-bottom\s*\{[^}]*color:\s*#cbd5e1/s);
});

test('all client page heads include the SVG mark favicon', () => {
  for (const file of globSync('client/**/*.html', { cwd: repoRoot })) {
    const html = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    assert.match(html, /rel="icon" type="image\/svg\+xml" href="\.\.\/assets\/images\/favicon\.svg"/, file);
    assert.match(html, /favicon-32\.png/, file);
    assert.match(html, /apple-touch-icon\.png/, file);
  }
  assert.equal(fs.readlinkSync(path.join(repoRoot, 'client/assets/images/favicon.svg')), 'logo-mark.svg');
  const markSvg = fs.readFileSync(path.join(repoRoot, 'client/assets/images/logo-mark.svg'), 'utf8');
  assert.match(markSvg, /<symbol id="bilunex-mark"/, 'the one source SVG exposes the reusable monogram symbol');
  assert.match(markSvg, /prefers-reduced-motion: reduce[\s\S]*?\.mark-shine \{ animation: none; opacity: 0;/);
});
