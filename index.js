#!/usr/bin/env phantomjs
/* globals phantom */
var system = require('system');
var webpage = require('webpage');
var minimist = require('./node_modules/minimist');

function cleanUrl(url) {
  return url.
    // remove protocol
    replace(/^https?/, '').
    // replace all sequences of non-word-characters (including dashes) with dashes
    replace(/\W+/g, '-').
    // remove leading/trailing non-word characters
    replace(/^\W+|\W+$/g, '');
}

function renderPage(url, width, height, autofit, filename, callback) {
  var page = webpage.create();
  page.viewportSize = {width: width, height: height};

  console.log('Opening url: ' + url);
  page.open(url, function(status) {
    if (status != 'success') {
      return callback(new Error('Page open status is "' + status + '"; it should be "success"'));
    }

    if (autofit) {
      var dims = page.evaluate(function() {
        return {width: document.width, height: document.height};
      });
      console.log('Fitting to document dimensions: ' + dims.width + 'x' + dims.height);
      page.viewportSize = dims;
    }

    console.log('Saving to: ' + filename);
    page.render(filename);
    callback();
  });
}

/** console.error prints the filename and line where the message originated,
so we use plain console.log in this and other cases.
*/
function printHelp() {
  console.log([
    "Usage: renderpage https://www.google.com/ [--filename google.png]",
    "",
    "Options:",
    "  --help        Print this help and exit",
    "  --verbose     Print minimist-parsed CLI arguments object",
    "  --width 800   Initial viewport width to use",
    "  --height 600  Initial viewport height to use",
    "  --autofit     Set viewport to DOM document's width and height",
    "",
  ].join('\n'));
}

function main(args) {
  var opts = minimist(args, {
    boolean: ['help', 'verbose', 'autofit'],
    default: {
      help: false,
      verbose: false,
      width: 800,
      height: 600,
      autofit: false,
    },
  });
  // opts._[0] is the executable's filename
  var url = opts._[1];

  function printOptions() {
    console.log('Using options: ' + JSON.stringify(opts, null, 2));
  }

  if (opts.help) {
    printHelp();
    printOptions();
    phantom.exit(1);
  }
  if (!url) {
    printHelp();
    printOptions();
    console.log('You must provide a url.');
    phantom.exit(1);
  }
  if (opts.verbose) {
    printOptions();
  }

  var filename = opts.filename || cleanUrl(url)  + '.png';
  renderPage(url, opts.width, opts.height, opts.autofit, filename, function(error) {
    if (error) {
      phantom.exit(1);
    }
    phantom.exit(0);
  });
}

main(system.args);
