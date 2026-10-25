/**
 * Bilunex - Main API Router
 * All API routes are versioned under /api/v1/
 */

const express = require('express');
const router = express.Router();

const publicRoutes = require('./v1/public.routes');
const adminRoutes = require('./v1/admin.routes');
const mentorRoutes = require('./v1/mentor.routes');

// Mount version 1 endpoints
router.use('/v1/public', publicRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/mentor', mentorRoutes);

module.exports = router;
