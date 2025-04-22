import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Toolbar,
  AppBar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Quiz as QuizIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { getVacancies, deleteVacancy } from '../api';
import { useAuth } from '../auth';

interface Vacancy {
  id: number;
  title: string;
  skills: string[];
  createdAt: string;
  _count: {
    questions: number;
    candidates: number;
  };
}

const Dashboard = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      const data = await getVacancies();
      setVacancies(data);
    } catch (error) {
      console.error('Error fetching vacancies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacancies();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту вакансию?')) {
      try {
        await deleteVacancy(id);
        fetchVacancies();
      } catch (error) {
        console.error('Error deleting vacancy:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            HR CRM Панель управления
          </Typography>
          {user && (
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user.name}
            </Typography>
          )}
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Вакансии</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/vacancy/new')}
          >
            Добавить вакансию
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : vacancies.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography>Вакансии не найдены. Создайте свою первую!</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Навыки</TableCell>
                  <TableCell>Вопросы</TableCell>
                  <TableCell>Кандидаты</TableCell>
                  <TableCell>Создано</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vacancies.map((vacancy) => (
                  <TableRow key={vacancy.id}>
                    <TableCell>{vacancy.title}</TableCell>
                    <TableCell>
                      {vacancy.skills.map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>{vacancy._count.questions}</TableCell>
                    <TableCell>{vacancy._count.candidates}</TableCell>
                    <TableCell>
                      {new Date(vacancy.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => navigate(`/vacancy/edit/${vacancy.id}`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => navigate(`/vacancy/${vacancy.id}/quiz`)}
                      >
                        <QuizIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => navigate(`/vacancy/${vacancy.id}/results`)}
                      >
                        <AssessmentIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(vacancy.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </>
  );
};

export default Dashboard; 