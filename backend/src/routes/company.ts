import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get all companies - to be implemented'
  });
}));

// @desc    Get company details
// @route   GET /api/companies/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get company details - to be implemented'
  });
}));

// @desc    Search companies
// @route   GET /api/companies/search
// @access  Public
router.get('/search', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Search companies - to be implemented'
  });
}));

// @desc    Get company jobs
// @route   GET /api/companies/:id/jobs
// @access  Public
router.get('/:id/jobs', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get company jobs - to be implemented'
  });
}));

export default router;