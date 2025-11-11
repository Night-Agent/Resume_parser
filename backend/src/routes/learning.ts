import express, { Request, Response } from 'express';
import { LearningPathService, UserProfile } from '../services/learningPathService';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const learningPathService = new LearningPathService();

// Interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    skills?: string[];
  };
}

// @desc    Generate learning path for user
// @route   POST /api/learning/generate-path
// @access  Private
router.post('/generate-path', protect, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { targetRole, experience, learningGoals, timeCommitment } = req.body;

  if (!targetRole) {
    return res.status(400).json({
      success: false,
      message: 'Target role is required'
    });
  }

  const userProfile: UserProfile = {
    skills: req.user?.skills || [],
    experience: experience || 'beginner',
    targetRole,
    learningGoals: learningGoals || [],
    timeCommitment: timeCommitment || '10 hours/week'
  };

  try {
    const learningPath = await learningPathService.generateLearningPath(userProfile);
    
    return res.status(200).json({
      success: true,
      data: learningPath
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate learning path',
      error: error.message
    });
  }
}));

// @desc    Get skill gap analysis
// @route   POST /api/learning/skill-gap
// @access  Private
router.post('/skill-gap', protect, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { targetRole } = req.body;

  if (!targetRole) {
    return res.status(400).json({
      success: false,
      message: 'Target role is required'
    });
  }

  try {
    const userSkills = req.user?.skills || [];
    const analysis = await learningPathService.getSkillGapAnalysis(userSkills, targetRole);
    
    return res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze skill gap',
      error: error.message
    });
  }
}));

// @desc    Get popular skills in the market
// @route   GET /api/learning/popular-skills
// @access  Public
router.get('/popular-skills', asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  try {
    const popularSkills = await learningPathService.getPopularSkills();
    
    return res.status(200).json({
      success: true,
      data: popularSkills
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch popular skills',
      error: error.message
    });
  }
}));

// @desc    Get learning recommendations based on current skills
// @route   GET /api/learning/recommendations
// @access  Private
router.get('/recommendations', protect, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userSkills = req.user?.skills || [];
    
    // Get skill recommendations based on user's current skills
    const popularSkills = await learningPathService.getPopularSkills();
    
    // Filter out skills user already has and recommend top missing skills
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const recommendations = popularSkills
      .filter(skill => !userSkillsLower.includes(skill.skill.toLowerCase()))
      .slice(0, 10)
      .map(skill => ({
        skill: skill.skill,
        demand: skill.demand,
        avgSalary: skill.avgSalary,
        reason: `High demand skill with ${skill.demand}% market demand and average salary of $${skill.avgSalary.toLocaleString()}`
      }));
    
    return res.status(200).json({
      success: true,
      data: {
        currentSkills: userSkills,
        recommendedSkills: recommendations,
        totalRecommendations: recommendations.length
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get learning recommendations',
      error: error.message
    });
  }
}));

// @desc    Get predefined learning paths
// @route   GET /api/learning/paths
// @access  Public
router.get('/paths', asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  try {
    // Return available learning path templates
    const paths = [
      {
        id: 'fullstack_dev',
        title: 'Full Stack Developer Mastery',
        description: 'Comprehensive path to become a proficient full stack developer',
        targetRole: 'Full Stack Developer',
        estimatedDuration: '6-9 months',
        difficulty: 'intermediate',
        prerequisites: ['Basic programming knowledge', 'HTML/CSS basics'],
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript', 'Docker', 'AWS'],
        phases: 4
      },
      {
        id: 'ml_engineer',
        title: 'Machine Learning Engineer Path',
        description: 'Become a skilled ML engineer with Python and deep learning',
        targetRole: 'Machine Learning Engineer',
        estimatedDuration: '8-12 months',
        difficulty: 'advanced',
        prerequisites: ['Python programming', 'Basic statistics', 'Linear algebra'],
        skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'MLOps', 'Docker'],
        phases: 4
      },
      {
        id: 'frontend_dev',
        title: 'Frontend Developer Specialist',
        description: 'Master modern frontend development',
        targetRole: 'Frontend Developer',
        estimatedDuration: '4-6 months',
        difficulty: 'beginner',
        prerequisites: ['Basic HTML/CSS knowledge'],
        skills: ['JavaScript', 'React', 'CSS', 'TypeScript', 'Next.js', 'Tailwind CSS'],
        phases: 3
      },
      {
        id: 'devops_engineer',
        title: 'DevOps Engineer Track',
        description: 'Learn cloud infrastructure and automation',
        targetRole: 'DevOps Engineer',
        estimatedDuration: '6-8 months',
        difficulty: 'intermediate',
        prerequisites: ['Basic Linux knowledge', 'Networking basics'],
        skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Python'],
        phases: 4
      }
    ];
    
    return res.status(200).json({
      success: true,
      data: paths
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learning paths',
      error: error.message
    });
  }
}));

// @desc    Get detailed learning path by ID
// @route   GET /api/learning/paths/:id
// @access  Private
router.get('/paths/:id', protect, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
    // For demo purposes, generate a path based on the ID
    // In a real app, you'd fetch from database
    const userProfile: UserProfile = {
      skills: req.user?.skills || [],
      experience: 'intermediate',
      targetRole: id === 'fullstack_dev' ? 'Full Stack Developer' : 
                  id === 'ml_engineer' ? 'Machine Learning Engineer' :
                  id === 'frontend_dev' ? 'Frontend Developer' :
                  id === 'devops_engineer' ? 'DevOps Engineer' : 'Full Stack Developer',
      learningGoals: ['Get a new job', 'Learn new skills'],
      timeCommitment: '10 hours/week'
    };

    const learningPath = await learningPathService.generateLearningPath(userProfile);
    
    return res.status(200).json({
      success: true,
      data: learningPath
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learning path details',
      error: error.message
    });
  }
}));

export default router;