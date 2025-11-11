import { ExtractedSkill } from '../extractors/SkillExtractor';

export interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  location: string;
  matchScore: number; // 0-100
  compatibilityScores: {
    skills: number;
    experience: number;
    education: number;
    location: number;
    salary: number;
    culture: number;
  };
  matchReasons: MatchReason[];
  gapAnalysis: SkillGap[];
  salaryPrediction: SalaryPrediction;
  careerTrajectory: CareerTrajectory;
  applicationRecommendations: string[];
  interviewTips: string[];
}

export interface MatchReason {
  type: 'skill_match' | 'experience_match' | 'education_match' | 'location_preference' | 'culture_fit';
  description: string;
  weight: number;
  confidence: number;
}

export interface SkillGap {
  skill: string;
  required: boolean;
  userLevel: number; // 0-100
  requiredLevel: number; // 0-100
  gap: number;
  learningPath: string[];
  timeToAcquire: string;
}

export interface SalaryPrediction {
  predictedSalary: number;
  salaryRange: { min: number; max: number };
  confidence: number;
  factors: SalaryFactor[];
  negotiationInsights: string[];
}

export interface SalaryFactor {
  factor: string;
  impact: number; // -100 to +100
  description: string;
}

export interface CareerTrajectory {
  currentLevel: string;
  targetLevel: string;
  probabilityOfPromotion: number;
  timeToPromotion: string;
  nextRoles: string[];
  careerPath: CareerStep[];
}

export interface CareerStep {
  role: string;
  timeframe: string;
  requiredSkills: string[];
  probability: number;
}

export interface UserProfile {
  skills: ExtractedSkill[];
  experience: WorkExperience[];
  education: Education[];
  preferences: JobPreferences;
  careerGoals: CareerGoals;
  personalityProfile?: PersonalityProfile;
}

export interface WorkExperience {
  title: string;
  company: string;
  duration: number; // months
  responsibilities: string[];
  achievements: string[];
  industry: string;
  seniority: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
}

export interface Education {
  degree: string;
  institution: string;
  field: string;
  year: number;
  gpa?: number;
  relevant: boolean;
}

export interface JobPreferences {
  locations: string[];
  remoteWork: 'only' | 'hybrid' | 'no_preference' | 'office_only';
  salaryRange: { min: number; max: number };
  industries: string[];
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  workLifeBalance: number; // 1-10 importance
  growthOpportunity: number; // 1-10 importance
  jobSecurity: number; // 1-10 importance
}

export interface CareerGoals {
  targetRole: string;
  timeframe: string;
  willingToRelocate: boolean;
  willingToChangeIndustry: boolean;
  priorityFactors: string[];
}

export interface PersonalityProfile {
  workStyle: 'collaborative' | 'independent' | 'mixed';
  communicationStyle: 'direct' | 'diplomatic' | 'analytical';
  riskTolerance: 'low' | 'medium' | 'high';
  innovationPreference: 'innovative' | 'stable' | 'balanced';
  leadershipStyle?: 'democratic' | 'autocratic' | 'transformational' | 'servant';
}

export class JobMatcher {
  private skillWeights: Map<string, number>;
  private experienceWeights: Map<string, number>;
  private industryTransitionMatrix: Map<string, Map<string, number>>;
  private roleProgressionPaths: Map<string, string[]>;
  private salaryData: Map<string, any>;
  private locationFactors: Map<string, number>;

  constructor() {
    this.initializeWeights();
    this.initializeIndustryMatrix();
    this.initializeCareerPaths();
    this.initializeSalaryData();
    this.initializeLocationFactors();
  }

