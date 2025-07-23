const fs = require('fs-extra');
const path = require('path');

/**
 * Sanitize filename by removing invalid characters
 */
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate file type
 */
function isValidFileType(filename, allowedTypes = ['.csv', '.xlsx', '.xls']) {
  const ext = path.extname(filename).toLowerCase();
  return allowedTypes.includes(ext);
}

/**
 * Generate unique filename
 */
function generateUniqueFilename(originalName) {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${sanitizeFilename(name)}_${timestamp}_${random}${ext}`;
}

/**
 * Clean up old files based on age
 */
async function cleanupOldFiles(directory, maxAgeHours = 24) {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.remove(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
}

/**
 * Validate text for Polly constraints
 */
function validateTextForPolly(text) {
  const errors = [];
  
  if (!text || typeof text !== 'string') {
    errors.push('Text is required and must be a string');
  } else {
    if (text.length === 0) {
      errors.push('Text cannot be empty');
    }
    if (text.length > 3000) {
      errors.push('Text cannot exceed 3000 characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Log with timestamp
 */
function logWithTimestamp(message, level = 'info') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logWithTimestamp(`Attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`, 'warn');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = {
  sanitizeFilename,
  formatFileSize,
  isValidFileType,
  generateUniqueFilename,
  cleanupOldFiles,
  validateTextForPolly,
  logWithTimestamp,
  retryWithBackoff
}; 