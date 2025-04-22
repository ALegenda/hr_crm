import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Chip,
  InputBase,
  IconButton,
  AppBar,
  Toolbar,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { getVacancy, createVacancy, updateVacancy } from '../api';

interface VacancyData {
  title: string;
  description: string;
  skills: string[];
  requirements: string;
  context: string;
}

const initialVacancy: VacancyData = {
  title: '',
  description: '',
  skills: [],
  requirements: '',
  context: '',
};

const VacancyForm = () => {
  const [vacancy, setVacancy] = useState<VacancyData>(initialVacancy);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      fetchVacancy();
    }
  }, [isEditMode]);

  const fetchVacancy = async () => {
    try {
      setLoading(true);
      const data = await getVacancy(Number(id));
      setVacancy({
        title: data.title,
        description: data.description,
        skills: data.skills,
        requirements: data.requirements,
        context: data.context,
      });
    } catch (error) {
      console.error('Error fetching vacancy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVacancy({ ...vacancy, [name]: value });
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!vacancy.skills.includes(newSkill.trim())) {
        setVacancy({
          ...vacancy,
          skills: [...vacancy.skills, newSkill.trim()],
        });
      }
      setNewSkill('');
    }
  };

  const handleAddSkillButton = () => {
    if (newSkill.trim() && !vacancy.skills.includes(newSkill.trim())) {
      setVacancy({
        ...vacancy,
        skills: [...vacancy.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleDeleteSkill = (skillToDelete: string) => {
    setVacancy({
      ...vacancy,
      skills: vacancy.skills.filter((skill) => skill !== skillToDelete),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (isEditMode) {
        await updateVacancy(Number(id), vacancy);
      } else {
        await createVacancy(vacancy);
      }
      navigate('/');
    } catch (error) {
      console.error('Error saving vacancy:', error);
    } finally {
      setSaving(false);
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
            {isEditMode ? 'Редактировать вакансию' : 'Создать вакансию'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              label="Название"
              name="title"
              value={vacancy.title}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Описание"
              name="description"
              value={vacancy.description}
              onChange={handleChange}
              multiline
              rows={4}
              required
            />
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle1">Навыки</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', my: 1 }}>
                {vacancy.skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    onDelete={() => handleDeleteSkill(skill)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Добавьте навык и нажмите Enter"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleAddSkill}
                />
                <IconButton onClick={handleAddSkillButton}>
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
            <TextField
              fullWidth
              margin="normal"
              label="Требования"
              name="requirements"
              value={vacancy.requirements}
              onChange={handleChange}
              multiline
              rows={3}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Контекст компании/проекта"
              name="context"
              value={vacancy.context}
              onChange={handleChange}
              multiline
              rows={3}
            />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                type="submit"
                startIcon={<SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить вакансию'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default VacancyForm; 