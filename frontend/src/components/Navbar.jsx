import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const NavbarContainer = styled.nav`
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #3498db;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    bottom: 0;
    left: 0;
    background-color: #3498db;
    transition: width 0.3s ease;
  }
  
  &:hover:after {
    width: 100%;
  }
`;

const Button = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #c0392b;
  }
`;

const Navbar = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <NavbarContainer>
      <Logo to="/">EduQGen</Logo>
      
      {isAuthenticated ? (
        <NavLinks>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/subjects">Subjects</NavLink>
          <NavLink to="/topics">Topics</NavLink>
          <NavLink to="/questions">Questions</NavLink>
          <NavLink to="/question-sets">Question Sets</NavLink>
          <NavLink to="/generate-questions">Generate Questions</NavLink>
          <Button onClick={handleLogout}>Logout</Button>
        </NavLinks>
      ) : (
        <NavLinks>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
        </NavLinks>
      )}
    </NavbarContainer>
  );
};

export default Navbar;