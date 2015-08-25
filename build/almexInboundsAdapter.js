(function() {
  var AlmexInboundsAdapter, XmlBuilder, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  XmlBuilder = require("./xmlBuilder");

  _ = require("lodash");

  module.exports = AlmexInboundsAdapter = (function() {
    function AlmexInboundsAdapter() {
      this.getInputBean = __bind(this.getInputBean, this);
    }

    AlmexInboundsAdapter.prototype.getInputBean = function(inbound) {
      var date;
      date = inbound.date.toISOString();
      return {
        id: inbound.id,
        fecha: date.substr(0, date.indexOf("T")).split("-").reverse().join("/"),
        total: inbound.products.length,
        cantidadTotal: _.sum(inbound.products, "quantity"),
        listProducto: inbound.products.map((function(_this) {
          return function(product, i) {
            return {
              sku: product.id,
              descripcion: product.description,
              cantidad: product.quantity,
              idWb: i + 1,
              ean: product.barcode || "N/A",
              idVertical: "11",
              modelo: "112-p1213224mb",
              marca: "Tambourine",
              vertical: "Bebitos",
              departamento: "Mujer",
              categoria: "Ropa",
              subcategoria: "Ropa"
            };
          };
        })(this))
      };
    };

    return AlmexInboundsAdapter;

  })();

}).call(this);
