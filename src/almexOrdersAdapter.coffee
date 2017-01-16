XmlBuilder = require("./xmlBuilder")
moment = require("moment")
module.exports =
#---

# Converts orders to Almex's output beans.
class AlmexOrdersAdapter
  getOutputBean: (order) =>
    valueOrDefault = (value, defaultValue = "Sin datos") =>
      value = value?.trim()
      if value?.length > 0 then value
      else defaultValue

    calle: if order.contact.location?.streetName then @_buildAddress(order.contact.location) else "Sin datos"
    colonia: valueOrDefault order.contact.location?.city.substring(0, 250)
    cp: valueOrDefault order.contact.location?.zipCode, "1000"
    estado: valueOrDefault order.contact.location?.state.substring(0, 250)
    nombreRecibe: "#{order.contact.name || ''}|#{order.contact.contactPerson || ''}".substring(0, 100)
    referencias: valueOrDefault order.notes?.substring(0, 300)
    telefonoContacto1: valueOrDefault order.contact.phoneNumber?.substring(0, 20)
    idPedido: order.id
    partidaList: order.lines.map (line) =>
      cantidad: line.quantity
      idPartida: 1 #fixed
      skuId: line.variation.sku?.substring(0, 50) || ''
    fechaEntrega: moment(order.date).format("YYYY-MM-DD")
    zpl2: order.zpl2
    tracking_number: order.shipping.tracking_number

  _buildAddress: (location) =>
    address = "#{location.streetName} #{location.streetNumber}"
    if location.addressNotes
      address += " - #{location.addressNotes}"
    address.substring(0, 100)
