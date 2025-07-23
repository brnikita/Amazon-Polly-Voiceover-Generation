const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

class FileService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
    this.spreadsheetsDir = path.join(this.uploadsDir, 'spreadsheets');
    this.audioDir = path.join(this.uploadsDir, 'audio');
    this.libraryFile = path.join(this.uploadsDir, 'library.json');
  }

  // Process uploaded file and extract text data
  async processFile(filePath, originalName) {
    const fileExtension = path.extname(originalName).toLowerCase();
    
    let textData = [];
    
    try {
      if (fileExtension === '.csv') {
        textData = await this.processCSV(filePath);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        textData = await this.processXLSX(filePath);
      } else {
        throw new Error('Unsupported file format. Please use CSV or XLSX files.');
      }

      // Validate data structure
      this.validateTextData(textData);
      
      return textData;
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  // Process CSV file
  async processCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Look for ID and Text columns (case insensitive)
          const keys = Object.keys(row);
          const idKey = keys.find(key => key.toLowerCase().includes('id'));
          const textKey = keys.find(key => key.toLowerCase().includes('text'));
          
          if (idKey && textKey && row[idKey] && row[textKey]) {
            results.push({
              id: String(row[idKey]).trim(),
              text: String(row[textKey]).trim()
            });
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  // Process XLSX file
  async processXLSX(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const results = [];
    
    jsonData.forEach(row => {
      // Look for ID and Text columns (case insensitive)
      const keys = Object.keys(row);
      const idKey = keys.find(key => key.toLowerCase().includes('id'));
      const textKey = keys.find(key => key.toLowerCase().includes('text'));
      
      if (idKey && textKey && row[idKey] && row[textKey]) {
        results.push({
          id: String(row[idKey]).trim(),
          text: String(row[textKey]).trim()
        });
      }
    });
    
    return results;
  }

  // Validate extracted text data
  validateTextData(textData) {
    if (!Array.isArray(textData) || textData.length === 0) {
      throw new Error('No valid data found. Please ensure your file has ID and Text columns with data.');
    }

    // Check for duplicate IDs
    const ids = textData.map(item => item.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    if (duplicates.length > 0) {
      throw new Error(`Duplicate IDs found: ${duplicates.join(', ')}. Each ID must be unique.`);
    }

    // Check for empty text
    const emptyText = textData.filter(item => !item.text || item.text.length === 0);
    if (emptyText.length > 0) {
      throw new Error(`Empty text found for IDs: ${emptyText.map(item => item.id).join(', ')}`);
    }

    // Check for very long text (Polly has limits)
    const maxLength = 3000; // Polly limit is around 3000 characters
    const tooLong = textData.filter(item => item.text.length > maxLength);
    if (tooLong.length > 0) {
      throw new Error(`Text too long for IDs: ${tooLong.map(item => item.id).join(', ')}. Maximum ${maxLength} characters per text.`);
    }
  }

  // Save library entry
  async saveLibraryEntry(fileData, textData, processingResults) {
    const library = await this.getLibrary();
    
    const entry = {
      id: uuidv4(),
      fileName: fileData.originalName,
      uploadDate: new Date().toISOString(),
      totalItems: textData.length,
      processedItems: processingResults.filter(r => r.success).length,
      failedItems: processingResults.filter(r => !r.success).length,
      voice: fileData.voice || 'Joanna',
      results: processingResults,
      filePath: fileData.filePath
    };
    
    library.push(entry);
    await fs.writeJson(this.libraryFile, library, { spaces: 2 });
    
    return entry;
  }

  // Get library
  async getLibrary() {
    try {
      if (await fs.pathExists(this.libraryFile)) {
        return await fs.readJson(this.libraryFile);
      }
    } catch (error) {
      console.error('Error reading library file:', error);
    }
    return [];
  }

  // Get specific library entry
  async getLibraryEntry(id) {
    const library = await this.getLibrary();
    return library.find(entry => entry.id === id);
  }

  // Delete library entry
  async deleteLibraryEntry(id) {
    const library = await this.getLibrary();
    const entryIndex = library.findIndex(entry => entry.id === id);
    
    if (entryIndex === -1) {
      throw new Error('Library entry not found');
    }
    
    const entry = library[entryIndex];
    
    // Delete associated audio files
    for (const result of entry.results) {
      if (result.success && result.audioFile) {
        const audioPath = path.join(this.audioDir, result.audioFile);
        try {
          await fs.remove(audioPath);
        } catch (error) {
          console.error(`Error deleting audio file ${result.audioFile}:`, error);
        }
      }
    }
    
    // Delete spreadsheet file
    try {
      await fs.remove(entry.filePath);
    } catch (error) {
      console.error(`Error deleting spreadsheet file:`, error);
    }
    
    // Remove from library
    library.splice(entryIndex, 1);
    await fs.writeJson(this.libraryFile, library, { spaces: 2 });
    
    return true;
  }

  // Get file stats
  async getFileStats() {
    try {
      const library = await this.getLibrary();
      const audioFiles = await fs.readdir(this.audioDir);
      const spreadsheetFiles = await fs.readdir(this.spreadsheetsDir);
      
      return {
        totalLibraries: library.length,
        totalAudioFiles: audioFiles.length,
        totalSpreadsheets: spreadsheetFiles.length,
        totalProcessedItems: library.reduce((sum, entry) => sum + entry.processedItems, 0)
      };
    } catch (error) {
      console.error('Error getting file stats:', error);
      return {
        totalLibraries: 0,
        totalAudioFiles: 0,
        totalSpreadsheets: 0,
        totalProcessedItems: 0
      };
    }
  }
}

module.exports = new FileService(); 