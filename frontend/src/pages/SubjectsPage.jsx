import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { subjectService } from '../services/api';

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

const SubjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const SubjectCard = styled.div`
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

const SubjectName = styled.h3`
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const SubjectDescription = styled.p`
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const SubjectLevel = styled.span`
  background-color: #ecf0f1;
  color: #7f8c8d;
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

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    educational_level: ''
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subjectService.getSubjects();
      setSubjects(response.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

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
      await subjectService.createSubject(formData);
      setShowModal(false);
      setFormData({ name: '', description: '', educational_level: '' });
      fetchSubjects(); // Refresh the subjects list
    } catch (err) {
      console.error('Error creating subject:', err);
      setError('Failed to create subject. Please try again.');
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <Title>Subjects</Title>
        <Button onClick={() => setShowModal(true)}>Add New Subject</Button>
      </PageHeader>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {loading ? (
        <LoadingMessage>Loading subjects...</LoadingMessage>
      ) : subjects.length === 0 ? (
        <EmptyState>
          <EmptyStateText>You haven't created any subjects yet.</EmptyStateText>
          <Button onClick={() => setShowModal(true)}>Create Your First Subject</Button>
        </EmptyState>
      ) : (
        <SubjectsGrid>
          {subjects.map(subject => (
            <SubjectCard key={subject.id}>
              <SubjectName>{subject.name}</SubjectName>
              {subject.description && (
                <SubjectDescription>{subject.description}</SubjectDescription>
              )}
              {subject.educational_level && (
                <SubjectLevel>{subject.educational_level}</SubjectLevel>
              )}
            </SubjectCard>
          ))}
        </SubjectsGrid>
      )}
      
      {showModal && (
        <Modal>
          <ModalContent>
            <ModalTitle>Add New Subject</ModalTitle>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="name">Subject Name*</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter subject name"
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
                  placeholder="Enter subject description"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="educational_level">Educational Level</Label>
                <Input
                  id="educational_level"
                  name="educational_level"
                  value={formData.educational_level}
                  onChange={handleChange}
                  placeholder="E.g., Primary, Secondary, Higher Education"
                />
              </FormGroup>
              
              <ButtonGroup>
                <CancelButton type="button" onClick={() => setShowModal(false)}>Cancel</CancelButton>
                <Button type="submit">Create Subject</Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default SubjectsPage;