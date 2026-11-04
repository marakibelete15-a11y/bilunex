const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const normalize = source => source.replace(/\s+/g, ' ');

test('About and Home show the exact founding-story sentences and story link', () => {
  const about = normalize(read('client/public/about.html'));
  const home = normalize(read('client/public/index.html'));
  const first = 'We started Bilunex with a simple belief: every young person deserves the opportunity to learn, grow, and reach their potential, regardless of the challenges they face.';
  const last = 'Bilunex exists to connect potential with opportunity, one learner at a time.';

  assert.match(about, /<h2>Why Bilunex Began<\/h2>/);
  assert.ok(about.includes(first));
  assert.ok(about.includes(last));
  assert.ok(home.includes(first));
  assert.ok(home.includes(last));
  assert.match(home, /href="about\.html#our-story"[\s\S]*?Read our story/);
});

test('For Parents contains the 11 ordered, closed native FAQ disclosures', () => {
  const html = read('client/public/for-parents.html');
  const summaries = [...html.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map(match =>
    match[1].replace(/<[^>]+>/g, '').trim()
  );
  assert.deepEqual(summaries, [
    'Which subjects and grades can Bilunex support?',
    'How are mentors selected?',
    'What happens after I register my child?',
    'Where does Bilunex provide services?',
    'How much do Bilunex services cost?',
    "How does Bilunex help ensure my child's safety?",
    "Can parents follow their child's progress?",
    'Does Bilunex provide mentoring beyond academic subjects?',
    'How can I ask about professional counseling?',
    'What if I have a concern about a mentor or session?',
    'How do I register my child?',
  ]);
  assert.equal((html.match(/<details>/g) || []).length, 11);
  assert.equal((html.match(/<details\s+open/g) || []).length, 0);
  assert.match(html, /href="parent-registration\.html">Register Your Student<\/a>/);
  assert.ok((html.match(/href="contact\.html"/g) || []).length >= 3);
});

test('updated content pages have one H1 and do not skip heading levels', () => {
  for (const file of [
    'client/public/about.html',
    'client/public/index.html',
    'client/public/for-parents.html',
  ]) {
    const html = read(file);
    const levels = [...html.matchAll(/<h([1-6])\b/gi)].map(match => Number(match[1]));
    assert.equal(levels.filter(level => level === 1).length, 1, `${file} has one H1`);
    let previous = 0;
    for (const level of levels) {
      assert.ok(level <= previous + 1 || previous === 0, `${file} heading level ${level} follows ${previous}`);
      previous = level;
    }
  }
});
