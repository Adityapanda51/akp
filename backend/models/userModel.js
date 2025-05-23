const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    // Current location (used for location-based services)
    currentLocation: {
      type: {
        type: String,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      },
      address: String,
      city: String,
      state: String,
      country: String,
      formattedAddress: String,
    },
    // Saved locations for quick access
    savedLocations: [
      {
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['home', 'work', 'other'],
          default: 'other',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
        address: String,
        city: String,
        state: String,
        country: String,
        formattedAddress: String,
      }
    ],
    role: {
      type: String,
      enum: ['user', 'admin', 'vendor', 'delivery'],
      default: 'user',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Vendor specific fields
    storeName: String,
    storeAddress: String,
    storeLocation: {
      type: {
        type: String,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
      address: String,
      city: String,
      state: String,
      country: String,
      formattedAddress: String,
    },
    // Vendor service radius in kilometers
    serviceRadius: {
      type: Number,
      default: 10,
    },
    
    // Delivery partner specific fields
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'car', 'van'],
      default: 'bike',
    },
    vehicleNumber: String,
    deliveryStatus: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'offline',
    },
    
    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Create geospatial indexes for location-based queries
userSchema.index({ "currentLocation.coordinates": "2dsphere" });
userSchema.index({ "storeLocation.coordinates": "2dsphere" });

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User; 