const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // 2nd paramter for error message
      unique: true, // can't daplicated
      trim: true, // delete space in begining
      maxLength: [40, 'A tour must have less or equal than 40 characters'],
      minLength: [10, 'A tour must have more or equal than 10 characters']
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have maxGroupSize']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'difficult', 'medium'],
        message: 'Difficulty is either: easy, difficult, medium' // message for error
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above  1.0'],
      max: [5, 'Rating must be below  5.0'],
      set: val => Math.round(val * 10) / 10 // seter function for ratingsAverage before saving  4.256 to 4.3
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price; // this point to current doc on new creation, val points to priceDiscount
        },
        message: ` Discount price should be less than regular price`
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'a tour must have description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a imageCover']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // this always not selected in query
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    // showing virtule property
    toJSON: { virtuals: true }, // When data in json format
    toObject: { virtuals: true } // when data in object format
  }
);

// index for improve query performance
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// creating virtule property (not stored in the database)
tourSchema.virtual('durationWeeks').get(function() {
  // .get() for get value of virtule property
  return this.duration / 7;
});

// virtuale populate when use populate only
// virtuale populate => remember child refrence
tourSchema.virtual('reviews', {
  // creating virtule reviews property in tour , waiting for populate it
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// Document middleware: runs before .save() and .create()

// Query middleware

//  /^find/   all strings starts with find
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v'
  });
  next();
});

// Aggregation middelware
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // unshift push to begenning
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
