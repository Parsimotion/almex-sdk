winston = require('winston')
require "winston-azure-blob-transport"
_ = require('lodash')
moment = require('moment')

class Logger
  # options:
  #   requests: {
  #     createInputBean: ['azure']
  #     updateIncomesNoUpd: ['azure','console']
  #   }
  constructor: (@options = {}, requests) ->
    @loggers = {}
    _.keys(requests).forEach (name) =>
      @loggers[name] = @_buildLogger name, @options

  _buildLogger: (name, options) =>
    { accountName, accountKey } = options
    build =
      azure: -> 
        transport = new winston.transports.AzureBlob {
          account:
            name: accountName
            key: accountKey
          containerName: name.toLowerCase()
          nameResolver: getBlobName: -> "#{moment().format('YYYYMMDDHH')}.log"
        }
        transport.initialize()
        transport

      console: -> new winston.transports.Console

    transports = @options[name]?.map (transportName) -> build[transportName]()

    new winston.Logger
      level: "info"
      transports: transports or []

  info: (name, request, statusCode, response) =>
    @loggers[name].info new Date().toISOString(), request, statusCode, response

module.exports = Logger