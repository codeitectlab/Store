module.exports = function getYyyyMmDd(value) {
  if(!value) return null;

  let valueArray = value.split('/');

  if(valueArray.length != 3) return null;

  return `${valueArray[2]}-${valueArray[0]}-${valueArray[1]}`;
}
