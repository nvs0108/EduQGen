import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SubjectsPage from './pages/SubjectsPage';
import TopicsPage from './pages/TopicsPage';
import QuestionsPage from './pages/QuestionsPage';
import QuestionSetsPage from './pages/QuestionSetsPage';
import QuestionGeneratorPage from './pages/QuestionGeneratorPage';
import ViewPaperPage from './pages/ViewPaperPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/topics" element={<TopicsPage />} />
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/question-sets" element={<QuestionSetsPage />} />
                <Route path="/question-sets/:id" element={<ViewPaperPage />} />
                <Route path="/generate-questions" element={<QuestionGeneratorPage />} />
              </Route>
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
