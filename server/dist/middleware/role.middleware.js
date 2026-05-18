"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Access unauthorized. Session validation is required.'
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Access forbidden. You do not possess the authorization for this transaction.'
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
