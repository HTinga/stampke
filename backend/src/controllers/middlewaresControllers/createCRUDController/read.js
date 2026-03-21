const read = async (Model, req, res) => {
  const result = await Model.findOne({ _id: req.params.id, removed: false });
  if (!result)
    return res.status(404).json({ success: false, result: null, message: 'Document not found' });
  return res.status(200).json({ success: true, result, message: 'Successfully found document' });
};
module.exports = read;
