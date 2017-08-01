(function() {
  var Logger, moment, winston, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  winston = require('winston');

  require("winston-azure-blob-transport");

  _ = require('lodash');

  moment = require('moment');

  Logger = (function() {
    function Logger(options, requests) {
      this.options = options != null ? options : {};
      this.info = __bind(this.info, this);
      this._buildLogger = __bind(this._buildLogger, this);
      this.loggers = {};
      _.keys(requests).forEach((function(_this) {
        return function(name) {
          return _this.loggers[name] = _this._buildLogger(name, _this.options);
        };
      })(this));
    }

    Logger.prototype._buildLogger = function(name, options) {
      var accountKey, accountName, build, transports, _ref;
      accountName = options.accountName, accountKey = options.accountKey;
      build = {
        azure: function() {
          var transport;
          transport = new winston.transports.AzureBlob({
            account: {
              name: accountName,
              key: accountKey
            },
            containerName: name.toLowerCase(),
            nameResolver: {
              getBlobName: function() {
                return "" + (moment().format('YYYYMMDDHH')) + ".log";
              }
            }
          });
          transport.initialize();
          return transport;
        },
        console: function() {
          return new winston.transports.Console;
        }
      };
      transports = (_ref = this.options[name]) != null ? _ref.map(function(transportName) {
        return build[transportName]();
      }) : void 0;
      return new winston.Logger({
        level: "info",
        transports: transports || []
      });
    };

    Logger.prototype.info = function(name, request, statusCode, response) {
      return this.loggers[name].info(new Date().toISOString(), request, statusCode, response);
    };

    return Logger;

  })();

  module.exports = Logger;

}).call(this);
