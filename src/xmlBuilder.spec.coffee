global.chai = require("chai")
chai.Should()

XmlBuilder = require ("./xmlBuilder")

describe "XmlBuilder", ->
  it "can replace simple string values", ->
    new XmlBuilder("<name>$name</name><city>$city</city>")
      .buildWith
        name: "Rodri"
        city: "Buenos Aires"
      .should.be.eql "<name>Rodri</name><city>Buenos Aires</city>"

  it "can replace number values", ->
    new XmlBuilder("<name>$name</name><age>$age</age>")
      .buildWith
        name: "Rodri"
        age: 23
      .should.be.eql "<name>Rodri</name><age>23</age>"

  it "can replace array values", ->
    new XmlBuilder("<name>$name</name>$products")
      .buildWith
        name: "Rodri"
        products: [
          { sku: 56, quantity: 4 }
          { sku: 89, quantity: 1 }
        ]
      .should.be.eql "<name>Rodri</name><products><sku>56</sku><quantity>4</quantity></products><products><sku>89</sku><quantity>1</quantity></products>"

  it "replaces null with empty strings", ->
    new XmlBuilder("<name>$name</name><location>$location</location>")
      .buildWith
        name: "Rodri"
        location: null
      .should.be.eql "<name>Rodri</name><location></location>"
