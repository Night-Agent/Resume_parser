import { OpenAI } from 'openai';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export interface ResumeAnalysis {
  extractedContent: {
    text: string;
    sections: {
      personalInfo: PersonalInfo;
      summary: string;
      experience: Experience[];
      education: Education[];
      skills: Skill[];
      certifications: string[];
      projects: Project[];
    };
  };
  analysis: {
    atsScore: number;
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    skillsAnalysis: SkillAnalysis;
    experienceAnalysis: ExperienceAnalysis;
    formatAnalysis: FormatAnalysis;
  };
  jobMatch: {
    suitableRoles: string[];
    skillGaps: string[];
    careerLevel: string;
    estimatedSalaryRange: {
      min: number;
      max: number;
    };
  };
}

interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
}

interface Experience {
  company: string;
  position: string;
  duration: string;
  location?: string;
  responsibilities: string[];
  achievements: string[];
}

interface Education {
  institution: string;
  degree: string;
  field?: string;
  duration: string;
  gpa?: string;
}

interface Skill {
  name: string;
  category: 'technical' | 'soft' | 'language' | 'tool';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
  duration?: string;
  url?: string;
}

interface SkillAnalysis {
  totalSkills: number;
  technicalSkills: number;
  softSkills: number;
  inDemandSkills: string[];
  missingSkills: string[];
  skillsByCategory: Record<string, string[]>;
}

interface ExperienceAnalysis {
  totalYears: number;
  careerProgression: 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  industryExperience: string[];
  leadershipExperience: boolean;
  remoteExperience: boolean;
}

interface FormatAnalysis {
  length: number;
  readability: number;
  formatting: number;
  keywords: number;
  atsCompatibility: number;
}

