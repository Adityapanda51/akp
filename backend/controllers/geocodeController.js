const asyncHandler = require('express-async-handler');
const axios = require('axios');

// @desc    Geocode address to coordinates
// @route   GET /api/geocode?address=xxx
// @access  Public
const geocodeAddress = asyncHandler(async (req, res) => {
  const { address } = req.query;

  if (!address) {
    res.status(400);
    throw new Error('Address is required');
  }

  try {
    // Use Google Maps Geocoding API or other geocoding service
    // Replace with your actual API key and implementation
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const { lat, lng } = result.geometry.location;
      
      // Extract address components
      let city = '';
      let state = '';
      let country = '';
      
      result.address_components.forEach((component) => {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (component.types.includes('country')) {
          country = component.long_name;
        }
      });

      res.json({
        coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
        formattedAddress: result.formatted_address,
        city,
        state,
        country,
      });
    } else {
      res.status(404);
      throw new Error('Address not found');
    }
  } catch (error) {
    res.status(500);
    throw new Error('Geocoding service error: ' + error.message);
  }
});

// @desc    Reverse geocode coordinates to address
// @route   GET /api/geocode/reverse?lat=xxx&lng=xxx
// @access  Public
const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  try {
    // Use Google Maps Geocoding API or other geocoding service
    // Replace with your actual API key and implementation
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      
      // Extract address components
      let city = '';
      let state = '';
      let country = '';
      
      result.address_components.forEach((component) => {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (component.types.includes('country')) {
          country = component.long_name;
        }
      });

      res.json({
        formattedAddress: result.formatted_address,
        city,
        state,
        country,
      });
    } else {
      res.status(404);
      throw new Error('Location not found');
    }
  } catch (error) {
    res.status(500);
    throw new Error('Reverse geocoding service error: ' + error.message);
  }
});

module.exports = { geocodeAddress, reverseGeocode }; 