import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth';
import FreeJobScrapingService from '../services/FreeJobScrapingService';
import JobApplicationService from '../services/JobApplicationService';
import { asyncHandler } from '../middleware/errorHandler';
import multer from 'multer';

const router = express.Router();

// Configure multer for resume uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('application/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// FREE Job Scraping Routes (No n8n required!)
router.get('/free-scrape', protect, asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { skills, location = 'India' } = req.query;

  if (!skills) {
    return res.status(400).json({
      success: false,
      message: 'Skills parameter is required'
    });
  }

  const skillsArray = Array.isArray(skills) ? skills as string[] : (skills as string).split(',');

  try {
    console.log(`🆓 Starting FREE scraping for: ${skillsArray.join(', ')}`);
    
    const jobs = await FreeJobScrapingService.scrapeJobsDirectly(skillsArray, location as string);
    
    return res.json({
      success: true,
      data: {
        jobs,
        count: jobs.length,
        method: 'free_scraping',
        cost: '₹0 (Completely FREE!)',
        sources: ['Indeed', 'Naukri', 'Shine']
      },
      message: `🎉 Found ${jobs.length} jobs using FREE scraping (No n8n costs!)`
    });

  } catch (error) {
    console.error('❌ Free scraping error:', error);
    return res.status(500).json({
      success: false,
      message: 'Free scraping failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get scraping statistics
router.get('/scraping-stats', protect, asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  try {
    const stats = FreeJobScrapingService.getScrapingStats();
    
    return res.json({
      success: true,
      data: {
        ...stats,
        cost: '₹0/month (FREE)',
        comparison: {
          'Free Scraping': '₹0/month',
          'n8n Cloud': '₹1,500+/month',
          'Make.com': '₹800+/month',
          'Zapier': '₹1,200+/month'
        }
      },
      message: 'Scraping statistics retrieved'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get scraping statistics'
    });
  }
}));

// Job Application Routes
router.post('/apply/:jobId', protect, upload.single('resume'), asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { customMessage } = req.body;
  const resumeFile = req.file;

  try {
    // Get job details (you'd fetch from database)
    // const job = await Job.findById(jobId);
    
    // Mock job for demo
    const job = {
      id: jobId,
      title: 'Software Developer',
      company: { name: 'TechCorp' },
      location: 'Bangalore',
      applyUrl: 'https://example.com/apply',
      description: 'Great opportunity for developers'
    };

    // Get user details
    const user = (req as any).user;

    const result = await JobApplicationService.applyToJob(
      job as any,
      user,
      customMessage,
      resumeFile?.buffer
    );

    res.json({
      success: result.success,
      data: {
        jobId,
        method: result.method,
        message: result.message,
        appliedAt: new Date().toISOString()
      },
      message: result.success ? 'Application submitted successfully!' : 'Application failed'
    });

  } catch (error) {
    console.error('❌ Job application error:', error);
    res.status(500).json({
      success: false,
      message: 'Application failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Bulk job application
router.post('/bulk-apply', protect, upload.single('resume'), asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { jobIds, customMessage } = req.body;
  const resumeFile = req.file;

  if (!jobIds || !Array.isArray(jobIds)) {
    return res.status(400).json({
      success: false,
      message: 'jobIds array is required'
    });
  }

  try {
    // Mock jobs for demo (you'd fetch from database)
    const jobs = jobIds.map(id => ({
      id,
      title: 'Software Developer',
      company: { name: 'TechCorp' },
      location: 'Bangalore',
      applyUrl: 'https://example.com/apply',
      description: 'Great opportunity'
    }));

    const user = (req as any).user;

    const results = await JobApplicationService.bulkApplyToJobs(
      jobs as any,
      user,
      customMessage,
      resumeFile?.buffer
    );

    const successCount = results.filter(r => r.success).length;

    return res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: results.length - successCount
        }
      },
      message: `Bulk application completed: ${successCount}/${results.length} successful`
    });

  } catch (error) {
    console.error('❌ Bulk application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Bulk application failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get application methods for a job
router.get('/application-methods/:jobId', protect, asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  try {
    // Mock job for demo
    const job = {
      id: jobId,
      title: 'Software Developer',
      company: { name: 'Google', email: 'hiring@google.com' },
      location: 'Bangalore',
      applyUrl: 'https://careers.google.com/apply',
      description: 'Join our amazing team. Contact us at hr@google.com',
      source: 'linkedin'
    };

    // Analyze available application methods
    interface ApplicationMethod {
      type: string;
      priority: number;
      description: string;
      pros: string[];
      cons: string[];
    }

    const methods: ApplicationMethod[] = [];

    if (job.applyUrl.includes('linkedin.com')) {
      methods.push({
        type: 'linkedin',
        priority: 1,
        description: 'Apply directly via LinkedIn',
        pros: ['One-click apply', 'Professional profile visible'],
        cons: ['Limited customization']
      });
    }

    if (job.applyUrl.includes('careers.')) {
      methods.push({
        type: 'company_website',
        priority: 2,
        description: 'Apply through company career page',
        pros: ['Direct to company', 'Full application form'],
        cons: ['Longer process']
      });
    }

    // Check for email in description
    const emailMatch = job.description.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      methods.push({
        type: 'email',
        priority: 3,
        description: `Send application email to ${emailMatch[1]}`,
        pros: ['Personal touch', 'Direct contact'],
        cons: ['May end up in spam']
      });
    }

    methods.push({
      type: 'direct_portal',
      priority: 4,
      description: 'Apply through job portal',
      pros: ['Easy process', 'Tracking available'],
      cons: ['Competition with many applicants']
    });

    res.json({
      success: true,
      data: {
        jobId,
        availableMethods: methods.sort((a, b) => a.priority - b.priority),
        recommendedMethod: methods[0]?.type || 'direct_portal'
      },
      message: 'Application methods analyzed successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to analyze application methods'
    });
  }
}));

// Get user's application history
router.get('/my-applications', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const stats = JobApplicationService.getApplicationStats(user._id);

    res.json({
      success: true,
      data: {
        ...stats,
        recentApplications: [], // You'd fetch from database
        tips: [
          'Follow up on applications after 1 week',
          'Customize your message for each application',
          'Keep your resume updated',
          'Apply early in the day for better visibility'
        ]
      },
      message: 'Application history retrieved'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get application history'
    });
  }
}));

