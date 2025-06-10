import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { questionSetService } from '../services/api';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const PaperContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const QuestionItem = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const QuestionNumber = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

const QuestionContent = styled.div`
  margin-bottom: 1rem;
`;

const QuestionMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #7f8c8d;
`;

const LoadingMessage = styled.p`
  color: #7f8c8d;
  font-style: italic;
  text-align: center;
  margin: 2rem 0;
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  background-color: #fadbd8;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const ViewPaperPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questionSet, setQuestionSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchQuestionSet = async () => {
      try {
        setLoading(true);
        // This endpoint needs to be implemented in the backend
        const response = await questionSetService.getQuestionSetWithQuestions(id);
        setQuestionSet(response.data);
      } catch (err) {
        console.error('Error fetching question set:', err);
        setError('Failed to load question paper. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestionSet();
  }, [id]);
  
  const handleExportPDF = async () => {
    try {
      setLoading(true);
      // This endpoint needs to be implemented in the backend
      const response = await questionSetService.exportQuestionSetPDF(id);
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a link and click it to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${questionSet.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    navigate('/question-sets');
  };
  
  const getTaxonomyLevelLabel = (level) => {
    const labels = {
      remember: 'Remember',
      understand: 'Understand',
      apply: 'Apply',
      analyze: 'Analyze',
      evaluate: 'Evaluate',
      create: 'Create'
    };
    return labels[level] || level;
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <div>
          <Title>{questionSet?.name || 'Question Paper'}</Title>
          {questionSet?.description && <p>{questionSet.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={handleBack}>Back</Button>
          <Button onClick={handleExportPDF}>Export PDF</Button>
        </div>
      </PageHeader>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {loading ? (
        <LoadingMessage>Loading question paper...</LoadingMessage>
      ) : questionSet && questionSet.questions ? (
        <PaperContainer>
          {questionSet.questions.map((question, index) => (
            <QuestionItem key={question.id}>
              <QuestionNumber>Question {index + 1}</QuestionNumber>
              <QuestionContent>{question.content}</QuestionContent>
              <QuestionMeta>
                <span>Bloom's Level: {getTaxonomyLevelLabel(question.bloom_taxonomy_level)}</span>
                <span>Difficulty: {question.difficulty_level.charAt(0).toUpperCase() + question.difficulty_level.slice(1)}</span>
              </QuestionMeta>
            </QuestionItem>
          ))}
        </PaperContainer>
      ) : (
        <p>No questions found in this question set.</p>
      )}
    </PageContainer>
  );
};

export default ViewPaperPage;