import axios from 'axios';
import * as cheerio from 'cheerio';
import { IJob } from '../models/Job';

interface ScrapingTarget {
  name: string;
  baseUrl: string;
  searchPath: string;
  selectors: {
    jobContainer: string;
    title: string;
    company: string;
    location: string;
    description?: string;
    salary?: string;
    applyUrl?: string;
    postedDate?: string;
  };
  isActive: boolean;
  rateLimitMs: number; // Delay between requests
}

class FreeJobScrapingService {
  private targets: ScrapingTarget[] = [
    {
      name: 'Indeed',
      baseUrl: 'https://in.indeed.com',
      searchPath: '/jobs',
      selectors: {
        jobContainer: '[data-jk]',
        title: '[data-testid="job-title"] a span, h2.jobTitle a span',
        company: '[data-testid="company-name"], .companyName',
        location: '[data-testid="job-location"], .companyLocation',
        description: '.jobsearch-jobDescriptionText, .summary',
        salary: '.salaryText, .salary-snippet',
        applyUrl: '[data-testid="job-title"] a, h2.jobTitle a',
        postedDate: '.date, [data-testid="job-age"]'
      },
      isActive: true,
      rateLimitMs: 2000
    },
    {
      name: 'Naukri',
      baseUrl: 'https://www.naukri.com',
      searchPath: '/jobs-in-india',
      selectors: {
        jobContainer: '.jobTuple, .srp-jobtuple-wrapper',
        title: '.title a, .jobTuple-title a',
        company: '.companyInfo a, .jobTuple-companyName a',
        location: '.locationsContainer .location, .jobTuple-location',
        description: '.job-description, .jobTuple-description',
        salary: '.salary, .jobTuple-salary',
        applyUrl: '.title a, .jobTuple-title a',
        postedDate: '.date, .jobTuple-postedDate'
      },
      isActive: true,
      rateLimitMs: 3000
    },
    {
      name: 'Shine',
      baseUrl: 'https://www.shine.com',
      searchPath: '/job-search',
      selectors: {
        jobContainer: '.jobCard, .job-card',
        title: '.jobTitle a, .job-title a',
        company: '.recruiterName, .company-name',
        location: '.location, .job-location',
        salary: '.salary, .job-salary',
        applyUrl: '.jobTitle a, .job-title a'
      },
      isActive: true,
      rateLimitMs: 2500
    },
    {
      name: 'MonsterIndia',
      baseUrl: 'https://www.monsterindia.com',
      searchPath: '/search',
      selectors: {
        jobContainer: '.card-body, .job-tittle',
        title: '.medium, .job-tittle a',
        company: '.company-name, .company',
        location: '.loc, .location',
        description: '.job-desc, .description',
        salary: '.sal, .salary',
        applyUrl: '.medium, .job-tittle a'
      },
      isActive: true,
      rateLimitMs: 3500
    },
    {
      name: 'TimesJobs',
      baseUrl: 'https://www.timesjobs.com',
      searchPath: '/candidate/job-search.html',
      selectors: {
        jobContainer: '.srp-container .wrap, .job-bx',
        title: '.jobTitle, .job-title',
        company: '.companyName, .company-name',
        location: '.locationsContainer, .location',
        description: '.job-description, .desc',
        salary: '.salary, .sal',
        applyUrl: '.jobTitle, .job-title'
      },
      isActive: true,
      rateLimitMs: 4000
    },
    {
      name: 'Freshersworld',
      baseUrl: 'https://www.freshersworld.com',
      searchPath: '/jobs',
      selectors: {
        jobContainer: '.job-container, .job-item',
        title: '.job-title a, .title a',
        company: '.company-name, .company',
        location: '.job-location, .location',
        description: '.job-desc, .description',
        applyUrl: '.job-title a, .title a'
      },
      isActive: true,
      rateLimitMs: 3000
    }
  ];

  /**
   * FREE Web Scraping without n8n
   * Scrapes multiple job portals directly
   */
  async scrapeJobsDirectly(skills: string[], location: string = 'India'): Promise<IJob[]> {
    console.log(`🔍 Starting FREE direct scraping for: ${skills.join(', ')} in ${location}`);
    
    const allJobs: IJob[] = [];
    const query = skills.join(' ');

    for (const target of this.targets.filter(t => t.isActive)) {
      try {
        console.log(`🌐 Scraping ${target.name}...`);
        
        const jobs = await this.scrapeTarget(target, query, location);
        allJobs.push(...jobs);
        
        console.log(`✅ ${target.name}: Found ${jobs.length} jobs`);
        
        // Rate limiting to be respectful
        await this.delay(target.rateLimitMs);
        
      } catch (error: any) {
        console.error(`❌ ${target.name} scraping failed:`, error.message);
      }
    }

    console.log(`🎯 Total scraped: ${allJobs.length} jobs`);
    return allJobs;
  }

