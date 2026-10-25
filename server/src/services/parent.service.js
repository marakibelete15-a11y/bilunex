/**
 * Bilunex - Parent Service
 * Business logic for parent registrations and notifications.
 */

const parentRepository = require('../repositories/parent.repository');
const notificationService = require('./notification.service');

const parentService = {
  /**
   * Process a parent registration and trigger background notifications
   * Architecture rule: Email failure must NOT block registration.
   */
  async registerParent(registrationData) {
    const registration = await parentRepository.create(registrationData);

    // Trigger non-blocking notifications to admin and parent
    // safeSendNotification guarantees no unhandled exceptions throw
    notificationService.notifyParentRegistration(registration).catch(() => {});

    return registration;
  },

  /**
   * Retrieve registrations list (for administrators)
   */
  async getRegistrations(limit) {
    return await parentRepository.findAll(limit);
  },
};

module.exports = parentService;
