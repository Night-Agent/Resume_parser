import axios from 'axios';
import { OpenAI } from 'openai';

// Real AI Service Integration with Python Backend
export class AIService {
  private openai: OpenAI | null = null;
  private pythonAIUrl: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
    
    // Python AI service URL
    this.pythonAIUrl = process.env.PYTHON_AI_URL || 'http://localhost:5001';
  }

  async analyzeResume(resumeText: string): Promise<any> {
    try {
      console.log('📄 Starting real AI resume analysis...');
      
      // Call Python AI service for comprehensive analysis
      const response = await axios.post(`${this.pythonAIUrl}/analyze`, {
        text: resumeText
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('✅ Python AI analysis completed successfully');
        return {
          success: true,
          analysis: response.data.analysis,
          source: 'Python AI Service',
          processed_at: response.data.processed_at
        };
      } else {
        throw new Error(response.data.error || 'Python AI service failed');
      }
      
    } catch (error: any) {
      console.error('❌ Python AI service error:', error.message);
      console.log('🔄 Falling back to Node.js analysis...');
      
      // Fallback to Node.js analysis if Python service is unavailable
      return this.fallbackAnalysis(resumeText);
    }
  }

  private async fallbackAnalysis(resumeText: string): Promise<any> {
    try {
      // Basic analysis using Node.js
      const skills = this.extractSkillsBasic(resumeText);
      const experience = this.extractExperienceBasic(resumeText);
      const quality = this.calculateQualityBasic(resumeText, skills);
      
      let recommendations = [];
      
      if (this.openai) {
        // Try to get AI recommendations using OpenAI directly
        try {
          const completion = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are an expert resume reviewer. Provide 5 specific, actionable recommendations to improve this resume."
              },
              {
                role: "user",
                content: `Analyze this resume and provide improvement suggestions:\n\n${resumeText.substring(0, 2000)}`
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          });
          
          const aiResponse = completion.choices[0].message.content || '';
          recommendations = aiResponse.split('\n').filter(line => line.trim()).slice(0, 5);
          
        } catch (aiError) {
          console.warn('OpenAI fallback failed:', aiError);
          recommendations = this.getStaticRecommendations(skills);
        }
      } else {
        recommendations = this.getStaticRecommendations(skills);
      }

      return {
        success: true,
        analysis: {
          skills: { programming: skills },
          experience: experience,
          experience_level: this.calculateExperienceLevel(resumeText),
          quality_score: quality.score,
          quality_grade: quality.grade,
          feedback: quality.feedback,
          recommendations: recommendations,
          contact_info: this.extractContactInfo(resumeText),
          summary: {
            total_skills: skills.length,
            years_experience: this.extractYearsExperience(resumeText),
            word_count: resumeText.split(' ').length
          }
        },
        source: 'Node.js Fallback',
        processed_at: new Date().toISOString()
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: `Analysis failed: ${error.message}`,
        source: 'Fallback Error'
      };
    }
  }

  private extractSkillsBasic(text: string): string[] {
    const skillKeywords = [
      'javascript', 'python', 'java', 'react', 'node.js', 'angular', 'vue.js',
      'typescript', 'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql',
      'aws', 'azure', 'docker', 'kubernetes', 'git', 'linux', 'windows',
      'machine learning', 'ai', 'tensorflow', 'pytorch', 'pandas', 'numpy',
      'spring boot', 'django', 'flask', 'express.js', 'next.js', 'redux'
    ];
    
    const textLower = text.toLowerCase();
    return skillKeywords.filter(skill => textLower.includes(skill));
  }

  private extractExperienceBasic(text: string): any[] {
    const jobTitleKeywords = [
      'engineer', 'developer', 'manager', 'analyst', 'consultant',
      'director', 'coordinator', 'specialist', 'architect', 'lead'
    ];
    
    const sentences = text.split('.').slice(0, 10);
    const experiences = [];
    
    for (const sentence of sentences) {
      for (const keyword of jobTitleKeywords) {
        if (sentence.toLowerCase().includes(keyword)) {
          experiences.push({
            title: sentence.trim().substring(0, 100),
            description: sentence.trim()
          });
          break;
        }
      }
    }
    
    return experiences.slice(0, 3);
  }

  private calculateQualityBasic(text: string, skills: string[]): any {
    let score = 0;
    const feedback = [];
    
    const wordCount = text.split(' ').length;
    if (wordCount >= 300 && wordCount <= 800) {
      score += 30;
      feedback.push('✅ Good resume length');
    } else if (wordCount < 300) {
      feedback.push('⚠️ Resume seems too short');
    } else {
      feedback.push('⚠️ Resume might be too long');
    }
    
    if (skills.length >= 5) {
      score += 25;
      feedback.push('✅ Good technical skills variety');
    } else {
      feedback.push('⚠️ Add more technical skills');
    }
    
    if (text.includes('@')) {
      score += 15;
      feedback.push('✅ Contact information found');
    }
    
    if (text.toLowerCase().includes('experience') || text.toLowerCase().includes('worked')) {
      score += 20;
      feedback.push('✅ Work experience mentioned');
    }
    
    return {
      score: Math.min(score, 100),
      grade: this.getGrade(score),
      feedback
    };
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    return 'C';
  }

  private extractContactInfo(text: string): any {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    
    return {
      emails: text.match(emailRegex) || [],
      phones: text.match(phoneRegex) || []
    };
  }

  private calculateExperienceLevel(text: string): string {
    const yearMatches = text.match(/(\d+)\+?\s*years?\s*of\s*experience/gi);
    if (yearMatches) {
      const years = Math.max(...yearMatches.map(match => parseInt(match.match(/\d+/)?.[0] || '0')));
      if (years >= 8) return 'Senior';
      if (years >= 3) return 'Mid-level';
      return 'Junior';
    }
    
    const seniorKeywords = ['senior', 'lead', 'principal', 'director'];
    if (seniorKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      return 'Senior';
    }
    
    return 'Mid-level';
  }

  private extractYearsExperience(text: string): number {
    const yearMatches = text.match(/(\d+)\+?\s*years?\s*of\s*experience/gi);
    if (yearMatches) {
      return Math.max(...yearMatches.map(match => parseInt(match.match(/\d+/)?.[0] || '0')));
    }
    return 0;
  }

  private getStaticRecommendations(skills: string[]): string[] {
    const recommendations = [
      'Add more specific technical skills relevant to your target role',
      'Include quantifiable achievements in your work experience',
      'Add a professional summary at the top of your resume',
      'Include relevant certifications or training programs',
      'Use action verbs to describe your accomplishments'
    ];
    
    if (skills.length < 5) {
      recommendations.unshift('Consider adding more programming languages and frameworks');
    }
    
    if (!skills.some(skill => ['aws', 'azure', 'gcp'].includes(skill))) {
      recommendations.push('Add cloud platform experience as it\'s highly valued');
    }
    
    return recommendations.slice(0, 5);
  }

  async matchJobsWithResume(resumeText: string, jobDescriptions: any[]): Promise<any> {
    try {
      // Call Python AI service for job matching
      const response = await axios.post(`${this.pythonAIUrl}/match/jobs`, {
        resume_text: resumeText,
        job_descriptions: jobDescriptions.map(job => job.description || job.content || '')
      }, {
        timeout: 30000
      });

      if (response.data.success) {
        // Enhance the matches with job details
        const enhancedMatches = response.data.matches.map((match: any, index: number) => ({
          ...match,
          job: jobDescriptions[match.job_index] || jobDescriptions[index],
          match_score: Math.round((match.similarity_score * 50) + (match.skill_match_percent * 0.5))
        }));

        return {
          success: true,
          matches: enhancedMatches,
          source: 'Python AI Service'
        };
      } else {
        throw new Error('Python matching service failed');
      }
      
    } catch (error: any) {
      console.warn('Python job matching failed, using fallback:', error.message);
      
      // Fallback matching logic
      const resumeSkills = this.extractSkillsBasic(resumeText);
      const matches = jobDescriptions.map((job, index) => {
        const jobSkills = this.extractSkillsBasic(job.description || job.content || '');
        const commonSkills = resumeSkills.filter(skill => jobSkills.includes(skill));
        const matchPercentage = Math.round((commonSkills.length / Math.max(jobSkills.length, 1)) * 100);
        
        return {
          job_index: index,
          job,
          match_score: matchPercentage,
          matching_skills: commonSkills,
          missing_skills: jobSkills.filter(skill => !resumeSkills.includes(skill))
        };
      });
      
      matches.sort((a, b) => b.match_score - a.match_score);
      
      return {
        success: true,
        matches,
        source: 'Node.js Fallback'
      };
    }
  }

  async extractSkills(text: string): Promise<any> {
    try {
      const response = await axios.post(`${this.pythonAIUrl}/skills/extract`, {
        text
      }, { timeout: 10000 });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error('Python skills extraction failed');
      }
      
    } catch (error: any) {
      console.warn('Python skills extraction failed, using fallback:', error.message);
      
      const skills = this.extractSkillsBasic(text);
      return {
        success: true,
        skills: { programming: skills },
        total_skills: skills.length,
        source: 'Node.js Fallback'
      };
    }
  }

  async checkPythonServiceHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.pythonAIUrl}/health`, {
        timeout: 5000
      });
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}