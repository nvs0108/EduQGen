import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { subjectService, questionSetService } from '../services/api';

const DashboardContainer = styled.div`
  padding: 2rem;
  // max-width: 1200px;
  margin: 0 auto;
`;

const WelcomeSection = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-bottom: 1rem;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const StatValue = styled.h2`
  font-size: 2.5rem;
  color: #3498db;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.p`
  color: #7f8c8d;
  font-size: 1rem;
  text-align: center;
`;

const QuickLinksContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const QuickLinkCard = styled(Link)`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const QuickLinkTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const QuickLinkDescription = styled.p`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const SectionTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #ecf0f1;
`;

const LoadingMessage = styled.p`
  color: #7f8c8d;
  font-style: italic;
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  background-color: #fadbd8;
  padding: 0.75rem;
  border-radius: 4px;
`;

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch subjects and question sets in parallel
        const [subjectsResponse, questionSetsResponse] = await Promise.all([
          subjectService.getSubjects(),
          questionSetService.getQuestionSets()
        ]);
        
        setSubjects(subjectsResponse.data);
        setQuestionSets(questionSetsResponse.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingMessage>Loading dashboard data...</LoadingMessage>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <WelcomeSection>
        <Title>Welcome, {currentUser?.full_name || currentUser?.username}!</Title>
        <Subtitle>Here's an overview of your EduQGen activity</Subtitle>
      </WelcomeSection>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <SectionTitle>Quick Stats</SectionTitle>
      <StatsContainer>
        <StatCard>
          <StatValue>{subjects.length}</StatValue>
          <StatLabel>Subjects</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{questionSets.length}</StatValue>
          <StatLabel>Question Sets</StatLabel>
        </StatCard>
      </StatsContainer>
      
      <SectionTitle>Quick Actions</SectionTitle>
      <QuickLinksContainer>
        <QuickLinkCard to="/subjects">
          <QuickLinkTitle>Manage Subjects</QuickLinkTitle>
          <QuickLinkDescription>Create and manage your subjects and topics</QuickLinkDescription>
        </QuickLinkCard>
        
        <QuickLinkCard to="/questions">
          <QuickLinkTitle>Question Bank</QuickLinkTitle>
          <QuickLinkDescription>Browse and manage your question repository</QuickLinkDescription>
        </QuickLinkCard>
        
        <QuickLinkCard to="/generate-questions">
          <QuickLinkTitle>Generate Questions</QuickLinkTitle>
          <QuickLinkDescription>Create AI-generated questions based on your content</QuickLinkDescription>
        </QuickLinkCard>
        
        <QuickLinkCard to="/question-sets">
          <QuickLinkTitle>Question Sets</QuickLinkTitle>
          <QuickLinkDescription>Create and manage question papers and exams</QuickLinkDescription>
        </QuickLinkCard>
      </QuickLinksContainer>
    </DashboardContainer>
  );
};

export default DashboardPage;