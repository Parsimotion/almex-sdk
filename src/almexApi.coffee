Promise = require("bluebird")
req = Promise.promisifyAll require("request")
xml2js = Promise.promisifyAll require("xml2js")
read = (require "fs").readFileSync

XmlBuilder = require("./xmlBuilder")
AlmexOrdersAdapter = require("./almexOrdersAdapter")
AlmexInboundsAdapter = require("./almexInboundsAdapter")
_ = require("lodash")

almexBaseUrl = process.env.ALMEX_BASE_URL or "http://201.157.61.34:8989"

module.exports =
#---

# Almex Web Services.
#   credentials = { username, password, accountId }
class AlmexApi
  constructor: (@credentials, @url = "#{almexBaseUrl}/CkIntegracionGeneral") ->
    auth = (xml) => new XmlBuilder(xml).buildWith @credentials

    @requests = _.mapValues {
      createInputBean: endpoint: "CkWService"
      createOutputBean: endpoint: "CkWService"
      stocks: endpoint: "Jobs"
      getPickingsAndChangeStatus: endpoint: "Jobs"
      getIncomes: endpoint: "Jobs"
    }, (val, name) => _.assign val, xml:
      auth read "#{__dirname}/resources/#{name}.xml", "utf-8"

    @ordersAdapter = new AlmexOrdersAdapter()
    @inboundsAdapter = new AlmexInboundsAdapter()

  ###
  Get all the stocks.
  ###
  getStocks: =>
    @_doRequest(@requests.stocks).then (xml) =>
      stocks = @_getResult xml, "ProductoInventarioMethod"

      stocks.map (it) =>
        _.assign it,
          identifier: it.productoSku[0]
          name: it.descripcion[0]
          stock: it.cantidadInventario[0]
          availableQuantity: it.cantidad[0]

  ###
  Retrieves all the enqueued incomes, and deletes them.
  ###
  getIncomes: =>
    @_doRequest(@requests.getIncomes).then (xml) =>
      incomes = @_getResult xml, "updateIncomes"

      incomes.map (income) =>
        inbound_id: incomes.idOdc
        received_quantity: incomes.cantidad
        sku: incomes.idWb

  getPickingsAndChangeStatus: =>
    @_doRequest(@requests.getPickingsAndChangeStatus).then (xml) =>
      pickings = @_getResult xml, "changeOutcomeStatus"

      pickings.map (it) =>
        order_id: it.idPedido[0]
        product_id: it.idSku[0]
        serial_number: it.serie[0]

  ###
  Create an output bean.
    options = { log: false }
  ###
  createOutputBean: (order, options = {}) =>
    outputBeanXml = @adaptSalesOrder order
    request = @requests.createOutputBean

    if options.log? then console.log outputBeanXml
    @_doRequest(request, => outputBeanXml).then (xml) =>
      statusCode = @_getResult(xml, "requestOutputBean")[0]._

      if statusCode isnt "OK"
        throw new Error JSON.stringify xml
      xml

  ###
  Create an input bean
  inbound = {
    id: Number
    date: Date
    products: [
      id: String
      quantity: Number
      description: String
      (barcode: String) # optional
    ]
  }
  options = { log: false }
  ###
  createInputBean: (inbound, options = {}) =>
    inputBeanXml = @adaptPurchaseOrder inbound
    request = @requests.createInputBean

    if options.log? then console.log inputBeanXml
    @_doRequest(request, => inputBeanXml).then (xml) =>
      statusCode = @_getResult(xml, "requestInputBean")[0]._

      if statusCode isnt "OK"
        throw new Error JSON.stringify xml
      xml

  ###
  Get the xml of a sales order.
  ###
  adaptSalesOrder: (order) =>
    outputBean = @ordersAdapter.getOutputBean order
    new XmlBuilder(@requests.createOutputBean.xml).buildWith outputBean

  ###
  Get the xml of a purchase order.
  ###
  adaptPurchaseOrder: (inbound) =>
    inputBean = @inboundsAdapter.getInputBean inbound
    new XmlBuilder(@requests.createInputBean.xml).buildWith inputBean

  _doRequest: (request, adapt = (i) => i) =>
    params =
      url: "#{@url}/#{request.endpoint}"
      body: adapt request.xml
      headers: "Content-Type": "text/xml"

    req.postAsync(params).spread (response) =>
      xml2js.parseStringAsync response.body

  _getResult: (xml, method) =>
    result = try xml["S:Envelope"]["S:Body"][0]["ns2:#{method}Response"][0].return
    if not result?
      # this should never happen
      throw new Error "Los web services de la vida, no son lo que yo esperaba, no son lo que yo creía, no son lo que imaginaba...\n" + JSON.stringify xml
    result
