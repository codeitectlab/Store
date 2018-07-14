var Pikaday = require('pikaday');
var Siema = require('siema');
var validator = require('validator');
require('./polyfills/xmlHttpRequest');
var Helper = require('./components/helper');
var Modal = require('./components/modal');
var creditCardType = require('credit-card-type');


function activeState() {
  if(!d3) return;
  var state = this.parentNode.getAttribute("state");
  var path = d3.select(".location-selector .map svg g path[state='" + state + "']");
  if(path) path.each(clicked);
}

var stateLabels = document.querySelectorAll(".location-selector .locations .state .state-label");
for(var i=0; i<stateLabels.length; i++) {
  stateLabels[i].addEventListener("click", activeState);
}

function interceptClickEvent(e) {
  if(e.target && (e.target.closest('main') || e.target.closest('#modal'))) return;

  var target = e.target.closest('[href]');
  if (!target && e.type == 'click') {
    return;
  }

  if(!confirm("You are leaving this page. Press 'Cancel' to stay on this page, 'OK' to leave.")) {
    e.preventDefault();
  }
}

var makePaymentLinks = document.querySelectorAll('.make-payment');
if(makePaymentLinks.length > 0) {
  for(var i=0; i< makePaymentLinks.length; i++) {
    makePaymentLinks[i].addEventListener('click', function(){
      var paymentModal = document.createElement('div');
      paymentModal.classList.add('payment-container');

      var heading = document.createElement('div');
      heading.classList.add('heading');
      heading.innerHTML = "Select Location Of Your Unit";

      paymentModal.appendChild(heading);

      if(window['locs'] && window['locs'].length > 0) {
        for(var i=0; i<window['locs'].length; i++){
          var loc = window['locs'][i];

          var a = document.createElement('a');
          a.setAttribute('data-src', loc.iframeUrl);
          a.innerText = loc.location;
          a.classList.add('payment-location')

          var span = document.createElement('span');
          span.innerHTML = loc.address;

          a.appendChild(span);

          paymentModal.appendChild(a);

          a.addEventListener('click', function(){
            var dummyNode = document.createElement('div');
            dummyNode.classList.add('expand');
            var iframe = document.createElement('iframe');
            iframe.src = this.getAttribute('data-src');
            dummyNode.appendChild(iframe);
            Modal.create(dummyNode);
          })
        }

      }
      Modal.create(paymentModal);
    });
  }
}
var validateCard = function() {
  var parent = this.parentNode;
  parent.classList.remove('visa');
  parent.classList.remove('american-express');
  parent.classList.remove('master-card');
  parent.classList.remove('diners-club');
  parent.classList.remove('discover');

  var cardType = creditCardType(this.value);

  if(cardType.length == 1) {
    parent.classList.add(cardType[0].type);
  }
}

var cardEl = document.getElementById('card-number');
console.log(cardEl);
if(cardEl) {
  cardEl.addEventListener('keyup', validateCard);
}

var insuranceRange = document.getElementById('insurance-range');
if(insuranceRange) {
  insuranceRange.addEventListener('change', function(){
    var plans = this.getAttribute('data-insurances');
    try{
      plans = JSON.parse(plans);
    } catch (err) {
      console.log('Error parsing insurance plans');
      return;
    }

    var plan = plans[this.value*1];

    var parent = this.parentNode;
    parent.querySelector('.premium').innerHTML = 'Premium: ' + plan.displayP;
    parent.querySelector('.coverage').innerHTML = 'Coverage: ' + plan.displayC;
    if(plan.c > 5000) {
      parent.querySelector('.approval').classList.remove('invisible');
    } else {
      parent.querySelector('.approval').classList.add('invisible');
    }
    document.getElementById('insuranceId').value = plan.i;

  })
}

var screens = document.querySelectorAll('.screen');
for(var i=0; i<screens.length; i++) {
  var name = screens[i].querySelector('.name');
  if(name){
    name.addEventListener('click', function(){
      var screen = this.parentNode;

      for(var j=0; j<screens.length; j++) {
        screens[j].classList.remove('active');
      }

      screen.classList.add('active');
    });
  }
}

