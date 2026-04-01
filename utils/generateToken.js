var jwt = require("jsonwebtoken");
let generateToken = (id, email, role) => {
    var token = jwt.sign({id: id, email: email, role: role }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
    return token
};
module.exports = generateToken;
