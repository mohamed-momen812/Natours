const express = require('express');

const bookingController = require('../controller/bookingCotroller');
const authController = require('../controller/authController');

const router = express.Router();

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

module.exports = router;
