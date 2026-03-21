const remove = async (Model, req, res) => {
  const result = await Model.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { removed: true },
    { new: true }
  );
  if (!result)
    return res.status(404).json({ success: false, result: null, message: 'Document not found' });
  return res.status(200).json({ success: true, result, message: 'Successfully deleted document' });
};
module.exports = remove;
