Promise = require("bluebird")
req = Promise.promisifyAll require("request")
xml2js = Promise.promisifyAll require("xml2js")
read = (require "fs").readFileSync

XmlBuilder = require("./xmlBuilder")
AlmexOrdersAdapter = require("./almexOrdersAdapter")
AlmexInboundsAdapter = require("./almexInboundsAdapter")
_ = require("lodash")
Logger = require("./logger")

almexWsUrl = process.env.ALMEX_WS_URL or "http://138.128.190.226:8085/CkIntegracionGeneral"

module.exports =
#---

# Almex Web Services.
#   credentials = { username, password, accountId }
class AlmexApi
  constructor: (@credentials, @url = almexWsUrl, loggerOptions) ->
    auth = (xml) => new XmlBuilder(xml).buildWith @credentials

    @requests = _.mapValues {
      createInputBean: endpoint: "CkWService"
      createOutputBean: endpoint: "CkWService"
      requestCancelarOutput: endpoint: "CkWService"
      stocks: endpoint: "Jobs"
      stocksCalidad: endpoint: "Jobs"
      stocksPaginated: endpoint: "Jobs"
      getPickingsAndChangeStatus: endpoint: "Jobs"
      getIncomes: endpoint: "Jobs"
      updateIncomesNoUpd: endpoint: "Jobs"
      updateIncomesNoUpdCpy: endpoint: "Jobs"
      confirmacionOc: endpoint: "Jobs"
      confirmacionOcCpy: endpoint: "Jobs"
      getIncomesCancelados: endpoint: "Jobs"
      generateExtraOutcome: endpoint: "Jobs"
      asignaFactura: endpoint: "Jobs"
      traspasosCambioCalidad: endpoint: "Jobs"
    }, (val, name) =>
      _.assign val,
        xml:
          auth read "#{__dirname}/resources/#{name}.xml", "utf-8"
        name: name

    @ordersAdapter = new AlmexOrdersAdapter()
    @inboundsAdapter = new AlmexInboundsAdapter()
    @logger = new Logger(loggerOptions, @requests)

  ###
  Get the stocks for the given skus.
  ###
  getStocks: (skus) =>
    @_doRequest(@requests.stocks, => @adaptSkus skus, @requests.stocks).then (xml) =>
      stocks = @_getResult xml, "ProductoInventarioMethod"

      stocks
      .filter((it) -> it.descripcion != "No existe ningun registro con la orden especificada")
      .map (it) =>
        _.assign it,
          identifier: it.productoSku?[0]
          name: it.descripcion[0]
          stock: parseInt(it.cantidadInventario?[0] or 0) + parseInt(it.cantidadSurtida?[0] or 0)
          availableQuantity: it.cantidad[0]
  ###
  Get the stocks for the given skus.
  ###
  getStocksCalidad: (skus) =>
    @_doRequest(@requests.stocksCalidad, => @adaptSkus skus, @requests.stocksCalidad).then (xml) =>
      stocks = @_getResult xml, "ProductoInventarioMethodEdoCal"

      stocks
      .filter((it) -> it.descripcion != "No existe ningun registro con la orden especificada")
      .map (product) =>
        findByCalidad = (edo) -> _.find(product.calidad, (it) -> it.edo[0] is edo)?.cantidad[0]
        reserved = parseInt(product.cantidadSurtir?[0] or 0) + parseInt(product.cantidadSurtida?[0] or 0)
        _.assign product,
          identifier: product.productoSku?[0]
          name: product.descripcion[0]
          stock: parseInt(findByCalidad("A") or 0) + reserved
          reserved: reserved
          quarantine_stock: parseInt(findByCalidad("Q") or 0)
          damaged_stock: parseInt(findByCalidad("D") or 0)

  ###
  Get the stocks for the given skus.
  ###
  getStocksPaginated: (page = 1, top = 100) =>
    paginationXml = @adaptStocksPagination page, top
    @_doRequest(@requests.stocksPaginated, => paginationXml).then (xml) =>
      pagination = @_getResult(xml, "ProductoInventarioPaginacionMethod")[0]
      {
        top: parseInt pagination.cantidadFilas[0]
        page: parseInt pagination.paginaActual[0]
        pageCount: parseInt pagination.paginasTotales[0]
        results: pagination.productos.map (it) ->
          identifier: it.productoSku?[0]
          name: it.descripcion[0]
          stock: it.cantidadInventario[0]
          availableQuantity: it.cantidad[0]
      }

  ###
  Retrieves all the enqueued incomes, and deletes them.
  ###
  getIncomes: =>
    @_doRequest(@requests.getIncomes).then (xml) =>
      incomes = (try @_getResult xml, "updateIncomes") || []

      incomes.map (income) =>
        inbound_id: parseInt income.idOdc[0]
        received_quantity: parseInt income.cantidad[0]
        product: parseInt income.idWb[0]

  updateIncomesNoUpd: =>
    @_updateIncomesNoUpd "updateIncomesNoUpd"

  updateIncomesNoUpdCpy: =>
    @_updateIncomesNoUpd "updateIncomesNoUpdCpy"

  _updateIncomesNoUpd: (method) =>
    @_doRequest(@requests[method]).then (xml) =>
      incomes = (try @_getResult xml, method) || []

      incomes.map (income) =>
        id_parcial: income.idParcial[0]
        inbound_id: parseInt income.idOdc[0]
        received_quantity: parseInt income.cantidad[0]
        product: parseInt income.idWb[0]
        reg_id: parseInt income.regId[0]
        estado_calidad: income.estadoCalidad[0]

  confirmacionOc: (inboundId, idParcial) =>
    @_confirmacionOc inboundId, idParcial, "confirmacionOc"

  confirmacionOcCpy: (inboundId, idParcial) =>
    @_confirmacionOc inboundId, idParcial, "confirmacionOcCpy"

  _confirmacionOc: (inboundId, idParcial, method) =>
    confirmacionOcXml = @adaptConfirmacionOc inboundId, idParcial, method
    request = @requests[method]

    @_doRequest(request, => confirmacionOcXml).then (xml) =>
      statusCode = @_getResult(xml, method)[0]._

      if statusCode.indexOf("OK") == -1
        throw new Error JSON.stringify xml
      xml

  getIncomesFromCancellations: =>
    @_doRequest(@requests.getIncomesCancelados).then (xml) =>
      incomes = (try @_getResult xml, "updateIncomesCancelados") || []

      incomes.map (income) =>
        order_id: parseInt income.idOdc[0]
        cantidad: parseInt income.cantidad[0]
        product: parseInt income.idWb[0]

  getPickingsAndChangeStatus: =>
    @_doRequest(@requests.getPickingsAndChangeStatus).then (xml) =>
      pickings = @_getResult xml, "changeOutcomeStatus"

      pickings.map (it) =>
        order_id: it.idPedido[0]
        product_id: it.idSku[0]
        serial_number: it.serie[0]

  getExtraOutcomes: =>
    @_doRequest(@requests.generateExtraOutcome).then (xml) =>
      outcomes = @_getResult xml, "generateExtraOutcome"
      outcomes.map (it) =>
        quantity: it.cantidad[0]
        product: it.productoSku[0]

  getInboundsToBeProcessed: =>
    @_doRequest(@requests.asignaFactura).then (xml) =>
      inbounds = @_getResult xml, "asignaFactura"

      inbounds.map (it) =>
        id: it.idodc[0]

  getTraspasosCambioCalidad: =>
    @_doRequest(@requests.traspasosCambioCalidad).then (xml) =>
      traspasos = @_getResult xml, "traspasosCambioCalidad"
      traspasos.map (it) ->
        reg_id: it.regId[0] 
        estado_calidad_origen: it.edoCalidadOrigen[0]
        estado_calidad_destino: it.estadoCalidadDestino[0]
        inbound_id: it.idodc[0]
        product: it.sku[0]

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
      message = @_getResult(xml, "requestInputBean")[0]._

      return xml if message is "OK" or message is "ERROR,  BR-005 idOc enviada anteriormente"
      throw new Error JSON.stringify xml

  cancelOutputBean: (order) =>
    cancelOutputXml = @adaptCancelOrder order
    request = @requests.requestCancelarOutput

    @_doRequest(request, => cancelOutputXml).then (xml) =>
      message = @_getResult(xml, "requestCancelarOutput")[0]._

      return message if message is "OK" or message is "pedido cancelado exitosamente" or message is "Pedido marcado para cancelar, esperar ingreso de mercancia"

      throw new Error if _.isEmpty message then JSON.stringify xml  else message

  adaptSkus: (skusToRetrieve, request) =>
    params = skus: skusToRetrieve.map((sku) -> "<sku>#{sku}</sku>").join("")
    new XmlBuilder(request.xml).buildWith params

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

  adaptCancelOrder: (order) =>
    new XmlBuilder(@requests.requestCancelarOutput.xml).buildWith order

  adaptStocksPagination: (page, top) ->
    new XmlBuilder(@requests.stocksPaginated.xml).buildWith { page, top }

  adaptConfirmacionOc: (inboundId, idParcial, method) ->
    new XmlBuilder(@requests[method].xml).buildWith { inboundId, idParcial }

  _doRequest: (request, adapt = (i) => i) =>
    xml = adapt request.xml

    params =
      url: "#{@url}/#{request.endpoint}"
      body: xml
      headers: "Content-Type": "text/xml"

    req.postAsync(params).spread (response) =>
      @logger.info request.name, xml, response.statusCode, response.body
      throw new Error "server_error" if response.statusCode >= 500
      xml2js.parseStringAsync response.body

  _getResult: (xml, method) =>
    result = try xml["S:Envelope"]["S:Body"][0]["ns2:#{method}Response"][0].return
    if not result?
      # this should never happen
      throw new Error "Los web services de la vida, no son lo que yo esperaba, no son lo que yo creía, no son lo que imaginaba...\n" + JSON.stringify xml
    result
