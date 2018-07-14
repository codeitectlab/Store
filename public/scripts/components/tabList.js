var Helper = require('./helper');

var TabList = function(container, parameters) {
  this.parameters = parameters;
  this.tabs = container.querySelectorAll('a[href]');
  this.active;
  
  var content;
  var hash;
  var i = this.tabs.length;
  var isFound = false;
  
  while (--i >= 0) {
    hash = this.tabs[i].hash;
    content = document.getElementById(hash.substring(1));
    
    if (!content) {
      continue;
    }
    
    //find matching hash or default to first one if no match
    if (hash === window.location.hash || (i === 0 && !isFound)) {
      this.active = content;
      this.tabs[i].classList.add('active');
      isFound = true;
    } else {
      content.classList.add('inactive');
    }
  }
  
  container.classList.add('activated');
  container.addEventListener('click', this.toggle.bind(this));
}

TabList.prototype.toggle = function(e) {
  e.preventDefault();

  var hash = e.target.hash;

  if (!hash) {
    return;
  }

  //prevent history from getting cluttered and prevent page jump to anchor (leave at current scroll)
  var y = window.pageYOffset || document.documentElement.scrollTop;

  if (!this.parameters.disableHash) {
    window.location.replace(hash);
    window.scrollTo(0, y);
  }

  for (var i = 0; i < this.tabs.length; i++) {
    var content = document.getElementById(this.tabs[i].hash.substring(1));
    
    if (this.tabs[i].hash === hash) {
      this.active = content;
      this.tabs[i].classList.add('active');
      content.classList.remove('inactive');
    } else {
      this.tabs[i].classList.remove('active');
      content.classList.add('inactive');
    }
  }
}

TabList.activate = function() {
  var tabList = document.querySelectorAll('.tab-list:not(.activated)');
  var i = tabList.length;
  var parameters;
  
  while (--i >= 0) {
    parameters = Helper.getData(tabList[i], 'parameters');
    parameters = parameters ? JSON.parse(parameters) : {};
    new TabList(tabList[i], parameters);
  }  
}

module.exports = TabList;