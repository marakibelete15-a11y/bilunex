/**
 * Bilunex - Database Seeder
 * Populates database with default administrator, sample mentors, and test records.
 */

const bcrypt = require('bcrypt');
const db = require('../src/config/db');
const logger = require('../src/utils/logger');

async function seed() {
  try {
    logger.info('🌱 Seeding Bilunex database...');

    // 1. Create default admin if not exists
    const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
    const adminQuery = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'admin')
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash
      RETURNING id, name, email;
    `;
    const adminRes = await db.query(adminQuery, [
      'System Administrator',
      'admin@bilunex.org',
      adminPasswordHash,
    ]);
    logger.info(`✅ Admin user configured: ${adminRes.rows[0].email} (Password: Admin123!)`);

    // 2. Create sample mentor user
    const mentorPasswordHash = await bcrypt.hash('Mentor123!', 10);
    const mentorUserQuery = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'mentor')
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash
      RETURNING id, name, email;
    `;
    const mentorRes = await db.query(mentorUserQuery, [
      'Dr. Sarah Johnson',
      'mentor@bilunex.org',
      mentorPasswordHash,
    ]);
    const mentorUserId = mentorRes.rows[0].id;
    logger.info(`✅ Mentor user configured: ${mentorRes.rows[0].email} (Password: Mentor123!)`);

    // 3. Create sample mentor profile
    const mentorProfileQuery = `
      INSERT INTO mentors (user_id, phone, expertise, years_experience, bio, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (user_id) DO UPDATE
      SET expertise = EXCLUDED.expertise
      RETURNING id;
    `;
    const mentorProfileRes = await db.query(mentorProfileQuery, [
      mentorUserId,
      '+1 (555) 234-5678',
      'Mathematics, Physics, College Prep',
      6,
      'Passionate STEM educator with a PhD in Physics. Dedicated to helping high school students build analytical thinking and confidence.',
    ]);
    const mentorProfileId = mentorProfileRes.rows[0].id;

    // 4. Sample student support report
    await db.query(
      `
      INSERT INTO student_support_reports (
        mentor_id, student_name, session_date, duration_minutes,
        session_focus, observations, action_items, progress_rating
      )
      VALUES ($1, $2, CURRENT_DATE - INTERVAL '2 days', 60, $3, $4, $5, 5);
    `,
      [
        mentorProfileId,
        'Alex Parker',
        'Quadratic Equations & Study Routine',
        'Student showed substantial improvement in factoring polynomials. Maintained high focus throughout the hour.',
        'Complete practice set 3B; review flashcards for quadratic formula.',
      ]
    );

    // 5. Sample Parent Registration
    await db.query(`
      INSERT INTO parent_registrations (parent_name, email, phone, student_name, student_grade, support_type, notes)
      VALUES ('David Miller', 'david.miller@example.com', '+1 (555) 345-6789', 'Leo Miller', 'High School (9-12)', 'combined', 'Looking for algebra tutoring and weekly mentoring.');
    `);

    // 6. Sample Mentor Application
    await db.query(`
      INSERT INTO mentor_applications (full_name, email, phone, expertise, years_experience, bio, status)
      VALUES ('Maya Rodriguez', 'maya.rodriguez@example.com', '+1 (555) 456-7890', 'English Literature, Creative Writing', 4, 'Passionate humanities educator.', 'pending');
    `);

    logger.info('🎉 Database seeding completed successfully.');
  } catch (err) {
    logger.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

seed();
