import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
  Image,
  Badge
} from 'react-bootstrap';
import { petsApi, authApi, API_CONFIG, validation, formHelper, safeApiCall } from '../../utils/api';

// Нормализация телефона
const normalizePhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\s/g, '');
  
  if (cleaned.startsWith('8')) {
    return '+7' + cleaned.substring(1);
  } else if (cleaned.startsWith('7')) {
    return '+7' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+7') && cleaned.length === 10) {
    return '+7' + cleaned;
  }
  
  return cleaned;
};

function AddPet() {
  const navigate = useNavigate();

  // Состояние формы согласно ТЗ
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    kind: '',
    district: '',
    description: '',
    mark: '',
    password: '',
    password_confirmation: '',
    confirm: 0,
    register: 0,
    photo1: null,
    photo2: null,
    photo3: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [imagePreviews, setImagePreviews] = useState({
    photo1: null,
    photo2: null,
    photo3: null
  });

  // Инициализация при загрузке компонента
  useEffect(() => {
    const token = authApi.getToken();
    const authenticated = !!token;
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      loadUserData();
    }
  }, []);

  // Загрузка данных пользователя для авторизованных
  const loadUserData = async () => {
    try {
      console.log('👤 Загрузка данных пользователя для формы...');
      const result = await safeApiCall(() => authApi.getUser(), 'Ошибка загрузки профиля');
      
      if (result.success && result.data) {
        let userData = result.data;
        
        // Обрабатываем разные форматы ответа
        if (userData.data) {
          userData = userData.data;
        }
        
        setUserData(userData);
        
        // Заполняем контактные данные из профиля
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          phone: userData.phone || '',
          email: userData.email || ''
        }));
        
        console.log('✅ Данные пользователя загружены:', userData);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
    }
  };

  // Валидация формы согласно ТЗ
  const validateForm = () => {
    const newErrors = {};

    // Имя - обязательно для всех
    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно для заполнения';
    } else if (!validation.validateName(formData.name)) {
      newErrors.name = 'Допустимы только кириллические буквы, пробелы и дефисы';
    }

    // Телефон - обязательно для всех
    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен для заполнения';
    } else if (!validation.validatePhone(formData.phone)) {
      newErrors.phone = 'Формат: +7XXXXXXXXXX, 8XXXXXXXXXX или 7XXXXXXXXXX (10 цифр)';
    }

    // Email - обязательно для всех
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!validation.validateEmail(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }

    // Вид животного
    if (!formData.kind.trim()) {
      newErrors.kind = 'Вид животного обязателен для заполнения';
    }

    // Район
    if (!formData.district.trim()) {
      newErrors.district = 'Район обязателен для заполнения';
    }

    // Описание
    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно для заполнения';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Описание должно содержать минимум 10 символов';
    }

    // Фото 1
    if (!formData.photo1) {
      newErrors.photo1 = 'Фото 1 обязательно для загрузки';
    } else if (formData.photo1 instanceof File) {
      const isPNG = formData.photo1.type === 'image/png' ||
                   formData.photo1.name.toLowerCase().endsWith('.png');
      if (!isPNG) {
        newErrors.photo1 = 'Фото должно быть в формате PNG';
      }
      
      // Проверка размера (макс 5MB)
      if (formData.photo1.size > 5 * 1024 * 1024) {
        newErrors.photo1 = 'Файл слишком большой. Максимальный размер: 5MB';
      }
    }

    // Фото 2
    if (formData.photo2 instanceof File) {
      const isPNG = formData.photo2.type === 'image/png' ||
                   formData.photo2.name.toLowerCase().endsWith('.png');
      if (!isPNG) {
        newErrors.photo2 = 'Фото должно быть в формате PNG';
      }
      
      if (formData.photo2.size > 5 * 1024 * 1024) {
        newErrors.photo2 = 'Файл слишком большой. Максимальный размер: 5MB';
      }
    }

    // Фото 3
    if (formData.photo3 instanceof File) {
      const isPNG = formData.photo3.type === 'image/png' ||
                   formData.photo3.name.toLowerCase().endsWith('.png');
      if (!isPNG) {
        newErrors.photo3 = 'Фото должно быть в формате PNG';
      }
      
      if (formData.photo3.size > 5 * 1024 * 1024) {
        newErrors.photo3 = 'Файл слишком большой. Максимальный размер: 5MB';
      }
    }

    // Пароли при регистрации (только для неавторизованных)
    if (!isAuthenticated && formData.register === 1) {
      if (!formData.password) {
        newErrors.password = 'Пароль обязателен для регистрации';
      } else if (!validation.validatePassword(formData.password)) {
        newErrors.password = 'Пароль: не менее 7 символов, 1 цифра, 1 строчная и 1 заглавная буква';
      }

      if (!formData.password_confirmation) {
        newErrors.password_confirmation = 'Подтверждение пароля обязательно';
      } else if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Пароли не совпадают';
      }
    }

    // Согласие
    if (formData.confirm !== 1) {
      newErrors.confirm = 'Необходимо согласие на обработку персональных данных';
    }

    return newErrors;
  };

  // Обработчик изменения полей
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'checkbox') {
      const newValue = checked ? 1 : 0;

      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));

      // Сброс паролей при отмене регистрации
      if (name === 'register' && !checked) {
        setFormData(prev => ({
          ...prev,
          password: '',
          password_confirmation: ''
        }));
        setErrors(prev => ({
          ...prev,
          password: '',
          password_confirmation: ''
        }));
      }
    } else if (type === 'file' && files && files[0]) {
      const file = files[0];

      // Проверка PNG
      const isPNG = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

      if (!isPNG) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Файл должен быть в формате PNG'
        }));
        return;
      }

      // Проверка размера (макс 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Файл слишком большой. Максимальный размер: 5MB'
        }));
        return;
      }

      setErrors(prev => ({ ...prev, [name]: '' }));

      // Создание превью
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => ({
          ...prev,
          [name]: reader.result
        }));
      };
      reader.readAsDataURL(file);

      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Проверяем авторизацию
    const token = localStorage.getItem('authToken');
    if (isAuthenticated && !token) {
      alert('Сессия истекла. Пожалуйста, войдите снова.');
      navigate('/login');
      return;
    }
    
    // Валидация
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Прокрутка к первой ошибке
      const firstErrorKey = Object.keys(validationErrors)[0];
      setTimeout(() => {
        const errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }, 100);
      
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Создание FormData
      const formDataToSend = new FormData();
      
      // ОБЯЗАТЕЛЬНЫЕ ПОЛЯ ДЛЯ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (даже авторизованных)
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('phone', normalizePhone(formData.phone.trim()));
      formDataToSend.append('email', formData.email.trim());
      
      // Обязательные поля объявления
      formDataToSend.append('kind', formData.kind.trim());
      formDataToSend.append('district', formData.district.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('confirm', formData.confirm.toString());
      
      // Регистрация (только для неавторизованных)
      const registerValue = isAuthenticated ? '0' : formData.register.toString();
      formDataToSend.append('register', registerValue);

      // Клеймо (если есть)
      if (formData.mark.trim()) {
        formDataToSend.append('mark', formData.mark.trim());
      }

      // Фотографии
      if (formData.photo1) {
        formDataToSend.append('photo1', formData.photo1);
      }
      
      if (formData.photo2) {
        formDataToSend.append('photo2', formData.photo2);
      }
      
      if (formData.photo3) {
        formDataToSend.append('photo3', formData.photo3);
      }

      // Пароли при регистрации (только для неавторизованных)
      if (!isAuthenticated && formData.register === 1) {
        formDataToSend.append('password', formData.password);
        formDataToSend.append('password_confirmation', formData.password_confirmation);
      }

      console.log('📤 Отправка FormData на сервер:');
      console.log('Аутентифицирован:', isAuthenticated);
      console.log('Поля регистрации:', {
        register: registerValue,
        hasPassword: !isAuthenticated && formData.register === 1
      });
      
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}:`, value);
        }
      }

      // Отправка запроса
      const response = await petsApi.addPet(formDataToSend);

      // Обработка успешного ответа
      if (response.success || response.status === 200 || response.status === 201 || response.status === 204) {
        let successMsg = 'Объявление успешно добавлено!';
        
        if (response.data?.id) {
          successMsg += ` ID объявления: ${response.data.id}`;
        } else if (response.message) {
          successMsg = response.message;
        } else if (response.data?.message) {
          successMsg = response.data.message;
        }
        
        setSuccessMessage(successMsg);
        
        // Обработка регистрации (только для неавторизованных)
        if (!isAuthenticated && formData.register === 1) {
          console.log('🔄 Регистрация при добавлении объявления');
          
          // Если токен возвращен в ответе
          if (response.data?.token) {
            localStorage.setItem('authToken', response.data.token);
            console.log('✅ Токен сохранен при регистрации');
            
            // Загружаем данные пользователя
            try {
              await authApi.getUser();
            } catch (userError) {
              console.warn('Не удалось загрузить данные пользователя после регистрации:', userError);
            }
          } else {
            // Если токен не возвращен, пробуем войти с теми же данными
            console.log('🔄 Токен не возвращен, пробуем войти...');
            try {
              const loginResult = await authApi.login({
                email: formData.email.trim(),
                password: formData.password
              });
              
              if (loginResult.success) {
                console.log('✅ Вход выполнен после регистрации');
              }
            } catch (loginError) {
              console.warn('Не удалось войти после регистрации:', loginError);
            }
          }
        }
        
        // Ключевое исправление: передаем флаг обновления данных
        setTimeout(() => {
          if (isAuthenticated || formData.register === 1) {
            // Сохраняем маркер для принудительного обновления
            localStorage.setItem('forceProfileRefresh', Date.now().toString());
            localStorage.setItem('lastAddedAdId', response.data?.id || 'new');
            
            // Переходим в профиль с флагом обновления
            navigate('/profile', { 
              state: { 
                refreshData: true,
                forceRefresh: true,
                newAdId: response.data?.id,
                timestamp: new Date().getTime(),
                message: 'Объявление успешно добавлено'
              } 
            });
          } else {
            // Если пользователь не регистрировался, переходим на главную
            navigate('/');
          }
        }, 1500);
        
      } else {
        throw new Error(response.error || response.message || 'Не удалось добавить объявление');
      }

    } catch (error) {
      console.error('❌ Ошибка при отправке:', error);
      console.error('Детали ошибки:', {
        status: error.status,
        message: error.message,
        errors: error.errors,
        isJson: error.isJson
      });
      
      // Детальный анализ ошибки
      if (error.name === 'AbortError') {
        alert('Превышено время ожидания ответа от сервера. Попробуйте еще раз.');
        
      } else if (error.message.includes('Failed to fetch') || 
                 error.message.includes('Network Error') ||
                 error.message.includes('Network request failed')) {
        alert('Ошибка сети. Пожалуйста, проверьте подключение к интернету.');
        
      } else if (error.status === 422) {
        // Ошибки валидации от сервера
        const serverErrors = error.errors || error.data?.errors || error.data?.error?.errors || {};
        console.log('Ошибки валидации от сервера:', serverErrors);
        
        // Обновляем ошибки в состоянии
        const newErrors = {};
        Object.keys(serverErrors).forEach(key => {
          if (Array.isArray(serverErrors[key])) {
            newErrors[key] = serverErrors[key].join(', ');
          } else {
            newErrors[key] = serverErrors[key];
          }
        });
        setErrors(newErrors);
        
        // Показываем сообщение
        const errorMessages = [];
        for (const [field, messages] of Object.entries(serverErrors)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else if (typeof messages === 'string') {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        
        if (errorMessages.length > 0) {
          alert(`Ошибки при заполнении формы:\n\n${errorMessages.join('\n')}`);
        } else if (error.message) {
          alert(error.message);
        } else {
          alert('Ошибка валидации данных. Проверьте все обязательные поля.');
        }
        
      } else if (error.status === 401) {
        alert('Требуется авторизация. Пожалуйста, войдите в систему.');
        navigate('/login');
        
      } else if (error.status === 413) {
        alert('Файл слишком большой. Максимальный размер файла: 5MB');
        
      } else if (error.status === 415) {
        alert('Неподдерживаемый тип файла. Используйте только PNG изображения');
        
      } else if (error.status === 429) {
        alert('Слишком много запросов. Попробуйте позже.');
        
      } else {
        // Показываем сообщение об ошибке от сервера или общее
        const errorMessage = error.message || 
                            error.data?.message || 
                            error.data?.error ||
                            'Произошла ошибка при добавлении объявления';
        alert(errorMessage);
      }
      
    } finally {
      setLoading(false);
    }
  };

  // Рендеринг превью изображения
  const renderImagePreview = (name) => {
    if (imagePreviews[name]) {
      return (
        <div className="mt-2">
          <Image
            src={imagePreviews[name]}
            alt="Предпросмотр"
            thumbnail
            style={{ maxWidth: '200px', maxHeight: '200px' }}
          />
          <Button
            variant="link"
            size="sm"
            className="p-0 text-danger"
            onClick={() => {
              setImagePreviews(prev => ({ ...prev, [name]: null }));
              setFormData(prev => ({ ...prev, [name]: null }));
              setErrors(prev => ({ ...prev, [name]: '' }));
            }}
          >
            <i className="bi bi-x-circle me-1"></i> Удалить
          </Button>
        </div>
      );
    }
    return null;
  };

  // Районы
  const districts = [
    'Центральный',
    'Василеостровский',
    'Адмиралтейский',
    'Петроградский',
    'Московский',
    'Кировский',
    'Выборгский',
    'Калининский',
    'Невский'
  ];

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg">
            <Card.Header className="bg-primary text-white">
              <h2 className="mb-0">
                <i className="bi bi-plus-circle me-2"></i>
                Добавить информацию о найденном животном
              </h2>
              <small>Все поля, отмеченные *, обязательны для заполнения</small>
            </Card.Header>

            <Card.Body>
              {successMessage && (
                <Alert variant="success" className="mb-4">
                  <i className="bi bi-check-circle me-2"></i>
                  <div dangerouslySetInnerHTML={{ __html: successMessage.replace(/\n/g, '<br/>') }} />
                  <div className="mt-2">
                    {isAuthenticated || formData.register === 1 ?
                      'Вы будете перенаправлены в личный кабинет...' :
                      'Вы будете перенаправлены на главную страницу...'}
                  </div>
                </Alert>
              )}

              {isAuthenticated && (
                <Alert variant="info" className="mb-4">
                  <i className="bi bi-info-circle me-2"></i>
                  Вы авторизованы. Поля "Имя", "Телефон" и "Email" заполнены автоматически из вашего профиля.
                  {(!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) && (
                    <div className="mt-2 text-warning">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Заполните недостающие контактные данные.
                    </div>
                  )}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} noValidate>
                {/* Информация о контактах */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-person-lines-fill me-2"></i>
                      Ваши контактные данные
                    </h5>
                    <small className="text-muted">Обязательны для всех пользователей</small>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Имя *
                            {isAuthenticated && userData?.name && <Badge bg="info" className="ms-2">Из профиля</Badge>}
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Иван Иванов"
                            isInvalid={!!errors.name}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.name}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted">
                            Только кириллические буквы, пробелы и дефисы
                          </Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Телефон *
                            {isAuthenticated && userData?.phone && <Badge bg="info" className="ms-2">Из профиля</Badge>}
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+79111234567"
                            isInvalid={!!errors.phone}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.phone}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted">
                            Формат: +7XXXXXXXXXX, 8XXXXXXXXXX или 7XXXXXXXXXX
                          </Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Email *
                            {isAuthenticated && userData?.email && <Badge bg="info" className="ms-2">Из профиля</Badge>}
                          </Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="user@example.com"
                            isInvalid={!!errors.email}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.email}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Опция регистрации - только для неавторизованных */}
                {!isAuthenticated && (
                  <Card className="mb-4">
                    <Card.Header>
                      <Form.Check
                        type="checkbox"
                        name="register"
                        label={<strong>Зарегистрироваться в системе</strong>}
                        checked={formData.register === 1}
                        onChange={handleChange}
                        id="register-checkbox"
                      />
                      <small className="text-muted">
                        Получите доступ к личному кабинету для управления объявлениями
                      </small>
                    </Card.Header>

                    {formData.register === 1 && (
                      <Card.Body className="bg-light">
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Пароль *</Form.Label>
                              <Form.Control
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Введите пароль"
                                isInvalid={!!errors.password}
                                required
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.password}
                              </Form.Control.Feedback>
                              <Form.Text className="text-muted">
                                Не менее 7 символов, 1 цифра, 1 строчная и 1 заглавная буква
                              </Form.Text>
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Подтверждение пароля *</Form.Label>
                              <Form.Control
                                type="password"
                                name="password_confirmation"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                placeholder="Повторите пароль"
                                isInvalid={!!errors.password_confirmation}
                                required
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.password_confirmation}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    )}
                  </Card>
                )}

                {/* Информация о животном */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-heart-pulse me-2"></i>
                      Информация о животном
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Вид животного *</Form.Label>
                          <Form.Select
                            name="kind"
                            value={formData.kind}
                            onChange={handleChange}
                            isInvalid={!!errors.kind}
                            required
                          >
                            <option value="">Выберите вид</option>
                            <option value="кошка">Кошка</option>
                            <option value="кот">Кот</option>
                            <option value="собака">Собака</option>
                            <option value="щенок">Щенок</option>
                            <option value="котёнок">Котёнок</option>
                            <option value="птица">Птица</option>
                            <option value="грызун">Грызун</option>
                            <option value="другое">Другое</option>
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.kind}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Район *</Form.Label>
                          <Form.Select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            isInvalid={!!errors.district}
                            required
                          >
                            <option value="">Выберите район</option>
                            {districts.map(district => (
                              <option key={district} value={district}>{district}</option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.district}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Клеймо (необязательно)</Form.Label>
                          <Form.Control
                            type="text"
                            name="mark"
                            value={formData.mark}
                            onChange={handleChange}
                            placeholder="VL-0214"
                          />
                          <Form.Text className="text-muted">
                            Если у животного есть клеймо или татуировка
                          </Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Описание *</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Опишите животное..."
                            isInvalid={!!errors.description}
                            required
                            minLength={10}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.description}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted">
                            Подробное описание поможет владельцу быстрее найти питомца
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Фотографии */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-images me-2"></i>
                      Фотографии
                    </h5>
                    <small className="text-muted">Только формат PNG, максимальный размер: 5MB</small>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Фото 1 *
                            <Badge bg="danger" className="ms-2">Обязательно</Badge>
                          </Form.Label>
                          <Form.Control
                            type="file"
                            name="photo1"
                            accept=".png,image/png"
                            onChange={handleChange}
                            isInvalid={!!errors.photo1}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.photo1}
                          </Form.Control.Feedback>
                          {renderImagePreview('photo1')}
                          <Form.Text className="text-muted">
                            Четкое фото животного (только PNG, макс. 5MB)
                          </Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Фото 2 (необязательно)</Form.Label>
                          <Form.Control
                            type="file"
                            name="photo2"
                            accept=".png,image/png"
                            onChange={handleChange}
                            isInvalid={!!errors.photo2}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.photo2}
                          </Form.Control.Feedback>
                          {renderImagePreview('photo2')}
                          <Form.Text className="text-muted">
                            Дополнительное фото (только PNG, макс. 5MB)
                          </Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Фото 3 (необязательно)</Form.Label>
                          <Form.Control
                            type="file"
                            name="photo3"
                            accept=".png,image/png"
                            onChange={handleChange}
                            isInvalid={!!errors.photo3}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.photo3}
                          </Form.Control.Feedback>
                          {renderImagePreview('photo3')}
                          <Form.Text className="text-muted">
                            Фото особых примет (только PNG, макс. 5MB)
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Согласие на обработку данных */}
                <Card className="mb-4">
                  <Card.Body>
                    <Form.Check
                      type="checkbox"
                      name="confirm"
                      label="Я даю согласие на обработку моих персональных данных"
                      checked={formData.confirm === 1}
                      onChange={handleChange}
                      isInvalid={!!errors.confirm}
                      required
                      id="confirm-checkbox"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirm}
                    </Form.Control.Feedback>
                  </Card.Body>
                </Card>

                {/* Кнопки отправки */}
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Назад
                  </Button>

                  <div className="d-flex gap-3">
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        // Сброс формы
                        const resetData = {
                          name: isAuthenticated && userData ? userData.name || '' : '',
                          phone: isAuthenticated && userData ? userData.phone || '' : '',
                          email: isAuthenticated && userData ? userData.email || '' : '',
                          kind: '',
                          district: '',
                          description: '',
                          mark: '',
                          password: '',
                          password_confirmation: '',
                          confirm: 0,
                          register: 0,
                          photo1: null,
                          photo2: null,
                          photo3: null
                        };
                        
                        setFormData(resetData);
                        setErrors({});
                        setImagePreviews({
                          photo1: null,
                          photo2: null,
                          photo3: null
                        });
                        setSuccessMessage('');
                      }}
                      disabled={loading}
                    >
                      <i className="bi bi-eraser me-2"></i>
                      Очистить форму
                    </Button>

                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading}
                      className="px-4"
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Отправка...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Добавить объявление
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Form>
            </Card.Body>

            <Card.Footer className="text-muted small">
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-shield-check me-1"></i>
                  Ваши данные защищены
                </span>
                <span>
                  * - обязательные поля
                </span>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AddPet;