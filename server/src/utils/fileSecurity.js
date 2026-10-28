/**
 * Bilunex - File Security & Magic Byte Inspector
 * Verifies true file content types via binary signatures (magic bytes)
 * and manages secure, unguessable private storage outside the public web root.
 */

const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');

const STORAGE_ROOT = path.resolve(__dirname, '../../storage/private/documents');

/**
 * Ensure private storage directory exists with restricted access permissions (0700)
 */
const ensureStorageDirectory = () => {
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true, mode: 0o700 });
  }
  return STORAGE_ROOT;
};

/**
 * Detect file type based on binary signature (magic bytes)
 * Never trusts client file extension or Content-Type headers.
 * @param {Buffer} buffer
 * @returns {{ mime: string, ext: string } | null}
 */
const detectMagicBytes = buffer => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) {
    return null;
  }

  // 1. PDF Signature: %PDF (0x25, 0x50, 0x44, 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { mime: 'application/pdf', ext: 'pdf' };
  }

  // 2. JPEG Signature: 0xFF, 0xD8, 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // 3. PNG Signature: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' };
  }

  return null;
};

module.exports = {
  STORAGE_ROOT,
  ensureStorageDirectory,
  detectMagicBytes,
};
