require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

async function diagnoseGoogleApiKey() {
  console.log(`${colors.cyan}===============================================${colors.reset}`);
  console.log(`${colors.cyan}        GOOGLE API KEY DIAGNOSTIC TOOL        ${colors.reset}`);
  console.log(`${colors.cyan}===============================================${colors.reset}`);

  // Check if .env file exists
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.red}ERROR: .env file not found at ${envPath}${colors.reset}`);
    console.log(`${colors.yellow}Please create a .env file with your Google Maps API key:${colors.reset}`);
    console.log(`GOOGLE_MAPS_API_KEY=your_api_key_here`);
    return;
  }

  // Check API key in environment variables
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.log(`${colors.red}ERROR: GOOGLE_MAPS_API_KEY not found in environment variables${colors.reset}`);
    console.log(`${colors.yellow}Please add your Google Maps API key to the .env file:${colors.reset}`);
    console.log(`GOOGLE_MAPS_API_KEY=your_api_key_here`);
    return;
  }

  if (apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || apiKey.includes('your_') || apiKey.includes('YOUR_')) {
    console.log(`${colors.red}ERROR: You're using a placeholder API key${colors.reset}`);
    console.log(`${colors.yellow}Please replace the placeholder with your actual Google Maps API key in the .env file${colors.reset}`);
    return;
  }

  console.log(`${colors.green}✓ API key found in environment variables${colors.reset}`);
  console.log(`${colors.blue}Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}${colors.reset}`);
  console.log(`${colors.cyan}-----------------------------------------------${colors.reset}`);

  // Test basic API key validity
  console.log(`${colors.blue}STEP 1: Testing basic API key validity...${colors.reset}`);
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${apiKey}`
    );

    if (response.data.status === 'REQUEST_DENIED') {
      console.log(`${colors.red}✗ API request DENIED${colors.reset}`);
      console.log(`${colors.yellow}Error message: ${response.data.error_message || 'No error message provided'}${colors.reset}`);
      printRequestDeniedHelp();
    } else if (response.data.status === 'INVALID_REQUEST') {
      console.log(`${colors.yellow}⚠ Invalid request but API key accepted${colors.reset}`);
      console.log(`${colors.green}✓ Your API key appears to be valid${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ API key is valid${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error testing API key:${colors.reset}`, error.message);
    if (error.response && error.response.data) {
      console.log(`${colors.red}Response data:${colors.reset}`, error.response.data);
    }
    console.log(`${colors.yellow}This could indicate network issues or an invalid key format${colors.reset}`);
  }
  console.log(`${colors.cyan}-----------------------------------------------${colors.reset}`);

  // Check which APIs are enabled
  console.log(`${colors.blue}STEP 2: Testing specific Google APIs...${colors.reset}`);
  
  // Test Geocoding API
  await testApiService('Geocoding API', 
    `https://maps.googleapis.com/maps/api/geocode/json?address=Mumbai,%20India&key=${apiKey}`);
  
  // Test Places API
  await testApiService('Places API', 
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Mumbai&key=${apiKey}`);
  
  // Test Places Details API
  await testApiService('Places Details API',
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJwe1EZjDG5zsRaYxkjY_tpF0&key=${apiKey}`);
  
  // Check if the API key has billing enabled
  console.log(`${colors.cyan}-----------------------------------------------${colors.reset}`);
  console.log(`${colors.blue}STEP 3: Checking billing status...${colors.reset}`);
  console.log(`${colors.yellow}Note: The diagnostic tool cannot directly check if billing is enabled${colors.reset}`);
  console.log(`${colors.yellow}If the above APIs are returning REQUEST_DENIED errors, you may need to check:${colors.reset}`);
  console.log(`${colors.yellow}1. Billing is enabled on your Google Cloud project${colors.reset}`);
  console.log(`${colors.yellow}2. You have a valid payment method registered${colors.reset}`);
  console.log(`${colors.yellow}3. You're within your usage limits and quotas${colors.reset}`);

  // Print summary
  console.log(`${colors.cyan}===============================================${colors.reset}`);
  console.log(`${colors.cyan}                  SUMMARY                      ${colors.reset}`);
  console.log(`${colors.cyan}===============================================${colors.reset}`);
  console.log(`${colors.yellow}If you're experiencing "REQUEST_DENIED" errors, please check:${colors.reset}`);
  console.log(`${colors.white}1. API key restrictions (IP, HTTP referrers, application)${colors.reset}`);
  console.log(`${colors.white}2. API services are enabled in Google Cloud Console${colors.reset}`);
  console.log(`${colors.white}3. Billing is properly set up for your project${colors.reset}`);
  console.log(`${colors.white}4. No typos in the API key in your .env file${colors.reset}`);
  console.log(`${colors.white}5. You're not exceeding usage limits/quotas${colors.reset}`);
  console.log(`${colors.cyan}-----------------------------------------------${colors.reset}`);
  console.log(`${colors.blue}For detailed instructions on fixing these issues, visit:${colors.reset}`);
  console.log(`${colors.green}https://developers.google.com/maps/documentation/geocoding/start${colors.reset}`);
  console.log(`${colors.green}https://developers.google.com/maps/documentation/places/web-service/overview${colors.reset}`);
}

async function testApiService(serviceName, testUrl) {
  console.log(`${colors.blue}Testing ${serviceName}...${colors.reset}`);
  try {
    const response = await axios.get(testUrl);
    
    if (response.data.status === 'REQUEST_DENIED') {
      console.log(`${colors.red}✗ ${serviceName} request DENIED${colors.reset}`);
      console.log(`${colors.yellow}Error message: ${response.data.error_message || 'No error message provided'}${colors.reset}`);
      return false;
    } else if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
      console.log(`${colors.green}✓ ${serviceName} is working${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠ ${serviceName} returned status: ${response.data.status}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error testing ${serviceName}:${colors.reset}`, error.message);
    return false;
  }
}

function printRequestDeniedHelp() {
  console.log(`${colors.yellow}Common reasons for REQUEST_DENIED:${colors.reset}`);
  console.log(`${colors.white}1. The API hasn't been enabled in the Google Cloud Console${colors.reset}`);
  console.log(`${colors.white}   - Go to https://console.cloud.google.com/${colors.reset}`);
  console.log(`${colors.white}   - Navigate to "APIs & Services" > "Library"${colors.reset}`);
  console.log(`${colors.white}   - Search for and enable: Geocoding API, Places API, Maps JavaScript API${colors.reset}`);
  console.log(`${colors.white}2. The API key has restrictions${colors.reset}`);
  console.log(`${colors.white}   - Check IP restrictions, HTTP referrers, API restrictions${colors.reset}`);
  console.log(`${colors.white}3. Billing is not enabled${colors.reset}`);
  console.log(`${colors.white}   - You need a valid billing account for these APIs${colors.reset}`);
  console.log(`${colors.white}4. The project has exceeded its quota${colors.reset}`);
}

// Run the diagnostic
diagnoseGoogleApiKey().catch(err => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, err);
}); 