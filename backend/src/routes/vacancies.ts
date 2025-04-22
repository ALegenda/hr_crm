import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { generateQuestions } from '../lib/openai';

const router = Router();

// In-memory хранилище для хранения вопросов вакансии
const vacancyQuestions = new Map();

// Инициализация стандартного набора вопросов
const defaultQuestions = [
  { id: 1, text: 'What is your experience with React and TypeScript?' },
  { id: 2, text: 'Can you describe a challenging project you worked on recently?' },
  { id: 3, text: 'How do you approach component design and reusability?' },
  { id: 4, text: 'What is your experience with state management libraries?' },
  { id: 5, text: 'How do you handle responsive design?' },
  { id: 6, text: 'How do you test your code?' },
  { id: 7, text: 'How do you keep up with the latest frontend technologies?' },
  { id: 8, text: 'What is your experience with CSS frameworks and methodologies?' }
];

// Устанавливаем дефолтные вопросы для вакансии с ID 1
vacancyQuestions.set(1, defaultQuestions);

// Get all vacancies
router.get('/', async (_req: Request, res: Response) => {
  try {
    const vacancies = await prisma.vacancy.findMany({
      select: {
        id: true,
        title: true,
        skills: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            candidates: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(vacancies);
  } catch (error) {
    console.error('Error fetching vacancies:', error);
    res.status(500).json({ error: 'Failed to fetch vacancies' });
  }
});

// Get a single vacancy
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vacancyId = parseInt(id);
    
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: vacancyId },
      include: { questions: true }
    });
    
    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }
    
    res.json(vacancy);
  } catch (error) {
    console.error('Error fetching vacancy:', error);
    res.status(500).json({ error: 'Failed to fetch vacancy' });
  }
});

// Create a new vacancy (requires authentication)
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('POST /vacancies - Received request with body:', req.body);
    console.log('Headers:', req.headers);
    
    const { title, description, skills, requirements, context } = req.body;
    
    if (!title || !description) {
      console.log('Validation failed: missing title or description');
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    console.log('Creating vacancy with data:', { title, description, skills, requirements, context });
    
    const vacancy = await prisma.vacancy.create({
      data: {
        title,
        description,
        skills,
        requirements,
        context,
      },
    });
    
    console.log('Vacancy created successfully:', vacancy);
    
    res.status(201).json(vacancy);
  } catch (error) {
    console.error('Error creating vacancy:', error);
    res.status(500).json({ error: 'Failed to create vacancy' });
  }
});

// Update a vacancy (requires authentication)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vacancyId = parseInt(id);
    const { title, description, skills, requirements, context } = req.body;
    
    const vacancy = await prisma.vacancy.update({
      where: { id: vacancyId },
      data: {
        title,
        description,
        skills,
        requirements,
        context,
      },
    });
    
    res.json(vacancy);
  } catch (error) {
    console.error('Error updating vacancy:', error);
    res.status(500).json({ error: 'Failed to update vacancy' });
  }
});

// Delete a vacancy (requires authentication)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vacancyId = parseInt(id);
    
    await prisma.vacancy.delete({
      where: { id: vacancyId },
    });
    
    res.json({ message: 'Vacancy deleted successfully' });
  } catch (error) {
    console.error('Error deleting vacancy:', error);
    res.status(500).json({ error: 'Failed to delete vacancy' });
  }
});

// Generate quiz for a vacancy
router.post('/:id/generate-quiz', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vacancyId = parseInt(id);
    
    // Get the vacancy details
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: vacancyId },
    });
    
    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }
    
    console.log(`Generating quiz for vacancy ${vacancyId}`);
    
    try {
      // Generate questions using OpenAI
      const questionsData = await generateQuestions(
        vacancy.title,
        vacancy.description,
        vacancy.skills,
        vacancy.requirements,
        vacancy.context
      );
      
      // Delete existing questions
      await prisma.question.deleteMany({
        where: { vacancyId },
      });
      
      // Create new questions
      const questions = await prisma.question.createMany({
        data: questionsData.map(text => ({ 
          text,
          vacancyId
        })),
      });
      
      // Fetch the newly created questions to return them
      const createdQuestions = await prisma.question.findMany({
        where: { vacancyId },
      });
      
      console.log(`Generated ${createdQuestions.length} new questions`);
      
      res.json(createdQuestions);
    } catch (error) {
      console.error('Error with OpenAI question generation:', error);
      res.status(500).json({ error: 'Failed to generate questions with AI' });
    }
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Get all questions for a vacancy
router.get('/:id/questions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vacancyId = parseInt(id);
    
    const questions = await prisma.question.findMany({
      where: { vacancyId },
      orderBy: { id: 'asc' }
    });
    
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Add a new question to a vacancy
router.post('/:id/questions', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vacancyId = parseInt(id);
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Question text is required' });
    }
    
    const question = await prisma.question.create({
      data: {
        text,
        vacancyId
      }
    });
    
    res.status(201).json(question);
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Update a question
router.put('/questions/:questionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const questionIdInt = parseInt(questionId);
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Question text is required' });
    }
    
    const question = await prisma.question.update({
      where: { id: questionIdInt },
      data: { text }
    });
    
    res.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete a question
router.delete('/questions/:questionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const questionIdInt = parseInt(questionId);
    
    await prisma.question.delete({
      where: { id: questionIdInt }
    });
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router; 