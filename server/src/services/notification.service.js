/**
 * Bilunex - Notification & Email Service
 *
 * CRITICAL ARCHITECTURE RULE (Requirement 13):
 * All notifications are sent through safe functions that NEVER throw into the caller.
 * A failed email or SMTP disconnection must NEVER block a parent registration,
 * mentor application, or report submission. Any failure is caught and logged.
 */

const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

// Lazy-create transporter or mock transporter for test environment
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const _resetTransporter = () => {
  transporter = null;
};

/**
 * Core safe email dispatcher that is GUARANTEED never to throw.
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject line
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
const safeSendNotification = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `"Bilunex Platform" <${env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html: html || text || '',
    };

    const info = await getTransporter().sendMail(mailOptions);
    logger.info(`📧 Notification email sent successfully to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // CRITICAL: Log failure with full details, but NEVER throw error to the caller
    logger.error(`❌ Failed to send notification email to ${to}: ${error.message}`, {
      recipient: to,
      subject,
      errorStack: error.stack,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Notify admin and parent upon new parent registration
 */
const notifyParentRegistration = async registration => {
  const adminSubject = `[Bilunex] New Student Registration: ${registration.student_name}`;
  const adminHtml = `
    <h2>New Student Registration Submitted</h2>
    <p><strong>Parent Name:</strong> ${registration.parent_name}</p>
    <p><strong>Email:</strong> ${registration.email}</p>
    <p><strong>Phone:</strong> ${registration.phone}</p>
    <p><strong>Student Name:</strong> ${registration.student_name}</p>
    <p><strong>Grade:</strong> ${registration.student_grade}</p>
    <p><strong>Support Type:</strong> ${registration.support_type}</p>
    <p><strong>Notes:</strong> ${registration.notes || 'None'}</p>
  `;

  // Dispatch to administrator (non-blocking)
  await safeSendNotification({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    subject: adminSubject,
    html: adminHtml,
  });

  // Dispatch confirmation to parent (non-blocking)
  await safeSendNotification({
    to: registration.email,
    subject: 'Welcome to Bilunex - Student Registration Received',
    html: `<p>Dear ${registration.parent_name},</p><p>Thank you for registering <strong>${registration.student_name}</strong> for Bilunex support services. Our coordinator will contact you shortly to schedule an intake orientation.</p>`,
  });
};

/**
 * Notify admin upon new mentor application
 */
const notifyMentorApplication = async application => {
  const subject = `[Bilunex] New Mentor Application: ${application.full_name}`;
  const html = `
    <h2>New Mentor Application Received</h2>
    <p><strong>Applicant Name:</strong> ${application.full_name}</p>
    <p><strong>Email:</strong> ${application.email}</p>
    <p><strong>Phone:</strong> ${application.phone}</p>
    <p><strong>Expertise:</strong> ${application.expertise}</p>
    <p><strong>Experience:</strong> ${application.years_experience} years</p>
    <p><strong>Background:</strong> ${application.bio}</p>
  `;

  return await safeSendNotification({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    subject,
    html,
  });
};

/**
 * Notify admin when a student support report is filed
 */
const notifySupportReportFiled = async (report, mentorName) => {
  const subject = `[Bilunex] Support Report Filed: ${report.student_name}`;
  const html = `
    <h2>Student Support Report Filed</h2>
    <p><strong>Mentor:</strong> ${mentorName || 'Assigned Mentor'}</p>
    <p><strong>Student:</strong> ${report.student_name}</p>
    <p><strong>Session Date:</strong> ${report.session_date}</p>
    <p><strong>Focus:</strong> ${report.session_focus}</p>
    <p><strong>Rating:</strong> ${report.progress_rating} / 5</p>
    <p><strong>Observations:</strong> ${report.observations}</p>
  `;

  return await safeSendNotification({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    subject,
    html,
  });
};

module.exports = {
  safeSendNotification,
  notifyParentRegistration,
  notifyMentorApplication,
  notifySupportReportFiled,
  _resetTransporter,
};
