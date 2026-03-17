// src/App.jsx
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { ToastContainer } from 'react-toastify';
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    <ToastContainer position="top-right" />

    </AuthProvider>
  );
}

export default App;