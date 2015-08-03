XmlBuilder = require("./xmlBuilder")
module.exports =
#---

###
Converts orders to Almex's output beans.
###
class AlmexOrdersAdapter
  getOutputBean: (order) =>
    valueOrDefault = (value, defaultValue = "Sin datos") =>
      if value?.length > 0 then value
      else defaultValue

    calle: if order.contact.location?.streetName then @_buildAddress(order.contact.location) else "Sin datos"
    colonia: valueOrDefault order.contact.location?.city
    cp: valueOrDefault order.contact.location?.zipCode, "1000"
    estado: valueOrDefault order.contact.location?.state
    nombreRecibe: "#{order.contact.name || ''}|#{order.contact.contactPerson || ''}"
    referencias: valueOrDefault order.notes
    telefonoContacto1: valueOrDefault order.contact.phoneNumber
    idPedido: order.id
    partidaList: order.lines.map (line) =>
      cantidad: line.quantity
      idPartida: 1 #fixed
      skuId: line.variation.barcode || ''
    fechaEntrega: order.date.substr 0, order.date.indexOf("T")

  _buildAddress: (location) =>
    address = "#{location.streetName} #{location.streetNumber}"
    if location.addressNotes
      address += " - #{location.addressNotes}"
    address