  /**
   * Find best job matches for a user profile
   */
  public async findMatches(userProfile: UserProfile, jobs: any[], limit: number = 20): Promise<JobMatch[]> {
    const matches: JobMatch[] = [];

    for (const job of jobs) {
      const match = await this.calculateJobMatch(userProfile, job);
      matches.push(match);
    }

    // Sort by match score and return top matches
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Calculate comprehensive job match score
   */
  private async calculateJobMatch(userProfile: UserProfile, job: any): Promise<JobMatch> {
    const skillsScore = this.calculateSkillsMatch(userProfile.skills, job.requiredSkills);
    const experienceScore = this.calculateExperienceMatch(userProfile.experience, job);
    const educationScore = this.calculateEducationMatch(userProfile.education, job.requirements);
    const locationScore = this.calculateLocationMatch(userProfile.preferences, job.location);
    const salaryScore = this.calculateSalaryMatch(userProfile.preferences.salaryRange, job.salary);
    const cultureScore = await this.calculateCultureFit(userProfile, job.company);

    const overallScore = this.calculateOverallMatch({
      skills: skillsScore.score,
      experience: experienceScore.score,
      education: educationScore.score,
      location: locationScore.score,
      salary: salaryScore.score,
      culture: cultureScore.score
    });

    const matchReasons = this.generateMatchReasons({
      skills: skillsScore,
      experience: experienceScore,
      education: educationScore,
      location: locationScore,
      salary: salaryScore,
      culture: cultureScore
    });

    const gapAnalysis = this.analyzeSkillGaps(userProfile.skills, job.requiredSkills);
    const salaryPrediction = this.predictSalary(userProfile, job);
    const careerTrajectory = this.analyzeCareerTrajectory(userProfile, job);
    const applicationRecommendations = this.generateApplicationTips(userProfile, job, overallScore);
    const interviewTips = this.generateInterviewTips(userProfile, job);

    return {
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      matchScore: overallScore,
      compatibilityScores: {
        skills: skillsScore.score,
        experience: experienceScore.score,
        education: educationScore.score,
        location: locationScore.score,
        salary: salaryScore.score,
        culture: cultureScore.score
      },
      matchReasons,
      gapAnalysis,
      salaryPrediction,
      careerTrajectory,
      applicationRecommendations,
      interviewTips
    };
  }

  /**
   * Calculate skills compatibility using cosine similarity
   */
  private calculateSkillsMatch(userSkills: ExtractedSkill[], requiredSkills: any[]): any {
    const userSkillMap = new Map(userSkills.map(skill => [skill.name.toLowerCase(), skill]));
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const reqSkill of requiredSkills) {
      const skillName = reqSkill.name.toLowerCase();
      const weight = reqSkill.importance || 1;
      totalWeight += weight;

      if (userSkillMap.has(skillName)) {
        const userSkill = userSkillMap.get(skillName)!;
        const skillLevel = this.getSkillLevel(userSkill.level);
        const requiredLevel = reqSkill.level || 3;
        
        if (skillLevel >= requiredLevel) {
          matchedWeight += weight;
          matchedSkills.push(skillName);
        } else {
          matchedWeight += weight * (skillLevel / requiredLevel);
          missingSkills.push(skillName);
        }
      } else {
        missingSkills.push(skillName);
      }
    }

    const score = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;

    return {
      score: Math.round(score),
      matched: matchedSkills,
      missing: missingSkills,
      details: 'Skills analysis completed'
    };
  }

  /**
   * Calculate experience compatibility
   */
  private calculateExperienceMatch(userExperience: WorkExperience[], job: any): any {
    let score = 0;
    const factors: string[] = [];

    // Years of experience
    const totalExperience = userExperience.reduce((total, exp) => total + exp.duration, 0) / 12;
    const requiredExperience = job.experienceRequired || 0;
    
    if (totalExperience >= requiredExperience) {
      score += 40;
      factors.push('Meets experience requirements');
    } else {
      score += (totalExperience / requiredExperience) * 40;
      factors.push('Partial experience match');
    }

    // Industry experience
    const relevantIndustryExp = userExperience.filter(exp => 
      exp.industry === job.industry || this.isRelatedIndustry(exp.industry, job.industry)
    );
    
    if (relevantIndustryExp.length > 0) {
      score += 30;
      factors.push('Relevant industry experience');
    }

    // Seniority level
    const maxSeniority = this.getMaxSeniorityLevel(userExperience);
    const requiredSeniority = job.seniorityLevel || 'mid';
    
    if (this.compareSeniorityLevels(maxSeniority, requiredSeniority) >= 0) {
      score += 30;
      factors.push('Appropriate seniority level');
    }

    return {
      score: Math.min(score, 100),
      factors,
      details: `${totalExperience} years experience, ${relevantIndustryExp.length} relevant roles`
    };
  }

