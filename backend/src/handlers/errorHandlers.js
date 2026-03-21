'use strict';

// Catch Errors Handler
// With async/await, you need some way to catch errors.
// Instead of try/catch in each controller, wrap the function in catchErrors()
exports.catchErrors = (fn) => {
  return function (req, res, next) {
    return fn(req, res, next).catch((error) => {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Required fields are not supplied',
          controller: fn.name,
          error,
        });
      }
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
        controller: fn.name,
        error,
      });
    });
  };
};

// 404 handler
exports.notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    result: null,
    message: `Route ${req.path} not found.`,
  });
};

// Production error handler
exports.productionErrors = (error, req, res, next) => {
  return res.status(500).json({
    success: false,
    result: null,
    message: error.message,
    error,
  });
};
