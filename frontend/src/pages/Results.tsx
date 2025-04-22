import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';
import { getVacancy, getCandidates, getCandidate } from '../api';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  vacancyId: number;
  answers: Record<string, string>;
  analysis: {
    summary: string;
    skills: {
      [key: string]: number;
    };
    fit: number;
    recommendation: string;
  } | null;
  createdAt: string;
}

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchVacancyAndCandidates();
  }, [id]);

  const fetchVacancyAndCandidates = async () => {
    try {
      setLoading(true);
      const vacancyData = await getVacancy(Number(id));
      setVacancy(vacancyData);

      const candidatesData = await getCandidates(Number(id));
      setCandidates(candidatesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSelect = async (candidateId: number) => {
    // If we're already viewing this candidate, collapse the view
    if (selectedCandidate?.id === candidateId) {
      setSelectedCandidate(null);
      return;
    }

    try {
      setDetailsLoading(true);
      const candidateData = await getCandidate(candidateId);
      setSelectedCandidate(candidateData);
    } catch (error) {
      console.error('Error fetching candidate details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getRecommendationChip = (recommendation: string) => {
    const lowercased = recommendation.toLowerCase();
    if (lowercased.includes('нанять')) {
      return <Chip icon={<CheckCircleIcon />} label="Нанять" color="success" />;
    } else if (lowercased.includes('рассмотреть')) {
      return <Chip icon={<HourglassEmptyIcon />} label="Рассмотреть" color="warning" />;
    } else if (lowercased.includes('отклонить')) {
      return <Chip icon={<CancelIcon />} label="Отклонить" color="error" />;
    } else {
      // Проверка английских слов для обратной совместимости
      if (lowercased.includes('hire')) {
        return <Chip icon={<CheckCircleIcon />} label="Нанять" color="success" />;
      } else if (lowercased.includes('consider')) {
        return <Chip icon={<HourglassEmptyIcon />} label="Рассмотреть" color="warning" />;
      } else if (lowercased.includes('reject')) {
        return <Chip icon={<CancelIcon />} label="Отклонить" color="error" />;
      }
      return <Chip icon={<HourglassEmptyIcon />} label="Неизвестно" color="default" />;
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
            Результаты кандидатов
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          {vacancy?.title}
        </Typography>

        {candidates.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography>На эту вакансию пока нет кандидатов.</Typography>
          </Paper>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Имя</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Отправлено</TableCell>
                    <TableCell>Статус анализа</TableCell>
                    <TableCell>Оценка соответствия</TableCell>
                    <TableCell>Рекомендация</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow
                      key={candidate.id}
                      hover
                      onClick={() => handleCandidateSelect(candidate.id)}
                      selected={selectedCandidate?.id === candidate.id}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>#{candidate.id}</TableCell>
                      <TableCell>{candidate.name}</TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell>
                        {new Date(candidate.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {candidate.analysis ? (
                          <Chip label="Проанализировано" color="success" size="small" />
                        ) : (
                          <Chip label="Ожидание" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {candidate.analysis ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100px', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={candidate.analysis.fit * 10}
                                color={
                                  candidate.analysis.fit >= 7
                                    ? 'success'
                                    : candidate.analysis.fit >= 5
                                    ? 'warning'
                                    : 'error'
                                }
                              />
                            </Box>
                            <Typography variant="body2">
                              {candidate.analysis.fit}/10
                            </Typography>
                          </Box>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {candidate.analysis
                          ? getRecommendationChip(candidate.analysis.recommendation)
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {selectedCandidate && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Кандидат #{selectedCandidate.id} Детали
                </Typography>
                {detailsLoading ? (
                  <CircularProgress />
                ) : (
                  <>
                    <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        Контактная информация
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body1">
                          <strong>Имя:</strong> {selectedCandidate.name}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Email:</strong> {selectedCandidate.email}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Телефон:</strong> {selectedCandidate.phone || 'Не указан'}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Отправлено:</strong> {new Date(selectedCandidate.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    {selectedCandidate.analysis ? (
                      <>
                        <Typography variant="h6" gutterBottom>
                          Анализ
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1">Общая оценка</Typography>
                          <Typography variant="body1" paragraph>
                            {selectedCandidate.analysis.summary}
                          </Typography>

                          <Typography variant="subtitle1">Оценка навыков</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                            {Object.entries(selectedCandidate.analysis.skills).map(([skill, score]) => (
                              <Chip 
                                key={skill} 
                                label={`${skill}: ${score}/10`} 
                                color={score >= 7 ? "success" : score >= 5 ? "warning" : "error"} 
                              />
                            ))}
                          </Box>

                          <Typography variant="subtitle1">Оценка соответствия</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ width: '200px', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={selectedCandidate.analysis.fit * 10}
                                color={
                                  selectedCandidate.analysis.fit >= 7
                                    ? 'success'
                                    : selectedCandidate.analysis.fit >= 5
                                    ? 'warning'
                                    : 'error'
                                }
                              />
                            </Box>
                            <Typography variant="body1" sx={{ ml: 2 }}>
                              {selectedCandidate.analysis.fit}/10
                            </Typography>
                          </Box>

                          <Typography variant="subtitle1">Рекомендация</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getRecommendationChip(
                              selectedCandidate.analysis.recommendation
                            )}
                            <Typography variant="body1" sx={{ ml: 2 }}>
                              {selectedCandidate.analysis.recommendation}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ py: 2 }}>
                        <Typography color="text.secondary">
                          Анализ еще в процессе. Проверьте позже.
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" gutterBottom>
                      Ответы
                    </Typography>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Просмотреть ответы кандидата</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {vacancy?.questions?.map((question: any, index: number) => (
                          <Box key={question.id} sx={{ mb: 2 }}>
                            <Typography variant="subtitle1">
                              В{index + 1}: {question.text}
                            </Typography>
                            <Paper
                              variant="outlined"
                              sx={{ p: 2, mt: 1, backgroundColor: '#f9f9f9' }}
                            >
                              <Typography variant="body1">
                                {selectedCandidate.answers[question.id.toString()] || 'Ответ не предоставлен'}
                              </Typography>
                            </Paper>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  </>
                )}
              </Paper>
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default Results; 