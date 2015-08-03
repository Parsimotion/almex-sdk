global.chai = require("chai")
chai.Should()

AlmexOrdersAdapter = require ("./almexOrdersAdapter")

describe "AlmexOrdersAdapter", ->
  it "can adapt the model to the Almex WS", ->
    order =
      {
        "contact": {
            "name": "TETE3169694",
            "contactPerson": "Test Test",
            "mail": "test_user_80677946@testuser.com",
            "phoneNumber": "01-1111-1111",
            "taxId": "36724222",
            "location": {
                "streetName": "Ramón Falcón",
                "streetNumber": 6111,
                "state": "Buenos Aires",
                "city": "Avellaneda",
                "zipCode": "1408"
            }
        },
        "lines": [
            {
                "variation": {
                    "barcode": "MODEMWIFI22UNIQUE"
                },
                "quantity": 1
            }
        ],
        "date": "2015-04-15T19:38:58",
        "notes": "Es un pedido muy importante!!!",
        "id": 1227
      }

    new AlmexOrdersAdapter()
      .getOutputBean(order)
      .should.eql
        calle: "Ramón Falcón 6111"
        colonia: "Avellaneda"
        cp: "1408"
        estado: "Buenos Aires"
        nombreRecibe: "TETE3169694|Test Test"
        referencias: "Es un pedido muy importante!!!"
        telefonoContacto1: "01-1111-1111"
        idPedido: 1227
        partidaList: [
          cantidad: 1
          idPartida: 1
          skuId: "MODEMWIFI22UNIQUE"
        ]
        fechaEntrega: "2015-04-15"
