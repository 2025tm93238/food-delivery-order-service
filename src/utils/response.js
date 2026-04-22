const success = (req, res, data, status = 200) => {
  return res.status(status).json({
    data,
    correlationId: req.correlationId,
  });
};

module.exports = { success };
