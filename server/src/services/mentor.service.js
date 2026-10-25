/**
 * Bilunex - Mentor Service
 * Business logic for mentor applications, profiles, and student support reports.
 */

const mentorRepository = require('../repositories/mentor.repository');
const reportRepository = require('../repositories/report.repository');
const notificationService = require('./notification.service');

const mentorService = {
  /**
   * Submit a new mentor application
   */
  async submitApplication(applicationData) {
    const application = await mentorRepository.createApplication(applicationData);

    // Non-blocking notification to administrator
    notificationService.notifyMentorApplication(application).catch(() => {});

    return application;
  },

  /**
   * Retrieve all mentor applications (admin only)
   */
  async getApplications() {
    return await mentorRepository.findAllApplications();
  },

  /**
   * Update application status (admin only)
   */
  async updateApplicationStatus(id, status) {
    const updated = await mentorRepository.updateApplicationStatus(id, status);
    if (!updated) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  },

  /**
   * Retrieve mentor profile by user ID
   */
  async getProfileByUserId(userId) {
    return await mentorRepository.findByUserId(userId);
  },

  /**
   * Submit a student support report
   * Architecture rule: A mentor can only file/access their own reports.
   */
  async submitSupportReport(mentorId, mentorName, reportData) {
    const report = await reportRepository.create({
      mentor_id: mentorId,
      ...reportData,
    });

    // Notify administrators of report submission (non-blocking)
    notificationService.notifySupportReportFiled(report, mentorName).catch(() => {});

    return report;
  },

  /**
   * Fetch reports for the authenticated mentor
   */
  async getReportsForMentor(mentorId) {
    return await reportRepository.findByMentorId(mentorId);
  },

  /**
   * Retrieve all active mentors
   */
  async getActiveMentors() {
    return await mentorRepository.findAllActiveMentors();
  },
};

module.exports = mentorService;
