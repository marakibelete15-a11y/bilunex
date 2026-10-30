const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '../..');
const layoutSource = fs
  .readFileSync(path.join(repoRoot, 'client/js/components/layout.js'), 'utf8')
  .replace(/^import .*;\s*$/gm, '')
  .replace(/^export /gm, '')
  .replace(/import\.meta\.url/g, "'http://localhost/js/components/layout.js'");
const layoutCss = fs.readFileSync(path.join(repoRoot, 'client/css/layout.css'), 'utf8');

function listHtmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(fullPath);
    return entry.name.endsWith('.html') ? [fullPath] : [];
  });
}

class Element {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.classList = { add: (...names) => names.forEach(name => this.classes.add(name)) };
    this.classes = new Set();
    this.firstChild = null;
    this.textContent = '';
  }

  set className(value) {
    this.classes = new Set(value.split(/\s+/).filter(Boolean));
  }

  get className() {
    return [...this.classes].join(' ');
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
    children.forEach(child => this.appendChild(child));
  }

  replaceChildren(...children) {
    this.children = children;
  }
}

function renderHeader() {
  const host = new Element('header');
  const document = {
    createElement: tagName => new Element(tagName),
    getElementById: id => (id === 'site-header' ? host : null),
  };
  const context = {
    document,
    window: { location: { pathname: '/public/index.html' } },
    ui: { initMobileNav() {} },
    auth: { logout() {} },
    console,
  };
  vm.createContext(context);
  vm.runInContext(
    `${layoutSource}\nthis.renderHeader = renderHeader; this.NAV_ITEMS = NAV_ITEMS;`,
    context
  );
  context.renderHeader('home');
  return { header: host.children[0], navItems: context.NAV_ITEMS };
}

test('shared header has one registration CTA after the seven-item nav list', () => {
  const { header, navItems } = renderHeader();
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
  const logo = header.children.find(child => child.className === 'brand-logo');
  assert.equal(logo.attributes['aria-label'], 'Bilunex home');
  assert.equal(logo.children.some(child => child.tagName === 'img'), false);
  assert.equal(logo.children[0].className, 'brand-mark-slot');
  assert.equal(logo.children[1].children[0].textContent, 'Bilunex');
  assert.equal(logo.children[1].children[1].textContent, 'Education · Growth · Opportunity');
});

test('drawer CTA is the same single element and CSS shares the hamburger breakpoint', () => {
  const { header } = renderHeader();
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
  assert.equal(desktopRule[1], '1200');
  assert.match(layoutCss, /@media\s*\(min-width:\s*1200px\)/);
});

test('footer links render as separate list items with dedicated story and mentor groups', () => {
  const host = new Element('footer');
  const document = {
    createElement: tagName => new Element(tagName),
    getElementById: id => (id === 'site-footer' ? host : null),
  };
  const context = {
    document,
    siteInfo: {
      email: 'team@example.test',
      phoneHref: '+251900000000',
      phone: '+251 90 000 0000',
      address: 'Hawassa, Ethiopia',
      telegramUrl: 'https://t.me/example',
      telegram: '@example',
    },
    makeLogo: className => {
      const logo = new Element('a');
      logo.className = className;
      return logo;
    },
  };
  vm.createContext(context);
  vm.runInContext(
    `${layoutSource}\nthis.renderFooter = renderFooter; this.NAV_ITEMS = NAV_ITEMS;`,
    context
  );
  context.renderFooter();
  const footer = host.children[0];
  const all = [];
  const visit = node => {
    if (node.tagName === 'a') all.push(node);
    node.children?.forEach(child => {
      if (typeof child === 'object') visit(child);
    });
  };
  visit(footer);
  const quickLinks = footer.children[0].children.find(child => child.children.some(item => item.textContent === 'Quick links'));
  const quickList = quickLinks.children.find(child => child.className === 'footer-nav-list');
  const mentorGroup = footer.children[0].children.find(child => child.className === 'footer-col footer-mentors');
  const mentorList = mentorGroup.children.find(child => child.className === 'footer-nav-list');

  assert.equal(quickList.children.length, 8, 'seven nav links and Share Your Story are list items');
  assert.equal(quickList.children.at(-1).children[0].textContent, 'Share Your Story');
  assert.equal(mentorList.children.length, 1);
  assert.equal(mentorList.children[0].children[0].textContent, 'Mentor portal login');
  const listLinks = [];
  const collectListItems = node => {
    if (node.tagName === 'li') {
      listLinks.push(...node.children.filter(child => child.tagName === 'a'));
    }
    node.children?.forEach(child => {
      if (typeof child === 'object') collectListItems(child);
    });
  };
  collectListItems(footer);
  assert.equal(
    listLinks.length,
    all.filter(link => link.className !== 'footer-logo').length,
    'every footer text link is inside its own list item'
  );
  assert.equal(all.filter(link => link.textContent === 'Share Your Story').length, 1);
  assert.equal(all.filter(link => link.textContent === 'Mentor portal login').length, 1);
});

