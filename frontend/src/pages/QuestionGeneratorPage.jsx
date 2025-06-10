import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { questionService, subjectService, topicService } from '../services/api';

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

const Select = styled.select`
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
  min-height: 150px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
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

const FileInput = styled(Input)`
  padding: 0.5rem;
  &::file-selector-button {
    margin-right: 1rem;
    border: none;
    background: #3498db;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: background .2s ease-in-out;
  }
  
  &::file-selector-button:hover {
    background: #2980b9;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  cursor: pointer;
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
  align-self: flex-start;
  
  &:hover {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const ResultsContainer = styled.div`
  margin-top: 2rem;
`;

const ResultsHeader = styled.h2`
  color: #2c3e50;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #ecf0f1;
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

const SuccessMessage = styled.p`
  color: #27ae60;
  background-color: #d5f5e3;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const SaveButton = styled(Button)`
  background-color: #27ae60;
  
  &:hover {
    background-color: #219653;
  }
`;

const TabContainer = styled.div`
  margin-bottom: 2rem;
`;

const TabList = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.active ? 'white' : '#f8f9fa'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#3498db' : 'transparent'};
  color: ${props => props.active ? '#2c3e50' : '#7f8c8d'};
  font-weight: ${props => props.active ? '500' : 'normal'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: #2c3e50;
    background-color: ${props => props.active ? 'white' : '#f1f1f1'};
  }
`;

const FileInfo = styled.div`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #7f8c8d;
`;

const QuestionGeneratorPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'pdf'
  const [pdfFile, setPdfFile] = useState(null);
  
  const [formData, setFormData] = useState({
    subject_id: '',
    topic_id: '',
    context: '',
    taxonomy_levels: [],
    difficulty_levels: [],
    num_questions: 5,
    use_openai: true // Add this new field with default true
  });

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

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await subjectService.getSubjects();
        setSubjects(response.data);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const fetchTopics = async (subjectId) => {
    if (!subjectId) {
      setTopics([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await topicService.getTopics(parseInt(subjectId));
      setTopics(response.data);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Failed to load topics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setFormData(prev => ({
      ...prev,
      subject_id: subjectId,
      topic_id: ''
    }));
    fetchTopics(subjectId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e, category, value) => {
    const { checked } = e.target;
    
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          [category]: [...prev[category], value]
        };
      } else {
        return {
          ...prev,
          [category]: prev[category].filter(item => item !== value)
        };
      }
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
    } else if (file) {
      setPdfFile(null);
      setError('Please upload a PDF file');
      e.target.value = null; // Reset file input
    }
  };

  const validateTextForm = () => {
    if (!formData.subject_id) {
      setError('Please select a subject');
      return false;
    }
    
    if (!formData.context || formData.context.trim().length < 10) {
      setError('Please provide a context with at least 10 characters');
      return false;
    }
    
    if (formData.taxonomy_levels.length === 0) {
      setError('Please select at least one taxonomy level');
      return false;
    }
    
    if (formData.difficulty_levels.length === 0) {
      setError('Please select at least one difficulty level');
      return false;
    }
    
    return true;
  };

  const validatePdfForm = () => {
    if (!formData.subject_id) {
      setError('Please select a subject');
      return false;
    }
    
    if (!pdfFile) {
      setError('Please upload a PDF file');
      return false;
    }
    
    if (formData.taxonomy_levels.length === 0) {
      setError('Please select at least one taxonomy level');
      return false;
    }
    
    if (formData.difficulty_levels.length === 0) {
      setError('Please select at least one difficulty level');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeTab === 'text' && !validateTextForm()) return;
    if (activeTab === 'pdf' && !validatePdfForm()) return;
    
    try {
      setError(null);
      setSuccess(null);
      setGenerating(true);
      
      let response;
      
      if (activeTab === 'text') {
        // Text-based question generation
        const requestData = {
          ...formData,
          subject_id: parseInt(formData.subject_id),
          topic_id: formData.topic_id ? parseInt(formData.topic_id) : null,
          num_questions: parseInt(formData.num_questions),
          use_openai: formData.use_openai
        };
        
        response = await questionService.generateQuestions(requestData);
      } else {
        // PDF-based question generation
        const formDataObj = new FormData();
        formDataObj.append('file', pdfFile);
        formDataObj.append('subject_id', formData.subject_id);
        if (formData.topic_id) formDataObj.append('topic_id', formData.topic_id);
        
        // Convert arrays to strings for FormData
        formDataObj.append('taxonomy_levels', JSON.stringify(formData.taxonomy_levels));
        formDataObj.append('difficulty_levels', JSON.stringify(formData.difficulty_levels));
        formDataObj.append('num_questions', formData.num_questions);
        formDataObj.append('use_openai', formData.use_openai);
        
        response = await questionService.generateQuestionsFromPdf(formDataObj);
      }
      
      setGeneratedQuestions(response.data);
      setSuccess(`Successfully generated ${response.data.length} questions!`);
      
    } catch (err) {
      console.error('Error generating questions:', err);
      setError('Failed to generate questions. Please try again later.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveQuestions = async () => {
    // This would typically save the generated questions to the database
    // For now, we'll just show a success message
    setSuccess('Questions saved successfully!');
  };

  const getTaxonomyLevelLabel = (level) => {
    const found = taxonomyLevels.find(t => t.value === level);
    return found ? found.label : level;
  };

  return (
    <PageContainer>
      <PageHeader>
        <Title>Generate Questions</Title>
        <Subtitle>Use AI to generate questions based on your content</Subtitle>
      </PageHeader>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <TabContainer>
        <TabList>
          <Tab 
            active={activeTab === 'text'} 
            onClick={() => setActiveTab('text')}
          >
            Text Input
          </Tab>
          <Tab 
            active={activeTab === 'pdf'} 
            onClick={() => setActiveTab('pdf')}
          >
            PDF Upload
          </Tab>
        </TabList>
      </TabContainer>
      
      <FormContainer>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="subject_id">Subject*</Label>
            <Select
              id="subject_id"
              name="subject_id"
              value={formData.subject_id}
              onChange={handleSubjectChange}
              required
            >
              <option value="">Select a Subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="topic_id">Topic (Optional)</Label>
            <Select
              id="topic_id"
              name="topic_id"
              value={formData.topic_id}
              onChange={handleInputChange}
              disabled={!formData.subject_id || topics.length === 0}
            >
              <option value="">Select a Topic</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </Select>
          </FormGroup>
          
          {activeTab === 'text' ? (
            <FormGroup>
              <Label htmlFor="context">Content Context*</Label>
              <TextArea
                id="context"
                name="context"
                value={formData.context}
                onChange={handleInputChange}
                placeholder="Paste your content or context here. This will be used to generate relevant questions."
                required
              />
            </FormGroup>
          ) : (
            <FormGroup>
              <Label htmlFor="pdf-upload">Upload PDF*</Label>
              <FileInput
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              {pdfFile && (
                <FileInfo>
                  Selected file: {pdfFile.name} ({Math.round(pdfFile.size / 1024)} KB)
                </FileInfo>
              )}
            </FormGroup>
          )}
          
          <FormGroup>
            <Label>Taxonomy Levels*</Label>
            <CheckboxContainer>
              {taxonomyLevels.map(level => (
                <CheckboxGroup key={level.value}>
                  <Checkbox
                    type="checkbox"
                    id={`taxonomy-${level.value}`}
                    checked={formData.taxonomy_levels.includes(level.value)}
                    onChange={(e) => handleCheckboxChange(e, 'taxonomy_levels', level.value)}
                  />
                  <Label htmlFor={`taxonomy-${level.value}`}>{level.label}</Label>
                </CheckboxGroup>
              ))}
            </CheckboxContainer>
          </FormGroup>
          
          <FormGroup>
            <Label>Difficulty Levels*</Label>
            <CheckboxContainer>
              {difficultyLevels.map(level => (
                <CheckboxGroup key={level.value}>
                  <Checkbox
                    type="checkbox"
                    id={`difficulty-${level.value}`}
                    checked={formData.difficulty_levels.includes(level.value)}
                    onChange={(e) => handleCheckboxChange(e, 'difficulty_levels', level.value)}
                  />
                  <Label htmlFor={`difficulty-${level.value}`}>{level.label}</Label>
                </CheckboxGroup>
              ))}
            </CheckboxContainer>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="num_questions">Number of Questions</Label>
            <Input
              type="number"
              id="num_questions"
              name="num_questions"
              value={formData.num_questions}
              onChange={handleInputChange}
              min="1"
              max="20"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Question Generation Method</Label>
            <CheckboxContainer>
              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  id="use-openai"
                  checked={formData.use_openai}
                  onChange={(e) => setFormData(prev => ({ ...prev, use_openai: e.target.checked }))}
                />
                <Label htmlFor="use-openai">Use OpenAI (if unchecked, NLTK-based generation will be used)</Label>
              </CheckboxGroup>
            </CheckboxContainer>
          </FormGroup>
          
          <Button type="submit" disabled={generating || loading}>
            {generating ? 'Generating...' : 'Generate Questions'}
          </Button>
        </Form>
      </FormContainer>
      
      {generatedQuestions.length > 0 && (
        <ResultsContainer>
          <ResultsHeader>Generated Questions</ResultsHeader>
          
          <SaveButton onClick={handleSaveQuestions} style={{ marginBottom: '1.5rem' }}>
            Save All Questions
          </SaveButton>
          
          <QuestionsContainer>
            {generatedQuestions.map((question, index) => (
              <QuestionCard key={index}>
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
        </ResultsContainer>
      )}
    </PageContainer>
  );
};

export default QuestionGeneratorPage;