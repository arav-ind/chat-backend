const jwt = require('jsonwebtoken');

const generateJWT = (id) => {
    return jwt.sign({_id: id}, process.env.SECRET, {
        expiresIn: '30d'
    });
}

module.exports = generateJWT;