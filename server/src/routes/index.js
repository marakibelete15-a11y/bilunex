/**
 * Bilunex - Main API Router
 * Aggregates versioned routes under /api/v1.
 */

const express = require('express');
const router = express.Router();

const publicRoutes = require('./public.routes');
const adminRoutes = require('./admin.routes');
const mentorRoutes = require('./mentor.routes');

// API Version 1 Router
const v1Router = express.Router();

// Public routes mounted at /v1 and /v1/public
v1Router.use('/public', publicRoutes);
v1Router.use('/admin', adminRoutes);
v1Router.use('/mentor', mentorRoutes);
v1Router.use('/', publicRoutes);

// Mount v1 router at /api/v1
router.use('/v1', v1Router);

module.exports = router;
