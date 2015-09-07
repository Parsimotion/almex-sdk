XmlBuilder = require("./xmlBuilder")
moment = require("moment")
_ = require("lodash")
module.exports =
#---

# Converts inbounds to Almex's input beans.
class AlmexInboundsAdapter
  getInputBean: (inbound) =>
    date = inbound.date.toISOString()

    id: inbound.id
    fecha: moment(date).format("DD/MM/YYYY")
    total: inbound.products.length
    cantidadTotal: _.sum inbound.products, "quantity"
    listProducto: inbound.products.map (product, i) =>
      sku: product.id
      descripcion: product.description
      cantidad: product.quantity
      idWb: i + 1
      ean: product.barcode || "N/A"

      idVertical: "-"
      modelo: "-"
      marca: "-"
      vertical: "-"
      departamento: "-"
      categoria: "-"
      subcategoria: "-"
