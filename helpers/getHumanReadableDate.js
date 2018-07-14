module.exports = function getHumanReadableDate(value) {
  if(!value) return '';

  let months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  let date = new Date(value);

  return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}
