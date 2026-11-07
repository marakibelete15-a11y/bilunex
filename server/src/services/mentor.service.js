/**
 * Bilunex - Mentor Service
 * Business logic for mentor authentication, profile self-management,
 * and confidential student support reports.
 *
 * CRITICAL ARCHITECTURE RULE (SRS FR-7.5, FR-8.3):
 * Mentors can strictly ONLY access and update their own profile and submit reports.
 * Mentors must NEVER have access to read any student support reports.
 *
 * Traces to SRS: FR-7.2, FR-7.3, FR-7.4, FR-7.5, FR-8.1, FR-8.2, FR-8.3, FR-8.4
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
   * Authenticate a verified mentor (FR-7.2)
   * Login succeeds only if account_status === 'active'
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
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, mentor.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    await mentorRepository.updateLastLogin(mentor.id);

    const token = jwt.sign(
      {
        id: mentor.id,
        mentorId: mentor.id,
        email: mentor.email,
        role: 'mentor',
        name: mentor.full_name,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: {
        id: mentor.id,
        name: mentor.full_name,
        email: mentor.email,
        role: 'mentor',
        account_status: mentor.account_status,
      },
    };
  },

  /**
   * Retrieve own mentor profile (FR-7.3, FR-7.5)
   */
  async getProfile(mentorId) {
    const profile = await mentorRepository.findProfileById(mentorId);
    if (!profile) {
      const error = new Error('Mentor profile not found');
      error.statusCode = 404;
      throw error;
    }
    const { password_hash, ...safeProfile } = profile;
    return safeProfile;
  },

  /**
   * Update own mentor profile (FR-7.4, FR-7.5)
   * Only personal details, university, subjects, and availability may be edited.
   */
  async updateProfile(mentorId, updateData) {
    const updated = await mentorRepository.updateProfile(mentorId, {
      full_name: updateData.full_name,
      university: updateData.university,
      field_of_study: updateData.field_of_study,
      subjects: updateData.subjects,
      availability: updateData.availability,
    });

    if (!updated) {
      const error = new Error('Mentor profile not found or inactive');
      error.statusCode = 404;
      throw error;
    }

    return updated;
  },

  /**
   * Change own password (FR-7.2, FR-7.5)
   */
  async changePassword({ mentorId, currentPassword, newPassword }) {
    const mentor = await mentorRepository.findProfileById(mentorId);
    if (!mentor) {
      const error = new Error('Mentor profile not found');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, mentor.password_hash);
    if (!isMatch) {
      const error = new Error('Current password does not match');
      error.statusCode = 400;
      throw error;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await mentorRepository.updatePassword(mentorId, newHash);

    return { success: true, message: 'Password updated successfully' };
  },

  /**
   * File a student support report (FR-8.1, FR-8.2, FR-8.3, FR-8.4)
   * Mentors submit reports; submitted reports are visible only to admins.
   */
  async submitSupportReport(mentorId, mentorName, reportData) {
    const report = await reportRepository.create({
      mentor_id: mentorId,
      student_name: reportData.student_name,
      support_need: reportData.support_need,
      observations: reportData.observations,
      recommended_action: reportData.recommended_action,
    });

    // Notify administrators asynchronously without blocking report submission response
    Promise.resolve()
      .then(() => notificationService.notifySupportReportFiled(report, mentorName))
      .catch(err => {
        logger.error('Unexpected error dispatching support report notification:', err.message);
      });

    return report;
  },
};

module.exports = mentorService;
