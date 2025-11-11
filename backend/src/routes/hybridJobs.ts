import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth';
import HybridJobService from '../services/HybridJobService';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Hybrid job search (n8n + APIs + deduplication)
router.get('/hybrid-search', protect, asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const {
    skills,
    location = 'India',
    role,
    remote,
    salaryMin,
    resumeSkills
  } = req.query;

  if (!skills) {
    return res.status(400).json({
      success: false,
      message: 'Skills parameter is required'
    });
  }

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
    console.log(`🔍 Starting hybrid search for: ${jobQuery.skills.join(', ')} in ${jobQuery.location}`);
    
    const result = await HybridJobService.searchJobsHybrid(jobQuery, userResumeSkills);
    
    return res.json({
      success: true,
      data: {
        jobs: result.jobs,
        count: result.jobs.length,
        metadata: result.metadata,
        query: jobQuery,
        timestamp: new Date().toISOString()
      },
      message: result.metadata.cacheUsed 
        ? `✅ Found ${result.jobs.length} cached jobs (${result.metadata.duplicatesRemoved} duplicates removed)`
        : `🚀 Found ${result.jobs.length} fresh jobs from ${result.metadata.sourcesUsed.length} sources (${result.metadata.duplicatesRemoved} duplicates removed)`
    });

  } catch (error) {
    console.error('❌ Hybrid search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search jobs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get deduplication statistics
router.get('/dedup-stats', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await HybridJobService.getDeduplicationStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Deduplication statistics retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get deduplication statistics'
    });
  }
}));

// Test n8n connection
router.post('/test-n8n', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const testQuery = {
      skills: ['javascript', 'react'],
      location: 'Bangalore',
      role: 'Frontend Developer'
    };

    const result = await HybridJobService.searchJobsHybrid(testQuery);
    
    res.json({
      success: true,
      data: {
        n8nWorking: result.metadata.sourcesUsed.includes('n8n'),
        totalSources: result.metadata.sourcesUsed.length,
        sourcesUsed: result.metadata.sourcesUsed,
        jobsFound: result.jobs.length,
        fetchTime: result.metadata.fetchTime
      },
      message: 'n8n connection test completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'n8n connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Advanced filtering with deduplication
router.post('/advanced-filter', protect, asyncHandler(async (req: Request, res: Response) => {
  const {
    skills,
    location,
    minSalary,
    maxSalary,
    remote,
    companies,
    datePosted,
    minMatchPercentage = 30
  } = req.body;

  try {
    // Get base results from hybrid search
    const baseQuery = {
      skills: skills || ['javascript'],
      location: location || 'India'
    };

    const result = await HybridJobService.searchJobsHybrid(baseQuery, skills);
    let filteredJobs = result.jobs;

    // Apply advanced filters
    if (minMatchPercentage) {
      filteredJobs = filteredJobs.filter(job => 
        (job.matchPercentage || 0) >= minMatchPercentage
      );
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
        new Date(job.postedDate) >= cutoffDate
      );
    }

    // Group by source for analysis
    const sourceBreakdown = filteredJobs.reduce((acc, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        jobs: filteredJobs,
        count: filteredJobs.length,
        filters: req.body,
        sourceBreakdown,
        metadata: {
          ...result.metadata,
          postFilterCount: filteredJobs.length,
          filtersApplied: Object.keys(req.body).length
        }
      },
      message: `Found ${filteredJobs.length} jobs after filtering (${result.metadata.duplicatesRemoved} duplicates removed)`
    });

  } catch (error) {
    console.error('❌ Advanced filtering error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter jobs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Real-time job monitoring (simulated)
router.get('/real-time-stream', protect, (req: Request, res: Response) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    message: 'Real-time job stream connected',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Simulate real-time job updates every 30 seconds
  const interval = setInterval(async () => {
    try {
      // In production, this would monitor for new jobs
      const mockNewJob = {
        type: 'new_job',
        job: {
          id: `realtime_${Date.now()}`,
          title: 'Senior React Developer',
          company: { name: 'TechStartup Inc' },
          location: 'Bangalore',
          matchPercentage: Math.floor(Math.random() * 40) + 60,
          source: 'live_feed',
          postedDate: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      res.write(`data: ${JSON.stringify(mockNewJob)}\n\n`);
    } catch (error) {
      console.error('SSE error:', error);
    }
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    console.log('SSE client disconnected');
  });
});

// Job analytics and insights
router.get('/analytics', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Mock analytics data (in production, analyze from database)
    const analytics = {
      topSkills: [
        { skill: 'JavaScript', jobs: 245, avgSalary: '₹12L', growth: '+15%' },
        { skill: 'Python', jobs: 189, avgSalary: '₹14L', growth: '+28%' },
        { skill: 'React', jobs: 167, avgSalary: '₹11L', growth: '+12%' },
        { skill: 'Node.js', jobs: 134, avgSalary: '₹13L', growth: '+18%' },
        { skill: 'AWS', jobs: 98, avgSalary: '₹16L', growth: '+35%' }
      ],
      topCompanies: [
        { company: 'Google', jobs: 45, avgMatch: 78 },
        { company: 'Microsoft', jobs: 38, avgMatch: 82 },
        { company: 'Amazon', jobs: 42, avgMatch: 65 },
        { company: 'Flipkart', jobs: 56, avgMatch: 88 }
      ],
      locationTrends: [
        { location: 'Bangalore', jobs: 389, avgSalary: '₹13.5L' },
        { location: 'Mumbai', jobs: 267, avgSalary: '₹14.2L' },
        { location: 'Pune', jobs: 198, avgSalary: '₹11.8L' },
        { location: 'Hyderabad', jobs: 156, avgSalary: '₹12.3L' }
      ],
      duplicateStats: {
        totalJobsScraped: 1247,
        uniqueJobsAfterDedup: 892,
        duplicatesRemoved: 355,
        deduplicationRate: '28.5%'
      },
      sourceEfficiency: {
        n8n: { jobs: 445, duplicateRate: '22%', avgQuality: 8.2 },
        jsearch: { jobs: 234, duplicateRate: '15%', avgQuality: 9.1 },
        adzuna: { jobs: 213, duplicateRate: '31%', avgQuality: 7.8 }
      }
    };

    res.json({
      success: true,
      data: analytics,
      generatedAt: new Date().toISOString(),
      message: 'Job market analytics retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics'
    });
  }
}));

export default router;