var esignScreen = document.querySelector('.screen.screen-3');
if(esignScreen) {
  var buttons = esignScreen.querySelectorAll('a.button');
  for(var i=0; i<buttons.length; i++) {
    buttons[i].addEventListener('click', function(){
      console.log(this);
      var dummyNode = document.createElement('div');
      dummyNode.classList.add(['esign', 'expand']);
      var iframe = document.createElement('iframe');
      iframe.src = this.getAttribute('data-src');
      dummyNode.appendChild(iframe);
      Modal.create(dummyNode);
    });
  }
}

if(esignScreen) {
  window.setInterval(function(){
    var doc = esignScreen.querySelector('#doc');
    if(doc){
      var body = { id: doc.getAttribute('data-id') };
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if(xhr.readyState === 4) {
          if(xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            console.log(response);
            if(response.completed) {
              document.getElementById('submit-esign').click();
            };
          }
        }
      };
      xhr.open('POST', '/reserve/check-signed');
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(body));
    }
  }, 750)
}

var datePickers = document.querySelectorAll('[data-date-picker="true"]');
var pickers=[]
for(var i=0; i<datePickers.length; i++) {
  pickers[i] = new Pikaday({
    field: datePickers[i],
    minDate: new Date(),
    defaultDate: new Date(),
    toString: function(d, f) {
      var date = new Date(d);
      return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    }
  });
}

var sortUnits = function(sortBy){
  if(sortBy !== 'price' && sortBy !== 'area') return;

  var availableUnitsContainer = document.querySelector('#available-units');
//  var currentSortBy = availableUnitsContainer.getAttribute('data-sort-by');
  var currentSortOrder = availableUnitsContainer.getAttribute('data-sort-order');

  // 1: ascending, -1: descending
  var sortOrder = currentSortOrder === '1' ? -1 : 1;

  var units = availableUnitsContainer.querySelectorAll('.unit');

  var order = [];
  for(var i=0; i<units.length; i++) {
    order.push({
      idx: i,
      comp: units[i].getAttribute('data-unit-' + sortBy)
    });
  }

  order.sort(function(a,b){ return sortOrder*(a.comp - b.comp) });

  var unitsContainer = availableUnitsContainer.querySelector('.units');

//  for(var i=0; i<order.length; i++){ units[order[i].idx].style.order = i; }
  for(var i=0; i<order.length; i++){ unitsContainer.appendChild(units[order[i].idx]); }

  availableUnitsContainer.setAttribute('data-sort-order', sortOrder);
  availableUnitsContainer.setAttribute('data-sort-by', sortBy);
}

var priceSort = document.querySelectorAll('.sort-by-price');
for(var i=0; i<priceSort.length; i++){
  priceSort[i].addEventListener('click', sortUnits.bind(this, 'price'));
}

var sizeSort = document.querySelectorAll('.sort-by-size');
for(var i=0; i<sizeSort.length; i++){
  sizeSort[i].addEventListener('click', sortUnits.bind(this, 'area'));
}

