const listAll = async (Model, req, res) => {
  const { sortBy = 'created', sortValue = -1 } = req.query;
  const result = await Model.find({ removed: false })
    .sort({ [sortBy]: parseInt(sortValue) })
    .exec();
  return res.status(200).json({ success: true, result, message: 'Successfully found all documents' });
};
module.exports = listAll;
