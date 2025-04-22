import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { analyzeAnswers } from '../lib/openai';

const router = Router();
const prisma = new PrismaClient();

// In-memory хранилище для демо-режима
const candidatesStorage: Map<number, any[]> = new Map();
candidatesStorage.set(1, []); // Пустой массив кандидатов для вакансии 1

// Get candidates for a specific vacancy
router.get('/vacancy/:vacancyId', async (req: Request, res: Response) => {
  try {
    const vacancyId = parseInt(req.params.vacancyId);
    
    const candidates = await prisma.candidate.findMany({
      where: { vacancyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        analysis: true
      }
    });
    
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch candidates' });
    }
  }
});

// Get a single candidate
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        Vacancy: {
          select: {
            title: true,
            questions: {
              select: {
                id: true,
                text: true
              }
            }
          }
        }
      }
    });
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch candidate' });
    }
  }
});

// Submit candidate answers
router.post('/submit', async (req: Request, res: Response) => {
  try {
    // Input validation schema
    const submitSchema = z.object({
      vacancyId: z.number(),
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      answers: z.record(z.string(), z.string())
    });
    
    const data = submitSchema.parse(req.body);
    
    // Get vacancy details for analysis
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: data.vacancyId },
      include: { 
        questions: {
          select: {
            id: true,
            text: true
          }
        }
      }
    });
    
    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }
    
    // Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        vacancyId: data.vacancyId,
        answers: data.answers as any,
        analysis: {} // Will be updated after analysis
      }
    });
    
    // Prepare questions and answers for analysis
    const qaList = vacancy.questions.map((question: { id: number; text: string }) => ({
      question: question.text,
      answer: data.answers[question.id.toString()] || ''
    }));
    
    // Analyze answers using OpenAI
    const analysis = await analyzeAnswers(
      vacancy.title,
      vacancy.description,
      vacancy.skills as string[],
      vacancy.requirements,
      qaList
    );
    
    // Update candidate with analysis
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { analysis: analysis as any }
    });
    
    res.status(201).json({ 
      id: candidate.id,
      message: 'Candidate submission successful',
      analysis
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    console.error('Error submitting candidate:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred during analysis' });
    }
  }
});

export default router; 