(function() {
  var AlmexOrdersAdapter, XmlBuilder,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  XmlBuilder = require("./xmlBuilder");

  module.exports = AlmexOrdersAdapter = (function() {
    function AlmexOrdersAdapter() {
      this._buildAddress = __bind(this._buildAddress, this);
      this.getOutputBean = __bind(this.getOutputBean, this);
    }

    AlmexOrdersAdapter.prototype.getOutputBean = function(order) {
      var valueOrDefault, _ref, _ref1, _ref2, _ref3;
      valueOrDefault = (function(_this) {
        return function(value, defaultValue) {
          if (defaultValue == null) {
            defaultValue = "Sin datos";
          }
          if ((value != null ? value.length : void 0) > 0) {
            return value;
          } else {
            return defaultValue;
          }
        };
      })(this);
      return {
        calle: ((_ref = order.contact.location) != null ? _ref.streetName : void 0) ? this._buildAddress(order.contact.location) : "Sin datos",
        colonia: valueOrDefault((_ref1 = order.contact.location) != null ? _ref1.city : void 0),
        cp: valueOrDefault((_ref2 = order.contact.location) != null ? _ref2.zipCode : void 0, "1000"),
        estado: valueOrDefault((_ref3 = order.contact.location) != null ? _ref3.state : void 0),
        nombreRecibe: "" + (order.contact.name || '') + "|" + (order.contact.contactPerson || ''),
        referencias: valueOrDefault(order.notes),
        telefonoContacto1: valueOrDefault(order.contact.phoneNumber),
        idPedido: order.id,
        partidaList: order.lines.map((function(_this) {
          return function(line) {
            return {
              cantidad: line.quantity,
              idPartida: 1,
              skuId: line.variation.barcode || ''
            };
          };
        })(this)),
        fechaEntrega: order.date.substr(0, order.date.indexOf("T"))
      };
    };

    AlmexOrdersAdapter.prototype._buildAddress = function(location) {
      var address;
      address = "" + location.streetName + " " + location.streetNumber;
      if (location.addressNotes) {
        address += " - " + location.addressNotes;
      }
      return address;
    };

    return AlmexOrdersAdapter;

  })();

}).call(this);
