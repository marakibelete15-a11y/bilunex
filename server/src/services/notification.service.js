/**
 * Bilunex - Notification & Email Service
 *
 * CRITICAL ARCHITECTURE RULE (SRS & Requirement 4):
 * All notifications are sent through safe functions that NEVER throw into the caller.
 * A failed email must never block saving a registration, application, or report.
 * If an email fails, the record is still stored, the failure is written to
 * notification_log and the logger, and the user still receives a successful response.
 */

const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');
const notificationLogRepository = require('../repositories/notification_log.repository');

let transporter = null;

const getTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  const hasSmtpConfig = Boolean(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS);

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
  } else if (env.NODE_ENV === 'test') {
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 2525,
      auth: { user: 'test', pass: 'test' },
    });
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      logger.info(`✨ Ethereal email test account auto-provisioned: ${testAccount.user}`);
    } catch (err) {
      logger.warn(
        `Could not provision Ethereal test account (${err.message}). Using local fallback transport.`
      );
      transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 587,
        secure: false,
      });
    }
  }

  return transporter;
};

const _resetTransporter = () => {
  transporter = null;
};

/**
 * Core safe email dispatcher that is GUARANTEED never to throw.
 * Dispatches email and writes outcome to notification_log database table.
 */
const safeSendNotification = async ({
  to,
  recipient_role = 'unknown',
  subject,
  text,
  html,
  notification_type = 'general_notification',
  related_entity_type = null,
  related_entity_id = null,
}) => {
  try {
    const activeTransporter = await getTransporter();
    const mailOptions = {
      from: env.EMAIL_FROM || `"Bilunex Platform" <${env.EMAIL_USER || 'no-reply@bilunex.org'}>`,
      to,
      subject,
      text: text || '',
      html: html || text || '',
    };

    const info = await activeTransporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;

    if (previewUrl) {
      logger.info(`📧 Notification email sent to ${to}. Ethereal Preview URL: ${previewUrl}`);
    } else {
      logger.info(
        `📧 Notification email sent to ${to} (MessageId: ${info?.messageId || 'unknown'})`
      );
    }

    // Write success outcome to notification_log table
    await notificationLogRepository
      .create({
        notification_type,
        recipient: to,
        recipient_role,
        related_entity_type,
        related_entity_id,
        status: 'success',
        error_message: null,
      })
      .catch(logErr => {
        logger.error('Failed to record successful notification to database:', logErr.message);
      });

    return { success: true, messageId: info?.messageId, previewUrl };
  } catch (error) {
    // CRITICAL: Log failure, persist to notification_log, and NEVER throw to caller
    logger.error(`❌ Notification email to ${to} failed: ${error.message}`, {
      recipient: to,
      subject,
    });

    await notificationLogRepository
      .create({
        notification_type,
        recipient: to,
        recipient_role,
        related_entity_type,
        related_entity_id,
        status: 'failure',
        error_message: error.message,
      })
      .catch(logErr => {
        logger.error('Failed to record failed notification to database:', logErr.message);
      });

    return { success: false, error: error.message };
  }
};

/**
 * Helper to dispatch email to one or multiple recipients (e.g. comma-separated admin emails)
 */
const dispatchToRecipients = async ({
  to,
  recipient_role = 'unknown',
  subject,
  text,
  html,
  notification_type,
  related_entity_type,
  related_entity_id,
}) => {
  const recipients = Array.isArray(to)
    ? to
    : String(to || '')
        .split(',')
        .map(addr => addr.trim())
        .filter(Boolean);

  const results = [];
  for (const recipient of recipients) {
    const res = await safeSendNotification({
      to: recipient,
      recipient_role,
      subject,
      text,
      html,
      notification_type,
      related_entity_type,
      related_entity_id,
    });
    results.push(res);
  }
  return results;
};

/**
 * Notify admin and parent upon new parent registration
 */
const notifyParentRegistration = async registration => {
  const adminUrl = `${env.CLIENT_URL || 'http://localhost:5000'}/admin/index.html`;

  // 1. Dispatch alert to administrator(s)
  // Constraint: Short summary only, admin link, NO sensitive personal data, NO attachments
  const adminSubject = `[Bilunex Alert] New Parent Registration #${registration.id}`;
  const adminText = [
    'Bilunex System Alert: New Student Registration Submitted',
    '',
    `Reference ID: #${registration.id}`,
    'Type: Parent Registration',
    `Submitted At: ${new Date().toISOString()}`,
    '',
    `Review in Admin Portal: ${adminUrl}`,
    '',
    '(Note: In compliance with student privacy protection policies, personal intake details are omitted from email alerts.)',
  ].join('\n');

  const adminHtml = `
    <h2>New Student Registration Submitted</h2>
    <p><strong>Reference ID:</strong> #${registration.id}</p>
    <p><strong>Type:</strong> Parent Registration</p>
    <p><strong>Submitted At:</strong> ${new Date().toISOString()}</p>
    <p><a href="${adminUrl}">Open Admin Portal to Review Registration</a></p>
    <p><small>(Note: In compliance with student privacy protection policies, personal intake details are omitted from email alerts.)</small></p>
  `;

  await dispatchToRecipients({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    recipient_role: 'admin',
    subject: adminSubject,
    text: adminText,
    html: adminHtml,
    notification_type: 'parent_registration_admin_alert',
    related_entity_type: 'parent_registrations',
    related_entity_id: registration.id,
  });

  // 2. Dispatch confirmation to parent
  /* [To be confirmed by Bilunex] */
  const nextStepsNotice =
    'our team will review your requirements and we will contact you within 24 hours to finalize the registration fee and schedule a Trial Session.';

  const parentSubject = `[Bilunex] Student Registration Received (#${registration.id})`;
  const parentText = [
    `Dear ${registration.parent_name},`,
    '',
    `Thank you for registering with Bilunex. Your registration has been received under reference ID #${registration.id}.`,
    '',
    nextStepsNotice,
    '',
    'Best regards,',
    'Bilunex Admissions & Academic Team',
  ].join('\n');

  const parentHtml = `
    <p>Dear ${registration.parent_name},</p>
    <p>Thank you for registering with Bilunex. Your registration has been received under reference ID <strong>#${registration.id}</strong>.</p>
    <p>${nextStepsNotice}</p>
    <p>Best regards,<br/>Bilunex Admissions &amp; Academic Team</p>
  `;

  await safeSendNotification({
    to: registration.email,
    recipient_role: 'parent',
    subject: parentSubject,
    text: parentText,
    html: parentHtml,
    notification_type: 'parent_registration_ack',
    related_entity_type: 'parent_registrations',
    related_entity_id: registration.id,
  });
};

