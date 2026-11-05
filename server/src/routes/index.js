/**
 * Bilunex - Main API Router
 * All API routes are versioned under /api/v1/
 */

const express = require('express');
const router = express.Router();

const publicRoutes = require('./v1/public.routes');
const adminRoutes = require('./v1/admin.routes');
const mentorRoutes = require('./v1/mentor.routes');

router.post('/v1/auth/logout', (req, res) => {
  res.clearCookie('bilunex_portal_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  res.status(204).end();
});

// Mount version 1 endpoints
router.use('/v1/public', publicRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/mentor', mentorRoutes);

module.exports = router;
