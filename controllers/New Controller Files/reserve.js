let baseModel = require('../models/baseModel');
let basePartial = require('../models/basePartial');
let config = require('../config/config');
let alasql = require('alasql');
let soap = require('./soap');
let ses = require('./aws/ses');
var creditCardType = require('credit-card-type');
var crypto = require('../helpers/crypto');
const uuidv4 = require('uuid/v4');
 
//var $ = require("jquery");
//var Inputmask = require("inputmask");
 
 
let controller = {
  index: (req, res) => {
    let model = baseModel(req);
    let locationInfo = req.app.sites[req.body.siteId];
   let unitTypeInfoQuery = `select * from ? where SiteID='${req.body.siteId}'
       and UnitTypeID = '${req.body.unitTypeId}'
       and dcWidth = ${req.body.unitWidth}
       and dcLength = ${req.body.unitLength}
       `;
    let unitTypeInfo = alasql(unitTypeInfoQuery, [req.app.unitTypePriceList[req.body.siteId]])[0];

    if(!unitTypeInfo || !unitTypeInfo.UnitID_FirstAvailable) return req.app.locals.throwNotFoundException(req, res);

    let unitInfo = req.app.units[unitTypeInfo.UnitID_FirstAvailable];

    if(!unitInfo) return req.app.locals.throwNotFoundException(req, res);
    unitInfo.dcReservationFee = unitTypeInfo.dcReservationFee;

    
  
    // let partial1 = basePartial('hero');
    // partial1.model.imgSrc = 'storage-unit-doors.jpg';
    // partial1.model.style = 'margin-top: -80px';
    // model.body.push(partial1);

    let partial2 = basePartial('breadcrumbs');
    partial2.model.crumbs = [];
    partial2.model.crumbs.push({
      label: 'Home',
      href: '/'
    });
    partial2.model.crumbs.push({
      label: 'Reserve A Unit',
      href: '/locations'
    });
    model.body.push(partial2);

    let reservation = controller.getReservationModel(locationInfo, unitInfo, unitTypeInfo);

    let partial3 = basePartial('reservations/reserve', reservation);
    model.body.push(partial3);
    return res.render('home/index', model);
  },
  baseInfo: (req, res) => {
    let reservation = JSON.parse(decodeURIComponent(req.body.model));

    let model = baseModel(req);
 //Inputmask("9-a{1,3}9{1,3}").mask('#phone');
    // let partial1 = basePartial('hero');
    // partial1.model.imgSrc = 'storage-unit-doors.jpg';
    // partial1.model.style = 'margin-top: -80px';
    // model.body.push(partial1);


    let partial2 = basePartial('breadcrumbs');
    partial2.model.crumbs = [];
    partial2.model.crumbs.push({
      label: 'Home',
      href: '/'
    });
    partial2.model.crumbs.push({
      label: 'Reserve A Unit',
      href: '/locations'
    });
    model.body.push(partial2);

    reservation.type = req.body.type;

    let partial3 = basePartial('reservations/baseInfo', reservation);
    model.body.push(partial3);

    return res.render('home/index', model);
  },
  insurance: (req, res) => {
    console.log(req.body);
    let reservation = JSON.parse(decodeURIComponent(req.body.model));
    let body = req.body;
    delete body.model;
    reservation.tenant = body;

    let model = baseModel(req);

    // let partial1 = basePartial('hero');
    // partial1.model.imgSrc = 'storage-unit-doors.jpg';
    // partial1.model.style = 'margin-top: -80px';
    // model.body.push(partial1);

    let partial2 = basePartial('breadcrumbs');
    partial2.model.crumbs = [];
    partial2.model.crumbs.push({
      label: 'Home',
      href: '/'
    });
    partial2.model.crumbs.push({
      label: 'Reserve A Unit',
      href: '/locations'
    });
    model.body.push(partial2);

    reservation.insurance = req.app.insurance[reservation.site.sLocationCode];
    let partial3 = basePartial('reservations/insurance', reservation);
    model.body.push(partial3);

    return res.render('home/index', model);
  },
  online: (req, res) => {
    console.logger.debug(req.body);
    let reservation = JSON.parse(decodeURIComponent(req.body.model));
    let insuranceQuery = `select * from ? where InsurCoverageID='${req.body.insuranceId}'`;
    try
    {
    reservation.insurance = alasql(insuranceQuery, [req.app.insurance[reservation.site.sLocationCode]])[0];
    reservation.insuranceId = req.body.insuranceId
    }
    catch(err){}
    console.logger.debug(reservation.insurance);

    let model = baseModel(req);

    // let partial1 = basePartial('hero');
    // partial1.model.imgSrc = 'storage-unit-doors.jpg';
    // partial1.model.style = 'margin-top: -80px';
    // model.body.push(partial1);

    let partial2 = basePartial('breadcrumbs');
    partial2.model.crumbs = [];
    partial2.model.crumbs.push({
      label: 'Home',
      href: '/'
    });
    partial2.model.crumbs.push({
      label: 'Reserve A Unit',
      href: '/locations'
    });
    model.body.push(partial2);

    let params = {
      dMoveInDate: req.app.locals.getVBDateTime(req.app.locals.getYyyyMmDd(req.body.moveInDate)),
      iUnitID: reservation.unit.UnitID,
      sLocationCode : reservation.site.sLocationCode,// added changes
      ConcessionPlanID: reservation.unitType.concession ? reservation.unitType.concession.ConcessionID : -999,
      InsuranceCoverageID: req.body.insuranceId || -999
    };

    soap.moveInCostRetrieveWithDiscount(params).then((result) => {
      try{
        reservation.moveIn.costs = result.MoveInCostRetrieveWithDiscountResult.diffgram.NewDataSet.Table;
        reservation.moveIn.costs.forEach(cost => {
          reservation.moveIn.taxes += cost.dcTax1*1 + cost.dcTax2*1;
          reservation.moveIn.total += cost.dcTotal*1;
          if(new Date(cost.StartDate) < new Date(reservation.moveIn.startDate)) reservation.moveIn.startDate = cost.StartDate;
          if(new Date(cost.EndDate) > new Date(reservation.moveIn.endDate)) reservation.moveIn.endDate = cost.EndDate;
        })
      } catch (err) {
        console.logger.debug(err);
      }

      let partial3 = basePartial('reservations/onlineBilling', reservation);
      model.body.push(partial3);

      return res.render('home/index', model);
    }).catch((err) => {
      console.logger.debug(err);
      return res.render('home/index', model);
    });

  },
  esign: (req, res) => {
    let card = req.app.locals.prettifyCreditCard(req.body.cardNumber);

    let reservation = JSON.parse(decodeURIComponent(req.body.model));
    let model = baseModel(req);

    // let partial1 = basePartial('hero');
    // partial1.model.imgSrc = 'storage-unit-doors.jpg';
    // partial1.model.style = 'margin-top: -80px';
    // model.body.push(partial1);

    let partial2 = basePartial('breadcrumbs');
    partial2.model.crumbs = [];
    partial2.model.crumbs.push({
      label: 'Home',
      href: '/'
    });
    partial2.model.crumbs.push({
      label: 'Reserve A Unit',
      href: '/locations'
    });
    model.body.push(partial2);

    let params = {
      sTenantFirstName: reservation.tenant.firstName,
      sTenantLastName: reservation.tenant.lastName,
      sEmailAddress: reservation.tenant.email,
      sLocationCode : reservation.site.sLocationCode,// added changes
    };

    soap.tenantList(params).then((result) => {
      let tenant = result.TenantListDetailed_v2Result.diffgram.NewDataSet.Table;

      if(tenant) {
        return tenant;
      } else {
        let tenantParams = {
          sFName: reservation.tenant.firstName,
          sLName: reservation.tenant.lastName,
          sEmail: reservation.tenant.email,
          sPhone: reservation.tenant.phone,
          sLocationCode : reservation.site.sLocationCode,// added changes
        };

        return soap.createTenant(tenantParams).then((r) => {
          return r.TenantNewDetailedResult.diffgram.NewDataSet.Tenants;
        });
      };
    }).then((result) => {
      Object.assign(reservation.tenant, result);
      let address = [req.body.billingAddress1];
      if(req.body.billingAddress2) address.push(req.body.billingAddress2);
      address.push(req.body.billingCity);
      address.push(req.body.billingState);

      console.logger.debug(reservation.unitType);

      let moveInParams = {
        TenantID: reservation.tenant.TenantID || '',
        sAccessCode: '',
        UnitID: reservation.unit.UnitID,
        dStartDate: reservation.moveIn.startDate,
        dEndDate: reservation.moveIn.endDate,
        dcPaymentAmount: reservation.moveIn.total,
        iCreditCardType: req.app.cardTypes[card.type],
        sCreditCardNumber: req.body.cardNumber,
        sCreditCardCVV: req.body.cardCVV,
        dExpirationDate: req.app.locals.getVBDateTime(`${req.body.cardExpirationYear}-${req.body.cardExpirationMonth}-28`),
        sBillingName: req.body.cardHolder,
        sBillingAddress: address.join(', '),
        sBillingZipCode: req.body.billingZip,
        InsuranceCoverageID: reservation.insurance == null ? 0 : reservation.insurance.InsurCoverageID,
        ConcessionPlanID: reservation.unitType.ConcessionID,
        sLocationCode: reservation.tenant.locationCode,
      };
     //Temporary Fixes
 //moveInParams.dStartDate = (new Date()).toLocaleDateString();//reservation.moveIn.endDate;
      moveInParams.sLocationCode = reservation.tenant.locationCode;
      return soap.moveIn(moveInParams).then(r => {
        console.logger.debug(r.MoveInWithDiscount_v2Result.diffgram);
        let ledgerID = r.MoveInWithDiscount_v2Result.diffgram.NewDataSet.RT.Ret_Code;
//        let ledgerID = '45979';
        return ledgerID;
      });
/*
      return soap.reserveNew(reservationParams).then((r) => {
        let waitingListId = r.ReservationNewWithSourceResult.diffgram.NewDataSet.RT.Ret_Code || -1;
        if(waitingListId < 0) throw new Error(waitingListId);

        return waitingListId;
      });
*/    })
    .then(result => {
      // 474 Autopay Auth
      // 446 Lease #2
      // 533 Lease #1

      let predicates = [];
      if(reservation.unit.iParking == 1) predicates.push('sFormName like \'%Lease #2%\'')
      else predicates.push('sFormName like \'%Lease #1%\'');

      predicates.push('sFormName like \'%StoreSpace - TPP Sign Up%\'')
//      predicates.push('sFormName like \'%Autopay Auth%\'')
//      predicates.push('sFormName like \'%Insurance Sign-up%\'')

      let leaseUrlQuery = `select * from ? where ${predicates.join(' or ')}`;
      console.logger.debug(leaseUrlQuery);

      let forms = alasql(leaseUrlQuery, [req.app.forms[reservation.site.sLocationCode]]);
      console.logger.debug(forms.map(f => { return f.FormID }).join(','))

      let uuid = uuidv4();

      let leaseUrlParams = {
        iTenantID: reservation.tenant.TenantID || '',
        iLedgerID: result,
//        sFormIdsCommaDelimited: ['533'],
        sFormIdsCommaDelimited: forms.map(f => { return f.FormID }).join(','),
        sReturnUrl: `https://${config.host}/reserve/done-signing/${uuid}`
      }
      return soap.createLeaseUrl(leaseUrlParams).then(r => {
        let lease = r.SiteLinkeSignCreateLeaseURL_v2Result.diffgram.NewDataSet.RT;

        if(lease.Ret_Code*1 !== 1) {
          console.logger.info(lease);
          return req.app.locals.throwGenericException(new Error('There was an error retrieving your lease documents. Please contact the location.'), req, res);
        }

        let esign = {
          id: uuid,
          url: lease.Ret_Msg,
          documentId: lease.DocumentID,
          completed: false
        }

        req.app.leaseESign[uuid] = esign;
        reservation.esign = esign;

        let partial3 = basePartial('reservations/onlineEsign', reservation);
        model.body.push(partial3);

        return res.render('home/index', model);
      })
    })
/*    .then((result) => {

      let partial3 = basePartial('reservations/confirm', {
        site: locationInfo,
        unit: unitInfo,
        tenant: tenantInfo,
        waitingListId: result,
        moveInDate: req.body.moveInDate
      });
      model.body.push(partial3);

      soap.moveIn(params).then(result => {


      }, err => {

      })
      model.body.push(partial3);

      return res.render('home/index', model);
    });
*/
  },
  doneSigning: (req, res) => {
    console.logger.info(req.params.id);
    if(req.app.leaseESign[req.params.id]) req.app.leaseESign[req.params.id].completed = true;
    return res.render('partials/reservations/doneSigning');
  },
  checkSigned: (req, res) => {
    console.logger.info(req.body);
    if(req.body && req.body.id && req.app.leaseESign[req.body.id] && req.app.leaseESign[req.body.id].completed) res.json({ completed: true });
    else res.json({ complete: false });
  },
  atLocation: (req, res) => {
    let reservation = JSON.parse(decodeURIComponent(req.body.model));

    console.logger.info(reservation);

    let model = baseModel(req);
//    let locationInfo = req.app.sites[req.body.siteId];
//    let unitInfo = req.app.units[req.body.unitId];
    let tenantInfo = {};

    // let partial1 = basePartial('hero');
    // partial1.model.imgSrc = 'storage-unit-doors.jpg';
    // partial1.model.style = 'margin-top: -80px';
    // model.body.push(partial1);

    let partial2 = basePartial('breadcrumbs');
    partial2.model.crumbs = [];
    partial2.model.crumbs.push({
      label: 'Home',
      href: '/'
    });
    partial2.model.crumbs.push({
      label: 'Reserve A Unit',
      href: '/locations'
    });
    model.body.push(partial2);

    let params = {
      sTenantFirstName: req.body.firstName,
      sTenantLastName: req.body.lastName,
      sEmailAddress: req.body.email
    };

    soap.tenantList(params).then((result) => {
      let tenant = result.TenantListDetailed_v2Result.diffgram.NewDataSet.Table;

      if(tenant) {
        return tenant;
      } else {
        let tenantParams = {
          sFName: req.body.firstName,
          sLName: req.body.lastName,
          sEmail: req.body.email,
          sPhone: req.body.phone
        };

        return soap.createTenant(tenantParams).then((r) => {
          return r.TenantNewDetailedResult.diffgram.NewDataSet.Tenants;
        });
      };
    }).then((result) => {
      tenantInfo = result;

      let reservationParams = {
        sTenantID: result.TenantID || '',
        sUnitID1: reservation.unit.UnitID,
        sUnitID2: '',
        sUnitID3: '',
        dNeeded: req.app.locals.getVBDateTime(req.app.locals.getYyyyMmDd(req.body.moveInDate)),
        sComment: 'IP Address: ' + JSON.stringify(req.headers['X-Forwarded-For'])
      };

      return soap.reserveNew(reservationParams).then((r) => {
        let waitingListId = r.ReservationNewWithSourceResult.diffgram.NewDataSet.RT.Ret_Code || -1;
        if(waitingListId < 0) throw new Error(waitingListId);

        return waitingListId;
      });
    }).then((result) => {

      reservation.waitingListId = result;
      reservation.moveInDate = req.body.moveInDate;
      reservation.tenant = tenantInfo;

      let partial3 = basePartial('reservations/confirm', reservation);
      model.body.push(partial3);

      let templateData = controller.getBaseEmailTemplateData('ReservationConfirmation');
      templateData.confirmation = result;
      templateData.unitSize = reservation.unit.displaySize;
      templateData.unitRate = reservation.unit.displayPushRate + '/mo';
      templateData.unitFeatures = reservation.unit.features.join(', ');

      templateData.unitLocation = [];
      templateData.unitLocation.push(reservation.site.sSiteAddr1);
      if(reservation.site.sSiteAddr2) templateData.unitLocation.push(reservation.site.sSiteAddr2);
      templateData.unitLocation.push(reservation.site.sSiteCity + ', ' + reservation.site.sSiteRegion + ' ' + reservation.site.sSitePostalCode);
      templateData.unitLocation = templateData.unitLocation.join('<br>');

      templateData.unitOfficeHours1 = reservation.site.times.office[0] ? reservation.site.times.office[0] : '';
      templateData.unitOfficeHours2 = reservation.site.times.office[1] ? reservation.site.times.office[1] : '';
      templateData.unitOfficeHours3 = reservation.site.times.office[2] ? reservation.site.times.office[2] : '';

      templateData.unitAccessHours1 = reservation.site.times.access[0] ? reservation.site.times.access[0] : '';
      templateData.unitAccessHours2 = reservation.site.times.access[1] ? reservation.site.times.access[1] : '';
      templateData.unitAccessHours3 = reservation.site.times.access[2] ? reservation.site.times.access[2] : '';

      let sesParams = {
        Destination: {
          ToAddresses: [ req.body.email ]
        },
        Source: 'Store Space <CustomerSupport@storespace.com>',
        Template: 'ReservationConfirmation',
        TemplateData: JSON.stringify(templateData),
        ReplyToAddresses: [ 'CustomerSupport@storespace.com' ],
        ReturnPath: 'CustomerSupport@storespace.com',
      };
      ses.sendTemplatedEmail(sesParams, function(err, data) {
        if (err) console.logger.debug(err);
        else console.logger.info(data);

        return res.render('home/index', model);
      });
    }).catch((err) => {
      console.logger.debug(err);
      return res.render('home/index', model);
    });
  },
  onlineSummary: (req, res) => {
    let reservation = JSON.parse(decodeURIComponent(req.body.model));

    let model = baseModel(req);

    // let partial1 = basePartial('hero');
    // partial1.model.imgSrc = 'storage-unit-doors.jpg';
    // partial1.model.style = 'margin-top: -80px';
    // model.body.push(partial1);

    let partial2 = basePartial('breadcrumbs');
    partial2.model.crumbs = [];
    partial2.model.crumbs.push({
      label: 'Home',
      href: '/'
    });
    partial2.model.crumbs.push({
      label: 'Reserve A Unit',
      href: '/locations'
    });
    model.body.push(partial2);

    reservation.moveInDate = reservation.tenant.moveInDate;

    let partial3 = basePartial('reservations/confirm', reservation);
    model.body.push(partial3);

    model.includeConversionGA = true;

    return res.render('home/index', model);
  },
  confirm: (req, res) => {
    let model = baseModel(req);
    model.includeConversionGA = true;

    let locationInfo = req.app.sites[req.body.siteId];
    let unitInfo = req.app.units[req.body.unitId];
    let tenantInfo = {};

    // let partial1 = basePartial('hero');
    // partial1.model.imgSrc = 'storage-unit-doors.jpg';
    // partial1.model.style = 'margin-top: -80px';
    // model.body.push(partial1);

    let partial2 = basePartial('breadcrumbs');
    partial2.model.crumbs = [];
    partial2.model.crumbs.push({
      label: 'Home',
      href: '/'
    });
    partial2.model.crumbs.push({
      label: 'Reserve A Unit',
      href: '/locations'
    });
    model.body.push(partial2);

    let params = {
      sTenantFirstName: req.body.firstName,
      sTenantLastName: req.body.lastName,
      sEmailAddress: req.body.email
    };

    soap.tenantList(params).then((result) => {
      let tenant = result.TenantListDetailed_v2Result.diffgram.NewDataSet.Table;

      if(tenant) {
        return tenant;
      } else {
        let tenantParams = {
          sFName: req.body.firstName,
          sLName: req.body.lastName,
          sEmail: req.body.email,
          sPhone: req.body.phone
        };

        return soap.createTenant(tenantParams).then((r) => {
          return r.TenantNewDetailedResult.diffgram.NewDataSet.Tenants;
        });
      };
    }).then((result) => {
      tenantInfo = result;

      let reservationParams = {
        sTenantID: result.TenantID || '',
        sUnitID1: unitInfo.UnitID,
        sUnitID2: '',
        sUnitID3: '',
        dNeeded: req.app.locals.getVBDateTime(req.body.moveInDate),
        sComment: 'IP Address: ' + JSON.stringify(req.headers['X-Forwarded-For'])
      };

      return soap.reserveNew(reservationParams).then((r) => {
        let waitingListId = r.ReservationNewWithSourceResult.diffgram.NewDataSet.RT.Ret_Code || -1;
        if(waitingListId < 0) throw new Error(waitingListId);

        return waitingListId;
      });
    }).then((result) => {

      let partial3 = basePartial('reservations/confirm', {
        site: locationInfo,
        unit: unitInfo,
        tenant: tenantInfo,
        waitingListId: result,
        moveInDate: req.body.moveInDate
      });
      model.body.push(partial3);

      let templateData = controller.getBaseEmailTemplateData('ReservationConfirmation');
      templateData.confirmation = result;
      templateData.unitSize = unitInfo.displaySize;
      templateData.unitRate = unitInfo.displayPushRate + '/mo';
      templateData.unitFeatures = unitInfo.features.join(', ');

      templateData.unitLocation = [];
      templateData.unitLocation.push(locationInfo.sSiteAddr1);
      if(locationInfo.sSiteAddr2) templateData.unitLocation.push(locationInfo.sSiteAddr2);
      templateData.unitLocation.push(locationInfo.sSiteCity + ', ' + locationInfo.sSiteRegion + ' ' + locationInfo.sSitePostalCode);
      templateData.unitLocation = templateData.unitLocation.join('<br>');

      templateData.unitOfficeHours1 = locationInfo.times.office[0] ? locationInfo.times.office[0] : '';
      templateData.unitOfficeHours2 = locationInfo.times.office[1] ? locationInfo.times.office[1] : '';
      templateData.unitOfficeHours3 = locationInfo.times.office[2] ? locationInfo.times.office[2] : '';

      templateData.unitAccessHours1 = locationInfo.times.access[0] ? locationInfo.times.access[0] : '';
      templateData.unitAccessHours2 = locationInfo.times.access[1] ? locationInfo.times.access[1] : '';
      templateData.unitAccessHours3 = locationInfo.times.access[2] ? locationInfo.times.access[2] : '';

      let sesParams = {
        Destination: {
          ToAddresses: [ req.body.email ]
        },
        Source: 'Store Space <CustomerSupport@storespace.com>',
        Template: 'ReservationConfirmation',
        TemplateData: JSON.stringify(templateData),
        ReplyToAddresses: [ 'CustomerSupport@storespace.com' ],
        ReturnPath: 'CustomerSupport@storespace.com',
      };
      ses.sendTemplatedEmail(sesParams, function(err, data) {
        if (err) console.logger.debug(err);
        else console.logger.info(data);

        return res.render('home/index', model);
      });
    }).catch((err) => {
      console.logger.debug(err);
      return res.json(err);
    });
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
  getReservationModel: (s, u, ut, t, i, m, c, e) => {
    return {
      card: c || {},
      esign: e || {},
      insurance: i || {},
      moveIn: m || {
        costs: [],
        endDate: new Date(),
        startDate: new Date(),
        taxes: 0.0,
        total: 0.0,
      },
      site: s || {},
      tenant: t || {},
      unit: u || {},
      unitType: ut || {}
    }
  },
  getEncryptedObj: (obj) => {
    let ts = `${new Date().getTime()}`;
    return `${ts}-${crypto.encrypt(JSON.stringify(s), ts)}`;
  },
  getDecryptedObj: (s) => {
    let splits = s.split('-');
    return JSON.parse(crypto.decrypt(splits[1], splits[0]));
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
