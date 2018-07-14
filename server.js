if(!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'prod';
}

if(process.env.NODE_ENV === 'devo') {
  process.env.DEBUG = 'store-space*';
} else if(process.env.NODE_ENV === 'test') {
  process.env.DEBUG = 'store-space:debug*,store-space:error*';
} else {
  //process.env.DEBUG = 'store-space:error*';
  process.env.DEBUG = 'store-space*'; // TWP Testing
}

process.env.DEBUG_COLORS = 'true';

let config = require('./config/config');
let express = require('express');
let fs = require('fs');
let path = require('path');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let expressSession = require('express-session');
let DynamoDBSessionStore = require('connect-dynamodb')({session: expressSession});
let flash = require('req-flash');
let compress = require('compression');
let vash = require('vash');
let passport = require('passport');
// let csrf = require('csurf');

let app = express();

app.all(['/health', '/ping'], (req, res) => {
  return res.json({ success: true, message: new Date().getTime() });
});

global.appRoot = path.resolve(__dirname);

app.use(express.static('public'));

app.set('views', './views');
app.set('view engine', 'vash');

config.session.client = new (require('./controllers/aws/base')()).DynamoDB;

app.set('trust proxy', 1);
app.use(
  expressSession({
    name: 'ecapserots',
    store: new DynamoDBSessionStore(config.session),
    secret: 'rUCOpunCCQck5Mjy3ufxmBX7FJByMgVS',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours in ms
    }
  }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(flash());
// app.use(csrf({ cookie: true }));
app.use(compress());

app.set('config', config);

app.use(passport.initialize())
app.use(passport.session())

// polyfills
require('./public/scripts/polyfills/json');

// helpers
require('./helpers')(app);

// middleware
require('./middleware')(app);

// routes
require('./routes')(app, express);

// views
vash.helpers.staticFilePath = config.staticFilePath;
vash.helpers.assetVersions = require('./config/assetVersions');

// compile partials
require('./views')();

// run startup tasks
app.soap = require('./controllers/soap');

app.discounts = {};
app.forms = {};
app.insurance = {};
app.leaseESign = {}
app.locationCodes = [];
app.locations = {};
app.maps = {
  siteIdToLocationCode: {},
  locationCodeToSiteId: {},
};
app.sites = {};
app.units = {};
app.unitGroups = {};
app.unitTypePriceList = {};

app.lastRun = {
  locationCodes: 0,
  siteInfo: 0,
  discounts: 0,
  forms: 0,
  insurance: 0,
  unitTypePriceList: 0,
  unitInfo: 0
}
require('./controllers/startup').init(app);

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.logger.debug(error);
});

app.listen(config.httpPort, (error) => {
  if (error) {
    console.logger.error(error);
  } else {
    app.set('http_port', config.httpPort);
    console.logger.debug(`HTTP listening on port ${config.httpPort}`);
    console.logger.debug(`Running in ${process.env.NODE_ENV || 'dev'} mode`);
  }
});

// https settings (dev only)
if (config.httpsPort) {
  let https = require('https');
  let options = {
    key: fs.readFileSync('./cert/private.key'),
    cert: fs.readFileSync('./cert/certificate.pem')
  };

  https.createServer(options, app).listen(config.httpsPort);
  app.set('https_port', config.httpsPort);

  console.logger.debug(`HTTPS listening on port ${config.httpsPort}`);
}