  /**
   * Calculate education compatibility
   */
  private calculateEducationMatch(userEducation: Education[], jobRequirements: any): any {
    let score = 50; // Base score for having education
    const factors: string[] = [];

    if (!jobRequirements.educationRequired) {
      return { score: 100, factors: ['No specific education required'], details: 'Education not specified' };
    }

    const requiredDegree = jobRequirements.degree;
    const requiredField = jobRequirements.field;

    // Check degree level
    const hasDegree = userEducation.some(edu => 
      this.compareDegreeLevel(edu.degree, requiredDegree) >= 0
    );

    if (hasDegree) {
      score += 30;
      factors.push('Meets degree requirement');
    }

    // Check field relevance
    if (requiredField) {
      const hasRelevantField = userEducation.some(edu => 
        edu.field.toLowerCase().includes(requiredField.toLowerCase()) ||
        this.isRelatedField(edu.field, requiredField)
      );

      if (hasRelevantField) {
        score += 20;
        factors.push('Relevant field of study');
      }
    }

    return {
      score: Math.min(score, 100),
      factors,
      details: 'Education compatibility assessed'
    };
  }

  /**
   * Calculate location compatibility
   */
  private calculateLocationMatch(preferences: JobPreferences, jobLocation: string): any {
    let score = 0;
    const factors: string[] = [];

    // Remote work preferences
    if (preferences.remoteWork === 'only' && jobLocation.toLowerCase().includes('remote')) {
      score = 100;
      factors.push('Perfect remote work match');
    } else if (preferences.remoteWork === 'office_only' && !jobLocation.toLowerCase().includes('remote')) {
      score = 100;
      factors.push('Office-based position as preferred');
    } else if (preferences.remoteWork === 'hybrid') {
      score = jobLocation.toLowerCase().includes('hybrid') ? 100 : 70;
      factors.push('Hybrid work consideration');
    } else {
      // Check location preferences
      const isPreferredLocation = preferences.locations.some(loc => 
        jobLocation.toLowerCase().includes(loc.toLowerCase())
      );

      if (isPreferredLocation) {
        score = 90;
        factors.push('Preferred location match');
      } else {
        score = 50;
        factors.push('Location requires consideration');
      }
    }

    return {
      score,
      factors,
      details: `Location analysis for ${jobLocation}`
    };
  }

  /**
   * Calculate salary compatibility
   */
  private calculateSalaryMatch(userRange: { min: number; max: number }, jobSalary: any): any {
    let score = 0;
    const factors: string[] = [];

    if (!jobSalary || !jobSalary.min) {
      return { score: 70, factors: ['Salary not disclosed'], details: 'Salary information unavailable' };
    }

    const jobMin = jobSalary.min;
    const jobMax = jobSalary.max || jobMin;

    // Check if ranges overlap
    if (jobMax >= userRange.min && jobMin <= userRange.max) {
      const overlapSize = Math.min(jobMax, userRange.max) - Math.max(jobMin, userRange.min);
      const userRangeSize = userRange.max - userRange.min;
      const overlapPercentage = userRangeSize > 0 ? (overlapSize / userRangeSize) * 100 : 100;
      
      score = Math.min(overlapPercentage, 100);
      factors.push('Salary range overlap detected');
    } else if (jobMin > userRange.max) {
      score = 100;
      factors.push('Salary exceeds expectations');
    } else {
      score = (jobMax / userRange.min) * 100;
      factors.push('Salary below expectations');
    }

    return {
      score: Math.min(score, 100),
      factors,
      details: `Salary range: ${jobMin}-${jobMax}`
    };
  }

  /**
   * Calculate culture fit using AI analysis
   */
  private async calculateCultureFit(userProfile: UserProfile, company: any): Promise<any> {
    let score = 70; // Default neutral score
    const factors: string[] = [];

    if (!userProfile.personalityProfile || !company.culture) {
      return { score, factors: ['Limited culture data'], details: 'Culture analysis limited' };
    }

    const personality = userProfile.personalityProfile;
    const culture = company.culture;

    // Work style compatibility
    if (this.isWorkStyleCompatible(personality.workStyle, culture.workStyle)) {
      score += 15;
      factors.push('Compatible work style');
    }

    // Communication style
    if (this.isCommunicationStyleCompatible(personality.communicationStyle, culture.communicationStyle)) {
      score += 10;
      factors.push('Aligned communication approach');
    }

    // Innovation preference
    if (this.isInnovationCompatible(personality.innovationPreference, culture.innovationType)) {
      score += 5;
      factors.push('Innovation mindset alignment');
    }

    return {
      score: Math.min(score, 100),
      factors,
      details: 'Culture fit analysis completed'
    };
  }

