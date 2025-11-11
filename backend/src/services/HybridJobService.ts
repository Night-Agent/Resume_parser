import axios from 'axios';
import { createClient } from 'redis';
import { Job, IJob } from '../models/Job';
import crypto from 'crypto';
import FreeJobScrapingService from './FreeJobScrapingService';

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

interface JobQuery {
  skills: string[];
  location: string;
  role?: string;
  remote?: boolean;
  salaryMin?: number;
}

interface RawJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
  postedDate?: string;
  source: string;
  logo?: string;
}

export class HybridJobService {
  
  // Generate unique job fingerprint for deduplication
  private generateJobFingerprint(job: RawJob): string {
    const normalizedTitle = job.title.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
    
    const normalizedCompany = job.company.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    const normalizedLocation = job.location.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    const fingerprint = `${normalizedTitle}_${normalizedCompany}_${normalizedLocation}`;
    return crypto.createHash('md5').update(fingerprint).digest('hex');
  }

  // Advanced job deduplication
  private deduplicateJobs(jobs: RawJob[]): RawJob[] {
    const seenFingerprints = new Set<string>();
    const uniqueJobs: RawJob[] = [];
    const duplicateStats = {
      total: jobs.length,
      duplicates: 0,
      unique: 0
    };

    for (const job of jobs) {
      const fingerprint = this.generateJobFingerprint(job);
      
      if (!seenFingerprints.has(fingerprint)) {
        seenFingerprints.add(fingerprint);
        uniqueJobs.push({
          ...job,
          // Add deduplication metadata
          _fingerprint: fingerprint,
          _isDuplicate: false
        } as any);
        duplicateStats.unique++;
      } else {
        duplicateStats.duplicates++;
        console.log(`🔄 Duplicate removed: ${job.title} at ${job.company}`);
      }
    }

    console.log(`✅ Deduplication complete: ${duplicateStats.unique} unique jobs from ${duplicateStats.total} total (${duplicateStats.duplicates} duplicates removed)`);
    return uniqueJobs;
  }

  // Enhanced similarity checking for fuzzy duplicates
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // FREE Job Scraping - No n8n needed!
  private async fetchFromFreeScrapers(query: JobQuery): Promise<RawJob[]> {
    try {
      console.log('🆓 Starting FREE job scraping (No monthly costs!)...');
      
      // Use our FREE scraping service
      const jobs = await FreeJobScrapingService.scrapeJobsDirectly(query.skills, query.location);
      
      // Convert to our internal format
      const convertedJobs: RawJob[] = jobs.map((job: any) => ({
        title: job.title,
        company: job.company?.name || job.company,
        location: job.location,
        description: job.description || '',
        url: job.applyUrl || '#',
        salary: job.salary ? `${job.salary.currency}${job.salary.min || ''}-${job.salary.max || ''}` : undefined,
        postedDate: job.postedDate,
        source: job.source + '_free',
        logo: job.company?.logo || this.generateCompanyLogo(job.company?.name || job.company)
      }));
      
      console.log(`✅ FREE scrapers returned ${convertedJobs.length} jobs (₹0 cost!)`);
      return convertedJobs;
      
    } catch (error: any) {
      console.error('❌ FREE scraping error:', error.message);
      return [];
    }
  }

