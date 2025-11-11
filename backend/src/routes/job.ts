import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get all jobs - to be implemented'
  });
}));

// @desc    Search jobs
// @route   GET /api/jobs/search
// @access  Public
router.get('/search', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Search jobs - to be implemented'
  });
}));

// @desc    Get job recommendations
// @route   GET /api/jobs/recommendations
// @access  Private
router.get('/recommendations', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get job recommendations - to be implemented'
  });
}));

export default router;