let env = process.env.NODE_ENV || 'prod';
let config = {
  global: {
    cookieDomain: '.storespace.com',
    env: env,
    s3: {
      bucket: 'store-space-website',
      keyPrefix: 'assets/website/'
    },
  },
  devo: {
    api: {
      corporateCode: 'CTDU',
      locationCode: 'LTRAIN',
      key: 'STORAGECAPMGMT6W82JM',
      user: 'Codeitectdev',
      pass: 'prdahZqiLfXWW8Cmarm4hCkE'
    },
    apiCache: {
      enabled: true,
      ttl: 30 * 1000 // 30 seconds in milliseconds
    },
    aws: {
      cache: {
        enabled: true,
        ttl: 30 * 1000 // 30 seconds in milliseconds
      },
      cryptoKey: '29GhVwn3238923',
      access: '811d268d9d25f6b06f93d13d65bd0538f0856665e8b7de1daa556862f1dac363',
      secret: 'f82c30a836188843b56de6e458d133268df7f7a125a0b6503300328b9b3347a04bd351abdc23b61f299ee7e8e2d53169',
      region: 'us-east-2',
      stage: 'prod'
    },
    includeGA: false,
    isLocal: true,
    host: 'honnatti.storespace.com:8443',
    httpPort: process.env.PORT || 8081,
    httpsPort: 8443,
    session: {
      cookieTTL: 60 * 1000, // 1 min
      table: 'storespace-sessions',
    },
    siteLink: {
      locationCodes: [
        'Demo'
      ],
      frequency: {
        locationCodes: 30 * 60 * 1000, // every 30 mins
        siteInfo: 30 * 60 * 1000,  // every 30 mins
        forms: 30 * 60 * 1000,  // every 30 mins
        insurance: 30 * 60 * 1000,  // every 30 mins
        availableUnits: 2 * 60 * 1000, // every 2 mins
        discounts: 2 * 60 * 1000, // every 2 mins
        unitInfo: 2 * 60 * 1000, // every 2 mins
        unitTypePriceList: 2 * 60 * 1000 // every 2 mins
      }
    },
    staticFilePath: ''
  },
  test: {
    api: {
      corporateCode: 'CTDU',
      locationCode: 'LTRAIN',
      key: 'STORAGECAPMGMT6W82JM',
      user: 'Codeitectdev',
      pass: 'prdahZqiLfXWW8Cmarm4hCkE'
    },
    apiCache: {
      enabled: true,
      ttl: 2 * 60 * 1000 // 2 minutes in milliseconds
    },
    aws: {
      cache: {
        enabled: true
      },
      cryptoKey: '29GhVwn3238923',
      access: '811d268d9d25f6b06f93d13d65bd0538f0856665e8b7de1daa556862f1dac363',
      secret: 'f82c30a836188843b56de6e458d133268df7f7a125a0b6503300328b9b3347a04bd351abdc23b61f299ee7e8e2d53169',
      region: 'us-east-2',
      stage: 'prod'
    },
    includeGA: false,
    host: 'test.storespace.com',
    httpPort: process.env.PORT || 8081,
    session: {
      cookieTTL: 2 * 60 * 60 * 1000, // 2 hours
      table: 'storespace-sessions',
    },
    siteLink: {
      locationCodes: [
        'Demo'
      ],
      frequency: {
        locationCodes: 4 * 12 * 60 * 60 * 1000,  // every 12 hours
        siteInfo: 4 * 12 * 60 * 60 * 1000,  // every 12 hours
        forms: 4 * 12 * 60 * 60 * 1000,  // every 12 hours
        insurance: 4 * 12 * 60 * 60 * 1000,  // every 12 hours
        unitInfo: 60 * 60 * 1000, // every 1 hour
        availableUnits: 4 * 15 * 60 * 1000, // every 15 mins
        discounts: 4 * 1 * 60 * 60 * 1000, // every 4 hours
        unitTypePriceList: 60 * 60 * 1000 // every 1
      }
    },
//    staticFilePath: '//d8pnx8fvxl8v4.cloudfront.net'
    staticFilePath: '//d2qkkzpelj00zf.cloudfront.net'
  },
  prod: {
    api: {
      corporateCode: 'CTDU',
      locationCode: 'LTRAIN',
      key: 'STORAGECAPMGMT6W82JM',
      user: 'Codeitectdev',
      pass: 'prdahZqiLfXWW8Cmarm4hCkE'
    },
    apiCache: {
      enabled: true,
      ttl: 10 * 60 * 1000 // 10 minutes in milliseconds
    },
    aws: {
      cache: {
        enabled: true
      },
      cryptoKey: '29GhVwn3238923',
      access: '811d268d9d25f6b06f93d13d65bd0538f0856665e8b7de1daa556862f1dac363',
      secret: 'f82c30a836188843b56de6e458d133268df7f7a125a0b6503300328b9b3347a04bd351abdc23b61f299ee7e8e2d53169',
      region: 'us-east-2',
      stage: 'prod'
    },
    includeGA: true,
    isProd: true,
    host: 'storespace.com',
    httpPort: process.env.PORT || 8081,
    httpsPort: 8443,
    session: {
      cookieTTL: 18 * 60 * 60 * 1000, // 18 hours
      table: 'storespace-sessions',
    },
  siteLink: {
     /* locationCodes: [
        'L001'
      ],*/
      frequency: {
        locationCodes: 12 * 60 * 60 * 1000,  // every 12 hours
        siteInfo: 12 * 60 * 60 * 1000,  // every 12 hours
        forms: 12 * 60 * 60 * 1000,  // every 12 hours
        insurance: 12 * 60 * 60 * 1000,  // every 12 hours
        unitInfo: 30 * 60 * 1000, // every 15 mins
        availableUnits: 30 * 60 * 1000, // every 15 mins
        discounts: 1 * 60 * 60 * 1000, // every 1 hour
        unitTypePriceList: 15 * 60 * 1000 // every 1 hour
      }
    },
//    staticFilePath: '//d8pnx8fvxl8v4.cloudfront.net'
    staticFilePath: '//d2qkkzpelj00zf.cloudfront.net'
},
};

