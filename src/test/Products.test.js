import productManager from "../dao/manager_mongo/productManager.js";
import { config } from "dotenv";
import chai from "chai";

const expect = chai.expect;
let products = [];
for (let i = 0; i < 100; i++) {
  products.push(generateProducts());
}

describe("Test de creación de producto", () => {
  before(function () {});
  it("La", () => {});
});

describe("Test de carga al carrito", () => {
  before(function () {});
  it("La", () => {});
});
