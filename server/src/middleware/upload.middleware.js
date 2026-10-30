/**
 * Bilunex - Document Upload Middleware
 * Handles multipart/form-data uploads for candidate mentor documents (transcript & ID photo).
 * Enforces strict 5 MB size limit and cryptographically verifies binary magic bytes.
 */

const multer = require('multer');
const { detectMagicBytes } = require('../utils/fileSecurity');
const { sendError } = require('../utils/response');

// Memory storage so we can verify magic bytes BEFORE committing anything to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max per file
    files: 2,
  },
}).fields([
  { name: 'transcript', maxCount: 1 },
  { name: 'id_photo', maxCount: 1 },
]);

const handleMentorDocumentUpload = (req, res, next) => {
  // If request is not multipart/form-data (e.g. JSON submission in automated tests/APIs), pass through
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return sendError(res, 'Academic transcript and ID photo are required.', 400);
  }

  upload(req, res, err => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File size exceeds 5 MB limit. Please upload a smaller file.', 400);
      }
      return sendError(res, `File upload error: ${err.message}`, 400);
    }

    const files = req.files || {};

    if (!files.transcript?.[0] || !files.id_photo?.[0]) {
      return sendError(res, 'Academic transcript and ID photo are required.', 400);
    }

    // 1. Validate transcript if uploaded
    if (files.transcript && files.transcript[0]) {
      const file = files.transcript[0];
      const detected = detectMagicBytes(file.buffer);

      // Transcript: PDF only
      if (!detected || detected.mime !== 'application/pdf') {
        return sendError(
          res,
          'Invalid file type for transcript. The file must be a valid PDF document verified by content signature.',
          400
        );
      }
      file.validatedType = detected;
    }

    // 2. Validate ID photo if uploaded
    if (files.id_photo && files.id_photo[0]) {
      const file = files.id_photo[0];
      const detected = detectMagicBytes(file.buffer);

      // ID Photo: JPG or PNG only
      if (!detected || !['image/jpeg', 'image/png'].includes(detected.mime)) {
        return sendError(
          res,
          'Invalid file type for ID photo. The file must be a valid JPG or PNG image verified by content signature.',
          400
        );
      }
      file.validatedType = detected;
    }

    next();
  });
};

module.exports = {
  handleMentorDocumentUpload,
};
