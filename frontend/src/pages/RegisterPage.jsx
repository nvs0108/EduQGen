import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const RegisterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  max-width: 500px;
  margin: 2rem auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: #2c3e50;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  width: 100%;
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

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 0.5rem;
  
  &:hover {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background-color: #fadbd8;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  width: 100%;
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: #27ae60;
  background-color: #d5f5e3;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  width: 100%;
  text-align: center;
`;

const LoginLink = styled.p`
  margin-top: 1.5rem;
  color: #7f8c8d;
  
  a {
    color: #3498db;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'educator',
    institution: ''
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // Remove confirmPassword as it's not part of the API schema
      const { confirmPassword, ...registerData } = formData;
      
      await register(registerData);
      setSuccess('Registration successful! You can now log in.');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.detail) {
        // Handle API validation errors
        const apiErrors = {};
        err.response.data.detail.forEach(error => {
          // Map API error fields to form fields
          const field = error.loc[error.loc.length - 1];
          apiErrors[field] = error.msg;
        });
        setErrors(apiErrors);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    }
  };

  return (
    <RegisterContainer>
      <Title>Create an Account</Title>
      
      {success && <SuccessMessage>{success}</SuccessMessage>}
      {errors.general && <ErrorMessage>{errors.general}</ErrorMessage>}
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="username">Username*</Label>
          <Input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
          />
          {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="email">Email*</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
          {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Enter your full name"
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="password">Password*</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
          />
          {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="confirmPassword">Confirm Password*</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="role">Role</Label>
          <Select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="educator">Educator</option>
            <option value="admin">Administrator</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="institution">Institution</Label>
          <Input
            id="institution"
            name="institution"
            type="text"
            value={formData.institution}
            onChange={handleChange}
            placeholder="Enter your institution name"
          />
        </FormGroup>
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </Form>
      
      <LoginLink>
        Already have an account? <Link to="/login">Login here</Link>
      </LoginLink>
    </RegisterContainer>
  );
};

export default RegisterPage;