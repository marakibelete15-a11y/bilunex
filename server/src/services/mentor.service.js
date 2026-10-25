/**
 * Bilunex - Mentor Service
 * Business logic for mentor authentication, profile self-management,
 * and confidential student support reports.
 * Architecture rule: Mentors can strictly only access and file their own reports.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const mentorRepository = require('../repositories/mentor.repository');
const reportRepository = require('../repositories/report.repository');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

const mentorService = {
  /**
   * Authenticate a verified mentor
   * Requirement 13: Login succeeds only if account_status === 'active'
   */
  async login({ email, password }) {
    const mentor = await mentorRepository.findProfileByEmail(email);
    if (!mentor) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (mentor.account_status !== 'active') {
      const error = new Error('Account is inactive or suspended. Please contact administration.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, mentor.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        id: mentor.id,
        mentorId: mentor.id,
        email: mentor.email,
        role: 'mentor',
        name: mentor.name,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        role: 'mentor',
        account_status: mentor.account_status,
      },
    };
  },

  /**
   * Retrieve own mentor profile
   * Requirement 14: GET /mentor/profile
   */
  async getProfile(mentorId) {
    const profile = await mentorRepository.findProfileById(mentorId);
    if (!profile) {
      const error = new Error('Mentor profile not found');
      error.statusCode = 404;
      throw error;
    }
    return profile;
  },

  /**
   * Update own mentor profile (availability, phone, subject_specializations)
   * Requirement 15: PATCH /mentor/profile
   */
  async updateProfile(mentorId, { availability, phone, subject_specializations }) {
    const updated = await mentorRepository.updateProfile(mentorId, {
      availability,
      phone,
      subject_specializations,
    });
    if (!updated) {
      const error = new Error('Mentor profile not found or inactive');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  },

  /**
   * File a student support report
   * Requirement 16: POST /mentor/reports
   */
  async submitSupportReport(mentorId, mentorName, reportData) {
    const report = await reportRepository.create({
      mentor_id: mentorId,
      ...reportData,
    });

    // Safe non-blocking notification to administrators
    try {
      await notificationService.notifySupportReportFiled(report, mentorName);
    } catch (err) {
      logger.error('Unexpected error dispatching support report notification:', err.message);
    }

    return report;
  },

  /**
   * Fetch reports filed by the logged-in mentor only
   * Requirement 17: GET /mentor/reports (Strict query isolation)
   */
  async getReportsForMentor(mentorId) {
    return await reportRepository.findByMentorId(mentorId);
  },

  /**
   * Legacy and helper methods
   */
  async submitApplication(applicationData) {
    const application = await mentorRepository.createApplication(applicationData);
    notificationService.notifyMentorApplication(application).catch(() => {});
    return application;
  },

  async getApplications() {
    return await mentorRepository.findAllApplications();
  },

  async updateApplicationStatus(id, status) {
    const updated = await mentorRepository.updateApplicationStatus(id, status);
    if (!updated) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  },

  async getProfileByUserId(userId) {
    return this.getProfile(userId);
  },

  async getActiveMentors() {
    return await mentorRepository.findAllActiveMentors();
  },
};

module.exports = mentorService;
