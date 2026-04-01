const express = require("express");

const app = express();
const mongoose = require("mongoose");
require("dotenv").config({ debug: false, silent: true });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const authRouter = require("./routes/Auth");
const usersRouter = require("./routes/Users");
const blogsRouter = require("./routes/Blogs");

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    app.listen(3000, () => {
      console.log("Listing on port localhost:3000/");
    });
  })
  .catch((err) => console.log(err));

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation",
    },
    servers: [{ url: "blogs-backend-production-0df8.up.railway.app" }],
  },
  // Paths to files with JSDoc annotations
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Mount Swagger UI at /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/blogs", blogsRouter);
