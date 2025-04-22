import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Используем заглушку для демонстрации
    if (email === 'hr@example.com' && password === 'password123') {
      const token = jwt.sign(
        { userId: 1, email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1d' }
      );

      return res.json({
        token,
        user: {
          id: 1,
          email,
          name: 'HR Manager',
        },
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 