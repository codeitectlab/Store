let config = require('../config/config');

let baseModel = (req) => {
  let locations = []

  Object.values(req.app.locations).forEach((l) => {
    if(l.iframeUrl) {
      let address = [l.sSiteAddr1];
      if(l.sSiteAddr2) address.push(l.sSiteAddr2);
      address.push(l.sSiteCity);
      address.push(`${l.sSiteRegion} ${l.sSitePostalCode}`);

      locations.push({
        iframeUrl: l.iframeUrl,
        state: req.app.states.byCode[l.sSiteRegion].name,
        location: `${l.sSiteCity}, ${l.sSiteRegion}`,
        address: address.join(', ')
      });
    }
  })

  locations.sort(function(a, b){
    if(`${a.state} ${a.location}` < `${b.state} ${b.location}`) return -1;
    if(`${a.state} ${a.location}` > `${b.state} ${b.location}`) return 1;
    return 0;
  });

  return {
    metaKeywords: "",
    metaDescription: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    ogUrl: "",
    pageTitle: "Store Space",
    body: [],
    disableHeader: false,
    disableFooter: false,
    includeGA: config.includeGA,
    includeConversionGA: false,
    locations: locations
  };
}

module.exports = baseModel;
