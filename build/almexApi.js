(function() {
  var AlmexApi, AlmexInboundsAdapter, AlmexOrdersAdapter, Promise, XmlBuilder, almexWsUrl, read, req, xml2js, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Promise = require("bluebird");

  req = Promise.promisifyAll(require("request"));

  xml2js = Promise.promisifyAll(require("xml2js"));

  read = (require("fs")).readFileSync;

  XmlBuilder = require("./xmlBuilder");

  AlmexOrdersAdapter = require("./almexOrdersAdapter");

  AlmexInboundsAdapter = require("./almexInboundsAdapter");

  _ = require("lodash");

  almexWsUrl = process.env.ALMEX_WS_URL || "http://201.157.61.34:8989/CkIntegracionGeneral";

  module.exports = AlmexApi = (function() {
    function AlmexApi(credentials, url) {
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
      this.getExtraOutcomes = __bind(this.getExtraOutcomes, this);
      this.getPickingsAndChangeStatus = __bind(this.getPickingsAndChangeStatus, this);
      this.getIncomesFromCancellations = __bind(this.getIncomesFromCancellations, this);
      this.getIncomes = __bind(this.getIncomes, this);
      this.getStocksPaginated = __bind(this.getStocksPaginated, this);
      this.getStocks = __bind(this.getStocks, this);
      auth = (function(_this) {
        return function(xml) {
          return new XmlBuilder(xml).buildWith(_this.credentials);
        };
      })(this);
      this.requests = _.mapValues({
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
        stocksPaginated: {
          endpoint: "Jobs"
        },
        getPickingsAndChangeStatus: {
          endpoint: "Jobs"
        },
        getIncomes: {
          endpoint: "Jobs"
        },
        getIncomesCancelados: {
          endpoint: "Jobs"
        },
        generateExtraOutcome: {
          endpoint: "Jobs"
        }
      }, (function(_this) {
        return function(val, name) {
          return _.assign(val, {
            xml: auth(read("" + __dirname + "/resources/" + name + ".xml", "utf-8"))
          });
        };
      })(this));
      this.ordersAdapter = new AlmexOrdersAdapter();
      this.inboundsAdapter = new AlmexInboundsAdapter();
    }


    /*
    Get the stocks for the given skus.
     */

    AlmexApi.prototype.getStocks = function(skus) {
      return this._doRequest(this.requests.stocks, (function(_this) {
        return function() {
          return _this.adaptSkus(skus);
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
              var _ref;
              return {
                identifier: (_ref = it.productoSku) != null ? _ref[0] : void 0,
                name: it.descripcion[0],
                stock: it.cantidadInventario[0],
                availableQuantity: it.cantidad[0]
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
          return pickings.map(function(it) {
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
      var outcomes;
      this._doRequest(this.requests.generateExtraOutcome).then((function(_this) {
        return function(xml) {};
      })(this));
      outcomes = this._getResult(xml, "generateExtraOutcome");
      return outcomes.map((function(_this) {
        return function(it) {
          return {
            quantity: it.cantidad[0],
            product: it.productoSku[0]
          };
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
          var statusCode;
          statusCode = _this._getResult(xml, "requestInputBean")[0]._;
          if (statusCode !== "OK") {
            throw new Error(JSON.stringify(xml));
          }
          return xml;
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

    AlmexApi.prototype.adaptSkus = function(skusToRetrieve) {
      var params;
      params = {
        skus: skusToRetrieve.map(function(sku) {
          return "<sku>" + sku + "</sku>";
        }).join("")
      };
      return new XmlBuilder(this.requests.stocks.xml).buildWith(params);
    };


    /*
    Get the xml of a sales order.
     */

    AlmexApi.prototype.adaptSalesOrder = function(order) {
      var outputBean;
      outputBean = this.ordersAdapter.getOutputBean(order);
      return new XmlBuilder(this.requests.createOutputBean.xml).buildWith(outputBean);
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

    AlmexApi.prototype._doRequest = function(request, adapt) {
      var params;
      if (adapt == null) {
        adapt = (function(_this) {
          return function(i) {
            return i;
          };
        })(this);
      }
      params = {
        url: "" + this.url + "/" + request.endpoint,
        body: adapt(request.xml),
        headers: {
          "Content-Type": "text/xml"
        }
      };
      return req.postAsync(params).spread((function(_this) {
        return function(response) {
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
