import Review from '../moduls/Review.js';
export const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const userId = req.user._id;

    // Prevent duplicate review
    const existingReview = await Review.findOne({ productId, userId, orderId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You already reviewed this product.' });
    }

    const review = new Review({ productId, orderId, userId, rating, comment });
    await review.save();

    res.status(201).json({ success: true, message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting review' });
  }
};
