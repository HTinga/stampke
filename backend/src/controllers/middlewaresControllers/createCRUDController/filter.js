const filter = async (Model, req, res) => {
  const { filter: filterField, equal, page = 1, items = 10 } = req.query;
  const limit = parseInt(items);
  const skip  = (parseInt(page) - 1) * limit;
  const query = { removed: false, ...(filterField && equal ? { [filterField]: equal } : {}) };
  const [result, count] = await Promise.all([
    Model.find(query).skip(skip).limit(limit).exec(),
    Model.countDocuments(query),
  ]);
  return res.status(200).json({
    success: true,
    result,
    pagination: { page: parseInt(page), pages: Math.ceil(count / limit), count },
    message: 'Filter results',
  });
};
module.exports = filter;
