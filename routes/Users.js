const express = require("express");
const router = express.Router();
const users = require("../models/users");
const protect = require("../middlewares/protect");
const bcrypt = require("bcryptjs");
const allowRoles = require("../middlewares/allowedRoles");

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Alice
 *         email:
 *           type: string
 *           example: alice@example.com
 *     UpdateUserBody:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: Alice Updated
 *         email:
 *           type: string
 *           example: alice@example.com
 *         password:
 *           type: string
 *           example: newSecurePassword123
 */

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Returns a list of all users. Accessible by admin only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       403:
 *         description: Forbidden – admin role required
 */
router.get("/", protect, allowRoles("admin"), async (req, res) => {
  res.status(200).json(await users.find({}, { __v: false, password: false }));
});

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Updates name, email, and password of a user. Only the user themselves can update their own account.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the user
 *         schema:
 *           type: string
 *           example: 664f1b2e8c1a2b3d4e5f6a7b
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserBody'
 *     responses:
 *       200:
 *         description: Updated user (without password, role, or internal fields)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       403:
 *         description: Forbidden – can only update your own account
 *       500:
 *         description: Server error (e.g. validation failure)
 */
router.put("/:id", protect, async (req, res) => {
  let userWithID = await users.findById(req.params.id);
  if (!userWithID) {
    return res.status(403).send({ message: "No user found!" });
  }
  if (req.params.id != req.user.id) {
    return res.status(403).send({ message: "Forbidden" });
  }

  try {
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    let newUser = await users.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        password: hashPassword,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res
      .status(200)
      .json(
        await users.findOne(
          { email: newUser.email },
          { __v: false, password: false, _id: false, role: false }
        )
      );
  } catch (error) {
    res.status(500).json(error);
  }
});

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user by ID. Users can delete their own account; admins can delete any account.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the user to delete
 *         schema:
 *           type: string
 *           example: 664f1b2e8c1a2b3d4e5f6a7b
 *     responses:
 *       204:
 *         description: Deleted successfully (no content)
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       403:
 *         description: Forbidden – not your account and not an admin
 */
router.delete("/:id", protect, async (req, res) => {
  let userWithID = await users.findById(req.params.id);
  if (!userWithID) {
    return res.status(403).send({ message: "No user found!" });
  }
  if (req.params.id != req.user.id && req.user.role != "admin") {
    return res.status(403).send({ message: "Forbidden" });
  }
  await users.findByIdAndDelete(req.params.id.trim());
  res.status(204).json({ message: "Deleted Successfully" });
});

module.exports = router;