  /**
   * Calculate overall match score with weighted factors
   */
  private calculateOverallMatch(scores: any): number {
    const weights = {
      skills: 0.35,      // 35% - Most important
      experience: 0.25,  // 25%
      location: 0.15,    // 15%
      education: 0.10,   // 10%
      salary: 0.10,      // 10%
      culture: 0.05      // 5%
    };

    return Math.round(
      scores.skills * weights.skills +
      scores.experience * weights.experience +
      scores.location * weights.location +
      scores.education * weights.education +
      scores.salary * weights.salary +
      scores.culture * weights.culture
    );
  }

  /**
   * Generate match reasons
   */
  private generateMatchReasons(analysisResults: any): MatchReason[] {
    const reasons: MatchReason[] = [];

    if (analysisResults.skills.score >= 80) {
      reasons.push({
        type: 'skill_match',
        description: 'Strong skills alignment with job requirements',
        weight: 0.35,
        confidence: analysisResults.skills.score / 100
      });
    }

    if (analysisResults.experience.score >= 70) {
      reasons.push({
        type: 'experience_match',
        description: 'Relevant experience for this role',
        weight: 0.25,
        confidence: analysisResults.experience.score / 100
      });
    }

    if (analysisResults.location.score >= 90) {
      reasons.push({
        type: 'location_preference',
        description: 'Location matches your preferences',
        weight: 0.15,
        confidence: analysisResults.location.score / 100
      });
    }

    return reasons.sort((a, b) => (b.weight * b.confidence) - (a.weight * a.confidence));
  }

  /**
   * Analyze skill gaps
   */
  private analyzeSkillGaps(userSkills: ExtractedSkill[], requiredSkills: any[]): SkillGap[] {
    const gaps: SkillGap[] = [];
    const userSkillMap = new Map(userSkills.map(skill => [skill.name.toLowerCase(), skill]));

    for (const reqSkill of requiredSkills) {
      const skillName = reqSkill.name.toLowerCase();
      const userSkill = userSkillMap.get(skillName);
      
      if (!userSkill) {
        gaps.push({
          skill: reqSkill.name,
          required: reqSkill.required || false,
          userLevel: 0,
          requiredLevel: (reqSkill.level || 3) * 25,
          gap: (reqSkill.level || 3) * 25,
          learningPath: this.generateLearningPath(reqSkill.name),
          timeToAcquire: this.estimateLearningTime(reqSkill.name, 0, reqSkill.level || 3)
        });
      } else {
        const userLevel = this.getSkillLevel(userSkill.level) * 25;
        const requiredLevel = (reqSkill.level || 3) * 25;
        
        if (userLevel < requiredLevel) {
          gaps.push({
            skill: reqSkill.name,
            required: reqSkill.required || false,
            userLevel,
            requiredLevel,
            gap: requiredLevel - userLevel,
            learningPath: this.generateLearningPath(reqSkill.name),
            timeToAcquire: this.estimateLearningTime(reqSkill.name, userLevel, requiredLevel)
          });
        }
      }
    }

    return gaps.sort((a, b) => (b.required ? 1 : 0) - (a.required ? 1 : 0) || b.gap - a.gap);
  }

  /**
   * Predict salary based on user profile and job
   */
  private predictSalary(userProfile: UserProfile, job: any): SalaryPrediction {
    const baseSalary = job.salary?.min || 50000;
    const factors: SalaryFactor[] = [];
    let adjustment = 0;

    // Experience factor
    const totalExp = userProfile.experience.reduce((total, exp) => total + exp.duration, 0) / 12;
    const expFactor = Math.min(totalExp * 0.05, 0.3);
    adjustment += expFactor;
    factors.push({
      factor: 'Years of Experience',
      impact: Math.round(expFactor * 100),
      description: `${totalExp} years of experience`
    });

    // Skills factor
    const skillsScore = this.calculateSkillsMatch(userProfile.skills, job.requiredSkills || []);
    const skillsFactor = (skillsScore.score / 100) * 0.2;
    adjustment += skillsFactor;
    factors.push({
      factor: 'Skills Match',
      impact: Math.round(skillsFactor * 100),
      description: `${skillsScore.score}% skills compatibility`
    });

    // Education factor
    const hasAdvancedDegree = userProfile.education.some(edu => 
      ['master', 'phd', 'mba'].includes(edu.degree.toLowerCase())
    );
    if (hasAdvancedDegree) {
      adjustment += 0.15;
      factors.push({
        factor: 'Advanced Education',
        impact: 15,
        description: 'Advanced degree premium'
      });
    }

    const predictedSalary = Math.round(baseSalary * (1 + adjustment));
    const confidence = this.calculateSalaryConfidence(factors);

    return {
      predictedSalary,
      salaryRange: {
        min: Math.round(predictedSalary * 0.9),
        max: Math.round(predictedSalary * 1.15)
      },
      confidence,
      factors,
      negotiationInsights: this.generateNegotiationTips(factors, confidence)
    };
  }

