import natural from 'natural';
import { TfIdf } from 'natural';

export interface ExtractedSkill {
  name: string;
  category: 'technical' | 'soft' | 'industry' | 'language' | 'certification';
  confidence: number;
  context: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  relatedSkills?: string[];
  marketDemand?: 'high' | 'medium' | 'low';
  obsolescenceRisk?: 'low' | 'medium' | 'high';
}

export interface SkillGapAnalysis {
  missingSkills: string[];
  weakSkills: string[];
  strongSkills: string[];
  recommendedTraining: string[];
  careerPathAlignment: number;
}

export class SkillExtractor {
  private technicalSkills: Set<string>;
  private softSkills: Set<string>;
  private industrySkills: Map<string, string[]>;
  private skillSynonyms: Map<string, string[]>;
  private skillLevels: Map<string, string[]>;
  private tfidf: TfIdf;
  private stemmer: any;

  constructor() {
    this.technicalSkills = new Set([
      // Programming Languages
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift',
      'kotlin', 'scala', 'r', 'matlab', 'php', 'perl', 'lua', 'dart', 'elixir', 'clojure',
      
      // Frontend Technologies
      'react', 'angular', 'vue', 'svelte', 'nextjs', 'nuxt', 'gatsby', 'jquery', 'bootstrap',
      'tailwind', 'sass', 'less', 'webpack', 'vite', 'parcel', 'babel', 'eslint', 'prettier',
      
      // Backend Technologies
      'nodejs', 'express', 'nestjs', 'fastify', 'django', 'flask', 'fastapi', 'spring', 'laravel',
      'rails', 'asp.net', 'gin', 'fiber', 'actix', 'rocket', 'phoenix', 'koa', 'hapi',
      
      // Databases
      'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'cassandra',
      'dynamodb', 'neo4j', 'influxdb', 'couchbase', 'firebase', 'supabase', 'planetscale',
      
      // Cloud & DevOps
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'terraform',
      'ansible', 'vagrant', 'helm', 'istio', 'prometheus', 'grafana', 'elk', 'nginx', 'apache',
      
      // AI/ML
      'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'opencv', 'nltk', 'spacy',
      'transformers', 'bert', 'gpt', 'yolo', 'lstm', 'cnn', 'rnn', 'gan', 'reinforcement learning',
      
      // Blockchain
      'ethereum', 'solidity', 'web3', 'smart contracts', 'polygon', 'binance smart chain',
      'hyperledger', 'truffle', 'hardhat', 'metamask', 'ipfs', 'chainlink', 'defi', 'nft',
      
      // Mobile Development
      'react native', 'flutter', 'ionic', 'xamarin', 'cordova', 'swift ui', 'jetpack compose',
      
      // Testing
      'jest', 'cypress', 'selenium', 'playwright', 'mocha', 'jasmine', 'junit', 'pytest'
    ]);

    this.softSkills = new Set([
      'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
      'adaptability', 'creativity', 'time management', 'project management', 'negotiation',
      'presentation', 'public speaking', 'mentoring', 'coaching', 'collaboration',
      'emotional intelligence', 'conflict resolution', 'decision making', 'strategic thinking',
      'analytical thinking', 'attention to detail', 'multitasking', 'stress management',
      'customer service', 'sales', 'marketing', 'innovation', 'entrepreneurship'
    ]);

    this.industrySkills = new Map([
      ['finance', ['financial modeling', 'risk management', 'trading', 'investment analysis', 'compliance']],
      ['healthcare', ['medical terminology', 'hipaa', 'clinical research', 'pharmacology', 'patient care']],
      ['education', ['curriculum development', 'instructional design', 'assessment', 'classroom management']],
      ['retail', ['inventory management', 'pos systems', 'customer service', 'merchandising', 'supply chain']],
      ['manufacturing', ['lean manufacturing', 'six sigma', 'quality control', 'supply chain', 'automation']]
    ]);

    this.skillSynonyms = new Map([
      ['javascript', ['js', 'ecmascript', 'es6', 'es2015', 'vanilla js']],
      ['react', ['reactjs', 'react.js', 'react native']],
      ['nodejs', ['node.js', 'node', 'server-side javascript']],
      ['artificial intelligence', ['ai', 'machine learning', 'ml', 'deep learning', 'neural networks']],
      ['user interface', ['ui', 'frontend', 'front-end', 'client-side']],
      ['user experience', ['ux', 'usability', 'user research', 'interaction design']]
    ]);

    this.skillLevels = new Map([
      ['beginner', ['basic', 'novice', 'entry level', 'learning', 'familiar with']],
      ['intermediate', ['proficient', 'experienced', 'working knowledge', 'solid understanding']],
      ['advanced', ['expert', 'senior', 'deep expertise', 'mastery', 'specialist']],
      ['expert', ['guru', 'thought leader', 'authority', 'architect', 'principal']]
    ]);

    this.tfidf = new TfIdf();
    this.stemmer = natural.PorterStemmer;
  }

