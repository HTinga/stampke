const supabase = require('@/config/supabase');

const create        = require('./create');
const read          = require('./read');
const update        = require('./update');
const remove        = require('./remove');
const search        = require('./search');
const filter        = require('./filter');
const summary       = require('./summary');
const listAll       = require('./listAll');
const paginatedList = require('./paginatedList');

// Helper to map model names to Supabase tables (pluralized, lowercase)
const modelToTable = (modelName) => {
  const mapping = {
    'User':          'users',
    'Client':        'clients',
    'Invoice':       'invoices',
    'Envelope':      'envelopes',
    'Payment':       'payments',
    'Job':           'jobs',
    'WorkerProfile': 'worker_profiles',
    'Setting':       'settings',
  };
  return mapping[modelName] || modelName.toLowerCase() + 's';
};

const createCRUDController = (modelName) => {
  const table = modelToTable(modelName);

  return {
    create:      (req, res) => create(table, req, res),
    read:        (req, res) => read(table, req, res),
    update:      (req, res) => update(table, req, res),
    delete:      (req, res) => remove(table, req, res),
    list:        (req, res) => paginatedList(table, req, res),
    listAll:     (req, res) => listAll(table, req, res),
    search:      (req, res) => search(table, req, res),
    filter:      (req, res) => filter(table, req, res),
    summary:     (req, res) => summary(table, req, res),
  };
};

module.exports = createCRUDController;

