import axios from 'axios';
import { Job } from '../models/Job';

// Interface for different job API providers
interface JobProvider {
  name: string;
  fetchJobs(params: JobSearchParams): Promise<JobListing[]>;
}

interface JobSearchParams {
  query?: string;
  location?: string;
  skills?: string[];
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  page?: number;
  limit?: number;
}

interface JobListing {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
    website?: string;
  };
  location: string;
  remote: boolean;
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  description: string;
  requirements: string[];
  skills: string[];
  url: string;
  postedDate: Date;
  source: string;
  matchPercentage?: number;
}

// JSearch API Provider (RapidAPI)
class JSearchProvider implements JobProvider {
  name = 'JSearch';
  private apiKey: string;
  private baseUrl = 'https://jsearch.p.rapidapi.com';

  constructor() {
    this.apiKey = process.env.JSEARCH_API_KEY || '';
    if (!this.apiKey) {
      console.warn('JSearch API key not found. Please set JSEARCH_API_KEY environment variable.');
    }
  }

  async fetchJobs(params: JobSearchParams): Promise<JobListing[]> {
    try {
      if (!this.apiKey) {
        console.warn('JSearch API key not configured, using demo data');
        return this.getDemoJobs(params);
      }

      // Build query string
      const query = this.buildQuery(params);
      
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        },
        params: {
          query,
          page: params.page || 1,
          num_pages: '1',
          remote_jobs_only: params.remote || false
        },
        timeout: 10000
      });

      if (response.data && response.data.data) {
        return this.transformJSearchJobs(response.data.data);
      }

      return this.getDemoJobs(params);
    } catch (error) {
      console.error('JSearch API error:', error);
      console.log('Falling back to demo data');
      return this.getDemoJobs(params);
    }
  }

  private getDemoJobs(params: JobSearchParams): JobListing[] {
    const demoJobs: JobListing[] = [
      {
        id: 'demo_1',
        title: 'Senior Full Stack Developer',
        company: {
          name: 'TechCorp Inc.',
          logo: 'https://via.placeholder.com/100',
          website: 'https://techcorp.com'
        },
        location: 'San Francisco, CA',
        remote: true,
        salary: {
          min: 120000,
          max: 180000,
          currency: 'USD',
          period: 'yearly'
        },
        description: 'We are seeking a Senior Full Stack Developer to join our growing team. You will work on cutting-edge projects using React, Node.js, and cloud technologies. Strong experience with JavaScript, TypeScript, and modern web frameworks required.',
        requirements: [
          '5+ years of full stack development experience',
          'Proficiency in React and Node.js',
          'Experience with cloud platforms (AWS/Azure)',
          'Strong understanding of database design'
        ],
        skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB', 'GraphQL'],
        url: '#',
        postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        source: 'Demo'
      },
      {
        id: 'demo_2',
        title: 'Machine Learning Engineer',
        company: {
          name: 'AI Innovations',
          logo: 'https://via.placeholder.com/100',
          website: 'https://aiinnovations.com'
        },
        location: 'New York, NY',
        remote: false,
        salary: {
          min: 140000,
          max: 200000,
          currency: 'USD',
          period: 'yearly'
        },
        description: 'Join our AI team to develop cutting-edge machine learning models. Work with Python, TensorFlow, and PyTorch to solve complex business problems. Experience with deep learning and MLOps required.',
        requirements: [
          'PhD or Masters in Computer Science/AI',
          '3+ years of ML engineering experience',
          'Proficiency in Python and ML frameworks',
          'Experience with model deployment and monitoring'
        ],
        skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Docker', 'Kubernetes', 'MLOps'],
        url: '#',
        postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        source: 'Demo'
      },
      {
        id: 'demo_3',
        title: 'Frontend Developer',
        company: {
          name: 'Design Studio Pro',
          logo: 'https://via.placeholder.com/100',
          website: 'https://designstudio.com'
        },
        location: 'Austin, TX',
        remote: true,
        salary: {
          min: 90000,
          max: 130000,
          currency: 'USD',
          period: 'yearly'
        },
        description: 'We\'re looking for a creative Frontend Developer to build beautiful, responsive web applications. Strong skills in React, CSS, and modern JavaScript required. Experience with design systems is a plus.',
        requirements: [
          '3+ years of frontend development experience',
          'Expert-level React and JavaScript skills',
          'Strong CSS and responsive design skills',
          'Experience with modern build tools'
        ],
        skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Tailwind CSS', 'Next.js', 'Figma'],
        url: '#',
        postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        source: 'Demo'
      },
      {
        id: 'demo_4',
        title: 'DevOps Engineer',
        company: {
          name: 'CloudTech Solutions',
          logo: 'https://via.placeholder.com/100',
          website: 'https://cloudtech.com'
        },
        location: 'Seattle, WA',
        remote: true,
        salary: {
          min: 110000,
          max: 160000,
          currency: 'USD',
          period: 'yearly'
        },
        description: 'Join our DevOps team to build and maintain scalable cloud infrastructure. Experience with AWS, Docker, Kubernetes, and CI/CD pipelines required. Help us automate everything!',
        requirements: [
          '4+ years of DevOps experience',
          'Strong AWS and cloud infrastructure skills',
          'Experience with containerization and orchestration',
          'Proficiency in Infrastructure as Code'
        ],
        skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Python', 'Linux'],
        url: '#',
        postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        source: 'Demo'
      },
      {
        id: 'demo_5',
        title: 'Data Scientist',
        company: {
          name: 'Analytics Pro',
          logo: 'https://via.placeholder.com/100',
          website: 'https://analyticspro.com'
        },
        location: 'Boston, MA',
        remote: false,
        salary: {
          min: 125000,
          max: 175000,
          currency: 'USD',
          period: 'yearly'
        },
        description: 'We\'re seeking a Data Scientist to extract insights from large datasets. Strong skills in Python, SQL, and statistical analysis required. Experience with machine learning and data visualization is essential.',
        requirements: [
          'Masters in Data Science or related field',
          '3+ years of data science experience',
          'Proficiency in Python and SQL',
          'Experience with statistical modeling'
        ],
        skills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib', 'Jupyter'],
        url: '#',
        postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        source: 'Demo'
      }
    ];

    // Filter demo jobs based on search parameters
    let filteredJobs = demoJobs;

    if (params.query) {
      const query = params.query.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }

    if (params.remote !== undefined) {
      filteredJobs = filteredJobs.filter(job => job.remote === params.remote);
    }

    if (params.skills && params.skills.length > 0) {
      filteredJobs = filteredJobs.filter(job =>
        params.skills!.some(skill =>
          job.skills.some(jobSkill =>
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    return filteredJobs;
  }

  private buildQuery(params: JobSearchParams): string {
    let query = params.query || '';
    
    if (params.skills && params.skills.length > 0) {
      const skillsQuery = params.skills.join(' OR ');
      query = query ? `${query} AND (${skillsQuery})` : skillsQuery;
    }
    
    if (params.location) {
      query = query ? `${query} in ${params.location}` : `jobs in ${params.location}`;
    }
    
    return query || 'software developer';
  }

  private transformJSearchJobs(jobs: any[]): JobListing[] {
    return jobs.map(job => ({
      id: job.job_id || `jsearch_${Date.now()}_${Math.random()}`,
      title: job.job_title || 'Software Developer',
      company: {
        name: job.employer_name || 'Unknown Company',
        logo: job.employer_logo,
        website: job.employer_website
      },
      location: this.parseLocation(job),
      remote: job.job_is_remote || false,
      salary: this.parseSalary(job),
      description: job.job_description || '',
      requirements: this.extractRequirements(job.job_description || ''),
      skills: this.extractSkills(job.job_description || ''),
      url: job.job_apply_link || job.job_google_link || '#',
      postedDate: new Date(job.job_posted_at_datetime_utc || Date.now()),
      source: 'JSearch'
    }));
  }

  private parseLocation(job: any): string {
    return job.job_city && job.job_state 
      ? `${job.job_city}, ${job.job_state}${job.job_country ? `, ${job.job_country}` : ''}`
      : job.job_country || 'Remote';
  }

  private parseSalary(job: any): JobListing['salary'] | undefined {
    if (job.job_min_salary || job.job_max_salary) {
      return {
        min: job.job_min_salary,
        max: job.job_max_salary,
        currency: 'USD',
        period: 'yearly'
      };
    }
    return undefined;
  }

  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const text = description.toLowerCase();
    
    // Common requirement patterns
    const patterns = [
      /(\d+\+?\s*years?\s*of?\s*experience)/gi,
      /(bachelor'?s?\s*degree)/gi,
      /(master'?s?\s*degree)/gi,
      /(experience with [^.]+)/gi,
      /(knowledge of [^.]+)/gi,
      /(proficiency in [^.]+)/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        requirements.push(...matches.slice(0, 3)); // Limit to 3 per pattern
      }
    });
    
    return requirements.slice(0, 8); // Max 8 requirements
  }

  private extractSkills(description: string): string[] {
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'angular', 'vue.js',
      'typescript', 'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql',
      'aws', 'azure', 'docker', 'kubernetes', 'git', 'linux', 'windows',
      'machine learning', 'ai', 'tensorflow', 'pytorch', 'pandas', 'numpy',
      'spring boot', 'django', 'flask', 'express.js', 'next.js', 'redux',
      'graphql', 'rest api', 'microservices', 'ci/cd', 'jenkins', 'github',
      'figma', 'photoshop', 'sketch', 'agile', 'scrum', 'project management'
    ];
    
    const text = description.toLowerCase();
    const foundSkills = commonSkills.filter(skill => 
      text.includes(skill.toLowerCase())
    );
    
    return foundSkills.slice(0, 10); // Max 10 skills
  }
}

// Adzuna API Provider (Extensible)
class AdzunaProvider implements JobProvider {
  name = 'Adzuna';
  private appId: string;
  private apiKey: string;
  private baseUrl = 'https://api.adzuna.com/v1/api/jobs';

  constructor() {
    this.appId = process.env.ADZUNA_APP_ID || '';
    this.apiKey = process.env.ADZUNA_API_KEY || '';
  }

  async fetchJobs(params: JobSearchParams): Promise<JobListing[]> {
    // Implementation for Adzuna API
    // This is a placeholder for future implementation
    console.log('Adzuna provider not yet implemented');
    return [];
  }
}

// Jooble API Provider (Extensible)
class JoobleProvider implements JobProvider {
  name = 'Jooble';
  private apiKey: string;
  private baseUrl = 'https://jooble.org/api';

  constructor() {
    this.apiKey = process.env.JOOBLE_API_KEY || '';
  }

  async fetchJobs(params: JobSearchParams): Promise<JobListing[]> {
    // Implementation for Jooble API
    // This is a placeholder for future implementation
    console.log('Jooble provider not yet implemented');
    return [];
  }
}

// Job Matching Service
class JobMatchingService {
  static calculateMatchPercentage(resumeSkills: string[], jobSkills: string[]): number {
    if (!resumeSkills.length || !jobSkills.length) return 0;
    
    const normalizedResumeSkills = resumeSkills.map(skill => skill.toLowerCase().trim());
    const normalizedJobSkills = jobSkills.map(skill => skill.toLowerCase().trim());
    
    let matches = 0;
    normalizedJobSkills.forEach(jobSkill => {
      if (normalizedResumeSkills.some(resumeSkill => 
        resumeSkill.includes(jobSkill) || jobSkill.includes(resumeSkill)
      )) {
        matches++;
      }
    });
    
    return Math.round((matches / jobSkills.length) * 100);
  }

  static async enhanceJobsWithMatching(
    jobs: JobListing[], 
    resumeSkills: string[]
  ): Promise<JobListing[]> {
    return jobs.map(job => ({
      ...job,
      matchPercentage: this.calculateMatchPercentage(resumeSkills, job.skills)
    })).sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
  }
}

// Main Job Service
export class JobService {
  private providers: JobProvider[];
  private cacheExpiration = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.providers = [
      new JSearchProvider(),
      // new AdzunaProvider(),
      // new JoobleProvider()
    ];
  }

  async searchJobs(params: JobSearchParams, resumeSkills: string[] = []): Promise<{
    jobs: JobListing[];
    total: number;
    page: number;
    hasMore: boolean;
  }> {
    try {
      // Check cache first
      const cachedJobs = await this.getCachedJobs(params);
      if (cachedJobs.length > 0) {
        const enhancedJobs = await JobMatchingService.enhanceJobsWithMatching(
          cachedJobs, 
          resumeSkills
        );
        return this.paginateResults(enhancedJobs, params.page || 1, params.limit || 20);
      }

      // Fetch from multiple providers
      const allJobs: JobListing[] = [];
      
      for (const provider of this.providers) {
        try {
          const jobs = await provider.fetchJobs(params);
          allJobs.push(...jobs);
        } catch (error) {
          console.error(`Error fetching from ${provider.name}:`, error);
          // Continue with other providers
        }
      }

      // Remove duplicates based on title + company
      const uniqueJobs = this.removeDuplicates(allJobs);
      
      // Enhance with matching scores
      const enhancedJobs = await JobMatchingService.enhanceJobsWithMatching(
        uniqueJobs, 
        resumeSkills
      );

      // Cache the results
      await this.cacheJobs(params, enhancedJobs);

      return this.paginateResults(enhancedJobs, params.page || 1, params.limit || 20);
    } catch (error) {
      console.error('Job search error:', error);
      throw new Error('Failed to search jobs');
    }
  }

  private async getCachedJobs(params: JobSearchParams): Promise<JobListing[]> {
    try {
      const cacheKey = this.generateCacheKey(params);
      const cachedJobs = await Job.find({
        cacheKey,
        createdAt: { $gte: new Date(Date.now() - this.cacheExpiration) }
      }).sort({ matchPercentage: -1, createdAt: -1 });

      return cachedJobs.map(job => job.toObject() as JobListing);
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return [];
    }
  }

  private async cacheJobs(params: JobSearchParams, jobs: JobListing[]): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(params);
      
      // Remove old cache entries
      await Job.deleteMany({ cacheKey });
      
      // Save new entries
      const jobDocs = jobs.map(job => ({
        ...job,
        cacheKey,
        createdAt: new Date()
      }));
      
      await Job.insertMany(jobDocs);
    } catch (error) {
      console.error('Cache storage error:', error);
      // Don't throw - caching failure shouldn't break the search
    }
  }

  private generateCacheKey(params: JobSearchParams): string {
    const key = [
      params.query || '',
      params.location || '',
      (params.skills || []).sort().join(','),
      params.remote ? 'remote' : 'onsite',
      params.experienceLevel || ''
    ].join('|');
    
    return Buffer.from(key).toString('base64').slice(0, 32);
  }

  private removeDuplicates(jobs: JobListing[]): JobListing[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.company.name.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private paginateResults(jobs: JobListing[], page: number, limit: number) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = jobs.slice(startIndex, endIndex);
    
    return {
      jobs: paginatedJobs,
      total: jobs.length,
      page,
      hasMore: endIndex < jobs.length
    };
  }

  async getJobStats(): Promise<{
    totalJobs: number;
    topCompanies: Array<{ name: string; count: number }>;
    topSkills: Array<{ skill: string; count: number }>;
    avgSalary: number;
  }> {
    try {
      const recentJobs = await Job.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      const totalJobs = recentJobs.length;
      
      // Top companies
      const companyCount = new Map<string, number>();
      recentJobs.forEach(job => {
        const company = job.company?.name || 'Unknown';
        companyCount.set(company, (companyCount.get(company) || 0) + 1);
      });
      
      const topCompanies = Array.from(companyCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      // Top skills
      const skillCount = new Map<string, number>();
      recentJobs.forEach(job => {
        (job.skills || []).forEach(skill => {
          skillCount.set(skill, (skillCount.get(skill) || 0) + 1);
        });
      });
      
      const topSkills = Array.from(skillCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([skill, count]) => ({ skill, count }));

      // Average salary
      const salariesWithValues = recentJobs
        .filter(job => job.salary?.max)
        .map(job => job.salary!.max!);
      
      const avgSalary = salariesWithValues.length > 0
        ? salariesWithValues.reduce((sum, salary) => sum + salary, 0) / salariesWithValues.length
        : 0;

      return {
        totalJobs,
        topCompanies,
        topSkills,
        avgSalary: Math.round(avgSalary)
      };
    } catch (error) {
      console.error('Job stats error:', error);
      return {
        totalJobs: 0,
        topCompanies: [],
        topSkills: [],
        avgSalary: 0
      };
    }
  }
}

export { JobListing, JobSearchParams, JobMatchingService };