var validate = function(evt){
  var validation = true;

  if(!validator.isAlpha(this['firstName'].value)) {
    validation = false;
    this.querySelector('label[for="' + this['firstName'].id + '"] .validation-failed').innerHTML = 'Invalid First Name';
  } else {
    this.querySelector('label[for="' + this['firstName'].id + '"] .validation-failed').innerHTML = '';
  }

  if(!validator.isAlphanumeric(this['lastName'].value)) {
    validation = false;
    this.querySelector('label[for="' + this['lastName'].id + '"] .validation-failed').innerHTML = 'Invalid Last Name';
  } else {
    this.querySelector('label[for="' + this['lastName'].id + '"] .validation-failed').innerHTML = '';
  }

  if(!validator.isEmail(this['email'].value)) {
    validation = false;
    this.querySelector('label[for="' + this['email'].id + '"] .validation-failed').innerHTML = 'Invalid Email';
  } else {
    this.querySelector('label[for="' + this['email'].id + '"] .validation-failed').innerHTML = '';
  }

  if(!validator.isMobilePhone(this['phone'].value.replace( /\D+/g, ''), 'en-US')) {
    validation = false;
    this.querySelector('label[for="' + this['phone'].id + '"] .validation-failed').innerHTML = 'Invalid Phone';
  } else {
    this.querySelector('label[for="' + this['phone'].id + '"] .validation-failed').innerHTML = '';
  }

  if(!validator.toDate(this['move-in-date'].value)) {
    validation = false;
    this.querySelector('label[for="' + this['move-in-date'].id + '"] .validation-failed').innerHTML = 'Invalid Date';
  } else {
    this.querySelector('label[for="' + this['move-in-date'].id + '"] .validation-failed').innerHTML = '';
  }

//  alert(validation);
  if(!validation) {
    evt.preventDefault();
    return false;
  }
};

var reserve = document.getElementById('reservation-form');
if(reserve) reserve.addEventListener('submit', validate, false);

var squareContainerResize = function() {
  var squares = document.querySelectorAll('.square-container');
  var multiplier = window.innerWidth > 800 ? 1 : 0.4;
  for(var i=0; i<squares.length; i++) {
    squares[i].style.height = (multiplier * squares[i].offsetWidth) + 'px';
  }
}

squareContainerResize();

window.addEventListener('resize', squareContainerResize);

if(document.querySelectorAll('.carousel').length>0){
var carouselObj = new Siema({
  selector: '.carousel',
  duration: 400,
  easing: 'ease-in-out',
  perPage: {
    0: 2,
    800: 1
  },
  startIndex: 0,
  draggable: true,
  multipleDrag: true,
  threshold: 20,
  loop: true,
  rtl: false,
  onInit: function (){
    squareContainerResize();
    var left = document.createElement('a');
    left.className = 'arrow paginate prev';
    left.innerHTML='<';
    var right = document.createElement('a');
    right.className = 'arrow paginate next';
    right.innerHTML='>';
    var arrows = document.createElement('div');
    arrows.className = 'pagination';
    arrows.appendChild(left);
    arrows.appendChild(right);

    this.selector.appendChild(arrows);

    var self = this;
    left.addEventListener("click", function(){
      self.prev();
    });
    right.addEventListener("click", function(){
      self.next();
    });

  },
  onChange: function (){}
});

window.setInterval(function(){
  carouselObj.next();
}, 4000);
}

// filter events
/*
(function() {
  var qvs = document.querySelectorAll('[data-quick-view]');
  var QuickView = require('./components/quickView');

  for (var i = 0; i < qvs.length; i++) {
    qvs[i].addEventListener('click', function(e) {
      //get product and style ids
      var target = e.target.closest('[data-product-id]');

      var productId = Helper.getData(target, 'productId');
      var styleId = Helper.getData(target, 'styleId');
      var options = JSON.parse(Helper.getData(this, 'quickView'));

      if (productId && styleId) {
        e.preventDefault();
        var productInfo

        var r = new XMLHttpRequest();
        r.onreadystatechange = function() {
          if (this.readyState === 4 && this.status === 200) {
            try {
              productInfo = JSON.parse(this.responseText).product[0];
            } catch(ex) {
              productInfo = {};
            }

            var quickView;
            productInfo.styleId = styleId;
            quickView = new QuickView(null, productInfo, options);
            quickView.create();
          }
        };
        r.open("GET", 'https://api.zcloudcat.com/v3/productBundle?styleId=' + styleId + '&siteId=1&includeImages=true', true);
        r.send();
      }
    });
  }
  var styleId = location.hash.slice(1);
  if (styleId && styleId !== "") {
    var anchor = document.querySelectorAll('a[data-style-id="' + styleId + '"]');

    if (anchor.length) {
      anchor[0].click();
    }
  }
})();
*/
