const summary = async (Model, req, res) => {
  const countAllDocs = await Model.countDocuments({ removed: false });
  let countFilter = countAllDocs;
  if (req.query.filter && req.query.equal) {
    countFilter = await Model.countDocuments({
      removed: false,
      [req.query.filter]: req.query.equal,
    });
  }
  return res.status(200).json({
    success: true,
    result: { countFilter, countAllDocs },
    message: 'Summary complete',
  });
};
module.exports = summary;