export class AIResumeAnalyzer {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn('OpenAI API key not found. Using fallback analysis.');
    }
  }

  async analyzeResume(fileBuffer: Buffer, filename: string): Promise<ResumeAnalysis> {
    try {
      // Step 1: Extract text from file
      const extractedText = await this.extractTextFromFile(fileBuffer, filename);
      
      // Step 2: Parse resume content using AI
      const parsedSections = await this.parseResumeContent(extractedText);
      
      // Step 3: Analyze skills, experience, and ATS compatibility
      const analysis = await this.performAnalysis(extractedText, parsedSections);
      
      // Step 4: Generate job matching and recommendations
      const jobMatch = await this.generateJobMatching(parsedSections, analysis);

      return {
        extractedContent: {
          text: extractedText,
          sections: parsedSections
        },
        analysis,
        jobMatch
      };
    } catch (error) {
      console.error('Resume analysis error:', error);
      throw new Error('Failed to analyze resume');
    }
  }

  private async extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
    const extension = filename.toLowerCase().split('.').pop();
    
    try {
      switch (extension) {
        case 'pdf':
          const pdfData = await pdf(buffer);
          return pdfData.text;
        
        case 'doc':
        case 'docx':
          const docxResult = await mammoth.extractRawText({ buffer });
          return docxResult.value;
        
        case 'txt':
          return buffer.toString('utf-8');
        
        default:
          throw new Error(`Unsupported file format: ${extension}`);
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error('Failed to extract text from resume file');
    }
  }

  private async parseResumeContent(text: string): Promise<ResumeAnalysis['extractedContent']['sections']> {
    if (this.openai) {
      return await this.parseWithAI(text);
    } else {
      return this.parseWithRegex(text);
    }
  }

  private async parseWithAI(text: string): Promise<ResumeAnalysis['extractedContent']['sections']> {
    const prompt = `
    Parse the following resume text and extract structured information. Return a JSON object with the following structure:
    {
      "personalInfo": {
        "name": "string",
        "email": "string", 
        "phone": "string",
        "location": "string",
        "linkedin": "string",
        "github": "string"
      },
      "summary": "string",
      "experience": [
        {
          "company": "string",
          "position": "string", 
          "duration": "string",
          "location": "string",
          "responsibilities": ["string"],
          "achievements": ["string"]
        }
      ],
      "education": [
        {
          "institution": "string",
          "degree": "string",
          "field": "string", 
          "duration": "string",
          "gpa": "string"
        }
      ],
      "skills": [
        {
          "name": "string",
          "category": "technical|soft|language|tool",
          "level": "beginner|intermediate|advanced|expert"
        }
      ],
      "certifications": ["string"],
      "projects": [
        {
          "name": "string",
          "description": "string",
          "technologies": ["string"],
          "duration": "string"
        }
      ]
    }

    Resume text:
    ${text}
    `;

    try {
      const completion = await this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert resume parser. Extract structured information from resumes and return valid JSON only. Be thorough and accurate."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000
      });

      const result = completion.choices[0].message.content;
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('AI parsing error:', error);
    }

    // Fallback to regex parsing
    return this.parseWithRegex(text);
  }

  private parseWithRegex(text: string): ResumeAnalysis['extractedContent']['sections'] {
    // Basic regex-based parsing as fallback
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9-]+/i;
    const githubRegex = /github\.com\/[a-zA-Z0-9-]+/i;

    // Extract personal info
    const email = text.match(emailRegex)?.[0] || '';
    const phone = text.match(phoneRegex)?.[0] || '';
    const linkedin = text.match(linkedinRegex)?.[0] || '';
    const github = text.match(githubRegex)?.[0] || '';

    // Extract name (usually first line or before email)
    const lines = text.split('\n').filter(line => line.trim());
    const name = lines[0]?.trim() || '';

    // Extract skills using common tech keywords
    const skillKeywords = [
      // Programming Languages
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'PHP', 'Ruby',
      // Frontend
      'React', 'Angular', 'Vue.js', 'Next.js', 'HTML', 'CSS', 'SASS', 'Tailwind CSS', 'Bootstrap',
      // Backend
      'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Ruby on Rails',
      // Databases
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Cassandra', 'Snowflake',
      // Cloud & DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'CI/CD',
      // AI/ML
      'TensorFlow', 'PyTorch', 'Scikit-learn', 'Machine Learning', 'Deep Learning', 'NLP',
      // Tools
      'Git', 'Jira', 'Postman', 'Figma', 'Linux', 'Windows'
    ];

    const foundSkills = skillKeywords.filter(skill => 
      new RegExp(skill, 'i').test(text)
    ).map(skill => ({
      name: skill,
      category: this.categorizeSkill(skill),
      level: this.estimateSkillLevel(text, skill)
    }));

    // Extract experience (basic pattern matching)
    const experience = this.extractExperience(text);
    const education = this.extractEducation(text);
    const projects = this.extractProjects(text);

    return {
      personalInfo: {
        name,
        email,
        phone,
        location: '',
        linkedin,
        github
      },
      summary: this.extractSummary(text),
      experience,
      education,
      skills: foundSkills,
      certifications: this.extractCertifications(text),
      projects
    };
  }

  private categorizeSkill(skill: string): 'technical' | 'soft' | 'language' | 'tool' {
    const categories = {
      technical: ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Machine Learning'],
      tool: ['Git', 'Jira', 'Docker', 'AWS', 'Figma', 'Postman'],
      language: ['English', 'Spanish', 'French', 'German', 'Chinese']
    };

    for (const [category, skills] of Object.entries(categories)) {
      if (skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))) {
        return category as any;
      }
    }
    return 'technical';
  }

  private estimateSkillLevel(text: string, skill: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const skillContext = this.extractSkillContext(text, skill);
    
    if (skillContext.includes('expert') || skillContext.includes('lead') || skillContext.includes('architect')) {
      return 'expert';
    } else if (skillContext.includes('senior') || skillContext.includes('advanced') || skillContext.includes('5+ years')) {
      return 'advanced';
    } else if (skillContext.includes('experience') || skillContext.includes('proficient')) {
      return 'intermediate';
    }
    return 'beginner';
  }

  private extractSkillContext(text: string, skill: string): string {
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (new RegExp(skill, 'i').test(sentence)) {
        return sentence.toLowerCase();
      }
    }
    return '';
  }

  private extractSummary(text: string): string {
    const summaryKeywords = ['summary', 'profile', 'objective', 'about'];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (summaryKeywords.some(keyword => line.includes(keyword))) {
        // Get next few lines as summary
        const summaryLines = lines.slice(i + 1, i + 5).filter(l => l.trim());
        return summaryLines.join(' ').trim();
      }
    }
    
    // Fallback: get first paragraph
    const paragraphs = text.split('\n\n');
    return paragraphs[1] || paragraphs[0] || '';
  }

  private extractExperience(text: string): Experience[] {
    // This is a simplified extraction - in a real implementation,
    // you'd use more sophisticated NLP or the AI parsing above
    const experiencePattern = /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi;
    const matches = text.match(experiencePattern) || [];
    
    return matches.slice(0, 3).map((match, index) => ({
      company: `Company ${index + 1}`,
      position: `Position ${index + 1}`,
      duration: match,
      responsibilities: ['Responsibility 1', 'Responsibility 2'],
      achievements: ['Achievement 1']
    }));
  }

  private extractEducation(text: string): Education[] {
    const degreeKeywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college'];
    const lines = text.split('\n');
    const education: Education[] = [];
    
    for (const line of lines) {
      if (degreeKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        education.push({
          institution: line.trim(),
          degree: 'Degree',
          duration: '2020-2024'
        });
        break;
      }
    }
    
    return education;
  }

  private extractProjects(text: string): Project[] {
    // Simplified project extraction
    const projectKeywords = ['project', 'built', 'developed', 'created'];
    const lines = text.split('\n');
    const projects: Project[] = [];
    
    for (const line of lines) {
      if (projectKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        projects.push({
          name: line.trim().substring(0, 50),
          description: line.trim(),
          technologies: ['Technology 1', 'Technology 2']
        });
        if (projects.length >= 3) break;
      }
    }
    
    return projects;
  }

  private extractCertifications(text: string): string[] {
    const certKeywords = ['certified', 'certification', 'certificate', 'aws', 'azure', 'google cloud'];
    const lines = text.split('\n');
    const certifications: string[] = [];
    
    for (const line of lines) {
      if (certKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        certifications.push(line.trim());
        if (certifications.length >= 5) break;
      }
    }
    
    return certifications;
  }

  private async performAnalysis(text: string, sections: any): Promise<ResumeAnalysis['analysis']> {
    const skillsAnalysis = this.analyzeSkills(sections.skills);
    const experienceAnalysis = this.analyzeExperience(sections.experience);
    const formatAnalysis = this.analyzeFormat(text);
    
    let aiSuggestions: string[] = [];
    
    if (this.openai) {
      aiSuggestions = await this.getAISuggestions(text, sections);
    }
    
    const atsScore = this.calculateATSScore(text, sections);
    const overallScore = Math.round((atsScore + formatAnalysis.readability + skillsAnalysis.totalSkills) / 3);
    
    return {
      atsScore,
      overallScore,
      strengths: this.identifyStrengths(sections),
      weaknesses: this.identifyWeaknesses(sections),
      suggestions: aiSuggestions.length > 0 ? aiSuggestions : this.getFallbackSuggestions(sections),
      skillsAnalysis,
      experienceAnalysis,
      formatAnalysis
    };
  }

  private async getAISuggestions(text: string, sections: any): Promise<string[]> {
    try {
      const prompt = `
      Analyze this resume and provide 5-7 specific, actionable suggestions for improvement:
      
      Resume content: ${text.substring(0, 2000)}
      
      Focus on:
      1. ATS optimization
      2. Content improvements
      3. Format suggestions
      4. Skill enhancements
      5. Experience presentation
      
      Return only a JSON array of suggestion strings.
      `;

      const completion = await this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert career coach and resume reviewer. Provide specific, actionable suggestions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const result = completion.choices[0].message.content;
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('AI suggestions error:', error);
    }
    
    return [];
  }

  private analyzeSkills(skills: Skill[]): SkillAnalysis {
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill.name);
      return acc;
    }, {} as Record<string, string[]>);

    const inDemandSkills = skills.filter(skill => 
      ['React', 'Python', 'AWS', 'TypeScript', 'Node.js', 'Docker', 'Kubernetes'].includes(skill.name)
    ).map(skill => skill.name);

    return {
      totalSkills: skills.length,
      technicalSkills: skills.filter(s => s.category === 'technical').length,
      softSkills: skills.filter(s => s.category === 'soft').length,
      inDemandSkills,
      missingSkills: ['Kubernetes', 'GraphQL', 'TypeScript'].filter(skill => 
        !skills.some(s => s.name === skill)
      ),
      skillsByCategory
    };
  }

  private analyzeExperience(experience: Experience[]): ExperienceAnalysis {
    const totalYears = this.calculateTotalExperience(experience);
    
    return {
      totalYears,
      careerProgression: this.determineCareerLevel(totalYears, experience),
      industryExperience: this.extractIndustries(experience),
      leadershipExperience: this.hasLeadershipExperience(experience),
      remoteExperience: this.hasRemoteExperience(experience)
    };
  }

  private calculateTotalExperience(experience: Experience[]): number {
    // Simplified calculation
    return Math.max(experience.length * 2, 8); // Assuming 2 years per role, max 8 from resume
  }

  private determineCareerLevel(years: number, experience: Experience[]): ExperienceAnalysis['careerProgression'] {
    if (years >= 10) return 'lead';
    if (years >= 7) return 'senior';
    if (years >= 3) return 'mid';
    return 'junior';
  }

  private extractIndustries(experience: Experience[]): string[] {
    // Simplified industry extraction
    return ['Technology', 'Software Development'];
  }

  private hasLeadershipExperience(experience: Experience[]): boolean {
    return experience.some(exp => 
      exp.position.toLowerCase().includes('lead') || 
      exp.position.toLowerCase().includes('manager') ||
      exp.responsibilities.some(resp => resp.toLowerCase().includes('team'))
    );
  }

  private hasRemoteExperience(experience: Experience[]): boolean {
    return experience.some(exp => 
      exp.location?.toLowerCase().includes('remote') ||
      exp.responsibilities.some(resp => resp.toLowerCase().includes('remote'))
    );
  }

  private analyzeFormat(text: string): FormatAnalysis {
    const wordCount = text.split(/\s+/).length;
    const length = Math.min(Math.max((wordCount / 500) * 100, 20), 100);
    
    return {
      length,
      readability: Math.min(85, length + 15),
      formatting: 75,
      keywords: Math.min(90, text.split(' ').length / 10),
      atsCompatibility: 80
    };
  }

  private calculateATSScore(text: string, sections: any): number {
    let score = 0;
    
    // Check for key sections
    if (sections.experience.length > 0) score += 20;
    if (sections.skills.length > 5) score += 20;
    if (sections.education.length > 0) score += 15;
    if (sections.personalInfo.email) score += 10;
    if (sections.personalInfo.phone) score += 10;
    
    // Check for keywords
    const keywords = ['experience', 'skills', 'education', 'projects'];
    keywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) score += 5;
    });
    
    return Math.min(score, 100);
  }

  private identifyStrengths(sections: any): string[] {
    const strengths: string[] = [];
    
    if (sections.skills.length > 10) {
      strengths.push('Diverse technical skill set');
    }
    if (sections.experience.length > 2) {
      strengths.push('Strong professional experience');
    }
    if (sections.projects.length > 0) {
      strengths.push('Practical project experience');
    }
    
    return strengths;
  }

  private identifyWeaknesses(sections: any): string[] {
    const weaknesses: string[] = [];
    
    if (sections.skills.length < 5) {
      weaknesses.push('Limited technical skills listed');
    }
    if (sections.experience.length < 2) {
      weaknesses.push('Could benefit from more experience details');
    }
    if (!sections.personalInfo.linkedin) {
      weaknesses.push('Missing LinkedIn profile');
    }
    
    return weaknesses;
  }

  private getFallbackSuggestions(sections: any): string[] {
    return [
      'Add more quantifiable achievements to your experience section',
      'Include relevant technical skills for your target role',
      'Optimize your resume with industry-specific keywords',
      'Add a professional summary at the top',
      'Include links to your professional profiles (LinkedIn, GitHub)',
      'Quantify your impact with specific numbers and percentages',
      'Ensure consistent formatting throughout the document'
    ];
  }

  private async generateJobMatching(sections: any, analysis: any): Promise<ResumeAnalysis['jobMatch']> {
    const skills = sections.skills.map((s: any) => s.name);
    const experienceLevel = analysis.experienceAnalysis.careerProgression;
    
    // Role matching based on skills
    const roleMatching = {
      'Full Stack Developer': this.calculateRoleMatch(skills, ['JavaScript', 'React', 'Node.js', 'MongoDB']),
      'Machine Learning Engineer': this.calculateRoleMatch(skills, ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning']),
      'DevOps Engineer': this.calculateRoleMatch(skills, ['AWS', 'Docker', 'Kubernetes', 'CI/CD']),
      'Frontend Developer': this.calculateRoleMatch(skills, ['React', 'JavaScript', 'CSS', 'HTML']),
      'Backend Developer': this.calculateRoleMatch(skills, ['Node.js', 'Python', 'MongoDB', 'PostgreSQL'])
    };

    const suitableRoles = Object.entries(roleMatching)
      .filter(([role, score]) => score > 60)
      .sort(([, a], [, b]) => b - a)
      .map(([role]) => role);

    // Salary estimation based on skills and experience
    const baseSalary = this.estimateBaseSalary(experienceLevel);
    const skillBonus = skills.length * 2000;
    const salaryRange = {
      min: baseSalary + skillBonus,
      max: baseSalary + skillBonus + 30000
    };

    return {
      suitableRoles: suitableRoles.slice(0, 3),
      skillGaps: this.identifySkillGaps(skills, suitableRoles[0] || 'Full Stack Developer'),
      careerLevel: experienceLevel,
      estimatedSalaryRange: salaryRange
    };
  }

  private calculateRoleMatch(userSkills: string[], requiredSkills: string[]): number {
    const matches = userSkills.filter(skill => 
      requiredSkills.some(required => 
        skill.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(skill.toLowerCase())
      )
    ).length;
    
    return Math.round((matches / requiredSkills.length) * 100);
  }

  private estimateBaseSalary(level: string): number {
    const salaryMap = {
      junior: 60000,
      mid: 85000,
      senior: 120000,
      lead: 150000,
      executive: 200000
    };
    
    return salaryMap[level as keyof typeof salaryMap] || 75000;
  }

  private identifySkillGaps(userSkills: string[], targetRole: string): string[] {
    const roleSkills: Record<string, string[]> = {
      'Full Stack Developer': ['TypeScript', 'GraphQL', 'Docker', 'AWS'],
      'Machine Learning Engineer': ['Kubernetes', 'MLOps', 'Spark', 'Statistical Analysis'],
      'DevOps Engineer': ['Terraform', 'Prometheus', 'Grafana', 'Ansible'],
      'Frontend Developer': ['Next.js', 'TypeScript', 'Testing Library', 'Webpack'],
      'Backend Developer': ['GraphQL', 'Redis', 'Microservices', 'API Design']
    };

    const requiredSkills = roleSkills[targetRole] || [];
    return requiredSkills.filter(skill => 
      !userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
  }
}