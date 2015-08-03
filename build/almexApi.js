(function() {
  var AlmexApi, AlmexOrdersAdapter, Promise, XmlBuilder, read, req, xml2js,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Promise = require("bluebird");

  req = Promise.promisifyAll(require("request"));

  xml2js = Promise.promisifyAll(require("xml2js"));

  read = (require("fs")).readFileSync;

  XmlBuilder = require("./xmlBuilder");

  AlmexOrdersAdapter = require("./almexOrdersAdapter");

  module.exports = AlmexApi = (function() {
    function AlmexApi(credentials, url) {
      this.credentials = credentials;
      this.url = url != null ? url : "http://38.124.173.74:8989/CkIntegracionGeneral";
      this._getResult = __bind(this._getResult, this);
      this._auth = __bind(this._auth, this);
      this._doRequest = __bind(this._doRequest, this);
      this.createOutputBean = __bind(this.createOutputBean, this);
      this.getStocks = __bind(this.getStocks, this);
      this.requests = {
        createOutputBean: {
          endpoint: "CkWService",
          xml: this._auth(read("" + __dirname + "/resources/createOutputBean.xml", "utf-8"))
        },
        stocks: {
          endpoint: "Jobs",
          xml: this._auth(read("" + __dirname + "/resources/stocks.xml", "utf-8"))
        }
      };
      this.ordersAdapter = new AlmexOrdersAdapter();
    }


    /*
    Get all the stocks.
     */

    AlmexApi.prototype.getStocks = function(id) {
      var xml;
      xml = new XmlBuilder(this.requests.stocks).buildWith({
        id: id
      });
      return this._doRequest(this.requests.stocks).spread((function(_this) {
        return function(response) {
          return xml2js.parseStringAsync(response.body).then(function(xml) {
            var stocks;
            stocks = _this._getResult(xml, "ProductoInventarioMethod");
            return stocks.map(function(it) {
              return {
                identifier: it.productoSku[0],
                name: it.descripcion[0],
                stock: it.cantidadInventario[0]
              };
            });
          });
        };
      })(this));
    };


    /*
    Create an output bean.
     */

    AlmexApi.prototype.createOutputBean = function(order, log) {
      var adapt, outputBean, request;
      if (log == null) {
        log = false;
      }
      outputBean = this.ordersAdapter.getOutputBean(order);
      request = this.requests.createOutputBean;
      adapt = (function(_this) {
        return function(xml) {
          return new XmlBuilder(xml).buildWith(outputBean);
        };
      })(this);
      if (log) {
        console.log(adapt(request.xml));
      }
      return this._doRequest(request, adapt).spread((function(_this) {
        return function(response) {
          return xml2js.parseStringAsync(response.body).then(function(xml) {
            var statusCode;
            statusCode = _this._getResult(xml, "requestOutputBean")[0]._;
            if (statusCode !== "OK") {
              throw new Error(JSON.stringify(xml));
            }
          });
        };
      })(this));
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
      return req.postAsync(params);
    };

    AlmexApi.prototype._auth = function(xml) {
      return new XmlBuilder(xml).buildWith({
        username: process.env.IBUSHAK_USERNAME,
        password: process.env.IBUSHAK_PASSWORD,
        accountId: process.env.IBUSHAK_ACCOUNT
      });
    };

    AlmexApi.prototype._getResult = function(xml, method) {
      var result;
      result = (function() {
        try {
          return xml["S:Envelope"]["S:Body"][0]["ns2:" + method + "Response"][0]["return"];
        } catch (_error) {}
      })();
      if (result == null) {
        throw new Error("Los web services de la vida, no son lo que yo esperaba, no son lo que yo creía, no son lo que imaginaba...");
      }
      return result;
    };

    return AlmexApi;

  })();

}).call(this);
