global.chai = require("chai")
nock = require("nock")
chai.Should()
AlmexApi = require ("./almexApi")

expectedGetStocksXml = """<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://impl.ws.ck.com/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soap:Header>
    <Usuario xmlns="uri:com.ck.engine.ws" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">username</Usuario>
    <Password xmlns="uri:com.ck.engine.ws" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">password</Password>
  </soap:Header>
  <soap:Body>
    <tns:ProductoInventarioMethod>
      <cuenta>300</cuenta>
      <sku>10001</sku><sku>10002</sku>      
    </tns:ProductoInventarioMethod>
  </soap:Body>
</soap:Envelope>"""

getStocksReponse = """<?xml version="1.0" ?>
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
    <S:Body>
        <ns2:ProductoInventarioMethodResponse xmlns:ns2="http://impl.ws.ck.com/">
            <return xmlns="">
                <cantidad>1</cantidad>
                <cantidadInventario>1</cantidadInventario>
                <cantidadSurtida>0</cantidadSurtida>
                <cantidadSurtir>0</cantidadSurtir>
                <color>GRIS</color>
                <descripcion>PLAYERA MANGA CORTA  CUELLO V BASICA</descripcion>
                <marca>GRYPHO</marca>
                <modelo>AUSTGRYPGRIS</modelo>
                <productoSku>10001</productoSku>
                <talla>G</talla>
            </return>
            <return xmlns="">
                <cantidad>3</cantidad>
                <cantidadInventario>3</cantidadInventario>
                <cantidadSurtida>0</cantidadSurtida>
                <cantidadSurtir>0</cantidadSurtir>
                <color>STONE EUROPEO</color>
                <descripcion>BERMUDA SLIM DENIM STRETCH MODELAJE</descripcion>
                <marca>GRYPHO</marca>
                <modelo>GRYP5202</modelo>
                <productoSku>10002</productoSku>
                <talla>30</talla>
            </return>
        </ns2:ProductoInventarioMethodResponse>
    </S:Body>
</S:Envelope>"""

expectedCancelOutputBeans = """<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.engine.ck.com/">\n    <soapenv:Header>\n        <Usuario xmlns="uri:com.ck.engine.ws" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">username</Usuario>\n        <Password xmlns="uri:com.ck.engine.ws" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">password</Password>\n    </soapenv:Header>\n   <soapenv:Body>\n      <ws:requestCancelarOutput>\n         <cancelarOutputBean>\n            <elementos>\n               <idPedido>12345678</idPedido>\n               <idCuenta>300</idCuenta>\n            </elementos>\n         </cancelarOutputBean>\n      </ws:requestCancelarOutput>\n   </soapenv:Body>\n</soapenv:Envelope>"""

cancelOutputBeanResponse = "<S:Envelope xmlns:S=\"http://schemas.xmlsoap.org/soap/envelope/\">
   <S:Body>
      <ns2:requestCancelarOutputResponse xmlns:ns2=\"http://ws.engine.ck.com/\">
         <return>OK</return>
      </ns2:requestCancelarOutputResponse>
   </S:Body>
</S:Envelope>"

expectedStocks = [
  {
    '$': xmlns: ''
    cantidad: [ '1' ]
    cantidadInventario: [ '1' ]
    cantidadSurtida: [ '0' ]
    cantidadSurtir: [ '0' ]
    color: [ 'GRIS' ]
    descripcion: [ 'PLAYERA MANGA CORTA  CUELLO V BASICA' ]
    marca: [ 'GRYPHO' ]
    modelo: [ 'AUSTGRYPGRIS' ]
    productoSku: [ '10001' ]
    talla: [ 'G' ]
    identifier: '10001'
    name: 'PLAYERA MANGA CORTA  CUELLO V BASICA'
    stock: '1'
    availableQuantity: '1'
  }
  {
    '$': xmlns: ''
    cantidad: [ '3' ]
    cantidadInventario: [ '3' ]
    cantidadSurtida: [ '0' ]
    cantidadSurtir: [ '0' ]
    color: [ 'STONE EUROPEO' ]
    descripcion: [ 'BERMUDA SLIM DENIM STRETCH MODELAJE' ]
    marca: [ 'GRYPHO' ]
    modelo: [ 'GRYP5202' ]
    productoSku: [ '10002' ]
    talla: [ '30' ]
    identifier: '10002'
    name: 'BERMUDA SLIM DENIM STRETCH MODELAJE'
    stock: '3'
    availableQuantity: '3'
  }
]

describe "AlmexApi", ->
  beforeEach ->
    nock.cleanAll()

  it "can retrieve the stocks of a given list of skus", ->
    nock("http://201.157.61.34:8989/CkIntegracionGeneral").post("/Jobs", expectedGetStocksXml).reply 200, getStocksReponse

    almexApi = new AlmexApi username: "username", password: "password", accountId: 300
    almexApi.getStocks(["10001","10002"]).then (response) ->
      response.should.eql expectedStocks

  it "can cancel an order", ->
    expected = nock("http://201.157.61.34:8989/CkIntegracionGeneral").post("/CkWService", expectedCancelOutputBeans).reply 200, cancelOutputBeanResponse

    almexApi = new AlmexApi username: "username", password: "password", accountId: 300
    almexApi.cancelOutputBean(id: 12345678).then ->
    	expected.done()