  // Fetch from JSearch API
  private async fetchFromJSearch(query: JobQuery): Promise<RawJob[]> {
    try {
      const options = {
        method: 'GET',
        url: 'https://jsearch.p.rapidapi.com/search',
        params: {
          query: `${query.skills.join(' OR ')} ${query.role || ''} in ${query.location}`,
          page: '1',
          num_pages: '1',
          date_posted: 'week'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'demo-key',
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      };

      const response = await axios.request(options);
      const jobs = response.data.data || [];
      
      console.log(`📊 JSearch returned ${jobs.length} jobs`);
      
      return jobs.map((job: any) => ({
        title: job.job_title,
        company: job.employer_name,
        location: `${job.job_city}, ${job.job_country}`,
        description: job.job_description,
        url: job.job_apply_link,
        salary: job.job_salary_min ? `${job.job_salary_min}-${job.job_salary_max} ${job.job_salary_currency}` : undefined,
        postedDate: job.job_posted_at_datetime_utc,
        source: 'jsearch_api',
        logo: job.employer_logo
      }));
      
    } catch (error: any) {
      console.error('❌ JSearch fetch error:', error.message);
      return [];
    }
  }

  // Fetch from Adzuna API
  private async fetchFromAdzuna(query: JobQuery): Promise<RawJob[]> {
    try {
      const baseUrl = 'https://api.adzuna.com/v1/api/jobs/in/search/1';
      const params = {
        app_id: process.env.ADZUNA_APP_ID || 'demo',
        app_key: process.env.ADZUNA_APP_KEY || 'demo',
        what: `${query.skills.join(' ')} ${query.role || ''}`,
        where: query.location,
        results_per_page: 20
      };

      const response = await axios.get(baseUrl, { params });
      const jobs = response.data.results || [];
      
      console.log(`📊 Adzuna returned ${jobs.length} jobs`);
      
      return jobs.map((job: any) => ({
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        description: job.description,
        url: job.redirect_url,
        salary: job.salary_min ? `₹${job.salary_min}-${job.salary_max}` : undefined,
        postedDate: job.created,
        source: 'adzuna_api',
        logo: this.generateCompanyLogo(job.company.display_name)
      }));
      
    } catch (error: any) {
      console.error('❌ Adzuna fetch error:', error.message);
      return [];
    }
  }

  // Generate company logo URL
  private generateCompanyLogo(companyName: string): string {
    const cleanName = companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    return `https://logo.clearbit.com/${cleanName}.com`;
  }

  // Cache results with metadata
  private async cacheResults(cacheKey: string, jobs: IJob[], metadata: any): Promise<void> {
    try {
      const cacheData = {
        jobs,
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          ttl: 6 * 60 * 60 * 1000 // 6 hours
        }
      };
      
      await redis.setEx(cacheKey, 6 * 60 * 60, JSON.stringify(cacheData));
      console.log(`💾 Cached ${jobs.length} jobs with metadata`);
    } catch (error: any) {
      console.error('Cache write error:', error);
    }
  }

