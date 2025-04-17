const express = require('express');
const router = express.Router();
const {
  geocodeAddress,
  reverseGeocode,
} = require('../controllers/geocodeController');

router.route('/').get(geocodeAddress);
router.route('/reverse').get(reverseGeocode);

module.exports = router; 