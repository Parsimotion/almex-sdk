(function() {
  var AlmexApi, AlmexInboundsAdapter, AlmexOrdersAdapter, Logger, Promise, XmlBuilder, almexWsUrl, read, req, xml2js, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Promise = require("bluebird");

  req = Promise.promisifyAll(require("request"));

  xml2js = Promise.promisifyAll(require("xml2js"));

  read = (require("fs")).readFileSync;

  XmlBuilder = require("./xmlBuilder");

  AlmexOrdersAdapter = require("./almexOrdersAdapter");

  AlmexInboundsAdapter = require("./almexInboundsAdapter");

  _ = require("lodash");

  Logger = require("./logger");

  almexWsUrl = process.env.ALMEX_WS_URL || "http://138.128.190.226:8085/CkIntegracionGeneral";

  module.exports = AlmexApi = (function() {
    function AlmexApi(credentials, url, loggerOptions) {
      var auth;
      this.credentials = credentials;
      this.url = url != null ? url : almexWsUrl;
      this._getResult = __bind(this._getResult, this);
      this._doRequest = __bind(this._doRequest, this);
      this.adaptCancelOrder = __bind(this.adaptCancelOrder, this);
      this.adaptPurchaseOrder = __bind(this.adaptPurchaseOrder, this);
      this.adaptSalesOrder = __bind(this.adaptSalesOrder, this);
      this.adaptSkus = __bind(this.adaptSkus, this);
      this.cancelOutputBean = __bind(this.cancelOutputBean, this);
      this.createInputBean = __bind(this.createInputBean, this);
      this.createOutputBean = __bind(this.createOutputBean, this);
      this.getTraspasosCambioCalidad = __bind(this.getTraspasosCambioCalidad, this);
      this.getInboundsToBeProcessed = __bind(this.getInboundsToBeProcessed, this);
      this.getExtraOutcomes = __bind(this.getExtraOutcomes, this);
      this.getPickingsAndChangeStatus = __bind(this.getPickingsAndChangeStatus, this);
      this.getIncomesFromCancellations = __bind(this.getIncomesFromCancellations, this);
      this._confirmacionOc = __bind(this._confirmacionOc, this);
      this.confirmacionOcCpy = __bind(this.confirmacionOcCpy, this);
      this.confirmacionOc = __bind(this.confirmacionOc, this);
      this._updateIncomesNoUpd = __bind(this._updateIncomesNoUpd, this);
      this.updateIncomesNoUpdCpy = __bind(this.updateIncomesNoUpdCpy, this);
      this.updateIncomesNoUpd = __bind(this.updateIncomesNoUpd, this);
      this.getIncomes = __bind(this.getIncomes, this);
      this.getStocksPaginated = __bind(this.getStocksPaginated, this);
      this.getStocksCalidad = __bind(this.getStocksCalidad, this);
      this.getStocks = __bind(this.getStocks, this);
      auth = (function(_this) {
        return function(xml) {
          return new XmlBuilder(xml).buildWith(_this.credentials);
        };
      })(this);
      this.requests = _.mapValues({
        createOutputBeanZpl2: {
          endpoint: "CkWService"
        },
        createOutputBeanGuiaPdf: {
          endpoint: "CkWService"
        },
        createInputBean: {
          endpoint: "CkWService"
        },
        createOutputBean: {
          endpoint: "CkWService"
        },
        requestCancelarOutput: {
          endpoint: "CkWService"
        },
        stocks: {
          endpoint: "Jobs"
        },
        stocksCalidad: {
          endpoint: "Jobs"
        },
        stocksPaginated: {
          endpoint: "Jobs"
        },
        getPickingsAndChangeStatus: {
          endpoint: "Jobs"
        },
        getIncomes: {
          endpoint: "Jobs"
        },
        updateIncomesNoUpd: {
          endpoint: "Jobs"
        },
        updateIncomesNoUpdCpy: {
          endpoint: "Jobs"
        },
        confirmacionOc: {
          endpoint: "Jobs"
        },
        confirmacionOcCpy: {
          endpoint: "Jobs"
        },
        getIncomesCancelados: {
          endpoint: "Jobs"
        },
        generateExtraOutcome: {
          endpoint: "Jobs"
        },
        asignaFactura: {
          endpoint: "Jobs"
        },
        traspasosCambioCalidad: {
          endpoint: "Jobs"
        }
      }, (function(_this) {
        return function(val, name) {
          return _.assign(val, {
            xml: auth(read("" + __dirname + "/resources/" + name + ".xml", "utf-8")),
            name: name
          });
        };
      })(this));
      this.ordersAdapter = new AlmexOrdersAdapter();
      this.inboundsAdapter = new AlmexInboundsAdapter();
      this.logger = new Logger(loggerOptions, this.requests);
    }


    /*
    Get the stocks for the given skus.
     */

    AlmexApi.prototype.getStocks = function(skus) {
      return this._doRequest(this.requests.stocks, (function(_this) {
        return function() {
          return _this.adaptSkus(skus, _this.requests.stocks);
        };
      })(this)).then((function(_this) {
        return function(xml) {
          var stocks;
          stocks = _this._getResult(xml, "ProductoInventarioMethod");
          return stocks.filter(function(it) {
            return it.descripcion !== "No existe ningun registro con la orden especificada";
          }).map(function(it) {
            var _ref, _ref1, _ref2;
            return _.assign(it, {
              identifier: (_ref = it.productoSku) != null ? _ref[0] : void 0,
              name: it.descripcion[0],
              stock: parseInt(((_ref1 = it.cantidadInventario) != null ? _ref1[0] : void 0) || 0) + parseInt(((_ref2 = it.cantidadSurtida) != null ? _ref2[0] : void 0) || 0),
              availableQuantity: it.cantidad[0]
            });
          });
        };
      })(this));
    };


    /*
    Get the stocks for the given skus.
     */

    AlmexApi.prototype.getStocksCalidad = function(skus) {
      return this._doRequest(this.requests.stocksCalidad, (function(_this) {
        return function() {
          return _this.adaptSkus(skus, _this.requests.stocksCalidad);
        };
      })(this)).then((function(_this) {
        return function(xml) {
          var stocks;
          stocks = _this._getResult(xml, "ProductoInventarioMethodEdoCal");
          return stocks.filter(function(it) {
            return it.descripcion !== "No existe ningun registro con la orden especificada";
          }).map(function(product) {
            var findByCalidad, reserved, _ref, _ref1, _ref2;
            findByCalidad = function(edo) {
              var _ref;
              return parseInt(((_ref = _.find(product.calidad, function(it) {
                return it.edo[0] === edo;
              })) != null ? _ref.cantidad[0] : void 0) || 0);
            };
            reserved = parseInt(((_ref = product.cantidadSurtir) != null ? _ref[0] : void 0) || 0) + parseInt(((_ref1 = product.cantidadSurtida) != null ? _ref1[0] : void 0) || 0);
            return _.assign(product, {
              identifier: (_ref2 = product.productoSku) != null ? _ref2[0] : void 0,
              name: product.descripcion[0],
              stock: findByCalidad("A") + reserved,
              reserved: reserved,
              quarantine_stock: findByCalidad("Q"),
              damaged_stock: findByCalidad("D") + findByCalidad("DI") + findByCalidad("DO") + findByCalidad("NE")
            });
          });
        };
      })(this));
    };


    /*
    Get the stocks for the given skus.
     */

    AlmexApi.prototype.getStocksPaginated = function(page, top) {
      var paginationXml;
      if (page == null) {
        page = 1;
      }
      if (top == null) {
        top = 100;
      }
      paginationXml = this.adaptStocksPagination(page, top);
      return this._doRequest(this.requests.stocksPaginated, (function(_this) {
        return function() {
          return paginationXml;
        };
      })(this)).then((function(_this) {
        return function(xml) {
          var pagination;
          pagination = _this._getResult(xml, "ProductoInventarioPaginacionMethod")[0];
          return {
            top: parseInt(pagination.cantidadFilas[0]),
            page: parseInt(pagination.paginaActual[0]),
            pageCount: parseInt(pagination.paginasTotales[0]),
            results: pagination.productos.map(function(it) {
              var _ref, _ref1;
              return {
                identifier: (_ref = it.productoSku) != null ? _ref[0] : void 0,
                name: it.descripcion[0],
                stock: it.cantidadInventario[0],
                availableQuantity: it.cantidad[0],
                edoCalidad: ((_ref1 = it.edoCalidad) != null ? _ref1[0] : void 0) || "A"
              };
            })
          };
        };
      })(this));
    };


    /*
    Retrieves all the enqueued incomes, and deletes them.
     */

    AlmexApi.prototype.getIncomes = function() {
      return this._doRequest(this.requests.getIncomes).then((function(_this) {
        return function(xml) {
          var incomes;
          incomes = ((function() {
            try {
              return this._getResult(xml, "updateIncomes");
            } catch (_error) {}
          }).call(_this)) || [];
          return incomes.map(function(income) {
            return {
              inbound_id: parseInt(income.idOdc[0]),
              received_quantity: parseInt(income.cantidad[0]),
              product: parseInt(income.idWb[0])
            };
          });
        };
      })(this));
    };

    AlmexApi.prototype.updateIncomesNoUpd = function() {
      return this._updateIncomesNoUpd("updateIncomesNoUpd");
    };

    AlmexApi.prototype.updateIncomesNoUpdCpy = function() {
      return this._updateIncomesNoUpd("updateIncomesNoUpdCpy");
    };

    AlmexApi.prototype._updateIncomesNoUpd = function(method) {
      return this._doRequest(this.requests[method]).then((function(_this) {
        return function(xml) {
          var incomes;
          incomes = ((function() {
            try {
              return this._getResult(xml, method);
            } catch (_error) {}
          }).call(_this)) || [];
          return incomes.map(function(income) {
            return {
              id_parcial: income.idParcial[0],
              inbound_id: parseInt(income.idOdc[0]),
              received_quantity: parseInt(income.cantidad[0]),
              product: parseInt(income.idWb[0]),
              reg_id: parseInt(income.regId[0]),
              estado_calidad: income.estadoCalidad[0]
            };
          });
        };
      })(this));
    };

    AlmexApi.prototype.confirmacionOc = function(inboundId, idParcial) {
      return this._confirmacionOc(inboundId, idParcial, "confirmacionOc");
    };

    AlmexApi.prototype.confirmacionOcCpy = function(inboundId, idParcial) {
      return this._confirmacionOc(inboundId, idParcial, "confirmacionOcCpy");
    };

    AlmexApi.prototype._confirmacionOc = function(inboundId, idParcial, method) {
      var confirmacionOcXml, request;
      confirmacionOcXml = this.adaptConfirmacionOc(inboundId, idParcial, method);
      request = this.requests[method];
      return this._doRequest(request, (function(_this) {
        return function() {
          return confirmacionOcXml;
        };
      })(this)).then((function(_this) {
        return function(xml) {
          var statusCode;
          statusCode = _this._getResult(xml, method)[0]._;
          if (statusCode.indexOf("OK") === -1) {
            throw new Error(JSON.stringify(xml));
          }
          return xml;
        };
      })(this));
    };

    AlmexApi.prototype.getIncomesFromCancellations = function() {
      return this._doRequest(this.requests.getIncomesCancelados).then((function(_this) {
        return function(xml) {
          var incomes;
          incomes = ((function() {
            try {
              return this._getResult(xml, "updateIncomesCancelados");
            } catch (_error) {}
          }).call(_this)) || [];
          return incomes.map(function(income) {
            return {
              order_id: parseInt(income.idOdc[0]),
              cantidad: parseInt(income.cantidad[0]),
              product: parseInt(income.idWb[0])
            };
          });
        };
      })(this));
    };

    AlmexApi.prototype.getPickingsAndChangeStatus = function() {
      return this._doRequest(this.requests.getPickingsAndChangeStatus).then((function(_this) {
        return function(xml) {
          var pickings;
          pickings = _this._getResult(xml, "changeOutcomeStatus");
          return pickings.filter(function(it) {
            var _ref;
            return ((_ref = it.idStatusSalida) != null ? _ref[0] : void 0) === "14";
          }).map(function(it) {
            return {
              order_id: it.idPedido[0],
              product_id: it.idSku[0],
              serial_number: it.serie[0]
            };
          });
        };
      })(this));
    };

    AlmexApi.prototype.getExtraOutcomes = function() {
      return this._doRequest(this.requests.generateExtraOutcome).then((function(_this) {
        return function(xml) {
          var outcomes;
          outcomes = _this._getResult(xml, "generateExtraOutcome");
          return outcomes.map(function(it) {
            return {
              quantity: it.cantidad[0],
              product: it.productoSku[0]
            };
          });
        };
      })(this));
    };

    AlmexApi.prototype.getInboundsToBeProcessed = function() {
      return this._doRequest(this.requests.asignaFactura).then((function(_this) {
        return function(xml) {
          var inbounds;
          inbounds = _this._getResult(xml, "asignaFactura");
          return inbounds.map(function(it) {
            return {
              id: it.idodc[0]
            };
          });
        };
      })(this));
    };

    AlmexApi.prototype.getTraspasosCambioCalidad = function() {
      return this._doRequest(this.requests.traspasosCambioCalidad).then((function(_this) {
        return function(xml) {
          var traspasos;
          traspasos = _this._getResult(xml, "traspasosCambioCalidad");
          return traspasos.map(function(it) {
            var _ref;
            return {
              reg_id: it.regId[0],
              estado_calidad_origen: it.edoCalidadOrigen[0],
              estado_calidad_destino: it.estadoCalidadDestino[0],
              inbound_id: parseInt((_ref = it.idodc) != null ? _ref[0] : void 0),
              product: parseInt(it.sku[0]),
              quantity: parseInt(it.cantidad[0])
            };
          });
        };
      })(this));
    };


    /*
    Create an output bean.
      options = { log: false }
     */

    AlmexApi.prototype.createOutputBean = function(order, options) {
      var outputBeanXml, request;
      if (options == null) {
        options = {};
      }
      outputBeanXml = this.adaptSalesOrder(order);
      request = this.requests.createOutputBean;
      if (options.log != null) {
        console.log(outputBeanXml);
      }
      return this._doRequest(request, (function(_this) {
        return function() {
          return outputBeanXml;
        };
      })(this)).then((function(_this) {
        return function(xml) {
          var statusCode;
          statusCode = _this._getResult(xml, "requestOutputBean")[0]._;
          if (statusCode !== "OK") {
            throw new Error(JSON.stringify(xml));
          }
          return xml;
        };
      })(this));
    };


    /*
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
     */

    AlmexApi.prototype.createInputBean = function(inbound, options) {
      var inputBeanXml, request;
      if (options == null) {
        options = {};
      }
      inputBeanXml = this.adaptPurchaseOrder(inbound);
      request = this.requests.createInputBean;
      if (options.log != null) {
        console.log(inputBeanXml);
      }
      return this._doRequest(request, (function(_this) {
        return function() {
          return inputBeanXml;
        };
      })(this)).then((function(_this) {
        return function(xml) {
          var message;
          message = _this._getResult(xml, "requestInputBean")[0]._;
          if (message === "OK" || message === "ERROR,  BR-005 idOc enviada anteriormente") {
            return xml;
          }
          throw new Error(JSON.stringify(xml));
        };
      })(this));
    };

    AlmexApi.prototype.cancelOutputBean = function(order) {
      var cancelOutputXml, request;
      cancelOutputXml = this.adaptCancelOrder(order);
      request = this.requests.requestCancelarOutput;
      return this._doRequest(request, (function(_this) {
        return function() {
          return cancelOutputXml;
        };
      })(this)).then((function(_this) {
        return function(xml) {
          var message;
          message = _this._getResult(xml, "requestCancelarOutput")[0]._;
          if (message === "OK" || message === "pedido cancelado exitosamente" || message === "Pedido marcado para cancelar, esperar ingreso de mercancia") {
            return message;
          }
          throw new Error(_.isEmpty(message) ? JSON.stringify(xml) : message);
        };
      })(this));
    };

    AlmexApi.prototype.adaptSkus = function(skusToRetrieve, request) {
      var params;
      params = {
        skus: skusToRetrieve.map(function(sku) {
          return "<sku>" + sku + "</sku>";
        }).join("")
      };
      return new XmlBuilder(request.xml).buildWith(params);
    };


    /*
    Get the xml of a sales order.
     */

    AlmexApi.prototype.adaptSalesOrder = function(order) {
      var labelType, outputBean, xmlTemplate;
      outputBean = this.ordersAdapter.getOutputBean(order);
      labelType = order.zpl2 != null ? "Zpl2" : "GuiaPdf";
      xmlTemplate = "createOutputBean" + labelType;
      return new XmlBuilder(this.requests[xmlTemplate].xml).buildWith(outputBean);
    };


    /*
    Get the xml of a purchase order.
     */

    AlmexApi.prototype.adaptPurchaseOrder = function(inbound) {
      var inputBean;
      inputBean = this.inboundsAdapter.getInputBean(inbound);
      return new XmlBuilder(this.requests.createInputBean.xml).buildWith(inputBean);
    };

    AlmexApi.prototype.adaptCancelOrder = function(order) {
      return new XmlBuilder(this.requests.requestCancelarOutput.xml).buildWith(order);
    };

    AlmexApi.prototype.adaptStocksPagination = function(page, top) {
      return new XmlBuilder(this.requests.stocksPaginated.xml).buildWith({
        page: page,
        top: top
      });
    };

    AlmexApi.prototype.adaptConfirmacionOc = function(inboundId, idParcial, method) {
      return new XmlBuilder(this.requests[method].xml).buildWith({
        inboundId: inboundId,
        idParcial: idParcial
      });
    };

    AlmexApi.prototype._doRequest = function(request, adapt) {
      var params, xml;
      if (adapt == null) {
        adapt = (function(_this) {
          return function(i) {
            return i;
          };
        })(this);
      }
      xml = adapt(request.xml);
      params = {
        url: "" + this.url + "/" + request.endpoint,
        body: xml,
        headers: {
          "Content-Type": "text/xml"
        }
      };
      return req.postAsync(params).spread((function(_this) {
        return function(response) {
          _this.logger.info(request.name, xml, response.statusCode, response.body);
          if (response.statusCode >= 500) {
            throw new Error("server_error");
          }
          return xml2js.parseStringAsync(response.body);
        };
      })(this));
    };

    AlmexApi.prototype._getResult = function(xml, method) {
      var result;
      result = (function() {
        try {
          return xml["S:Envelope"]["S:Body"][0]["ns2:" + method + "Response"][0]["return"];
        } catch (_error) {}
      })();
      if (result == null) {
        throw new Error("Los web services de la vida, no son lo que yo esperaba, no son lo que yo creía, no son lo que imaginaba...\n" + JSON.stringify(xml));
      }
      return result;
    };

    return AlmexApi;

  })();

}).call(this);
