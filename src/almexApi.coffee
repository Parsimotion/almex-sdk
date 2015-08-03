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
  constructor: (@credentials, @url = "http://38.124.173.74:8989/CkIntegracionGeneral") ->
    @requests =
      createOutputBean:
        endpoint: "CkWService"
        xml: @_auth read "#{__dirname}/resources/createOutputBean.xml", "utf-8"
      stocks:
        endpoint: "Jobs"
        xml: @_auth read "#{__dirname}/resources/stocks.xml", "utf-8"

    @ordersAdapter = new AlmexOrdersAdapter()

  ###
  Get all the stocks.
  ###
  getStocks: (id) =>
    xml = new XmlBuilder(@requests.stocks).buildWith id: id
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
    outputBean = @ordersAdapter.getOutputBean order
    request = @requests.createOutputBean

    adapt = (xml) => new XmlBuilder(xml).buildWith outputBean
    if options.log? then console.log adapt request.xml
    @_doRequest(request, adapt).spread (response) =>
      xml2js.parseStringAsync(response.body).then (xml) =>
        statusCode = @_getResult(xml, "requestOutputBean")[0]._

        if statusCode isnt "OK"
          throw new Error JSON.stringify xml

  _doRequest: (request, adapt = (i) => i) =>
    params =
      url: "#{@url}/#{request.endpoint}"
      body: adapt request.xml
      headers: "Content-Type": "text/xml"
    req.postAsync params

  _auth: (xml) =>
    new XmlBuilder(xml).buildWith
      username: process.env.IBUSHAK_USERNAME
      password: process.env.IBUSHAK_PASSWORD
      accountId: process.env.IBUSHAK_ACCOUNT

  _getResult: (xml, method) =>
    result = try xml["S:Envelope"]["S:Body"][0]["ns2:#{method}Response"][0].return
    if not result?
      # this should never happen
      throw new Error "Los web services de la vida, no son lo que yo esperaba, no son lo que yo creía, no son lo que imaginaba..."
    result