  private async scrapeTarget(target: ScrapingTarget, query: string, location: string): Promise<IJob[]> {
    const jobs: IJob[] = [];
    
    try {
      // Build search URL
      const searchUrl = this.buildSearchUrl(target, query, location);
      
      // Fetch page with proper headers to avoid blocking
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract jobs using selectors
      $(target.selectors.jobContainer).each((index, element) => {
        try {
          const $job = $(element);
          
          const title = this.extractText($job, target.selectors.title);
          const company = this.extractText($job, target.selectors.company);
          const jobLocation = this.extractText($job, target.selectors.location);
          
          if (title && company) {
            const job: IJob = {
              id: `${target.name.toLowerCase()}_${Date.now()}_${index}`,
              title: title.trim(),
              company: {
                name: company.trim()
              },
              location: jobLocation?.trim() || location,
              description: this.extractText($job, target.selectors.description) || '',
              requirements: this.extractSkills(title + ' ' + (this.extractText($job, target.selectors.description) || '')),
              skills: this.extractSkills(title + ' ' + (this.extractText($job, target.selectors.description) || '')),
              salary: target.selectors.salary ? this.parseSalary(this.extractText($job, target.selectors.salary)) : undefined,
              remote: this.isRemoteJob(title, jobLocation || undefined),
              url: this.extractUrl($job, target.selectors.applyUrl, target.baseUrl),
              source: target.name.toLowerCase(),
              postedDate: new Date(this.extractText($job, target.selectors.postedDate) || new Date().toISOString()),
              createdAt: new Date(),
              updatedAt: new Date()
            } as IJob;
            
            jobs.push(job);
          }
        } catch (error) {
          // Skip invalid job entries
        }
      });
      
    } catch (error: any) {
      throw new Error(`Failed to scrape ${target.name}: ${error.message}`);
    }
    
    return jobs;
  }

  private buildSearchUrl(target: ScrapingTarget, query: string, location: string): string {
    const encodedQuery = encodeURIComponent(query);
    const encodedLocation = encodeURIComponent(location);
    
    switch (target.name) {
      case 'Indeed':
        return `${target.baseUrl}${target.searchPath}?q=${encodedQuery}&l=${encodedLocation}`;
      case 'Naukri':
        return `${target.baseUrl}${target.searchPath}?k=${encodedQuery}&l=${encodedLocation}`;
      case 'Shine':
        return `${target.baseUrl}${target.searchPath}/${encodedQuery}-jobs-in-${encodedLocation}`;
      default:
        return `${target.baseUrl}${target.searchPath}?q=${encodedQuery}&location=${encodedLocation}`;
    }
  }

  private extractText($element: any, selector?: string): string | null {
    if (!selector) return null;
    
    const text = $element.find(selector).first().text() || $element.filter(selector).first().text();
    return text ? text.replace(/\s+/g, ' ').trim() : null;
  }

  private extractUrl($element: any, selector?: string, baseUrl?: string): string {
    if (!selector) return '#';
    
    const href = $element.find(selector).first().attr('href') || $element.filter(selector).first().attr('href');
    
    if (!href) return '#';
    
    // Handle relative URLs
    if (href.startsWith('/') && baseUrl) {
      return baseUrl + href;
    }
    
    if (href.startsWith('http')) {
      return href;
    }
    
    return '#';
  }

  private extractSkills(text: string): string[] {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
      'TypeScript', 'PHP', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'Linux',
      'Machine Learning', 'Data Science', 'AI', 'DevOps', 'Frontend', 'Backend'
    ];
    
    const lowerText = text.toLowerCase();
    return commonSkills.filter(skill => 
      lowerText.includes(skill.toLowerCase())
    );
  }

  private parseSalary(salaryText?: string | null): { min?: number; max?: number; currency: string; period: 'hourly' | 'monthly' | 'yearly' } | undefined {
    if (!salaryText) return undefined;
    
    const text = salaryText.toLowerCase();
    const currency = text.includes('₹') ? '₹' : 
                    text.includes('$') ? '$' : 
                    text.includes('€') ? '€' : '₹';
    
    const period = text.includes('hour') ? 'hourly' as const :
                  text.includes('month') ? 'monthly' as const :
                  'yearly' as const;
    
    // Extract numbers (handle lakhs/crores for Indian salaries)
    const numbers = salaryText.match(/\d+(\.\d+)?/g);
    if (!numbers) return { currency, period };
    
    let min: number | undefined;
    let max: number | undefined;
    
    if (numbers.length >= 2) {
      min = parseFloat(numbers[0]);
      max = parseFloat(numbers[1]);
      
      // Convert lakhs to actual numbers
      if (text.includes('lakh') || text.includes('lac')) {
        min = min ? min * 100000 : undefined;
        max = max ? max * 100000 : undefined;
      }
      
      if (text.includes('crore')) {
        min = min ? min * 10000000 : undefined;
        max = max ? max * 10000000 : undefined;
      }
    }
    
    return { min, max, currency, period };
  }

  private isRemoteJob(title?: string, location?: string): boolean {
    if (!title && !location) return false;
    
    const text = (title + ' ' + location).toLowerCase();
    return text.includes('remote') || 
           text.includes('work from home') || 
           text.includes('wfh') ||
           text.includes('anywhere');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get scraping statistics
   */
  getScrapingStats() {
    return {
      activeTargets: this.targets.filter(t => t.isActive).length,
      totalTargets: this.targets.length,
      targets: this.targets.map(t => ({
        name: t.name,
        isActive: t.isActive,
        rateLimitMs: t.rateLimitMs
      }))
    };
  }

  /**
   * Update target configuration
   */
  updateTarget(name: string, updates: Partial<ScrapingTarget>): boolean {
    const targetIndex = this.targets.findIndex(t => t.name === name);
    if (targetIndex === -1) return false;
    
    this.targets[targetIndex] = { ...this.targets[targetIndex], ...updates };
    return true;
  }

  /**
   * Add custom scraping target
   */
  addCustomTarget(target: ScrapingTarget): void {
    this.targets.push(target);
    console.log(`✅ Added custom scraping target: ${target.name}`);
  }
}

export default new FreeJobScrapingService();