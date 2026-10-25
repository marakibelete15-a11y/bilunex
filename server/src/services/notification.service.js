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
 * Dispatches email and writes outcome to notification_log database table.
 */
const safeSendNotification = async ({
  to,
  subject,
  text,
  html,
  notification_type = 'general_notification',
  related_entity_type = null,
  related_entity_id = null,
}) => {
  try {
    const mailOptions = {
      from: `"Bilunex Platform" <${env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html: html || text || '',
    };

    const info = await getTransporter().sendMail(mailOptions);
    logger.info(`📧 Notification email sent to ${to} (MessageId: ${info.messageId})`);

    // Write success outcome to notification_log table
    await notificationLogRepository
      .create({
        notification_type,
        recipient: to,
        related_entity_type,
        related_entity_id,
        status: 'success',
        error_message: null,
      })
      .catch(logErr => {
        logger.error('Failed to record successful notification to database:', logErr.message);
      });

    return { success: true, messageId: info.messageId };
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
 * Notify admin and parent upon new parent registration
 */
const notifyParentRegistration = async registration => {
  const adminSubject = `[Bilunex] New Student Registration: ${registration.child_name || registration.student_name}`;
  const adminHtml = `
    <h2>New Student Registration Submitted</h2>
    <p><strong>Parent Name:</strong> ${registration.parent_name}</p>
    <p><strong>Email:</strong> ${registration.email}</p>
    <p><strong>Phone:</strong> ${registration.phone}</p>
    <p><strong>Telegram:</strong> ${registration.telegram_handle || 'None'}</p>
    <p><strong>Child Name:</strong> ${registration.child_name || registration.student_name}</p>
    <p><strong>Grade Level:</strong> ${registration.grade_level || registration.student_grade}</p>
    <p><strong>Subjects:</strong> ${Array.isArray(registration.subjects) ? registration.subjects.join(', ') : 'None specified'}</p>
    <p><strong>Support Category:</strong> ${registration.support_category || registration.support_type}</p>
    <p><strong>Notes:</strong> ${registration.notes || 'None'}</p>
  `;

  // 1. Dispatch alert to administrator
  await safeSendNotification({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    subject: adminSubject,
    html: adminHtml,
    notification_type: 'parent_registration_admin_alert',
    related_entity_type: 'parent_registrations',
    related_entity_id: registration.id,
  });

  // 2. Dispatch confirmation to parent
  await safeSendNotification({
    to: registration.email,
    subject: 'Welcome to Bilunex - Student Registration Received',
    html: `<p>Dear ${registration.parent_name},</p><p>Thank you for registering <strong>${registration.child_name || registration.student_name}</strong> for Bilunex support services. Our coordinator will review your request and contact you shortly.</p>`,
    notification_type: 'parent_registration_ack',
    related_entity_type: 'parent_registrations',
    related_entity_id: registration.id,
  });
};

/**
 * Notify admin and applicant upon new mentor application
 */
const notifyMentorApplication = async application => {
  const adminSubject = `[Bilunex] New Mentor Application: ${application.full_name}`;
  const adminHtml = `
    <h2>New Mentor Application Received</h2>
    <p><strong>Applicant Name:</strong> ${application.full_name}</p>
    <p><strong>Email:</strong> ${application.email}</p>
    <p><strong>Phone:</strong> ${application.phone}</p>
    <p><strong>Telegram:</strong> ${application.telegram_handle || 'None'}</p>
    <p><strong>University:</strong> ${application.university}</p>
    <p><strong>Field of Study:</strong> ${application.field_of_study}</p>
    <p><strong>Academic Year:</strong> ${application.academic_year}</p>
    <p><strong>Subjects:</strong> ${Array.isArray(application.subjects) ? application.subjects.join(', ') : application.subjects}</p>
    <p><strong>Availability:</strong> ${application.availability}</p>
    <p><strong>Motivation:</strong> ${application.motivation}</p>
  `;

  // 1. Dispatch alert to administrator
  await safeSendNotification({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    subject: adminSubject,
    html: adminHtml,
    notification_type: 'mentor_application_admin_alert',
    related_entity_type: 'mentor_applications',
    related_entity_id: application.id,
  });

  // 2. Dispatch confirmation to applicant
  await safeSendNotification({
    to: application.email,
    subject: 'Bilunex Mentor Application Received',
    html: `<p>Dear ${application.full_name},</p><p>Thank you for applying to become a mentor at Bilunex. Our academic team has received your application and will review your qualifications.</p>`,
    notification_type: 'mentor_application_ack',
    related_entity_type: 'mentor_applications',
    related_entity_id: application.id,
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
    <p><strong>Support Need Observed:</strong> ${report.support_need_observed}</p>
    <p><strong>Observations:</strong> ${report.observations}</p>
    <p><strong>Recommended Action:</strong> ${report.recommended_action}</p>
  `;

  return await safeSendNotification({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    subject,
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
  _resetTransporter,
};
