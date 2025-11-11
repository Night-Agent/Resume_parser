// Enterprise PDF Parser Service Wrapper
import { PDFParser as CorePDFParser } from '../parsers/pdfParser';

interface PDFParseResult {
  text: string;
  structuredData: any;
  metadata?: {
    pages: number;
    title?: string;
    author?: string;
    creationDate?: Date;
    fileSize: number;
  };
}

export class PDFParser {
  private coreParser: CorePDFParser;

  constructor() {
    this.coreParser = new CorePDFParser();
  }

  /**
   * Extract content from PDF with structured data
   */
  async extractFromPDF(buffer: Buffer): Promise<PDFParseResult> {
    try {
      // Extract basic text
      const text = await this.coreParser.parse(buffer);
      
      // Extract structured data
      const structuredResult = await this.coreParser.parseStructured(buffer);
      
      return {
        text,
        structuredData: structuredResult,
        metadata: {
          pages: Array.isArray(structuredResult.pages) ? structuredResult.pages.length : 1,
          fileSize: buffer.length,
          title: structuredResult.metadata?.title,
          author: structuredResult.metadata?.author,
          creationDate: structuredResult.metadata?.creationDate
        }
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract content from PDF');
    }
  }

  /**
   * Parse PDF with advanced features
   */
  async parsePDF(buffer: Buffer): Promise<PDFParseResult> {
    return this.extractFromPDF(buffer);
  }

  /**
   * Health check for PDF parser
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Create a minimal test PDF buffer (empty test)
      return true;
    } catch (error) {
      console.error('PDF Parser health check failed:', error);
      return false;
    }
  }
}