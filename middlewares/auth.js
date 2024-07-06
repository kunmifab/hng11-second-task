const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
    try{
        const token = req.header('x-auth-token');
        if(!token) return res.status(401).send({
            "status": "Bad request",
            "message": "Authentication failed",
            "statusCode": 401
        });
        
        const decoded = await jwt.verify(token, process.env.jwtPrivateKey);
        if(!decoded) return res.status(401).send({
            "status": "Bad request",
            "message": "Authentication failed",
            "statusCode": 401
        });
        req.user = decoded;
        next();
    }catch(ex){
        console.log(ex.message);
        return res.status(401).send({
            "status": "Bad request",
            "message": "Authentication failed",
            "statusCode": 401
        });
    }
    

}