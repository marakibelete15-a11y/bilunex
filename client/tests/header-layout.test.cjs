const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '../..');
const layoutSource = fs
  .readFileSync(path.join(repoRoot, 'client/js/components/layout.js'), 'utf8')
  .replace(/^import .*;\s*$/gm, '')
  .replace(/^export /gm, '');
const layoutCss = fs.readFileSync(path.join(repoRoot, 'client/css/layout.css'), 'utf8');

class Element {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
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
    createElementNS: (_namespace, tagName) => new Element(tagName),
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
