const mongoose = require('mongoose');
const Envelope = require('@/models/appModels/Envelope');
const Notification = require('@/models/appModels/Notification');

exports.create = async (req, res) => {
  try {
    const { title, documents, signers, fields, status, auditLog } = req.body;
    
    const newEnvelope = new Envelope({
      userId: req.user._id,
      title: title || 'Untitled Document',
      documents: documents || [],
      signers: signers || [],
      fields: fields || [],
      status: status || 'draft',
      auditLog: auditLog || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await newEnvelope.save();

    // Trigger notification if sent
    if (status === 'sent') {
      await new Notification({
        userId: req.user._id,
        title: 'Document Sent',
        message: `"${saved.title}" has been sent to ${saved.signers.length} party(s).`,
        type: 'info',
        link: `/esign?id=${saved._id}`
      }).save();
    }

    return res.status(200).json({
      success: true,
      result: saved,
      message: 'Envelope created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.list = async (req, res) => {
  try {
    const result = await Envelope.find({ userId: req.user._id, removed: false }).sort({ updatedAt: -1 });
    return res.status(200).json({
      success: true,
      result,
      message: 'Envelopes retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.updatedAt = new Date();

    const updated = await Envelope.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Envelope not found',
      });
    }

    // Trigger notification on completion
    if (updates.status === 'completed') {
      await new Notification({
        userId: req.user._id,
        title: 'Document Signed',
        message: `All parties have completed "${updated.title}".`,
        type: 'success',
        link: `/esign?id=${updated._id}`
      }).save();
    }

    return res.status(200).json({
      success: true,
      result: updated,
      message: 'Envelope updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Envelope.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { removed: true },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Envelope not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Envelope deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
