import config from "../config/config.js";
import { productService, userService } from "../repositories/index.js";
import { DuplicateCode, IncompleteFields, NotFound } from "../test/customError.js";
import { generateProducts } from "../utils.js";
import jwt from "jsonwebtoken";

export async function getProducts(req, res) {
  try {
    const products = await productService.get(req.query);
    req.logger.INFO(`Se devolvieron todos los productos`);
    res.status(200).send(products);
  } catch (error) {
    req.logger.ERROR(error.message);
    res.status(500).send(`Hubo un error obteniendo los productos: ${error.message}`);
  }
}

export async function getProductById(req, res) {
  try {
    const product = await productService.getById(req.params.pid);
    req.logger.INFO(`Producto devuelto: ${req.params.pid}`);
    res.status(200).send(product);
  } catch (error) {
    console.log(error.message);
    if (error instanceof NotFound) {
      res.status(404).send(`Error al encontrar el producto`);
    } else {
      req.logger.ERROR(error.message);
      res.status(500).send(`Error al obtener el producto: ${error.message}`);
    }
  }
}

export async function addProduct(req, res) {
  try {
    const product = req.body;
    const productAdded = await productService.add(product);
    req.logger.INFO(`Se agregó el producto ${productAdded.title}`);
    res.status(201).send(`Se agregó el producto ${productAdded.title}`);
  } catch (error) {
    if (error instanceof IncompleteFields) {
      req.logger.WARN(`Debe completar todos los campos: ${error.message}`);
      res.status(400).send(`Debe completar todos los campos: ${error.message}`);
    } else {
      if (error instanceof DuplicateCode) {
        req.logger.WARN(`Ya existe un producto con el código proporcionado`);
        res.status(400).send(`Ya existe un producto con el código proporcionado`);
      } else {
        req.logger.ERROR(error.message);
        res.status(500).send(error.message);
      }
    }
  }
}

export async function updateProduct(req, res) {
  try {
    await productService.update(req.params.pid, req.body);
    req.logger.INFO(`Producto actualizado: ${req.params.pid}`);
    res.status(200).send(`Producto actualizado`);
  } catch (error) {
    if (error instanceof NotFound) {
      req.logger.ERROR(`No se encontró el producto a actualizar`);
      res.status(404).send(`No se encontró el producto a actualizar`);
    } else {
      if (error instanceof IncompleteFields) {
        req.logger.ERROR(`Debe completar todos los campos`);
        res.status(400).send(`Debe completar todos los campos`);
      } else {
        req.logger.FATAL(error.message);
        res.status(500).send(error.message);
      }
    }
  }
}

export async function deleteProduct(req, res) {
  try {
    const userId = jwt.verify(req.signedCookies.jwt, config.privateKey).id;
    const product = await productService.getById(req.params.pid);
    if (userId !== 1) {
      const user = await userService.getById(userId);
      if (user.email === product.owner) {
        await productService.delete(req.params.pid);
        req.logger.INFO(`Se eliminó el producto ${req.params.pid}`);
        res.status(200).send(`Producto eliminado`);
      } else {
        req.logger.INFO(`Usted no puede eliminar un producto que no le pertenece`);
        res.render("realTimeProducts");
      }
    } else {
      await productService.delete(req.params.pid);
      req.logger.INFO(`Se eliminó el producto ${req.params.pid}`);
      res.status(200).render("/realTimeProducts");
    }
  } catch (error) {
    if (error instanceof NotFound) {
      req.logger.ERROR(`No se encontró el producto a actualizar`);
      res.status(404).send(`No se encontró el producto a actualizar`);
    } else {
      req.logger.FATAL(error.message);
      res.status(500).send(`Error al eliminar producto`);
    }
  }
}

export function mockingProducts(req, res) {
  let products = [];
  for (let i = 0; i < 100; i++) {
    products.push(generateProducts());
  }
  req.logger.INFO(" ");
  res.status(200).send(products);
}

export async function verifyRole(req, res, next) {
  try {
    if (!req.signedCookies.jwt) {
      req.logger.ERROR("No está logueado");
      let msg = "Debe loguearse para continuar";
      res.render("login", { msg });
    }
    const userId = jwt.verify(req.signedCookies.jwt, config.privateKey).id;
    if (userId === 1) {
      req.logger.INFO("Usuario autorizado");
      next();
    } else {
      const user = await userService.getById(userId);
      if (user.role === "premium") {
        req.logger.INFO("Usuario autorizado");
        next();
      } else {
        req.logger.INFO(`Usted no está autorizado`);
        res.status(403).redirect("login");
      }
    }
  } catch (error) {
    req.logger.FATAL(error.message);
    res.status(500).send(error.message);
  }
}
