// Success Response
const successResponse = (message, data = null, statusCode = 200) => {
    return {
      message,
      data,
      statusCode,
    };
  };
  
  // Error Response
  const errorResponse = (message, statusCode = 500, data = null) => {
    return {
      message,
      data,
      statusCode,
    };
  };
  
  module.exports = { successResponse, errorResponse };
  