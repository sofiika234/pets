import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../utils/api';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: '',
    confirm: 0
  });
  
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateField = (name, value) => {
    switch(name) {
      case 'name':
        if (!value.trim()) return 'Обязательное поле';
        return /^[А-Яа-яёЁ\s\-]+$/.test(value) ? '' : 'Только кириллица, пробелы и дефисы';
      case 'phone':
        if (!value.trim()) return 'Обязательное поле';
        return /^[\+\d]+$/.test(value) ? '' : 'Только цифры и знак +';
      case 'email':
        if (!value.trim()) return 'Обязательное поле';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Неверный формат email';
      case 'password':
        if (!value) return 'Обязательное поле';
        if (value.length < 7) return 'Минимум 7 символов';
        if (!/\d/.test(value)) return 'Должна быть хотя бы одна цифра';
        if (!/[a-z]/.test(value)) return 'Должна быть хотя бы одна строчная буква';
        if (!/[A-Z]/.test(value)) return 'Должна быть хотя бы одна заглавная буква';
        return '';
      case 'password_confirmation':
        if (!value) return 'Обязательное поле';
        return value === formData.password ? '' : 'Пароли не совпадают';
      case 'confirm':
        return value === 1 ? '' : 'Необходимо согласие';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    const error = validateField(name, fieldValue);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Проверяем все поля
    const newErrors = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      await authApi.register(formData);
      
      setMessage('Регистрация успешна! Теперь вы можете войти.');
      
      // Автоматически входим после регистрации
      setTimeout(async () => {
        try {
          const loginData = {
            email: formData.email,
            password: formData.password
          };
          
          const loginResponse = await authApi.login(loginData);
          if (loginResponse.data?.token) {
            const userResponse = await authApi.getUser('me');
            localStorage.setItem('currentUser', JSON.stringify(userResponse.data.user));
            navigate('/profile');
          }
        } catch (loginError) {
          navigate('/login');
        }
      }, 2000);

    } catch (error) {
      console.error('Ошибка регистрации:', error);
      if (error.status === 422) {
        setMessage('Ошибка валидации: проверьте введенные данные');
        if (error.data?.error?.errors) {
          const serverErrors = {};
          Object.keys(error.data.error.errors).forEach(key => {
            serverErrors[key] = error.data.error.errors[key].join(', ');
          });
          setErrors(prev => ({ ...prev, ...serverErrors }));
        }
      } else {
        setMessage('Ошибка регистрации. Попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body p-4">
              <h3 className="card-title text-center mb-4 text-primary">Регистрация</h3>
              
              {message && (
                <div className={`alert ${message.includes('успешна') ? 'alert-success' : 'alert-danger'}`}>
                  {message}
                </div>
              )}
              
              <form id="registerForm" onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Имя *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Иван Иванов"
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                      <div className="form-text">Только кириллица, пробелы и дефисы</div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">Телефон *</label>
                      <input
                        type="tel"
                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="+79111234567"
                      />
                      {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                      <div className="form-text">Только цифры и знак +</div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email *</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="user@example.com"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Пароль *</label>
                      <input
                        type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Пароль"
                      />
                      {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                      <div className="form-text">Минимум 7 символов, 1 цифра, 1 строчная и 1 заглавная буква</div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="password_confirmation" className="form-label">Подтверждение пароля *</label>
                      <input
                        type="password"
                        className={`form-control ${errors.password_confirmation ? 'is-invalid' : ''}`}
                        id="password_confirmation"
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Подтвердите пароль"
                      />
                      {errors.password_confirmation && <div className="invalid-feedback">{errors.password_confirmation}</div>}
                    </div>
                  </div>
                </div>
                
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className={`form-check-input ${errors.confirm ? 'is-invalid' : ''}`}
                    id="confirm"
                    name="confirm"
                    checked={formData.confirm === 1}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <label className="form-check-label" htmlFor="confirm">
                    Согласие на обработку персональных данных *
                  </label>
                  {errors.confirm && <div className="invalid-feedback d-block">{errors.confirm}</div>}
                </div>
                
                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary py-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Регистрация...
                      </>
                    ) : 'Зарегистрироваться'}
                  </button>
                  
                  <Link to="/login" className="btn btn-outline-secondary">
                    Уже есть аккаунт? Войти
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;