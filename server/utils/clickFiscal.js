const https = require('https');
const crypto = require('crypto');
const { logger } = require('../config/logger');

/**
 * Submit fiscal (OFD) receipt data to Click after a successful payment.
 *
 * Best-effort: any failure is logged but never thrown, so it can never block
 * payment completion. Uses Click Merchant API v2 (ofd_data/submit_items).
 *
 * Auth header: "<merchant_user_id>:<sha1(timestamp+secret_key)>:<timestamp>"
 * Money is sent in tiyin (1 so'm = 100 tiyin); quantity is sent x1000.
 */
function submitFiscalItems(order, items, paymentId) {
  return new Promise(function (resolve) {
    var serviceId = process.env.CLICK_SERVICE_ID;
    var merchantUserId = process.env.CLICK_MERCHANT_USER_ID;
    var secretKey = process.env.CLICK_SECRET_KEY;
    var spic = process.env.CLICK_SPIC;
    var packageCode = process.env.CLICK_PACKAGE_CODE;
    var vatPercent = Number(process.env.CLICK_VAT_PERCENT || 12);

    if (!serviceId || !merchantUserId || !secretKey || !spic || !packageCode || !paymentId) {
      logger.warn('Click fiscal skipped: missing config or payment_id');
      return resolve(false);
    }

    var timestamp = Math.floor(Date.now() / 1000);
    var digest = crypto.createHash('sha1').update(timestamp + secretKey).digest('hex');
    var auth = merchantUserId + ':' + digest + ':' + timestamp;

    var list = (items && items.length) ? items : [];
    var fiscalItems = list.map(function (it) {
      var qty = it.quantity || 1;
      var goodPriceTiyin = Math.round((it.price || 0) * 100);   // unit price, tiyin
      var priceTiyin = goodPriceTiyin * qty;                     // line total, tiyin
      // VAT is included in the price: vat = price * p / (100 + p)
      var vatTiyin = Math.round(priceTiyin * vatPercent / (100 + vatPercent));
      return {
        Name: String(it.name || 'Tovar'),
        SPIC: spic,
        PackageCode: packageCode,
        GoodPrice: goodPriceTiyin,
        Price: priceTiyin,
        Amount: qty * 1000,
        VAT: vatTiyin,
        VATPercent: vatPercent,
        CommissionInfo: { TIN: process.env.CLICK_TIN || '' },
      };
    });

    var totalTiyin = fiscalItems.reduce(function (s, i) { return s + i.Price; }, 0);

    var body = JSON.stringify({
      service_id: Number(serviceId),
      payment_id: Number(paymentId),
      items: fiscalItems,
      received_ecash: totalTiyin,
      received_cash: 0,
      received_card: 0,
    });

    var opts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Auth': auth,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    var req = https.request('https://api.click.uz/v2/merchant/payment/ofd_data/submit_items', opts, function (res) {
      var data = '';
      res.on('data', function (c) { data += c; });
      res.on('end', function () {
        var ok = res.statusCode >= 200 && res.statusCode < 300;
        logger[ok ? 'info' : 'error']('Click fiscal response', { status: res.statusCode, body: data, orderId: String(order._id) });
        resolve(ok);
      });
    });
    req.on('error', function (e) {
      logger.error('Click fiscal request error', { error: e.message, orderId: String(order._id) });
      resolve(false);
    });
    req.write(body);
    req.end();
  });
}

module.exports = { submitFiscalItems };
