function returnPaddedString(str, length) {
  var padded = str + '';
  while(padded.length < length) {
    padded = '0' + padded;
  }

  return padded;
}

module.exports = function getVBDateTime(value) {
  //'2009-06-15T13:45:30'
  value = value ? new Date(value) : new Date();

  var val = value.getUTCFullYear() + '-'
    + returnPaddedString(value.getUTCMonth() + 1, 2) + '-'
    + returnPaddedString(value.getUTCDate(), 2) + 'T00:00:00';

  return val;
}
