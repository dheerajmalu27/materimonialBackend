export const validate = (schema) => (req, res, next) => {
  const errors = [];

  // Validate body if schema has body validation
  if (schema.body) {
    const { error } = schema.body.validate(req.body, { abortEarly: false });
    if (error) {
      errors.push(...error.details.map((d) => d.message));
    }
  }

  // Validate params if schema has params validation
  if (schema.params) {
    const { error } = schema.params.validate(req.params, { abortEarly: false });
    if (error) {
      errors.push(...error.details.map((d) => d.message));
    }
  }

  // Validate query if schema has query validation
  if (schema.query) {
    const { error } = schema.query.validate(req.query, { abortEarly: false });
    if (error) {
      errors.push(...error.details.map((d) => d.message));
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};
