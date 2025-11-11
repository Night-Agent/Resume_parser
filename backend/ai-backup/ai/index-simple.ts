// Simplified AI Services Manager - Working Version
import { PDFParser } from './services/PDFParser';
import { DocParser } from './services/DocParser';

export interface AIServicesResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class AIServicesManager {
  private pdfParser: PDFParser;
  private docParser: DocParser;

  constructor() {
    this.pdfParser = new PDFParser();
    this.docParser = new DocParser();
  }

  /**
   * Analyze resume from file buffer
   */
  async analyzeResume(file: Buffer, fileName: string): Promise<AIServicesResult> {
    try {
      let extractedText = '';
      let structuredData: any = {};

      if (fileName.toLowerCase().endsWith('.pdf')) {
        const pdfResult = await this.pdfParser.extractFromPDF(file);
        extractedText = pdfResult.text;
        structuredData = pdfResult.structuredData;
      } else if (fileName.toLowerCase().match(/\.(doc|docx)$/)) {
        const docResult = await this.docParser.parseDocument(file);
        extractedText = docResult.text;
        structuredData = docResult.structuredData;
      } else {
        throw new Error('Unsupported file format');
      }

      return {
        success: true,
        data: {
          text: extractedText,
          structured: structuredData,
          fileName,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Resume analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<AIServicesResult> {
    try {
      const pdfHealth = await this.pdfParser.healthCheck();
      const docHealth = await this.docParser.healthCheck();

      return {
        success: true,
        data: {
          services: {
            pdfParser: pdfHealth,
            docParser: docHealth
          },
          status: 'operational',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }
}

// Export default instance
export const aiServices = new AIServicesManager();

// Export types
export { PDFParser, DocParser };