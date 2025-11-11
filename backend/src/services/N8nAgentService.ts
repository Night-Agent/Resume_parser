import axios, { AxiosResponse } from 'axios';
import { Job } from '../models/Job';

interface JobQuery {
  skills: string[];
  location?: string;
  role?: string;
  experienceLevel?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  remote?: boolean;
}

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

interface N8nAgent {
  id: string;
  name: string;
  endpoint: string;
  apiKey?: string;
  isActive: boolean;
  specialization: string[]; // e.g., ['indeed', 'linkedin', 'glassdoor']
  rateLimitPerHour: number;
  priority: number; // Higher priority agents get used first
}

interface N8nWorkflowExecution {
  id: string;
  status: 'running' | 'success' | 'failed' | 'waiting';
  startTime: Date;
  endTime?: Date;
  data?: any;
  error?: string;
}

interface N8nResponse {
  success: boolean;
  data?: JobData[];
  executionId?: string;
  message?: string;
  metadata?: {
    source: string;
    totalJobs: number;
    executionTime: number;
  };
}

class N8nAgentService {
  private agents: Map<string, N8nAgent> = new Map();
  private executions: Map<string, N8nWorkflowExecution> = new Map();
  private rateLimitTracking: Map<string, number[]> = new Map();

  constructor() {
    this.initializeDefaultAgents();
  }

  /**
   * Initialize default n8n agents/workflows
   */
  private initializeDefaultAgents(): void {
    // Default hybrid scraper we created earlier
    this.registerAgent({
      id: 'hybrid-job-scraper',
      name: 'Hybrid Job Scraper',
      endpoint: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/hybrid-jobs',
      isActive: true,
      specialization: ['indeed', 'linkedin', 'glassdoor'],
      rateLimitPerHour: 100,
      priority: 1
    });

    // Placeholder for user's custom agent
    if (process.env.CUSTOM_N8N_AGENT_URL) {
      this.registerAgent({
        id: 'custom-user-agent',
        name: 'Custom User Agent',
        endpoint: process.env.CUSTOM_N8N_AGENT_URL,
        apiKey: process.env.CUSTOM_N8N_AGENT_KEY,
        isActive: true,
        specialization: ['custom'], // User can specify
        rateLimitPerHour: 50,
        priority: 2
      });
    }
  }

  /**
   * Register a new n8n agent
   */
  registerAgent(agent: N8nAgent): void {
    console.log(`🤖 Registering n8n agent: ${agent.name}`);
    this.agents.set(agent.id, agent);
    this.rateLimitTracking.set(agent.id, []);
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): N8nAgent[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.isActive)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if agent is within rate limit
   */
  private isWithinRateLimit(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    const requests = this.rateLimitTracking.get(agentId) || [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean old requests
    const recentRequests = requests.filter(timestamp => timestamp > oneHourAgo);
    this.rateLimitTracking.set(agentId, recentRequests);

    return recentRequests.length < agent.rateLimitPerHour;
  }

  /**
   * Track a request for rate limiting
   */
  private trackRequest(agentId: string): void {
    const requests = this.rateLimitTracking.get(agentId) || [];
    requests.push(Date.now());
    this.rateLimitTracking.set(agentId, requests);
  }

  /**
   * Execute workflow on specific agent
   */
  async executeWorkflow(
    agentId: string, 
    jobQuery: JobQuery, 
    timeout: number = 30000
  ): Promise<N8nResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.isActive) {
      throw new Error(`Agent ${agentId} is not active`);
    }

