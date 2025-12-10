import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../utils/api';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: '',
    confirm: false
  });
  
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(true);
  const [connectionTested, setConnectionTested] = useState(false);
  const navigate = useNavigate();

  // Функция для форматирования телефона
  const formatPhoneNumber = (value) => {
    // Удаляем все нецифровые символы кроме +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Если номер начинается с 8, меняем на +7
    if (cleaned.startsWith('8')) {
      return '+7' + cleaned.substring(1);
    }
    
    // Если номер начинается с 7, добавляем +
    if (cleaned.startsWith('7') && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    // Если номер начинается с 9 и нет кода страны, добавляем +7
    if (cleaned.startsWith('9') && !cleaned.startsWith('+') && cleaned.length <= 10) {
      return '+7' + cleaned;
    }
    
    return cleaned;
  };

  // Проверка доступности сервера
  const checkServerAvailability = useCallback(async () => {
    if (connectionTested) return serverAvailable;
    
    setIsLoading(true);
    try {
      // Пробуем выполнить простой запрос к API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        // Используем метод debugApi из вашего файла
        const { debugApi } = require('../../utils/api');
        const result = await debugApi.testConnection();
        
        clearTimeout(timeoutId);
        
        if (result.success) {
          console.log('Сервер доступен:', result);
          setServerAvailable(true);
          setConnectionTested(true);
          return true;
        } else {
          console.warn('Сервер не отвечает:', result);
          setServerAvailable(false);
          setConnectionTested(true);
          return false;
        }
      } catch (error) {
        console.log('API тест не доступен, пробуем простой fetch');
        
        // Пробуем обычный fetch
        const response = await fetch('https://pets.сделай.site/api/health', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setServerAvailable(true);
          setConnectionTested(true);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.log('Проверка сервера не удалась:', error);
      setServerAvailable(false);
      setConnectionTested(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [connectionTested, serverAvailable]);

  useEffect(() => {
    // Проверяем сервер при загрузке компонента
    checkServerAvailability();
    
    // Восстанавливаем данные из localStorage, если есть
    const savedData = localStorage.getItem('register_form_draft');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsedData }));
      } catch (e) {
        console.log('Failed to parse saved form data');
      }
    }
    
    // Автосохранение формы каждые 10 секунд
    const saveInterval = setInterval(() => {
      if (Object.values(formData).some(value => value && value !== '' && value !== false)) {
        localStorage.setItem('register_form_draft', JSON.stringify(formData));
      }
    }, 10000);
    
    return () => {
      clearInterval(saveInterval);
    };
  }, []);

  // Валидация полей с улучшенными сообщениями
  const validateField = useCallback((name, value, allData = formData) => {
    switch(name) {
      case 'name':
        if (!value.trim()) return 'Обязательное поле';
        if (value.length < 2) return 'Минимум 2 символа';
        if (value.length > 50) return 'Максимум 50 символов';
        if (!/^[А-Яа-яёЁA-Za-z\s\-]+$/.test(value.trim())) {
          return 'Только буквы, пробелы и дефисы';
        }
        return '';
        
      case 'phone':
        if (!value.trim()) return 'Обязательное поле';
        const cleanedPhone = value.replace(/[\s\-\(\)]/g, '');
        
        // Проверяем российский номер телефона
        if (!/^[\+]?[78]\d{10}$/.test(cleanedPhone)) {
          // Даем более конкретные сообщения об ошибках
          if (cleanedPhone.length === 0) return 'Введите номер телефона';
          if (!/^[\+]?[78]/.test(cleanedPhone)) return 'Номер должен начинаться с +7, 7 или 8';
          if (cleanedPhone.length < 11) return 'Слишком короткий номер';
          if (cleanedPhone.length > 12) return 'Слишком длинный номер';
          return 'Неверный формат номера телефона';
        }
        return '';
        
      case 'email':
        if (!value.trim()) return 'Обязательное поле';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Неверный формат email';
        if (value.length > 100) return 'Email слишком длинный';
        return '';
        
      case 'password':
        if (!value) return 'Обязательное поле';
        if (value.length < 8) return 'Минимум 8 символов';
        if (!/\d/.test(value)) return 'Должна быть хотя бы одна цифра';
        if (!/[a-zа-яё]/.test(value)) return 'Должна быть хотя бы одна строчная буква';
        if (!/[A-ZА-ЯЁ]/.test(value)) return 'Должна быть хотя бы одна заглавная буква';
        if (/\s/.test(value)) return 'Пароль не должен содержать пробелы';
        // Проверка на слишком простые пароли
        const commonPasswords = ['password', '12345678', 'qwerty', 'admin'];
        if (commonPasswords.includes(value.toLowerCase())) {
          return 'Слишком простой пароль';
        }
        return '';
        
      case 'password_confirmation':
        if (!value) return 'Обязательное поле';
        return value === allData.password ? '' : 'Пароли не совпадают';
        
      case 'confirm':
        return value === true ? '' : 'Необходимо согласие';
        
      default:
        return '';
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let fieldValue = type === 'checkbox' ? checked : value;
    
    // Особый случай для телефона - форматируем его
    if (name === 'phone') {
      fieldValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Для пароля и подтверждения пароля валидируем оба поля
    if (name === 'password' || name === 'password_confirmation') {
      const passwordError = validateField('password', name === 'password' ? fieldValue : formData.password);
      const confirmError = validateField(
        'password_confirmation', 
        name === 'password_confirmation' ? fieldValue : formData.password_confirmation
      );
      
      setErrors(prev => ({
        ...prev,
        password: passwordError,
        password_confirmation: confirmError
      }));
    } else {
      const error = validateField(name, fieldValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
    
    if (message) setMessage('');
  };

  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    return newErrors;
  }, [formData, validateField]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setErrors({});

    // Проверяем сервер перед отправкой
    const isServerAvailable = await checkServerAvailability();
    if (!isServerAvailable) {
      setMessage('Сервер временно недоступен. Попробуйте позже или проверьте интернет-соединение.');
      setIsLoading(false);
      return;
    }

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Отправка данных регистрации на API:', formData);
      
      // Подготовка данных для отправки (в соответствии с вашим API)
      const registrationData = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/[\s\-\(\)]/g, ''),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        password_confirmation: formData.password_confirmation
      };
      
      console.log('Очищенные данные для API:', registrationData);
      
      // Отправка запроса через ваш authApi
      const response = await authApi.register(registrationData);
      
      console.log('Ответ сервера:', response);
      
      if (response.success || response.message?.includes('успешно') || response.status === 'success' || response.data) {
        const successMessage = response.message || 'Регистрация успешна! Теперь вы можете войти в систему.';
        setMessage(successMessage);
        
        // Очищаем черновик после успешной регистрации
        localStorage.removeItem('register_form_draft');
        
        // Сохраняем email для автозаполнения на странице входа
        localStorage.setItem('last_registered_email', formData.email);
        
        // Очищаем форму
        setFormData({
          name: '',
          phone: '',
          email: '',
          password: '',
          password_confirmation: '',
          confirm: false
        });
        
        // Перенаправляем на страницу входа через 3 секунды
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              prefillEmail: registrationData.email,
              successMessage: successMessage 
            }
          });
        }, 3000);
        
      } else {
        const errorMessage = response.message || 'Регистрация не удалась. Попробуйте еще раз.';
        setMessage(errorMessage);
      }

    } catch (error) {
      console.error('Детали ошибки регистрации:', error);
      
      // Используем обработку ошибок из вашего API
      if (error.status === 422) {
        // Парсим ошибки валидации сервера
        const errorData = error.data || {};
        console.log('Ошибки валидации сервера:', errorData);
        
        const serverErrors = {};
        
        if (errorData.errors) {
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              const message = messages.join(', ');
              serverErrors[field] = message;
            } else if (typeof messages === 'string') {
              serverErrors[field] = messages;
            }
          });
        }
        
        if (Object.keys(serverErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...serverErrors }));
          setMessage('Пожалуйста, исправьте ошибки в форме');
        } else if (errorData.message) {
          setMessage(errorData.message);
        } else if (typeof errorData === 'string') {
          setMessage(errorData);
        } else {
          setMessage('Ошибка валидации данных');
        }
        
      } else if (error.status === 409 || error.status === 400) {
        setMessage('Пользователь с таким email или телефоном уже существует');
        
      } else if (error.status === 0 || error.isNetworkError) {
        setMessage('Нет подключения к серверу. Проверьте интернет-соединение.');
        setServerAvailable(false);
        
      } else {
        setMessage(error.message || 'Произошла ошибка при регистрации. Попробуйте еще раз.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem('register_form_draft');
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      password_confirmation: '',
      confirm: false
    });
    setMessage('Черновик очищен');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setMessage('Проверяем соединение с сервером...');
    
    const isAvailable = await checkServerAvailability();
    
    if (isAvailable) {
      setMessage('Соединение с сервером установлено!');
    } else {
      setMessage('Не удалось подключиться к серверу.');
    }
    
    setTimeout(() => setMessage(''), 5000);
    setIsLoading(false);
  };

  const hasErrors = Object.keys(errors).some(key => errors[key]);
  const isFormValid = !hasErrors && formData.confirm;
  const hasDraft = localStorage.getItem('register_form_draft');

  return (
    <div className="container mt-4 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {!serverAvailable && connectionTested && (
            <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
              <i className="bi bi-wifi-off me-2"></i>
              <strong>Внимание:</strong> Сервер может быть временно недоступен. 
              Вы все еще можете заполнить форму, но регистрация будет выполнена позже.
              <div className="mt-2">
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-warning"
                  onClick={handleTestConnection}
                  disabled={isLoading}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Проверить соединение
                </button>
              </div>
            </div>
          )}
          
          <div className="card shadow-lg border-0">
            <div className="card-header bg-gradient-primary text-white py-4">
              <h4 className="mb-0 text-center">
                <i className="bi bi-person-plus me-2"></i>
                Создание аккаунта
              </h4>
              <p className="text-center mb-0 small opacity-90">
                Присоединяйтесь к сообществу помощи животным
              </p>
            </div>
            <div className="card-body p-4 p-md-5">
              {hasDraft && (
                <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
                  <i className="bi bi-save me-2"></i>
                  У вас есть сохраненный черновик формы
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={handleClearDraft}
                    title="Очистить черновик"
                  ></button>
                </div>
              )}
              
              {message && (
                <div className={`alert ${message.includes('успешн') || message.includes('Соединение') ? 'alert-success' : 'alert-danger'} alert-dismissible fade show mb-4`} role="alert">
                  <div className="d-flex align-items-center">
                    <i className={`bi ${message.includes('успешн') || message.includes('Соединение') ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    <span>{message}</span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                </div>
              )}
              
              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-12">
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label fw-semibold">
                        <i className="bi bi-person me-2 text-primary"></i>
                        Имя *
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : formData.name ? 'is-valid' : ''}`}
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Иван Иванов"
                        autoComplete="name"
                        aria-describedby="nameHelp"
                      />
                      {errors.name ? (
                        <div className="invalid-feedback d-flex align-items-center">
                          <i className="bi bi-exclamation-circle me-2"></i>
                          {errors.name}
                        </div>
                      ) : formData.name && (
                        <div className="valid-feedback d-flex align-items-center">
                          <i className="bi bi-check-circle me-2"></i>
                          Корректное имя
                        </div>
                      )}
                      <div id="nameHelp" className="form-text">
                        Как к вам обращаться (только буквы, пробелы и дефисы)
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-12">
                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label fw-semibold">
                        <i className="bi bi-phone me-2 text-primary"></i>
                        Телефон *
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-telephone"></i>
                        </span>
                        <input
                          type="tel"
                          className={`form-control ${errors.phone ? 'is-invalid' : formData.phone ? 'is-valid' : ''}`}
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={isLoading}
                          placeholder="+7 (912) 345-67-89"
                          autoComplete="tel"
                          pattern="[\+]?[78][\d\s\-\(\)]{10,}"
                          maxLength="18"
                        />
                      </div>
                      {errors.phone ? (
                        <div className="invalid-feedback d-flex align-items-center">
                          <i className="bi bi-exclamation-circle me-2"></i>
                          {errors.phone}
                        </div>
                      ) : formData.phone && (
                        <div className="valid-feedback d-flex align-items-center">
                          <i className="bi bi-check-circle me-2"></i>
                          Корректный номер телефона
                        </div>
                      )}
                      <div className="form-text">
                        Пример: +7 912 345 67 89 или 8 (912) 345-67-89
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-12">
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-semibold">
                        <i className="bi bi-envelope me-2 text-primary"></i>
                        Email *
                      </label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : formData.email ? 'is-valid' : ''}`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="user@example.com"
                        autoComplete="email"
                      />
                      {errors.email ? (
                        <div className="invalid-feedback d-flex align-items-center">
                          <i className="bi bi-exclamation-circle me-2"></i>
                          {errors.email}
                        </div>
                      ) : formData.email && (
                        <div className="valid-feedback d-flex align-items-center">
                          <i className="bi bi-check-circle me-2"></i>
                          Корректный email
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3 position-relative">
                      <label htmlFor="password" className="form-label fw-semibold">
                        <i className="bi bi-lock me-2 text-primary"></i>
                        Пароль *
                      </label>
                      <input
                        type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : formData.password ? 'is-valid' : ''}`}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-describedby="passwordHelp"
                      />
                      {errors.password ? (
                        <div className="invalid-feedback d-flex align-items-center">
                          <i className="bi bi-exclamation-circle me-2"></i>
                          {errors.password}
                        </div>
                      ) : formData.password && (
                        <div className="valid-feedback d-flex align-items-center">
                          <i className="bi bi-check-circle me-2"></i>
                          Надежный пароль
                        </div>
                      )}
                      <div id="passwordHelp" className="form-text small">
                        <div>✓ Минимум 8 символов</div>
                        <div>✓ Цифры и буквы</div>
                        <div>✓ Заглавные и строчные буквы</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="password_confirmation" className="form-label fw-semibold">
                        <i className="bi bi-lock-fill me-2 text-primary"></i>
                        Подтверждение пароля *
                      </label>
                      <input
                        type="password"
                        className={`form-control ${errors.password_confirmation ? 'is-invalid' : formData.password_confirmation ? 'is-valid' : ''}`}
                        id="password_confirmation"
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                      {errors.password_confirmation ? (
                        <div className="invalid-feedback d-flex align-items-center">
                          <i className="bi bi-exclamation-circle me-2"></i>
                          {errors.password_confirmation}
                        </div>
                      ) : formData.password_confirmation && formData.password === formData.password_confirmation && (
                        <div className="valid-feedback d-flex align-items-center">
                          <i className="bi bi-check-circle me-2"></i>
                          Пароли совпадают
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-12">
                    <div className={`form-check mb-4 p-3 rounded ${errors.confirm ? 'border border-danger' : 'border'}`}>
                      <input
                        type="checkbox"
                        className={`form-check-input ${errors.confirm ? 'is-invalid' : formData.confirm ? 'is-valid' : ''}`}
                        id="confirm"
                        name="confirm"
                        checked={formData.confirm}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      <label className="form-check-label ms-2" htmlFor="confirm">
                        Я согласен на{' '}
                        <Link to="/privacy" className="text-decoration-none fw-semibold" target="_blank">
                          обработку персональных данных
                        </Link>{' '}
                        и принимаю{' '}
                        <Link to="/terms" className="text-decoration-none fw-semibold" target="_blank">
                          условия использования
                        </Link>
                        *
                      </label>
                      {errors.confirm ? (
                        <div className="invalid-feedback d-block d-flex align-items-center mt-2">
                          <i className="bi bi-exclamation-circle me-2"></i>
                          {errors.confirm}
                        </div>
                      ) : formData.confirm && (
                        <div className="valid-feedback d-block d-flex align-items-center mt-2">
                          <i className="bi bi-check-circle me-2"></i>
                          Согласие получено
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-12">
                    <button 
                      type="submit" 
                      className="btn btn-primary w-100 py-3"
                      disabled={isLoading || !isFormValid}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Регистрация...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-person-plus me-2"></i>
                          Создать аккаунт
                        </>
                      )}
                    </button>
                    
                    {!isFormValid && !isLoading && (
                      <div className="text-center mt-2">
                        <small className="text-muted">
                          Заполните все обязательные поля (*) корректно
                        </small>
                      </div>
                    )}
                  </div>
                  
                  <div className="col-12 text-center mt-4 pt-3 border-top">
                    <p className="mb-3 text-muted">
                      Уже есть аккаунт?
                    </p>
                    <Link 
                      to="/login" 
                      className="btn btn-outline-primary px-4"
                      state={{ prefillEmail: formData.email }}
                    >
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Войти в систему
                    </Link>
                  </div>
                  
                  <div className="col-12 text-center mt-3">
                    <p className="small text-muted">
                      Нажимая кнопку "Создать аккаунт", вы соглашаетесь с нашими правилами
                    </p>
                  </div>
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