import React, { useState, useEffect } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import ProgressBar from './components/ProgressBar';
import AudioLibrary from './components/AudioLibrary';
import apiService from './services/api';

function App() {
  const [voices, setVoices] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    let interval;
    
    if (currentJobId && progress?.status && !['completed', 'failed'].includes(progress.status)) {
      interval = setInterval(async () => {
        try {
          const progressData = await apiService.getProgress(currentJobId);
          setProgress(progressData);
          
          if (progressData.status === 'completed' || progressData.status === 'failed') {
            setIsUploading(false);
            if (progressData.status === 'completed') {
              loadLibrary(); // Refresh library after completion
            }
          }
        } catch (error) {
          console.error('Error fetching progress:', error);
          setIsUploading(false);
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentJobId, progress?.status]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadVoices(),
        loadLibrary(),
        checkServerStatus()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to connect to server. Please make sure the backend is running.');
    }
  };

  const loadVoices = async () => {
    try {
      const { voices: voiceList, fallback } = await apiService.getVoices();
      setVoices(voiceList);
      setFallbackMode(fallback);
    } catch (error) {
      console.error('Error loading voices:', error);
      setError('Failed to load voice options.');
    }
  };

  const loadLibrary = async () => {
    try {
      const { libraries: libraryList } = await apiService.getLibrary();
      setLibraries(libraryList);
    } catch (error) {
      console.error('Error loading library:', error);
    }
  };

  const checkServerStatus = async () => {
    try {
      const status = await apiService.healthCheck();
      console.log('Server status:', status);
    } catch (error) {
      console.error('Server health check failed:', error);
      throw error;
    }
  };

  const handleFileUpload = async (file, voice) => {
    try {
      setIsUploading(true);
      setError(null);
      
      const response = await apiService.uploadFile(file, voice);
      setCurrentJobId(response.jobId);
      
      // Start polling for progress
      const initialProgress = await apiService.getProgress(response.jobId);
      setProgress(initialProgress);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const handleDeleteLibrary = async (id) => {
    try {
      await apiService.deleteLibraryEntry(id);
      loadLibrary(); // Refresh library
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.message || 'Failed to delete library entry.');
    }
  };

  if (error && !voices.length) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8f9fa', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#dc3545', fontSize: '18px', marginBottom: '16px' }}>{error}</div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #ddd',
        padding: '16px 0'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold' }}>
              Amazon Polly Voiceover Generator
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              Convert spreadsheet text to audio files using AI voices
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('upload')}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: activeTab === 'upload' ? '#007bff' : 'transparent',
                color: activeTab === 'upload' ? 'white' : '#666'
              }}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveTab('library')}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: activeTab === 'library' ? '#007bff' : 'transparent',
                color: activeTab === 'library' ? 'white' : '#666'
              }}
            >
              Library ({libraries.length})
            </button>
          </div>
        </div>
      </header>

      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 20px' 
      }}>
        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            border: '1px solid #f5c6cb', 
            color: '#721c24', 
            padding: '12px 16px', 
            marginBottom: '24px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              style={{ 
                color: '#721c24', 
                background: 'none', 
                border: 'none', 
                textDecoration: 'underline', 
                cursor: 'pointer' 
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'upload' ? (
          <FileUpload
            voices={voices}
            onUpload={handleFileUpload}
            isUploading={isUploading}
            fallbackMode={fallbackMode}
          />
        ) : (
          <AudioLibrary
            libraries={libraries}
            onDelete={handleDeleteLibrary}
            fallbackMode={fallbackMode}
          />
        )}
      </main>

      <ProgressBar
        progress={progress}
        visible={isUploading || (progress?.status && !['completed', 'failed'].includes(progress.status))}
      />
    </div>
  );
}

export default App;
