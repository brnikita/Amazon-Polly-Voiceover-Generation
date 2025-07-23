import React, { useState, useRef } from 'react';

const FileUpload = ({ voices, onUpload, isUploading, fallbackMode }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('Joanna');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, selectedVoice);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Upload Spreadsheet</h2>
      
      {fallbackMode && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          ⚠️ Running in fallback mode - AWS Polly not configured. Mock audio files will be generated.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* File Upload Area */}
        <div
          style={{
            border: dragOver ? '2px dashed #007bff' : '2px dashed #ccc',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: dragOver ? '#f8f9fa' : 'white',
            cursor: 'pointer'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {selectedFile ? (
            <div>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📄</div>
              <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{selectedFile.name}</p>
              <p style={{ fontSize: '12px', color: '#666' }}>{formatFileSize(selectedFile.size)}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}
                style={{ marginTop: '10px', color: '#007bff', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📤</div>
              <p>Drag and drop your spreadsheet here</p>
              <p style={{ margin: '10px 0', color: '#666' }}>or</p>
              <button
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Browse Files
              </button>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Supports CSV and XLSX files with ID and Text columns
              </p>
            </div>
          )}
        </div>

        {/* Voice Selection */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Select Voice
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              {voices.map((voice) => (
                <option key={voice.Id} value={voice.Id}>
                  {voice.Name} ({voice.Gender}, {voice.LanguageCode})
                </option>
              ))}
            </select>
          </div>

          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>File Requirements</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
              <li>CSV or XLSX format</li>
              <li>Must contain 'ID' and 'Text' columns</li>
              <li>Maximum 3000 characters per text</li>
              <li>File size limit: 10MB</li>
            </ul>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: selectedFile && !isUploading ? '#28a745' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: selectedFile && !isUploading ? 'pointer' : 'not-allowed'
            }}
          >
            {isUploading ? 'Processing...' : 'Generate Audio Files'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload; 