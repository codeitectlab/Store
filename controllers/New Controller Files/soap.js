var soap = require('soap');
var config = require('../config/config');
var fs = require('fs');

const vanillaHandleResponse = soap.HttpClient.prototype.handleResponse;
soap.HttpClient.prototype.handleResponse = function(req, res, body){
  let newBody = body;
  if (typeof body === 'string') {
    newBody = body.replace(/&#x0;/g, '');
  }

  return vanillaHandleResponse.call(this, req, res, newBody);
}

var url = 'https://api.smdservers.net/CCWs_3.5/CallCenterWs.asmx?WSDL';
var baseArgs = {
  'sCorpCode': config.api.corporateCode,
  'sLocationCode': config.api.locationCode,
  'sCorpUserName': config.api.user + ':::' + config.api.key,
  'sCorpPassword': config.api.pass
};

var siteLinkClient = null;

soap.createClient(url, function(err, client) {
  siteLinkClient = client;
});

var soapUtils = {
  epochTicks: 621355968000000000,
  ticksPerMillisecond: 10000,
  getTicksFromTime: (date) => {
    return soapUtils.epochTicks + (date.getTime() * soapUtils.ticksPerMillisecond);
  },
  getCurrentTicks: () => {
    return soapUtils.getTicksFromTime(new Date());
  },
  writeToDisk: (data, fileName) => {
    filePath = appRoot + '/.local/' + fileName;

    let stringified = JSON.stringify(data);
    fs.writeFileSync(filePath, stringified);
  },
  readJsonFromDisk: (fileName) => {
    filePath = appRoot + '/.local/' + fileName;
    let data = fs.readFileSync(filePath);
    if(data) {
      console.logger.debug('Disk cache hit');
      return JSON.parse(data);
    }

    return {};
  }
};
var soapCalls = {
  // SiteLinkeSignCreateLeaseURL_v2
  createLeaseUrl: (params) => {
    return new Promise((resolve, reject) => {
      let methodArgs = {
        sCorpCode: '',
        sLocationCode: '',
        sCorpUserName: '',
        sCorpPassword: '',
        iTenantID: '',
        iLedgerID: '',
        sFormIdsCommaDelimited: '',
        sReturnUrl: ''
      };

      let args = Object.assign({}, methodArgs, baseArgs, params);

      siteLinkClient.SiteLinkeSignCreateLeaseURL_v2(args, function(err, result, raw, header) {
        if(err) return reject(err);

        console.logger.debug('SiteLinkeSignCreateLeaseURL_v2');

        resolve(result);
      });
    });
  },
  createTenant: (params) => {
    let fileName = 'createTenant.json';
    return new Promise((resolve, reject) => {
      let methodArgs = {
        sCorpCode: '',
        sLocationCode: '',
        sCorpUserName: '',
        sCorpPassword: '',
        sWebPassword: '',
        sMrMrs: '',
        sFName: '',
        sMI: '',
        sLName: '',
        sCompany: '',
        sAddr1: '',
        sAddr2: '',
        sCity: '',
        sRegion: '',
        sPostalCode: '',
        sCountry: '',
        sPhone: '',
        sMrMrsAlt: '',
        sFNameAlt: '',
        sMIAlt: '',
        sLNameAlt: '',
        sAddr1Alt: '',
        sAddr2Alt: '',
        sCityAlt: '',
        sRegionAlt: '',
        sPostalCodeAlt: '',
        sCountryAlt: '',
        sPhoneAlt: '',
        sMrMrsBus: '',
        sFNameBus: '',
        sMIBus: '',
        sLNameBus: '',
        sCompanyBus: '',
        sAddr1Bus: '',
        sAddr2Bus: '',
        sCityBus: '',
        sRegionBus: '',
        sPostalCodeBus: '',
        sCountryBus: '',
        sPhoneBus: '',
        sFax: '',
        sEmail: '',
        sPager: '',
        sMobile: '',
        bCommercial: false,
        bCompanyIsTenant: false,
        dDOB: '1700-01-01T00:00:00-00:00',
        sTenNote: '',
        sLicense: '',
        sLicRegion: '',
        sSSN: ''
      }

      let args = Object.assign({}, methodArgs, baseArgs, params);

      siteLinkClient.TenantNewDetailed(args, function(err, result, raw, header) {
        if(err) return reject(err);

        console.logger.debug('TenantNewDetailed');

        resolve(result);
      });
    });
  },
  discounts: (locationCode) => {
    let fileName = `discounts.${locationCode}.json`;
    if(process.env.IS_LOCAL) {
      return new Promise((resolve, reject) => {
//        let fileName = 'unitsInformation.json';
        resolve(soapUtils.readJsonFromDisk(fileName))
      });
    }

    return new Promise((resolve, reject) => {
      let args = Object.assign({}, baseArgs, { 'sLocationCode': locationCode });
      siteLinkClient.DiscountPlansRetrieve(args, function(err, result, raw, header) {
        if(err) return reject(err);

        if(process.env.NODE_ENV === 'devo') {
          soapUtils.writeToDisk(result, fileName);
        }

        resolve(result);
      });
    });
  },
  forms: (locationCode) => {
    let fileName = `forms.${locationCode}.json`;
    if(process.env.IS_LOCAL) {
      return new Promise((resolve, reject) => {
        resolve(soapUtils.readJsonFromDisk(fileName))
      });
    }

    return new Promise((resolve, reject) => {
      let args = Object.assign({}, baseArgs, { 'sLocationCode': locationCode });
      siteLinkClient.FormsRetrieve(args, function(err, result, raw, header) {
//        console.log(raw);
//        let data = raw.replace(/&amp/g, '').replace(/&gt/g, '').replace(/&lt/g, '');
//        let matches = data.match(/.{0,20}&.{0,20}/g);
//        console.log(matches);
 //       return resolve([]);
        if(err) return reject(err);

        if(process.env.NODE_ENV === 'devo') {
          soapUtils.writeToDisk(result, fileName);
        }

        resolve(result);
      }, {preProcess: function(_xml){
        return _xml.replace('&#x0;', '');
       }});
    });
  },
  findByZip: (zip) => {
    let fileName = 'findByZip.json';
    return new Promise((resolve, reject) => {
      let args = Object.assign({}, baseArgs);
      delete args.sLocationCode;
      args.sPostalCode = zip;
      args.iCountry = 0;
      args.bMiles = true;

      siteLinkClient.SiteSearchByPostalCode(args, function(err, result, raw, header) {
        if(err) return reject(err);

        resolve(result);
      });
    });
  },
  insurance: (locationCode) => {
    let fileName = `insurance.${locationCode}.json`;
    if(process.env.IS_LOCAL) {
      return new Promise((resolve, reject) => {
        resolve(soapUtils.readJsonFromDisk(fileName))
      });
    }

    return new Promise((resolve, reject) => {

      let args = Object.assign({}, baseArgs, { 'sLocationCode': locationCode });

      siteLinkClient.InsuranceCoverageRetrieve(args, function(err, result, raw, header) {
        if(err) return reject(err);

        if(process.env.NODE_ENV === 'devo') {
          soapUtils.writeToDisk(result, fileName);
        }

        resolve(result);
      });
    });
  },
  moveInCostRetrieveWithDiscount: (params) => {
    return new Promise((resolve, reject) => {
      let methodArgs = {
        sCorpCode: '',
        sLocationCode: '',
        sCorpUserName: '',
        sCorpPassword: '',
        iUnitID: '',
        dMoveInDate: '',
        InsuranceCoverageID: '-999',
        ConcessionPlanID: '-999'
      };

      let args = Object.assign({}, methodArgs, baseArgs, params);

      siteLinkClient.MoveInCostRetrieveWithDiscount(args, function(err, result, raw, header) {
        if(err) return reject(err);

        console.logger.debug('MoveInCostRetrieveWithDiscount');

        resolve(result);
      });
    });
  },
  moveIn: (params) => {
    return new Promise((resolve, reject) => {
      let methodArgs = {
        sCorpCode: '',
        sLocationCode: '',
        sCorpUserName: '',
        sCorpPassword: '',
        TenantID: '',
        sAccessCode: '',
        UnitID: '',
        dStartDate: '',
        dEndDate: '',
        dcPaymentAmount: '',
        iCreditCardType: '',
        sCreditCardNumber: '',
        sCreditCardCVV: '',
        dExpirationDate: '',
        sBillingName: '',
        sBillingAddress: '',
        sBillingZipCode: '',
        InsuranceCoverageID: '-999',
        ConcessionPlanID: '-999',
        iSource: 5,
        bUsePushRate: false,
        bTestMode: process.env.NODE_ENV !== 'prod'
      };

      let args = Object.assign({}, methodArgs, baseArgs, params);

      siteLinkClient.MoveInWithDiscount_v2(args, function(err, result, raw, header) {
        if(err) return reject(err);

        console.logger.debug('MoveInWithDiscount_v2');

        resolve(result);
      });
    });
  },
  reserveNew: (params) => {
    let fileName = 'reserveNew.json';
    return new Promise((resolve, reject) => {
      let methodArgs = {
        sCorpCode: '',
        sLocationCode: '',
        sCorpUserName: '',
        sCorpPassword: '',
        sTenantId: '',
        sUnitID1: '',
        sUnitID2: '',
        sUnitID3: '',
        dNeeded: '',
        sComment: '',
        iSource: 5
      };

      let args = Object.assign({}, methodArgs, baseArgs, params);

      siteLinkClient.ReservationNewWithSource(args, function(err, result, raw, header) {
        if(err) return reject(err);

        console.logger.debug('ReservationNewWithSource');

        resolve(result);
      });
    });
  },
  siteInfo: (locationCode) => {
    let fileName = `siteInfo.${locationCode}.json`;
    if(process.env.IS_LOCAL) {
      return new Promise((resolve, reject) => {
        resolve(soapUtils.readJsonFromDisk(fileName))
      });
    }

    return new Promise((resolve, reject) => {
      let args = Object.assign({}, baseArgs, { 'sLocationCode': locationCode });
      siteLinkClient.SiteInformation(args, function(err, result, raw, header) {
        if(err) return reject(err);

        if(process.env.NODE_ENV === 'devo') {
          soapUtils.writeToDisk(result, fileName);
        }

        resolve(result);
      });
    });
  },
  tenantCredentialsUpdate: (params) => {
    return new Promise((resolve, reject) => {
      let args = Object.assign({}, baseArgs, params);

      siteLinkClient.TenantLoginAndSecurityUpdate(args, function(err, result, raw, header) {
        if(err) return reject(err);

        console.logger.debug('TenantLoginAndSecurityUpdate');

        resolve(result);
      });
    });
  },
  tenantList: (params) => {
    let fileName = 'tenantList.json';
    return new Promise((resolve, reject) => {
      let args = Object.assign({}, baseArgs, params);
      //delete args.sLocationCode; // committed

      siteLinkClient.TenantListDetailed_v2(args, function(err, result, raw, header) {
        if(err) return reject(err);

        console.logger.debug('TenantListDetailed_v2');

        resolve(result);
      });
    });
  },
  tenantLogin: (params) => {
    return new Promise((resolve, reject) => {
      if(
        !params.sTenantLogin
        || params.sTenantLogin.trim() == ''
        || !params.sTenantPassword
        || params.sTenantPassword.trim() == ''
      ) reject('Both Username and Password are required.');

      let args = Object.assign({}, baseArgs, params);

      siteLinkClient.TenantLogin(args, function(err, result, raw, header) {
        if(err) return reject(err);

        console.logger.debug('TenantLogin');

        resolve(result);
      });
    });
  },
  unitsInformation: (locationCode) => {
    let fileName = `unitsInformation.${locationCode}.json`;
    if(process.env.IS_LOCAL) {
      return new Promise((resolve, reject) => {
        resolve(soapUtils.readJsonFromDisk(fileName))
      });
    }

    return new Promise((resolve, reject) => {
      let args = Object.assign({}, baseArgs, { 'sLocationCode': locationCode });
      let date = new Date();
      date.setMonth(date.getMonth() - 2);
      args.lngLastTimePolled = soapUtils.getTicksFromTime(date);
      siteLinkClient.UnitsInformationAvailableUnitsOnly_v2(args, function(err, result) {
        if(err) return reject(err);

        if(process.env.NODE_ENV === 'devo') {
          soapUtils.writeToDisk(result, fileName);
        }

        return resolve(result);
      });
    });
  },
  unitTypePriceList: (locationCode) => {
    let fileName = `unitTypePriceList.${locationCode}.json`;
    if(process.env.IS_LOCAL) {
      return new Promise((resolve, reject) => {
        resolve(soapUtils.readJsonFromDisk(fileName))
      });
    }

    return new Promise((resolve, reject) => {
      let args = Object.assign({}, baseArgs, { 'sLocationCode': locationCode });
      siteLinkClient.UnitTypePriceList_v2(args, function(err, result, raw, header) {
        if(err) return reject(err);

        if(process.env.NODE_ENV === 'devo') {
          soapUtils.writeToDisk(result, fileName);
        }

        resolve(result);
      });
    });
  },
  updateTenant: (params) => {
    let fileName = 'updateTenant.json';
    let args = Object.assign({}, baseArgs, params);
//    delete args.sLocationCode;

    return siteLinkClient.TenantUpdate(args, function(err, result, raw, header) {
      if(err) console.logger.error(err);
      cb(err, result);
    });
  },
}

module.exports = soapCalls;
