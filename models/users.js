const mongoose = require("mongoose");
const { Schema } = mongoose;

const usersModel = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
});

const users = mongoose.model("users", usersModel);

module.exports = users;
