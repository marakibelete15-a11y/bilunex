import { initLayout } from '../components/layout.js';
import { ui } from '../ui.js';

initLayout('home');
ui.checkOriginBanner();

const stepContent = [
  [
    'Share what support you are looking for',
    'A parent or guardian can send an enquiry with the student’s details, subjects, and requested support category.',
  ],
  [
    'Bilunex reviews the enquiry',
    '[To be confirmed by Bilunex: review process and expected response time.]',
  ],
  [
    'Discuss the student’s needs',
    '[To be confirmed by Bilunex: consultation process and who will contact the family.]',
  ],
  [
    'Receive next-step information',
    '[To be confirmed by Bilunex: matching, scheduling, and any fee information.]',
  ],
];

const stepTabs = [...document.querySelectorAll('.step-tab')];
const setStep = index => {
  stepTabs.forEach((tab, current) => {
    const selected = current === index;
    tab.classList.toggle('is-active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  document.getElementById('step-panel').setAttribute('aria-labelledby', stepTabs[index].id);
  document.getElementById('step-count').textContent = `Step 0${index + 1}`;
  document.getElementById('step-title').textContent = stepContent[index][0];
  document.getElementById('step-description').textContent = stepContent[index][1];
};

stepTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => setStep(index));
  tab.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? stepTabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : stepTabs.length - 1)) % stepTabs.length;
    setStep(next);
    stepTabs[next].focus();
  });
});

const growthContent = {
  academic: [
    'Academic Growth',
    'Academic support can focus on subjects and learning goals a family identifies for their student.',
  ],
  personal: [
    'Personal Growth',
    'Mentoring can provide space for guidance around a student’s personal development.',
  ],
  future: [
    'Future Readiness',
    'Mentoring may include conversations about interests and future goals.',
  ],
};
const growthTabs = [...document.querySelectorAll('.growth-tab')];
const setGrowth = tab => {
  growthTabs.forEach(item => {
    const selected = item === tab;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  const content = growthContent[tab.dataset.growth];
  document.getElementById('growth-panel').setAttribute('aria-labelledby', tab.id);
  document.getElementById('growth-panel-title').textContent = content[0];
  document.getElementById('growth-panel-copy').textContent = content[1];
};
growthTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => setGrowth(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? growthTabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : growthTabs.length - 1)) % growthTabs.length;
    setGrowth(growthTabs[next]);
    growthTabs[next].focus();
  });
});

if (
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  'IntersectionObserver' in window
) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('.home-page section:not(.home-hero)').forEach(section => {
    section.classList.add('reveal-on-scroll');
    observer.observe(section);
  });
}
