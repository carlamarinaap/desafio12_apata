import passport from "passport";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { userService } from "../repositories/index.js";
import { verifyEmailToken } from "../config/passport.config.js";

export async function register(req, res, next) {
  passport.authenticate("register", async (err, user) => {
    try {
      if (err) {
        return res.redirect(`/failRegister?msg=${err}`);
      }
      if (!user) {
        return res.redirect("/failRegister?msg=Debe completar todos los campos");
      }
      res.cookie("jwt", user.token, {
        signed: true,
        httpOnly: true,
        maxAge: 1000 * 60 * 60,
      });
      res.redirect("/products");
    } catch (error) {
      req.logger.ERROR(error.message);
      next(error);
    }
  })(req, res, next);
}

export async function login(req, res, next) {
  passport.authenticate("login", async (err, user, info) => {
    try {
      if (err) {
        return res.redirect(`/faillogin?msg=${err}`);
      }
      if (!user) {
        console.log(info);
        return res.redirect(`/faillogin?msg=${info.message}`);
      }
      res
        .cookie("jwt", user.token, {
          signed: true,
          httpOnly: true,
          maxAge: 1000 * 60 * 60,
        })
        .redirect("/products");
    } catch (error) {
      req.logger.ERROR(error.message);
      next(error);
    }
  })(req, res, next);
}

export async function logout(req, res) {
  try {
    res.clearCookie("jwt");
    let msg = "Se cerró la sesión";
    res.render("login", { msg });
  } catch (error) {
    req.logger.ERROR(error.message);
    res.status(500).send(error.message);
  }
}

export async function passwordRestore(req, res) {
  try {
    let { email, password, confirm } = req.body;
    const token = req.cookies.emailToken;
    const isValidToken = verifyEmailToken(token);
    if (!isValidToken) {
      let msg = "El enlace ha expirado";
      return res.render("login", { msg });
    }
    const user = await userService.getByEmail(email);

    if (user && password && confirm && password === confirm) {
      const currentPassword = await userService.getByCreds(email, password);
      if (!currentPassword) {
        await userService.updatePassword(email, password);
        let msg = "Contraseña cambiada con éxito";
        res.render("login", { msg });
      } else {
        let msg = "No puede utilizar la contraseña anterior";
        res.render("login", { msg });
      }
    }
  } catch (error) {
    req.logger.ERROR(error.message);
    res.status(500).send(error.message);
  }
}

export async function current(req, res) {
  try {
    let user;
    if (req.signedCookies.jwt) {
      const userId = jwt.verify(req.signedCookies.jwt, config.privateKey).id;
      if (userId === 1) {
        user = config.userAdmin;
      } else {
        user = await userService.getById(userId);
      }
    } else {
      res.status(400).json("Nadie logueado");
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

export async function githubcallbackapata(req, res) {
  try {
    res.cookie("jwt", req.user.token, {
      signed: true,
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    });
    res.redirect("/products");
  } catch (error) {
    res.status(500).send(error.message);
  }
}

export async function changeRole(req, res) {
  try {
    const user = await userService.getById(req.params.uid);
    if (user && user.role === "premium") {
      await userService.updateRole(user.email, "user");
    }
    if (user && user.role === "user") {
      await userService.updateRole(user.email, "premium");
    }
    res.status(200).send("Rol del usuario cambiado con éxito");
  } catch (error) {}
}

export async function githubLogin(req, res) {}
