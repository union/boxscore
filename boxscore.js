/*
 * Boxscore
 */
var dgram = require("dgram")
  , http = require("http")
  , util = require("util")
;

var STATS_PORT = 4060;
var REPORTS_PORT = 4061;

var stats = {};
var statsServer, reportServer;

var registerHit = function(wholeKey, num, ts) {
  console.log("hit: %j", {ts: ts, num: num, wholeKey: wholeKey});
  if (!wholeKey || !ts || isNaN(num) || isNaN(ts)) {
    return false;
  }
  var wholeKeyWords = wholeKey.split(/\./);
  var key;
  var ns = wholeKeyWords[0];
  if (wholeKeyWords.length == 1) {
    key = "_";
  } else {
    key = wholeKeyWords.slice(1).join(".");
  }
  if (!stats[ns]) {
    stats[ns] = [];
  }
  for (var i = 0; i < num; i++) {
    stats[ns].push([ts, key]);
  }
}

var dumpStats = function() {
  console.log(stats);
};

var emitMessages = function(msgs, rinfo) {
  msgs = msgs.toString().split(/\n/);
  for (var i = 0; i < msgs.length; i++) {
    if (msgs[i].length > 0) {
      emitMessage(msgs[i], rinfo);
    }
  }
}

/**
 * calculate top
 * @param ns namespace to analyze
 * @param cutoff most recent seconds
 */
var top = function(ns, cutoff) {
  var rankings = [];
  var list = [];
  var counts = {};
  if (!cutoff) {
    cutoff = 60*5; // 5 minutes
  }
  var cutoffTime = ((new Date()).getTime()/1000)-cutoff;
  if (stats[ns]) {
    list = stats[ns];
    for (var i = 0; i < list.length; i++) {
      var ts = list[i][0], key = list[i][1];
      if (ts > cutoffTime) {
        if (!counts[key]) {
          counts[key] = 1;
        } else {
          counts[key]++;
        }
      }
    }

    for (var key in counts) {
      rankings.push([counts[key], key]);
    }
    rankings.sort(function(a,b) { return b[0]-a[0]; });
  }

  return rankings;
}

var emitMessage = function(msg, rinfo) {
  console.log("msg: "+msg);
  var words = msg.split(/ /);

  var num = (words.length == 2) ? 1 : parseInt(words[1], 10);
  registerHit(words[0], num, parseInt(words[2],10));
};

var startBoxscore = function() {
  statsServer = dgram.createSocket("udp4");
  statsServer.on("message", function(msg, rinfo) {
    emitMessages(msg, rinfo);
  });
  statsServer.on("listening", function() {
    var address = statsServer.address();
    console.log("Boxscore scoring at " +
                address.address + ":" + address.port);
  });
  statsServer.bind(STATS_PORT);

  var reportServer = http.createServer(function(req, res) {
    var chunk = "";
    req.on("data", function(data) {
      chunk += data;
    });
    req.on("end", function() {
      var matches = req.url.match(/^\/top\/(.*)/);
      res.setHeader('content-type', 'application/json');
      if (matches) {
        var key = matches[1];
        var result = top(key);
        console.log(JSON.stringify(result));
        res.end(JSON.stringify(result));
      } else {
        res.end('{}');
      }
    });
  });
  reportServer.on("listening", function() {
    var address = reportServer.address();
    console.log("Boxscore reporting at " +
                address.address + ":" + address.port);
  });
  reportServer.listen(REPORTS_PORT);

};

if (process.argv.slice(1,2) == __filename) {
  startBoxscore();
}
