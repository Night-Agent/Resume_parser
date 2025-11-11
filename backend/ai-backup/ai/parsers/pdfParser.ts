import pdfParse from 'pdf-parse';

export class PDFParser {
  constructor() {
    // Initialize parser
  }

  /**
   * Parse PDF file and extract text content
   */
  async parse(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return this.cleanText(data.text);
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Parse PDF and return structured data
   */
  async parseStructured(buffer: Buffer): Promise<{
    text: string;
    metadata: any;
    pages: any[];
  }> {
    try {
      const data = await pdfParse(buffer);
      
      return {
        text: this.cleanText(data.text),
        metadata: {
          title: data.info?.Title || '',
          author: data.info?.Author || '',
          creationDate: data.info?.CreationDate || null,
          pages: data.numpages || 1
        },
        pages: [{
          pageNumber: 1,
          text: data.text
        }]
      };
    } catch (error) {
      console.error('PDF structured parsing error:', error);
      throw new Error('Failed to parse PDF structure');
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Extract contact information
   */
  async extractContactInfo(buffer: Buffer): Promise<{
    emails: string[];
    phones: string[];
    urls: string[];
  }> {
    try {
      const data = await pdfParse(buffer);
      const text = data.text;
      
      // Email regex
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = text.match(emailRegex) || [];
      
      // Phone regex (various formats)
      const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,15}/g;
      const phones = text.match(phoneRegex) || [];
      
      // URL regex
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const urls = text.match(urlRegex) || [];
      
      return {
        emails: [...new Set(emails)],
        phones: [...new Set(phones)],
        urls: [...new Set(urls)]
      };
    } catch (error) {
      console.error('PDF contact extraction error:', error);
      throw new Error('Failed to extract contact information');
    }
  }
}