const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const router = express.Router();
const fileService = require('../services/fileService');

// Get all libraries
router.get('/', async (req, res) => {
  try {
    const library = await fileService.getLibrary();
    const stats = await fileService.getFileStats();
    
    res.json({
      success: true,
      libraries: library,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting library:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get library',
      details: error.message
    });
  }
});

// Get specific library entry
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await fileService.getLibraryEntry(id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Library entry not found'
      });
    }
    
    res.json({
      success: true,
      entry: entry
    });
  } catch (error) {
    console.error('Error getting library entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get library entry',
      details: error.message
    });
  }
});

// Delete library entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await fileService.deleteLibraryEntry(id);
    
    res.json({
      success: true,
      message: 'Library entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting library entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete library entry',
      details: error.message
    });
  }
});

// Download audio file
router.get('/audio/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(__dirname, '..', 'uploads', 'audio', filename);
    
    // Check if file exists
    if (!await fs.pathExists(audioPath)) {
      return res.status(404).json({
        success: false,
        error: 'Audio file not found'
      });
    }
    
    // Validate filename (security check)
    if (!filename.match(/^[a-zA-Z0-9_-]+\.mp3$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(audioPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading audio file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download audio file',
      details: error.message
    });
  }
});

// Stream audio file for playback
router.get('/play/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(__dirname, '..', 'uploads', 'audio', filename);
    
    // Check if file exists
    if (!await fs.pathExists(audioPath)) {
      return res.status(404).json({
        success: false,
        error: 'Audio file not found'
      });
    }
    
    // Validate filename (security check)
    if (!filename.match(/^[a-zA-Z0-9_-]+\.mp3$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }
    
    const stat = await fs.stat(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Support range requests for audio streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const fileStream = fs.createReadStream(audioPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg'
      });
      
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg'
      });
      
      const fileStream = fs.createReadStream(audioPath);
      fileStream.pipe(res);
    }
    
  } catch (error) {
    console.error('Error streaming audio file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stream audio file',
      details: error.message
    });
  }
});

// Get library statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await fileService.getFileStats();
    const library = await fileService.getLibrary();
    
    // Calculate additional stats
    const totalSuccessful = library.reduce((sum, entry) => sum + entry.processedItems, 0);
    const totalFailed = library.reduce((sum, entry) => sum + entry.failedItems, 0);
    const averageProcessingTime = library.length > 0 
      ? library.reduce((sum, entry) => {
          if (entry.endTime && entry.startTime) {
            return sum + (new Date(entry.endTime) - new Date(entry.uploadDate));
          }
          return sum;
        }, 0) / library.length 
      : 0;
    
    res.json({
      success: true,
      stats: {
        ...stats,
        totalSuccessful,
        totalFailed,
        averageProcessingTime: Math.round(averageProcessingTime / 1000), // in seconds
        successRate: totalSuccessful + totalFailed > 0 
          ? Math.round((totalSuccessful / (totalSuccessful + totalFailed)) * 100) 
          : 0
      }
    });
  } catch (error) {
    console.error('Error getting library stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get library stats',
      details: error.message
    });
  }
});

module.exports = router; 