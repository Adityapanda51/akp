require('dotenv').config();
const axios = require('axios');

// Test function for geocoding
async function testGeocoding() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
    console.error('Google Maps API key is not configured properly in the .env file');
    return;
  }
  
  console.log(`Using API key: ${apiKey.substring(0, 10)}...`);
  
  // First, test if the API key is valid at all
  try {
    console.log('\n--- Testing Basic API Key Validity ---');
    const validationResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${apiKey}`
    );
    
    console.log(`API Key Validation Status: ${validationResponse.data.status}`);
    
    if (validationResponse.data.error_message) {
      console.error('API Key Error:', validationResponse.data.error_message);
    }
    
    // Check which APIs are enabled
    console.log('\n--- Checking API Status ---');
    console.log('Note: If requests fail, make sure the following APIs are enabled in Google Cloud Console:');
    console.log('1. Geocoding API');
    console.log('2. Places API');
    console.log('3. Maps JavaScript API');
    console.log('4. Billing is enabled on the Google Cloud project');
  } catch (error) {
    console.error('Error testing API key validity:', error.message);
  }

  // Test forward geocoding with Places API
  try {
    console.log('\n--- Testing Places API Autocomplete ---');
    const placesResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=mumbai&key=${apiKey}`
    );

    console.log(`Places API Status: ${placesResponse.data.status}`);
    
    if (placesResponse.data.error_message) {
      console.error('Places API Error:', placesResponse.data.error_message);
    } else if (placesResponse.data.status === 'OK' && placesResponse.data.predictions.length > 0) {
      console.log(`Found ${placesResponse.data.predictions.length} places:`);
      placesResponse.data.predictions.forEach((place, index) => {
        console.log(`${index + 1}. ${place.description} (ID: ${place.place_id})`);
      });

      // Test place details API with the first prediction
      try {
        const firstPlace = placesResponse.data.predictions[0];
        console.log(`\n--- Testing Place Details API for "${firstPlace.description}" ---`);
        
        const detailsResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${firstPlace.place_id}&key=${apiKey}`
        );
        
        console.log(`Place Details API Status: ${detailsResponse.data.status}`);
        
        if (detailsResponse.data.error_message) {
          console.error('Place Details API Error:', detailsResponse.data.error_message);
        } else if (detailsResponse.data.status === 'OK' && detailsResponse.data.result) {
          const { lat, lng } = detailsResponse.data.result.geometry.location;
          console.log(`Location: ${lat}, ${lng}`);
          console.log(`Address: ${detailsResponse.data.result.formatted_address}`);
        } else {
          console.log('No place details found');
        }
      } catch (error) {
        console.error('Error testing Place Details API:', error.message);
      }
    } else {
      console.log('No places found with the API');
    }
  } catch (error) {
    console.error('Error testing Places API:', error.message);
    console.log('Raw error:', error);
  }

  // Test geocoding API
  try {
    console.log('\n--- Testing Geocoding API ---');
    const geocodeResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Mumbai,%20Maharashtra,%20India&key=${apiKey}`
    );

    console.log(`Geocoding API Status: ${geocodeResponse.data.status}`);
    
    if (geocodeResponse.data.error_message) {
      console.error('Geocoding API Error:', geocodeResponse.data.error_message);
    } else if (geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
      const result = geocodeResponse.data.results[0];
      const { lat, lng } = result.geometry.location;
      
      console.log(`Found location: ${lat}, ${lng}`);
      console.log(`Address: ${result.formatted_address}`);
      
      // Extract components
      const components = {};
      result.address_components.forEach(component => {
        component.types.forEach(type => {
          components[type] = component.long_name;
        });
      });
      
      console.log('Address components:', {
        city: components.locality || 'N/A',
        state: components.administrative_area_level_1 || 'N/A',
        country: components.country || 'N/A'
      });
    } else {
      console.log('No geocoding results found');
    }
  } catch (error) {
    console.error('Error testing Geocoding API:', error.message);
  }

  // Test reverse geocoding
  try {
    console.log('\n--- Testing Reverse Geocoding API ---');
    // Mumbai coordinates
    const lat = 19.0760;
    const lng = 72.8777;
    
    const reverseGeocodeResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    console.log(`Reverse Geocoding API Status: ${reverseGeocodeResponse.data.status}`);
    
    if (reverseGeocodeResponse.data.error_message) {
      console.error('Reverse Geocoding API Error:', reverseGeocodeResponse.data.error_message);
    } else if (reverseGeocodeResponse.data.status === 'OK' && reverseGeocodeResponse.data.results.length > 0) {
      const result = reverseGeocodeResponse.data.results[0];
      
      console.log(`Address: ${result.formatted_address}`);
      
      // Extract components
      const components = {};
      result.address_components.forEach(component => {
        component.types.forEach(type => {
          components[type] = component.long_name;
        });
      });
      
      console.log('Address components:', {
        city: components.locality || 'N/A',
        state: components.administrative_area_level_1 || 'N/A',
        country: components.country || 'N/A'
      });
    } else {
      console.log('No reverse geocoding results found');
    }
  } catch (error) {
    console.error('Error testing Reverse Geocoding API:', error.message);
  }
  
  console.log('\n--- Test complete ---');
}

// Run the test
testGeocoding(); 