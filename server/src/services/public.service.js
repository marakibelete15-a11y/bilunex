/**
 * Bilunex - Public Intake Service
 * Business logic for parent registrations, mentor applications, and public inquiries.
 * Architecture rule: Safe notification dispatch that never blocks record storage.
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
    // 1. Store registration in database first
    const registration = await parentRepository.create(registrationData);

    // 2. Safe notification dispatch: guarantees never throwing or blocking the stored record
    try {
      await notificationService.notifyParentRegistration(registration);
    } catch (err) {
      logger.error('Unexpected error in parent registration notification dispatch:', err);
    }

    return registration;
  },

  /**
   * Submit a candidate mentor application
   */
  async applyMentor(applicationData) {
    // 1. Store application in database first
    const application = await mentorRepository.createApplication(applicationData);

    // 2. Safe notification dispatch
    try {
      await notificationService.notifyMentorApplication(application);
    } catch (err) {
      logger.error('Unexpected error in mentor application notification dispatch:', err);
    }

    return application;
  },

  /**
   * Submit a public or counseling contact inquiry
   */
  async submitInquiry(inquiryData) {
    const inquiry = await inquiryRepository.create(inquiryData);
    return inquiry;
  },
};

module.exports = publicService;
