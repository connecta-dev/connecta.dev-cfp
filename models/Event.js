const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const EventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters'],
      },
      slug: String,
      description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description can not be more than 500 characters'],
      },
      websie: {
        type: String,
        match: [
          /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
          'Please use a valid URL with HTTP or HTTPS',
        ],
      },
      phone: {
        type: String,
        maxlength: [20, 'Phone number can not be longer than 20 characters'],
      },
      emaail: {
        type: String,
        match: [
          /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          'Please add a valid email',
        ],
      },
      address: {
        type: String,
        required: [true, 'Please add an address'],
      },
      location: {
        // GeoJSON Point
        type: {
          type: String,
          enum: ['Point'],
          required: false,
        },
        coordinates: {
          type: [Number],
          required: false,
          index: '2dsphere',
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String,
      },
      topics: {
        // Array of strings
        type: [String],
        required: true,
        enum: [
          'Web Development',
          'Mobile Development',
          'UI/UX',
          'Data Science',
          'Business',
          'Devops',
          'Other',
        ],
      },
      averageRating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [10, 'Rating can not be more than 10'],
      },
      averageCost: Number,
      photo: {
        type: String,
        default: 'no-photo.jpg',
      },
      scholarship: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
      }                 
});


// Create event slug from the name
EventSchema.pre('save', function(next) {
    //console.log('Slugify ran', this.name);
    this.slug = slugify(this.name, { lower: true });
    next();
  });


// Geocode & create location field
EventSchema.pre('save', async function(next) {
    const loc = await geocoder.geocode(this.address);
    this.location = {
      type: 'Point',
      coordinates: [loc[0].longitude, loc[0].latitude],
      formattedAddress: loc[0].formattedAddress,
      street: loc[0].streetName,
      city: loc[0].city,
      state: loc[0].stateCode,
      zipcode: loc[0].zipcode,
      country: loc[0].countryCode
    };
  
    // Do not save address in DB
    this.address = undefined;
    next();
  }); 
  
  
  // Cascade delete courses when a bootcamp is deleted
  EventSchema.pre('remove', async function (next) {
    console.log(`Talks being removed from event ${this._id}`);
    await this.model('Talk').deleteMany( { event: this._id });
    next();
  });
  

  module.exports = mongoose.model('Event', EventSchema);