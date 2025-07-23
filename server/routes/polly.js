const express = require('express');
const router = express.Router();
const pollyService = require('../services/pollyService');

// Get available voices
router.get('/voices', async (req, res) => {
  try {
    const voices = await pollyService.getVoices();
    res.json({
      success: true,
      voices: voices,
      fallback: !pollyService.isAwsConfigured
    });
  } catch (error) {
    console.error('Error getting voices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get voices',
      details: error.message
    });
  }
});

// Test voice with sample text
router.post('/test', async (req, res) => {
  try {
    const { text = 'Hello, this is a test of the selected voice.', voiceId = 'Joanna' } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for voice testing'
      });
    }
    
    const testId = `test_${Date.now()}`;
    const fileName = `${testId}.mp3`;
    const outputPath = require('path').join(__dirname, '..', 'uploads', 'audio', fileName);
    
    const result = await pollyService.synthesizeSpeech(text, voiceId, outputPath);
    
    res.json({
      success: true,
      audioFile: fileName,
      audioUrl: `/uploads/audio/${fileName}`,
      method: result.method,
      note: result.note || null,
      fallback: !pollyService.isAwsConfigured
    });
    
  } catch (error) {
    console.error('Error testing voice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test voice',
      details: error.message
    });
  }
});

// Get Polly service status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    awsConfigured: pollyService.isAwsConfigured,
    mode: pollyService.isAwsConfigured ? 'aws' : 'fallback',
    region: process.env.AWS_REGION || 'us-east-1'
  });
});

module.exports = router; 