import { Router, type Request, type Response } from 'express';

export const authRouter = Router();

authRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const identifier = (username || email || '').trim().toLowerCase();
  const pwd = (password || '').trim();

  // Validate credentials: username or email 'ayari' and password 'ayari'
  if ((identifier === 'ayari' || identifier === 'ayari@grandazur.com') && pwd === 'ayari') {
    res.json({
      success: true,
      message: 'Authentication successful. Welcome back, Ayari.',
      user: {
        username: 'ayari',
        name: 'Ayari',
        email: 'ayari@grandazur.com',
        role: 'General Manager',
        avatar: 'GM',
        permissions: ['admin', 'all'],
      },
      token: 'grand_azur_session_token_' + Date.now(),
    });
    return;
  }

  res.status(401).json({
    success: false,
    error: 'Invalid credentials. Please use username: ayari, password: ayari.',
  });
});

authRouter.get('/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.includes('grand_azur')) {
    res.json({
      authenticated: true,
      user: {
        username: 'ayari',
        name: 'Ayari',
        email: 'ayari@grandazur.com',
        role: 'General Manager',
        avatar: 'GM',
      },
    });
    return;
  }

  res.status(401).json({ authenticated: false, error: 'Unauthorized' });
});

authRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});
