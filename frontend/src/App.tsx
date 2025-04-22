import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
// @ts-ignore
import Login from './pages/Login';
// @ts-ignore
import Dashboard from './pages/Dashboard';
// @ts-ignore
import VacancyForm from './pages/VacancyForm';
// @ts-ignore
import QuizLink from './pages/QuizLink';
// @ts-ignore
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
      <Route path="/quiz/:id" element={<QuizLink />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
      <Route path="/vacancy/new" element={<ProtectedRoute element={<VacancyForm />} />} />
      <Route path="/vacancy/edit/:id" element={<ProtectedRoute element={<VacancyForm />} />} />
      <Route path="/vacancy/:id/quiz" element={<ProtectedRoute element={<QuizLink />} />} />
      <Route path="/vacancy/:id/results" element={<ProtectedRoute element={<Results />} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={import.meta.env.BASE_URL || "/"}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App; 