/**
 * Bilunex - Public Intake Service
 * Business logic for parent registrations, mentor applications, and public inquiries.
 * Architecture rule: Safe notification dispatch that never blocks record storage (FR-9.5, NFR-4).
 * Traces to SRS: FR-2.1, FR-2.3, FR-2.4, FR-3.1, FR-3.2, FR-3.3, FR-4.1, FR-9.1, FR-9.2, FR-9.3, FR-9.4
 */

const parentRepository = require('../repositories/parent.repository');
const mentorRepository = require('../repositories/mentor.repository');
const inquiryRepository = require('../repositories/inquiry.repository');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

const publicService = {
  /**
   * Register a parent/student request
   */
  async registerParent(registrationData) {
    const registration = await parentRepository.create({
      parent_name: registrationData.parent_name,
      email: registrationData.email,
      phone: registrationData.phone || null,
      telegram_handle: registrationData.telegram_handle || null,
      child_name: registrationData.child_name,
      grade_level: registrationData.grade_level,
      subjects: registrationData.subjects,
      notes: registrationData.notes || null,
    });

    return registration;
  },

  /**
   * Submit a candidate mentor application
   */
  async applyMentor(applicationData) {
    const application = await mentorRepository.createApplication({
      full_name: applicationData.full_name,
      email: applicationData.email,
      phone: applicationData.phone,
      telegram_handle: applicationData.telegram_handle || applicationData.telegram_username || null,
      university: applicationData.university || applicationData.university_name,
      field_of_study: applicationData.field_of_study || applicationData.department,
      year_of_study: applicationData.year_of_study || applicationData.academic_year,
      subjects: applicationData.subjects,
      availability:
        applicationData.availability ||
        (Array.isArray(applicationData.available_hours)
          ? applicationData.available_hours.join(', ')
          : 'Flexible'),
      motivation: applicationData.motivation,
    });

    return application;
  },

  /**
   * Submit a public or counseling contact inquiry
   */
  async submitInquiry(inquiryData) {
    const inquiry = await inquiryRepository.create({
      name: inquiryData.name,
      email: inquiryData.email,
      phone: inquiryData.phone || null,
      inquiry_type: inquiryData.inquiry_type,
      message: inquiryData.message,
    });

    return inquiry;
  },

  dispatchParentNotifications(registration) {
    notificationService
      .notifyParentRegistration(registration)
      .catch(err => logger.error('Unexpected parent notification error:', err.message));
  },

  dispatchMentorNotifications(application) {
    notificationService
      .notifyMentorApplication(application)
      .catch(err => logger.error('Unexpected mentor notification error:', err.message));
  },

  dispatchInquiryNotification(inquiry) {
    notificationService
      .notifyInquiry(inquiry)
      .catch(err => logger.error('Unexpected inquiry notification error:', err.message));
  },
};

module.exports = publicService;
