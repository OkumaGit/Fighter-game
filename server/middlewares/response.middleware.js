const responseMiddleware = (req, res, next) => {
  try {
    if (res.err) {
      const message =
        res.err && res.err.message ? res.err.message : String(res.err);
      return res.status(400).json({ error: true, message });
    }

    // If controller explicitly set data to null or undefined -> not found
    if (res.data === undefined || res.data === null) {
      return res.status(404).json({ error: true, message: "Not found" });
    }

    return res.status(200).json(res.data);
  } catch (err) {
    return res
      .status(400)
      .json({ error: true, message: err.message || String(err) });
  }
};

export { responseMiddleware };
