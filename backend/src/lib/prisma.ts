import { PrismaClient } from '@prisma/client';

// Обеспечиваем единый экземпляр Prisma во всем приложении
let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  // Проверка соединения с БД
  prisma.$connect()
    .then(() => {
      console.log('Successfully connected to database');
    })
    .catch((e: Error) => {
      console.error('Failed to connect to database', e);
    });
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  
  // Создаем заглушку Prisma для демо-режима
  prisma = createMockPrismaClient();
}

function createMockPrismaClient() {
  // Mock functions for demo
  console.warn('⚠️ Using mock Prisma client for demo purposes');
  
  // Базовый пользователь для демонстрации
  const demoUser = {
    id: 1,
    email: 'hr@example.com',
    password: 'password123',
    name: 'HR Manager',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Mock-реализация методов Prisma
  const mockPrisma: any = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.email === 'hr@example.com') {
          return demoUser;
        }
        return null;
      }
    },
    
    // Другие методы могут быть добавлены по мере необходимости
    
    $connect: async () => console.log('Mock Prisma connected'),
    $disconnect: async () => console.log('Mock Prisma disconnected')
  };
  
  return mockPrisma as PrismaClient;
}

export default prisma; 