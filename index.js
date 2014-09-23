'use strict';

var gutil = require('gulp-util'),
  through = require('through2'),
  readlineSync = require('readline-sync'),
  RE_CTRL_CHAR = /\x1B\[\d+m/,
  HL_IN = '\x1B[1m', HL_OUT = '\x1B[22m';

// Wrap handler
function callHandler(handler, argsArray) {
  try {
    return {val: handler.apply(null, argsArray)};
  } catch (e) {
    return {err: e};
  }
}

function hl(text) {
  text = '' + text;
  return RE_CTRL_CHAR.test(text) ? text : HL_IN + text + HL_OUT;
}

function Confirm(options) {
  var that = this;
  that.options = options;
  that.stream = through.obj(function() { that.transform.apply(that, arguments); });
}

Confirm.prototype.transform = function(file, encoding, callback) {
  var question, answer, res;
  if (typeof this.continue !== 'boolean') {
    if (typeof this.options.question === 'function') {
      res = callHandler(this.options.question);
      if (res.err) {
        console.error('"question" failed.');
        return callback(new gutil.PluginError('gulp-confirm', res.err));
      }
      question = res.val;
    } else {
      question = this.options.question;
    }

    if (question) {
      process.stdin.pause();
      answer = readlineSync.question(hl(question + ' :'));
      // process.stdin.resume();
      if (typeof this.options.continue === 'function') {
        res = callHandler(this.options.continue, [answer]);
        if (res.err) {
          console.error('"continue" failed.');
          return callback(new gutil.PluginError('gulp-confirm', res.err));
        }
        this.continue = !!res.val;
      } else {
        this.continue = !!this.options.continue;
      }
      if (!this.continue) { gutil.log(hl('Tasks are aborted.')); }
    }
  }

  callback(null, this.continue ? file : null);
};

module.exports = function(options) { return (new Confirm(options)).stream; };
