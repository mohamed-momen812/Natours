const path = require('path');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const globalErrorHandeler = require('./controller/errorController');
const AppError = require('./utils/appError');

const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');

const app = express();

// 1) Global Middilwares

// Set securty HTTP headers
app.use(helmet());

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000, // time of bloking
  message: 'To many requests from this IP, please try again in an hour'
});
app.use(limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
// If it detects any keys that start with ($) or contain a (.) it removes those keys from the request data.
app.use(mongoSanitize());

// Data sanitization against XSS
// It escapes the characters that have special meaning in HTML by converting them to their corresponding HTML entities.
app.use(xss());

// Prevent paramter pollution
// If a parameter is not in the whitelist, it retains only the last value of that parameter and discards the rest.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use(compression()); // compress responce
// serving static files
app.use(express.static(path.join(__dirname, 'public'))); //path.join takes multiple path segments as arguments and joins them into a single path. It ensures that the correct path separators (/ or \) are used, depending on the operating system.

// 2) Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// If url can't reach eny of above route
app.all('*', (req, res, next) => {
  // all for all http method (get, post, patch, ... )
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3) Error handeler route is the last part of route
app.use(globalErrorHandeler);

module.exports = app;
