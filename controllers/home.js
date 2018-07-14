let baseModel = require('../models/baseModel');
let basePartial = require('../models/basePartial');
let config = require('../config/config');
let alasql = require('alasql');
let soap = require('./soap');
let ses = require('./aws/ses');

let controller = {
  privacy: (req, res) => {
    return res.render('home/privacy-policy');
  },
  terms: (req, res) => {
    return res.render('home/terms');
  },
  index: (req, res) => {
    let model = baseModel(req);

    let partial0 = basePartial('findUnitOverlay', {}, true);
    model.body.push(partial0);

    let partial1 = basePartial('hero');
    partial1.model.imgSrc = 'storage-unit-doors.jpg';
    partial1.model.style = 'margin-top: -80px';
    partial1.model.classes = 'overlay-with-gray-background';
    let overlayPartial1 = basePartial('findUnitOverlay', {
      heading: 'Better storage units at an even better price, <strong>near you</strong>.'
    }, null, true);
    partial1.model.overlayPartial = overlayPartial1;
    model.body.push(partial1);

    let partial2 = basePartial('homeCarousel');
    partial2.model.carouselItems = [];

    partial2.model.carouselItems.push(basePartial('redInfoTile', {
      imgSrc: 'icon_sec-camera.svg',
      heading: '24-Hour',
      subHeading: 'Security Surveilance',
      text: 'Cameras and vigilant staff ensure that your belongings are safely stored.'
    }));
    partial2.model.carouselItems.push(basePartial('redInfoTile', {
      imgSrc: 'icon_calendar.svg',
      heading: 'Flexible',
      subHeading: 'Month-to-Month Plans',
      text: 'A variety of available plans to offer you the most flexibility for your storage needs.'
    }));
    partial2.model.carouselItems.push(basePartial('redInfoTile', {
      imgSrc: 'icon_payments.svg',
      heading: 'Convenient',
      subHeading: 'Online Payment',
      text: 'Online system offers easy payments and e-lease options to make your storage experience as convenient as possible.'
    }));
    model.body.push(partial2);
/*
    let partial3 = basePartial('hero');
    partial3.model.imgSrc = 'using-storage-calculator.jpg';
    partial3.model.classes = 'overlay-with-blue-background';
    let overlayPartial3 = basePartial('storageCalculatorOverlay');
    partial3.model.overlayPartial = overlayPartial3;
    model.body.push(partial3);
*/
    return res.render('home/index', model);
  },
  locationsIndex: (req, res) => {
    if(req.params.locationCode && req.params.locationCode!='index') return controller.locationByLocationCode(req, res);

//    let env = process.env.NODE_ENV;
//    if(env == 'prod') return res.redirect('/locations');

    let model = baseModel(req);
/*
    let partial0 = basePartial('findUnitOverlay', {}, true);
    model.body.push(partial0);

    let partial1 = basePartial('hero');
    partial1.model.imgSrc = 'woman-holding-box.jpg';
    partial1.model.style = 'margin-top: -80px';
    let overlayPartial1 = basePartial('findUnitOverlay', {
      heading: '<strong>SEARCH</strong> For Storage Units Near You',
      text: 'Store Space has a variety of self storage unit sizes with features to meet your needs. Search for a unit near you and easily reserve online.'
    }, null, true);
    partial1.model.overlayPartial = overlayPartial1;
    model.body.push(partial1);
*/
    let partial2 = basePartial('locationSelector');
    let locations = alasql("select * from ? order by sSiteRegion, sSiteCity", [Object.values(req.app.sites)]);
    partial2.model.locations = {};
    Object.values(req.app.locations).forEach((location) => {
      if(!partial2.model.locations[req.app.states.byCode[location.sSiteRegion].name]) partial2.model.locations[req.app.states.byCode[location.sSiteRegion].name] = [];
      partial2.model.locations[req.app.states.byCode[location.sSiteRegion].name].push(location);
    });
    partial2.model.states = Object.keys(partial2.model.locations);
    partial2.model.states.sort();
    partial2.model.map = basePartial('map');
    model.body.push(partial2);
/*
    let partial3 = basePartial('hero');
    partial3.model.imgSrc = 'using-storage-calculator.jpg';
    partial3.model.classes = 'overlay-with-blue-background';
    let overlayPartial3 = basePartial('storageCalculatorOverlay');
    partial3.model.overlayPartial = overlayPartial3;
    model.body.push(partial3);
*/
    return res.render('home/index', model);
  },
  locationBySiteId: (req, res) => {
    let model = baseModel(req);
    let locationInfo = alasql("select * from ? where SiteID='"+req.params.siteId+"'", [Object.values(req.app.sites)])[0];

    let units = alasql(
      "select * from ?"
      + " where SiteID='" + req.params.siteId + "'"
//      + " and bRentable=true"
//      + " and bExcludeFromWebsite<>true"
      + " order by iParking asc"
      + ", dcArea asc",
      [req.app.unitTypePriceList[req.params.siteId] || []]
    );

    if(!units || units.length < 1) {
      return req.app.locals.throwNotFoundException(req, res);
    }

    locationInfo.units = units;

    let partial2 = basePartial('breadcrumbs');
    partial2.model.crumbs = [];
    partial2.model.crumbs.push({
      label: 'Home',
      href: '/'
    });
    partial2.model.crumbs.push({
      label: 'Locations',
      href: '/locations'
    });
    partial2.model.crumbs.push({
      label: [locationInfo.sSiteCity, locationInfo.sSiteRegion].join(', '),
      href: '/locations/' + locationInfo.SiteID
    });
    model.body.push(partial2);

    let partial3 = basePartial('locationInfo', locationInfo);
    model.body.push(partial3);

    return res.render('home/index', model);
  },
  locationByLocationCode: (req, res) => {
    let model = baseModel(req);
    let locationInfo = req.app.locations[req.params.locationCode];
    if(!locationInfo) {
      return req.app.locals.throwNotFoundException(req, res);
    }

    if(req.app.maps.locationCodeToSiteId[req.params.locationCode]) {
      locationInfo = req.app.sites[req.app.maps.locationCodeToSiteId[req.params.locationCode]];

      let units = alasql(
        "select * from ?"
//        + " where SiteID='" + locationInfo.SiteID + "'"
  //      + " and bRentable=true"
  //      + " and bExcludeFromWebsite<>true"
        + " order by iParking asc"
        + ", dcArea asc",
        [req.app.unitTypePriceList[locationInfo.SiteID] || []]
      );

      if(!units || units.length < 1) {
        return req.app.locals.throwNotFoundException(req, res);
      }

      locationInfo.units = units;
    } else {
      locationInfo.comingSoon = true;
    }
    let partial2 = basePartial('breadcrumbs');
    partial2.model.crumbs = [];
    partial2.model.crumbs.push({
      label: 'Home',
      href: '/'
    });
    partial2.model.crumbs.push({
      label: 'Locations',
      href: '/locations'
    });
    partial2.model.crumbs.push({
      label: [locationInfo.sSiteCity, locationInfo.sSiteRegion].join(', '),
      href: '/locations/' + req.params.locationCode
    });
    model.body.push(partial2);

    let partial3 = basePartial('locationInfo', locationInfo);
    model.body.push(partial3);

    return res.render('home/index', model);
  },
  findByZip: (req, res) => {
    if(!req.body.zip) return res.redirect('/locations');


    soap.findByZip(req.body.zip).then((result) => {
      let data = result.SiteSearchByPostalCodeResult.diffgram.NewDataSet.Table;

      let query = "select * from ? "
      + "where sLocationCode in ('" + req.app.locationCodes.join("','") + "') "
//      + "and dcDistance > 0.0000 "
      + "and dcDistance <= 100.0000 "
      + "order by dcDistance asc";

      let locations = alasql(query, [data]);

      let model = baseModel(req);
      /*
      let partial0 = basePartial('findUnitOverlay', {}, true);
      model.body.push(partial0);

      let partial1 = basePartial('hero');
      partial1.model.imgSrc = 'woman-holding-box.jpg';
      partial1.model.style = 'margin-top: -80px';
      let overlayPartial1 = basePartial('findUnitOverlay', {
        heading: '<strong>SEARCH</strong> For Storage Units Near You',
        text: 'Store Space has a variety of self storage unit sizes with features to meet your needs. Search for a unit near you and easily reserve online.'
      }, null, true);
      partial1.model.overlayPartial = overlayPartial1;
      model.body.push(partial1);
      */
      let partial2 = basePartial('findByZipSelector');
//      let locations = alasql("select * from ? order by sSiteRegion, sSiteCity", [Object.values(req.app.sites)]);
      partial2.model.searchedZip = req.body.zip;
      partial2.model.locations = {};
      locations.forEach((location) => {
        location.displayCity = `${location.sSiteCity} ${Math.trunc(location.dcDistance*100)/100}mi`;
        if(!partial2.model.locations[req.app.states.byCode[location.sSiteRegion].name]) partial2.model.locations[req.app.states.byCode[location.sSiteRegion].name] = [];
        partial2.model.locations[req.app.states.byCode[location.sSiteRegion].name].push(location);
      });
      partial2.model.states = Object.keys(partial2.model.locations);
      partial2.model.map = basePartial('map');
      model.body.push(partial2);
      /*
      let partial3 = basePartial('hero');
      partial3.model.imgSrc = 'using-storage-calculator.jpg';
      partial3.model.classes = 'overlay-with-blue-background';
      let overlayPartial3 = basePartial('storageCalculatorOverlay');
      partial3.model.overlayPartial = overlayPartial3;
      model.body.push(partial3);
      */
      return res.render('home/index', model);
//      res.json(locations);
    }).catch((err) => {
      console.logger.debug(err);
      res.json(err);
    });

  },
  underConstruction: (req, res) => {
    let model = {
      metaKeywords: "",
      metaDescription: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      ogUrl: "",
      pageTitle: "Store Space",
      disableHeader: false,
      disableFooter: false
    }
    return res.render('home/underConstruction', model);
  },
  getBaseEmailTemplateData: (name) => {
    switch(name) {
      case 'ReservationConfirmation':
        return {
          imageHost: 'https://d2qkkzpelj00zf.cloudfront.net',
          confirmation: '',
          unitSize: '',
          unitRate: '',
          unitFeatures: '',
          unitLocation: '',
          unitOfficeHours1: '',
          unitOfficeHours2: '',
          unitAccessHours1: '',
          unitAccessHours2: ''
        };
      default:
        return {};
    }
  },
  getUnitGroupKeys: [
    "SiteID",
    "UnitTypeID",
    "sTypeName",
    "dcWidth",
    "dcLength",
    "dcArea",
    "dcStdRate",
    "dcPushRate",
    "iParking",
    "features"
  ]
}

module.exports = controller;
