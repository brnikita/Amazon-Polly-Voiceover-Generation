const AWS = require('aws-sdk');
const fs = require('fs-extra');
const path = require('path');

class PollyService {
  constructor() {
    this.isAwsConfigured = false;
    this.polly = null;
    
    try {
      // Check if AWS credentials are configured
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        AWS.config.update({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1'
        });
        
        this.polly = new AWS.Polly();
        this.isAwsConfigured = true;
        console.log('AWS Polly configured successfully');
      } else {
        console.log('AWS credentials not found - running in fallback mode');
      }
    } catch (error) {
      console.log('AWS configuration failed - running in fallback mode:', error.message);
    }
  }

  // Get available voices
  async getVoices() {
    if (this.isAwsConfigured) {
      try {
        const result = await this.polly.describeVoices().promise();
        return result.Voices;
      } catch (error) {
        console.error('Error fetching Polly voices:', error);
        return this.getFallbackVoices();
      }
    }
    return this.getFallbackVoices();
  }

  // Fallback voices when AWS is not available
  getFallbackVoices() {
    return [
      { Id: 'Joanna', Name: 'Joanna', Gender: 'Female', LanguageCode: 'en-US' },
      { Id: 'Matthew', Name: 'Matthew', Gender: 'Male', LanguageCode: 'en-US' },
      { Id: 'Amy', Name: 'Amy', Gender: 'Female', LanguageCode: 'en-GB' },
      { Id: 'Brian', Name: 'Brian', Gender: 'Male', LanguageCode: 'en-GB' },
      { Id: 'Emma', Name: 'Emma', Gender: 'Female', LanguageCode: 'en-US' },
      { Id: 'Justin', Name: 'Justin', Gender: 'Male', LanguageCode: 'en-US' }
    ];
  }

  // Synthesize speech
  async synthesizeSpeech(text, voiceId = 'Joanna', outputPath) {
    if (this.isAwsConfigured) {
      try {
        return await this.synthesizeWithPolly(text, voiceId, outputPath);
      } catch (error) {
        console.error('Polly synthesis failed, falling back to mock:', error);
        return await this.synthesizeFallback(text, voiceId, outputPath);
      }
    }
    return await this.synthesizeFallback(text, voiceId, outputPath);
  }

  // Real Amazon Polly synthesis
  async synthesizeWithPolly(text, voiceId, outputPath) {
    const params = {
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: 'standard'
    };

    const result = await this.polly.synthesizeSpeech(params).promise();
    
    if (result.AudioStream) {
      await fs.writeFile(outputPath, result.AudioStream);
      return {
        success: true,
        filePath: outputPath,
        method: 'polly'
      };
    }
    
    throw new Error('No audio stream received from Polly');
  }

  // Fallback synthesis (creates a mock audio file)
  async synthesizeFallback(text, voiceId, outputPath) {
    // Create a simple mock audio file (silent MP3)
    // In a real fallback, you might use Web Speech API or another TTS service
    const mockMp3Buffer = this.createMockMp3Buffer(text.length);
    
    await fs.writeFile(outputPath, mockMp3Buffer);
    
    return {
      success: true,
      filePath: outputPath,
      method: 'fallback',
      note: 'Mock audio file created - AWS Polly not configured'
    };
  }

  // Create a minimal MP3 buffer (very basic mock)
  createMockMp3Buffer(textLength) {
    // This creates a minimal MP3 header + silence
    // Duration roughly proportional to text length
    const duration = Math.max(1, Math.ceil(textLength / 10)); // ~10 chars per second
    const sampleRate = 22050;
    const samples = duration * sampleRate;
    
    // Very basic MP3 frame header
    const mp3Header = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, // MP3 frame header
      0x00, 0x00, 0x00, 0x00, // Additional header data
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00
    ]);
    
    // Create silence data
    const silenceData = Buffer.alloc(Math.min(samples / 10, 8192), 0x00);
    
    return Buffer.concat([mp3Header, silenceData]);
  }

  // Process batch of texts
  async processBatch(textItems, voiceId, progressCallback) {
    const results = [];
    
    for (let i = 0; i < textItems.length; i++) {
      const item = textItems[i];
      const fileName = `${item.id}.mp3`;
      const outputPath = path.join(__dirname, '..', 'uploads', 'audio', fileName);
      
      try {
        const result = await this.synthesizeSpeech(item.text, voiceId, outputPath);
        results.push({
          id: item.id,
          text: item.text,
          audioFile: fileName,
          success: true,
          method: result.method,
          note: result.note
        });
      } catch (error) {
        console.error(`Failed to process item ${item.id}:`, error);
        results.push({
          id: item.id,
          text: item.text,
          success: false,
          error: error.message
        });
      }
      
      // Report progress
      if (progressCallback) {
        progressCallback({
          completed: i + 1,
          total: textItems.length,
          current: item.id
        });
      }
    }
    
    return results;
  }
}

module.exports = new PollyService(); 