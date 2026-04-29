/**
 * Generate Payme checkout URL
 * Payme encodes merchant_id, order_id, and amount in a base64 URL param.
 */
function getPaymeLink(orderId, amountInSum) {
  var merchantId = process.env.PAYME_MERCHANT_ID || '';
  var amountTiyins = amountInSum * 100;

  // Payme checkout URL format
  var params = 'm=' + merchantId +
    ';ac.order_id=' + orderId +
    ';a=' + amountTiyins +
    ';l=ru';

  var encoded = Buffer.from(params).toString('base64');

  var baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://checkout.paycom.uz'
    : 'https://test.paycom.uz';

  return baseUrl + '/' + encoded;
}

/**
 * Generate Click checkout URL
 */
function getClickLink(orderId, amountInSum) {
  var serviceId = process.env.CLICK_SERVICE_ID || '';
  var merchantId = process.env.CLICK_MERCHANT_ID || '';

  var baseUrl = 'https://my.click.uz/services/pay';
  var params = [
    'service_id=' + serviceId,
    'merchant_id=' + merchantId,
    'amount=' + amountInSum,
    'transaction_param=' + orderId,
    'return_url=' + encodeURIComponent((process.env.SITE_URL || 'https://meatzone.uz') + '/cart?status=paid'),
  ];

  return baseUrl + '?' + params.join('&');
}

module.exports = { getPaymeLink, getClickLink };