  /**
   * Extract skills from resume text with advanced NLP analysis
   */
  public extractSkills(text: string, jobDescription?: string): ExtractedSkill[] {
    const extractedSkills: ExtractedSkill[] = [];
    const normalizedText = this.normalizeText(text);
    const sentences = this.extractSentences(normalizedText);
    
    // Build TF-IDF model
    this.tfidf.addDocument(normalizedText);
    if (jobDescription) {
      this.tfidf.addDocument(this.normalizeText(jobDescription));
    }

    // Extract technical skills
    extractedSkills.push(...this.extractTechnicalSkills(sentences));
    
    // Extract soft skills
    extractedSkills.push(...this.extractSoftSkills(sentences));
    
    // Extract industry-specific skills
    extractedSkills.push(...this.extractIndustrySkills(sentences));
    
    // Extract language skills
    extractedSkills.push(...this.extractLanguageSkills(sentences));
    
    // Extract certifications
    extractedSkills.push(...this.extractCertifications(sentences));
    
    // Analyze skill levels and experience
    this.analyzeSkillLevels(extractedSkills, sentences);
    
    // Calculate market demand and obsolescence risk
    this.calculateMarketMetrics(extractedSkills);
    
    // Find related skills
    this.findRelatedSkills(extractedSkills);

    return this.deduplicateAndRankSkills(extractedSkills);
  }

