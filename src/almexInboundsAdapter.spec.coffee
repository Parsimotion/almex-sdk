global.chai = require("chai")
chai.Should()

AlmexInboundsAdapter = require ("./almexInboundsAdapter")

describe "AlmexInboundsAdapter", ->
  it "can adapt the model to the Almex WS", ->
    inbound =
      id: 9
      date: new Date("2015-08-25T19:38:45.237Z")
      products: [
        id: "232"
        quantity: 5
        description: "Camiseta de River Plate"
        barcode: "B0CACACA"
      ,
        id: "233"
        quantity: 1
        description: "Estampilla"
        barcode: "0CA0CA"
      ]

    new AlmexInboundsAdapter()
      .getInputBean(inbound)
      .should.eql
        id: 9
        fecha: "25/08/2015"
        total: 2
        cantidadTotal: 6
        listProducto: [
          sku: "232"
          descripcion: "Camiseta de River Plate"
          cantidad: 5
          idWb: 1
          ean: "B0CACACA"

          # TODO: Sacar esto cuando Almex haga estos campos opcionales
          idVertical: "11"
          modelo: "112-p1213224mb"
          marca: "Tambourine"
          vertical: "Bebitos"
          departamento: "Mujer"
          categoria: "Ropa"
          subcategoria: "Ropa"
        ,
          sku: "233"
          descripcion: "Estampilla"
          cantidad: 1
          idWb: 2
          ean: "0CA0CA"

          # TODO: Sacar esto cuando Almex haga estos campos opcionales
          idVertical: "11"
          modelo: "112-p1213224mb"
          marca: "Tambourine"
          vertical: "Bebitos"
          departamento: "Mujer"
          categoria: "Ropa"
          subcategoria: "Ropa"
        ]
