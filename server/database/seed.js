/**
 * Bilunex - Database Seeder
 * Populates local development database with initial administrative credentials and realistic test fixtures.
 * STRICTLY GUARDED: Cannot execute when NODE_ENV === 'production'.
 * Usage: node database/seed.js
 */

const bcrypt = require('bcrypt');
const db = require('../src/config/db');
const env = require('../src/config/env');
const logger = require('../src/utils/logger');

async function seedDatabase() {
  // Production Safeguard (Requirement 8)
  if (env.NODE_ENV === 'production') {
    logger.error('CRITICAL: Attempted to run database seeder in production environment!');
    throw new Error('Database seeding is strictly forbidden in production.');
  }

  const client = await db.getClient();

  try {
    logger.info('🌱 Starting Bilunex database seeding (development mode)...');
    await client.query('BEGIN');

    // 1. Seed Administrator User (Password from ENV or secure fallback)
    const adminPasswordPlain = process.env.ADMIN_SEED_PASSWORD || 'Admin123!';
    const adminPasswordHash = await bcrypt.hash(adminPasswordPlain, 10);

    const adminRes = await client.query(
      `
      INSERT INTO admin_users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'super_admin')
      ON CONFLICT (LOWER(email)) DO UPDATE
      SET password_hash = EXCLUDED.password_hash, updated_at = CURRENT_TIMESTAMP
      RETURNING id, name, email, role;
    `,
      ['System Administrator', 'admin@bilunex.org', adminPasswordHash]
    );
    const adminUser = adminRes.rows[0];
    logger.info(`  ✅ Admin user: ${adminUser.email} (Role: ${adminUser.role})`);

    // 2. Seed Accepted Mentor Application (Dr. Sarah Johnson)
    const appRes = await client.query(
      `
      INSERT INTO mentor_applications (
        full_name, email, phone, telegram_handle, university,
        field_of_study, academic_year, subjects, availability, motivation, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'accepted')
      ON CONFLICT (LOWER(email)) WHERE deleted_at IS NULL DO UPDATE
      SET status = 'accepted'
      RETURNING id, full_name, email;
    `,
      [
        'Dr. Sarah Johnson',
        'mentor@bilunex.org',
        '+251911002233',
        '@sarah_j',
        'Addis Ababa University',
        'Physics & Science Education',
        'Postgraduate / PhD',
        ['Mathematics', 'Physics', 'STEM Coaching'],
        'Weekdays after 4 PM, Saturdays 10 AM - 2 PM',
        'Passionate about empowering high schoolers to overcome STEM anxiety through patient coaching.',
      ]
    );
    const acceptedApp = appRes.rows[0];
    logger.info(`  ✅ Mentor application (Accepted): ${acceptedApp.full_name}`);

    // 3. Seed Pending Mentor Application (Maya Rodriguez)
    await client.query(
      `
      INSERT INTO mentor_applications (
        full_name, email, phone, telegram_handle, university,
        field_of_study, academic_year, subjects, availability, motivation, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'under_review')
      ON CONFLICT (LOWER(email)) WHERE deleted_at IS NULL DO NOTHING;
    `,
      [
        'Maya Rodriguez',
        'maya.rodriguez@example.com',
        '+251922334455',
        '@maya_r',
        'Kotebe University of Education',
        'English Literature & Counseling',
        '3rd Year',
        ['English Literature', 'Creative Writing', 'Youth Counseling'],
        'Saturdays and Sundays all day',
        'Committed to providing compassionate emotional and academic support for young students.',
      ]
    );
    logger.info('  ✅ Mentor application (Under Review): Maya Rodriguez');

    // 4. Activate Mentor Profile (Dr. Sarah Johnson) linked 1:1 to application
    const mentorPasswordPlain = process.env.MENTOR_SEED_PASSWORD || 'Mentor123!';
    const mentorPasswordHash = await bcrypt.hash(mentorPasswordPlain, 10);

    const profileRes = await client.query(
      `
      INSERT INTO mentor_profiles (
        application_id, name, email, password_hash, phone, university,
        field_of_study, subject_specializations, availability, account_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      ON CONFLICT (application_id) DO UPDATE
      SET account_status = 'active', password_hash = EXCLUDED.password_hash
      RETURNING id, name, email, account_status;
    `,
      [
        acceptedApp.id,
        'Dr. Sarah Johnson',
        'mentor@bilunex.org',
        mentorPasswordHash,
        '+251911002233',
        'Addis Ababa University',
        'Physics & Science Education',
        ['Mathematics', 'Physics', 'STEM Coaching'],
        'Weekdays after 4 PM, Saturdays 10 AM - 2 PM',
      ]
    );
    const mentorProfile = profileRes.rows[0];
    logger.info(
      `  ✅ Activated mentor profile: ${mentorProfile.name} (Linked to App #${acceptedApp.id})`
    );

    // 5. Seed Parent Registrations
    const parent1Res = await client.query(
      `
      INSERT INTO parent_registrations (
        parent_name, email, phone, telegram_handle, child_name,
        grade_level, subjects, support_category, notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new')
      RETURNING id, child_name;
    `,
      [
        'David Miller',
        'david.miller@example.com',
        '+251911234567',
        '@david_m',
        'Leo Miller',
        'High School (9-12)',
        ['Mathematics', 'Algebra'],
        'combined',
        'Seeking weekly algebra tutoring and 1-on-1 mentorship to build study habits.',
      ]
    );
    logger.info(`  ✅ Parent registration: Leo Miller (Parent: David Miller)`);

    await client.query(
      `
      INSERT INTO parent_registrations (
        parent_name, email, phone, telegram_handle, child_name,
        grade_level, subjects, support_category, notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'contacted');
    `,
      [
        'Amina Yusuf',
        'amina.yusuf@example.com',
        '+251922345678',
        '@amina_y',
        'Nadia Yusuf',
        'Middle School (6-8)',
        ['General Science', 'Reading Skills'],
        'mentoring',
        'Nadia needs an encouraging female mentor for academic self-confidence.',
      ]
    );
    logger.info('  ✅ Parent registration: Nadia Yusuf (Parent: Amina Yusuf)');

    // 6. Seed Inquiries
    await client.query(
      `
      INSERT INTO inquiries (name, email, phone, inquiry_type, message, status)
      VALUES ($1, $2, $3, 'parent_support', $4, 'new');
    `,
      [
        'Kebede Tadesse',
        'kebede.tadesse@example.com',
        '+251933456789',
        'Could you tell me how student assessments are scheduled prior to tutor matching?',
      ]
    );
    logger.info('  ✅ Inquiry: Parent Support from Kebede Tadesse');

    // 7. Seed Student Support Report (SRS Compliant: mentor, student name, support need observed, observations, recommended action)
    await client.query(
      `
      INSERT INTO student_support_reports (
        mentor_id, student_name, support_need_observed, observations, recommended_action
      )
      VALUES ($1, $2, $3, $4, $5);
    `,
      [
        mentorProfile.id,
        'Leo Miller',
        'Struggling with quadratic factoring and exhibits test anxiety.',
        'Leo responded well to visual decomposition of algebraic expressions. Confidence increased noticeably once we mapped steps clearly.',
        'Complete practice exercise 3B; establish 15-minute daily spaced repetition for formulas.',
      ]
    );
    logger.info('  ✅ Student support report filed by Dr. Sarah Johnson for Leo Miller');

    // 8. Seed Notification Log Entry
    await client.query(
      `
      INSERT INTO notification_log (
        notification_type, recipient, related_entity_type, related_entity_id, status, error_message
      )
      VALUES ('parent_registration_ack', 'david.miller@example.com', 'parent_registrations', $1, 'success', NULL);
    `,
      [parent1Res.rows[0].id]
    );
    logger.info('  ✅ Notification log: Registration confirmation email sent');

    // 9. Seed Audit Log Entry
    await client.query(
      `
      INSERT INTO audit_log (
        actor_type, actor_id, actor_email, action, target_table, target_id, metadata
      )
      VALUES ('admin', $1, $2, 'activate', 'mentor_profiles', $3, $4::jsonb);
    `,
      [
        adminUser.id,
        adminUser.email,
        mentorProfile.id,
        JSON.stringify({ reason: 'Screening passed successfully', application_id: acceptedApp.id }),
      ]
    );
    logger.info('  ✅ Audit log: Mentor account activation logged');

    await client.query('COMMIT');
    logger.info('🎉 Database seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('❌ Database seeding aborted:', err.message);
    throw err;
  } finally {
    client.release();
    await db.pool.end();
  }
}

seedDatabase().catch(() => process.exit(1));
