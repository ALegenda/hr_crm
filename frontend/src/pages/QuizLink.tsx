import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  FileCopy as FileCopyIcon,
  Link as LinkIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { getVacancy, generateQuiz, submitAnswers, createQuestion, updateQuestion, deleteQuestion } from '../api';
import { useAuth } from '../auth';

interface Question {
  id: number;
  text: string;
}

const QuizLink = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [vacancy, setVacancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'add' | 'edit'>('add');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  
  // Определяем режим отображения по URL-пути, а не только по аутентификации
  const isPublicPath = location.pathname.startsWith('/quiz/');
  const isAdminPath = location.pathname.includes('/vacancy/') && location.pathname.includes('/quiz');
  
  // В публичном пути всегда показываем публичную форму, даже если пользователь аутентифицирован
  const isPublic = isPublicPath || (!isAuthenticated && !isAdminPath);

  useEffect(() => {
    fetchVacancy();
  }, [id]);

  const fetchVacancy = async () => {
    try {
      setLoading(true);
      const data = await getVacancy(Number(id));
      setVacancy(data);
      
      // Initialize answers with empty strings using question ID as key
      if (data.questions && isPublic) {
        const initialAnswers: Record<string, string> = {};
        data.questions.forEach((q: Question) => {
          initialAnswers[q.id.toString()] = '';
        });
        setAnswers(initialAnswers);
      }
    } catch (error) {
      console.error('Error fetching vacancy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      setGenerating(true);
      await generateQuiz(Number(id));
      await fetchVacancy();
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getPublicUrl = () => {
    return `${window.location.origin}/quiz/${id}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopySuccess(true);
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

  // Обработчики для управления вопросами
  const handleOpenAddDialog = () => {
    setDialogType('add');
    setQuestionText('');
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (question: Question) => {
    setDialogType('edit');
    setCurrentQuestion(question);
    setQuestionText(question.text);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentQuestion(null);
    setQuestionText('');
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim()) {
      return;
    }

    try {
      if (dialogType === 'add') {
        await createQuestion(Number(id), questionText);
        setActionMessage('Вопрос добавлен');
      } else {
        await updateQuestion(currentQuestion!.id, questionText);
        setActionMessage('Вопрос обновлен');
      }

      setActionSuccess(true);
      handleCloseDialog();
      await fetchVacancy();
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      try {
        await deleteQuestion(questionId);
        setActionSuccess(true);
        setActionMessage('Вопрос удален');
        await fetchVacancy();
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Public view for candidates
  if (isPublic) {
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
  }

  // Admin view for HR
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Генератор опросника
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            {vacancy?.title}
          </Typography>

          {vacancy?.questions?.length > 0 ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Публичная ссылка:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={getPublicUrl()}
                    InputProps={{
                      readOnly: true,
                      startAdornment: <LinkIcon sx={{ mr: 1 }} />,
                    }}
                  />
                  <Button
                    sx={{ ml: 2 }}
                    variant="outlined"
                    startIcon={<FileCopyIcon />}
                    onClick={copyToClipboard}
                  >
                    Копировать
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Вопросы:</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddDialog}
                >
                  Добавить вопрос
                </Button>
              </Box>
              <List>
                {vacancy?.questions?.map((question: Question, index: number) => (
                  <Box key={question.id}>
                    <ListItem>
                      <ListItemText primary={`${index + 1}. ${question.text}`} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditDialog(question)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteQuestion(question.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider component="li" />
                  </Box>
                ))}
              </List>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<QuestionAnswerIcon />}
                  onClick={handleGenerateQuiz}
                  disabled={generating}
                >
                  {generating ? 'Генерация...' : 'Перегенерировать вопросы'}
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" paragraph>
                Для этой вакансии еще не сгенерированы вопросы.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<QuestionAnswerIcon />}
                onClick={handleGenerateQuiz}
                disabled={generating}
              >
                {generating ? 'Генерация...' : 'Сгенерировать опросник'}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>

      {/* Диалог добавления/редактирования вопроса */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {dialogType === 'add' ? 'Добавить новый вопрос' : 'Редактировать вопрос'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Текст вопроса"
            fullWidth
            multiline
            rows={4}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSaveQuestion} variant="contained" disabled={!questionText.trim()}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомления */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess(false)}
      >
        <Alert severity="success">Ссылка скопирована в буфер обмена!</Alert>
      </Snackbar>

      <Snackbar
        open={actionSuccess}
        autoHideDuration={3000}
        onClose={() => setActionSuccess(false)}
      >
        <Alert severity="success">{actionMessage}</Alert>
      </Snackbar>
    </>
  );
};

export default QuizLink; 