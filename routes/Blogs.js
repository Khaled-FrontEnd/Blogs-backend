const express = require("express");
const router = express.Router();
const blogs = require("../models/blogs");
const protect = require("../middlewares/protect");

/**
 * @openapi
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 664f1b2e8c1a2b3d4e5f6a7b
 *         title:
 *           type: string
 *           example: My First Blog
 *         details:
 *           type: string
 *           example: This is the content of the blog post.
 *         userId:
 *           type: string
 *           example: 664f1b2e8c1a2b3d4e5f6a7b
 *     BlogBody:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           example: My First Blog
 *         details:
 *           type: string
 *           example: This is the content of the blog post.
 */

/**
 * @openapi
 * /blogs:
 *   get:
 *     summary: Get all blogs
 *     description: Returns a list of all blog posts. No authentication required.
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: A list of blogs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Blog'
 */
router.get("/", async (req, res) => {
  res.status(200).json(await blogs.find());
});

/**
 * @openapi
 * /blogs:
 *   post:
 *     summary: Create a new blog
 *     description: Creates a new blog post. The userId is taken from the authenticated user's token.
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlogBody'
 *     responses:
 *       201:
 *         description: Blog created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Title is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Title is required!
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       500:
 *         description: Server error
 */
router.post("/", protect, async (req, res) => {
  if (!req.body || !req.body.title) {
    return res.status(400).json({ message: "Title is required!" });
  }

  let { title, details } = req.body;

  try {
    let newBlog = await blogs.create({
      title: title,
      details: details,
      userId: req.user.id,
    });

    res.status(201).json(await newBlog);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server error" });
  }
});

/**
 * @openapi
 * /blogs/{id}:
 *   put:
 *     summary: Update a blog
 *     description: Updates a blog post by ID. Only the blog owner can update it.
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the blog to update
 *         schema:
 *           type: string
 *           example: 664f1b2e8c1a2b3d4e5f6a7b
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlogBody'
 *     responses:
 *       200:
 *         description: Blog updated successfully (returns old document before update)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Title and id are required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Title and id are required!
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       403:
 *         description: Forbidden – not the blog owner, or blog not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Forbidden
 *       500:
 *         description: Server error
 */
router.put("/:id", protect, async (req, res) => {
  if (!req.body || !req.body.title || !req.params.id) {
    return res.status(400).json({ message: "Title and id are required!" });
  }
  let { title, details } = req.body;

  let blogWithID = await blogs.findById(req.params.id);
  if (!blogWithID) {
    return res.status(403).send({ message: "No blog with this id!" });
  }
  if (req.user.id != blogWithID.userId) {
    return res.status(403).send({ message: "Forbidden" });
  }
  try {
    let editedBlog = await blogs.findByIdAndUpdate(
      req.params.id,
      { title, details },
      { new: true }
    );

    res.status(200).json(editedBlog);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
});

/**
 * @openapi
 * /blogs/{id}:
 *   delete:
 *     summary: Delete a blog
 *     description: Deletes a blog post by ID. Only the blog owner or an admin can delete it.
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the blog to delete
 *         schema:
 *           type: string
 *           example: 664f1b2e8c1a2b3d4e5f6a7b
 *     responses:
 *       201:
 *         description: Blog deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Deleted Successful!
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       403:
 *         description: Forbidden – not the blog owner or admin, or blog not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Forbidden
 *       500:
 *         description: Server error
 */
router.delete("/:id", protect, async (req, res) => {
  let blogWithID = await blogs.findById(req.params.id);

  if (!blogWithID) {
    return res.status(403).send({ message: "No blog with this id!" });
  }

  if (req.user.id != blogWithID.userId && req.user.role != "admin") {
    return res.status(403).send({ message: "Forbidden" });
  }
  try {
    await blogs.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted Successful!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
