# Amazon Polly Voiceover Generation

A web application that converts text from spreadsheets into audio files using Amazon Polly text-to-speech service.

## Overview

This application allows users to:
- Upload CSV/XLSX files with ID and Text columns
- Generate audio files using Amazon Polly voices
- Store and manage audio libraries
- Download or playback generated audio files

## Tech Stack

- **Frontend**: React with modern JavaScript
- **Backend**: Node.js with Express
- **Text-to-Speech**: Amazon Polly (AWS SDK)
- **File Processing**: multer, xlsx, csv-parser
- **Storage**: Local filesystem (configurable to S3)

## Project Structure

```
Amazon-Polly-Voiceover-Generation/
├── README.md
├── package.json
├── .env.example
├── .gitignore
├── server/
│   ├── app.js
│   ├── routes/
│   │   ├── upload.js
│   │   ├── polly.js
│   │   └── library.js
│   ├── services/
│   │   ├── pollyService.js
│   │   └── fileService.js
│   ├── utils/
│   │   └── helpers.js
│   └── uploads/
│       ├── spreadsheets/
│       └── audio/
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.js
│   │   │   ├── VoiceSelector.js
│   │   │   ├── ProgressBar.js
│   │   │   └── AudioLibrary.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
```

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory by copying the example:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# AWS Configuration (optional - fallback mode if not provided)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Server Configuration
PORT=3001
NODE_ENV=development

# File Storage
UPLOAD_PATH=./server/uploads
MAX_FILE_SIZE=10485760

# CORS Configuration (optional)
FRONTEND_URL=http://localhost:3000

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Note**: If you don't have AWS credentials, the application will automatically run in fallback mode and generate mock audio files for testing.

### 2. Installation

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Running the Application

```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
# Backend only
npm run server

# Frontend only (in another terminal)
npm run client
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## API Endpoints

### Upload and Process
- `POST /api/upload` - Upload spreadsheet and generate audio files
- `GET /api/voices` - Get available Polly voices
- `GET /api/progress/:jobId` - Get processing progress

### Library Management
- `GET /api/library` - Get all uploaded libraries
- `GET /api/library/:id` - Get specific library details
- `GET /api/audio/:filename` - Download audio file
- `DELETE /api/library/:id` - Delete library

## Fallback Mode

When AWS credentials are not provided or invalid, the application operates in fallback mode:
- Uses Text-to-Speech Web API (if available in browser)
- Generates mock audio files for demonstration
- All UI features remain functional for testing

## Input File Format

### CSV Format
```csv
ID,Text
1,"Hello world, this is a test."
2,"Welcome to our application."
3,"Thank you for using our service."
```

### XLSX Format
Same structure with columns:
- Column A: ID
- Column B: Text

## Voice Options

Supported Amazon Polly voices:
- **English**: Joanna, Matthew, Amy, Brian, Emma, etc.
- **Spanish**: Conchita, Enrique, Lucia
- **French**: Celine, Mathieu
- **German**: Marlene, Hans
- **And many more...

## Error Handling

- Invalid file formats
- Missing required columns
- AWS service errors
- File size limits
- Network timeouts

## Logging

Application logs include:
- File upload events
- Polly API calls
- Error occurrences
- Processing progress

## Security Considerations

- File type validation
- File size limits
- Input sanitization
- Environment variable protection

## Development Notes

### Minimum Working Solution
This implementation focuses on core functionality:
- Simple, clean UI
- Essential features only
- Basic error handling
- Local file storage
- Fallback for AWS unavailability

### Future Enhancements
- S3 integration for file storage
- User authentication
- Batch processing optimization
- Advanced voice settings (SSML)
- Audio format options
- Progress persistence

## Troubleshooting

### Common Issues

1. **AWS Credentials Error**
   - Ensure `.env` file has correct AWS keys
   - Check AWS region configuration
   - Verify Polly service permissions

2. **File Upload Failed**
   - Check file format (CSV/XLSX only)
   - Verify file size under limit
   - Ensure required columns exist

3. **Audio Generation Failed**
   - Check internet connection
   - Verify AWS service status
   - Review application logs

### Logs Location
- Server logs: Console output
- Error logs: `./logs/error.log` (if configured)

## License

MIT License - Feel free to use and modify as needed. 