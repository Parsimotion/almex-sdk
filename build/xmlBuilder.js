(function() {
  var XmlBuilder, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require("lodash");

  module.exports = XmlBuilder = (function() {
    function XmlBuilder(xml) {
      this.xml = xml;
      this.buildWith = __bind(this.buildWith, this);
    }

    XmlBuilder.prototype.buildWith = function(data) {
      var xml;
      xml = this.xml;
      _.forOwn(data, (function(_this) {
        return function(value, key) {
          return xml = xml.replace(new RegExp("\\$" + key, "g"), (function() {
            switch (typeof value) {
              case "string":
              case "number":
                return value;
              default:
                return (value != null ? value.map((function(_this) {
                  return function(element) {
                    var content;
                    content = _(element).mapValues(function(value, key) {
                      return "<" + key + ">" + value + "</" + key + ">";
                    }).values().join("");
                    return "<" + key + ">" + content + "</" + key + ">";
                  };
                })(this)).join("") : void 0) || "";
            }
          }).call(_this));
        };
      })(this));
      return xml;
    };

    return XmlBuilder;

  })();

}).call(this);
