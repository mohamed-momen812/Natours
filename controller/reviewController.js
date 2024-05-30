const Review = require('../models/reviewModel');
const factory = require('./handelerFactory');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId; // inject tour from params to body to create review
  if (!req.body.user) req.body.user = req.user.id; // inject user from req.body to body to create review
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
