// This is a vash helper that returns value and data-param-value

module.exports = function appendCheckboxValues(obj, property, test) {
  if(!obj || !obj[property]) return '';

  return 'data-param-value="' + obj[property] + '" ' + ( obj[property] === test ? 'checked' : '' );
}