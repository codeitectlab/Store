let config = require('../../config/config');

let cache = (function() {
  let instance;

  function init() {
    let generalCache = new Map();

    // doubly-linked list
    let head = {
      newer: null,
      older: null,
      timestamp: null,
      data: null
    };

    // doubly-linked list
    let tail = {
      newer: null,
      older: head,
      timestamp: null,
      data: null
    };
    head.newer = tail;

    return {
      self: this,
      ttl: config.aws.cache.ttl,
      size: function() {
        return generalCache.size;
      },
      putItem: function(item) {
        let newest = tail.older;
        tail.older = item;
        item.older = newest;
        
        newest.newer = item;
        item.newer = tail;
        item.timestamp = new Date().getTime();
      },
      put: function(key, value) {
        let item = {
          newer: null,
          older: null,
          // uncomment line below to change to access order cache
          // timestamp: new Date().getTime(),
          id: key,
          data: value
        };
        generalCache.set(key, item);
        this.putItem(item);
      },
      get: function(key) {
        this.purgeExpired();
        let item = generalCache.get(key);
        if (item) {
          // uncomment line below to change to access order cache
          // this.makeNewest(item);
          return item.data;
        }
        return null;
      },
      purgeExpired: function() {
        while (this.isNotHeadOrTail(head.newer) && this.hasExpired(head.newer.timestamp)) {
          let toBePurged = head.newer;
          generalCache.delete(toBePurged.id);
          let older = toBePurged.older;
          let newer = toBePurged.newer;
          older.newer = newer;
          newer.older = older;
          toBePurged = null;
        }
      },
      makeNewest: function(item) {
        if (item.older.older) {
          let older = item.older;
          let newer = item.newer;
          older.newer = newer;
          newer.older = older;

          this.putItem(item);
        } else {
          item.timestamp = new Date().getTime;
        }
      },
      hasExpired: function(timestamp) {
        return timestamp && (new Date().getTime() - timestamp > this.ttl);
      },
      isNotHeadOrTail: function(item) {
        return item.newer && item.older;
      },
      log: function(item) {
        console.log('item={');
        for (var key in item) {
          if (key !== 'data') {
            console.log(`${key}:${item[key]}`);
          }
        }
        console.log('}');
      }
    };
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = init();
      }

      return instance;
    }
  };
})();

module.exports = cache.getInstance();