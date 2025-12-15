import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Form,
  Button,
  Card,
  Alert,
  Spinner,
  Container,
  Row,
  Col
} from 'react-bootstrap';
import { authApi } from '../../utils/api';

// Валидационные функции
const validation = {
  validateName: (value) => {
    return /^[А-Яа-яЁё\s-]+$/.test(value);
  },
  validatePhone: (value) => {
    return /^\+?[0-9\s\-()]+$/.test(value);
  },
  validateEmail: (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  validatePassword: (value) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/.test(value);
  }
};

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: '',
    confirm: 0
  });

  const validateField = (name, value) => {
    const fieldErrors = [];
    switch (name) {
      case 'name':
        if (!value.trim()) fieldErrors.push('Имя обязательно');
        else if (!validation.validateName(value))
          fieldErrors.push('Допустимы только кириллица, пробел и дефис');
        break;
      case 'phone':
        if (!value.trim()) fieldErrors.push('Телефон обязателен');
        else if (!validation.validatePhone(value.replace(/\s/g, '')))
          fieldErrors.push('Только цифры и знак +');
        break;
      case 'email':
        if (!value.trim()) fieldErrors.push('Email обязателен');
        else if (!validation.validateEmail(value))
          fieldErrors.push('Неверный формат email');
        break;
      case 'password':
        if (!value) fieldErrors.push('Пароль обязателен');
        else if (!validation.validatePassword(value))
          fieldErrors.push('Минимум 7 символов, 1 цифра, 1 строчная и 1 заглавная буква');
        break;
      case 'password_confirmation':
        if (!value) fieldErrors.push('Подтверждение пароля обязательно');
        else if (value !== formData.password)
          fieldErrors.push('Пароли не совпадают');
        break;
      case 'confirm':
        if (!value || value === 0)
          fieldErrors.push('Необходимо согласие на обработку данных');
        break;
      default:
        break;
    }
    return fieldErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? (checked ? 1 : 0) : value;

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Очищаем ошибку при изменении
    setErrors(prev => ({
      ...prev,
      [name]: []
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key, formData[key]);
      if (fieldErrors.length > 0) {
        newErrors[key] = fieldErrors;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Подготовка данных согласно ТЗ
      const registrationData = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/\s/g, ''),
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        confirm: formData.confirm
      };

      console.log('Отправка данных регистрации:', registrationData);

      // Отправка на API
      const response = await authApi.register(registrationData);
      console.log('Ответ сервера регистрации:', response);

      // Обработка разных форматов ответа
      if (response.success || response.status === 204 || response.status === 200) {
        setSuccess(true);

        // Пробуем автоматически войти
        try {
          console.log('Попытка автоматического входа...');
          const loginResponse = await authApi.login({
            email: registrationData.email,
            password: registrationData.password
          });

          console.log('Ответ сервера входа:', loginResponse);

          if (loginResponse.data?.token || loginResponse.success) {
            // Сохраняем токен если есть
            if (loginResponse.data?.token) {
              localStorage.setItem('authToken', loginResponse.data.token);
            }

            // Сохраняем пользователя в localStorage
            const userData = {
              name: registrationData.name,
              email: registrationData.email,
              phone: registrationData.phone,
              registrationDate: new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')
            };

            localStorage.setItem('currentUser', JSON.stringify(userData));

            // Перенаправляем в личный кабинет
            setTimeout(() => navigate('/profile'), 1000);
          } else {
            // Если нет токена, перенаправляем на страницу входа
            setTimeout(() => {
              navigate('/login', {
                state: {
                  message: 'Регистрация успешна! Пожалуйста, войдите в систему.'
                }
              });
            }, 2000);
          }
        } catch (loginError) {
          console.log('Автоматический вход не удался:', loginError);

          // Регистрация успешна, но вход не удался
          setSuccess(true);
          setTimeout(() => {
            navigate('/login', {
              state: {
                message: 'Регистрация успешна! Пожалуйста, войдите в систему.'
              }
            });
          }, 3000);
        }
      } else {
        setServerError('Неизвестная ошибка при регистрации');
      }

    } catch (error) {
      console.error('Полная ошибка регистрации:', error);

      // Обработка ошибок валидации от сервера
      if (error.status === 422) {
        if (error.errors) {
          const serverErrors = {};
          Object.entries(error.errors).forEach(([field, messages]) => {
            serverErrors[field] = Array.isArray(messages) ? messages : [messages];
          });
          setErrors(serverErrors);
        }
        setServerError('Пожалуйста, проверьте введенные данные');
      } else if (error.status === 401) {
        setServerError('Ошибка авторизации');
      } else if (error.status === 409) {
        setServerError('Пользователь с таким email уже существует');
      } else if (error.message?.includes('Ошибка обработки ответа сервера')) {
        // Сервер вернул не-JSON ответ
        setServerError('Сервер вернул некорректный ответ. Попробуйте позже.');
      } else if (error.message?.includes('Нет подключения')) {
        setServerError('Нет подключения к серверу. Проверьте интернет-соединение.');
      } else {
        setServerError(error.message || 'Ошибка при регистрации. Проверьте данные и попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderError = (fieldName) => {
    if (!errors[fieldName] || errors[fieldName].length === 0) return null;

    return (
      <div className="mt-1">
        {errors[fieldName].map((error, index) => (
          <small key={index} className="text-danger d-block">
            <i className="bi bi-exclamation-circle me-1"></i>
            {error}
          </small>
        ))}
      </div>
    );
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow border-0">
            <Card.Header className="bg-primary text-white py-3">
              <h3 className="mb-0 text-center">
                <i className="bi bi-person-plus me-2"></i>
                Регистрация в сервисе GET PET BACK
              </h3>
            </Card.Header>
            <Card.Body className="p-4">
              {serverError && (
                <Alert variant="danger" dismissible onClose={() => setServerError('')}>
                  <Alert.Heading>Ошибка регистрации!</Alert.Heading>
                  <p>{serverError}</p>
                </Alert>
              )}

              {success && (
                <Alert variant="success">
                  <Alert.Heading>Успешная регистрация!</Alert.Heading>
                  <p>Регистрация прошла успешно. Вы будете перенаправлены...</p>
                  <Spinner animation="border" size="sm" />
                </Alert>
              )}

              <Form onSubmit={handleSubmit} noValidate>
                {/* Имя */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-person me-2 text-primary"></i>
                    Имя *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Введите ваше имя"
                    isInvalid={!!errors.name}
                    disabled={loading || success}
                    required
                  />
                  {renderError('name')}
                  <Form.Text className="text-muted">
                    Только кириллица, пробел и дефис
                  </Form.Text>
                </Form.Group>

                {/* Телефон */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-phone me-2 text-primary"></i>
                    Телефон *
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+79111234567"
                    isInvalid={!!errors.phone}
                    disabled={loading || success}
                    required
                  />
                  {renderError('phone')}
                  <Form.Text className="text-muted">
                    Только цифры и знак +, например: +79111234567
                  </Form.Text>
                </Form.Group>

                {/* Email */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-envelope me-2 text-primary"></i>
                    Email *
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    isInvalid={!!errors.email}
                    disabled={loading || success}
                    required
                  />
                  {renderError('email')}
                  <Form.Text className="text-muted">
                    Введите действующий email адрес
                  </Form.Text>
                </Form.Group>

                {/* Пароль */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-lock me-2 text-primary"></i>
                    Пароль *
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Введите пароль"
                    isInvalid={!!errors.password}
                    disabled={loading || success}
                    required
                  />
                  {renderError('password')}
                  <Form.Text className="text-muted">
                    Минимум 7 символов, 1 цифра, 1 строчная и 1 заглавная буква
                  </Form.Text>
                </Form.Group>

                {/* Подтверждение пароля */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-lock-fill me-2 text-primary"></i>
                    Подтверждение пароля *
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder="Повторите пароль"
                    isInvalid={!!errors.password_confirmation}
                    disabled={loading || success}
                    required
                  />
                  {renderError('password_confirmation')}
                </Form.Group>

                {/* Согласие на обработку данных */}
                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    name="confirm"
                    id="confirm"
                    label={
                      <span>
                        Я согласен на обработку персональных данных *
                      </span>
                    }
                    checked={formData.confirm === 1}
                    onChange={handleChange}
                    isInvalid={!!errors.confirm}
                    disabled={loading || success}
                    required
                  />
                  {renderError('confirm')}
                </Form.Group>

                {/* Кнопки */}
                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    disabled={loading || success}
                    className="py-2"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Регистрация...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        Зарегистрироваться
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    as={Link}
                    to="/login"
                    disabled={loading || success}
                    className="py-2"
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Уже есть аккаунт? Войти
                  </Button>
                </div>
              </Form>
            </Card.Body>
            <Card.Footer className="text-center bg-light py-3">
              <p className="mb-0 text-muted small">
                <i className="bi bi-shield-check me-1"></i>
                Ваши данные защищены и используются только для работы сервиса
              </p>
            </Card.Footer>
          </Card>

          <div className="text-center mt-4">
            <Button
              variant="link"
              as={Link}
              to="/"
              className="text-decoration-none"
            >
              <i className="bi bi-house me-2"></i>
              Вернуться на главную
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Register;