test('logo uses one inline SVG source and shared size tokens without per-page overrides', () => {
  const logoAsset = fs.readFileSync(
    path.join(repoRoot, 'client/assets/images/logo-mark.svg'),
    'utf8'
  );
  const faviconSvg = fs.readFileSync(
    path.join(repoRoot, 'client/assets/images/favicon.svg'),
    'utf8'
  );
  const layoutJs = fs.readFileSync(path.join(repoRoot, 'client/js/components/layout.js'), 'utf8');
  const logoStyles = layoutCss.match(/[^{}]*brand-logo[^{}]*\{[^{}]*\}/g) || [];

  assert.match(layoutJs, /assets\/images\/logo-mark\.svg/);
  assert.doesNotMatch(layoutJs, /assets\/images\/logo\.svg|createElement\(['"]img['"]\)/);
  assert.match(logoAsset, /<path[^>]+class="logo-letter"/);
  assert.match(logoAsset, /[CQ][^"']+/);
  assert.doesNotMatch(logoAsset, /<image\b|<text\b|href="https?:/);
  assert.match(logoAsset, /<linearGradient id="bilunex-gold"/);
  assert.match(logoAsset, /<symbol id="bilunex-favicon-symbol"/);
  assert.match(faviconSvg, /logo-mark\.svg#bilunex-favicon-symbol/);
  assert.match(logoAsset, /@keyframes bilunex-ring-draw/);
  assert.match(logoAsset, /prefers-reduced-motion:\s*reduce/);
  assert.equal((layoutCss.match(/--brand-mark-size\s*:/g) || []).length, 2);
  assert.equal((layoutCss.match(/--brand-mark-size-compact\s*:/g) || []).length, 1);
  assert.equal((layoutCss.match(/--brand-login-mark-size\s*:/g) || []).length, 1);
  assert.match(layoutCss, /@media\s*\(max-width:\s*479px\)[\s\S]*?--brand-mark-size:\s*var\(--brand-mark-size-compact\)/);
  listHtmlFiles(path.join(repoRoot, 'client')).forEach(file => {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /--brand-mark-size|\.brand-logo\s*\{/);
  });
  assert.equal(logoStyles.some(rule => /img/.test(rule)), false);
  assert.match(layoutJs, /uniqueId = `\$\{originalId\}-\$\{index \+ 1\}`/);
  assert.equal(fs.existsSync(path.join(repoRoot, 'client/assets/images/logo.svg')), false);
});

test('every HTML page links the SVG, PNG, Apple touch, and ICO favicon assets', () => {
  const htmlFiles = listHtmlFiles(path.join(repoRoot, 'client'));
  assert.ok(htmlFiles.length > 0);
  htmlFiles.forEach(file => {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /rel="icon" type="image\/svg\+xml" href="\.\.\/assets\/images\/favicon\.svg"/);
    assert.match(source, /sizes="32x32" href="\.\.\/assets\/images\/favicon-32\.png"/);
    assert.match(source, /rel="apple-touch-icon" sizes="180x180" href="\.\.\/assets\/images\/apple-touch-icon\.png"/);
    assert.match(source, /rel="shortcut icon" href="\.\.\/assets\/images\/favicon\.ico"/);
  });
  [
    'favicon.svg',
    'favicon-32.png',
    'apple-touch-icon.png',
    'favicon.ico',
  ].forEach(asset => {
    assert.ok(fs.existsSync(path.join(repoRoot, 'client/assets/images', asset)), `${asset} exists`);
  });
  const pngDimensions = name => {
    const bytes = fs.readFileSync(path.join(repoRoot, 'client/assets/images', name));
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  };
  assert.deepEqual(pngDimensions('favicon-32.png'), [32, 32]);
  assert.deepEqual(pngDimensions('apple-touch-icon.png'), [180, 180]);
});
