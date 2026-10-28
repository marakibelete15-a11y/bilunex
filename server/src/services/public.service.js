/**
 * Bilunex - Public Intake Service
 * Business logic for parent registrations, mentor applications, and public inquiries.
 * Architecture rule: Safe notification dispatch that never blocks record storage.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const parentRepository = require('../repositories/parent.repository');
const mentorRepository = require('../repositories/mentor.repository');
const inquiryRepository = require('../repositories/inquiry.repository');
const documentRepository = require('../repositories/document.repository');
const { ensureStorageDirectory } = require('../utils/fileSecurity');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

const publicService = {
  /**
   * Register a parent/student request
   */
  async registerParent(registrationData) {
    // 1. Store registration in database first
    const registration = await parentRepository.create(registrationData);

    return registration;
  },

  /**
   * Submit a candidate mentor application with optional secure document uploads
   */
  async applyMentor(applicationData, files = {}) {
    // 1. Store application in database first
    const application = await mentorRepository.createApplication(applicationData);

    // 2. Securely store attached documents outside public web root
    const attachedDocuments = [];
    if (files && typeof files === 'object') {
      const storageDir = ensureStorageDirectory();
      const filesToProcess = [];

      if (files.transcript && files.transcript[0]) {
        filesToProcess.push({ type: 'transcript', file: files.transcript[0] });
      }
      if (files.id_photo && files.id_photo[0]) {
        filesToProcess.push({ type: 'id_photo', file: files.id_photo[0] });
      }

      for (const item of filesToProcess) {
        const { type, file } = item;
        const ext = file.validatedType?.ext || (type === 'transcript' ? 'pdf' : 'jpg');
        const storedFilename = `${crypto.randomUUID()}.${ext}`;
        const targetPath = path.join(storageDir, storedFilename);

        // Write file with 0600 mode (read/write only by file owner)
        await fs.promises.writeFile(targetPath, file.buffer, { mode: 0o600 });

        const docRecord = await documentRepository.create({
          mentor_application_id: application.id,
          document_type: type,
          original_filename: file.originalname,
          stored_filename: storedFilename,
          file_path: targetPath,
          mime_type: file.validatedType?.mime || file.mimetype,
          file_size_bytes: file.size,
        });

        attachedDocuments.push(docRecord);
      }
    }

    application.documents = attachedDocuments;

    return application;
  },

  /**
   * Submit a public or counseling contact inquiry
   */
  async submitInquiry(inquiryData) {
    const inquiry = await inquiryRepository.create(inquiryData);
    return inquiry;
  },

  dispatchParentNotifications(registration) {
    notificationService
      .notifyParentRegistration(registration)
      .catch(err => logger.error('Unexpected parent notification error:', err));
  },
  dispatchMentorNotifications(application) {
    notificationService
      .notifyMentorApplication(application)
      .catch(err => logger.error('Unexpected mentor notification error:', err));
  },
  dispatchInquiryNotification(inquiry) {
    notificationService
      .notifyInquiry(inquiry)
      .catch(err => logger.error('Unexpected inquiry notification error:', err));
  },
};

module.exports = publicService;
