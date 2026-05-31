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

// Mapbox Directions API — returns road distance in km
// Falls back to Haversine if MAPBOX_ACCESS_TOKEN is not set
async function getRoadDistance(originLat, originLng, destLat, destLng) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  console.log('[delivery] MAPBOX token exists:', !!token, 'store:', originLat, originLng, 'dest:', destLat, destLng);
  if (!token) {
    console.log('[delivery] No MAPBOX token, using haversine');
    return { distance: haversine(originLat, originLng, destLat, destLng), source: 'haversine' };
  }

  // Mapbox expects coordinates as {lng},{lat};{lng},{lat}
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?access_token=${token}&geometries=geojson`;
  console.log('[delivery] Mapbox URL:', url);

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('[delivery] Mapbox response code:', res.statusCode, 'routes:', json.routes?.length, 'message:', json.message);
          if (json.routes && json.routes.length > 0) {
            const route = json.routes[0];
            const km = route.distance / 1000;
            const minutes = Math.round(route.duration / 60);
            const durationText = minutes < 60 ? `${minutes} мин` : `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
            console.log('[delivery] Mapbox success:', km, 'km,', durationText);
            resolve({ distance: km, source: 'mapbox', duration: durationText, geometry: route.geometry || null });
          } else {
            console.log('[delivery] Mapbox no routes, fallback to haversine');
            resolve({ distance: haversine(originLat, originLng, destLat, destLng), source: 'haversine_fallback' });
          }
        } catch (e) {
          console.log('[delivery] Mapbox parse error:', e.message);
          resolve({ distance: haversine(originLat, originLng, destLat, destLng), source: 'haversine_fallback' });
        }
      });
    }).on('error', (e) => {
      console.log('[delivery] Mapbox request error:', e.message);
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
    console.log('[delivery/estimate] req body:', req.body);
    const cfg = await getDeliverySettings();
    console.log('[delivery/estimate] settings:', cfg);

    // Always calculate distance if lat/lng provided
    let distanceResult = null;
    if (lat && lng) {
      distanceResult = await getRoadDistance(cfg.storeLat, cfg.storeLng, Number(lat), Number(lng));
      console.log('[delivery/estimate] distance:', distanceResult);
    }

    const roundDist = (d) => d !== null && d !== undefined ? Math.round(d * 10) / 10 : null;

    // Delivery disabled → always free
    if (!cfg.enabled) {
      return res.json({ fee: 0, isFree: true, reason: 'disabled', distance: roundDist(distanceResult?.distance), duration: distanceResult?.duration || null });
    }

    // Free promo period
    const now = new Date();
    if (cfg.freeUntil && now <= cfg.freeUntil) {
      return res.json({ fee: 0, isFree: true, reason: 'promo_period', freeUntil: cfg.freeUntil, distance: roundDist(distanceResult?.distance), duration: distanceResult?.duration || null });
    }

    // Free above threshold
    if (Number(orderTotal) >= cfg.freeThreshold) {
      return res.json({ fee: 0, isFree: true, reason: 'free_threshold', distance: roundDist(distanceResult?.distance), duration: distanceResult?.duration || null });
    }

    // No GPS — return min fee
    if (!lat || !lng) {
      return res.json({ fee: cfg.minFee, isFree: false, reason: 'no_gps', distance: null });
    }

    const distance = distanceResult?.distance || 0;
    const fee = Math.max(cfg.minFee, Math.round(distance * cfg.pricePerKm / 500) * 500);
    console.log('[delivery/estimate] result:', { fee, distance, source: distanceResult?.source, duration: distanceResult?.duration });

    res.json({
      fee,
      isFree: false,
      reason: 'distance',
      distance: Math.round(distance * 10) / 10,
      distanceSource: distanceResult?.source || 'haversine',
      duration: distanceResult?.duration || null,
      geometry: distanceResult?.geometry || null,
    });
  } catch (error) {
    console.error('[delivery/estimate] error:', error.message);
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
    res.json({ ...cfg, mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || null });
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

    // If admin explicitly enables delivery, auto-clear promo period so pricing takes effect
    if (delivery_enabled === true) {
      updates.delivery_free_until = null;
    }

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== '') {
        await Settings.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
      }
      // Allow null to clear a setting (e.g. freeUntil)
      if (value === null) {
        await Settings.findOneAndUpdate({ key }, { key, value: null }, { upsert: true, new: true });
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
