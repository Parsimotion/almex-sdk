(function() {
  var AlmexOrdersAdapter, XmlBuilder, moment,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  XmlBuilder = require("./xmlBuilder");

  moment = require("moment");

  module.exports = AlmexOrdersAdapter = (function() {
    function AlmexOrdersAdapter() {
      this._buildAddress = __bind(this._buildAddress, this);
      this.getOutputBean = __bind(this.getOutputBean, this);
    }

    AlmexOrdersAdapter.prototype.getOutputBean = function(order) {
      var valueOrDefault, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
      valueOrDefault = (function(_this) {
        return function(value, defaultValue) {
          if (defaultValue == null) {
            defaultValue = "Sin datos";
          }
          value = value != null ? value.trim() : void 0;
          if ((value != null ? value.length : void 0) > 0) {
            return value;
          } else {
            return defaultValue;
          }
        };
      })(this);
      return {
        calle: ((_ref = order.contact.location) != null ? _ref.streetName : void 0) ? this._buildAddress(order.contact.location) : "Sin datos",
        colonia: valueOrDefault((_ref1 = order.contact.location) != null ? _ref1.city.substring(0, 250) : void 0),
        cp: valueOrDefault((_ref2 = order.contact.location) != null ? _ref2.zipCode : void 0, "1000"),
        estado: valueOrDefault((_ref3 = order.contact.location) != null ? _ref3.state.substring(0, 250) : void 0),
        nombreRecibe: ("" + (order.contact.name || '') + "|" + (order.contact.contactPerson || '')).substring(0, 100),
        referencias: valueOrDefault((_ref4 = order.notes) != null ? _ref4.substring(0, 300) : void 0),
        telefonoContacto1: valueOrDefault((_ref5 = order.contact.phoneNumber) != null ? _ref5.substring(0, 20) : void 0),
        idPedido: order.id,
        partidaList: order.lines.map((function(_this) {
          return function(line) {
            var _ref6;
            return {
              cantidad: line.quantity,
              idPartida: 1,
              skuId: ((_ref6 = line.variation.sku) != null ? _ref6.substring(0, 50) : void 0) || ''
            };
          };
        })(this)),
        fechaEntrega: moment(order.date).format("YYYY-MM-DD"),
        zpl2: order.zpl2,
        customId: order.customId,
        trackingNumber: (_ref6 = order.shipping) != null ? _ref6.trackingNumber : void 0,
        service: (_ref7 = order.shipping) != null ? _ref7.service : void 0,
        priority: (_ref8 = order.shipping) != null ? _ref8.priority : void 0
      };
    };

    AlmexOrdersAdapter.prototype._buildAddress = function(location) {
      var address;
      address = "" + location.streetName + " " + location.streetNumber;
      if (location.addressNotes) {
        address += " - " + location.addressNotes;
      }
      return address.substring(0, 100);
    };

    return AlmexOrdersAdapter;

  })();

}).call(this);
