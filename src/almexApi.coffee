Promise = require("bluebird")
req = Promise.promisifyAll require("request")
xml2js = Promise.promisifyAll require("xml2js")
read = (require "fs").readFileSync

XmlBuilder = require("./xmlBuilder")
AlmexOrdersAdapter = require("./almexOrdersAdapter")

module.exports =
#---

# Almex Web Services.
#   credentials = { username, password, accountId }
class AlmexApi
  constructor: (@credentials, @url = "http://201.157.61.34:8989/CkIntegracionGeneral") ->
    auth = (xml) => new XmlBuilder(xml).buildWith @credentials

    @requests =
      createOutputBean:
        endpoint: "CkWService"
        xml: auth read "#{__dirname}/resources/createOutputBean.xml", "utf-8"
      stocks:
        endpoint: "Jobs"
        xml: auth read "#{__dirname}/resources/stocks.xml", "utf-8"

    @ordersAdapter = new AlmexOrdersAdapter()

  ###
  Get all the stocks.
  ###
  getStocks: =>
    @_doRequest(@requests.stocks).spread (response) =>
      xml2js.parseStringAsync(response.body).then (xml) =>
        stocks = @_getResult xml, "ProductoInventarioMethod"

        stocks.map (it) =>
          identifier: it.productoSku[0]
          name: it.descripcion[0]
          stock: it.cantidadInventario[0]

  ###
  Create an output bean.
    options = { log: false }
  ###
  createOutputBean: (order, options = {}) =>
    outputBeanXml = @adaptSalesOrder order
    request = @requests.createOutputBean

    if options.log? then console.log outputBeanXml
    @_doRequest(request, => outputBeanXml).spread (response) =>
      xml2js.parseStringAsync(response.body).then (xml) =>
        statusCode = @_getResult(xml, "requestOutputBean")[0]._

        if statusCode isnt "OK"
          throw new Error JSON.stringify xml
        xml

  ###
  Get the xml of an order.
  ###
  adaptSalesOrder: (order) =>
    outputBean = @ordersAdapter.getOutputBean order
    new XmlBuilder(@requests.createOutputBean).buildWith outputBean

  _doRequest: (request, adapt = (i) => i) =>
    params =
      url: "#{@url}/#{request.endpoint}"
      body: adapt request.xml
      headers: "Content-Type": "text/xml"
    req.postAsync params

  _getResult: (xml, method) =>
    result = try xml["S:Envelope"]["S:Body"][0]["ns2:#{method}Response"][0].return
    if not result?
      # this should never happen
      throw new Error "Los web services de la vida, no son lo que yo esperaba, no son lo que yo creía, no son lo que imaginaba..."
    result
