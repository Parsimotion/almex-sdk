(function() {
  var AlmexApi, AlmexInboundsAdapter, AlmexOrdersAdapter, Promise, XmlBuilder, read, req, xml2js, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Promise = require("bluebird");

  req = Promise.promisifyAll(require("request"));

  xml2js = Promise.promisifyAll(require("xml2js"));

  read = (require("fs")).readFileSync;

  XmlBuilder = require("./xmlBuilder");

  AlmexOrdersAdapter = require("./almexOrdersAdapter");

  AlmexInboundsAdapter = require("./almexInboundsAdapter");

  _ = require("lodash");

  module.exports = AlmexApi = (function() {
    function AlmexApi(credentials, url) {
      var auth;
      this.credentials = credentials;
      this.url = url != null ? url : "http://201.157.61.34:8989/CkIntegracionGeneral";
      this._getResult = __bind(this._getResult, this);
      this._doRequest = __bind(this._doRequest, this);
      this.adaptPurchaseOrder = __bind(this.adaptPurchaseOrder, this);
      this.adaptSalesOrder = __bind(this.adaptSalesOrder, this);
      this.createInputBean = __bind(this.createInputBean, this);
      this.createOutputBean = __bind(this.createOutputBean, this);
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
        stocks: {
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
    Get all the stocks.
     */

    AlmexApi.prototype.getStocks = function() {
      return this._doRequest(this.requests.stocks).then((function(_this) {
        return function(xml) {
          var stocks;
          stocks = _this._getResult(xml, "ProductoInventarioMethod");
          return stocks.map(function(it) {
            return _.assign(it, {
              identifier: it.productoSku[0],
              name: it.descripcion[0],
              stock: it.cantidadInventario[0]
            });
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
          var statusCode;
          statusCode = _this._getResult(xml, "requestInputBean")[0]._;
          if (statusCode !== "OK") {
            throw new Error(JSON.stringify(xml));
          }
          return xml;
        };
      })(this));
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