    if (!this.isWithinRateLimit(agentId)) {
      throw new Error(`Agent ${agentId} has exceeded rate limit`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: N8nWorkflowExecution = {
      id: executionId,
      status: 'running',
      startTime: new Date()
    };

    this.executions.set(executionId, execution);
    this.trackRequest(agentId);

    try {
      console.log(`🚀 Executing workflow on agent: ${agent.name}`);
      
      const requestPayload = {
        skills: Array.isArray(jobQuery.skills) ? jobQuery.skills : [jobQuery.skills],
        location: jobQuery.location || 'India',
        role: jobQuery.role,
        remote: jobQuery.remote || false,
        salaryMin: jobQuery.salaryMin,
        executionId,
        timestamp: new Date().toISOString()
      };

      const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Resume-Platform/1.0'
      };

      // Add API key if provided
      if (agent.apiKey) {
        headers['Authorization'] = `Bearer ${agent.apiKey}`;
        headers['X-API-Key'] = agent.apiKey;
      }

      const startTime = Date.now();
      const response: AxiosResponse = await axios.post(
        agent.endpoint,
        requestPayload,
        {
          headers,
          timeout,
          validateStatus: (status) => status < 500 // Accept 4xx as valid responses
        }
      );

      const executionTime = Date.now() - startTime;
      execution.status = 'success';
      execution.endTime = new Date();
      execution.data = response.data;

      console.log(`✅ Agent ${agent.name} completed in ${executionTime}ms`);

      // Process response based on agent's response format
      return this.processAgentResponse(agent, response.data, executionTime);

    } catch (error: any) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error.message;

      console.error(`❌ Agent ${agent.name} failed:`, error.message);

      return {
        success: false,
        message: `Agent ${agent.name} execution failed: ${error.message}`,
        executionId
      };
    }
  }

  /**
   * Process response from different agents (they might have different formats)
   */
  private processAgentResponse(
    agent: N8nAgent, 
    responseData: any, 
    executionTime: number
  ): N8nResponse {
    try {
      // Handle different response formats from different agents
      let jobs: JobData[] = [];
      
      if (Array.isArray(responseData)) {
        jobs = responseData;
      } else if (responseData.jobs && Array.isArray(responseData.jobs)) {
        jobs = responseData.jobs;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        jobs = responseData.data;
      } else if (responseData.results && Array.isArray(responseData.results)) {
        jobs = responseData.results;
      }

      // Normalize job objects to our format
      const normalizedJobs = jobs.map(job => this.normalizeJobObject(job, agent.id));

      return {
        success: true,
        data: normalizedJobs,
        metadata: {
          source: agent.name,
          totalJobs: normalizedJobs.length,
          executionTime
        }
      };
    } catch (error: any) {
      console.error(`Failed to process response from ${agent.name}:`, error);
      return {
        success: false,
        message: `Failed to process response from ${agent.name}: ${error.message}`
      };
    }
  }

  /**
   * Normalize job object from different agents to our standard format
   */
  private normalizeJobObject(job: any, agentId: string): JobData {
    return {
      _id: job.id || job._id || `${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || job.job_title || job.position || 'Unknown Title',
      company: {
        name: job.company?.name || job.company_name || job.employer || 'Unknown Company',
        logo: job.company?.logo || job.company_logo || undefined,
        website: job.company?.website || undefined
      },
      location: job.location || job.job_location || job.city || 'Unknown Location',
      description: job.description || job.job_description || job.summary || '',
      requirements: job.requirements || job.skills || job.qualifications || [],
      salary: job.salary ? {
        min: job.salary.min || job.salary_min || undefined,
        max: job.salary.max || job.salary_max || undefined,
        currency: job.salary.currency || job.currency || 'USD',
        period: 'yearly'
      } : undefined,
      remote: job.remote || job.is_remote || job.work_type === 'remote' || false,
      url: job.applyUrl || job.apply_url || job.url || job.link || '#',
      source: agentId,
      postedDate: new Date(job.postedDate || job.posted_date || job.date_posted || Date.now()),
      skills: job.skills || [],
      matchPercentage: job.matchPercentage || undefined
    };
  }

  /**
   * Execute workflows on multiple agents in parallel
   */
  async executeMultipleAgents(
    jobQuery: JobQuery, 
    agentIds?: string[],
    maxConcurrent: number = 3
  ): Promise<N8nResponse[]> {
    const agents = agentIds 
      ? agentIds.map(id => this.agents.get(id)).filter(Boolean) as N8nAgent[]
      : this.getActiveAgents();

    if (agents.length === 0) {
      throw new Error('No active agents available');
    }

    console.log(`🔄 Executing on ${agents.length} agents: ${agents.map(a => a.name).join(', ')}`);

    // Split into batches to respect maxConcurrent
    const results: N8nResponse[] = [];
    for (let i = 0; i < agents.length; i += maxConcurrent) {
      const batch = agents.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(agent => 
        this.executeWorkflow(agent.id, jobQuery).catch(error => ({
          success: false,
          message: error.message
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): N8nWorkflowExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * Get agent statistics
   */
  getAgentStats(): any {
    const stats: any = {};
    
    for (const [agentId, agent] of this.agents.entries()) {
      const requests = this.rateLimitTracking.get(agentId) || [];
      const recentRequests = requests.filter(timestamp => 
        timestamp > Date.now() - (60 * 60 * 1000)
      );

      stats[agentId] = {
        name: agent.name,
        isActive: agent.isActive,
        specialization: agent.specialization,
        requestsLastHour: recentRequests.length,
        rateLimitPerHour: agent.rateLimitPerHour,
        utilizationPercentage: (recentRequests.length / agent.rateLimitPerHour) * 100,
        priority: agent.priority
      };
    }

    return stats;
  }

  /**
   * Update agent configuration
   */
  updateAgent(agentId: string, updates: Partial<N8nAgent>): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    const updatedAgent = { ...agent, ...updates };
    this.agents.set(agentId, updatedAgent);
    
    console.log(`🔧 Updated agent ${agent.name}`);
    return true;
  }

  /**
   * Test agent connectivity
   */
  async testAgent(agentId: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { success: false, message: 'Agent not found' };
    }

    try {
      const startTime = Date.now();
      const testQuery: JobQuery = {
        skills: ['test'],
        location: 'test'
      };

      // Try a simple ping/test endpoint first, fallback to main endpoint
      const testEndpoint = agent.endpoint.replace('/webhook/', '/webhook/test/') || agent.endpoint;
      
      const response = await axios.post(testEndpoint, testQuery, {
        timeout: 5000,
        headers: agent.apiKey ? { 'Authorization': `Bearer ${agent.apiKey}` } : {}
      });

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        message: `Agent ${agent.name} is responding`,
        responseTime
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Agent ${agent.name} test failed: ${error.message}`
      };
    }
  }
}

export default new N8nAgentService();