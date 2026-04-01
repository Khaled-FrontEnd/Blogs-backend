const express = require("express");
const router = express.Router();
let generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const users = require("../models/users");

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterBody:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: Alice
 *         email:
 *           type: string
 *           example: alice@example.com
 *         password:
 *           type: string
 *           example: securePassword123
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: user
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 664f1b2e8c1a2b3d4e5f6a7b
 *         name:
 *           type: string
 *           example: Alice
 *         email:
 *           type: string
 *           example: alice@example.com
 *     LoginBody:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: alice@example.com
 *         password:
 *           type: string
 *           example: securePassword123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: loged in successefull
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account. Returns the created user without password or role.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       404:
 *         description: User already exists
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: User Already axeis!
 */
router.post("/register", async (req, res) => {
  let { name, email, password, role } = req.body;

  let oldUser = await users.findOne({ email: email });
  if (oldUser) {
    res.status(404).send("User Already axeis!");
    return;
  }
  const hashPassword = await bcrypt.hash(password, 10);
  let newUser = await users.create({
    name: name,
    email: email,
    password: hashPassword,
    role: role,
  });
  res
    .status(201)
    .json(
      await users.findById(newUser._id, {
        _v: false,
        password: false,
        role: false,
      })
    );
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticates a user and returns a signed JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       201:
 *         description: Login successful – returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Email and password are required
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Email and password are require!
 *       404:
 *         description: User not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: User not found
 *       200:
 *         description: Incorrect password
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: IncorectPassword
 */
router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).send("Email and password are require!");
  }
  let userFound = await users.findOne({ email });

  if (!userFound) {
    return res.status(404).send("User not found");
  }

  let passwordTrue = await bcrypt.compare(password, userFound.password);

  if (!passwordTrue) {
    return res.send("IncorectPassword");
  }
  if (userFound && passwordTrue) {
    res.status(201).json({
      message: "loged in successefull",
      token: generateToken(userFound._id, email, userFound.role),
    });
  }
});

module.exports = router;