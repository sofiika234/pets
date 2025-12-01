import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false
  });
  
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const validateField = (name, value) => {
    switch(name) {
      case 'name':
        return /^[А-Яа-яёЁ\s\-]+$/.test(value) ? '' : 'Только кириллица, пробелы и дефисы';
      case 'phone':
        return /^[\+\d]+$/.test(value) ? '' : 'Только цифры и знак +';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Пожалуйста, введите корректный email';
      case 'password':
        if (value.length < 7) return 'Минимум 7 символов';
        if (!/\d/.test(value)) return 'Должна быть хотя бы одна цифра';
        if (!/[a-z]/.test(value)) return 'Должна быть хотя бы одна строчная буква';
        if (!/[A-Z]/.test(value)) return 'Должна быть хотя бы одна заглавная буква';
        return '';
      case 'confirmPassword':
        return value === formData.password ? '' : 'Пароли не совпадают';
      case 'agree':
        return value ? '' : 'Необходимо согласие';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Валидация в реальном времени
    const error = validateField(name, fieldValue);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Проверка всех полей
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Сохранение пользователя
    const user = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password, // В реальном приложении нужно хэшировать
      registrationDate: new Date().toISOString().split('T')[0]
    };

    // Сохраняем в localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(user));

    setMessage('Регистрация успешна! Перенаправляем...');
    
    setTimeout(() => {
      navigate('/profile');
    }, 1500);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Регистрация</h3>
              
              {message && (
                <div className="alert alert-success">{message}</div>
              )}
              
              <form id="registerForm" onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Имя *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : formData.name && !errors.name ? 'is-valid' : ''}`}
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">Телефон *</label>
                      <input
                        type="tel"
                        className={`form-control ${errors.phone ? 'is-invalid' : formData.phone && !errors.phone ? 'is-valid' : ''}`}
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                      {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email *</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : formData.email && !errors.email ? 'is-valid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Пароль *</label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : formData.password && !errors.password ? 'is-valid' : ''}`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  <div className="form-text">Минимум 7 символов, 1 цифра, 1 строчная и 1 заглавная буква</div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Подтверждение пароля *</label>
                  <input
                    type="password"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : formData.confirmPassword && !errors.confirmPassword ? 'is-valid' : ''}`}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                </div>
                
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className={`form-check-input ${errors.agree ? 'is-invalid' : formData.agree ? 'is-valid' : ''}`}
                    id="agree"
                    name="agree"
                    checked={formData.agree}
                    onChange={handleChange}
                    required
                  />
                  <label className="form-check-label" htmlFor="agree">
                    Согласие на обработку персональных данных *
                  </label>
                  {errors.agree && <div className="invalid-feedback d-block">{errors.agree}</div>}
                </div>
                
                <button type="submit" className="btn btn-primary w-100">
                  Зарегистрироваться
                </button>
              </form>
              
              <div className="text-center mt-3">
                <Link to="/login">Уже есть аккаунт? Войдите</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;