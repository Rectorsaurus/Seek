import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgeVerificationProvider } from './contexts/AgeVerificationContext';
import { useAgeVerification } from './hooks/useAgeVerification';
import { AgeVerificationModal } from './components/AgeVerificationModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ProductPage } from './pages/ProductPage';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function AppContent() {
  const { isModalOpen, verifyAge, rejectAge } = useAgeVerification();

  return (
    <>
      <AgeVerificationModal 
        isOpen={isModalOpen}
        onVerify={verifyAge}
        onReject={rejectAge}
      />
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="/product/:id" element={<ProtectedRoute><ProductPage /></ProtectedRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AgeVerificationProvider>
        <AppContent />
      </AgeVerificationProvider>
    </QueryClientProvider>
  );
}

export default App