  // Main hybrid search function
  public async searchJobsHybrid(query: JobQuery, resumeSkills: string[] = []): Promise<{
    jobs: IJob[];
    metadata: {
      totalSources: number;
      sourcesUsed: string[];
      duplicatesRemoved: number;
      cacheUsed: boolean;
      fetchTime: number;
      totalFetched: number;
      finalCount: number;
    };
  }> {
    const startTime = Date.now();
    const cacheKey = `hybrid:${JSON.stringify(query)}`;
    
    // Check cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.metadata.timestamp < data.metadata.ttl) {
          console.log('✅ Cache HIT - returning cached results');
          return {
            jobs: data.jobs,
            metadata: {
              ...data.metadata,
              cacheUsed: true,
              fetchTime: Date.now() - startTime
            }
          };
        }
      }
    } catch (error: any) {
      console.log('Cache miss, fetching fresh data...');
    }

    console.log('🚀 Starting FREE job search (No monthly costs!)...');
    
    // Fetch from all sources in parallel
    const [freeJobs, jsearchJobs, adzunaJobs] = await Promise.allSettled([
      this.fetchFromFreeScrapers(query),
      this.fetchFromJSearch(query),
      this.fetchFromAdzuna(query)
    ]);

    // Collect successful results
    const allRawJobs: RawJob[] = [];
    const sourcesUsed: string[] = [];

    if (freeJobs.status === 'fulfilled' && freeJobs.value.length > 0) {
      allRawJobs.push(...freeJobs.value);
      sourcesUsed.push('free_scrapers');
    }

    if (jsearchJobs.status === 'fulfilled' && jsearchJobs.value.length > 0) {
      allRawJobs.push(...jsearchJobs.value);
      sourcesUsed.push('jsearch');
    }

    if (adzunaJobs.status === 'fulfilled' && adzunaJobs.value.length > 0) {
      allRawJobs.push(...adzunaJobs.value);
      sourcesUsed.push('adzuna');
    }

    console.log(`📊 Collected ${allRawJobs.length} jobs from ${sourcesUsed.length} sources`);

    // Deduplicate jobs
    const totalFetched = allRawJobs.length;
    const uniqueJobs = this.deduplicateJobs(allRawJobs);
    const duplicatesRemoved = totalFetched - uniqueJobs.length;

    // Convert to IJob format and add match scores
    const processedJobs: IJob[] = uniqueJobs.map((job, index) => ({
      id: `hybrid_${Date.now()}_${index}`,
      title: job.title,
      company: {
        name: job.company,
        logo: job.logo
      },
      location: job.location,
      remote: job.title.toLowerCase().includes('remote') || job.location.toLowerCase().includes('remote'),
      description: job.description,
      requirements: this.extractRequirements(job.description),
      skills: this.extractSkills(job.description),
      url: job.url,
      postedDate: new Date(job.postedDate || Date.now()),
      source: job.source,
      matchPercentage: this.calculateMatchPercentage(resumeSkills, this.extractSkills(job.description)),
      createdAt: new Date(),
      updatedAt: new Date()
    } as IJob));

    // Sort by match percentage and recency
    processedJobs.sort((a, b) => {
      const matchDiff = (b.matchPercentage || 0) - (a.matchPercentage || 0);
      if (matchDiff !== 0) return matchDiff;
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    });

    const metadata = {
      totalSources: 3,
      sourcesUsed,
      duplicatesRemoved,
      cacheUsed: false,
      fetchTime: Date.now() - startTime,
      totalFetched,
      finalCount: processedJobs.length
    };

    // Cache results
    await this.cacheResults(cacheKey, processedJobs, metadata);

    // Save to database for persistence
    try {
      await Job.insertMany(processedJobs, { ordered: false });
    } catch (error: any) {
      console.log('Some jobs already exist in database');
    }

    console.log(`✅ Hybrid search complete: ${processedJobs.length} unique jobs in ${metadata.fetchTime}ms`);

    return {
      jobs: processedJobs,
      metadata
    };
  }

  // Extract skills from job description
  private extractSkills(description: string): string[] {
    const commonSkills = [
      'javascript', 'typescript', 'react', 'node.js', 'python', 'java',
      'spring', 'docker', 'kubernetes', 'aws', 'azure', 'mongodb',
      'postgresql', 'mysql', 'redis', 'git', 'jenkins', 'ci/cd'
    ];
    
    const lowerDesc = description.toLowerCase();
    return commonSkills.filter(skill => 
      lowerDesc.includes(skill.toLowerCase())
    );
  }

  // Extract requirements from job description
  private extractRequirements(description: string): string[] {
    const requirementIndicators = [
      'requirements:', 'required:', 'must have:', 'qualifications:',
      'skills required:', 'essential:', 'mandatory:'
    ];
    
    const lowerDesc = description.toLowerCase();
    const requirements: string[] = [];
    
    requirementIndicators.forEach(indicator => {
      const index = lowerDesc.indexOf(indicator);
      if (index !== -1) {
        const section = description.substring(index, index + 500);
        const lines = section.split('\n').slice(1, 6); // Get next 5 lines
        requirements.push(...lines.filter(line => line.trim().length > 10));
      }
    });
    
    return requirements.slice(0, 10); // Limit to 10 requirements
  }

  // Calculate match percentage
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

  // Get deduplication statistics
  public async getDeduplicationStats(): Promise<any> {
    try {
      const keys = await redis.keys('hybrid:*');
      const stats = {
        totalCachedSearches: keys.length,
        averageResults: 0,
        topSources: {} as any
      };
      
      return stats;
    } catch (error: any) {
      return { error: 'Failed to get stats' };
    }
  }
}

export default new HybridJobService();