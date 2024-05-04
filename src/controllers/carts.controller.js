import CartManager from "../dao/manager_mongo/cartsManager.js";
import { NotFound } from "../test/customError.js";

const cm = new CartManager();
export async function getCarts(req, res) {
  try {
    const carts = await cm.getCarts();
    req.logger.INFO(`Se devolvieron todos los carritos`);
    res.status(200).send(carts);
  } catch (error) {
    req.logger.ERROR(error.message);
    res.status(500).send(error.message);
  }
}

export async function getCartById(req, res) {
  try {
    const cart = await cm.getCartById(req.params.cid);
    req.logger.INFO(`Se devuelve el carrito: ${req.params.cid}`);
    res.status(200).send(cart);
  } catch (error) {
    if (error instanceof NotFound) {
      req.logger.ERROR(`No se encontró el carrito`);
      res.status(404).send(`No se encontró el carrito`);
    } else {
      req.logger.FATAL(error.message);
      res.status(500).send(error.message);
    }
  }
}

export async function addCart(req, res) {
  try {
    await cm.addCart();
    req.logger.INFO(`Se agregó un nuevo carrito`);
    res.status(200).send("Se agregó correctamente el carrito");
  } catch (error) {
    req.logger.FATAL(error.message);
    res.status(500).send(error.message);
  }
}

export async function addProductInCart(req, res) {
  try {
    await cm.updateCart(req.params.cid, req.params.pid);
    req.logger.INFO(`Se agregó un producto al carrito`);
    res.status(200).send("Producto añadido al carrito");
  } catch (error) {
    if (error instanceof NotFound) {
      req.logger.ERROR(error.message);
      res.status(404).send(error.message);
    } else {
      req.logger.FATAL(error.message);
      res.status(500).send(error.message);
    }
  }
}

export async function deleteProduct(req, res) {
  try {
    await cm.deleteProduct(req.params.cid, req.params.pid);
    req.logger.INFO(`Se eliminó un producto del carrito`);
    res.status(200).send("Producto eliminado del carrito");
  } catch (error) {
    if (error instanceof NotFound) {
      res.status(404).send(error.message);
    } else {
      req.logger.ERROR(error.message);
      res.status(500).send(error.message);
    }
  }
}

export async function cleanCartById(req, res) {
  try {
    await cm.cleanCartById(req.params.cid);
    req.logger.INFO(`Se vació el carrito`);
    res.status(200).send("Se vació el carrito");
  } catch (error) {
    if (error instanceof NotFound) {
      res.status(404).send(error.message);
    } else {
      req.logger.ERROR(error.message);
      res.status(500).send(error.message);
    }
  }
}

export async function updateProductsInCart(req, res) {
  try {
    await cm.updateProductsInCart(req.params.cid, req.body);
    req.logger.INFO(`Se actualizaron los productos en el carrito`);
    res.status(200).send("Carrito actualizado");
  } catch (error) {
    if (error instanceof NotFound) {
      res.status(404).send(error.message);
    } else {
      req.logger.ERROR(error.message);
      res.status(500).send(error.message);
    }
  }
}

export async function updateProductsQuantityInCart(req, res) {
  try {
    await cm.updateProductsQuantityInCart(req.params.cid, req.params.pid, req.body);
    req.logger.INFO(`Se actualizó la cantidad de un producto en el carrito`);
    res.status(200).send("Cantidad de productos actualizados en el carrito");
  } catch (error) {
    if (error instanceof NotFound) {
      res.status(404).send(error.message);
    } else {
      req.logger.ERROR(error.message);
      res.status(500).send(error.message);
    }
  }
}

export async function purchase(req, res) {
  try {
    await cm.purchase(req.params.cid);
    req.logger.INFO(`Compra realizada con éxito`);
    res.status(200).send("Compra realizada con éxito");
  } catch (error) {
    if (error instanceof NotFound) {
      res.status(404).send(error.message);
    } else {
      req.logger.ERROR(error.message);
      res.status(500).send(error.message);
    }
  }
}
