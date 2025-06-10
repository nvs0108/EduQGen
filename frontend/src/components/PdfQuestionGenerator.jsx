import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Button, FormControl, FormLabel, Select, 
  Text, VStack, HStack, Heading, useToast,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  Checkbox, CheckboxGroup, Spinner, Input
} from '@chakra-ui/react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const PdfQuestionGenerator = () => {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [taxonomyLevels, setTaxonomyLevels] = useState(['KNOWLEDGE', 'COMPREHENSION', 'APPLICATION']);
  const [difficultyLevels, setDifficultyLevels] = useState(['EASY', 'MEDIUM']);
  const [numQuestions, setNumQuestions] = useState(5);
  const [pdfFile, setPdfFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const toast = useToast();

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/subjects/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubjects(response.data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch subjects',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchSubjects();
  }, [toast]);

  // Fetch topics when subject changes
  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedSubject) {
        setTopics([]);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/subjects/${selectedSubject}/topics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTopics(response.data);
      } catch (error) {
        console.error('Error fetching topics:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch topics',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchTopics();
  }, [selectedSubject, toast]);

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setSelectedTopic(''); // Reset topic when subject changes
  };

  const handleTopicChange = (e) => {
    setSelectedTopic(e.target.value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setPdfFile(null);
      e.target.value = null; // Reset file input
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedSubject) {
      toast({
        title: 'Missing information',
        description: 'Please select a subject',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!pdfFile) {
      toast({
        title: 'Missing file',
        description: 'Please upload a PDF file',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setGeneratedQuestions([]);

    try {
      const token = localStorage.getItem('token');
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', pdfFile);
      
      // Add other parameters
      formData.append('subject_id', selectedSubject);
      if (selectedTopic) formData.append('topic_id', selectedTopic);
      formData.append('taxonomy_levels', JSON.stringify(taxonomyLevels));
      formData.append('difficulty_levels', JSON.stringify(difficultyLevels));
      formData.append('num_questions', numQuestions);

      const response = await axios.post(
        `${API_URL}/questions/generate-from-pdf`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setGeneratedQuestions(response.data);
      toast({
        title: 'Success',
        description: `Generated ${response.data.length} questions`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate questions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={5}>
      <Heading mb={5}>Generate Questions from PDF</Heading>
      
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Subject</FormLabel>
          <Select 
            placeholder="Select subject" 
            value={selectedSubject} 
            onChange={handleSubjectChange}
          >
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Topic (Optional)</FormLabel>
          <Select 
            placeholder="Select topic" 
            value={selectedTopic} 
            onChange={handleTopicChange}
            isDisabled={!selectedSubject || topics.length === 0}
          >
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Upload PDF</FormLabel>
          <Input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            p={1}
          />
          {pdfFile && (
            <Text mt={2} fontSize="sm">
              Selected file: {pdfFile.name} ({Math.round(pdfFile.size / 1024)} KB)
            </Text>
          )}
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Taxonomy Levels</FormLabel>
          <CheckboxGroup 
            colorScheme="blue" 
            defaultValue={taxonomyLevels}
            onChange={setTaxonomyLevels}
          >
            <HStack spacing={4}>
              <Checkbox value="KNOWLEDGE">Knowledge</Checkbox>
              <Checkbox value="COMPREHENSION">Comprehension</Checkbox>
              <Checkbox value="APPLICATION">Application</Checkbox>
              <Checkbox value="ANALYSIS">Analysis</Checkbox>
              <Checkbox value="SYNTHESIS">Synthesis</Checkbox>
              <Checkbox value="EVALUATION">Evaluation</Checkbox>
            </HStack>
          </CheckboxGroup>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Difficulty Levels</FormLabel>
          <CheckboxGroup 
            colorScheme="green" 
            defaultValue={difficultyLevels}
            onChange={setDifficultyLevels}
          >
            <HStack spacing={4}>
              <Checkbox value="EASY">Easy</Checkbox>
              <Checkbox value="MEDIUM">Medium</Checkbox>
              <Checkbox value="HARD">Hard</Checkbox>
            </HStack>
          </CheckboxGroup>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Number of Questions</FormLabel>
          <NumberInput 
            min={1} 
            max={20} 
            value={numQuestions}
            onChange={(valueString) => setNumQuestions(parseInt(valueString))}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <Button
          colorScheme="blue"
          onClick={handleGenerateQuestions}
          isLoading={isLoading}
          loadingText="Generating..."
          isDisabled={!selectedSubject || !pdfFile}
          mt={4}
        >
          Generate Questions
        </Button>
      </VStack>

      {isLoading && (
        <Box textAlign="center" mt={8}>
          <Spinner size="xl" />
          <Text mt={4}>Generating questions... This may take a minute.</Text>
        </Box>
      )}

      {generatedQuestions.length > 0 && (
        <Box mt={8}>
          <Heading size="md" mb={4}>Generated Questions</Heading>
          <VStack spacing={4} align="stretch">
            {generatedQuestions.map((question, index) => (
              <Box key={question.id} p={4} borderWidth={1} borderRadius="md">
                <Text fontWeight="bold">Question {index + 1}: {question.content}</Text>
                <Text mt={2}>Answer: {question.answer}</Text>
                <Text fontSize="sm" mt={2}>
                  Taxonomy Level: {question.bloom_taxonomy_level} | 
                  Difficulty: {question.difficulty_level}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default PdfQuestionGenerator;