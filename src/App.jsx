import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Main from './components/pages/Main';
import Search from './components/pages/Search';
import Register from './components/pages/Register';
import Login from './components/pages/Login';
import AddPet from './components/pages/AddPet';
import Profile from './components/pages/Profile';
import PetCard from './components/pages/PetCard';
import './assets/css/style.css';

// Конфигурация API
export const API_CONFIG = {
  BASE_URL: 'https://pets.сделай.site/api',
  IMAGE_BASE: 'https://pets.сделай.site'
};

function App() {
  return (
    <Router>
      <div className="app d-flex flex-column min-vh-100">
        <Header />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Navigate to="/main" />} />
            <Route path="/main" element={<Main />} />
            <Route path="/search" element={<Search />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/add-pet" element={<AddPet />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/pet/:id" element={<PetCard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;