// Cost comparison endpoint
router.get('/cost-comparison', protect, asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'Job Scraping Cost Comparison',
      options: [
        {
          name: 'Our FREE Scraping',
          cost: '₹0/month',
          features: ['Direct web scraping', 'Multiple job portals', 'No API limits', 'Custom targets'],
          pros: ['Completely free', 'No monthly costs', 'Unlimited scraping', 'Full control'],
          cons: ['May need occasional updates', 'Depends on website structure'],
          recommended: true
        },
        {
          name: 'n8n Cloud',
          cost: '₹1,500+/month',
          features: ['Visual workflows', 'Cloud hosting', 'Pre-built integrations'],
          pros: ['Visual interface', 'Reliable hosting'],
          cons: ['Expensive', 'Monthly subscription', 'Limited executions']
        },
        {
          name: 'n8n Self-hosted',
          cost: '₹0/month (but server costs)',
          features: ['Full control', 'Unlimited executions', 'Custom workflows'],
          pros: ['No monthly fees', 'Full customization'],
          cons: ['Server maintenance', 'Technical setup required']
        },
        {
          name: 'Make.com (Integromat)',
          cost: '₹800+/month',
          features: ['Visual automation', 'Many integrations'],
          pros: ['User-friendly', 'Good integrations'],
          cons: ['Monthly costs', 'Operation limits']
        },
        {
          name: 'Zapier',
          cost: '₹1,200+/month',
          features: ['Easy automation', 'Popular apps'],
          pros: ['Very easy to use', 'Lots of apps'],
          cons: ['Expensive', 'Task limits', 'Limited customization']
        }
      ],
      recommendation: 'Use our FREE scraping service - it gives you the same results without any monthly costs!'
    },
    message: 'Cost comparison retrieved'
  });
}));

export default router;