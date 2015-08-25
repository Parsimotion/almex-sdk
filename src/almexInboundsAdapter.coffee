XmlBuilder = require("./xmlBuilder")
_ = require("lodash")
module.exports =
#---

# Converts inbounds to Almex's input beans.
class AlmexInboundsAdapter
  getInputBean: (inbound) =>
    date = inbound.date.toISOString()

    id: inbound.id
    fecha: date
      .substr(0, date.indexOf("T"))
      .split("-").reverse().join "/"
    total: inbound.products.length
    cantidadTotal: _.sum inbound.products, "quantity"
    listProducto: inbound.products.map (product, i) =>
      sku: product.id
      descripcion: product.description
      cantidad: product.quantity
      idWb: i
      ean: product.barcode || "N/A"
