const AppError = require('./../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that id ', 404));
    }

    res.status(200).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // returning updated doc
      runValidators: true // accept moongose validator
    });

    if (!doc) {
      return next(new AppError('No document found with that id ', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body); // creat method for creat and save

    res.status(201).json({
      status: 'success',
      data: newDoc
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(
        new AppError(`No document found with ID ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // For allow nested Get reviews on a tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query; // document await query for disconnect creat query and excution

    // const metadata = {
    //   totalItems: doc.length,
    //   requestedAt: new Date().toISOString(),
    //   totalPages: Math.ceil(doc.length / (req.query.limit || 10)),
    //   currentPage: req.query.page || 1
    // };

    res.status(200).json({
      status: `success`,
      results: doc.length,
      // metadata: metadata,
      data: doc
    });
  });
