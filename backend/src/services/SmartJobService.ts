import axios from 'axios';
import { createClient } from 'redis';
import { Job } from '../models/Job';

// Redis client for caching (optional)
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => {
  console.log('Redis not available (optional service):', err.message);
});

// Try to connect to Redis, but don't crash if it fails
redis.connect().catch(() => {
  console.log('Redis connection failed - continuing without cache');
});

interface JobData {
  _id?: string;
  title: string;
  company: {
    name: string;
    logo?: string;
    website?: string;
  };
  location: string;
  remote?: boolean;
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  description: string;
  requirements?: string[];
  skills?: string[];
  url?: string;
  postedDate?: Date;
  source: string;
  matchPercentage?: number;
  cacheKey?: string;
}

interface JobQuery {
  skills: string[];
  location: string;
  role?: string;
  remote?: boolean;
  salaryMin?: number;
}

interface JobSource {
  name: string;
  dailyLimit: number;
  currentUsage: number;
  priority: number;
}

// Free API sources with their limits
const API_SOURCES: { [key: string]: JobSource } = {
  jsearch: {
    name: 'JSearch',
    dailyLimit: 100, // Free tier monthly limit / 30 days
    currentUsage: 0,
    priority: 1
  },
  adzuna: {
    name: 'Adzuna', 
    dailyLimit: 33, // 1000 monthly / 30 days
    currentUsage: 0,
    priority: 2
  },
  jooble: {
    name: 'Jooble',
    dailyLimit: 500, // 500 daily
    currentUsage: 0,
    priority: 3
  }
};

export class SmartJobService {
  
  // Generate cache key for job queries
  private generateCacheKey(query: JobQuery): string {
    const skills = query.skills.sort().join(',').toLowerCase();
    const location = query.location.toLowerCase().replace(/\s+/g, '-');
    const remote = query.remote ? 'remote' : 'onsite';
    return `jobs:${skills}:${location}:${remote}`;
  }

