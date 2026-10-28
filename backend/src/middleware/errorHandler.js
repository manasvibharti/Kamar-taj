import { AppError } from '../utils/AppError.js';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    const errorBody = {
      code: err.code,
      message: err.message,
    };
    if (err.details !== null && err.details !== undefined) {
      errorBody.details = err.details;
    }
    return res.status(err.statusCode).json({ error: errorBody });
  }

  // Handle SyntaxError for bad JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload in request body',
      },
    });
  }

  console.error('[UNHANDLED_ERROR]', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred.',
    },
  });
};

