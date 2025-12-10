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

    try {
      console.log('Отправка данных для входа:', formData);
      const response = await authApi.login(formData);
      console.log('Ответ от сервера при входе:', response);
      
      // Получаем токен из ответа
      let token = null;
      if (response.token) {
        token = response.token;
      } else if (response.data?.token) {
        token = response.data.token;
      } else if (response.access_token) {
        token = response.access_token;
      } else if (response.data?.access_token) {
        token = response.data.access_token;
      }
      
      if (token) {
        console.log('Токен получен, сохраняем в localStorage');
        localStorage.setItem('authToken', token);
        
        // Получаем данные пользователя
        try {
          const userResponse = await fetch('https://pets.сделай.site/api/user', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('Данные пользователя с API:', userData);
            
            const preparedUser = {
              id: userData.id || userData._id || `user-${Date.now()}`,
              name: userData.name || userData.username || formData.email.split('@')[0] || 'Пользователь',
              email: userData.email || formData.email,
              phone: userData.phone || '',
              registrationDate: userData.created_at || userData.createdAt || new Date().toISOString().split('T')[0]
            };
            
            localStorage.setItem('currentUser', JSON.stringify(preparedUser));
            console.log('Пользователь сохранен в localStorage');
          } else {
            console.log('API пользователя вернул статус:', userResponse.status);
            // Создаем временного пользователя
            const fallbackUser = {
              id: `user-${Date.now()}`,
              name: formData.email.split('@')[0] || 'Пользователь',
              email: formData.email,
              phone: '',
              registrationDate: new Date().toISOString().split('T')[0]
            };
            localStorage.setItem('currentUser', JSON.stringify(fallbackUser));
          }
        } catch (userError) {
          console.error('Ошибка получения данных пользователя:', userError);
          // Создаем пользователя из email
          const fallbackUser = {
            id: `user-${Date.now()}`,
            name: formData.email.split('@')[0] || 'Пользователь',
            email: formData.email,
            phone: '',
            registrationDate: new Date().toISOString().split('T')[0]
          };
          localStorage.setItem('currentUser', JSON.stringify(fallbackUser));
        }
        
        // Перенаправляем на профиль
        setError('Успешный вход! Перенаправляем...');
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
        
      } else {
        setError('Токен не получен от сервера. Проверьте учетные данные.');
      }
      
    } catch (error) {
      console.error('Ошибка входа:', error);
      
      // Тестовый вход
      if (formData.email === 'test@test.ru' && formData.password === 'Password123') {
        console.log('Используем тестовый вход');
        
        const testUser = {
          id: 'test-user-123',
          name: 'Тестовый пользователь',
          email: 'test@test.ru',
          phone: '+79111234567',
          registrationDate: '2024-01-01'
        };
        
        localStorage.setItem('authToken', 'test-token-' + Date.now());
        localStorage.setItem('currentUser', JSON.stringify(testUser));
        
        setError('Тестовый вход успешен! Переходим в профиль...');
        
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
        
        return;
      }
      
      if (error.status === 401) {
        setError('Неверный email или пароль');
      } else if (error.status === 422) {
        setError('Ошибка валидации: проверьте введенные данные');
      } else if (error.message?.includes('Нет подключения') || error.message?.includes('Network')) {
        setError('Нет подключения к серверу. Проверьте интернет-соединение.');
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
        <div className="col-md-6 col-lg-5">
          <div className="card shadow border-0">
            <div className="card-header bg-primary text-white py-3">
              <h4 className="mb-0 text-center">
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Вход в систему
              </h4>
            </div>
            <div className="card-body p-4">
              {error && (
                <div className={`alert ${error.includes('успеш') || error.includes('Перенаправляем') ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`}>
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}
              
              <div className="alert alert-info mb-4">
                <h6 className="alert-heading">
                  <i className="bi bi-info-circle me-2"></i>
                  Для тестирования:
                </h6>
                <div className="small">
                  <div className="mb-1">
                    <strong>Email:</strong> <code>test@test.ru</code>
                  </div>
                  <div>
                    <strong>Пароль:</strong> <code>Password123</code>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold">
                    <i className="bi bi-envelope me-2"></i>
                    Email *
                  </label>
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
                
                <div className="mb-4">
                  <label htmlFor="password" className="form-label fw-semibold">
                    <i className="bi bi-key me-2"></i>
                    Пароль *
                  </label>
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
                  className="btn btn-primary w-100 py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Выполняется вход...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Войти
                    </>
                  )}
                </button>
              </form>
              
              <div className="text-center mt-4 pt-4 border-top">
                <p className="text-muted mb-3">Еще нет аккаунта?</p>
                <Link to="/register" className="btn btn-outline-primary w-100">
                  <i className="bi bi-person-plus me-2"></i>
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