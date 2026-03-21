// Auto-register all models so createCRUDController can reference them by name
const modelsFiles = ['Client', 'Invoice', 'Payment', 'Job', 'WorkerProfile'];

// Load all models
require('../coreModels/User');
require('../coreModels/UserPassword');
require('../coreModels/Setting');
require('../appModels/Client');
require('../appModels/Invoice');
require('../appModels/Payment');
require('../appModels/Job');
require('../appModels/WorkerProfile');

module.exports = { modelsFiles };