  // Check if we have fresh cached data
  private async getCachedJobs(cacheKey: string): Promise<JobData[] | null> {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // Return if cache is less than 6 hours old
        if (Date.now() - data.timestamp < 6 * 60 * 60 * 1000) {
          console.log(`✅ Cache HIT for ${cacheKey}`);
          return data.jobs;
        }
      }
      return null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  // Cache jobs with expiration
  private async cacheJobs(cacheKey: string, jobs: JobData[]): Promise<void> {
    try {
      const cacheData = {
        jobs,
        timestamp: Date.now(),
        count: jobs.length
      };
      
      // Cache for 6 hours
      await redis.setEx(cacheKey, 6 * 60 * 60, JSON.stringify(cacheData));
      console.log(`💾 Cached ${jobs.length} jobs for ${cacheKey}`);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  // Get best available API source
  private getBestApiSource(): string | null {
    const availableSources = Object.entries(API_SOURCES)
      .filter(([_, source]) => source.currentUsage < source.dailyLimit)
      .sort((a, b) => a[1].priority - b[1].priority);
    
    return availableSources.length > 0 ? availableSources[0][0] : null;
  }

  // JSearch API integration
  private async fetchFromJSearch(query: JobQuery): Promise<JobData[]> {
    try {
      const options = {
        method: 'GET',
        url: 'https://jsearch.p.rapidapi.com/search',
        params: {
          query: `${query.skills.join(' OR ')} ${query.role || ''} in ${query.location}`,
          page: '1',
          num_pages: '1',
          date_posted: 'week',
          remote_jobs_only: query.remote ? 'true' : 'false'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'demo-key',
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      };

      const response = await axios.request(options);
      API_SOURCES.jsearch.currentUsage++;
      
      return this.parseJSearchResponse(response.data);
    } catch (error) {
      console.error('JSearch API error:', error);
      return [];
    }
  }

  // Adzuna API integration
  private async fetchFromAdzuna(query: JobQuery): Promise<JobData[]> {
    try {
      const baseUrl = 'https://api.adzuna.com/v1/api/jobs/in/search/1';
      const params = {
        app_id: process.env.ADZUNA_APP_ID || 'demo',
        app_key: process.env.ADZUNA_APP_KEY || 'demo',
        what: `${query.skills.join(' ')} ${query.role || ''}`,
        where: query.location,
        results_per_page: 20,
        salary_min: query.salaryMin || 0
      };

      const response = await axios.get(baseUrl, { params });
      API_SOURCES.adzuna.currentUsage++;
      
      return this.parseAdzunaResponse(response.data);
    } catch (error) {
      console.error('Adzuna API error:', error);
      return [];
    }
  }

  // Jooble API integration
  private async fetchFromJooble(query: JobQuery): Promise<JobData[]> {
    try {
      const response = await axios.post('https://jooble.org/api/key', {
        keywords: `${query.skills.join(' ')} ${query.role || ''}`,
        location: query.location
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      API_SOURCES.jooble.currentUsage++;
      return this.parseJoobleResponse(response.data);
    } catch (error) {
      console.error('Jooble API error:', error);
      return [];
    }
  }

  // Parse JSearch response to our format
  private parseJSearchResponse(data: any): JobData[] {
    if (!data.data) return [];
    
    return data.data.map((job: any) => ({
      id: `jsearch_${job.job_id || Date.now()}`,
      title: job.job_title,
      company: {
        name: job.employer_name,
        logo: job.employer_logo,
        website: job.employer_website
      },
      location: `${job.job_city}, ${job.job_country}`,
      remote: job.job_is_remote || false,
      salary: job.job_salary_min ? {
        min: job.job_salary_min,
        max: job.job_salary_max,
        currency: job.job_salary_currency || 'USD',
        period: job.job_salary_period || 'yearly'
      } : undefined,
      description: job.job_description,
      requirements: job.job_highlights?.Qualifications || [],
      skills: this.extractSkills(job.job_description),
      url: job.job_apply_link,
      postedDate: new Date(job.job_posted_at_datetime_utc || Date.now()),
      source: 'jsearch',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  // Parse Adzuna response
  private parseAdzunaResponse(data: any): JobData[] {
    if (!data.results) return [];
    
    return data.results.map((job: any) => ({
      id: `adzuna_${job.id}`,
      title: job.title,
      company: {
        name: job.company.display_name,
        logo: `https://logo.clearbit.com/${job.company.display_name.toLowerCase().replace(/\s+/g, '')}.com`
      },
      location: job.location.display_name,
      remote: job.title.toLowerCase().includes('remote'),
      salary: job.salary_min ? {
        min: job.salary_min,
        max: job.salary_max,
        currency: 'INR',
        period: 'yearly'
      } : undefined,
      description: job.description,
      requirements: [],
      skills: this.extractSkills(job.description),
      url: job.redirect_url,
      postedDate: new Date(job.created),
      source: 'adzuna',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  // Parse Jooble response
  private parseJoobleResponse(data: any): JobData[] {
    if (!data.jobs) return [];
    
    return data.jobs.map((job: any) => ({
      id: `jooble_${Date.now()}_${Math.random()}`,
      title: job.title,
      company: {
        name: job.company
      },
      location: job.location,
      remote: job.title.toLowerCase().includes('remote'),
      description: job.snippet,
      requirements: [],
      skills: this.extractSkills(job.snippet),
      url: job.link,
      postedDate: new Date(job.updated || Date.now()),
      source: 'jooble',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  // Extract skills from job description using keyword matching
  private extractSkills(description: string): string[] {
    const commonSkills = [
      'javascript', 'typescript', 'react', 'node.js', 'python', 'java',
      'spring', 'docker', 'kubernetes', 'aws', 'azure', 'mongodb',
      'postgresql', 'mysql', 'redis', 'git', 'jenkins', 'ci/cd',
      'machine learning', 'tensorflow', 'pytorch', 'data science',
      'blockchain', 'solidity', 'web3', 'nextjs', 'angular', 'vue'
    ];
    
    const lowerDesc = description.toLowerCase();
    return commonSkills.filter(skill => 
      lowerDesc.includes(skill.toLowerCase())
    );
  }

  // Calculate match percentage between resume skills and job
  private calculateMatchPercentage(resumeSkills: string[], jobSkills: string[]): number {
    if (resumeSkills.length === 0) return 0;
    
    const matchedSkills = resumeSkills.filter(skill =>
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );
    
    return Math.round((matchedSkills.length / resumeSkills.length) * 100);
  }

  // Main search function with smart caching
  public async searchJobs(query: JobQuery, resumeSkills: string[] = []): Promise<{
    jobs: JobData[];
    cached: boolean;
    source?: string;
    apiUsage: typeof API_SOURCES;
  }> {
    const cacheKey = this.generateCacheKey(query);
    
    // Try cache first
    const cachedJobs = await this.getCachedJobs(cacheKey);
    if (cachedJobs) {
      return {
        jobs: cachedJobs.map(job => ({
          ...job,
          matchPercentage: this.calculateMatchPercentage(resumeSkills, job.skills || [])
        })),
        cached: true,
        apiUsage: API_SOURCES
      };
    }

    // No cache, fetch from APIs
    console.log(`🔍 Cache MISS for ${cacheKey}, fetching from APIs...`);
    
    const bestSource = this.getBestApiSource();
    if (!bestSource) {
      // All APIs exhausted, return database results
      const dbJobs = await Job.find({
        $or: [
          { skills: { $in: query.skills } },
          { title: { $regex: query.skills.join('|'), $options: 'i' } }
        ],
        location: { $regex: query.location, $options: 'i' }
      }).limit(20);
      
      return {
        jobs: dbJobs.map(job => {
          const jobObject = job.toObject();
          return {
            ...jobObject,
            _id: jobObject._id?.toString(),
            matchPercentage: this.calculateMatchPercentage(resumeSkills, job.skills || [])
          } as JobData;
        }),
        cached: false,
        source: 'database',
        apiUsage: API_SOURCES
      };
    }

    // Fetch from best available source
    let jobs: JobData[] = [];
    let source = bestSource;

    switch (bestSource) {
      case 'jsearch':
        jobs = await this.fetchFromJSearch(query);
        break;
      case 'adzuna':
        jobs = await this.fetchFromAdzuna(query);
        break;
      case 'jooble':
        jobs = await this.fetchFromJooble(query);
        break;
    }

    // Add match percentages
    const jobsWithMatch = jobs.map(job => ({
      ...job,
      matchPercentage: this.calculateMatchPercentage(resumeSkills, job.skills || []),
      cacheKey
    }));

    // Save to database for persistence
    try {
      await Job.insertMany(jobsWithMatch, { ordered: false });
    } catch (error) {
      // Ignore duplicate key errors
      console.log('Some jobs already exist in database');
    }

    // Cache the results
    await this.cacheJobs(cacheKey, jobsWithMatch);

    return {
      jobs: jobsWithMatch.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0)),
      cached: false,
      source,
      apiUsage: API_SOURCES
    };
  }

  // Get popular job searches for pre-caching
  public async getPopularSearches(): Promise<string[]> {
    try {
      const keys = await redis.keys('jobs:*');
      return keys.slice(0, 10); // Top 10 popular searches
    } catch (error) {
      return [];
    }
  }

  // Reset daily API usage (call this daily via cron)
  public resetApiUsage(): void {
    Object.keys(API_SOURCES).forEach(source => {
      API_SOURCES[source].currentUsage = 0;
    });
    console.log('✅ API usage counters reset');
  }

  // Get API usage statistics
  public getApiStats(): typeof API_SOURCES {
    return API_SOURCES;
  }
}

export default new SmartJobService();