  /**
   * Perform skills gap analysis against job requirements
   */
  public analyzeSkillsGap(resumeSkills: ExtractedSkill[], jobRequirements: string): SkillGapAnalysis {
    const requiredSkills = this.extractSkills(jobRequirements);
    const resumeSkillNames = new Set(resumeSkills.map(s => s.name.toLowerCase()));
    
    const missingSkills = requiredSkills
      .filter(skill => !resumeSkillNames.has(skill.name.toLowerCase()))
      .map(skill => skill.name);
    
    const weakSkills = resumeSkills
      .filter(skill => skill.confidence < 0.6 || (skill.level && ['beginner'].includes(skill.level)))
      .map(skill => skill.name);
    
    const strongSkills = resumeSkills
      .filter(skill => skill.confidence >= 0.8 && skill.level && ['advanced', 'expert'].includes(skill.level))
      .map(skill => skill.name);
    
    const recommendedTraining = this.generateTrainingRecommendations(missingSkills, weakSkills);
    const careerPathAlignment = this.calculateCareerAlignment(resumeSkills, requiredSkills);

    return {
      missingSkills,
      weakSkills,
      strongSkills,
      recommendedTraining,
      careerPathAlignment
    };
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\-\.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractSentences(text: string): string[] {
    return natural.SentenceTokenizer.tokenize(text);
  }

  private extractTechnicalSkills(sentences: string[]): ExtractedSkill[] {
    const skills: ExtractedSkill[] = [];
    
    for (const sentence of sentences) {
      for (const skill of this.technicalSkills) {
        const regex = new RegExp(`\\b${skill}\\b`, 'i');
        if (regex.test(sentence)) {
          const confidence = this.calculateConfidence(skill, sentence);
          const context = this.extractContext(skill, sentence);
          
          skills.push({
            name: skill,
            category: 'technical',
            confidence,
            context
          });
        }
      }
      
      // Check synonyms
      for (const [mainSkill, synonyms] of this.skillSynonyms) {
        for (const synonym of synonyms) {
          const regex = new RegExp(`\\b${synonym}\\b`, 'i');
          if (regex.test(sentence)) {
            const confidence = this.calculateConfidence(synonym, sentence);
            const context = this.extractContext(synonym, sentence);
            
            skills.push({
              name: mainSkill,
              category: 'technical',
              confidence,
              context
            });
          }
        }
      }
    }
    
    return skills;
  }

  private extractSoftSkills(sentences: string[]): ExtractedSkill[] {
    const skills: ExtractedSkill[] = [];
    
    for (const sentence of sentences) {
      for (const skill of this.softSkills) {
        const regex = new RegExp(`\\b${skill}\\b`, 'i');
        if (regex.test(sentence)) {
          const confidence = this.calculateConfidence(skill, sentence);
          const context = this.extractContext(skill, sentence);
          
          skills.push({
            name: skill,
            category: 'soft',
            confidence,
            context
          });
        }
      }
    }
    
    return skills;
  }

  private extractIndustrySkills(sentences: string[]): ExtractedSkill[] {
    const skills: ExtractedSkill[] = [];
    
    for (const sentence of sentences) {
      for (const [industry, industrySkills] of this.industrySkills) {
        for (const skill of industrySkills) {
          const regex = new RegExp(`\\b${skill}\\b`, 'i');
          if (regex.test(sentence)) {
            const confidence = this.calculateConfidence(skill, sentence);
            const context = this.extractContext(skill, sentence);
            
            skills.push({
              name: skill,
              category: 'industry',
              confidence,
              context
            });
          }
        }
      }
    }
    
    return skills;
  }

  private extractLanguageSkills(sentences: string[]): ExtractedSkill[] {
    const skills: ExtractedSkill[] = [];
    const languages = [
      'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'russian',
      'chinese', 'japanese', 'korean', 'arabic', 'hindi', 'bengali', 'tamil',
      'telugu', 'marathi', 'gujarati', 'punjabi', 'urdu', 'malayalam'
    ];
    
    for (const sentence of sentences) {
      for (const language of languages) {
        const regex = new RegExp(`\\b${language}\\b`, 'i');
        if (regex.test(sentence)) {
          const confidence = this.calculateConfidence(language, sentence);
          const context = this.extractContext(language, sentence);
          
          skills.push({
            name: language,
            category: 'language',
            confidence,
            context
          });
        }
      }
    }
    
    return skills;
  }

  private extractCertifications(sentences: string[]): ExtractedSkill[] {
    const skills: ExtractedSkill[] = [];
    const certifications = [
      'aws certified', 'azure certified', 'google cloud certified', 'cisco certified',
      'microsoft certified', 'oracle certified', 'pmp', 'scrum master', 'cissp',
      'comptia', 'itil', 'six sigma', 'prince2', 'cisa', 'cism', 'ceh'
    ];
    
    for (const sentence of sentences) {
      for (const cert of certifications) {
        const regex = new RegExp(`\\b${cert}\\b`, 'i');
        if (regex.test(sentence)) {
          const confidence = this.calculateConfidence(cert, sentence);
          const context = this.extractContext(cert, sentence);
          
          skills.push({
            name: cert,
            category: 'certification',
            confidence,
            context
          });
        }
      }
    }
    
    return skills;
  }

  private calculateConfidence(skill: string, sentence: string): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on context keywords
    const positiveKeywords = ['expert', 'proficient', 'experienced', 'skilled', 'advanced', 'master'];
    const negativeKeywords = ['basic', 'beginner', 'learning', 'familiar'];
    
    for (const keyword of positiveKeywords) {
      if (sentence.includes(keyword)) {
        confidence += 0.2;
      }
    }
    
    for (const keyword of negativeKeywords) {
      if (sentence.includes(keyword)) {
        confidence -= 0.1;
      }
    }
    
    // Increase confidence if skill appears with action verbs
    const actionVerbs = ['developed', 'built', 'created', 'implemented', 'designed', 'managed'];
    for (const verb of actionVerbs) {
      if (sentence.includes(verb)) {
        confidence += 0.15;
      }
    }
    
    // TF-IDF score contribution
    const tfidfScore = this.tfidf.tfidf(skill, 0);
    confidence += Math.min(tfidfScore * 0.1, 0.2);
    
    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  private extractContext(skill: string, sentence: string): string {
    const skillIndex = sentence.toLowerCase().indexOf(skill.toLowerCase());
    const start = Math.max(0, skillIndex - 50);
    const end = Math.min(sentence.length, skillIndex + skill.length + 50);
    return sentence.substring(start, end).trim();
  }

  private analyzeSkillLevels(skills: ExtractedSkill[], sentences: string[]): void {
    for (const skill of skills) {
      let level: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'intermediate';
      let yearsOfExperience = 0;
      
      // Analyze context for experience indicators
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(skill.name.toLowerCase())) {
          // Extract years of experience
          const yearMatch = sentence.match(/(\d+)\s*(years?|yrs?)/i);
          if (yearMatch) {
            yearsOfExperience = Math.max(yearsOfExperience, parseInt(yearMatch[1]));
          }
          
          // Determine level based on keywords
          for (const [levelName, keywords] of this.skillLevels) {
            for (const keyword of keywords) {
              if (sentence.toLowerCase().includes(keyword)) {
                level = levelName as any;
                break;
              }
            }
          }
        }
      }
      
      // Adjust level based on years of experience
      if (yearsOfExperience >= 7) level = 'expert';
      else if (yearsOfExperience >= 4) level = 'advanced';
      else if (yearsOfExperience >= 1) level = 'intermediate';
      else if (yearsOfExperience > 0) level = 'beginner';
      
      skill.level = level;
      if (yearsOfExperience > 0) {
        skill.yearsOfExperience = yearsOfExperience;
      }
    }
  }

  private calculateMarketMetrics(skills: ExtractedSkill[]): void {
    // Market demand mapping (simplified - in real implementation, this would come from job market APIs)
    const highDemandSkills = new Set([
      'react', 'nodejs', 'python', 'aws', 'kubernetes', 'machine learning',
      'typescript', 'go', 'rust', 'blockchain', 'cybersecurity'
    ]);
    
    const lowObsolescenceSkills = new Set([
      'javascript', 'python', 'sql', 'git', 'leadership', 'communication',
      'problem solving', 'project management'
    ]);
    
    for (const skill of skills) {
      // Calculate market demand
      if (highDemandSkills.has(skill.name.toLowerCase())) {
        skill.marketDemand = 'high';
      } else if (skill.category === 'soft') {
        skill.marketDemand = 'medium';
      } else {
        skill.marketDemand = 'medium';
      }
      
      // Calculate obsolescence risk
      if (lowObsolescenceSkills.has(skill.name.toLowerCase())) {
        skill.obsolescenceRisk = 'low';
      } else if (skill.category === 'soft') {
        skill.obsolescenceRisk = 'low';
      } else {
        skill.obsolescenceRisk = 'medium';
      }
    }
  }

  private findRelatedSkills(skills: ExtractedSkill[]): void {
    const skillRelations = new Map([
      ['react', ['javascript', 'typescript', 'jsx', 'redux', 'hooks']],
      ['nodejs', ['javascript', 'express', 'npm', 'mongodb', 'api']],
      ['python', ['django', 'flask', 'pandas', 'numpy', 'scikit-learn']],
      ['aws', ['cloud computing', 'ec2', 's3', 'lambda', 'devops']],
      ['machine learning', ['python', 'tensorflow', 'pytorch', 'data science', 'ai']]
    ]);
    
    for (const skill of skills) {
      const related = skillRelations.get(skill.name.toLowerCase());
      if (related) {
        skill.relatedSkills = related;
      }
    }
  }

  private deduplicateAndRankSkills(skills: ExtractedSkill[]): ExtractedSkill[] {
    const skillMap = new Map<string, ExtractedSkill>();
    
    // Deduplicate by taking the highest confidence instance
    for (const skill of skills) {
      const key = skill.name.toLowerCase();
      const existing = skillMap.get(key);
      
      if (!existing || skill.confidence > existing.confidence) {
        skillMap.set(key, skill);
      }
    }
    
    // Sort by confidence descending
    return Array.from(skillMap.values()).sort((a, b) => b.confidence - a.confidence);
  }

  private generateTrainingRecommendations(missingSkills: string[], weakSkills: string[]): string[] {
    const recommendations: string[] = [];
    
    // Add online courses for missing technical skills
    for (const skill of missingSkills) {
      if (this.technicalSkills.has(skill.toLowerCase())) {
        recommendations.push(`Complete online course in ${skill}`);
      }
    }
    
    // Add practice recommendations for weak skills
    for (const skill of weakSkills.slice(0, 5)) { // Limit to top 5
      recommendations.push(`Practice and strengthen ${skill} through projects`);
    }
    
    return recommendations;
  }

  private calculateCareerAlignment(resumeSkills: ExtractedSkill[], requiredSkills: ExtractedSkill[]): number {
    if (requiredSkills.length === 0) return 0;
    
    const resumeSkillNames = new Set(resumeSkills.map(s => s.name.toLowerCase()));
    const matchingSkills = requiredSkills.filter(skill => 
      resumeSkillNames.has(skill.name.toLowerCase())
    );
    
    return Math.round((matchingSkills.length / requiredSkills.length) * 100);
  }

  /**
   * Predict skill obsolescence based on market trends
   */
  public predictSkillObsolescence(skills: ExtractedSkill[]): Map<string, number> {
    const obsolescenceMap = new Map<string, number>();
    
    // Simplified model - in real implementation, this would use ML models
    const obsolescenceFactors = new Map([
      ['jquery', 0.8], // High obsolescence
      ['angular.js', 0.9],
      ['flash', 0.95],
      ['react', 0.1], // Low obsolescence
      ['python', 0.05],
      ['javascript', 0.1]
    ]);
    
    for (const skill of skills) {
      const factor = obsolescenceFactors.get(skill.name.toLowerCase()) || 0.3;
      obsolescenceMap.set(skill.name, factor);
    }
    
    return obsolescenceMap;
  }

  /**
   * Generate skill development roadmap
   */
  public generateSkillRoadmap(currentSkills: ExtractedSkill[], targetRole: string): any {
    // This would integrate with career path data and generate personalized roadmaps
    return {
      currentLevel: 'Intermediate',
      targetLevel: 'Senior',
      timeToTarget: '18 months',
      skillsToAcquire: ['advanced react patterns', 'system design', 'team leadership'],
      skillsToImprove: ['python', 'aws'],
      milestones: [
        { month: 3, goal: 'Complete advanced React course' },
        { month: 6, goal: 'Lead a team project' },
        { month: 12, goal: 'Architect a full-stack application' }
      ]
    };
  }
}