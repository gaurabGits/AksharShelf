const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    // token format: Bearer <token>
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Store both ID and role together
            req.user = {
                id: decoded.userId,
                role: decoded.userRole
            };

            // req.user = decoded; 
            next(); // allow request 

        } catch (error) {
            return res.status(401).json({message:"Not authorized, token failed"})
        }
    }
    if(!token){
        return res.status(401).json({message:"Not authorized, no token"});
    }
};

const optionalProtect = (req, _res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                id: decoded.userId,
                role: decoded.userRole
            };
        } catch (_error) {
            // Ignore invalid token on optional auth routes.
        }
    }
    next();
};


module.exports = { protect, optionalProtect };
