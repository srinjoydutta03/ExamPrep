//Controllers and routes for users API (login, logout, sign up, user info query, etc.)

import express from "express";
import bcrypt from "bcrypt";
import { User } from "../database/schema.js";
import { userLoggedIn, userNotLoggedIn, userIsAdmin } from "../middleware/user_middleware.js";
const router = express.Router();

export const DEFAULT_HASH_ROUNDS = 12;

//From root, the routes should be:
//POST /user/signup
//POST /user/login
//POST /user/logout
//GET /user/(me|info)?
//GET /user/:id

router.post("/signup", userNotLoggedIn, async (req, res) => {
  if(!req.body) return res.sendStatus(400);
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json("Name, email, password required");
  if (await User.findOne({ email }).exec())
    return res.status(409).json("Email already in use");

  const hashedPassword = await bcrypt.hash(password, DEFAULT_HASH_ROUNDS);
  const newUser = await User.create({ name, email, password: hashedPassword });
  console.log(newUser);

  return res.sendStatus(201);
});

router.post("/login", userNotLoggedIn, async (req, res) => {
  if(!req.body) return res.sendStatus(400);
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json("Email and password required");
  const user = await User.findOne({ email }).exec();
  if (!user) return res.status(401).json("Invalid email or password");
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json("Invalid email or password");
  req.session.user = user;
  return res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  });;
});

router.post("/logout", userLoggedIn, (req, res) => {
  req.session.destroy();
  return res.sendStatus(200);
});

//Return information of logged in user/me (except password)
router.get(/^\/(me|info)?$/, userLoggedIn, (req, res) => {
  const user = req.session.user;
  return res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  });
});

//Return information of another user (but not password or isAdmin)
router.get("/:id", async (req, res) => {
  if(!req.params) return res.sendStatus(400);
  const user = await User.findById(req.params.id).exec();
  if (!user) return res.sendStatus(404);
  return res.json({ _id: user._id, name: user.name, email: user.email });
});

//If admin, make this other user admin as well
//Pass {isAdmin: true} as JSON body to make admin
router.put("/:id", userIsAdmin, async (req, res) => {
  if(!req.body || !req.params) return res.sendStatus(400);
  const user = await User.findById(req.params.id).exec();
  if (!user) return res.sendStatus(404);
  const isAdmin = req.body.isAdmin;
  user.isAdmin = !!isAdmin;
  await user.save();
  return res.sendStatus(200);
});

export default router;
