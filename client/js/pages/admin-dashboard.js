import { api } from '../api.js';
import {
  setupAdmin,
  el,
  cell,
  table,
  message,
  statusBadge,
  dateText,
  paginationControls,
} from './admin-common.js';

if (setupAdmin()) {
  const summaryHost = document.getElementById('dashboard-state');
  const eventsStateHost = document.getElementById('events-state');
  const eventsTableHost = document.getElementById('events-table');
  const eventsPaginationHost = document.getElementById('events-pagination');
  const filterForm = document.getElementById('events-filter-form');
  const refreshBtn = document.getElementById('events-refresh-btn');

  let eventPage = 1;

  async function loadSummary() {
    try {
      message(summaryHost, 'Loading operational summary…');
      const { data } = await api.get('/admin/reports/summary');

      const parentList = data.parent_registrations || [];
      const parentTotal = parentList.reduce((acc, cur) => acc + Number(cur.count || 0), 0);
      const parentBreakdown =
        parentList.map(item => `${item.status}: ${item.count}`).join(' · ') || 'No records';

      const mentorList = data.mentor_applications || [];
      const mentorTotal = mentorList.reduce((acc, cur) => acc + Number(cur.count || 0), 0);
      const activeMentors = data.active_mentors || 0;
      const mentorBreakdown =
        mentorList.map(item => `${item.status.replace(/_/g, ' ')}: ${item.count}`).join(' · ') ||
        'No applications';

      const inquiryList = data.inquiries || [];
      const inquiryTotal = inquiryList.reduce((acc, cur) => acc + Number(cur.count || 0), 0);
      const inquiryBreakdown =
        inquiryList.map(item => `${item.status}: ${item.count}`).join(' · ') || 'No inquiries';

      const storyList = data.stories || [];
      const storyTotal = storyList.reduce((acc, cur) => acc + Number(cur.count || 0), 0);
      const pendingStories = data.pending_stories ?? 0;

      const supportReportsTotal = data.support_reports_count ?? 0;

      const grid = document.getElementById('summary-cards');
      grid.className = 'portal-metrics-grid';
      grid.replaceChildren();

      const createMetricCard = (title, count, subtext, linkHref, linkText) => {
        const card = el('div', null, 'metric-card');
        const header = el('div', null, 'metric-card-header');
        header.append(el('span', title, 'metric-card-title'));
        const link = el('a', linkText, 'quick-nav-action');
        link.href = linkHref;
        header.append(link);

        const val = el('div', count, 'metric-card-value');
        const sub = el('div', subtext, 'metric-card-sub');
        card.append(header, val, sub);
        return card;
      };

      grid.append(
        createMetricCard(
          'Parent Registrations',
          parentTotal,
          parentBreakdown,
          'registrations.html',
          'View all →'
        ),
        createMetricCard(
          'Mentor Applications',
          mentorTotal,
          `${mentorBreakdown} | Active Mentors: ${activeMentors}`,
          'applications.html',
          'View all →'
        ),
        createMetricCard(
          'Stories & Resources',
          storyTotal,
          `Pending review: ${pendingStories} | Total: ${storyTotal}`,
          'stories.html',
          'View all →'
        ),
        createMetricCard(
          'Inquiries & Contact',
          inquiryTotal,
          inquiryBreakdown,
          'inquiries.html',
          'View all →'
        ),
        createMetricCard(
          'Student Support Reports',
          supportReportsTotal,
          'Confidential reports submitted by mentors',
          'reports.html',
          'View all →'
        )
      );

      document.getElementById('failed-notifications').textContent = String(
        data.failed_notifications_last_7_days ?? 0
      );
      summaryHost.replaceChildren();
    } catch (error) {
      message(summaryHost, error.message, 'error');
    }
  }

  async function loadEvents() {
    try {
      message(eventsStateHost, 'Loading event activity…');
      const eventType = document.getElementById('event-type-select')?.value || 'all';
      const search = document.getElementById('event-search-input')?.value || '';

      const queryParams = new URLSearchParams({
        page: String(eventPage),
        limit: '20',
      });
      if (eventType && eventType !== 'all') queryParams.set('event_type', eventType);
      if (search.trim()) queryParams.set('search', search.trim());

      const { data } = await api.get(`/admin/events?${queryParams}`);
      eventsStateHost.replaceChildren();

      const events = data.events || [];
      const totalPages = data.totalPages || 1;

      const rows = events.map(evt => {
        const row = document.createElement('tr');

        // Event Type Badge
        const typeTd = document.createElement('td');
        const badge = el('span', evt.type_label || evt.event_type, 'event-type-badge');
        badge.dataset.eventType = evt.event_type;
        typeTd.append(badge);

        // Title and description
        const descTd = document.createElement('td');
        const strong = el('strong', evt.title);
        const sub = el('p', evt.description, 'event-desc-snippet');
        descTd.append(strong, sub);

        // Actor / Contact
        const actorTd = document.createElement('td');
        actorTd.append(el('div', evt.actor || '—', 'event-actor-name'));
        if (evt.contact) {
          actorTd.append(el('small', evt.contact, 'event-contact-sub'));
        }

        // Status badge
        const statusTd = document.createElement('td');
        statusTd.append(statusBadge(evt.status));

        // Date
        const dateTd = cell(dateText(evt.created_at));

        // Action Link
        const actionTd = document.createElement('td');
        if (evt.link) {
          const link = el('a', 'View', 'btn btn-outline btn-sm');
          link.href = evt.link;
          actionTd.append(link);
        } else {
          actionTd.textContent = '—';
        }

        row.append(typeTd, descTd, actorTd, statusTd, dateTd, actionTd);
        return row;
      });

      table(
        eventsTableHost,
        ['Type', 'Event & Details', 'Actor / Contact', 'Status', 'Timestamp', 'Action'],
        rows,
        'No events found matching your criteria.'
      );

      paginationControls(eventsPaginationHost, eventPage, totalPages, nextPage => {
        eventPage = nextPage;
        loadEvents();
      });
    } catch (error) {
      message(eventsStateHost, error.message, 'error');
    }
  }

  if (filterForm) {
    filterForm.addEventListener('submit', event => {
      event.preventDefault();
      eventPage = 1;
      loadEvents();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadEvents();
      loadSummary();
    });
  }

  loadSummary();
  loadEvents();
}
