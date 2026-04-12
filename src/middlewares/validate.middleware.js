export const validate = (schema) => (req, res, next) => {
  const errors = [];
  const messages = [];

  const collectErrors = (error, source) => {
    if (!error) return;
    const details = Array.isArray(error.details) ? error.details : [];
    details.forEach((detail) => {
      const detailMessage = String(detail?.message || 'Validation error').trim();
      messages.push(detailMessage);
      errors.push({
        source,
        field: Array.isArray(detail?.path) ? detail.path.join('.') : '',
        message: detailMessage,
      });
    });

    if (details.length === 0) {
      const fallbackMessage = String(error?.message || 'Validation error').trim();
      messages.push(fallbackMessage);
      errors.push({ source, field: '', message: fallbackMessage });
    }
  };

  const isDirectJoiSchema = schema && typeof schema.validate === 'function';

  if (isDirectJoiSchema) {
    const { error } = schema.validate(req.body, { abortEarly: false });
    collectErrors(error, 'body');
  }

  // Validate body if schema has body validation
  if (!isDirectJoiSchema && schema.body) {
    const { error } = schema.body.validate(req.body, { abortEarly: false });
    collectErrors(error, 'body');
  }

  // Validate params if schema has params validation
  if (!isDirectJoiSchema && schema.params) {
    const { error } = schema.params.validate(req.params, { abortEarly: false });
    collectErrors(error, 'params');
  }

  // Validate query if schema has query validation
  if (!isDirectJoiSchema && schema.query) {
    const { error } = schema.query.validate(req.query, { abortEarly: false });
    collectErrors(error, 'query');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: messages[0] || errors[0]?.message || 'Validation error',
      errors,
    });
  }

  next();
};