azuread = {
  // Required
//  identityMetadata: 'https://login.microsoftonline.com/<tenant_name>.onmicrosoft.com/v2.0/.well-known/openid-configuration',
  identityMetadata: 'https://login.microsoftonline.com/4c2460b4-2c74-4a26-a75c-31a7851e41f8/.well-known/openid-configuration',
  //
  // or you can use the common endpoint
  // 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration'
  // To use the common endpoint, you have to either turn `validateIssuer` off, or provide the `issuer` value.

  // Required, the client ID of your app in AAD
  clientID: 'bfe2830b-f336-4e04-a2b8-262bf7300658',

  // Required, must be 'code', 'code id_token', 'id_token code' or 'id_token'
  // If you want to get access_token, you must use 'code', 'code id_token' or 'id_token code'
  responseType: 'code id_token',

  // Required
  responseMode: 'form_post',

  // Required, the reply URL registered in AAD for your app
//  redirectUrl: 'https://honnatti.storespace.com:8443/nimda/auth/openid/return',
  redirectUri: '/nimda/auth/openid/return',

  // Required if we use http for redirectUrl
  allowHttpForRedirectUrl: false,

  // Required if `responseType` is 'code', 'id_token code' or 'code id_token'.
  // If app key contains '\', replace it with '\\'.
  clientSecret: 'ksggrI13*:$zcLRFNUT715(',

  // Required to set to false if you don't want to validate issuer
  validateIssuer: true,

  // Required to set to true if you are using B2C endpoint
  // This sample is for v1 endpoint only, so we set it to false
  isB2C: false,

  // Required if you want to provide the issuer(s) you want to validate instead of using the issuer from metadata
  // issuer could be a string or an array of strings of the following form: 'https://sts.windows.net/<tenant_guid>/v2.0'
  issuer: null,

  // Required to set to true if the `verify` function has 'req' as the first parameter
  passReqToCallback: false,

  // Recommended to set to true. By default we save state in express session, if this option is set to true, then
  // we encrypt state and save it in cookie instead. This option together with { session: false } allows your app
  // to be completely express session free.
  useCookieInsteadOfSession: true,

  // Required if `useCookieInsteadOfSession` is set to true. You can provide multiple set of key/iv pairs for key
  // rollover purpose. We always use the first set of key/iv pair to encrypt cookie, but we will try every set of
  // key/iv pair to decrypt cookie. Key can be any string of length 32, and iv can be any string of length 12.
  cookieEncryptionKeys: [
    { 'key': '12345678901234567890123456789012', 'iv': '123456789012' },
    { 'key': 'abcdefghijklmnopqrstuvwxyzabcdef', 'iv': 'abcdefghijkl' }
  ],

  // The additional scopes we want besides 'openid'.
  // 'profile' scope is required, the rest scopes are optional.
  // (1) if you want to receive refresh_token, use 'offline_access' scope
  // (2) if you want to get access_token for graph api, use the graph api url like 'https://graph.microsoft.com/mail.read'
  scope: ['profile'/*, 'offline_access', 'https://graph.microsoft.com/mail.read'*/],

  // Optional, 'error', 'warn' or 'info'
  loggingLevel: 'warn',

  // Optional. The lifetime of nonce in session or cookie, the default value is 3600 (seconds).
  nonceLifetime: 6 * 60 * 60, // 6 hours

  // Optional. The max amount of nonce saved in session or cookie, the default value is 10.
  nonceMaxAmount: 5,

  // Optional. The clock skew allowed in token validation, the default value is 300 seconds.
  clockSkew: 30,

// The url you need to go to destroy the session with AAD
destroySessionUrl: 'https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=',

// If you want to use the mongoDB session store for session middleware; otherwise we will use the default
// session store provided by express-session.
// Note that the default session store is designed for development purpose only.
useMongoDBSessionStore: false,
};

module.exports = Object.assign({}, config[env], config.global, { azuread: azuread});
