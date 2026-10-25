/**
 * Bilunex - Authentication Service
 * Business logic for user authentication, password verification, and JWT generation.
 * Admins and mentors are separate user types with separate login logic.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const mentorRepository = require('../repositories/mentor.repository');
const env = require('../config/env');

const authService = {
  /**
   * Authenticate an administrator
   * @param {object} credentials - { email, password }
   */
  async loginAdmin({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.role !== 'admin') {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: 'admin',
        name: user.name,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  /**
   * Authenticate a mentor
   * @param {object} credentials - { email, password }
   */
  async loginMentor({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.role !== 'mentor') {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Attach mentor profile if present
    const mentorProfile = await mentorRepository.findByUserId(user.id);

    const token = jwt.sign(
      {
        id: user.id,
        mentorId: mentorProfile ? mentorProfile.id : null,
        email: user.email,
        role: 'mentor',
        name: user.name,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        mentorId: mentorProfile ? mentorProfile.id : null,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },
};

module.exports = authService;
