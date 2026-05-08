const express = require('express');
const router = express.Router();
const https = require('https');
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/auth');

// Haversine formula — straight-line fallback, returns km
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Google Maps Distance Matrix — returns road distance in km
// Falls back to Haversine if GOOGLE_MAPS_API_KEY is not set
async function getRoadDistance(originLat, originLng, destLat, destLng) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { distance: haversine(originLat, originLng, destLat, destLng), source: 'haversine' };
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=driving&units=metric&key=${apiKey}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const element = json.rows?.[0]?.elements?.[0];
          if (element?.status === 'OK') {
            const km = element.distance.value / 1000;
            resolve({ distance: km, source: 'google_maps', duration: element.duration.text });
          } else {
            resolve({ distance: haversine(originLat, originLng, destLat, destLng), source: 'haversine_fallback' });
          }
        } catch {
          resolve({ distance: haversine(originLat, originLng, destLat, destLng), source: 'haversine_fallback' });
        }
      });
    }).on('error', () => {
      resolve({ distance: haversine(originLat, originLng, destLat, destLng), source: 'haversine_fallback' });
    });
  });
}

async function getDeliverySettings() {
  const keys = [
    'delivery_enabled',
    'delivery_price_per_km',
    'delivery_free_threshold',
    'delivery_free_until',
    'delivery_min_fee',
    'store_lat',
    'store_lng',
  ];
  const docs = await Settings.find({ key: { $in: keys } });
  const s = {};
  docs.forEach((d) => { s[d.key] = d.value; });
  return {
    enabled: s.delivery_enabled !== undefined ? Boolean(s.delivery_enabled) : true,
    pricePerKm: Number(s.delivery_price_per_km) || 1500,
    freeThreshold: Number(s.delivery_free_threshold) || 100000,
    freeUntil: s.delivery_free_until ? new Date(s.delivery_free_until) : null,
    minFee: Number(s.delivery_min_fee) || 5000,
    storeLat: Number(s.store_lat) || 41.2995,
    storeLng: Number(s.store_lng) || 69.2401,
  };
}

/**
 * POST /api/delivery/estimate
 * Public — calculate delivery fee
 * Body: { lat, lng, orderTotal }
 */
router.post('/estimate', async (req, res) => {
  try {
    const { lat, lng, orderTotal = 0 } = req.body;
    const cfg = await getDeliverySettings();

    // Delivery disabled → always free
    if (!cfg.enabled) {
      return res.json({ fee: 0, isFree: true, reason: 'disabled', distance: null });
    }

    // Free promo period
    const now = new Date();
    if (cfg.freeUntil && now <= cfg.freeUntil) {
      return res.json({ fee: 0, isFree: true, reason: 'promo_period', freeUntil: cfg.freeUntil, distance: null });
    }

    // Free above threshold
    if (Number(orderTotal) >= cfg.freeThreshold) {
      return res.json({ fee: 0, isFree: true, reason: 'free_threshold', distance: null });
    }

    // No GPS — return min fee
    if (!lat || !lng) {
      return res.json({ fee: cfg.minFee, isFree: false, reason: 'no_gps', distance: null });
    }

    const { distance, source, duration } = await getRoadDistance(cfg.storeLat, cfg.storeLng, Number(lat), Number(lng));
    const fee = Math.max(cfg.minFee, Math.round(distance * cfg.pricePerKm / 500) * 500);

    res.json({
      fee,
      isFree: false,
      reason: 'distance',
      distance: Math.round(distance * 10) / 10,
      distanceSource: source,
      duration: duration || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/delivery/settings
 * Public — return current delivery config (no secrets)
 */
router.get('/settings', async (req, res) => {
  try {
    const cfg = await getDeliverySettings();
    res.json(cfg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT /api/delivery/settings
 * Admin — update delivery settings
 */
router.put('/settings', protect, admin, async (req, res) => {
  try {
    const {
      delivery_enabled,
      delivery_price_per_km,
      delivery_free_threshold,
      delivery_free_until,
      delivery_min_fee,
      store_lat,
      store_lng,
    } = req.body;

    const updates = {
      delivery_enabled,
      delivery_price_per_km,
      delivery_free_threshold,
      delivery_free_until,
      delivery_min_fee,
      store_lat,
      store_lng,
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== '') {
        await Settings.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
      }
    }

    const cfg = await getDeliverySettings();
    res.json(cfg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
module.exports.getDeliverySettings = getDeliverySettings;
module.exports.haversine = haversine;
module.exports.getRoadDistance = getRoadDistance;
