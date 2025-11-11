import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @desc    Submit anonymous company review
// @route   POST /api/reviews
// @access  Private
router.post('/', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Submit company review - to be implemented'
  });
}));

// @desc    Get company reviews
// @route   GET /api/reviews/company/:companyId
// @access  Public
router.get('/company/:companyId', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get company reviews - to be implemented'
  });
}));

// @desc    Get review sentiment analysis
// @route   GET /api/reviews/company/:companyId/sentiment
// @access  Public
router.get('/company/:companyId/sentiment', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get review sentiment analysis - to be implemented'
  });
}));

export default router;