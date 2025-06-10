import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { questionService, subjectService, topicService } from '../services/api';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #2c3e50;
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

const FiltersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #2c3e50;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #2c3e50;
`;

const QuestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const QuestionCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const QuestionContent = styled.div`
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: #2c3e50;
`;

const QuestionAnswer = styled.div`
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  
  h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: #2c3e50;
  }
  
  p {
    margin: 0;
    color: #34495e;
  }
`;

const QuestionMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const MetaBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  display: inline-block;
`;

const SubjectBadge = styled(MetaBadge)`
  background-color: #3498db;
  color: white;
`;

const TopicBadge = styled(MetaBadge)`
  background-color: #2ecc71;
  color: white;
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

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
`;

const PageButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background-color: ${props => props.active ? '#3498db' : 'white'};
  color: ${props => props.active ? 'white' : '#2c3e50'};
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.active ? '#2980b9' : '#f8f9fa'};
  }
  
  &:disabled {
    background-color: #f8f9fa;
    color: #95a5a6;
    cursor: not-allowed;
  }
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

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 2rem;
`;

const EmptyStateText = styled.p`
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
`;

const QuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    subjectId: '',
    topicId: '',
    bloomLevel: '',
    difficulty: '',
    verifiedOnly: false
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const taxonomyLevels = [
    { value: 'remember', label: 'Remember' },
    { value: 'understand', label: 'Understand' },
    { value: 'apply', label: 'Apply' },
    { value: 'analyze', label: 'Analyze' },
    { value: 'evaluate', label: 'Evaluate' },
    { value: 'create', label: 'Create' }
  ];

  const difficultyLevels = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.getSubjects();
      setSubjects(response.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects. Please try again later.');
    }
  };

  const fetchTopics = async (subjectId = null) => {
    try {
      const response = await topicService.getTopics(subjectId);
      setTopics(response.data);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Failed to load topics. Please try again later.');
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await questionService.getQuestions(filters, skip, itemsPerPage);
      
      setQuestions(response.data);
      
      // Calculate total pages based on response
      // Note: This assumes the API returns the total count or you have a way to determine it
      // For simplicity, we're just setting it to 1 if there are no questions
      setTotalPages(Math.max(1, Math.ceil(response.data.length / itemsPerPage)));
      
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [filters, currentPage]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Reset to first page when filters change
    setCurrentPage(1);
    
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // If subject filter changes, update topics filter
    if (name === 'subjectId') {
      setFilters(prev => ({ ...prev, topicId: '' }));
      fetchTopics(value || null);
    }
  };

  const getSubjectNameById = (id) => {
    const subject = subjects.find(s => s.id === id);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getTopicNameById = (id) => {
    const topic = topics.find(t => t.id === id);
    return topic ? topic.name : 'Unknown Topic';
  };

  const getTaxonomyLevelLabel = (level) => {
    const found = taxonomyLevels.find(t => t.value === level);
    return found ? found.label : level;
  };

  return (
    <PageContainer>
      <PageHeader>
        <Title>Questions</Title>
        <Button onClick={() => window.location.href = '/generate-questions'}>
          Generate Questions
        </Button>
      </PageHeader>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <FiltersContainer>
        <FilterGroup>
          <Label htmlFor="subjectId">Subject</Label>
          <Select
            id="subjectId"
            name="subjectId"
            value={filters.subjectId}
            onChange={handleFilterChange}
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </FilterGroup>
        
        <FilterGroup>
          <Label htmlFor="topicId">Topic</Label>
          <Select
            id="topicId"
            name="topicId"
            value={filters.topicId}
            onChange={handleFilterChange}
            disabled={!filters.subjectId}
          >
            <option value="">All Topics</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </Select>
        </FilterGroup>
        
        <FilterGroup>
          <Label htmlFor="bloomLevel">Taxonomy Level</Label>
          <Select
            id="bloomLevel"
            name="bloomLevel"
            value={filters.bloomLevel}
            onChange={handleFilterChange}
          >
            <option value="">All Levels</option>
            {taxonomyLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </Select>
        </FilterGroup>
        
        <FilterGroup>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select
            id="difficulty"
            name="difficulty"
            value={filters.difficulty}
            onChange={handleFilterChange}
          >
            <option value="">All Difficulties</option>
            {difficultyLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </Select>
        </FilterGroup>
        
        <FilterGroup>
          <CheckboxLabel>
            <Checkbox
              type="checkbox"
              name="verifiedOnly"
              checked={filters.verifiedOnly}
              onChange={handleFilterChange}
            />
            Verified Questions Only
          </CheckboxLabel>
        </FilterGroup>
      </FiltersContainer>
      
      {loading ? (
        <LoadingMessage>Loading questions...</LoadingMessage>
      ) : questions.length === 0 ? (
        <EmptyState>
          <EmptyStateText>No questions found with the selected filters.</EmptyStateText>
          <Button onClick={() => window.location.href = '/generate-questions'}>
            Generate New Questions
          </Button>
        </EmptyState>
      ) : (
        <>
          <QuestionsContainer>
            {questions.map(question => (
              <QuestionCard key={question.id}>
                <QuestionContent>{question.content}</QuestionContent>
                
                <QuestionAnswer>
                  <h4>Answer:</h4>
                  <p>{question.answer}</p>
                </QuestionAnswer>
                
                {question.explanation && (
                  <QuestionAnswer>
                    <h4>Explanation:</h4>
                    <p>{question.explanation}</p>
                  </QuestionAnswer>
                )}
                
                <QuestionMeta>
                  <SubjectBadge>{getSubjectNameById(question.subject_id)}</SubjectBadge>
                  
                  {question.topic_id && (
                    <TopicBadge>{getTopicNameById(question.topic_id)}</TopicBadge>
                  )}
                  
                  <TaxonomyBadge>
                    {getTaxonomyLevelLabel(question.bloom_taxonomy_level)}
                  </TaxonomyBadge>
                  
                  <DifficultyBadge level={question.difficulty_level}>
                    {question.difficulty_level.charAt(0).toUpperCase() + question.difficulty_level.slice(1)}
                  </DifficultyBadge>
                </QuestionMeta>
              </QuestionCard>
            ))}
          </QuestionsContainer>
          
          <Pagination>
            <PageButton 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </PageButton>
            
            {[...Array(totalPages).keys()].map(page => (
              <PageButton
                key={page + 1}
                active={currentPage === page + 1}
                onClick={() => setCurrentPage(page + 1)}
              >
                {page + 1}
              </PageButton>
            ))}
            
            <PageButton
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </PageButton>
          </Pagination>
        </>
      )}
    </PageContainer>
  );
};

export default QuestionsPage;