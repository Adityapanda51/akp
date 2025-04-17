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
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.error('Google Maps API key is not configured properly');
      res.status(500);
      throw new Error('Geocoding service is not configured properly');
    }
    
    console.log(`Geocoding address: "${address}", using API key: ${apiKey.substring(0, 10)}...`);
    
    // Try using direct Geocoding API first (more reliable for exact addresses)
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    console.log(`Google Maps API response status: ${response.data.status}`);
    
    // Check for API issues
    if (response.data.status === 'REQUEST_DENIED') {
      console.error(`API request denied: ${response.data.error_message}`);
      console.log('This usually means:');
      console.log('1. The API key is not correctly configured in Google Cloud Console');
      console.log('2. Billing is not enabled on the Google Cloud project');
      console.log('3. The API key has restrictive settings that need to be adjusted');
      console.log('4. The Geocoding API is not enabled for this key');
      
      res.status(500);
      throw new Error(`Geocoding service error: ${response.data.error_message || 'API request denied'}`);
    }
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      // Return multiple results (up to 5) to mimic Zomato/Zepto behavior
      const geocodeResults = response.data.results.slice(0, 5).map(result => {
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

        return {
          coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
          formattedAddress: result.formatted_address,
          city,
          state,
          country,
        };
      });
      
      console.log(`Geocoding successful: "${address}" → found ${geocodeResults.length} results`);
      res.json(geocodeResults);
    } else if (response.data.status === 'ZERO_RESULTS') {
      console.log(`No results found for address: "${address}"`);
      res.status(404);
      throw new Error('No locations found for this address');
    } else {
      console.error(`Geocoding error for "${address}": ${response.data.status}`, response.data.error_message);
      res.status(400);
      throw new Error(`Geocoding failed: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Geocoding service error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
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
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.error('Google Maps API key is not configured properly');
      res.status(500);
      throw new Error('Geocoding service is not configured properly');
    }
    
    console.log(`Reverse geocoding coordinates: [${lat}, ${lng}], using API key: ${apiKey.substring(0, 10)}...`);
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    console.log(`Google Maps API response status: ${response.data.status}`);
    console.log('Google API raw response excerpt:', JSON.stringify(response.data).substring(0, 500) + '...');
    
    // Check for API issues
    if (response.data.status === 'REQUEST_DENIED') {
      console.error(`API request denied: ${response.data.error_message}`);
      // Return a default response instead of failing completely
      return res.json({
        formattedAddress: "Location unavailable - API key issue",
        city: "",
        state: "",
        country: ""
      });
    }
    
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

      const geocodeResult = {
        formattedAddress: result.formatted_address,
        city,
        state,
        country,
      };
      
      console.log(`Reverse geocoding successful: [${lat}, ${lng}] → "${result.formatted_address}"`);
      res.json(geocodeResult);
    } else if (response.data.status === 'ZERO_RESULTS') {
      console.log(`No results found for coordinates: [${lat}, ${lng}]`);
      
      // Return a default response rather than throwing error
      res.json({
        formattedAddress: "Location unknown",
        city: "",
        state: "",
        country: ""
      });
    } else {
      console.error(`Reverse geocoding error for [${lat}, ${lng}]: ${response.data.status}`, response.data.error_message);
      
      // Return a default response with error info
      res.json({
        formattedAddress: `Location error: ${response.data.status}`,
        city: "",
        state: "",
        country: ""
      });
    }
  } catch (error) {
    console.error('Reverse geocoding service error:', error.message);
    
    // Return a default response for error cases rather than failing
    res.json({
      formattedAddress: "Location unknown - service error",
      city: "",
      state: "",
      country: ""
    });
  }
});

module.exports = { geocodeAddress, reverseGeocode }; 