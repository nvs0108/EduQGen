import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { subjectService, topicService } from '../services/api';

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

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
`;

const FilterLabel = styled.label`
  font-weight: 500;
  color: #2c3e50;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TopicsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const TopicCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const TopicName = styled.h3`
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const TopicDescription = styled.p`
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const SubjectBadge = styled.span`
  background-color: #3498db;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  display: inline-block;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ModalTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const CancelButton = styled(Button)`
  background-color: #e74c3c;
  
  &:hover {
    background-color: #c0392b;
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

const TopicsPage = () => {
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject_id: ''
  });

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.getSubjects();
      setSubjects(response.data);
      
      // If there are subjects and none is selected, select the first one
      if (response.data.length > 0 && !selectedSubject) {
        setSelectedSubject(response.data[0].id.toString());
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects. Please try again later.');
    }
  };

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const subjectId = selectedSubject ? parseInt(selectedSubject) : null;
      const response = await topicService.getTopics(subjectId);
      setTopics(response.data);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Failed to load topics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (subjects.length > 0) {
      fetchTopics();
    }
  }, [selectedSubject, subjects]);

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Ensure subject_id is a number
      const topicData = {
        ...formData,
        subject_id: parseInt(formData.subject_id)
      };
      
      await topicService.createTopic(topicData);
      setShowModal(false);
      setFormData({ name: '', description: '', subject_id: '' });
      fetchTopics(); // Refresh the topics list
    } catch (err) {
      console.error('Error creating topic:', err);
      setError('Failed to create topic. Please try again.');
    }
  };

  const getSubjectNameById = (id) => {
    const subject = subjects.find(s => s.id === id);
    return subject ? subject.name : 'Unknown Subject';
  };

  const openAddTopicModal = () => {
    // Pre-select the currently filtered subject if any
    if (selectedSubject) {
      setFormData(prev => ({
        ...prev,
        subject_id: selectedSubject
      }));
    }
    setShowModal(true);
  };

  return (
    <PageContainer>
      <PageHeader>
        <Title>Topics</Title>
        <Button onClick={openAddTopicModal}>Add New Topic</Button>
      </PageHeader>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <FilterContainer>
        <FilterLabel htmlFor="subject-filter">Filter by Subject:</FilterLabel>
        <Select
          id="subject-filter"
          value={selectedSubject}
          onChange={handleSubjectChange}
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </Select>
      </FilterContainer>
      
      {loading ? (
        <LoadingMessage>Loading topics...</LoadingMessage>
      ) : topics.length === 0 ? (
        <EmptyState>
          <EmptyStateText>
            {selectedSubject 
              ? `No topics found for the selected subject.` 
              : `You haven't created any topics yet.`}
          </EmptyStateText>
          <Button onClick={openAddTopicModal}>Create Your First Topic</Button>
        </EmptyState>
      ) : (
        <TopicsGrid>
          {topics.map(topic => (
            <TopicCard key={topic.id}>
              <TopicName>{topic.name}</TopicName>
              {topic.description && (
                <TopicDescription>{topic.description}</TopicDescription>
              )}
              <SubjectBadge>{getSubjectNameById(topic.subject_id)}</SubjectBadge>
            </TopicCard>
          ))}
        </TopicsGrid>
      )}
      
      {showModal && (
        <Modal>
          <ModalContent>
            <ModalTitle>Add New Topic</ModalTitle>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="subject_id">Subject*</Label>
                <Select
                  id="subject_id"
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleChange}
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
                <Label htmlFor="name">Topic Name*</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter topic name"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="description">Description</Label>
                <TextArea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter topic description"
                />
              </FormGroup>
              
              <ButtonGroup>
                <CancelButton type="button" onClick={() => setShowModal(false)}>Cancel</CancelButton>
                <Button type="submit">Create Topic</Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default TopicsPage;