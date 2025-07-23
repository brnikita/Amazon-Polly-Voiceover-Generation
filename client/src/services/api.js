const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// API Functions
export const apiService = {
  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  // Voice management
  async getVoices() {
    const response = await fetch(`${API_BASE_URL}/polly/voices`);
    return response.json();
  },

  async testVoice(text, voiceId) {
    const response = await fetch(`${API_BASE_URL}/polly/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId })
    });
    return response.json();
  },

  // File upload and processing
  async uploadFile(file, voice) {
    const formData = new FormData();
    formData.append('spreadsheet', file);
    formData.append('voice', voice);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  },

  async getProgress(jobId) {
    const response = await fetch(`${API_BASE_URL}/upload/progress/${jobId}`);
    return response.json();
  },

  // Library management
  async getLibrary() {
    const response = await fetch(`${API_BASE_URL}/library`);
    return response.json();
  },

  async deleteLibraryEntry(id) {
    const response = await fetch(`${API_BASE_URL}/library/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Audio file URLs
  getAudioDownloadUrl(filename) {
    return `${API_BASE_URL}/library/audio/${filename}`;
  },

  getAudioPlayUrl(filename) {
    return `${API_BASE_URL}/library/play/${filename}`;
  }
};

export default apiService; 