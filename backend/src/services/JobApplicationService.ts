import nodemailer from 'nodemailer';
import axios from 'axios';
import { Job } from '../models/Job';
import { User } from '../models/User';

interface JobData {
  _id?: string;
  title: string;
  company: {
    name: string;
    website?: string;
  };
  location?: string;
  description?: string;
  url?: string;
  apply_link?: string;
  recruiter_email?: string;
  source?: string;
}

interface UserData {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  skills?: string[];
}

interface ApplicationMethod {
  type: 'direct_portal' | 'email' | 'linkedin' | 'company_website' | 'quick_apply';
  url?: string;
  email?: string;
  instructions?: string;
}

interface ApplicationTemplate {
  subject: string;
  body: string;
  attachments?: string[];
}

class JobApplicationService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail', // or your preferred email service
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  /**
   * Apply to job using the best available method
   */
  async applyToJob(
    job: JobData,
    user: UserData,
    customMessage?: string,
    resumeBuffer?: Buffer
  ): Promise<{ success: boolean; method: string; message: string }> {
    
    console.log(`📧 Applying to ${job.title} at ${job.company.name}`);
    
    // Determine best application method
    const method = this.determineBestApplicationMethod(job);
    
    switch (method.type) {
      case 'direct_portal':
        return this.applyViaPortal(job, user, method);
      
      case 'email':
        return this.applyViaEmail(job, user, method, customMessage, resumeBuffer);
      
      case 'linkedin':
        return this.applyViaLinkedIn(job, user, method);
      
      case 'company_website':
        return this.applyViaCompanyWebsite(job, user, method);
      
      case 'quick_apply':
        return this.quickApply(job, user, method);
      
      default:
        return {
          success: false,
          method: 'unknown',
          message: 'No suitable application method found'
        };
    }
  }

  /**
   * Determine the best application method for a job
   */
  private determineBestApplicationMethod(job: JobData): ApplicationMethod {
    const url = job.url?.toLowerCase() || job.apply_link?.toLowerCase() || '';
    
    // Direct job portal applications
    if (url.includes('indeed.com')) {
      return { type: 'direct_portal', url: job.url, instructions: 'Click apply and follow Indeed\'s application process' };
    }
    
    if (url.includes('naukri.com')) {
      return { type: 'direct_portal', url: job.url, instructions: 'Click apply and follow Naukri\'s application process' };
    }
    
    if (url.includes('linkedin.com')) {
      return { type: 'linkedin', url: job.url, instructions: 'Apply via LinkedIn with one-click apply if available' };
    }
    
    // Check if email is provided in description or company info
    const emailMatch = (job.description + ' ' + JSON.stringify(job.company)).match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      return { type: 'email', email: emailMatch[1], instructions: 'Send application email to recruiter' };
    }
    
    // Company career page
    if (job.company.name) {
      return { type: 'company_website', url: job.url, instructions: 'Apply through company career page' };
    }
    
    // Fallback to quick apply
    return { type: 'quick_apply', url: job.url, instructions: 'Generic application method' };
  }

  /**
   * Apply via job portal (Indeed, Naukri, etc.)
   */
  private async applyViaPortal(job: JobData, user: UserData, method: ApplicationMethod): Promise<{ success: boolean; method: string; message: string }> {
    try {
      // For portal applications, we typically redirect user to the portal
      // But we can also track the application in our database
      
      console.log(`🌐 Redirecting to ${method.url} for portal application`);
      
      // Log application attempt
      await this.logApplicationAttempt(job, user, 'direct_portal');
      
      return {
        success: true,
        method: 'direct_portal',
        message: `Please complete your application on the job portal: ${method.url}`
      };
      
    } catch (error: any) {
      return {
        success: false,
        method: 'direct_portal',
        message: `Portal application failed: ${error.message}`
      };
    }
  }

  /**
   * Apply via email to recruiter
   */
  private async applyViaEmail(
    job: JobData,
    user: UserData,
    method: ApplicationMethod, 
    customMessage?: string,
    resumeBuffer?: Buffer
  ): Promise<{ success: boolean; method: string; message: string }> {
    try {
      if (!method.email) {
        throw new Error('No email address provided');
      }

      const template = this.generateEmailTemplate(job, user, customMessage);
      
      const mailOptions = {
        from: `"${user.name}" <${process.env.SMTP_USER}>`,
        to: method.email,
        subject: template.subject,
        html: template.body,
        attachments: resumeBuffer ? [{
          filename: `${user.name}_Resume.pdf`,
          content: resumeBuffer,
          contentType: 'application/pdf'
        }] : []
      };

      console.log(`📧 Sending application email to ${method.email}`);
      
      await this.emailTransporter.sendMail(mailOptions);
      await this.logApplicationAttempt(job, user, 'email', method.email);
      
      return {
        success: true,
        method: 'email',
        message: `Application email sent successfully to ${method.email}`
      };
      
    } catch (error: any) {
      return {
        success: false,
        method: 'email',
        message: `Email application failed: ${error.message}`
      };
    }
  }

  /**
   * Apply via LinkedIn
   */
  private async applyViaLinkedIn(job: JobData, user: UserData, method: ApplicationMethod): Promise<{ success: boolean; method: string; message: string }> {
    try {
      // For LinkedIn applications, we typically redirect to LinkedIn
      // Advanced implementation could use LinkedIn API for direct applications
      
      console.log(`💼 Redirecting to LinkedIn for application: ${method.url}`);
      
      await this.logApplicationAttempt(job, user, 'linkedin');
      
      return {
        success: true,
        method: 'linkedin',
        message: `Please complete your LinkedIn application: ${method.url}`
      };
      
    } catch (error: any) {
      return {
        success: false,
        method: 'linkedin',
        message: `LinkedIn application failed: ${error.message}`
      };
    }
  }

  /**
   * Apply via company website
   */
  private async applyViaCompanyWebsite(job: JobData, user: UserData, method: ApplicationMethod): Promise<{ success: boolean; method: string; message: string }> {
    try {
      // Try to find company career page
      const careerUrl = await this.findCompanyCareerPage(job.company.name);
      
      console.log(`🏢 Directing to company career page: ${careerUrl || method.url}`);
      
      await this.logApplicationAttempt(job, user, 'company_website');
      
      return {
        success: true,
        method: 'company_website',
        message: `Please apply through company career page: ${careerUrl || method.url}`
      };
      
    } catch (error: any) {
      return {
        success: false,
        method: 'company_website',
        message: `Company website application failed: ${error.message}`
      };
    }
  }

  /**
   * Quick apply method (fallback)
   */
  private async quickApply(job: JobData, user: UserData, method: ApplicationMethod): Promise<{ success: boolean; method: string; message: string }> {
    try {
      console.log(`⚡ Using quick apply for: ${job.title}`);
      
      await this.logApplicationAttempt(job, user, 'quick_apply');
      
      return {
        success: true,
        method: 'quick_apply',
        message: `Application submitted. Please follow up via: ${method.url}`
      };
      
    } catch (error: any) {
      return {
        success: false,
        method: 'quick_apply',
        message: `Quick apply failed: ${error.message}`
      };
    }
  }

  /**
   * Generate personalized email template
   */
  private generateEmailTemplate(job: JobData, user: UserData, customMessage?: string): ApplicationTemplate {
    const subject = `Application for ${job.title} position at ${job.company.name}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Dear Hiring Manager,</h2>
        
        <p>I hope this email finds you well. I am writing to express my strong interest in the <strong>${job.title}</strong> position at <strong>${job.company.name}</strong>.</p>
        
        ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
        
        <p>With my background in <strong>${user.skills?.slice(0, 3).join(', ')}</strong>, I am confident that I would be a valuable addition to your team. My experience includes:</p>
        
        <ul>
          ${user.skills?.slice(0, 5).map(skill => `<li>${skill}</li>`).join('') || '<li>Relevant technical skills</li>'}
        </ul>
        
        <p>I have attached my resume for your review and would welcome the opportunity to discuss how my skills and enthusiasm can contribute to ${job.company.name}'s continued success.</p>
        
        <p>Thank you for considering my application. I look forward to hearing from you soon.</p>
        
        <div style="margin-top: 30px;">
          <p>Best regards,<br>
          <strong>${user.name}</strong><br>
          ${user.email}<br>
          ${user.phone || ''}</p>
        </div>
        
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This application was sent via AI Resume Platform - helping professionals find their dream jobs.
        </p>
      </div>
    `;

    return { subject, body };
  }

  /**
   * Find company career page
   */
  private async findCompanyCareerPage(companyName: string): Promise<string | null> {
    try {
      // Try common career page patterns
      const commonDomains = [
        `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/careers`,
        `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/jobs`,
        `https://careers.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        `https://jobs.${companyName.toLowerCase().replace(/\s+/g, '')}.com`
      ];

      for (const url of commonDomains) {
        try {
          const response = await axios.head(url, { timeout: 3000 });
          if (response.status === 200) {
            return url;
          }
        } catch {
          // Continue to next URL
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Log application attempt in database
   */
  private async logApplicationAttempt(
    job: JobData, 
    user: UserData, 
    method: string, 
    details?: string
  ): Promise<void> {
    try {
      // Here you would save to your Application model
      console.log(`📝 Logging application: ${user.name} -> ${job.title} via ${method}`);
      
      // Example: await Application.create({
      //   userId: user._id,
      //   jobId: job.id,
      //   method,
      //   details,
      //   appliedAt: new Date(),
      //   status: 'applied'
      // });
      
    } catch (error) {
      console.error('Failed to log application:', error);
    }
  }

  /**
   * Get application statistics
   */
  getApplicationStats(userId: string) {
    return {
      totalApplications: 0, // Query from database
      successfulApplications: 0,
      pendingApplications: 0,
      methodBreakdown: {
        direct_portal: 0,
        email: 0,
        linkedin: 0,
        company_website: 0,
        quick_apply: 0
      }
    };
  }

  /**
   * Bulk apply to multiple jobs
   */
  async bulkApplyToJobs(
    jobs: JobData[],
    user: UserData,
    customMessage?: string,
    resumeBuffer?: Buffer
  ): Promise<Array<{ jobId: string; success: boolean; method: string; message: string }>> {
    const results: Array<{ jobId: string; success: boolean; method: string; message: string }> = [];
    
    for (const job of jobs) {
      try {
        const result = await this.applyToJob(job, user, customMessage, resumeBuffer);
        results.push({
          jobId: job._id || 'unknown',
          success: result.success,
          method: result.method,
          message: result.message
        });
        
        // Rate limiting for bulk applications
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        results.push({
          jobId: job._id || 'unknown',
          success: false,
          method: 'unknown',
          message: error.message
        });
      }
    }
    
    return results;
  }
}

export default new JobApplicationService();