/**
 * Notify admin and applicant upon new mentor application
 */
const notifyMentorApplication = async application => {
  const adminUrl = `${env.CLIENT_URL || 'http://localhost:5000'}/admin/index.html`;

  // 1. Dispatch alert to administrator(s)
  // Constraint: Short summary only, admin link, NO sensitive personal data, NO attachments
  const adminSubject = `[Bilunex Alert] New Mentor Application #${application.id}`;
  const adminText = [
    'Bilunex System Alert: New Mentor Application Submitted',
    '',
    `Reference ID: #${application.id}`,
    'Type: Mentor Application',
    `Submitted At: ${new Date().toISOString()}`,
    '',
    `Review in Admin Portal: ${adminUrl}`,
    '',
    '(Note: In compliance with candidate data protection policies, personal profile details and documents are omitted from email alerts.)',
  ].join('\n');

  const adminHtml = `
    <h2>New Mentor Application Submitted</h2>
    <p><strong>Reference ID:</strong> #${application.id}</p>
    <p><strong>Type:</strong> Mentor Application</p>
    <p><strong>Submitted At:</strong> ${new Date().toISOString()}</p>
    <p><a href="${adminUrl}">Open Admin Portal to Review Application</a></p>
    <p><small>(Note: In compliance with candidate data protection policies, personal profile details and documents are omitted from email alerts.)</small></p>
  `;

  await dispatchToRecipients({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    recipient_role: 'admin',
    subject: adminSubject,
    text: adminText,
    html: adminHtml,
    notification_type: 'mentor_application_admin_alert',
    related_entity_type: 'mentor_applications',
    related_entity_id: application.id,
  });

  // 2. Dispatch confirmation to applicant
  const mentorSubject = `[Bilunex] Mentor Application Received (#${application.id})`;
  const mentorText = [
    `Dear ${application.full_name},`,
    '',
    `Thank you for applying to become a mentor at Bilunex. Your application has been received under reference ID #${application.id}.`,
    '',
    'Our academic screening committee will review your qualifications, academic record, and supporting documents within 3 to 5 business days. If shortlisted, you will be invited for an interview.',
    '',
    'Best regards,',
    'Bilunex Academic Mentorship Team',
  ].join('\n');

  const mentorHtml = `
    <p>Dear ${application.full_name},</p>
    <p>Thank you for applying to become a mentor at Bilunex. Your application has been received under reference ID <strong>#${application.id}</strong>.</p>
    <p>Our academic screening committee will review your qualifications, academic record, and supporting documents within 3 to 5 business days. If shortlisted, you will be invited for an interview.</p>
    <p>Best regards,<br/>Bilunex Academic Mentorship Team</p>
  `;

  await safeSendNotification({
    to: application.email,
    recipient_role: 'mentor',
    subject: mentorSubject,
    text: mentorText,
    html: mentorHtml,
    notification_type: 'mentor_application_ack',
    related_entity_type: 'mentor_applications',
    related_entity_id: application.id,
  });
};

/**
 * Notify admin when a student support report is filed
 */
const notifySupportReportFiled = async (report, mentorName) => {
  const adminUrl = `${env.CLIENT_URL || 'http://localhost:5000'}/admin/index.html`;
  const subject = `[Bilunex Alert] Student Support Report Filed #${report.id}`;
  const text = [
    'Bilunex System Alert: New Student Support Report Filed',
    '',
    `Report ID: #${report.id}`,
    `Filed By Mentor: ${mentorName || 'Assigned Mentor'}`,
    `Student: ${report.student_name}`,
    `Observed Need: ${report.support_need_observed}`,
    '',
    `Review in Admin Portal: ${adminUrl}`,
  ].join('\n');

  const html = `
    <h2>Student Support Report Filed</h2>
    <p><strong>Report ID:</strong> #${report.id}</p>
    <p><strong>Mentor:</strong> ${mentorName || 'Assigned Mentor'}</p>
    <p><strong>Student:</strong> ${report.student_name}</p>
    <p><strong>Support Need Observed:</strong> ${report.support_need_observed}</p>
    <p><a href="${adminUrl}">Open Admin Portal to Review Report</a></p>
  `;

  return await dispatchToRecipients({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    recipient_role: 'admin',
    subject,
    text,
    html,
    notification_type: 'support_report_filed_admin_alert',
    related_entity_type: 'student_support_reports',
    related_entity_id: report.id,
  });
};

module.exports = {
  safeSendNotification,
  notifyParentRegistration,
  notifyMentorApplication,
  notifySupportReportFiled,
  getTransporter,
  _resetTransporter,
};
