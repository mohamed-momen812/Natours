const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // initialize stripe object

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // type of payment
    success_url: `${req.protocol}://${req.get('host')}/`, // if payment success
    cancel_url: `${req.protocol}://${req.get('host')}/`, // if payment fail
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      // array of items to be purchased
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary
          },
          unit_amount: tour.price * 100
        },
        quantity: 1
      }
    ],
    mode: 'payment'
  });

  // 3) create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});
