import React, { useState } from 'react';
import apiService from '../services/api';

const AudioLibrary = ({ libraries, onDelete, fallbackMode }) => {
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioElements, setAudioElements] = useState({});

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePlayPause = (audioFile) => {
    if (playingAudio === audioFile) {
      // Pause current audio
      const audio = audioElements[audioFile];
      if (audio) {
        audio.pause();
        setPlayingAudio(null);
      }
    } else {
      // Stop any currently playing audio
      if (playingAudio && audioElements[playingAudio]) {
        audioElements[playingAudio].pause();
      }

      // Start new audio
      let audio = audioElements[audioFile];
      if (!audio) {
        audio = new Audio(apiService.getAudioPlayUrl(audioFile));
        audio.addEventListener('ended', () => setPlayingAudio(null));
        audio.addEventListener('error', () => setPlayingAudio(null));
        setAudioElements(prev => ({ ...prev, [audioFile]: audio }));
      }

      audio.play()
        .then(() => setPlayingAudio(audioFile))
        .catch(error => {
          console.error('Error playing audio:', error);
          setPlayingAudio(null);
        });
    }
  };

  const handleDownload = (audioFile, id) => {
    const url = apiService.getAudioDownloadUrl(audioFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${id}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpanded = (entryId) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  if (libraries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎵</div>
        <h3 style={{ color: '#666', marginBottom: '8px' }}>No Audio Libraries</h3>
        <p style={{ color: '#999' }}>Upload a spreadsheet to get started with audio generation.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Audio Library</h2>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {libraries.length} {libraries.length === 1 ? 'library' : 'libraries'}
        </div>
      </div>

      {libraries.map((entry) => (
        <div key={entry.id} style={{ 
          backgroundColor: 'white', 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          marginBottom: '16px',
          overflow: 'hidden'
        }}>
          <div 
            style={{ 
              padding: '16px', 
              cursor: 'pointer', 
              borderBottom: expandedEntry === entry.id ? '1px solid #eee' : 'none'
            }}
            onClick={() => toggleExpanded(entry.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{entry.fileName}</h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#666' }}>
                  <span>📅 {formatDate(entry.uploadDate)}</span>
                  <span>🎤 Voice: {entry.voice}</span>
                  <span>📊 {entry.totalItems} items</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right', fontSize: '14px' }}>
                  <div style={{ color: '#28a745', fontWeight: 'bold' }}>
                    {entry.processedItems} successful
                  </div>
                  {entry.failedItems > 0 && (
                    <div style={{ color: '#dc3545' }}>
                      {entry.failedItems} failed
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this library?')) {
                      onDelete(entry.id);
                    }
                  }}
                  style={{ 
                    color: '#dc3545', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px'
                  }}
                  title="Delete library"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          {expandedEntry === entry.id && (
            <div style={{ padding: '16px', backgroundColor: '#f8f9fa' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Audio Files</h4>
              
              {entry.results.length === 0 ? (
                <p style={{ color: '#666', fontSize: '14px' }}>No audio files generated.</p>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {entry.results.map((result) => (
                    <div key={result.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 12px', 
                      backgroundColor: 'white', 
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{result.id}</span>
                          {result.method === 'fallback' && (
                            <span style={{ 
                              padding: '2px 6px', 
                              fontSize: '10px', 
                              backgroundColor: '#fff3cd', 
                              color: '#856404', 
                              borderRadius: '4px' 
                            }}>
                              Mock
                            </span>
                          )}
                          {!result.success && <span style={{ color: '#dc3545' }}>⚠️</span>}
                        </div>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          margin: 0, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {result.text}
                        </p>
                        {result.note && (
                          <p style={{ fontSize: '12px', color: '#f0ad4e', margin: '4px 0 0 0' }}>
                            {result.note}
                          </p>
                        )}
                        {result.error && (
                          <p style={{ fontSize: '12px', color: '#dc3545', margin: '4px 0 0 0' }}>
                            Error: {result.error}
                          </p>
                        )}
                      </div>
                      
                      {result.success && result.audioFile && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handlePlayPause(result.audioFile)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer',
                              fontSize: '16px',
                              color: '#007bff'
                            }}
                            title={playingAudio === result.audioFile ? 'Pause' : 'Play'}
                          >
                            {playingAudio === result.audioFile ? '⏸️' : '▶️'}
                          </button>
                          
                          <button
                            onClick={() => handleDownload(result.audioFile, result.id)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer',
                              fontSize: '16px',
                              color: '#28a745'
                            }}
                            title="Download"
                          >
                            📥
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AudioLibrary; 