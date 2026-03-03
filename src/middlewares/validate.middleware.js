export const validate = (schema) => (req, res, next) => {
  const errors = [];

  const isDirectJoiSchema = schema && typeof schema.validate === 'function';

  if (isDirectJoiSchema) {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      errors.push(...error.details.map((d) => d.message));
    }
  }

  // Validate body if schema has body validation
  if (!isDirectJoiSchema && schema.body) {
    const { error } = schema.body.validate(req.body, { abortEarly: false });
    if (error) {
      errors.push(...error.details.map((d) => d.message));
    }
  }

  // Validate params if schema has params validation
  if (!isDirectJoiSchema && schema.params) {
    const { error } = schema.params.validate(req.params, { abortEarly: false });
    if (error) {
      errors.push(...error.details.map((d) => d.message));
    }
  }

  // Validate query if schema has query validation
  if (!isDirectJoiSchema && schema.query) {
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
