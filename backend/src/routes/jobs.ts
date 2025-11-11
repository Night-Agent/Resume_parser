import express, { Request, Response } from 'express';
import { JobService, JobSearchParams as ServiceJobSearchParams } from '../services/jobService';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const jobService = new JobService();

// Interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    skills?: string[];
  };
}

// @desc    Search jobs with AI matching
// @route   GET /api/jobs
// @access  Private
router.get('/', protect, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const {
    q: query,
    skills,
    location,
    remote,
    salaryMin,
    salaryMax,
    experienceLevel,
    page = 1,
    limit = 20
  } = req.query;

  // Parse query parameters
  const searchParams: LocalJobSearchParams = {
    query: query as string,
    location: location as string,
    skills: skills ? (skills as string).split(',').map(s => s.trim()) : [],
    remote: remote === 'true',
    salaryMin: salaryMin ? parseInt(salaryMin as string) : undefined,
    salaryMax: salaryMax ? parseInt(salaryMax as string) : undefined,
    experienceLevel: experienceLevel as string,
    page: parseInt(page as string),
    limit: Math.min(parseInt(limit as string), 50) // Max 50 jobs per page
  };

  // Get user's skills for matching
  const userSkills = req.user?.skills || [];

  try {
    const result = await jobService.searchJobs(searchParams, userSkills);
    
    return res.status(200).json({
      success: true,
      data: result,
      message: `Found ${result.jobs.length} jobs`,
      meta: {
        query: searchParams,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Job search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search jobs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get job recommendations based on user profile
// @route   GET /api/jobs/recommendations
// @access  Private
router.get('/recommendations', protect, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user's skills and preferences
    const userSkills = req.user?.skills || [];
    
    if (userSkills.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No skills found in user profile. Please update your profile or upload a resume.'
      });
      return;
    }

    // Search for jobs matching user skills
    const searchParams: ServiceJobSearchParams = {
      skills: userSkills,
      page: 1,
      limit: 20
    };

    const result = await jobService.searchJobs(searchParams, userSkills);
    
    // Filter for high-match jobs (>= 50% match)
    const recommendedJobs = result.jobs.filter(job => (job.matchPercentage || 0) >= 50);

    res.status(200).json({
      success: true,
      data: {
        jobs: recommendedJobs,
        total: recommendedJobs.length,
        userSkills,
        averageMatch: recommendedJobs.length > 0 
          ? Math.round(recommendedJobs.reduce((sum, job) => sum + (job.matchPercentage || 0), 0) / recommendedJobs.length)
          : 0
      },
      message: `Found ${recommendedJobs.length} recommended jobs`
    });
  } catch (error) {
    console.error('Job recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get job statistics and market insights
// @route   GET /api/jobs/stats
// @access  Private
router.get('/stats', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await jobService.getJobStats();
    
    res.status(200).json({
      success: true,
      data: stats,
      message: 'Job statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get trending skills and job market insights
// @route   GET /api/jobs/trends
// @access  Private
router.get('/trends', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await jobService.getJobStats();
    
    // Enhanced market insights
    const trends = {
      trendingSkills: stats.topSkills.slice(0, 10),
      hotCompanies: stats.topCompanies.slice(0, 8),
      marketInsights: [
        'AI/ML roles showing 67% growth this quarter',
        'Remote work opportunities up 45% from last year',
        'Full-stack developers in highest demand',
        'Cloud skills commanding 30% salary premium',
        'Blockchain developers seeing 85% year-over-year growth'
      ],
      salaryTrends: [
        { skill: 'Machine Learning', avgIncrease: '45%', demand: 'Very High' },
        { skill: 'React.js', avgIncrease: '12%', demand: 'High' },
        { skill: 'AWS', avgIncrease: '35%', demand: 'Very High' },
        { skill: 'Python', avgIncrease: '25%', demand: 'High' },
        { skill: 'Blockchain', avgIncrease: '78%', demand: 'High' }
      ],
      jobGrowthAreas: [
        'Artificial Intelligence & Machine Learning',
        'Cloud Computing & DevOps',
        'Cybersecurity',
        'Data Science & Analytics',
        'Mobile Development'
      ]
    };
    
    res.status(200).json({
      success: true,
      data: trends,
      message: 'Job market trends retrieved successfully'
    });
  } catch (error) {
    console.error('Job trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job trends',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get job filters and available options
// @route   GET /api/jobs/filters
// @access  Private
router.get('/filters', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const filters = {
      locations: [
        'Remote',
        'Bangalore, India',
        'Mumbai, India',
        'Delhi, India',
        'Hyderabad, India',
        'Pune, India',
        'Chennai, India',
        'Kolkata, India',
        'San Francisco, CA',
        'New York, NY',
        'London, UK',
        'Toronto, Canada'
      ],
      experienceLevels: [
        { value: 'entry', label: 'Entry Level (0-2 years)' },
        { value: 'mid', label: 'Mid Level (2-5 years)' },
        { value: 'senior', label: 'Senior Level (5+ years)' },
        { value: 'lead', label: 'Lead/Principal (8+ years)' }
      ],
      salaryRanges: [
        { value: '0-50000', label: 'Up to ₹5 LPA' },
        { value: '50000-100000', label: '₹5-10 LPA' },
        { value: '100000-200000', label: '₹10-20 LPA' },
        { value: '200000-500000', label: '₹20-50 LPA' },
        { value: '500000-1000000', label: '₹50 LPA+' }
      ],
      jobTypes: [
        { value: 'full-time', label: 'Full Time' },
        { value: 'part-time', label: 'Part Time' },
        { value: 'contract', label: 'Contract' },
        { value: 'internship', label: 'Internship' }
      ],
      popularSkills: [
        'JavaScript', 'Python', 'React', 'Node.js', 'Java',
        'AWS', 'Docker', 'Kubernetes', 'Machine Learning',
        'TypeScript', 'Angular', 'Vue.js', 'MongoDB', 'PostgreSQL'
      ]
    };
    
    res.status(200).json({
      success: true,
      data: filters,
      message: 'Job filters retrieved successfully'
    });
  } catch (error) {
    console.error('Job filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job filters',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Refresh job cache
// @route   POST /api/jobs/refresh
// @access  Private
router.post('/refresh', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Clear old cache entries
    const { Job } = await import('../models/Job');
    await (Job as any).cleanOldCache(0); // Remove all cache
    
    res.status(200).json({
      success: true,
      message: 'Job cache refreshed successfully'
    });
  } catch (error) {
    console.error('Cache refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh job cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Job search parameters interface
interface LocalJobSearchParams {
  query: string;
  location?: string;
  salary?: string;
  experience?: string;
  jobType?: string;
  skills?: string[];
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  page?: number;
  limit?: number;
}

// Enhanced job interface
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  requirements: string[];
  benefits?: string[];
  postedDate: string;
  jobType: string;
  experienceLevel: string;
  remote: boolean;
  matchScore?: number;
}

// @desc    Search jobs
// @route   POST /api/jobs/search
// @access  Public
router.post('/search', asyncHandler(async (req, res) => {
  try {
    const { query, location, limit = 20 }: ServiceJobSearchParams = req.body;
    
    // Mock job data for demonstration
    const mockJobs: Job[] = [
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        salary: '$120,000 - $160,000',
        description: 'We are looking for a senior software engineer to join our team.',
        requirements: ['JavaScript', 'React', 'Node.js', 'AWS'],
        benefits: ['Health insurance', 'Remote work', '401k matching'],
        postedDate: new Date().toISOString(),
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        remote: true,
        matchScore: 95
      },
      {
        id: '2',
        title: 'Full Stack Developer',
        company: 'Innovation Labs',
        location: 'Austin, TX',
        salary: '$90,000 - $130,000',
        description: 'Build modern web applications with cutting-edge technologies.',
        requirements: ['JavaScript', 'React', 'Python', 'MongoDB'],
        benefits: ['Flexible hours', 'Learning budget', 'Health insurance'],
        postedDate: new Date().toISOString(),
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        remote: true,
        matchScore: 88
      },
      {
        id: '3',
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        location: 'Remote',
        salary: '$70,000 - $100,000',
        description: 'Create amazing user experiences with React and TypeScript.',
        requirements: ['React', 'TypeScript', 'CSS', 'Git'],
        benefits: ['Remote work', 'Stock options', 'Flexible schedule'],
        postedDate: new Date().toISOString(),
        jobType: 'Full-time',
        experienceLevel: 'Junior',
        remote: true,
        matchScore: 82
      }
    ];

    // Filter jobs based on search criteria
    let filteredJobs = mockJobs;
    
    if (query) {
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.description.toLowerCase().includes(query.toLowerCase()) ||
        job.requirements.some(req => req.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    if (location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(location.toLowerCase()) ||
        job.remote
      );
    }

    // Sort by match score
    filteredJobs = filteredJobs
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: filteredJobs,
      totalResults: filteredJobs.length,
      searchParams: { query, location, limit }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Job search failed',
      details: error.message
    });
  }
}));

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock job data
    const job: Job = {
      id: id,
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120,000 - $160,000',
      description: 'We are looking for a senior software engineer to join our dynamic team. You will work on cutting-edge projects using modern technologies and contribute to scalable solutions.',
      requirements: ['JavaScript', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes'],
      benefits: ['Health insurance', 'Remote work', '401k matching', 'Stock options', 'Unlimited PTO'],
      postedDate: new Date().toISOString(),
      jobType: 'Full-time',
      experienceLevel: 'Senior',
      remote: true,
      matchScore: 95
    };

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job details',
      details: error.message
    });
  }
}));

// @desc    Get job recommendations
// @route   POST /api/jobs/recommendations
// @access  Private
router.post('/recommendations', asyncHandler(async (req, res) => {
  try {
    const { skills, experience, preferences } = req.body;
    
    const recommendations = [
      {
        id: '1',
        title: 'Senior React Developer',
        company: 'Google',
        matchScore: 98,
        reason: 'Perfect skill match for React and JavaScript',
        salary: '$140,000 - $180,000',
        location: 'Mountain View, CA',
        remote: true
      },
      {
        id: '2',
        title: 'Full Stack Engineer',
        company: 'Microsoft',
        matchScore: 94,
        reason: 'Strong match for full-stack development',
        salary: '$130,000 - $170,000',
        location: 'Seattle, WA',
        remote: true
      },
      {
        id: '3',
        title: 'Frontend Architect',
        company: 'Netflix',
        matchScore: 91,
        reason: 'Leadership opportunity with frontend focus',
        salary: '$150,000 - $200,000',
        location: 'Los Gatos, CA',
        remote: true
      }
    ];

    res.status(200).json({
      success: true,
      data: recommendations,
      insights: {
        averageMatchScore: 94,
        totalOpportunities: recommendations.length,
        marketTrend: 'High demand for your skill set',
        salaryRange: '$130,000 - $200,000'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
      details: error.message
    });
  }
}));

// @desc    Save job
// @route   POST /api/jobs/:id/save
// @access  Private
router.post('/:id/save', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Mock save functionality
    const savedJob = {
      id: id,
      userId: userId,
      savedAt: new Date().toISOString(),
      status: 'saved'
    };

    res.status(200).json({
      success: true,
      data: savedJob,
      message: 'Job saved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to save job',
      details: error.message
    });
  }
}));

// @desc    Apply to job
// @route   POST /api/jobs/:id/apply
// @access  Private
router.post('/:id/apply', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, resumeId, coverLetter } = req.body;
    
    // Mock application functionality
    const application = {
      id: Math.random().toString(36).substr(2, 9),
      jobId: id,
      userId: userId,
      resumeId: resumeId,
      coverLetter: coverLetter,
      appliedAt: new Date().toISOString(),
      status: 'submitted'
    };

    res.status(200).json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to submit application',
      details: error.message
    });
  }
}));

export default router;