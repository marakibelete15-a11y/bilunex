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
    // Status transition controls with immediate saving
    const statusSection = el('div', null, 'portal-status-section');
    statusSection.append(el('h3', 'Recruitment Pipeline Status', 'portal-section-title'));

    const statusFormGroup = el('div', null, 'status-form-group');
    statusFormGroup.style.display = 'flex';
    statusFormGroup.style.alignItems = 'center';
    statusFormGroup.style.gap = '0.75rem';
    statusFormGroup.style.marginTop = '0.5rem';

    const statusSelect = el('select', null, 'form-control');
    const stages = [
      ['application_received', 'Application received'],
      ['under_review', 'Under review'],
      ['interview_stage', 'Interview stage'],
      ['accepted', 'Accepted'],
      ['rejected', 'Rejected'],
      ['onboarding', 'Onboarding'],
    ];

    stages.forEach(([val, label]) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = label;
      if (item.status === val) opt.selected = true;
      statusSelect.append(opt);
    });

    const statusFeedback = el('span', '', 'text-sm text-subtle');

    statusSelect.addEventListener('change', async e => {
      const newStatus = e.target.value;
      statusFeedback.textContent = 'Saving…';
      try {
        await api.patch(`/admin/mentor-applications/${item.id}/status`, { status: newStatus });
        item.status = newStatus;
        statusFeedback.textContent = 'Saved immediately.';
        refresh();
        loadMetrics();
        // Update modal activation section visibility dynamically
        if (activationContainer) {
          activationContainer.replaceChildren();
          if (newStatus === 'accepted') {
            activationContainer.append(buildActivationSection());
          }
        }
      } catch (err) {
        statusFeedback.textContent = err.message || 'Failed to update status';
        statusSelect.value = item.status;
      }
    });

    statusFormGroup.append(statusSelect, statusFeedback);
    statusSection.append(statusFormGroup);

    // If accepted, show Account Activation section
    const activationContainer = el('div');
    const buildActivationSection = () => {
      const section = el('div', null, 'portal-activation-card card');
      section.style.background = '#f0fdf4';
      section.style.borderColor = '#86efac';
      section.style.marginTop = '1rem';
      section.style.padding = '1rem';

      section.append(
        el('h3', 'Activate Mentor Account', 'portal-activation-title'),
        el(
          'p',
          'Candidate has been accepted. Provision their mentor login credentials to grant portal access.',
          'portal-activation-sub'
        )
      );

      const activateBtn = el('button', 'Activate mentor account', 'btn btn-primary btn-sm');
      activateBtn.style.marginTop = '0.5rem';
      const activateMsg = el('p', '', 'text-sm');
      activateMsg.style.marginTop = '0.5rem';

      activateBtn.addEventListener('click', async () => {
        activateBtn.disabled = true;
        activateMsg.textContent = 'Provisioning credentials…';
        try {
          const res = await api.post(`/admin/mentor-applications/${item.id}/activate`, {});
          activateMsg.style.color = '#15803d';
          activateMsg.textContent = `Mentor account activated! Status is now Onboarding. Email: ${item.email}`;
          item.status = 'onboarding';
          statusSelect.value = 'onboarding';
          refresh();
          loadMetrics();
          setTimeout(() => {
            activationContainer.replaceChildren();
          }, 3000);
        } catch (err) {
          activateMsg.style.color = '#b91c1c';
          activateMsg.textContent = err.message || 'Failed to activate mentor account';
          activateBtn.disabled = false;
        }
      });
      section.append(activateBtn, activateMsg);
      return section;
    };

    if (item.status === 'accepted') {
      activationContainer.append(buildActivationSection());
    }

    modalBody.append(
      dl,
      expSection,
      motivationSection,
      docsSection,
      statusSection,
      activationContainer
    );

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
          row.style.cursor = 'pointer';
          row.addEventListener('click', e => {
            if (e.target.closest('button') || e.target.closest('select')) return;
            openDetailsModal(item);
          });

          // 1. Full name
          const nameTd = document.createElement('td');
          nameTd.append(el('span', item.full_name || '—', 'font-semibold'));
          row.append(nameTd);

          // 2. University
          row.append(cell(item.university || '—'));

          // 3. Field of study
          row.append(cell(item.field_of_study || '—'));

          // 4. Year
          row.append(cell(item.academic_year || item.year || '—'));

          // 5. Subjects
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

          // 6. Status (dropdown with 6 statuses saving immediately)
          const statusTd = document.createElement('td');
          const rowSelect = el('select', null, 'status-select');
          rowSelect.style.padding = '0.25rem 0.5rem';
          rowSelect.style.fontSize = '0.85rem';
          rowSelect.style.borderRadius = '0.375rem';
          rowSelect.style.border = '1px solid #cbd5e1';

          const stageOptions = [
            ['application_received', 'Application received'],
            ['under_review', 'Under review'],
            ['interview_stage', 'Interview stage'],
            ['accepted', 'Accepted'],
            ['rejected', 'Rejected'],
            ['onboarding', 'Onboarding'],
          ];

          stageOptions.forEach(([val, label]) => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = label;
            if (item.status === val) opt.selected = true;
            rowSelect.append(opt);
          });

          rowSelect.addEventListener('change', async e => {
            const newStatus = e.target.value;
            try {
              await api.patch(`/admin/mentor-applications/${item.id}/status`, {
                status: newStatus,
              });
              item.status = newStatus;
              refresh();
              loadMetrics();
            } catch (err) {
              message(listStateHost, err.message, 'error');
              rowSelect.value = item.status;
            }
          });

          statusTd.append(rowSelect);
          row.append(statusTd);

          // 7. Date submitted
          row.append(cell(dateText(item.created_at)));

          // 8. Actions
          const actionTd = document.createElement('td');
          const reviewBtn = el('button', 'Review', 'btn btn-outline btn-sm');
          reviewBtn.type = 'button';
          reviewBtn.addEventListener('click', () => openDetailsModal(item));
          actionTd.append(reviewBtn);
          row.append(actionTd);

          return row;
        });

        table(
          tableHost,
          [
            'Full name',
            'University',
            'Field of study',
            'Year',
            'Subjects',
            'Status',
            'Date submitted',
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
