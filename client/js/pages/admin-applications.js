import { api } from '../api.js';
import {
  setupAdmin,
  el,
  cell,
  table,
  message,
  paginationControls,
  loadList,
  dateText,
  statusBadge,
} from './admin-common.js';

if (setupAdmin()) {
  const form = document.getElementById('filters');
  const metricsHost = document.getElementById('application-metrics');
  const tableHost = document.getElementById('applications-table');
  const listStateHost = document.getElementById('list-state');
  const paginationHost = document.getElementById('pagination');

  // Modal elements
  const modal = document.getElementById('application-modal');
  const modalBody = document.getElementById('app-modal-body-content');
  const modalCloseBtn = document.getElementById('app-modal-close-btn');
  const modalCancelBtn = document.getElementById('app-modal-cancel-btn');

  let page = 1;

  function closeModal() {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  async function loadMetrics() {
    try {
      const { data } = await api.get('/admin/reports/summary');
      const items = data.mentor_applications || [];
      const total = items.reduce((sum, cur) => sum + Number(cur.count || 0), 0);
      const getCount = st => items.find(i => i.status === st)?.count || 0;
      const activeMentors = data.active_mentors || 0;

      metricsHost.replaceChildren();

      const makeCard = (title, count, subtext) => {
        const card = el('div', null, 'metric-card');
        const header = el('div', null, 'metric-card-header');
        header.append(el('span', title, 'metric-card-title'));
        const val = el('div', count, 'metric-card-value');
        const sub = el('div', subtext, 'metric-card-sub');
        card.append(header, val, sub);
        return card;
      };

      metricsHost.append(
        makeCard('Total Candidates', total, 'All submitted applications'),
        makeCard(
          'Under Review',
          getCount('under_review') + getCount('application_received'),
          'Pending evaluation'
        ),
        makeCard('Interview Stage', getCount('interview_stage'), 'Shortlisted for interview'),
        makeCard(
          'Accepted / Onboarding',
          getCount('accepted') + getCount('onboarding'),
          `Active mentors: ${activeMentors}`
        )
      );
    } catch {
      // Absorb metrics load failure
    }
  }

  function openDetailsModal(item) {
    modalBody.replaceChildren();

    const dl = el('dl', null, 'portal-detail-grid');

    const addField = (label, val) => {
      const box = el('div', null, 'portal-detail-box');
      box.append(
        el('dt', label, 'portal-detail-label'),
        el('dd', val != null && val !== '' ? String(val) : '—', 'portal-detail-value')
      );
      dl.append(box);
    };

    addField('Full Name', item.full_name);
    addField('Email Address', item.email);
    addField('Phone Number', item.phone);
    addField(
      'Telegram Handle',
      item.telegram_handle ? `@${item.telegram_handle.replace(/^@/, '')}` : null
    );
    addField('University', item.university);
    addField('Campus', item.campus);
    addField('Field of Study', item.field_of_study);
    addField('Academic Year', item.academic_year);
    addField('CGPA', item.cgpa);
    addField(
      'Entrance Stream',
      item.entrance_exam_stream ? item.entrance_exam_stream.replace(/_/g, ' ') : null
    );
    addField('Entrance Exam Result', item.entrance_exam_result);
    addField(
      'Teaching Experience',
      item.has_teaching_experience
        ? `Yes (${item.teaching_experience_duration || 'details below'})`
        : 'No'
    );
    addField(
      'Subjects Offered',
      Array.isArray(item.subjects) ? item.subjects.join(', ') : item.subjects
    );
    addField(
      'Available Days',
      Array.isArray(item.available_days) ? item.available_days.join(', ') : item.available_days
    );
    addField(
      'Available Hours',
      Array.isArray(item.available_hours) ? item.available_hours.join(', ') : item.available_hours
    );
    addField('Referral Source', item.referral_source);
    addField('Current Pipeline Status', item.status);
    addField('Applied Date', dateText(item.created_at));

    const expSection = el('div', null, 'portal-notes-section');
    expSection.append(
      el('h3', 'Experience Details', 'portal-section-title'),
      el(
        'p',
        item.experience_details || 'No additional experience details submitted.',
        'portal-notes-content'
      )
    );

    const motivationSection = el('div', null, 'portal-notes-section');
    motivationSection.append(
      el('h3', 'Motivation & Statement of Intent', 'portal-section-title'),
      el('p', item.motivation || 'No motivation statement provided.', 'portal-notes-content')
    );

    // Document downloads
    const docsSection = el('div', null, 'portal-notes-section');
    docsSection.append(el('h3', 'Verified Documents & Transcripts', 'portal-section-title'));
    if (Array.isArray(item.documents) && item.documents.length) {
      const docList = el('ul');
      item.documents.forEach(doc => {
        const li = el('li');
        const docLink = el('a', `${doc.document_type}: ${doc.original_filename || 'Download'}`);
        docLink.href = `/api/v1/admin/documents/${doc.id}/download`;
        docLink.target = '_blank';
        docLink.rel = 'noopener noreferrer';
        li.append(docLink);
        docList.append(li);
      });
      docsSection.append(docList);
    } else {
      docsSection.append(
        el('p', 'No uploaded documents attached to this application.', 'portal-notes-content')
      );
    }

    // Status transition controls
    const statusSection = el('div', null, 'portal-status-section');
    statusSection.append(el('h3', 'Advance Recruitment Pipeline Stage', 'portal-section-title'));

    const btnGroup = el('div', null, 'portal-btn-group');

    const pipelineStages = [
      ['application_received', 'Received'],
      ['under_review', 'Under Review'],
      ['interview_stage', 'Interview Stage'],
      ['accepted', 'Accept Candidate'],
      ['rejected', 'Reject Candidate'],
    ];

    pipelineStages.forEach(([st, label]) => {
      const btn = el('button', label, 'btn btn-sm');
      if (item.status === st) {
        btn.classList.add('btn-primary');
        btn.disabled = true;
      } else {
        btn.classList.add('btn-outline');
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            await api.patch(`/admin/mentor-applications/${item.id}/status`, { status: st });
            closeModal();
            refresh();
            loadMetrics();
          } catch (err) {
            message(listStateHost, err.message, 'error');
            btn.disabled = false;
          }
        });
      }
      btnGroup.append(btn);
    });

    statusSection.append(btnGroup);

    // If accepted, show Account Activation section
    let activationSection = null;
    if (item.status === 'accepted' || item.status === 'onboarding') {
      activationSection = el('div', null, 'portal-activation-card');
      activationSection.append(
        el('h3', 'Mentor Account Activation (ACID Transaction)', 'portal-activation-title'),
        el(
          'p',
          'Activate this screened mentor account to grant login access to the Mentor Portal.',
          'portal-activation-sub'
        )
      );

      const activateBtn = el('button', 'Activate Mentor Account Now', 'btn btn-primary btn-sm');
      activateBtn.style.marginTop = '0.5rem';
      activateBtn.addEventListener('click', async () => {
        activateBtn.disabled = true;
        try {
          await api.post(`/admin/mentor-applications/${item.id}/activate`, {});
          closeModal();
          refresh();
          loadMetrics();
        } catch (err) {
          message(listStateHost, err.message, 'error');
          activateBtn.disabled = false;
        }
      });
      activationSection.append(activateBtn);
    }

    modalBody.append(dl, expSection, motivationSection, docsSection, statusSection);
    if (activationSection) modalBody.append(activationSection);

    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
  }

  const refresh = () =>
    loadList({
      endpoint: '/admin/mentor-applications',
      params: {
        page,
        limit: 20,
        status: form.elements.status.value,
      },
      key: 'applications',
      statusHost: listStateHost,
      render: (items, p) => {
        const needle = (form.elements.search.value || '').toLowerCase();
        items = items.filter(item =>
          [
            item.full_name,
            item.email,
            item.phone,
            item.telegram_handle,
            item.university,
            item.campus,
            item.field_of_study,
            item.academic_year,
            item.status,
          ].some(val =>
            String(val || '')
              .toLowerCase()
              .includes(needle)
          )
        );

        const rows = items.map(item => {
          const row = document.createElement('tr');

          // 1. ID
          row.append(cell(item.id));

          // 2. Candidate Name (+ email below)
          const nameTd = document.createElement('td');
          nameTd.append(el('div', item.full_name || '—', 'font-semibold'));
          if (item.email) {
            nameTd.append(el('div', item.email, 'text-xs text-subtle'));
          }
          row.append(nameTd);

          // 3. University & Campus
          const uniTd = document.createElement('td');
          uniTd.append(el('div', item.university || '—', 'font-medium'));
          if (item.campus) {
            uniTd.append(el('div', item.campus, 'text-xs text-subtle'));
          }
          row.append(uniTd);

          // 4. Field & Year
          const fieldTd = document.createElement('td');
          fieldTd.append(el('div', item.field_of_study || '—', 'font-medium'));
          fieldTd.append(el('div', `Year: ${item.academic_year || '—'}`, 'text-xs text-subtle'));
          row.append(fieldTd);

          // 5. Subjects Offered (badges)
          const subjectsTd = document.createElement('td');
          const subs = Array.isArray(item.subjects) ? item.subjects : [];
          if (subs.length) {
            const tagWrap = el('div', null, 'subject-tags');
            subs.forEach(s => tagWrap.append(el('span', s, 'subject-tag')));
            subjectsTd.append(tagWrap);
          } else {
            subjectsTd.append(el('span', 'General', 'text-subtle'));
          }
          row.append(subjectsTd);

          // 6. Academic Score (CGPA & Exam Result)
          const scoreTd = document.createElement('td');
          if (item.cgpa) {
            scoreTd.append(el('div', `CGPA: ${item.cgpa}`, 'font-medium'));
          }
          if (item.entrance_exam_result) {
            scoreTd.append(el('div', `Exam: ${item.entrance_exam_result}`, 'text-xs text-subtle'));
          }
          if (!item.cgpa && !item.entrance_exam_result) {
            scoreTd.append(el('span', '—', 'text-subtle'));
          }
          row.append(scoreTd);

          // 7. Availability
          const availTd = document.createElement('td');
          const availText =
            item.availability ||
            (Array.isArray(item.available_days) && item.available_days.length
              ? item.available_days.join(', ')
              : 'Flexible');
          availTd.append(el('span', availText));
          row.append(availTd);

          // 8. Phone / Telegram
          const contactTd = document.createElement('td');
          contactTd.append(el('div', item.phone || '—', 'font-medium'));
          if (item.telegram_handle) {
            const handle = item.telegram_handle.startsWith('@')
              ? item.telegram_handle
              : `@${item.telegram_handle}`;
            contactTd.append(el('div', handle, 'text-xs text-subtle'));
          }
          row.append(contactTd);

          // 9. Teaching Experience
          const expTd = document.createElement('td');
          if (item.has_teaching_experience) {
            expTd.append(
              el('span', item.teaching_experience_duration || 'Yes', 'status-badge status-active')
            );
          } else {
            expTd.append(el('span', 'None', 'text-subtle'));
          }
          row.append(expTd);

          // 10. Pipeline Status
          const statusTd = document.createElement('td');
          statusTd.append(statusBadge(item.status));
          row.append(statusTd);

          // 11. Applied Date
          row.append(cell(dateText(item.created_at)));

          // 12. Actions
          const actionTd = document.createElement('td');
          const reviewBtn = el('button', 'Review Credentials', 'btn btn-outline btn-sm');
          reviewBtn.type = 'button';
          reviewBtn.addEventListener('click', () => openDetailsModal(item));
          actionTd.append(reviewBtn);
          row.append(actionTd);

          return row;
        });

        table(
          tableHost,
          [
            'ID',
            'Candidate Name',
            'University & Campus',
            'Field & Year',
            'Subjects Offered',
            'Academic Score',
            'Availability',
            'Phone / Telegram',
            'Teaching Exp.',
            'Pipeline Status',
            'Applied',
            'Actions',
          ],
          rows,
          'No mentor applications found matching your criteria.'
        );

        paginationControls(paginationHost, p.page, p.totalPages, next => {
          page = next;
          refresh();
        });
      },
    });

  form.addEventListener('submit', e => {
    e.preventDefault();
    page = 1;
    refresh();
  });

  document.getElementById('reset-filters').addEventListener('click', () => {
    form.reset();
    page = 1;
    refresh();
  });

  loadMetrics();
  refresh();
}
