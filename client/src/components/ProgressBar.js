import React from 'react';

const ProgressBar = ({ progress, visible }) => {
  if (!visible || !progress) return null;

  const getStatusText = () => {
    switch (progress.status) {
      case 'extracting':
        return 'Extracting text from spreadsheet...';
      case 'synthesizing':
        return `Generating audio files... (${progress.completed}/${progress.total})`;
      case 'saving':
        return 'Saving to library...';
      case 'completed':
        return `Processing completed! Generated ${progress.completed} audio files.`;
      case 'failed':
        return `Processing failed: ${progress.error}`;
      default:
        return 'Processing...';
    }
  };

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}m ${seconds}s`;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      maxWidth: '300px',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ marginRight: '12px' }}>
          {progress.status === 'completed' ? '✅' : 
           progress.status === 'failed' ? '❌' : '⏳'}
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Processing Status</h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{getStatusText()}</p>
        </div>
      </div>

      {progress.status === 'synthesizing' && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            <span>Progress</span>
            <span>{progress.progress}%</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', height: '8px' }}>
            <div
              style={{
                backgroundColor: '#007bff',
                height: '8px',
                borderRadius: '4px',
                width: `${progress.progress}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          {progress.current && (
            <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0 0' }}>
              Current: {progress.current}
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
        <span>Duration: {formatDuration(progress.startTime, progress.endTime)}</span>
        {progress.status === 'completed' && progress.libraryId && (
          <button
            onClick={() => window.location.reload()}
            style={{ 
              color: '#007bff', 
              background: 'none', 
              border: 'none', 
              textDecoration: 'underline', 
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            View Results
          </button>
        )}
      </div>

      {progress.status === 'failed' && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          backgroundColor: '#ffe6e6', 
          border: '1px solid #ffcccc', 
          borderRadius: '4px', 
          fontSize: '12px', 
          color: '#cc0000' 
        }}>
          {progress.error}
        </div>
      )}
    </div>
  );
};

export default ProgressBar; 