const { verifyToken } = require('../utils/jwt');
const db = require('../models');

/**
 * Middleware para proteger rutas que requieren autenticación
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Obtener token del header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token no proporcionado'
      });
    }

    // Verificar token
    const decoded = verifyToken(token);

    // Buscar usuario
    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    // Adjuntar usuario a la request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Token inválido',
      error: error.message
    });
  }
};

/**
 * Middleware para autorizar según roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rol ${req.user.role} no autorizado para esta acción`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
