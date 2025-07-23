const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const router = express.Router();
const fileService = require('../services/fileService');
const pollyService = require('../services/pollyService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'spreadsheets');
    fs.ensureDirSync(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload CSV or XLSX files only.'));
    }
  }
});

// Store processing jobs in memory (in production, use Redis or database)
const processingJobs = new Map();

// Upload and process spreadsheet
router.post('/', upload.single('spreadsheet'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { voice = 'Joanna' } = req.body;
    
    console.log(`Processing file: ${req.file.originalname} with voice: ${voice}`);
    
    // Generate job ID for progress tracking
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize job status
    processingJobs.set(jobId, {
      status: 'processing',
      progress: 0,
      total: 0,
      completed: 0,
      current: null,
      startTime: new Date(),
      error: null
    });

    // Start processing asynchronously
    processFileAsync(req.file, voice, jobId);
    
    // Return job ID immediately
    res.json({
      success: true,
      jobId: jobId,
      message: 'File upload successful, processing started',
      fileName: req.file.originalname
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      details: error.message
    });
  }
});

// Get processing progress
router.get('/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = processingJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }
  
  res.json({
    success: true,
    ...job
  });
});

// Async function to process file
async function processFileAsync(file, voice, jobId) {
  const job = processingJobs.get(jobId);
  
  try {
    // Extract text data from file
    job.status = 'extracting';
    processingJobs.set(jobId, job);
    
    const textData = await fileService.processFile(file.path, file.originalname);
    
    job.total = textData.length;
    job.status = 'synthesizing';
    processingJobs.set(jobId, job);
    
    console.log(`Extracted ${textData.length} text items for processing`);
    
    // Process with Polly
    const results = await pollyService.processBatch(textData, voice, (progress) => {
      job.completed = progress.completed;
      job.current = progress.current;
      job.progress = Math.round((progress.completed / progress.total) * 100);
      processingJobs.set(jobId, job);
    });
    
    // Save to library
    job.status = 'saving';
    processingJobs.set(jobId, job);
    
    const libraryEntry = await fileService.saveLibraryEntry({
      originalName: file.originalname,
      filePath: file.path,
      voice: voice
    }, textData, results);
    
    // Complete job
    job.status = 'completed';
    job.progress = 100;
    job.completed = textData.length;
    job.libraryId = libraryEntry.id;
    job.results = results;
    job.endTime = new Date();
    processingJobs.set(jobId, job);
    
    console.log(`Processing completed for job ${jobId}`);
    
    // Clean up job after 1 hour
    setTimeout(() => {
      processingJobs.delete(jobId);
    }, 60 * 60 * 1000);
    
  } catch (error) {
    console.error(`Processing error for job ${jobId}:`, error);
    
    job.status = 'failed';
    job.error = error.message;
    job.endTime = new Date();
    processingJobs.set(jobId, job);
    
    // Clean up failed job after 1 hour
    setTimeout(() => {
      processingJobs.delete(jobId);
    }, 60 * 60 * 1000);
    
    // Clean up uploaded file on error
    try {
      await fs.remove(file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }
  }
}

module.exports = router; 