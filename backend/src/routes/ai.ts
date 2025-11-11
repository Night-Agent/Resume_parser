import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AIResumeAnalyzer } from '../services/aiResumeAnalyzer';

const router = express.Router();
const resumeAnalyzer = new AIResumeAnalyzer();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.') as any, false);
    }
  }
});

// @desc    Analyze resume with AI
// @route   POST /api/ai/analyze-resume
// @access  Private
router.post('/analyze-resume', protect, upload.single('resume'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('No resume file uploaded', 400);
  }

  try {
    console.log(`Analyzing resume: ${req.file.originalname}, Size: ${req.file.size} bytes`);
    
    const analysis = await resumeAnalyzer.analyzeResume(req.file.buffer, req.file.originalname);
    
    res.status(200).json({
      success: true,
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        analysis: analysis,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Resume analysis error:', error);
    throw createError(`Failed to analyze resume: ${error.message}`, 500);
  }
}));

// @desc    Get ATS optimization suggestions
// @route   POST /api/ai/ats-optimize
// @access  Private
router.post('/ats-optimize', protect, upload.single('resume'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('No resume file uploaded', 400);
  }

  try {
    const analysis = await resumeAnalyzer.analyzeResume(req.file.buffer, req.file.originalname);
    
    const atsOptimization = {
      currentScore: analysis.analysis.atsScore,
      targetScore: Math.min(analysis.analysis.atsScore + 20, 100),
      improvements: [
        ...analysis.analysis.suggestions,
        'Add more industry-specific keywords',
        'Use standard section headings (Experience, Education, Skills)',
        'Include quantifiable achievements with numbers',
        'Optimize for specific job descriptions'
      ],
      keywords: {
        missing: analysis.jobMatch.skillGaps,
        present: analysis.extractedContent.sections.skills.map(s => s.name),
        recommended: ['Results-driven', 'Cross-functional', 'Scalable', 'Optimization']
      }
    };

    res.status(200).json({
      success: true,
      data: atsOptimization
    });
  } catch (error: any) {
    console.error('ATS optimization error:', error);
    throw createError(`Failed to generate ATS optimization: ${error.message}`, 500);
  }
}));

// @desc    Generate resume improvement suggestions
// @route   POST /api/ai/improve-resume
// @access  Private
router.post('/improve-resume', protect, upload.single('resume'), asyncHandler(async (req, res) => {
  const { targetRole, experienceLevel } = req.body;
  
  if (!req.file) {
    throw createError('No resume file uploaded', 400);
  }

  try {
    const analysis = await resumeAnalyzer.analyzeResume(req.file.buffer, req.file.originalname);
    
    const improvements = {
      priority: 'high',
      suggestions: analysis.analysis.suggestions,
      strengthsToHighlight: analysis.analysis.strengths,
      weaknessesToAddress: analysis.analysis.weaknesses,
      skillGaps: analysis.jobMatch.skillGaps,
      formatImprovements: [
        'Use consistent formatting throughout',
        'Ensure proper section headings',
        'Optimize white space and readability',
        'Use professional font and sizing'
      ],
      contentImprovements: [
        'Add quantifiable achievements',
        'Use action verbs to start bullet points',
        'Tailor content to target role',
        'Include relevant keywords naturally'
      ]
    };

    res.status(200).json({
      success: true,
      data: improvements
    });
  } catch (error: any) {
    console.error('Resume improvement error:', error);
    throw createError(`Failed to generate improvement suggestions: ${error.message}`, 500);
  }
}));

// @desc    Get skill analysis and recommendations
// @route   POST /api/ai/skill-analysis
// @access  Private
router.post('/skill-analysis', protect, upload.single('resume'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('No resume file uploaded', 400);
  }

  try {
    const analysis = await resumeAnalyzer.analyzeResume(req.file.buffer, req.file.originalname);
    
    const skillAnalysis = {
      currentSkills: analysis.extractedContent.sections.skills,
      skillsByCategory: analysis.analysis.skillsAnalysis.skillsByCategory,
      inDemandSkills: analysis.analysis.skillsAnalysis.inDemandSkills,
      missingSkills: analysis.analysis.skillsAnalysis.missingSkills,
      recommendations: {
        toLearn: analysis.jobMatch.skillGaps.slice(0, 5),
        toImprove: analysis.extractedContent.sections.skills
          .filter(s => s.level === 'beginner' || s.level === 'intermediate')
          .map(s => s.name)
          .slice(0, 3),
        trending: ['TypeScript', 'GraphQL', 'Kubernetes', 'Terraform', 'Next.js']
      },
      careerPath: {
        currentLevel: analysis.jobMatch.careerLevel,
        suitableRoles: analysis.jobMatch.suitableRoles,
        salaryRange: analysis.jobMatch.estimatedSalaryRange
      }
    };

    res.status(200).json({
      success: true,
      data: skillAnalysis
    });
  } catch (error: any) {
    console.error('Skill analysis error:', error);
    throw createError(`Failed to analyze skills: ${error.message}`, 500);
  }
}));

// @desc    Get job matching recommendations
// @route   POST /api/ai/job-match
// @access  Private
router.post('/job-match', protect, upload.single('resume'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('No resume file uploaded', 400);
  }

  try {
    const analysis = await resumeAnalyzer.analyzeResume(req.file.buffer, req.file.originalname);
    
    const jobMatching = {
      matchedRoles: analysis.jobMatch.suitableRoles.map(role => ({
        title: role,
        matchPercentage: Math.floor(Math.random() * 30) + 70, // 70-100%
        salaryRange: analysis.jobMatch.estimatedSalaryRange,
        requiredSkills: analysis.jobMatch.skillGaps,
        reasonsForMatch: [
          `Strong background in ${analysis.extractedContent.sections.skills[0]?.name || 'technology'}`,
          `${analysis.analysis.experienceAnalysis.totalYears} years of relevant experience`,
          'Skills align well with role requirements'
        ]
      })),
      skillGaps: analysis.jobMatch.skillGaps.map(skill => ({
        skill,
        importance: 'high',
        timeToLearn: '2-3 months',
        resources: [
          `${skill} Complete Course - Udemy`,
          `${skill} Documentation - Official Docs`,
          `${skill} Projects - GitHub`
        ]
      })),
      careerProgression: {
        current: analysis.jobMatch.careerLevel,
        nextLevel: analysis.jobMatch.careerLevel === 'junior' ? 'mid' : 
                  analysis.jobMatch.careerLevel === 'mid' ? 'senior' : 'lead',
        timeframe: '1-2 years',
        requirements: analysis.jobMatch.skillGaps.slice(0, 3)
      }
    };

    res.status(200).json({
      success: true,
      data: jobMatching
    });
  } catch (error: any) {
    console.error('Job matching error:', error);
    throw createError(`Failed to generate job matches: ${error.message}`, 500);
  }
}));

export default router;
