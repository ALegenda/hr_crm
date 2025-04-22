import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create a default HR user
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: {
      email: 'hr@example.com',
      password: hashedPassword,
      name: 'HR Manager',
    },
  });

  // Create a sample vacancy with pre-generated questions
  const vacancy = await prisma.vacancy.create({
    data: {
      title: 'Senior Frontend Developer',
      description: 'We are looking for a Senior Frontend Developer to join our team.',
      skills: ['React', 'TypeScript', 'CSS', 'JavaScript'],
      requirements: 'At least 3 years of experience with React. Strong knowledge of TypeScript.',
      context: 'Our team is building a modern web application for the healthcare industry.',
    },
  });

  // Add pre-generated questions
  const questions = [
    'What is your experience with React and TypeScript?',
    'Can you describe a challenging project you worked on recently?',
    'How do you approach component design and reusability?',
    'What is your experience with state management libraries?',
    'How do you handle responsive design?',
    'How do you test your code?',
    'How do you keep up with the latest frontend technologies?',
    'What is your experience with CSS frameworks and methodologies?',
  ];

  for (const questionText of questions) {
    await prisma.question.create({
      data: {
        text: questionText,
        vacancyId: vacancy.id,
      },
    });
  }

  console.log('Database seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 