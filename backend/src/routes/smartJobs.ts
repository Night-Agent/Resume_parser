import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth';
import SmartJobService from '../services/SmartJobService';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Enhanced job search with smart caching
router.get('/search', protect, asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const {
    skills,
    location = 'India',
    role,
    remote,
    salaryMin,
    resumeSkills
  } = req.query;

  // Validate required parameters
  if (!skills) {
    return res.status(400).json({
      success: false,
      message: 'Skills parameter is required'
    });
  }

  // Parse query parameters
  const jobQuery = {
    skills: Array.isArray(skills) ? skills as string[] : (skills as string).split(','),
    location: location as string,
    role: role as string,
    remote: remote === 'true',
    salaryMin: salaryMin ? parseInt(salaryMin as string) : undefined
  };

  const userResumeSkills = resumeSkills 
    ? Array.isArray(resumeSkills) 
      ? resumeSkills as string[] 
      : (resumeSkills as string).split(',')
    : [];

  try {
    const result = await SmartJobService.searchJobs(jobQuery, userResumeSkills);
    
    return res.json({
      success: true,
      data: {
        jobs: result.jobs,
        count: result.jobs.length,
        cached: result.cached,
        source: result.source,
        query: jobQuery,
        apiUsage: result.apiUsage,
        timestamp: new Date().toISOString()
      },
      message: result.cached 
        ? `Found ${result.jobs.length} cached jobs`
        : `Found ${result.jobs.length} fresh jobs from ${result.source}`
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

// Get trending job searches
router.get('/trending', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const popularSearches = await SmartJobService.getPopularSearches();
    
    res.json({
      success: true,
      data: {
        searches: popularSearches,
        count: popularSearches.length
      },
      message: 'Popular searches retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get trending searches'
    });
  }
}));

// Get API usage statistics
router.get('/api-stats', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = SmartJobService.getApiStats();
    
    res.json({
      success: true,
      data: {
        sources: stats,
        totalUsage: Object.values(stats).reduce((sum, source) => sum + source.currentUsage, 0),
        availableRequests: Object.values(stats).reduce((sum, source) => sum + (source.dailyLimit - source.currentUsage), 0)
      },
      message: 'API statistics retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get API statistics'
    });
  }
}));

// Advanced job filtering
router.post('/filter', protect, asyncHandler(async (req: Request, res: Response) => {
  const {
    skills,
    location,
    minSalary,
    maxSalary,
    remote,
    companies,
    datePosted,
    experienceLevel,
    jobType
  } = req.body;

  try {
    // Start with basic search
    const baseQuery = {
      skills: skills || [],
      location: location || 'India'
    };

    const result = await SmartJobService.searchJobs(baseQuery);
    let filteredJobs = result.jobs;

    // Apply additional filters
    if (minSalary || maxSalary) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.salary) return !minSalary; // Include jobs without salary if no min requirement
        const jobSalary = job.salary.min || 0;
        return (!minSalary || jobSalary >= minSalary) && 
               (!maxSalary || jobSalary <= maxSalary);
      });
    }

    if (remote !== undefined) {
      filteredJobs = filteredJobs.filter(job => job.remote === remote);
    }

    if (companies && companies.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        companies.some((company: string) => 
          job.company.name.toLowerCase().includes(company.toLowerCase())
        )
      );
    }

    if (datePosted) {
      const cutoffDate = new Date();
      const days = datePosted === 'today' ? 1 : 
                  datePosted === 'week' ? 7 : 
                  datePosted === 'month' ? 30 : 365;
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filteredJobs = filteredJobs.filter(job => 
        job.postedDate && new Date(job.postedDate) >= cutoffDate
      );
    }

    // Sort by match percentage and date
    filteredJobs.sort((a, b) => {
      const matchDiff = (b.matchPercentage || 0) - (a.matchPercentage || 0);
      if (matchDiff !== 0) return matchDiff;
      const aDate = a.postedDate ? new Date(a.postedDate).getTime() : 0;
      const bDate = b.postedDate ? new Date(b.postedDate).getTime() : 0;
      return bDate - aDate;
    });

    res.json({
      success: true,
      data: {
        jobs: filteredJobs,
        count: filteredJobs.length,
        filters: req.body,
        cached: result.cached,
        source: result.source
      },
      message: `Found ${filteredJobs.length} jobs matching your criteria`
    });

  } catch (error) {
    console.error('Job filtering error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter jobs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Job recommendations based on user profile
router.get('/recommendations/:userId', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // TODO: Get user's resume skills from database
    // For now, using sample skills
    const userSkills = ['javascript', 'react', 'node.js', 'mongodb'];
    const userLocation = 'Bangalore';

    const recommendations = await SmartJobService.searchJobs({
      skills: userSkills,
      location: userLocation
    }, userSkills);

    // Get top 20 matches
    const topJobs = recommendations.jobs
      .filter(job => (job.matchPercentage || 0) > 30)
      .slice(0, 20);

    res.json({
      success: true,
      data: {
        jobs: topJobs,
        count: topJobs.length,
        averageMatch: topJobs.reduce((sum, job) => sum + (job.matchPercentage || 0), 0) / topJobs.length,
        cached: recommendations.cached
      },
      message: `Found ${topJobs.length} personalized job recommendations`
    });

  } catch (error) {
    console.error('Job recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job recommendations'
    });
  }
}));

// Bulk cache popular searches (admin endpoint)
router.post('/cache/populate', protect, asyncHandler(async (req: Request, res: Response) => {
  const popularQueries = [
    { skills: ['javascript', 'react'], location: 'Bangalore' },
    { skills: ['python', 'django'], location: 'Mumbai' },
    { skills: ['java', 'spring'], location: 'Pune' },
    { skills: ['node.js', 'express'], location: 'Hyderabad' },
    { skills: ['machine learning', 'python'], location: 'Delhi' }
  ];

  try {
    const results = await Promise.all(
      popularQueries.map(query => SmartJobService.searchJobs(query))
    );

    const totalJobs = results.reduce((sum, result) => sum + result.jobs.length, 0);

    res.json({
      success: true,
      data: {
        queriesProcessed: popularQueries.length,
        totalJobsCached: totalJobs,
        queries: popularQueries
      },
      message: 'Popular searches cached successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to populate cache'
    });
  }
}));

// Reset API usage (admin endpoint - call daily)
router.post('/admin/reset-usage', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    SmartJobService.resetApiUsage();
    
    res.json({
      success: true,
      message: 'API usage counters reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset API usage'
    });
  }
}));

export default router;