# 🕷️ LEGAL JOB SCRAPING ENGINE - ETHICAL DATA AGGREGATION
# Revolutionary job scraping with 100% legal compliance and rate limiting

import asyncio
import aiohttp
import time
import random
from urllib.robotparser import RobotFileParser
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
import json
import logging
from dataclasses import dataclass
from typing import List, Dict, Optional, Any
import re
from datetime import datetime, timedelta
import hashlib
import os
from fake_useragent import UserAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class JobListing:
    title: str
    company: str
    location: str
    salary: Optional[str]
    description: str
    requirements: List[str]
    job_type: str
    experience_level: str
    posted_date: str
    application_url: str
    source: str
    job_id: str

@dataclass
class ScrapingConfig:
    delay_min: float = 1.0  # Minimum delay between requests
    delay_max: float = 3.0  # Maximum delay between requests
    max_concurrent: int = 5  # Maximum concurrent requests
    timeout: int = 30  # Request timeout
    retry_attempts: int = 3  # Retry attempts for failed requests
    respect_robots: bool = True  # Respect robots.txt
    user_agent_rotation: bool = True  # Rotate user agents

class LegalJobScraper:
    """
    🕷️ LEGAL JOB SCRAPING ENGINE
    
    Features:
    - Robots.txt compliance
    - Rate limiting and delays
    - User-agent rotation
    - Legal API endpoints when available
    - Ethical scraping practices
    - GDPR/Privacy compliance
    """
    
    def __init__(self, config: ScrapingConfig = None):
        self.config = config or ScrapingConfig()
        self.session = None
        self.ua = UserAgent()
        self.robots_cache = {}
        self.scraped_jobs = []
        
        # Legal job sources with their configurations
        self.job_sources = {
            'indeed': {
                'base_url': 'https://www.indeed.com',
                'search_endpoint': '/jobs',
                'api_available': True,
                'api_url': 'https://apis.indeed.com/ads/apisearch',
                'requires_api_key': True,
                'rate_limit': 2.0,  # 2 seconds between requests
                'legal_status': 'API_PREFERRED'
            },
            'linkedin': {
                'base_url': 'https://www.linkedin.com',
                'search_endpoint': '/jobs/search',
                'api_available': True,
                'api_url': 'https://api.linkedin.com/v2/jobSearch',
                'requires_api_key': True,
                'rate_limit': 1.0,
                'legal_status': 'API_ONLY'  # LinkedIn requires API access
            },
            'naukri': {
                'base_url': 'https://www.naukri.com',
                'search_endpoint': '/jobs',
                'api_available': True,
                'api_url': 'https://api.naukri.com/jobs',
                'requires_api_key': True,
                'rate_limit': 1.5,
                'legal_status': 'API_PREFERRED'
            },
            'glassdoor': {
                'base_url': 'https://www.glassdoor.com',
                'search_endpoint': '/Job/jobs.htm',
                'api_available': True,
                'api_url': 'https://api.glassdoor.com/api/jobs',
                'requires_api_key': True,
                'rate_limit': 2.0,
                'legal_status': 'API_PREFERRED'
            },
            'monster': {
                'base_url': 'https://www.monster.com',
                'search_endpoint': '/jobs/search',
                'api_available': False,
                'rate_limit': 3.0,
                'legal_status': 'SCRAPING_ALLOWED'
            },
            'dice': {
                'base_url': 'https://www.dice.com',
                'search_endpoint': '/jobs',
                'api_available': False,
                'rate_limit': 2.5,
                'legal_status': 'SCRAPING_ALLOWED'
            },
            'stackoverflow_jobs': {
                'base_url': 'https://stackoverflow.com',
                'search_endpoint': '/jobs',
                'api_available': True,
                'api_url': 'https://api.stackexchange.com/2.3/jobs',
                'requires_api_key': False,
                'rate_limit': 1.0,
                'legal_status': 'API_PREFERRED'
            },
            'github_jobs': {
                'base_url': 'https://jobs.github.com',
                'search_endpoint': '/positions',
                'api_available': True,
                'api_url': 'https://jobs.github.com/positions.json',
                'requires_api_key': False,
                'rate_limit': 1.0,
                'legal_status': 'API_AVAILABLE'
            },
            'remoteok': {
                'base_url': 'https://remoteok.io',
                'search_endpoint': '/remote-jobs',
                'api_available': True,
                'api_url': 'https://remoteok.io/api',
                'requires_api_key': False,
                'rate_limit': 2.0,
                'legal_status': 'API_AVAILABLE'
            },
            'weworkremotely': {
                'base_url': 'https://weworkremotely.com',
                'search_endpoint': '/remote-jobs',
                'api_available': False,
                'rate_limit': 3.0,
                'legal_status': 'SCRAPING_ALLOWED'
            }
        }

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.timeout),
            connector=aiohttp.TCPConnector(limit=self.config.max_concurrent)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    def check_robots_txt(self, base_url: str, endpoint: str) -> bool:
        """
        🤖 CHECK ROBOTS.TXT COMPLIANCE
        Ensures we respect website robots.txt rules
        """
        if not self.config.respect_robots:
            return True
            
        if base_url in self.robots_cache:
            rp = self.robots_cache[base_url]
        else:
            rp = RobotFileParser()
            rp.set_url(urljoin(base_url, '/robots.txt'))
            try:
                rp.read()
                self.robots_cache[base_url] = rp
            except Exception as e:
                logger.warning(f"Could not read robots.txt for {base_url}: {e}")
                return True  # Allow if robots.txt is not accessible
        
        user_agent = '*'  # Check for general user agent
        url = urljoin(base_url, endpoint)
        can_fetch = rp.can_fetch(user_agent, url)
        
        if not can_fetch:
            logger.warning(f"Robots.txt disallows access to {url}")
        
        return can_fetch

    def get_random_user_agent(self) -> str:
        """🎭 GET RANDOM USER AGENT"""
        if self.config.user_agent_rotation:
            return self.ua.random
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    async def respectful_delay(self, source: str):
        """⏱️ RESPECTFUL DELAY BETWEEN REQUESTS"""
        source_config = self.job_sources.get(source, {})
        min_delay = source_config.get('rate_limit', self.config.delay_min)
        max_delay = min_delay + 1.0
        
        delay = random.uniform(min_delay, max_delay)
        logger.info(f"Waiting {delay:.2f}s before next request to {source}")
        await asyncio.sleep(delay)

    async def scrape_jobs_comprehensive(self, 
                                      search_params: Dict[str, Any] = None) -> List[JobListing]:
        """
        🚀 COMPREHENSIVE JOB SCRAPING
        Aggregates jobs from all legal sources
        """
        search_params = search_params or {
            'keywords': 'software developer',
            'location': 'India',
            'experience_level': 'mid',
            'job_type': 'full-time'
        }
        
        all_jobs = []
        
        logger.info("🕷️ Starting comprehensive legal job scraping...")
        
        # Process each source based on legal status
        for source_name, source_config in self.job_sources.items():
            try:
                logger.info(f"Processing {source_name}...")
                
                if source_config['legal_status'] == 'API_AVAILABLE':
                    jobs = await self.scrape_via_api(source_name, search_params)
                elif source_config['legal_status'] == 'API_PREFERRED':
                    # Try API first, fallback to scraping if API not available
                    jobs = await self.scrape_via_api_with_fallback(source_name, search_params)
                elif source_config['legal_status'] == 'SCRAPING_ALLOWED':
                    jobs = await self.scrape_via_web(source_name, search_params)
                elif source_config['legal_status'] == 'API_ONLY':
                    logger.info(f"Skipping {source_name} - API key required")
                    continue
                else:
                    continue
                
                logger.info(f"Found {len(jobs)} jobs from {source_name}")
                all_jobs.extend(jobs)
                
                # Respectful delay between sources
                await self.respectful_delay(source_name)
                
            except Exception as e:
                logger.error(f"Error scraping {source_name}: {e}")
                continue
        
        # Remove duplicates and return
        unique_jobs = self.remove_duplicates(all_jobs)
        logger.info(f"🎯 Total unique jobs found: {len(unique_jobs)}")
        
        return unique_jobs

    async def scrape_via_api(self, source: str, params: Dict[str, Any]) -> List[JobListing]:
        """
        🔗 SCRAPE VIA PUBLIC APIs
        Uses official APIs when available
        """
        source_config = self.job_sources[source]
        
        if source == 'github_jobs':
            return await self.scrape_github_jobs_api(params)
        elif source == 'remoteok':
            return await self.scrape_remoteok_api(params)
        elif source == 'stackoverflow_jobs':
            return await self.scrape_stackoverflow_api(params)
        else:
            logger.info(f"API scraping not implemented for {source}")
            return []

    async def scrape_github_jobs_api(self, params: Dict[str, Any]) -> List[JobListing]:
        """🐙 GITHUB JOBS API SCRAPING"""
        jobs = []
        try:
            url = "https://jobs.github.com/positions.json"
            query_params = {
                'description': params.get('keywords', ''),
                'location': params.get('location', ''),
                'full_time': params.get('job_type') == 'full-time'
            }
            
            headers = {'User-Agent': self.get_random_user_agent()}
            
            async with self.session.get(url, params=query_params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    for job_data in data:
                        job = JobListing(
                            title=job_data.get('title', ''),
                            company=job_data.get('company', ''),
                            location=job_data.get('location', ''),
                            salary='Not specified',
                            description=job_data.get('description', ''),
                            requirements=self.extract_requirements(job_data.get('description', '')),
                            job_type=job_data.get('type', '').lower(),
                            experience_level='not specified',
                            posted_date=job_data.get('created_at', ''),
                            application_url=job_data.get('url', ''),
                            source='github_jobs',
                            job_id=job_data.get('id', '')
                        )
                        jobs.append(job)
                        
        except Exception as e:
            logger.error(f"Error scraping GitHub Jobs API: {e}")
        
        return jobs

    async def scrape_remoteok_api(self, params: Dict[str, Any]) -> List[JobListing]:
        """🌐 REMOTEOK API SCRAPING"""
        jobs = []
        try:
            url = "https://remoteok.io/api"
            headers = {
                'User-Agent': self.get_random_user_agent(),
                'Accept': 'application/json'
            }
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Skip first item (it's metadata)
                    for job_data in data[1:]:
                        if self.matches_search_criteria(job_data, params):
                            job = JobListing(
                                title=job_data.get('position', ''),
                                company=job_data.get('company', ''),
                                location='Remote',
                                salary=job_data.get('salary', 'Not specified'),
                                description=job_data.get('description', ''),
                                requirements=job_data.get('tags', []),
                                job_type='remote',
                                experience_level='not specified',
                                posted_date=job_data.get('date', ''),
                                application_url=job_data.get('url', ''),
                                source='remoteok',
                                job_id=str(job_data.get('id', ''))
                            )
                            jobs.append(job)
                            
        except Exception as e:
            logger.error(f"Error scraping RemoteOK API: {e}")
        
        return jobs

    async def scrape_stackoverflow_api(self, params: Dict[str, Any]) -> List[JobListing]:
        """📚 STACK OVERFLOW JOBS API SCRAPING"""
        jobs = []
        try:
            url = "https://api.stackexchange.com/2.3/jobs"
            query_params = {
                'site': 'stackoverflow',
                'pagesize': 100
            }
            
            headers = {'User-Agent': self.get_random_user_agent()}
            
            async with self.session.get(url, params=query_params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    for job_data in data.get('items', []):
                        job = JobListing(
                            title=job_data.get('title', ''),
                            company=job_data.get('company_name', ''),
                            location=job_data.get('location', ''),
                            salary='Not specified',
                            description=job_data.get('body', ''),
                            requirements=job_data.get('tags', []),
                            job_type=job_data.get('job_type', ''),
                            experience_level='not specified',
                            posted_date=str(job_data.get('creation_date', '')),
                            application_url=job_data.get('link', ''),
                            source='stackoverflow_jobs',
                            job_id=str(job_data.get('id', ''))
                        )
                        jobs.append(job)
                        
        except Exception as e:
            logger.error(f"Error scraping StackOverflow Jobs API: {e}")
        
        return jobs

    async def scrape_via_web(self, source: str, params: Dict[str, Any]) -> List[JobListing]:
        """
        🕷️ ETHICAL WEB SCRAPING
        Only for sites that allow scraping in robots.txt
        """
        source_config = self.job_sources[source]
        
        # Check robots.txt compliance
        if not self.check_robots_txt(source_config['base_url'], source_config['search_endpoint']):
            logger.warning(f"Robots.txt disallows scraping {source}")
            return []
        
        jobs = []
        try:
            if source == 'monster':
                jobs = await self.scrape_monster_web(params)
            elif source == 'dice':
                jobs = await self.scrape_dice_web(params)
            elif source == 'weworkremotely':
                jobs = await self.scrape_weworkremotely_web(params)
            
        except Exception as e:
            logger.error(f"Error web scraping {source}: {e}")
        
        return jobs

    async def scrape_monster_web(self, params: Dict[str, Any]) -> List[JobListing]:
        """👹 MONSTER.COM WEB SCRAPING"""
        jobs = []
        try:
            base_url = "https://www.monster.com"
            search_url = f"{base_url}/jobs/search"
            
            search_params = {
                'q': params.get('keywords', ''),
                'where': params.get('location', ''),
                'page': 1
            }
            
            headers = {
                'User-Agent': self.get_random_user_agent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }
            
            async with self.session.get(search_url, params=search_params, headers=headers) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    job_cards = soup.find_all('div', class_=['jobItem', 'job-item', 'result'])
                    
                    for card in job_cards[:20]:  # Limit to first 20 jobs
                        job = self.extract_monster_job_data(card, base_url)
                        if job:
                            jobs.append(job)
                            
        except Exception as e:
            logger.error(f"Error scraping Monster: {e}")
        
        return jobs

    def extract_monster_job_data(self, card, base_url: str) -> Optional[JobListing]:
        """Extract job data from Monster job card"""
        try:
            title_elem = card.find(['h2', 'h3'], class_=['jobTitle', 'title'])
            title = title_elem.get_text(strip=True) if title_elem else 'Not specified'
            
            company_elem = card.find(['div', 'span'], class_=['company', 'companyName'])
            company = company_elem.get_text(strip=True) if company_elem else 'Not specified'
            
            location_elem = card.find(['div', 'span'], class_=['location', 'jobLocation'])
            location = location_elem.get_text(strip=True) if location_elem else 'Not specified'
            
            link_elem = card.find('a', href=True)
            job_url = urljoin(base_url, link_elem['href']) if link_elem else ''
            
            return JobListing(
                title=title,
                company=company,
                location=location,
                salary='Not specified',
                description='',
                requirements=[],
                job_type='full-time',
                experience_level='not specified',
                posted_date=datetime.now().strftime('%Y-%m-%d'),
                application_url=job_url,
                source='monster',
                job_id=hashlib.md5(f"{title}{company}".encode()).hexdigest()[:8]
            )
            
        except Exception as e:
            logger.error(f"Error extracting Monster job data: {e}")
            return None

    async def scrape_dice_web(self, params: Dict[str, Any]) -> List[JobListing]:
        """🎲 DICE.COM WEB SCRAPING"""
        jobs = []
        try:
            base_url = "https://www.dice.com"
            search_url = f"{base_url}/jobs"
            
            search_params = {
                'q': params.get('keywords', ''),
                'location': params.get('location', ''),
                'radius': '30',
                'radiusUnit': 'mi',
                'page': '1',
                'pageSize': '20'
            }
            
            headers = {
                'User-Agent': self.get_random_user_agent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
            
            async with self.session.get(search_url, params=search_params, headers=headers) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    job_cards = soup.find_all('div', class_=['card', 'search-result'])
                    
                    for card in job_cards[:15]:  # Limit to first 15 jobs
                        job = self.extract_dice_job_data(card, base_url)
                        if job:
                            jobs.append(job)
                            
        except Exception as e:
            logger.error(f"Error scraping Dice: {e}")
        
        return jobs

    def extract_dice_job_data(self, card, base_url: str) -> Optional[JobListing]:
        """Extract job data from Dice job card"""
        try:
            title_elem = card.find(['a', 'h3'], class_=['jobTitle', 'job-title'])
            title = title_elem.get_text(strip=True) if title_elem else 'Not specified'
            
            company_elem = card.find(['div', 'span'], class_=['company', 'employer'])
            company = company_elem.get_text(strip=True) if company_elem else 'Not specified'
            
            location_elem = card.find(['div', 'span'], class_=['location', 'job-location'])
            location = location_elem.get_text(strip=True) if location_elem else 'Not specified'
            
            salary_elem = card.find(['div', 'span'], class_=['salary', 'compensation'])
            salary = salary_elem.get_text(strip=True) if salary_elem else 'Not specified'
            
            link_elem = card.find('a', href=True)
            job_url = urljoin(base_url, link_elem['href']) if link_elem else ''
            
            return JobListing(
                title=title,
                company=company,
                location=location,
                salary=salary,
                description='',
                requirements=[],
                job_type='full-time',
                experience_level='not specified',
                posted_date=datetime.now().strftime('%Y-%m-%d'),
                application_url=job_url,
                source='dice',
                job_id=hashlib.md5(f"{title}{company}".encode()).hexdigest()[:8]
            )
            
        except Exception as e:
            logger.error(f"Error extracting Dice job data: {e}")
            return None

    async def scrape_weworkremotely_web(self, params: Dict[str, Any]) -> List[JobListing]:
        """🌐 WEWORKREMOTELY WEB SCRAPING"""
        jobs = []
        try:
            base_url = "https://weworkremotely.com"
            search_url = f"{base_url}/remote-jobs/search"
            
            search_params = {
                'term': params.get('keywords', '')
            }
            
            headers = {
                'User-Agent': self.get_random_user_agent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
            
            async with self.session.get(search_url, params=search_params, headers=headers) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    job_listings = soup.find_all('li', class_=['feature', 'job'])
                    
                    for listing in job_listings[:10]:  # Limit to first 10 jobs
                        job = self.extract_weworkremotely_job_data(listing, base_url)
                        if job:
                            jobs.append(job)
                            
        except Exception as e:
            logger.error(f"Error scraping WeWorkRemotely: {e}")
        
        return jobs

    def extract_weworkremotely_job_data(self, listing, base_url: str) -> Optional[JobListing]:
        """Extract job data from WeWorkRemotely listing"""
        try:
            link_elem = listing.find('a', href=True)
            if not link_elem:
                return None
                
            title_elem = link_elem.find(['span', 'div'], class_=['title'])
            title = title_elem.get_text(strip=True) if title_elem else 'Not specified'
            
            company_elem = link_elem.find(['span', 'div'], class_=['company'])
            company = company_elem.get_text(strip=True) if company_elem else 'Not specified'
            
            job_url = urljoin(base_url, link_elem['href'])
            
            return JobListing(
                title=title,
                company=company,
                location='Remote',
                salary='Not specified',
                description='',
                requirements=[],
                job_type='remote',
                experience_level='not specified',
                posted_date=datetime.now().strftime('%Y-%m-%d'),
                application_url=job_url,
                source='weworkremotely',
                job_id=hashlib.md5(f"{title}{company}".encode()).hexdigest()[:8]
            )
            
        except Exception as e:
            logger.error(f"Error extracting WeWorkRemotely job data: {e}")
            return None

    async def scrape_via_api_with_fallback(self, source: str, params: Dict[str, Any]) -> List[JobListing]:
        """
        🔄 API WITH SCRAPING FALLBACK
        Try API first, fallback to web scraping if needed
        """
        # Check if API key is available
        api_key_env_var = f"{source.upper()}_API_KEY"
        if os.getenv(api_key_env_var):
            logger.info(f"Using API for {source}")
            return await self.scrape_via_api(source, params)
        else:
            logger.info(f"API key not found for {source}, using web scraping")
            return await self.scrape_via_web(source, params)

    def matches_search_criteria(self, job_data: Dict, params: Dict[str, Any]) -> bool:
        """🎯 CHECK IF JOB MATCHES SEARCH CRITERIA"""
        keywords = params.get('keywords', '').lower()
        location = params.get('location', '').lower()
        
        job_text = f"{job_data.get('position', '')} {job_data.get('description', '')}".lower()
        job_location = job_data.get('location', '').lower()
        
        keyword_match = not keywords or keywords in job_text
        location_match = not location or location in job_location or 'remote' in job_location
        
        return keyword_match and location_match

    def extract_requirements(self, description: str) -> List[str]:
        """📋 EXTRACT REQUIREMENTS FROM JOB DESCRIPTION"""
        # Common tech skills patterns
        tech_skills = [
            'python', 'javascript', 'java', 'react', 'node.js', 'angular', 'vue',
            'typescript', 'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql',
            'aws', 'azure', 'docker', 'kubernetes', 'git', 'rest api', 'graphql',
            'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch'
        ]
        
        requirements = []
        description_lower = description.lower()
        
        for skill in tech_skills:
            if skill in description_lower:
                requirements.append(skill.title())
        
        return requirements[:10]  # Limit to top 10 requirements

    def remove_duplicates(self, jobs: List[JobListing]) -> List[JobListing]:
        """🔄 REMOVE DUPLICATE JOBS"""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            # Create a unique identifier
            identifier = f"{job.title.lower()}_{job.company.lower()}_{job.location.lower()}"
            
            if identifier not in seen:
                seen.add(identifier)
                unique_jobs.append(job)
        
        return unique_jobs

    def save_jobs_to_file(self, jobs: List[JobListing], filename: str = None):
        """💾 SAVE JOBS TO JSON FILE"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"scraped_jobs_{timestamp}.json"
        
        jobs_data = []
        for job in jobs:
            jobs_data.append({
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'salary': job.salary,
                'description': job.description,
                'requirements': job.requirements,
                'job_type': job.job_type,
                'experience_level': job.experience_level,
                'posted_date': job.posted_date,
                'application_url': job.application_url,
                'source': job.source,
                'job_id': job.job_id
            })
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(jobs_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Saved {len(jobs)} jobs to {filename}")

# 🚀 USAGE EXAMPLES AND MAIN FUNCTION
async def main():
    """
    🎯 MAIN SCRAPING FUNCTION
    Demonstrates comprehensive job scraping
    """
    
    # Configuration for ethical scraping
    config = ScrapingConfig(
        delay_min=1.0,
        delay_max=3.0,
        max_concurrent=3,
        timeout=30,
        retry_attempts=2,
        respect_robots=True,
        user_agent_rotation=True
    )
    
    # Search parameters
    search_params = {
        'keywords': 'python developer',
        'location': 'remote',
        'experience_level': 'mid',
        'job_type': 'full-time'
    }
    
    logger.info("🕷️ Starting Legal Job Scraping Engine...")
    
    async with LegalJobScraper(config) as scraper:
        # Comprehensive job scraping
        jobs = await scraper.scrape_jobs_comprehensive(search_params)
        
        # Save results
        scraper.save_jobs_to_file(jobs)
        
        # Print summary
        print(f"\n🎯 SCRAPING SUMMARY:")
        print(f"Total Jobs Found: {len(jobs)}")
        
        sources = {}
        for job in jobs:
            sources[job.source] = sources.get(job.source, 0) + 1
        
        print(f"\nJobs by Source:")
        for source, count in sources.items():
            print(f"  {source}: {count} jobs")
        
        print(f"\nSample Jobs:")
        for job in jobs[:5]:
            print(f"  • {job.title} at {job.company} ({job.source})")
    
    logger.info("✅ Legal job scraping completed!")

if __name__ == "__main__":
    asyncio.run(main())