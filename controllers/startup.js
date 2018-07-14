let dynamo = require('./aws/dynamodb');
let alasql = require('alasql');
let config = require('../config/config');
let CardType = require('credit-card-type').types;
const { DateTime } = require('luxon');

let startup = {
  init: (app) => {
    startup.setStatesInfo(app);
    startup.setCardTypes(app)

    setTimeout(function(){
      startup.checkAndUpdate(app, false, true);

      setInterval(function(){
        startup.checkAndUpdate(app);
      }, 30000 );
    }, 2500);
  },
  checkAndUpdate: (app, forceRefresh, updateLastRun) => {
    console.logger.info('');
    console.logger.info('Updating caches');
    let now = new Date().getTime();
    var delay = process.env.IS_LOCAL ? 100 : 1000; // 1000ms
    var ctr = process.env.IS_LOCAL ? 20 : 3; // counter

    for(key in app.lastRun) {
      if(forceRefresh || now-app.lastRun[key]+1000>config.siteLink.frequency[key]){
        app.lastRun[key] = now;
        switch(key) {
          case 'locationCodes':
            setTimeout(function(){
              startup.getLocationCodes(app);
            }, 10);
            break;
          case 'siteInfo':
            setTimeout(function(){
              app.locationCodes.forEach(function(code){
                startup.getSiteInfo(app, code);
              });
            }, delay*(ctr++));
            break;
          case 'discounts':
            setTimeout(function(){
              app.locationCodes.forEach(function(code){
                startup.getDiscounts(app, code);
              });
            }, delay*(ctr++));
            break;
          case 'forms':
            setTimeout(function(){
              app.locationCodes.forEach(function(code){
                startup.getForms(app, code);
              });
            }, delay*(ctr++));
            break;
          case 'insurance':
            setTimeout(function(){
              app.locationCodes.forEach(function(code){
                startup.getInsurance(app, code);
              });
            }, delay*(ctr++));
            break;
          case 'unitTypePriceList':
            setTimeout(function(){
              app.locationCodes.forEach(function(code){
                startup.getUnitTypePriceList(app, code);
              });
            }, delay*(ctr++));
            break;
          case 'unitInfo':
            setTimeout(function(){
              app.locationCodes.forEach(function(code){
                startup.getUnitInfo(app, code);
              });
            }, delay*(ctr++));
            break;
          default:
            break;
        }
      }
    }

    return delay * ctr;
  },
  getLocationCodes: (app) => {
    let params = {
      TableName: 'locations',
      IndexName: 'corporateCode-index',
      ExpressionAttributeValues: {
        ':cc': 'LTRAIN',
      },
      KeyConditionExpression: 'corporateCode = :cc'
    }

    console.logger.info('Location Codes requested');

    dynamo.query(params, (err, data) => {
      if (err) {
        return console.logger.debug(err);
      }

      console.logger.info('Location Codes received');

      app.locations = {};

      let locationCodes = [];
      data.Items.forEach((l) => {
        locationCodes.push(l.sLocationCode)
        app.locations[l.sLocationCode] = l;
      });
      app.locationCodes = locationCodes;
    });
  },
  getSiteInfo: (app, locationCode) => {
    console.logger.info('Site Info requested');
    app.soap.siteInfo(locationCode).then((result) => {
      console.logger.info('Site Info received');
      let siteInfo = startup.processSoapObject(
        result.SiteInformationResult.diffgram.NewDataSet.Table
      );

      startup.decorateSiteObject(siteInfo, app);

      if(siteInfo && siteInfo.SiteID) {
        app.sites[siteInfo.SiteID] = siteInfo;
        app.maps.siteIdToLocationCode[siteInfo.SiteID] = siteInfo.sLocationCode;
        app.maps.locationCodeToSiteId[siteInfo.sLocationCode] = siteInfo.SiteID;
      }
    }).catch((err) => {
      console.logger.info(err);
    });
  },
  getUnitInfo: (app, locationCode) => {
    console.logger.info('Units Info requested');
    app.soap.unitsInformation(locationCode).then((result) => {
      console.logger.info('Units Info received');

      let units = result.UnitsInformationAvailableUnitsOnly_v2Result.diffgram.NewDataSet.Table;
      if(!units) units = [];
      else if(!app.locals.isArray(units)) units = [units];

      units.forEach((unit) => {
        let unitTypePrice = alasql(
          "select * from ?"
          + " where SiteID='" + unit.SiteID + "'"
          + " and UnitTypeID='" + unit.UnitTypeID + "'"
          + " and dcWidth='" + unit.dcWidth + "'"
          + " and dcLength='" + unit.dcLength + "'"
//          + " and dcStdRate='" + unit.dcStdRate + "'"
//          + " and dcPushRate='" + unit.dcPushRate + "'"
          ,
          [app.unitTypePriceList[unit.SiteID] || []]
        );

        let u = startup.processSoapObject(unit);
        if(!u.bRentable || u.bExcludeFromWebsite) return;

        startup.decorateUnitObject(u, app);

        app.units[u.UnitID] = u;
      });
    }).catch((err) => {
      console.logger.debug(err);
    });
  },
  getDiscounts: (app, locationCode) => {
    console.logger.info('Discounts Info requested');
    app.soap.discounts(locationCode).then((result) => {
      console.logger.info('Discounts Info received');
//      app.discounts = result;

      let discounts = result.DiscountPlansRetrieveResult.diffgram.NewDataSet.ConcessionPlans;

      if(discounts && discounts.length > 0) {
        for(var i=0; i<discounts.length; i++) {
          let disc = startup.processSoapObject(discounts[i]);
          startup.decorateDiscountObject(disc);
          app.discounts[discounts[i].ConcessionID] = disc;
        }
      }
    }).catch((err) => {
      console.logger.debug(err);
    });
  },
  getForms: (app, locationCode) => {
    console.logger.info('Forms Info requested');
    app.soap.forms(locationCode).then((result) => {
      console.logger.info('Forms Info received');

      let forms = result.FormsRetrieveResult.diffgram.NewDataSet.Table;

      app.forms[locationCode] = forms;
/*
      if(discounts && discounts.length > 0) {
        for(var i=0; i<discounts.length; i++) {
          let disc = startup.processSoapObject(discounts[i]);
          startup.decorateDiscountObject(disc);
          app.discounts[discounts[i].ConcessionID] = disc;
        }
      }
      */
    }).catch((err) => {
      console.logger.debug(err);
    });
  },
  getInsurance: (app, locationCode) => {
    console.logger.info('Insurance Info requested');
    app.soap.insurance(locationCode).then((result) => {
      console.logger.info('Insurance Info received');

      let insurance = result.InsuranceCoverageRetrieveResult.diffgram.NewDataSet.Table;

      if(insurance) app.insurance[locationCode] = insurance.map(i => {
        i = startup.processSoapObject(i);
        i.displayPremium = app.locals.formatCurrency(i.dcPremium);
        i.displayCoverage = app.locals.formatCurrency(i.dcCoverage);

        return i;
      });
    }).catch((err) => {
      console.logger.debug(err);
    });
  },
  getUnitTypePriceList: (app, locationCode) => {
    console.logger.info('Unit Type Price List requested');
    app.soap.unitTypePriceList(locationCode).then((result) => {
      console.logger.info('Unit Type Price List received');
      let list = [];
      if(result.UnitTypePriceList_v2Result.diffgram.NewDataSet.Table){
        result.UnitTypePriceList_v2Result.diffgram.NewDataSet.Table.forEach((unitType) => {
          let u = startup.processSoapObject(unitType);
          if(u.iTotalVacant == 0) return;

          startup.decorateUnitObject(u, app);

          if(u.ConcessionID) u.concession = app.discounts[u.ConcessionID];

          list.push(u);
        })
      }
      app.unitTypePriceList[app.maps.locationCodeToSiteId[locationCode]] = list;

    }).catch((err) => {
      console.logger.debug(err);
    });

  },
  setStatesInfo: (app) => {
    app.states = {
      raw: [{"id":1,"code":"AL","name":"Alabama"},{"id":2,"code":"AK","name":"Alaska"},{"id":4,"code":"AZ","name":"Arizona"},{"id":5,"code":"AR","name":"Arkansas"},{"id":6,"code":"CA","name":"California"},{"id":8,"code":"CO","name":"Colorado"},{"id":9,"code":"CT","name":"Connecticut"},{"id":10,"code":"DE","name":"Delaware"},{"id":11,"code":"DC","name":"District of Columbia"},{"id":12,"code":"FL","name":"Florida"},{"id":13,"code":"GA","name":"Georgia"},{"id":15,"code":"HI","name":"Hawaii"},{"id":16,"code":"ID","name":"Idaho"},{"id":17,"code":"IL","name":"Illinois"},{"id":18,"code":"IN","name":"Indiana"},{"id":19,"code":"IA","name":"Iowa"},{"id":20,"code":"KS","name":"Kansas"},{"id":21,"code":"KY","name":"Kentucky"},{"id":22,"code":"LA","name":"Louisiana"},{"id":23,"code":"ME","name":"Maine"},{"id":24,"code":"MD","name":"Maryland"},{"id":25,"code":"MA","name":"Massachusetts"},{"id":26,"code":"MI","name":"Michigan"},{"id":27,"code":"MN","name":"Minnesota"},{"id":28,"code":"MS","name":"Mississippi"},{"id":29,"code":"MO","name":"Missouri"},{"id":30,"code":"MT","name":"Montana"},{"id":31,"code":"NE","name":"Nebraska"},{"id":32,"code":"NV","name":"Nevada"},{"id":33,"code":"NH","name":"New Hampshire"},{"id":34,"code":"NJ","name":"New Jersey"},{"id":35,"code":"NM","name":"New Mexico"},{"id":36,"code":"NY","name":"New York"},{"id":37,"code":"NC","name":"North Carolina"},{"id":38,"code":"ND","name":"North Dakota"},{"id":39,"code":"OH","name":"Ohio"},{"id":40,"code":"OK","name":"Oklahoma"},{"id":41,"code":"OR","name":"Oregon"},{"id":42,"code":"PA","name":"Pennsylvania"},{"id":44,"code":"RI","name":"Rhode Island"},{"id":45,"code":"SC","name":"South Carolina"},{"id":46,"code":"SD","name":"South Dakota"},{"id":47,"code":"TN","name":"Tennessee"},{"id":48,"code":"TX","name":"Texas"},{"id":49,"code":"UT","name":"Utah"},{"id":50,"code":"VT","name":"Vermont"},{"id":51,"code":"VA","name":"Virginia"},{"id":53,"code":"WA","name":"Washington"},{"id":54,"code":"WV","name":"West Virginia"},{"id":55,"code":"WI","name":"Wisconsin"},{"id":56,"code":"WY","name":"Wyoming"},{"id":60,"code":"AS","name":"America Samoa"},{"id":64,"code":"FM","name":"Federated States of Micronesia"},{"id":66,"code":"GU","name":"Guam"},{"id":68,"code":"MH","name":"Marshall Islands"},{"id":69,"code":"MP","name":"Northern Mariana Islands"},{"id":70,"code":"PW","name":"Palau"},{"id":72,"code":"PR","name":"Puerto Rico"},{"id":74,"code":"UM","name":"U.S. Minor Outlying Islands"},{"id":78,"code":"VI","name":"Virgin Islands of the United States"}],
      byId: {},
      byCode: {},
      byName: {}
    };

    app.states.raw.forEach(function(state){
      app.states.byId[state.id] = state;
      app.states.byCode[state.code] = state;
      app.states.byName[state.name] = state;
    });
  },
  setCardTypes: (app) => {
    app.cardTypes = {};

    app.cardTypes[CardType.MASTERCARD] = 5;
    app.cardTypes[CardType.VISA] = 6;
    app.cardTypes[CardType.AMERICAN_EXPRESS] = 7;
    app.cardTypes[CardType.DISCOVER] = 8;
    app.cardTypes[CardType.DINERS_CLUB] = 9;
  },
  processSoapObject: (obj) => {
    let u = Object.assign({}, obj);
    delete u.attributes;

    Object.keys(u).forEach((key) => {
      if(key.startsWith('dc')) {
        u[key] = u[key] * 1.0;
      } else if(key.startsWith('i')) {
        u[key] = u[key] * 1;
      } else if(key.startsWith('b')) {
        u[key] = u[key] == 'true' ? true : false;
      }
    });

    return u;
  },
  decorateUnitObject: (u, app) => {
    u.dcArea = 100000.0;
    u.iParking = u.sTypeName.toLowerCase().indexOf('parking') >= 0 ? 1 : 0;
    u.features = [];

    if(u.bClimate && u.sTypeName.toLowerCase().indexOf('climate') == -1) u.features.push('Climate Controlled');
    if(u.bPower) u.features.push('Powered');
    if(u.bAlarm) u.features.push('Has Alarm');

    if(u.dcWidth && u.dcLength) {
      u.displaySize = `${u.dcWidth}' x ${u.dcLength}'`;
      u.dcArea = u.dcWidth * u.dcLength;
    }
    if(u.dcPushRate) u.displayPushRate = app.locals.formatCurrency(u.dcPushRate);
    if(u.dcStdRate) u.displayStdRate = app.locals.formatCurrency(u.dcStdRate);
  },
  decorateSiteObject: (s, app) => {
    if(s == null || Object.keys(s).length == 0) return;

    s.times = {
      access: [
        'M-F:&nbsp;&nbsp;6:00AM - 10:00PM',
        'Sat:&nbsp;&nbsp;6:00AM - 10:00PM',
        'Sun:&nbsp;&nbsp;6:00AM - 10:00PM'
      ],
      office: []
    };

    let weekday = s.bClosedWeekdays ? 'M-F:&nbsp;&nbsp;Closed' : 'M-F:&nbsp;&nbsp;' + startup.formatSiteLinkTime(s.tWeekdayStrt) + ' - ' + startup.formatSiteLinkTime(s.tWeekdayEnd);
    let sat = s.bClosedSaturday ? 'Sat:&nbsp;&nbsp;Closed' : 'Sat:&nbsp;&nbsp;' + startup.formatSiteLinkTime(s.tSaturdayStrt) + ' - ' + startup.formatSiteLinkTime(s.tSaturdayEnd);
    let sun = s.bClosedSunday ? 'Sun:&nbsp;&nbsp;Closed' : 'Sun:&nbsp;&nbsp;' + startup.formatSiteLinkTime(s.tSundayStrt) + ' - ' + startup.formatSiteLinkTime(s.tSundayEnd);

    s.times.office.push(weekday);
    s.times.office.push(sat);
    s.times.office.push(sun);

    s.imageUrls = app.locations[s.sLocationCode] ? app.locations[s.sLocationCode].imageUrls : [];
  },
  decorateDiscountObject: (d) => {
    d.displayName = d.sPlanName;

    if(d.sDescription) {
      let titleIdx = d.sDescription.indexOf('Title:');

      if(titleIdx > -1) {
        let endIdx = d.sDescription.indexOf('Description:') || d.sDescription.length;
        let startIdx = titleIdx + 'Title:'.length;
        d.displayName = d.sDescription.substring(startIdx, endIdx).trim();
      }
    }
  },
  formatSiteLinkTime: (t) => {
    return DateTime.fromFormat(t, "HH:mm:ss" ).toFormat("h:mma");
  },
  compareObjects: (obj1, obj2, keys) => {
    if(!obj1 || !obj2) return false;

    if(typeof obj1 == "undefined" || typeof obj2 == "undefined") return false;

    if(typeof obj1 != typeof obj2) return false;

    if(obj1 instanceof Array || Array.isArray(obj1)) {
      if(obj1.length != obj2.length) return false;

      for(var i=0; i<obj1.length; i++) {
        if(!startup.compareObjects(obj1[i], obj2[i])) return false;
      }
    } else if(typeof obj1 == "object") {
      if(!startup.compareObjects(Object.keys[obj1], Object.keys[obj2])) return false;

      for(var key in obj1) {
        if(!keys || (keys && keys.indexOf(key) > -1) ) {
          if(!startup.compareObjects(obj1[key], obj2[key])) return false;
        }
      }
    } else if(obj1 instanceof Date) {
      if(obj1.getTime() !== obj2.getTime()) return false;
    } else {
      if(obj1 !== obj2) return false;
    }

    return true;
  }
}

module.exports = startup;
