const paginatedList = async (Model, req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip  = (page - 1) * limit;

  const { sortBy = 'created', sortValue = -1, filter, equal, q, fields } = req.query;

  let searchFilter = {};
  if (q && fields) {
    const fieldsArray = fields.split(',');
    searchFilter = { $or: fieldsArray.map((f) => ({ [f]: { $regex: q, $options: 'i' } })) };
  }

  let filterCondition = {};
  if (filter && equal !== undefined) {
    if (typeof equal === 'object') {
      return res.status(400).json({ success: false, result: [], message: 'Invalid filter value' });
    }
    filterCondition = { [filter]: equal };
  }

  const query = { removed: false, ...filterCondition, ...searchFilter };

  const [result, count] = await Promise.all([
    Model.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: parseInt(sortValue) })
      .exec(),
    Model.countDocuments(query),
  ]);

  const pages = Math.ceil(count / limit);
  const pagination = { page, pages, count };

  if (count > 0) {
    return res.status(200).json({
      success: true,
      result,
      pagination,
      message: 'Successfully found all documents',
    });
  }
  return res.status(203).json({
    success: true,
    result: [],
    pagination,
    message: 'Collection is empty',
  });
};
module.exports = paginatedList;
