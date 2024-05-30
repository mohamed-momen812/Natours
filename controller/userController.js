const multer = require('multer');
const sharp = require('sharp');

const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handelerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image Please upload only images', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');
// When this middleware is used in a route, it will process the uploaded file and make it available in the req.file
// multer will call next() internally to pass control to the next middleware function

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // req.file.name must declare to bass to updateMe function
  req.file.name = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.name}`);

  next();
});

const filterOBJ = (obj, ...allowedFields) => {
  const newedObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newedObj[el] = obj[el];
  });
  return newedObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if user POSted password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route not for password update', 400));
  }

  // 2) Filtered out unwanted fields name that are not allowed to be updated
  const filteredBody = filterOBJ(req.body, 'name', 'email');

  // if there uploaded phto
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.creatUser = (req, res) => {
  res.status(500).json({
    status: 'failed',
    message: 'This route not impliminting / Please use /signup instead'
  });
};

exports.getUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// Don't update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
