const express = require('express');

const reviewController = require('../controller/reviewController');
const authController = require('./../controller/authController');

const router = express.Router({ mergeParams: true }); // mergeParams to access parameters from parent routes

// This middleware for all routes
router.use(authController.protect);

router
  .route('/') //couse of meargeParams i can access to tourId
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
