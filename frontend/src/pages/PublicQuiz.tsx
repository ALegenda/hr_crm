import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import { QuestionAnswer as QuestionAnswerIcon } from '@mui/icons-material';
import { getVacancy, submitAnswers } from '../api';

interface Question {
  id: number;
  text: string;
}

const PublicQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const [vacancy, setVacancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  console.log('PublicQuiz rendered with ID:', id);

  useEffect(() => {
    console.log('PublicQuiz useEffect triggered, fetching vacancy data...');
    fetchVacancy();
  }, [id]);

  const fetchVacancy = async () => {
    try {
      setLoading(true);
      console.log('Fetching vacancy data for ID:', id);
      const data = await getVacancy(Number(id));
      console.log('Vacancy data received:', data);
      setVacancy(data);
      
      // Initialize answers with empty strings using question ID as key
      if (data.questions) {
        const initialAnswers: Record<string, string> = {};
        data.questions.forEach((q: Question) => {
          initialAnswers[q.id.toString()] = '';
        });
        setAnswers(initialAnswers);
        console.log('Initialized answers:', initialAnswers);
      }
    } catch (error) {
      console.error('Error fetching vacancy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers({
      ...answers,
      [questionId.toString()]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      // Проверка обязательных полей
      if (!candidateName.trim()) {
        setSubmitError('Пожалуйста, введите ваше имя');
        return;
      }
      if (!candidateEmail.trim()) {
        setSubmitError('Пожалуйста, введите ваш email');
        return;
      }
      // Базовая проверка формата email
      if (!/\S+@\S+\.\S+/.test(candidateEmail)) {
        setSubmitError('Пожалуйста, введите корректный email адрес');
        return;
      }
      setSubmitError('');
      setSubmitLoading(true);
      console.log('Sending answers:', answers);
      
      await submitAnswers(
        Number(id),
        candidateName,
        candidateEmail,
        candidatePhone,
        answers
      );
      setSubmitSuccess(true);
      // Clear form after submission
      if (vacancy?.questions) {
        const emptyAnswers: Record<string, string> = {};
        vacancy.questions.forEach((q: Question) => {
          emptyAnswers[q.id.toString()] = '';
        });
        setAnswers(emptyAnswers);
      }
      setCandidateName('');
      setCandidateEmail('');
      setCandidatePhone('');
    } catch (error) {
      console.error('Error submitting answers:', error);
      setSubmitError('Не удалось отправить ответы. Пожалуйста, попробуйте еще раз.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {vacancy?.title} - Анкета
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Пожалуйста, ответьте на следующие вопросы наилучшим образом:
        </Typography>

        {submitSuccess ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>
              Спасибо за ваши ответы!
            </Typography>
            <Typography variant="body1">
              Ваши ответы были записаны. Мы свяжемся с вами в ближайшее время.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Ваша информация
              </Typography>
              <TextField
                fullWidth
                label="Ваше имя *"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Ваш Email *"
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Ваш телефон"
                value={candidatePhone}
                onChange={(e) => setCandidatePhone(e.target.value)}
                margin="normal"
              />
            </Box>
            
            <Typography variant="h6" gutterBottom>
              Вопросы
            </Typography>
            <List>
              {vacancy?.questions?.map((question: Question, index: number) => (
                <Box key={question.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={`${index + 1}. ${question.text}`}
                      secondary={
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Ваш ответ..."
                          value={answers[question.id.toString()] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          sx={{ mt: 1 }}
                        />
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </Box>
              ))}
            </List>
            
            {submitError && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {submitError}
              </Alert>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<QuestionAnswerIcon />}
                onClick={handleSubmit}
                disabled={submitLoading}
              >
                {submitLoading ? 'Отправка...' : 'Отправить ответы'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default PublicQuiz; 