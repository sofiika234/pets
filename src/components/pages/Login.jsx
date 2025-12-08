import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../utils/api';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Тестовые данные из ТЗ
    if (formData.phone === '89111234567' && formData.password === 'Password123') {
      formData.email = 'test@test.ru'; // Подставляем email для теста
    }

    try {
      const response = await authApi.login(formData);
      
      if (response.data?.token) {
        // Получаем информацию о пользователе
        try {
          const userResponse = await authApi.getUser('me');
          const userData = userResponse.data.user;
          
          localStorage.setItem('currentUser', JSON.stringify(userData));
          setError('');
          navigate('/profile');
        } catch (userError) {
          console.error('Ошибка получения данных пользователя:', userError);
          setError('Успешный вход, но не удалось загрузить профиль');
        }
      } else {
        setError('Неверные учетные данные');
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      if (error.status === 401) {
        setError('Неверный email или пароль');
      } else if (error.status === 422) {
        setError('Ошибка валидации: проверьте введенные данные');
      } else {
        setError('Ошибка сервера. Попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body p-4">
              <h3 className="card-title text-center mb-4 text-primary">Вход в личный кабинет</h3>
              
              <div className="alert alert-info mb-4">
                <strong>Для тестирования:</strong><br />
                Телефон: <code>89111234567</code><br />
                Пароль: <code>Password123</code>
              </div>
              
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
                    disabled={isLoading}
                    placeholder="user@example.com"
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
                    disabled={isLoading}
                    placeholder="Введите пароль"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Вход...
                    </>
                  ) : 'Войти'}
                </button>
              </form>
              
              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-muted mb-2">Еще нет аккаунта?</p>
                <Link to="/register" className="btn btn-outline-primary">
                  Зарегистрироваться
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;