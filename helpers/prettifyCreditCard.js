var creditCardType = require('credit-card-type');

module.exports = function prettifyCreditCard(cardNumber) {
  return creditCardType(cardNumber)[0];
}
