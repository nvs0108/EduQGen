import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { questionService, questionSetService } from '../services/api';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  font-size: 1.1rem;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
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
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const FormContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #2c3e50;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const QuestionSelectionContainer = styled.div`
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
`;

const QuestionItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const Checkbox = styled.input`
  margin-right: 1rem;
  margin-top: 0.25rem;
`;

const QuestionContent = styled.div`
  flex: 1;
`;

const QuestionText = styled.p`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
`;

const QuestionMeta = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
`;

const MetaBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
`;

const TaxonomyBadge = styled(MetaBadge)`
  background-color: #9b59b6;
  color: white;
`;

const DifficultyBadge = styled(MetaBadge)`
  background-color: ${props => {
    switch (props.level) {
      case 'easy': return '#2ecc71';
      case 'medium': return '#f39c12';
      case 'hard': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
  color: white;
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  background-color: #fadbd8;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.p`
  color: #27ae60;
  background-color: #d5f5e3;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const QuestionSetsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const QuestionSetCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const QuestionSetTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const QuestionSetDescription = styled.p`
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  flex-grow: 1;
`;

const QuestionSetMeta = styled.div`
  display: flex;
  justify-content: space-between;
  color: #95a5a6;
  font-size: 0.8rem;
  margin-top: auto;
`;

const QuestionSetActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  background-color: ${props => props.primary ? '#3498db' : 'transparent'};
  color: ${props => props.primary ? 'white' : '#3498db'};
  border: ${props => props.primary ? 'none' : '1px solid #3498db'};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.primary ? '#2980b9' : 'rgba(52, 152, 219, 0.1)'};
  }
`;

const LoadingMessage = styled.p`
  color: #7f8c8d;
  font-style: italic;
  text-align: center;
  margin: 2rem 0;
`;

const QuestionSetsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [questionSets, setQuestionSets] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    institution_name: '',
    header_info: '',
    question_ids: []
  });

  useEffect(() => {
    fetchQuestionSets();
  }, []);

  const fetchQuestionSets = async () => {
    try {
      setLoading(true);
      const response = await questionSetService.getQuestionSets();
      setQuestionSets(response.data);
    } catch (err) {
      console.error('Error fetching question sets:', err);
      setError('Failed to load question sets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionService.getQuestions();
      setQuestions(response.data);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuestionSelection = (questionId) => {
    setFormData(prev => {
      const currentIds = [...prev.question_ids];
      
      if (currentIds.includes(questionId)) {
        return {
          ...prev,
          question_ids: currentIds.filter(id => id !== questionId)
        };
      } else {
        return {
          ...prev,
          question_ids: [...currentIds, questionId]
        };
      }
    });
  };

  const handleCreateQuestionSet = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      setError('Please provide a name for the question set');
      return;
    }
    
    if (formData.question_ids.length === 0) {
      setError('Please select at least one question');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await questionSetService.createQuestionSet(formData);
      
      setSuccess('Question set created successfully!');
      setFormData({
        name: '',
        description: '',
        institution_name: '',
        header_info: '',
        question_ids: []
      });
      setShowForm(false);
      
      // Refresh the question sets list
      fetchQuestionSets();
      
    } catch (err) {
      console.error('Error creating question set:', err);
      setError('Failed to create question set. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setShowForm(prev => !prev);
    if (!showForm && questions.length === 0) {
      fetchQuestions();
    }
  };

  const handleExportPDF = async (id, name) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await questionSetService.exportQuestionSetPDF(id);
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a link and click it to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      setSuccess('PDF exported successfully!');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF. Please try again later.');
    } finally {
      setLoading(false);
    }
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
        <Title>Question Sets</Title>
        <Subtitle>Create and manage your question sets for exams</Subtitle>
      </PageHeader>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <ActionBar>
        <Button onClick={toggleForm}>
          {showForm ? 'Cancel' : 'Create New Question Set'}
        </Button>
      </ActionBar>
      
      {showForm && (
        <FormContainer>
          <Form onSubmit={handleCreateQuestionSet}>
            <FormGroup>
              <Label htmlFor="name">Name*</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter a name for your question set"
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter a description for your question set"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="institution_name">Institution Name</Label>
              <Input
                type="text"
                id="institution_name"
                name="institution_name"
                value={formData.institution_name}
                onChange={handleInputChange}
                placeholder="Enter the institution name for the header"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="header_info">Header Information</Label>
              <TextArea
                id="header_info"
                name="header_info"
                value={formData.header_info}
                onChange={handleInputChange}
                placeholder="Enter additional header information (e.g., exam name, date, etc.)"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Select Questions*</Label>
              {loading ? (
                <LoadingMessage>Loading questions...</LoadingMessage>
              ) : questions.length > 0 ? (
                <QuestionSelectionContainer>
                  {questions.map(question => (
                    <QuestionItem key={question.id}>
                      <Checkbox
                        type="checkbox"
                        checked={formData.question_ids.includes(question.id)}
                        onChange={() => handleQuestionSelection(question.id)}
                      />
                      <QuestionContent>
                        <QuestionText>{question.content}</QuestionText>
                        <QuestionMeta>
                          <TaxonomyBadge>
                            {getTaxonomyLevelLabel(question.bloom_taxonomy_level)}
                          </TaxonomyBadge>
                          <DifficultyBadge level={question.difficulty_level}>
                            {question.difficulty_level.charAt(0).toUpperCase() + question.difficulty_level.slice(1)}
                          </DifficultyBadge>
                        </QuestionMeta>
                      </QuestionContent>
                    </QuestionItem>
                  ))}
                </QuestionSelectionContainer>
              ) : (
                <p>No questions available. <Link to="/questions">Create some questions</Link> first.</p>
              )}
            </FormGroup>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Question Set'}
            </Button>
          </Form>
        </FormContainer>
      )}
      
      {loading ? (
        <LoadingMessage>Loading question sets...</LoadingMessage>
      ) : questionSets.length > 0 ? (
        <QuestionSetsList>
          {questionSets.map(set => (
            <QuestionSetCard key={set.id}>
              <QuestionSetTitle>{set.name}</QuestionSetTitle>
              <QuestionSetDescription>
                {set.description || 'No description provided'}
              </QuestionSetDescription>
              <QuestionSetMeta>
                <span>Created: {new Date(set.created_at).toLocaleDateString()}</span>
                {set.institution_name && <span>Institution: {set.institution_name}</span>}
              </QuestionSetMeta>
              <QuestionSetActions>
                <ActionButton 
                  primary 
                  onClick={() => navigate(`/question-sets/${set.id}`)}
                >
                  View Paper
                </ActionButton>
                <ActionButton
                  onClick={() => handleExportPDF(set.id, set.name)}
                >
                  Export PDF
                </ActionButton>
              </QuestionSetActions>
            </QuestionSetCard>
          ))}
        </QuestionSetsList>
      ) : (
        <p>No question sets found. Create your first question set to get started.</p>
      )}
    </PageContainer>
  );
};

export default QuestionSetsPage;