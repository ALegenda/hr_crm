import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VacancyForm from './pages/VacancyForm';
import QuizLink from './pages/QuizLink';
import Results from './pages/Results';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
      <Route path="/vacancy/new" element={<ProtectedRoute element={<VacancyForm />} />} />
      <Route path="/vacancy/edit/:id" element={<ProtectedRoute element={<VacancyForm />} />} />
      <Route path="/vacancy/:id/quiz" element={<ProtectedRoute element={<QuizLink />} />} />
      <Route path="/vacancy/:id/results" element={<ProtectedRoute element={<Results />} />} />
      <Route path="/quiz/:id" element={<QuizLink />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App; 