const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
const handelDuplicateFieldsDB = () => {
  const message = `Duplicated Field `;
  return new AppError(message, 400);
};
const handelValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid Input Data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handelJWTError = () =>
  new AppError('Invaled token, Please log in again!', 401);

const handelJWTExpiredError = () =>
  new AppError('Your token has expired , Please log in again!', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational error: send message to clint
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    // Programming or ather unkown error: dont send message to clint
  } else {
    // 1) Log error
    console.error('Error:', err.name);

    // 2) Send error
    res.status(500).json({
      stats: 'error',
      message: 'Something went very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // If there an error created by mongoose i will pass it to AppError Class to to handel it as operational
    // مينفعش نعمل ...spred operator

    if (err.name === 'CastError') {
      err = handleCastErrorDB(err);
    }
    if (err.code === 11000) {
      err = handelDuplicateFieldsDB();
    }
    if (err.name === 'ValidationError') {
      err = handelValidationErrorDB(err);
    }
    if (err.name === 'JsonWebTokenError') {
      err = handelJWTError();
    }
    if (err.name === 'TokenExpiredError') {
      err = handelJWTExpiredError();
    }
    sendErrorProd(err, res);
  }
};
