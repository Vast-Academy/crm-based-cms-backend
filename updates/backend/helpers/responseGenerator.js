/**
 * Utility function to generate standardized API responses
 * @param {boolean} success - Whether the request was successful
 * @param {string} message - Response message
 * @param {any} data - Response data (optional)
 * @returns {Object} Standardized response object
 */
const generateResponse = (success, message, data = null) => {
    const response = {
      success,
      message
    };
    
    if (data !== null) {
      response.data = data;
    }
    
    return response;
  };
  
  module.exports = { generateResponse };