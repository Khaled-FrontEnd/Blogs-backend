const mongoose = require("mongoose");
const { Schema } = mongoose;

const blogsModel = new Schema({
  title: { type: String, required: true },
  details: { type: String},
  userId: { type: String, required: true },
});

const blogs = mongoose.model("Blogs", blogsModel);

module.exports = blogs;
