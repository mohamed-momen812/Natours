const { promisify } = require('util');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('.././utils/email');

const jwt = require('jsonwebtoken');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: '50d'
  });
};

const creatSendToken = async (user, statusCode, res) => {
  const token = signToken(user._id); //send userId as data on crypted token

  res.cookie('jwt', token, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    ...(process.env.NODE_ENV === 'production' ? { secure: true } : {})
  });

  // Remove password from output not from DB
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Uncorrect email or password', 401));
  }
  creatSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) serch for token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('You are not logged in', 401)); // 401 for bad authorization
  }

  // 2) verification token
  // By using promisify(jwt.verify), you're converting jwt.verify into a Promise-based function that can be used with await.
  // decoded have data passing when ceate token whice (id)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('this user was deleted', 404));
  }

  // check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return new AppError(
      'User recently changed password! Please log in again',
      401
    );
  }

  // You can access to protected rourte
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  // ...roles for rest pramters
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permmision to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  try {
    // 2) Generate random reset token
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send token via email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request to: ${resetURL}`;

    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  // crypto token to compair it with one in DB
  const hasedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // we use findOne nt findOneAndApdate to call save to run validators
  const user = await User.findOne({ passwordResetToken: hasedToken });
  // 2) If there is user and token dose not expired set the new password
  if (!user || user.passwordResetExpires < Date.now()) {
    return next(new AppError('token is invaled or expired', 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) update changedPasswordAt property for the user

  // 4) Log the user in , send JWT
  creatSendToken(user, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  // remember req.user = currentUser from protect handler
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new AppError('This user was deleted', 404));
  }

  // 2) Check if POSTed password is correct
  if (!req.body.password) {
    return next(new AppError('Please provide a valide password ', 401));
  }

  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(new AppError('Unvaled password', 401));
  }

  // 3) If so, update password
  if (!req.body.newPassword) {
    return next(new AppError('Please provide new valide password', 401));
  }
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log user in , send JWT
  creatSendToken(user, 201, res);
});