  /**
   * Analyze career trajectory
   */
  private analyzeCareerTrajectory(userProfile: UserProfile, job: any): CareerTrajectory {
    const currentLevel = this.determineCurrentLevel(userProfile);
    const targetLevel = this.determineTargetLevel(job);
    
    const probabilityOfPromotion = this.calculatePromotionProbability(userProfile, job);
    const timeToPromotion = this.estimatePromotionTime(currentLevel, targetLevel);
    const nextRoles = this.getNextPossibleRoles(job.title, userProfile.skills);
    const careerPath = this.generateCareerPath(currentLevel, userProfile.careerGoals);

    return {
      currentLevel,
      targetLevel,
      probabilityOfPromotion,
      timeToPromotion,
      nextRoles,
      careerPath
    };
  }

  /**
   * Generate application recommendations
   */
  private generateApplicationTips(userProfile: UserProfile, job: any, matchScore: number): string[] {
    const tips: string[] = [];

    if (matchScore >= 80) {
      tips.push('Strong match - apply immediately and highlight your key qualifying skills');
    } else if (matchScore >= 60) {
      tips.push('Good match - emphasize transferable skills and relevant experience');
    } else {
      tips.push('Consider strengthening missing skills before applying');
    }

    // Skills-based tips
    const skillsMatch = this.calculateSkillsMatch(userProfile.skills, job.requiredSkills || []);
    if (skillsMatch.matched.length > 0) {
      tips.push(`Highlight these matching skills: ${skillsMatch.matched.slice(0, 3).join(', ')}`);
    }

    if (skillsMatch.missing.length > 0) {
      tips.push(`Consider gaining experience in: ${skillsMatch.missing.slice(0, 2).join(', ')}`);
    }

    return tips;
  }

  /**
   * Generate interview tips
   */
  private generateInterviewTips(userProfile: UserProfile, job: any): string[] {
    const tips: string[] = [
      'Research the company culture and recent news',
      'Prepare specific examples using the STAR method',
      'Practice explaining your career transition story'
    ];

    // Add role-specific tips
    if (job.title.toLowerCase().includes('manager')) {
      tips.push('Prepare leadership and team management examples');
    }

    if (job.title.toLowerCase().includes('senior')) {
      tips.push('Emphasize mentoring and strategic thinking experiences');
    }

    return tips;
  }

  // Helper methods initialization and utilities
  private initializeWeights(): void {
    this.skillWeights = new Map([
      ['technical', 1.0],
      ['soft', 0.7],
      ['industry', 0.8],
      ['certification', 0.9]
    ]);

    this.experienceWeights = new Map([
      ['direct', 1.0],
      ['related', 0.8],
      ['transferable', 0.6]
    ]);
  }

  private initializeIndustryMatrix(): void {
    this.industryTransitionMatrix = new Map([
      ['technology', new Map([
        ['technology', 1.0],
        ['finance', 0.8],
        ['healthcare', 0.6],
        ['education', 0.5]
      ])],
      ['finance', new Map([
        ['finance', 1.0],
        ['technology', 0.7],
        ['consulting', 0.8],
        ['insurance', 0.9]
      ])]
    ]);
  }

  private initializeCareerPaths(): void {
    this.roleProgressionPaths = new Map([
      ['software engineer', ['senior software engineer', 'lead engineer', 'engineering manager', 'senior manager']],
      ['data analyst', ['senior data analyst', 'data scientist', 'senior data scientist', 'data science manager']],
      ['marketing coordinator', ['marketing specialist', 'senior marketing specialist', 'marketing manager', 'senior marketing manager']]
    ]);
  }

