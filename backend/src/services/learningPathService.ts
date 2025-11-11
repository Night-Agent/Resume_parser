import { OpenAI } from 'openai';

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'tutorial' | 'book' | 'project' | 'certification';
  provider: string;
  url: string;
  duration: string; // e.g., "4 weeks", "2 hours"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  rating?: number;
  isFree: boolean;
  price?: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  phases: LearningPhase[];
  totalResources: number;
  completionRate?: number;
}

export interface LearningPhase {
  id: string;
  title: string;
  description: string;
  duration: string;
  skills: string[];
  resources: LearningResource[];
  order: number;
}

export interface UserProfile {
  skills: string[];
  experience: string;
  targetRole: string;
  learningGoals: string[];
  timeCommitment: string; // e.g., "10 hours/week"
}

export class LearningPathService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn('OpenAI API key not found. AI-powered learning paths will use fallback logic.');
    }
  }

  async generateLearningPath(userProfile: UserProfile): Promise<LearningPath> {
    try {
      if (this.openai) {
        return await this.generateAILearningPath(userProfile);
      } else {
        return this.generateFallbackLearningPath(userProfile);
      }
    } catch (error) {
      console.error('Error generating learning path:', error);
      return this.generateFallbackLearningPath(userProfile);
    }
  }

  private async generateAILearningPath(userProfile: UserProfile): Promise<LearningPath> {
    const prompt = `
    Generate a comprehensive learning path for a person with the following profile:
    - Current skills: ${userProfile.skills.join(', ')}
    - Experience level: ${userProfile.experience}
    - Target role: ${userProfile.targetRole}
    - Learning goals: ${userProfile.learningGoals.join(', ')}
    - Time commitment: ${userProfile.timeCommitment}

    Create a structured learning path with phases, specific skills to learn, and recommended resources.
    Focus on practical, industry-relevant skills and include a mix of free and paid resources.
    `;

    const completion = await this.openai!.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert career counselor and learning path designer. Create detailed, practical learning paths for tech professionals."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    // Parse AI response and structure it
    return this.parseAIResponse(completion.choices[0].message.content || '', userProfile);
  }

  private parseAIResponse(aiResponse: string, userProfile: UserProfile): LearningPath {
    // This is a simplified parser - in production, you'd want more robust parsing
    // For now, return a structured fallback path enhanced with AI insights
    return this.generateFallbackLearningPath(userProfile);
  }

  private generateFallbackLearningPath(userProfile: UserProfile): LearningPath {
    const pathTemplates = this.getLearningPathTemplates();
    const template = pathTemplates.find(t => 
      t.targetRole.toLowerCase().includes(userProfile.targetRole.toLowerCase()) ||
      userProfile.targetRole.toLowerCase().includes(t.targetRole.toLowerCase())
    ) || pathTemplates[0]; // Default to first template

    // Customize the template based on user's current skills
    const customizedPhases = this.customizePhases(template.phases, userProfile.skills);

    return {
      ...template,
      id: `path_${Date.now()}`,
      phases: customizedPhases,
      totalResources: customizedPhases.reduce((total, phase) => total + phase.resources.length, 0)
    };
  }

  private customizePhases(phases: LearningPhase[], userSkills: string[]): LearningPhase[] {
    return phases.map(phase => {
      // Filter out skills the user already has
      const missingSkills = phase.skills.filter(skill => 
        !userSkills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );

      // Filter resources based on missing skills
      const relevantResources = phase.resources.filter(resource =>
        resource.skills.some(resourceSkill =>
          missingSkills.some(missingSkill =>
            missingSkill.toLowerCase().includes(resourceSkill.toLowerCase()) ||
            resourceSkill.toLowerCase().includes(missingSkill.toLowerCase())
          )
        )
      );

      return {
        ...phase,
        skills: missingSkills,
        resources: relevantResources.length > 0 ? relevantResources : phase.resources
      };
    }).filter(phase => phase.skills.length > 0); // Remove phases with no new skills to learn
  }

  private getLearningPathTemplates(): LearningPath[] {
    return [
      {
        id: 'fullstack_dev',
        title: 'Full Stack Developer Mastery',
        description: 'Comprehensive path to become a proficient full stack developer',
        targetRole: 'Full Stack Developer',
        estimatedDuration: '6-9 months',
        difficulty: 'intermediate',
        prerequisites: ['Basic programming knowledge', 'HTML/CSS basics'],
        totalResources: 0,
        phases: [
          {
            id: 'frontend_fundamentals',
            title: 'Frontend Fundamentals',
            description: 'Master the core frontend technologies',
            duration: '2-3 months',
            order: 1,
            skills: ['JavaScript', 'React', 'CSS', 'HTML', 'Responsive Design'],
            resources: [
              {
                id: 'js_course',
                title: 'Modern JavaScript Complete Course',
                description: 'Comprehensive JavaScript course covering ES6+ features',
                type: 'course',
                provider: 'freeCodeCamp',
                url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
                duration: '300 hours',
                difficulty: 'beginner',
                skills: ['JavaScript', 'ES6+', 'DOM Manipulation'],
                rating: 4.8,
                isFree: true
              },
              {
                id: 'react_course',
                title: 'React - The Complete Guide',
                description: 'Learn React from basics to advanced topics',
                type: 'course',
                provider: 'Udemy',
                url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
                duration: '40 hours',
                difficulty: 'intermediate',
                skills: ['React', 'JSX', 'State Management', 'Hooks'],
                rating: 4.6,
                isFree: false,
                price: 89.99
              },
              {
                id: 'css_grid_flexbox',
                title: 'CSS Grid and Flexbox Mastery',
                description: 'Master modern CSS layout techniques',
                type: 'course',
                provider: 'CSS-Tricks',
                url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
                duration: '10 hours',
                difficulty: 'intermediate',
                skills: ['CSS', 'Flexbox', 'CSS Grid', 'Responsive Design'],
                rating: 4.7,
                isFree: true
              }
            ]
          },
          {
            id: 'backend_development',
            title: 'Backend Development',
            description: 'Build robust server-side applications',
            duration: '2-3 months',
            order: 2,
            skills: ['Node.js', 'Express.js', 'MongoDB', 'API Development', 'Authentication'],
            resources: [
              {
                id: 'nodejs_course',
                title: 'Node.js Complete Course',
                description: 'Learn server-side JavaScript with Node.js',
                type: 'course',
                provider: 'The Odin Project',
                url: 'https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs',
                duration: '100 hours',
                difficulty: 'intermediate',
                skills: ['Node.js', 'Express.js', 'NPM', 'File System'],
                rating: 4.5,
                isFree: true
              },
              {
                id: 'mongodb_course',
                title: 'MongoDB Complete Guide',
                description: 'Master MongoDB database operations',
                type: 'course',
                provider: 'MongoDB University',
                url: 'https://university.mongodb.com/',
                duration: '30 hours',
                difficulty: 'beginner',
                skills: ['MongoDB', 'Database Design', 'Aggregation', 'Indexing'],
                rating: 4.6,
                isFree: true
              },
              {
                id: 'api_design',
                title: 'RESTful API Design Best Practices',
                description: 'Learn to design and build robust APIs',
                type: 'tutorial',
                provider: 'REST API Tutorial',
                url: 'https://restfulapi.net/',
                duration: '15 hours',
                difficulty: 'intermediate',
                skills: ['REST API', 'HTTP Methods', 'Status Codes', 'API Security'],
                rating: 4.4,
                isFree: true
              }
            ]
          },
          {
            id: 'deployment_devops',
            title: 'Deployment & DevOps',
            description: 'Deploy and maintain applications in production',
            duration: '1-2 months',
            order: 3,
            skills: ['Docker', 'AWS', 'CI/CD', 'Git', 'Linux'],
            resources: [
              {
                id: 'docker_course',
                title: 'Docker Mastery Course',
                description: 'Containerize your applications with Docker',
                type: 'course',
                provider: 'Docker',
                url: 'https://www.docker.com/play-with-docker',
                duration: '20 hours',
                difficulty: 'intermediate',
                skills: ['Docker', 'Containerization', 'Docker Compose', 'Kubernetes Basics'],
                rating: 4.5,
                isFree: true
              },
              {
                id: 'aws_fundamentals',
                title: 'AWS Cloud Practitioner',
                description: 'Learn AWS cloud services fundamentals',
                type: 'certification',
                provider: 'AWS',
                url: 'https://aws.amazon.com/training/learn-about/cloud-practitioner/',
                duration: '40 hours',
                difficulty: 'beginner',
                skills: ['AWS', 'Cloud Computing', 'EC2', 'S3', 'Lambda'],
                rating: 4.7,
                isFree: false,
                price: 100
              }
            ]
          },
          {
            id: 'advanced_topics',
            title: 'Advanced Topics',
            description: 'Advanced concepts and best practices',
            duration: '1-2 months',
            order: 4,
            skills: ['TypeScript', 'Testing', 'Performance Optimization', 'Security'],
            resources: [
              {
                id: 'typescript_course',
                title: 'TypeScript Complete Guide',
                description: 'Add type safety to your JavaScript projects',
                type: 'course',
                provider: 'TypeScript Handbook',
                url: 'https://www.typescriptlang.org/docs/',
                duration: '25 hours',
                difficulty: 'intermediate',
                skills: ['TypeScript', 'Type Safety', 'Interfaces', 'Generics'],
                rating: 4.6,
                isFree: true
              },
              {
                id: 'testing_course',
                title: 'JavaScript Testing Complete Guide',
                description: 'Learn unit testing, integration testing, and E2E testing',
                type: 'course',
                provider: 'Testing Library',
                url: 'https://testing-library.com/docs/',
                duration: '30 hours',
                difficulty: 'intermediate',
                skills: ['Jest', 'React Testing Library', 'E2E Testing', 'TDD'],
                rating: 4.5,
                isFree: true
              }
            ]
          }
        ]
      },
      {
        id: 'ml_engineer',
        title: 'Machine Learning Engineer Path',
        description: 'Become a skilled ML engineer with Python and deep learning',
        targetRole: 'Machine Learning Engineer',
        estimatedDuration: '8-12 months',
        difficulty: 'advanced',
        prerequisites: ['Python programming', 'Basic statistics', 'Linear algebra'],
        totalResources: 0,
        phases: [
          {
            id: 'python_data_science',
            title: 'Python for Data Science',
            description: 'Master Python libraries for data manipulation and analysis',
            duration: '2-3 months',
            order: 1,
            skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Jupyter'],
            resources: [
              {
                id: 'python_data_science',
                title: 'Python for Data Science Handbook',
                description: 'Essential tools for working with data in Python',
                type: 'book',
                provider: "O'Reilly",
                url: 'https://jakevdp.github.io/PythonDataScienceHandbook/',
                duration: '60 hours',
                difficulty: 'intermediate',
                skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn'],
                rating: 4.7,
                isFree: true
              }
            ]
          },
          {
            id: 'machine_learning_fundamentals',
            title: 'Machine Learning Fundamentals',
            description: 'Learn core ML algorithms and concepts',
            duration: '3-4 months',
            order: 2,
            skills: ['Scikit-learn', 'Supervised Learning', 'Unsupervised Learning', 'Model Evaluation'],
            resources: [
              {
                id: 'ml_course_andrew_ng',
                title: 'Machine Learning Course by Andrew Ng',
                description: 'Comprehensive introduction to machine learning',
                type: 'course',
                provider: 'Coursera',
                url: 'https://www.coursera.org/learn/machine-learning',
                duration: '55 hours',
                difficulty: 'intermediate',
                skills: ['ML Algorithms', 'Linear Regression', 'Neural Networks', 'SVM'],
                rating: 4.9,
                isFree: false,
                price: 79
              }
            ]
          },
          {
            id: 'deep_learning',
            title: 'Deep Learning',
            description: 'Master neural networks and deep learning frameworks',
            duration: '2-3 months',
            order: 3,
            skills: ['TensorFlow', 'PyTorch', 'Neural Networks', 'CNN', 'RNN'],
            resources: [
              {
                id: 'deep_learning_specialization',
                title: 'Deep Learning Specialization',
                description: 'Comprehensive deep learning course series',
                type: 'course',
                provider: 'Coursera',
                url: 'https://www.coursera.org/specializations/deep-learning',
                duration: '120 hours',
                difficulty: 'advanced',
                skills: ['Deep Learning', 'TensorFlow', 'CNN', 'RNN', 'LSTM'],
                rating: 4.8,
                isFree: false,
                price: 49
              }
            ]
          },
          {
            id: 'mlops',
            title: 'MLOps & Production',
            description: 'Deploy and maintain ML models in production',
            duration: '1-2 months',
            order: 4,
            skills: ['MLOps', 'Model Deployment', 'Docker', 'Kubernetes', 'Model Monitoring'],
            resources: [
              {
                id: 'mlops_course',
                title: 'MLOps: Machine Learning Operations',
                description: 'Learn to deploy and maintain ML models',
                type: 'course',
                provider: 'Udacity',
                url: 'https://www.udacity.com/course/machine-learning-devops-engineer-nanodegree--nd0821',
                duration: '80 hours',
                difficulty: 'advanced',
                skills: ['MLOps', 'CI/CD for ML', 'Model Monitoring', 'A/B Testing'],
                rating: 4.6,
                isFree: false,
                price: 1399
              }
            ]
          }
        ]
      }
    ];
  }

  async getPopularSkills(): Promise<Array<{ skill: string; demand: number; avgSalary: number }>> {
    // This would typically come from job market data analysis
    return [
      { skill: 'JavaScript', demand: 95, avgSalary: 75000 },
      { skill: 'Python', demand: 92, avgSalary: 85000 },
      { skill: 'React', demand: 88, avgSalary: 80000 },
      { skill: 'Node.js', demand: 82, avgSalary: 78000 },
      { skill: 'TypeScript', demand: 78, avgSalary: 85000 },
      { skill: 'AWS', demand: 85, avgSalary: 95000 },
      { skill: 'Docker', demand: 75, avgSalary: 90000 },
      { skill: 'Kubernetes', demand: 70, avgSalary: 105000 },
      { skill: 'Machine Learning', demand: 88, avgSalary: 110000 },
      { skill: 'TensorFlow', demand: 65, avgSalary: 115000 },
      { skill: 'PyTorch', demand: 62, avgSalary: 120000 }
    ];
  }

  async getSkillGapAnalysis(userSkills: string[], targetRole: string): Promise<{
    missingSkills: string[];
    strengthSkills: string[];
    recommendations: string[];
  }> {
    const roleSkillMap: Record<string, string[]> = {
      'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'MongoDB', 'CSS', 'HTML', 'Git'],
      'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'SQL'],
      'DevOps Engineer': ['AWS', 'Docker', 'Kubernetes', 'Linux', 'CI/CD', 'Terraform', 'Python'],
      'Frontend Developer': ['JavaScript', 'React', 'CSS', 'HTML', 'TypeScript', 'Vue.js', 'Angular'],
      'Backend Developer': ['Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'PostgreSQL', 'API Design'],
      'Data Scientist': ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Matplotlib', 'Scikit-learn', 'Statistics']
    };

    const requiredSkills = roleSkillMap[targetRole] || [];
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const requiredSkillsLower = requiredSkills.map(s => s.toLowerCase());

    const missingSkills = requiredSkills.filter(skill => 
      !userSkillsLower.some(userSkill => 
        userSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(userSkill)
      )
    );

    const strengthSkills = requiredSkills.filter(skill => 
      userSkillsLower.some(userSkill => 
        userSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(userSkill)
      )
    );

    const recommendations = [
      `Focus on learning ${missingSkills.slice(0, 3).join(', ')} to improve your profile for ${targetRole}`,
      `Your strength in ${strengthSkills.slice(0, 2).join(' and ')} is excellent for this role`,
      `Consider building projects that combine ${strengthSkills[0]} with ${missingSkills[0]} to demonstrate practical skills`
    ];

    return {
      missingSkills,
      strengthSkills,
      recommendations
    };
  }
}