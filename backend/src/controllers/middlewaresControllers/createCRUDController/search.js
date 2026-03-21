const search = async (Model, req, res) => {
  const { q = '', fields = '', page = 1, items = 10 } = req.query;
  const limit = parseInt(items);
  const skip  = (parseInt(page) - 1) * limit;

  const fieldsArray = fields ? fields.split(',') : [];
  const filter =
    fieldsArray.length > 0
      ? { removed: false, $or: fieldsArray.map((f) => ({ [f]: { $regex: q, $options: 'i' } })) }
      : { removed: false };

  const [result, count] = await Promise.all([
    Model.find(filter).skip(skip).limit(limit).exec(),
    Model.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    result,
    pagination: { page: parseInt(page), pages: Math.ceil(count / limit), count },
    message: 'Search results',
  });
};
module.exports = search;