  private initializeSalaryData(): void {
    this.salaryData = new Map([
      ['software engineer', { base: 75000, experience: 5000, education: 10000 }],
      ['data scientist', { base: 85000, experience: 6000, education: 15000 }],
      ['product manager', { base: 90000, experience: 7000, education: 12000 }]
    ]);
  }

  private initializeLocationFactors(): void {
    this.locationFactors = new Map([
      ['san francisco', 1.4],
      ['new york', 1.3],
      ['seattle', 1.2],
      ['austin', 1.1],
      ['remote', 0.95]
    ]);
  }

  // Utility methods
  private getSkillLevel(level?: string): number {
    const levelMap = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    return levelMap[level as keyof typeof levelMap] || 2;
  }

  private isRelatedIndustry(userIndustry: string, jobIndustry: string): boolean {
    const matrix = this.industryTransitionMatrix.get(userIndustry);
    return matrix ? (matrix.get(jobIndustry) || 0) > 0.6 : false;
  }

  private getMaxSeniorityLevel(experience: WorkExperience[]): string {
    const levels = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'];
    let maxLevel = 'entry';
    
    for (const exp of experience) {
      const currentIndex = levels.indexOf(exp.seniority);
      const maxIndex = levels.indexOf(maxLevel);
      if (currentIndex > maxIndex) {
        maxLevel = exp.seniority;
      }
    }
    
    return maxLevel;
  }

  private compareSeniorityLevels(userLevel: string, requiredLevel: string): number {
    const levels = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'];
    return levels.indexOf(userLevel) - levels.indexOf(requiredLevel);
  }

  private compareDegreeLevel(userDegree: string, requiredDegree: string): number {
    const degrees = ['high school', 'associate', 'bachelor', 'master', 'phd'];
    const userIndex = degrees.findIndex(d => userDegree.toLowerCase().includes(d));
    const requiredIndex = degrees.findIndex(d => requiredDegree.toLowerCase().includes(d));
    return userIndex - requiredIndex;
  }

  private isRelatedField(userField: string, requiredField: string): boolean {
    const relatedFields = new Map([
      ['computer science', ['software engineering', 'information technology', 'data science']],
      ['business', ['management', 'marketing', 'finance', 'economics']],
      ['engineering', ['mechanical engineering', 'electrical engineering', 'civil engineering']]
    ]);

    for (const [field, related] of relatedFields) {
      if (userField.toLowerCase().includes(field) && 
          related.some(r => requiredField.toLowerCase().includes(r))) {
        return true;
      }
    }
    return false;
  }

  private isWorkStyleCompatible(userStyle: string, companyStyle: string): boolean {
    const compatibilityMatrix = new Map([
      ['collaborative', ['team-oriented', 'collaborative', 'cooperative']],
      ['independent', ['autonomous', 'self-directed', 'independent']],
      ['mixed', ['flexible', 'adaptable', 'hybrid']]
    ]);

    const compatibleStyles = compatibilityMatrix.get(userStyle) || [];
    return compatibleStyles.some(style => companyStyle.toLowerCase().includes(style));
  }

  private isCommunicationStyleCompatible(userStyle: string, companyStyle: string): boolean {
    const compatibilityMatrix = new Map([
      ['direct', ['transparent', 'straightforward', 'direct']],
      ['diplomatic', ['respectful', 'considerate', 'diplomatic']],
      ['analytical', ['data-driven', 'logical', 'analytical']]
    ]);

    const compatibleStyles = compatibilityMatrix.get(userStyle) || [];
    return compatibleStyles.some(style => companyStyle.toLowerCase().includes(style));
  }

  private isInnovationCompatible(userPreference: string, companyType: string): boolean {
    const compatibilityMatrix = new Map([
      ['innovative', ['startup', 'tech', 'disruptive', 'cutting-edge']],
      ['stable', ['established', 'traditional', 'stable', 'conservative']],
      ['balanced', ['growing', 'mature', 'balanced', 'evolving']]
    ]);

    const compatibleTypes = compatibilityMatrix.get(userPreference) || [];
    return compatibleTypes.some(type => companyType.toLowerCase().includes(type));
  }

