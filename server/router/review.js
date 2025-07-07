import express from 'express';
import { createReview } from '../controller/review.js';
import authenticateUser from '../middleware/user.js';

const reviewRouter = express.Router();

// POST /api/reviews
reviewRouter.post('/', authenticateUser, createReview);

export default reviewRouter;
