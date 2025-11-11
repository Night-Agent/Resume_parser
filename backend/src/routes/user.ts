import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get user profile - to be implemented'
  });
}));

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Update user profile - to be implemented'
  });
}));

export default router;