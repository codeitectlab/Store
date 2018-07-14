let baseModel = require('../models/baseModel');
let basePartial = require('../models/basePartial');
let dynamo = require('./aws/dynamodb');
let s3 = require('./aws/s3');
let config = require('../config/config');
let alasql = require('alasql');
let startup = require('./startup');
let url = require('url');

let controller = {
  getCurrentUrl: (req) => {
    return url.format({
      protocol: req.protocol,
      host: req.get('host'),
      pathname: req.originalUrl
    });
  },
  login: (req, res, next) => {
      console.logger.info('Login was called in the Sample');
      res.redirect('/nimda');
  },
  authReturn: (req, res, next) => {
    console.logger.info('We received a return from AzureAD.');

    res.redirect('/nimda');
  },
  logout: (req, res) => {
    req.session.destroy(function(err) {
      req.logOut();
      res.redirect(config.azuread.destroySessionUrl);
    });
  },
  index: (req, res) => {
//    if(!req.user) return res.redirect('/nimda/login');
/*
    let env = process.env.NODE_ENV;
    if(env == 'prod') return res.redirect('/locations/33247');
    if(env == 'test') return res.redirect('/locations/7018');
*/

    let params = {
      TableName: 'locations',
/*      IndexName: 'corporateCode-index',
      ExpressionAttributeValues: {
        ':cc': config.api.corporateCode
      },
      KeyConditionExpression: 'corporateCode = :cc'
*/    }

    dynamo.scan(params, (err, data) => {
      if(err) {
        return console.logger.debug(err);
      }

      let model = baseModel(req);

      let partial0 = basePartial('admin', {
        user: req.user,
        locations: data.Items
      });
      model.body.push(partial0);
      return res.render('home/index', model);
    });

/*
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
      text: 'lorem ipsum'
    }));
    partial2.model.carouselItems.push(basePartial('redInfoTile', {
      imgSrc: 'icon_calendar.svg',
      heading: 'Flexible',
      subHeading: 'Month-to-Month Plans',
      text: 'lorem ipsum'
    }));
    partial2.model.carouselItems.push(basePartial('redInfoTile', {
      imgSrc: 'icon_payments.svg',
      heading: 'Convenient',
      subHeading: 'Online Payment',
      text: 'lorem ipsum'
    }));
    model.body.push(partial2);

    let partial3 = basePartial('hero');
    partial3.model.imgSrc = 'using-storage-calculator.jpg';
    partial3.model.classes = 'overlay-with-blue-background';
    let overlayPartial3 = basePartial('storageCalculatorOverlay');
    partial3.model.overlayPartial = overlayPartial3;
    model.body.push(partial3);
*/
  },
  saveLocationInfo: (req, res) => {
    let data = req.body;

    if(!data.corporateCodeLocationCode || data.corporateCodeLocationCode === '') {
      data.corporateCodeLocationCode = `${data.corporateCode}-${data.sLocationCode}`;
    }
    data.updatedBy = req.user.upn;
    data.updatedAt = new Date().toString();

    if(!req.app.locals.isArray(data.imageUrls) && typeof data.imageUrls === 'string') {
      data.imageUrls = [data.imageUrls];
    }

    for(var key in data) {
      if(!data[key] || data[key] === '') delete data[key];
    }

    let params = {
      TableName: 'locations',
      Item: data
    };

    dynamo.put(params, (err, data) => {
      if(err) {
        console.logger.debug(err);
        return req.app.locals.throwGenericException(err, req, res);
      }

     res.redirect('/nimda/home');
    });
  },
  signS3: (req, res) => {
//    let config = req.app.get('config');
    let fileName = req.query['name'];
    let fileType = req.query['type'];
    let s3Params = {
      Bucket: config.s3.bucket,
      Key: config.s3.keyPrefix + 'locations/' + fileName,
      Expires: 300,
      ContentType: fileType
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
      if(err){
        console.logger.debug(err);
        return res.end();
      }
      let returnData = {
        signedRequest: data,
        url: `https://${config.s3.bucket}.s3.amazonaws.com/${config.s3.keyPrefix}locations/${fileName}`
      };
      return res.json(returnData);
    });
  },
  discounts: (req, res) => {
    res.json(req.app.discounts);
  },
  unitTypePriceList: (req, res) => {
    res.json(req.app.unitTypePriceList);
  },
  find: (req, res) => {
    console.logger.debug(Object.values(req.app.units).length);
    console.logger.debug(req.app.unitGroups.size);
    const obj = {
      "SiteID": "7018",
      "UnitTypeID": "159",
      "sTypeName": "Motorcycle Parking",
      "dcWidth": 5,
      "dcLength": 8,
      "dcArea": 40,
      "dcStdRate": 31.2,
      "dcPushRate": 31.2,
      "iParking": 1
      };
      const keys = [
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
      ];

    res.json(alasql(req.params.term, [Object.values(req.app.unitGroups)]));
  },
  siteInfo: (req, res) => {
    res.json(Object.values(req.app.locations));
  },
  refreshCaches: (req, res) => {
    let time = startup.checkAndUpdate(req.app, true, false)/1000;

    res.json({success: true, message: 'Caches will complete refresh in ' + time + ' seconds.'})
  },
  getCaches: (req, res) => {
    let forms = {};
    for(var loc in req.app.forms) {
      console.logger.debug(loc);
      if(req.app.forms[loc]){
        forms[loc] = req.app.forms[loc].map((form) => {
          if(form.sFormRTF) delete form.sFormRTF;
          if(form.sFormHtml) delete form.sFormHtml;

          return form;
        })
      }
    }
    return res.json({
      locationCodes: req.app.locationCodes,
      locations: req.app.locations,
      sites: req.app.sites,
      discounts: req.app.discounts,
      forms: forms,
      insurance: req.app.insurance,
      units: req.app.units,
      unitGroups: req.app.unitGroups,
      unitTypePriceList: req.app.unitTypePriceList,
      maps: req.app.maps,
      lastRun: req.app.lastRun
    });
  },
}

module.exports = controller;
