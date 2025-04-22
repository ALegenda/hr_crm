import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface QuestionsResponse {
  questions: string[];
}

interface AnalysisResponse {
  summary: string;
  skills: {
    [key: string]: number;
  };
  fit: number;
  recommendation: string;
}

export async function generateQuestions(
  title: string,
  description: string,
  skills: string[],
  requirements: string,
  context: string
): Promise<string[]> {
  const prompt = `
    ВАЖНО: ВСЕ ВОПРОСЫ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ.
    
    Вы HR-специалист, создающий опросник для вакансии.
    
    Название должности: ${title}
    Описание должности: ${description}
    Необходимые навыки: ${skills.join(', ')}
    Требования: ${requirements}
    Контекст компании: ${context}
    
    Создайте 8-12 релевантных вопросов для оценки кандидатов на эту должность.
    ВСЕ ВОПРОСЫ ДОЛЖНЫ БЫТЬ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ.
    
    Верните ТОЛЬКО массив вопросов в формате JSON: {"questions": ["Вопрос 1", "Вопрос 2", ...]}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    const parsedResponse = JSON.parse(content) as QuestionsResponse;
    return parsedResponse.questions;
  } catch (error) {
    console.error('Error generating questions with OpenAI:', error);
    // Fallback to default questions if OpenAI fails
    return [
      "Какой релевантный опыт вы имеете для этой позиции?",
      "Опишите сложный проект, над которым вы недавно работали.",
      "Как вы следите за последними тенденциями в отрасли?",
      "Каковы ваши главные профессиональные сильные стороны?",
      "Как вы справляетесь со сжатыми сроками и давлением?",
      "Опишите ваш подход к решению проблем.",
      "Каковы ваши карьерные цели на ближайшие 3-5 лет?",
      "Почему вас интересует эта должность?"
    ];
  }
}

export async function analyzeAnswers(
  jobTitle: string,
  jobDescription: string,
  skills: string[],
  requirements: string,
  qaList: { question: string; answer: string }[]
): Promise<AnalysisResponse> {
  const questionsAndAnswers = qaList
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer || 'No answer'}`)
    .join('\n\n');

  const prompt = `
    ВАЖНО: ВСЕ ОТВЕТЫ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ.
    
    Вы HR-специалист, анализирующий ответы кандидата на вопросы собеседования.
    
    Название должности: ${jobTitle}
    Описание должности: ${jobDescription}
    Необходимые навыки: ${skills.join(', ')}
    Требования к должности: ${requirements}
    
    Вопросы и ответы:
    ${questionsAndAnswers}
    
    Проанализируйте ответы кандидата и предоставьте структурированную оценку.
    ВЕСЬ ОТВЕТ ДОЛЖЕН БЫТЬ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ.
    
    Верните ТОЛЬКО JSON-объект следующего формата:
    {
      "summary": "Краткое резюме общего профиля кандидата",
      "skills": {
        "навык1": оценка (1-10),
        "навык2": оценка (1-10),
        ...
      },
      "fit": общая оценка соответствия (1-10),
      "recommendation": "Нанять/Рассмотреть/Отклонить с кратким обоснованием"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    return JSON.parse(content) as AnalysisResponse;
  } catch (error) {
    console.error('Error analyzing answers with OpenAI:', error);
    // Fallback to basic analysis if OpenAI fails
    return {
      summary: "Не удалось сгенерировать AI-анализ. Требуется ручная проверка.",
      skills: skills.reduce((acc, skill) => ({ ...acc, [skill]: 5 }), {}),
      fit: 5,
      recommendation: "Рассмотреть - AI-анализ недоступен, пожалуйста, проверьте вручную"
    };
  }
}

export default openai; 