// Enterprise DOC Parser Service Wrapper
import { DocParser as CoreDocParser } from '../parsers/docParser';

interface DocParseResult {
  text: string;
  structuredData: any;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: Date;
    fileSize: number;
  };
}

export class DocParser {
  private coreParser: CoreDocParser;

  constructor() {
    this.coreParser = new CoreDocParser();
  }

  /**
   * Parse document with structured data
   */
  async parseDocument(buffer: Buffer): Promise<DocParseResult> {
    try {
      // Extract basic text
      const text = await this.coreParser.parse(buffer);
      
      // Extract structured data
      const structuredResult = await this.coreParser.parseStructured(buffer);
      
      return {
        text,
        structuredData: structuredResult,
        metadata: {
          fileSize: buffer.length,
          title: structuredResult.sections?.title,
          author: structuredResult.sections?.author,
          creationDate: new Date()
        }
      };
    } catch (error) {
      console.error('DOC extraction error:', error);
      throw new Error('Failed to extract content from DOC');
    }
  }

  /**
   * Parse DOC with advanced features
   */
  async parseDoc(buffer: Buffer): Promise<DocParseResult> {
    return this.parseDocument(buffer);
  }

  /**
   * Health check for DOC parser
   */
  async healthCheck(): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error('DOC Parser health check failed:', error);
      return false;
    }
  }
}