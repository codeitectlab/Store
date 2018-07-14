module.exports = function getMapUrl(address) {
  return 'http://maps.google.com/maps?q=' + encodeURIComponent(address)
}