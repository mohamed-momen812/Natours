const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review can not be empty']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above  1.0'],
      max: [5, 'Rating must be below  5.0']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a Tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a User']
    }
  },
  {
    // showing virtule property
    toJSON: { virtuals: true }, // When data in json format
    toObject: { virtuals: true } // when data in object format
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// populate user
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo' // from user
  });
  next();
});

// calculate average ratings of tour in review
// statics methods called directly on the model itself
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0, // defult value
      ratingsQuantity: 4.5 // defult value
    });
  }
};

// must use post not pre, to use calcAverageRatings after saving review
reviewSchema.post('save', function() {
  // this points to current review
  // we can't use static method of schema before creating it
  this.constructor.calcAverageRatings(this.tour); // this.constructor = Review , but before creating Review
});
// we can not use middelware for (find) becouse it is for Query not for document so we can not access to current doc but for current query
// we can not use post because we canot use query it excuted so we use pre
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne(); // Store the document to access it in the post middleware
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // Access the stored document using the `r` property of `this` which was set in the pre middleware
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
