/* --------CAPA DE INTERACCION---------- */
/*
App ID: 848187

Client ID: Iv1.6d1c1b3a5778cb34
ClientSecret: 551f13b31eb6eb2b526ac1cf0ca51af93a564b4c
*/

// Libs
import express from "express";
import expressHandlebars from "express-handlebars";
import Handlebars from "handlebars";
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import { Server } from "socket.io";
import mongoose from "mongoose";
import session from "express-session";
import cookieParser from "cookie-parser";
import { addLogger } from "./logger.js";
import nodemailer from "nodemailer";

// Managers
import ProductManager from "./dao/manager_mongo/productManager.js";
import MessageManager from "./dao/manager_mongo/messageManager.js";

//Routes
import routerProducts from "./routes/products.router.js";
import routerCarts from "./routes/carts.router.js";
import routerSession from "./routes/user.router.js";
import routerViews from "./routes/views.router.js";

import { __dirname } from "./utils.js";
import initializePassport from "./config/passport.config.js";
import config from "./config/config.js";
import { productService } from "./repositories/index.js";
import { port } from "./commander.js";

const app = express();

const httpServer = app.listen(port, () => console.log("Server running in port " + port));
const socketServer = new Server(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.privateKey));

app.use(addLogger);

//Database
mongoose.connect(config.mongoUrl);

initializePassport();
app.use(
  session({
    secret: config.privateKey,
    resave: true,
    saveUninitialized: true,
  })
);

// Views
app.use(express.static(__dirname + "/public"));
app.use("/", routerViews);
app.use("/api/products", routerProducts);
app.use("/api/carts", routerCarts);
app.use("/api/sessions", routerSession);

app.engine(
  "handlebars",
  expressHandlebars.engine({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
  })
);
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");

/* --------Test de vida del servidor---------- */
app.get("/ping", (req, res) => res.status(200).send("Pong!"));
/* ------------------------------------------- */

const pm = new ProductManager();
const mm = new MessageManager();

socketServer.on("connection", (socket) => {
  console.log("Nuevo cliente conectado");

  socket.on("newProduct", async (data) => {
    const { newProduct, owner } = data;
    await productService.add(newProduct);
    const products = await productService.get({});
    const allProducts = await productService.get({ limit: products.totalDocs });
    socketServer.emit("card", { allProducts, owner });
  });

  socket.on("deleteProduct", async (data) => {
    const { prod, owner } = data;
    const product = await pm.getProductById(prod);
    const products = await productService.get({});
    if (product.owner === owner) {
      await pm.deleteProduct(prod);
      const allProducts = await productService.get({ limit: products.totalDocs });
      socketServer.emit("card", { allProducts, owner });
    } else {
      const allProducts = await productService.get({ limit: products.totalDocs });
      socketServer.emit("card", { allProducts, owner });
    }
  });

  socket.on("login", async (data) => {
    const messages = await mm.getMessages();
    socketServer.emit("chat", messages);
  });
  socket.on("newMessage", async (data) => {
    await mm.addMessage(data);
    const messages = await mm.getMessages();
    socketServer.emit("chat", messages);
  });
  socket.on("clearChat", async () => {
    await mm.clearChat();
    const messages = await mm.getMessages();
    socketServer.emit("chat", messages);
  });
});

app.get("/loggerTest", (req, res) => {
  try {
    req.logger.FATAL("Hola");
    req.logger.ERROR("Hola");
    req.logger.INFO("Hola");
    req.logger.WARN("Hola");
    req.logger.DEBUG("Hola");
    res.status(200).send("Log generado correctamente");
  } catch (error) {
    req.logger.ERROR("Error al generar el log:", error);
    res.status(500).send("Error al generar el log");
  }
});

const transport = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  auth: {
    user: "carla.apata@gmail.com",
    pass: "wfej dxoz rxos gvtw",
  },
});

app.get("/mail", async (req, res) => {
  let result = await transport.sendMail({
    from: "Carla Apata <carla.apata@gmail.com>",
    to: "Yo <carla.apata@gmail.com>",
    subject: "Recupero de contraseña",
    html: `
      <div style="background-color: #f2f2f2; padding: 20px; text-align: center;">
        <h3 style="color: #28a745;">Usted ha solicitado recuperar la contraseña</h3>
        <p style="font-family: Arial, sans-serif; color: #333;">Haga click en el siguiente botón que lo redigirá a la página de recuperación</p>
        <a href="http://localhost:8080/passwordRestore" class="btn btn-success" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff; text-decoration: none; border: 1px solid #218838; border-radius: 5px;" onmouseover="this.style.backgroundColor='#218838'; this.style.borderColor='#1e7e34'" onmouseout="this.style.backgroundColor='#28a745'; this.style.borderColor='#218838'">Recuperar Contraseña</a>
      </div>
    `,
    attachments: [],
  });
  let msg = "Se le ha enviado un correo para la recuperación de la contraseña";
  res.render("login", { msg });
});
