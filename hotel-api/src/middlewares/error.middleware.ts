import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Unhandled Application Error:', err);

  const message = String(err?.message ?? err);

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Malformed JSON payload in request body.',
    });
    return;
  }

  if (message.startsWith('OLLAMA_OFFLINE:')) {
    res.status(503).json({
      error: 'AI service unavailable: Ollama is not running or unreachable.',
      details: message.replace('OLLAMA_OFFLINE: ', ''),
      hint: 'Ensure Ollama is started locally (e.g., run "ollama serve").',
    });
    return;
  }

  if (message.startsWith('OLLAMA_MODEL_MISSING:')) {
    res.status(503).json({
      error: 'AI model not found in Ollama.',
      details: message.replace('OLLAMA_MODEL_MISSING: ', ''),
      hint: 'Run "ollama pull qwen2.5:7b" in your terminal.',
    });
    return;
  }

  const isNetworkFailure = /ECONNREFUSED|fetch failed|ENOTFOUND/.test(String(err?.cause ?? message));
  if (isNetworkFailure) {
    res.status(503).json({
      error: 'Downstream service dependency is currently unreachable (Ollama or MongoDB).',
      details: message,
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? message : undefined,
  });
}
