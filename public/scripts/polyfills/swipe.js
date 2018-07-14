function swipe(e) {
  var element = this.element || this;
  var xStart = null;
  var yStart = null;
  var xEnd = null;
  var yEnd = null;
  var xDiff = null;
  var yDiff = null;
  var leftStart = element.offsetLeft || 0;  // starting point in px
  var leftOrig = element.style.left;  // original left value (could be px, %, em, rem, furlong, mile, league?) so we can reset if needed
  var threshold = 50; // the minimum distance needed to call the function
  var distance = 15;  // the minimum distance to determine if x or y swipe
  var direction;

  function start(e) {
    xStart = e.touches[0].clientX;
    yStart = e.touches[0].clientY;
  }

  function move(e) {
    if (xStart === null || yStart === null) {
      return;
    }

    xEnd = e.touches[0].clientX;
    yEnd = e.touches[0].clientY;

    xDiff = xStart - xEnd;
    yDiff = yStart - yEnd;

    var leftDiff = leftStart - xDiff;

    if (!direction) {
      if (Math.abs(xDiff) > distance) {
        direction = 'x';
      } else if (Math.abs(yDiff) > distance) {
        direction = 'y';
      }
    }

    if (direction === 'x') {
      e.stopPropagation();
      e.preventDefault();
      element.style.left = leftDiff + 'px';
    }
  }

  function end(e) {
    element.classList.remove('swiping');

    if (direction === 'x') {
      // x movement greater than y movement so activate rotation
      e.preventDefault();
      var dir = xDiff > 0 ? '+1' : '-1';

      if (Math.abs(xDiff) >= threshold) {
        this.action(dir);
      } else {
        restore(e);
      }
    } else {
      // restore original left position since y movement greater than x movement
      restore(e);
    }

    this.removeEventListener('touchmove', move);
    this.removeEventListener('touchend', end);
  }

  function restore() {
    element.style.left = leftOrig;
  }

  start(e);

  element.classList.add('swiping');

  this.addEventListener('touchmove', move);
  this.addEventListener('touchend', end);
}

module.exports = swipe;