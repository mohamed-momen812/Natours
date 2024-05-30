module.exports = fn => {
  return async (req, res, next) => {
    // fn(req, res, next).catch(next(err));
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};
