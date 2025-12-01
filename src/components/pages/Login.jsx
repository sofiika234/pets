import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Проверяем пользователя в localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => 
      u.email === formData.email && u.password === formData.password
    );
    
    if (user) {
      // Сохраняем пользователя в текущей сессии
      localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        registrationDate: user.registrationDate
      }));
      
      navigate('/profile');
    } else {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Вход в личный кабинет</h3>
              
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}
              
              <form id="loginForm" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Пароль *</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <button type="submit" className="btn btn-primary w-100">
                  Войти
                </button>
              </form>
              
              <div className="text-center mt-3">
                <Link to="/register">Еще нет аккаунта? Зарегистрируйтесь</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;