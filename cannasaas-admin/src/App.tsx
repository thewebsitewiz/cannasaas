import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { Toaster } from './components/ui/sonner';

function App() {
  const isAuthenticated = !!localStorage.getItem('accessToken');

  return (
    <Router>
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route
          path='/dashboard'
          element={
            isAuthenticated ? <DashboardPage /> : <Navigate to='/login' />
          }
        />
        <Route path='/' element={<Navigate to='/dashboard' />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
