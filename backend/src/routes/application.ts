import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @desc    Submit job application
// @route   POST /api/applications
// @access  Private
router.post('/', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Submit job application - to be implemented'
  });
}));

// @desc    Get user applications
// @route   GET /api/applications
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get user applications - to be implemented'
  });
}));

// @desc    Bulk apply to jobs
// @route   POST /api/applications/bulk
// @access  Private
router.post('/bulk', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bulk apply to jobs - to be implemented'
  });
}));

export default router;