  private generateLearningPath(skill: string): string[] {
    const learningPaths = new Map([
      ['react', ['HTML/CSS basics', 'JavaScript fundamentals', 'React concepts', 'React hooks', 'Advanced patterns']],
      ['python', ['Python syntax', 'Data structures', 'Object-oriented programming', 'Libraries and frameworks']],
      ['project management', ['PM fundamentals', 'Agile methodology', 'Scrum certification', 'Leadership skills']]
    ]);

    return learningPaths.get(skill.toLowerCase()) || ['Basic concepts', 'Practical application', 'Advanced techniques'];
  }

  private estimateLearningTime(skill: string, currentLevel: number, targetLevel: number): string {
    const hoursPerLevel = 40; // hours needed per skill level
    const levelDifference = (targetLevel - currentLevel) / 25; // Convert percentage to level
    const totalHours = levelDifference * hoursPerLevel;
    
    if (totalHours <= 40) return '1-2 weeks';
    if (totalHours <= 120) return '1-3 months';
    if (totalHours <= 240) return '3-6 months';
    return '6+ months';
  }

  private calculateSalaryConfidence(factors: SalaryFactor[]): number {
    const totalImpact = factors.reduce((sum, factor) => sum + Math.abs(factor.impact), 0);
    return Math.min(0.7 + (totalImpact / 1000), 0.95); // Base 70% confidence
  }

  private generateNegotiationTips(factors: SalaryFactor[], confidence: number): string[] {
    const tips: string[] = [];
    
    if (confidence > 0.8) {
      tips.push('Strong position for salary negotiation based on your profile');
    }
    
    const strongFactors = factors.filter(f => f.impact > 10);
    if (strongFactors.length > 0) {
      tips.push(`Emphasize your ${strongFactors[0].factor.toLowerCase()} during negotiation`);
    }
    
    tips.push('Research market rates for your role and location');
    tips.push('Consider total compensation package, not just base salary');
    
    return tips;
  }

  private determineCurrentLevel(userProfile: UserProfile): string {
    const maxSeniority = this.getMaxSeniorityLevel(userProfile.experience);
    const totalExperience = userProfile.experience.reduce((total, exp) => total + exp.duration, 0) / 12;
    
    if (totalExperience < 2) return 'Junior';
    if (totalExperience < 5) return 'Mid-level';
    if (totalExperience < 8) return 'Senior';
    return 'Lead/Principal';
  }

  private determineTargetLevel(job: any): string {
    const title = job.title.toLowerCase();
    if (title.includes('junior') || title.includes('entry')) return 'Junior';
    if (title.includes('senior')) return 'Senior';
    if (title.includes('lead') || title.includes('principal')) return 'Lead/Principal';
    if (title.includes('manager') || title.includes('director')) return 'Management';
    return 'Mid-level';
  }

  private calculatePromotionProbability(userProfile: UserProfile, job: any): number {
    // Simplified calculation based on skill match and experience
    const skillsMatch = this.calculateSkillsMatch(userProfile.skills, job.requiredSkills || []);
    const experienceMatch = this.calculateExperienceMatch(userProfile.experience, job);
    
    const averageMatch = (skillsMatch.score + experienceMatch.score) / 2;
    return Math.min(averageMatch * 0.8, 95); // Cap at 95%
  }

  private estimatePromotionTime(currentLevel: string, targetLevel: string): string {
    const levelGap = this.compareSeniorityLevels(targetLevel.toLowerCase(), currentLevel.toLowerCase());
    
    if (levelGap <= 0) return 'Immediate';
    if (levelGap === 1) return '1-2 years';
    if (levelGap === 2) return '2-4 years';
    return '4+ years';
  }

  private getNextPossibleRoles(currentRole: string, skills: ExtractedSkill[]): string[] {
    const progressionPaths = this.roleProgressionPaths.get(currentRole.toLowerCase()) || [];
    return progressionPaths.slice(0, 3); // Return next 3 possible roles
  }

  private generateCareerPath(currentLevel: string, careerGoals: CareerGoals): CareerStep[] {
    return [
      {
        role: careerGoals.targetRole,
        timeframe: careerGoals.timeframe,
        requiredSkills: ['leadership', 'strategic thinking', 'domain expertise'],
        probability: 75
      }
    ];
  }
}