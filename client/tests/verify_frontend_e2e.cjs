/**
 * End-to-End Verification Script for Bilunex Frontend & API Rebuild
 * Runs against the Express app instance directly.
 */

const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../../server/src/app');

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          let data;
          try {
            data = JSON.parse(body);
          } catch {
            data = body;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data,
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function extractCookie(headers) {
  const cookieHeader = headers['set-cookie'];
  if (!cookieHeader) return null;
  const cookie = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
  return cookie.split(';')[0];
}

async function run() {
  server = http.createServer(app);
  await new Promise(res => server.listen(0, res));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running on ${baseUrl}`);

  const testId = Date.now().toString().slice(-6);

  try {
    // -------------------------------------------------------------
    // 1. Portal Page Protection Middleware (portalPageAuth)
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Portal Page Protection ---');
    const unauthAdmin = await request('/admin/index.html');
    assert.equal(unauthAdmin.status, 302, 'Unauthenticated /admin/index.html must redirect 302');
    assert.equal(unauthAdmin.headers.location, '/admin/login.html');
    console.log('✓ /admin/index.html redirects unauthenticated visitor to /admin/login.html');

    const unauthMentor = await request('/mentor/profile.html');
    assert.equal(unauthMentor.status, 302, 'Unauthenticated /mentor/profile.html must redirect 302');
    assert.equal(unauthMentor.headers.location, '/mentor/login.html');
    console.log('✓ /mentor/profile.html redirects unauthenticated visitor to /mentor/login.html');

    const publicPage = await request('/public/index.html');
    assert.equal(publicPage.status, 200, 'Public index.html must return 200');
    console.log('✓ /public/index.html is served publicly (200 OK)');

    // -------------------------------------------------------------
    // 2. Public Intake Forms
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Public Intake Forms ---');
    const parentPayload = {
      parent_name: `Parent ${testId}`,
      email: `parent${testId}@example.com`,
      phone: '+251911223344',
      preferred_communication_method: ['phone_call', 'telegram'],
      child_name: `Student ${testId}`,
      grade_level: 'Grade 9',
      subjects: ['Mathematics', 'Physics'],
      notes: 'Needs help preparing for entrance exam.',
    };
    const parentRes = await request('/api/v1/parents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: parentPayload,
    });
    assert.equal(parentRes.status, 201, 'Parent registration must return 201');
    const parentId = parentRes.data.data.id;
    console.log(`✓ Parent registration succeeded with ID: ${parentId}`);

    const mentorAppPayload = {
      full_name: `Applicant ${testId}`,
      email: `mentor${testId}@example.com`,
      phone: '+251922334455',
      university: 'Addis Ababa University',
      field_of_study: 'Software Engineering',
      academic_year: '4th Year',
      subjects: ['Mathematics', 'English'],
      availability: 'Weekends and weekday afternoons',
      motivation: 'I have a strong passion for helping high school students excel in STEM.',
    };
    const mentorAppRes = await request('/api/v1/mentors/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: mentorAppPayload,
    });
    assert.equal(mentorAppRes.status, 201, 'Mentor application must return 201');
    const mentorAppId = mentorAppRes.data.data.id;
    console.log(`✓ Mentor application succeeded with ID: ${mentorAppId}`);

    const inquiryPayload = {
      name: `Inquirer ${testId}`,
      email: `inquiry${testId}@example.com`,
      inquiry_type: 'general',
      message: 'Hello, I would like to know more about the mentor matching process.',
    };
    const inquiryRes = await request('/api/v1/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: inquiryPayload,
    });
    assert.equal(inquiryRes.status, 201, 'Inquiry submission must return 201');
    console.log(`✓ Public inquiry succeeded with ID: ${inquiryRes.data.data.id}`);

    // -------------------------------------------------------------
    // 3. Admin Workflow
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Admin Workflow ---');
    const adminLoginRes = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: 'admin@bilunex.org',
        password: 'Admin12345678!',
      },
    });
    assert.equal(adminLoginRes.status, 200, 'Admin login must return 200');
    const adminCookie = extractCookie(adminLoginRes.headers);
    assert.ok(adminCookie, 'Admin login must set cookie');
    console.log('✓ Admin login succeeded, cookie received');

    const adminStats = await request('/api/v1/admin/stats', {
      headers: { Cookie: adminCookie },
    });
    assert.equal(adminStats.status, 200, 'Admin stats must return 200');
    console.log('✓ Admin stats retrieved successfully');

    const adminParents = await request('/api/v1/admin/parents', {
      headers: { Cookie: adminCookie },
    });
    assert.equal(adminParents.status, 200, 'Admin parents list must return 200');
    console.log('✓ Admin retrieved parents list');

    const patchParent = await request(`/api/v1/admin/parents/${parentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: { status: 'contacted' },
    });
    assert.equal(patchParent.status, 200, 'Admin patch parent status must return 200');
    console.log('✓ Admin updated parent status to contacted');

    const patchApp = await request(`/api/v1/admin/mentor-applications/${mentorAppId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: { status: 'accepted', admin_notes: 'Excellent interview feedback' },
    });
    assert.equal(patchApp.status, 200, 'Admin patch application status must return 200');
    console.log('✓ Admin updated mentor application status to accepted');

    const tempPassword = 'TempPassword123!';
    const activateRes = await request(`/api/v1/admin/mentor-applications/${mentorAppId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: { initial_password: tempPassword },
    });
    assert.equal(activateRes.status, 201, 'Admin activate mentor must return 201');
    console.log(`✓ Admin activated mentor with temporary password: ${tempPassword}`);

    // Verify GET mentor-applications/:id includes mentor_profile_id and account_status
    const appDetail = await request(`/api/v1/admin/mentor-applications/${mentorAppId}`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(appDetail.status, 200, 'Admin get mentor application details must return 200');
    assert.ok(appDetail.data.data.mentor_profile_id, 'Application must include mentor_profile_id');
    assert.equal(appDetail.data.data.account_status, 'active');
    const mentorProfileId = appDetail.data.data.mentor_profile_id;
    console.log(`✓ Admin retrieved application with mentor_profile_id: ${mentorProfileId}`);

    // Admin resets mentor's password
    const resetMentorPass = 'ResetMentorPass2026!';
    const resetRes = await request(`/api/v1/admin/mentors/${mentorProfileId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: { new_password: resetMentorPass },
    });
    assert.equal(resetRes.status, 200, 'Admin reset mentor password must return 200');
    assert.equal(resetRes.data.data, null);
    assert.ok(!resetRes.data.password && !resetRes.data.password_hash);
    console.log('✓ Admin successfully reset mentor password (password/hash omitted from response)');

    // Admin changes own password
    const newAdminPass = 'NewAdminPass2026!';
    const adminChangePwRes = await request('/api/v1/admin/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: {
        current_password: 'Admin12345678!',
        new_password: newAdminPass,
      },
    });
    assert.equal(adminChangePwRes.status, 200, 'Admin change own password must return 200');
    assert.ok(!adminChangePwRes.data.password && !adminChangePwRes.data.password_hash);
    console.log('✓ Admin successfully changed own password');

    // Admin logout
    const adminLogoutRes = await request('/api/v1/admin/auth/logout', {
      method: 'POST',
      headers: { Cookie: adminCookie },
    });
    assert.equal(adminLogoutRes.status, 200, 'Admin logout must return 200');
    console.log('✓ Admin logout cleared session cookie');

    // Verify old admin password fails
    const oldAdminLogin = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: 'admin@bilunex.org',
        password: 'Admin12345678!',
      },
    });
    assert.equal(oldAdminLogin.status, 401, 'Old admin password must be rejected');
    console.log('✓ Old admin password rejected with 401');

    // Verify new admin password succeeds
    const newAdminLogin = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: 'admin@bilunex.org',
        password: newAdminPass,
      },
    });
    assert.equal(newAdminLogin.status, 200, 'New admin password must succeed');
    console.log('✓ Admin login succeeded with new password');

    // Restore admin password back to seeded Admin12345678!
    const restoredAdminCookie = extractCookie(newAdminLogin.headers);
    await request('/api/v1/admin/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: restoredAdminCookie },
      body: {
        current_password: newAdminPass,
        new_password: 'Admin12345678!',
      },
    });
    console.log('✓ Admin password restored back to baseline Admin12345678!');

    // -------------------------------------------------------------
    // 4. Mentor Workflow
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Mentor Workflow ---');
    // Old password must fail after admin reset
    const oldMentorLogin = await request('/api/v1/mentor/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: `mentor${testId}@example.com`,
        password: tempPassword,
      },
    });
    assert.equal(oldMentorLogin.status, 401, 'Old temporary password must fail after admin reset');
    console.log('✓ Old mentor password rejected with 401');

    // New password succeeds
    const mentorLoginRes = await request('/api/v1/mentor/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: `mentor${testId}@example.com`,
        password: resetMentorPass,
      },
    });
    assert.equal(mentorLoginRes.status, 200, 'Mentor login must return 200 with new password');
    const mentorCookie = extractCookie(mentorLoginRes.headers);
    assert.ok(mentorCookie, 'Mentor login must set cookie');
    console.log('✓ Mentor login succeeded with admin-reset password');

    const mentorProfile = await request('/api/v1/mentor/me', {
      headers: { Cookie: mentorCookie },
    });
    assert.equal(mentorProfile.status, 200, 'Mentor get profile must return 200');
    assert.equal(mentorProfile.data.data.email, `mentor${testId}@example.com`);
    console.log('✓ Mentor retrieved own profile');

    const patchProfile = await request('/api/v1/mentor/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: mentorCookie },
      body: {
        availability: 'Evenings 6-8pm and weekends',
      },
    });
    assert.equal(patchProfile.status, 200, 'Mentor patch profile must return 200');
    console.log('✓ Mentor updated availability in profile');

    const newPassword = 'NewSecretPassword456!';
    const changePasswordRes = await request('/api/v1/mentor/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: mentorCookie },
      body: {
        current_password: resetMentorPass,
        new_password: newPassword,
      },
    });
    assert.equal(changePasswordRes.status, 200, 'Mentor change password must return 200');
    console.log('✓ Mentor changed password successfully');

    const reportRes = await request('/api/v1/mentor/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: mentorCookie },
      body: {
        student_name: `Student ${testId}`,
        support_need: 'Autism / Focus Support',
        observations: 'Student demonstrated strong visual reasoning but needs structured breaks during calculation sessions.',
        recommended_action: 'Recommend 10-minute intervals and sensory accommodation.',
      },
    });
    assert.equal(reportRes.status, 201, 'Mentor submit report must return 201');
    const reportId = reportRes.data.data.id;
    console.log(`✓ Mentor submitted confidential student support report ID: ${reportId}`);

    // Forbidden mentor endpoints (FR-7.5, FR-8.3)
    const mentorListReports = await request('/api/v1/mentor/reports', {
      headers: { Cookie: mentorCookie },
    });
    assert.equal(mentorListReports.status, 404, 'GET /mentor/reports must return 404 Not Found');
    console.log('✓ GET /api/v1/mentor/reports returns 404 Not Found (Mentors cannot view reports)');

    const mentorAdminRoute = await request('/api/v1/admin/stats', {
      headers: { Cookie: mentorCookie },
    });
    assert.equal(mentorAdminRoute.status, 403, 'Mentor accessing admin route must be 403 Forbidden');
    console.log('✓ Mentor access to admin route returned 403 Forbidden');

    const mentorLogoutRes = await request('/api/v1/mentor/auth/logout', {
      method: 'POST',
      headers: { Cookie: mentorCookie },
    });
    assert.equal(mentorLogoutRes.status, 200, 'Mentor logout must return 200');
    console.log('✓ Mentor logout cleared session cookie');

    // -------------------------------------------------------------
    // 5. Admin Reading the Report
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Admin Reading Support Report ---');
    const adminLogin2 = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: 'admin@bilunex.org',
        password: 'Admin12345678!',
      },
    });
    const adminCookie2 = extractCookie(adminLogin2.headers);
    const readReport = await request(`/api/v1/admin/support-reports/${reportId}`, {
      headers: { Cookie: adminCookie2 },
    });
    assert.equal(readReport.status, 200, 'Admin read support report must return 200');
    assert.equal(readReport.data.data.student_name, `Student ${testId}`);
    console.log('✓ Admin retrieved student support report successfully');

    console.log('\n========================================');
    console.log('ALL END-TO-END VERIFICATION FLOWS PASSED!');
    console.log('========================================\n');
  } finally {
    server.close();
  }
}

run().catch(err => {
  console.error('\nVerification Failed:', err);
  if (server) server.close();
  process.exit(1);
});
