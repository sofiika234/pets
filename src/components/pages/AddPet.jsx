import React, { useState, useEffect, useCallback } from 'react';
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
import { petsApi, authApi, validation } from '../../utils/api';

function AddPet() {
  const navigate = useNavigate();
  
  // Состояние формы
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
  const [loadingUser, setLoadingUser] = useState(true);

  // Загрузка данных пользователя при монтировании
  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        setIsAuthenticated(true);
        try {
          // Пробуем загрузить данные пользователя
          const response = await authApi.getUser();
          
          if (response && (response.data || response.success !== false)) {
            let userData;
            
            // Обработка разных форматов ответа
            if (response.data?.user) {
              userData = Array.isArray(response.data.user) 
                ? response.data.user[0] 
                : response.data.user;
            } else if (response.data) {
              userData = response.data;
            } else if (response.user) {
              userData = Array.isArray(response.user) ? response.user[0] : response.user;
            }

            if (userData && userData.name) {
              setUserData(userData);
              
              // Заполняем форму данными пользователя
              setFormData(prev => ({
                ...prev,
                name: userData.name || '',
                phone: userData.phone || '',
                email: userData.email || ''
              }));
              
              localStorage.setItem('currentUser', JSON.stringify(userData));
            }
          }
        } catch (error) {
          console.warn('Ошибка загрузки данных пользователя, используем данные из localStorage:', error.message);
          const savedUser = localStorage.getItem('currentUser');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setUserData(parsedUser);
              setFormData(prev => ({
                ...prev,
                name: parsedUser.name || '',
                phone: parsedUser.phone || '',
                email: parsedUser.email || ''
              }));
            } catch (parseError) {
              console.error('Ошибка парсинга сохраненного пользователя:', parseError);
            }
          }
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setLoadingUser(false);
    };

    loadUserData();
  }, []);

  // Валидация формы на стороне клиента согласно ТЗ
  const validateForm = () => {
    const newErrors = {};
    
    // Проверка имени
    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно для заполнения';
    } else if (!validation.validateName(formData.name)) {
      newErrors.name = 'Допустимы только кириллические буквы, пробелы и дефисы';
    }

    // Проверка телефона
    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен для заполнения';
    } else if (!validation.validatePhone(formData.phone)) {
      newErrors.phone = 'Только цифры, можно начинать с +';
    }

    // Проверка email
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!validation.validateEmail(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }

    // Поля объявления
    if (!formData.kind.trim()) {
      newErrors.kind = 'Вид животного обязателен для заполнения';
    }

    if (!formData.district.trim()) {
      newErrors.district = 'Район обязателен для заполнения';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно для заполнения';
    }

    if (!formData.photo1) {
      newErrors.photo1 = 'Фото 1 обязательно для загрузки';
    } else if (!formData.photo1.type.includes('png') && !formData.photo1.name.toLowerCase().endsWith('.png')) {
      newErrors.photo1 = 'Фото должно быть в формате PNG';
    }

    // Проверка дополнительных фото
    if (formData.photo2 && !formData.photo2.type.includes('png') && !formData.photo2.name.toLowerCase().endsWith('.png')) {
      newErrors.photo2 = 'Фото должно быть в формате PNG';
    }

    if (formData.photo3 && !formData.photo3.type.includes('png') && !formData.photo3.name.toLowerCase().endsWith('.png')) {
      newErrors.photo3 = 'Фото должно быть в формате PNG';
    }

    // Проверка пароля (только если выбрана регистрация)
    if (formData.register === 1 && !isAuthenticated) {
      if (!formData.password) {
        newErrors.password = 'Пароль обязателен для регистрации';
      } else if (!validation.validatePassword(formData.password)) {
        newErrors.password = 'Пароль должен содержать не менее 7 символов, включая 1 заглавную букву, 1 строчную букву и 1 цифру';
      }

      if (!formData.password_confirmation) {
        newErrors.password_confirmation = 'Подтверждение пароля обязательно';
      } else if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Пароли не совпадают';
      }
    }

    if (!formData.confirm) {
      newErrors.confirm = 'Необходимо согласие на обработку персональных данных';
    }

    return newErrors;
  };

  // Обработчик изменения полей
  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      const newValue = checked ? 1 : 0;
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
      
      // Сброс полей пароля при отмене регистрации
      if (name === 'register' && !checked) {
        setFormData(prev => ({
          ...prev,
          password: '',
          password_confirmation: ''
        }));
      }
    } else if (type === 'file' && files && files[0]) {
      const file = files[0];
      
      // Проверка PNG формата
      const isPNG = file.type.includes('png') || file.name.toLowerCase().endsWith('.png');
      
      if (!isPNG) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Файл должен быть в формате PNG'
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
  }, [errors, isAuthenticated]);

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Начало отправки формы...');
    console.log('Данные формы:', formData);
    console.log('Авторизован:', isAuthenticated);
    
    // Валидация
    const validationErrors = validateForm();
    console.log('Ошибки валидации:', validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Прокрутка к первой ошибке
      const firstErrorKey = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      
      return;
    }
    
    setLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      // Создание FormData согласно ТЗ
      const formDataToSend = new FormData();
      
      console.log('Формируем FormData...');
      
      // Контактные данные (обязательны для всех согласно ТЗ)
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('phone', formData.phone.trim());
      formDataToSend.append('email', formData.email.trim());
      
      // Обязательные поля объявления
      formDataToSend.append('kind', formData.kind.trim());
      formDataToSend.append('district', formData.district.trim());
      formDataToSend.append('description', formData.description.trim());
      
      // Опциональные поля
      if (formData.mark.trim()) {
        formDataToSend.append('mark', formData.mark.trim());
      }
      
      // Фотографии
      formDataToSend.append('photo1', formData.photo1);
      if (formData.photo2) {
        formDataToSend.append('photo2', formData.photo2);
      }
      if (formData.photo3) {
        formDataToSend.append('photo3', formData.photo3);
      }
      
      // Дополнительные поля (обязательные checkbox)
      formDataToSend.append('confirm', formData.confirm.toString());
      formDataToSend.append('register', formData.register.toString());
      
      // Пароль только если выбрана регистрация
      if (formData.register === 1 && !isAuthenticated) {
        formDataToSend.append('password', formData.password);
        formDataToSend.append('password_confirmation', formData.password_confirmation);
      }
      
      // Логирование содержимого FormData
      console.log('Содержимое FormData:');
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name}, ${value.type}, ${value.size} bytes`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      console.log('Отправка запроса на сервер...');
      
      // Отправка запроса согласно ТЗ: POST {host}/api/pets
      const response = await petsApi.addPet(formDataToSend);
      
      console.log('Ответ сервера:', response);
      
      if (response.status === 200 || response.status === 201 || response.status === 204) {
        // Успешное добавление
        const successMsg = 'Объявление успешно добавлено!';
        setSuccessMessage(successMsg);
        
        // Если пользователь зарегистрировался
        if (formData.register === 1 && response.data?.token) {
          localStorage.setItem('authToken', response.data.token);
          setIsAuthenticated(true);
          
          setTimeout(() => {
            navigate('/profile');
          }, 2000);
        } else if (isAuthenticated) {
          setTimeout(() => {
            navigate('/profile');
          }, 2000);
        } else {
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } else {
        throw new Error('Не удалось добавить объявление');
      }
      
    } catch (error) {
      console.error('Ошибка при добавлении объявления:', error);
      console.error('Детали ошибки:', {
        status: error.status,
        message: error.message,
        errors: error.errors,
        data: error.data
      });
      
      // Обработка ошибок валидации
      if (error.status === 422) {
        const serverErrors = error.errors || error.data?.error?.errors || {};
        console.log('Ошибки валидации с сервера:', serverErrors);
        
        setErrors(serverErrors);
        
        // Формируем сообщение об ошибках
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
        } else {
          alert('Ошибка при обработке данных. Проверьте правильность заполнения всех полей.');
        }
      } else if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
        alert('Ошибка соединения с сервером. Проверьте интернет-соединение и попробуйте снова.');
      } else {
        alert(`Ошибка: ${error.message || 'Не удалось добавить объявление'}`);
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

  // Если загружается информация о пользователе
  if (loadingUser && isAuthenticated) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Загрузка данных пользователя...</p>
        </div>
      </Container>
    );
  }

  // Список районов согласно ТЗ
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
                  {successMessage}
                  <div className="mt-2">
                    {formData.register === 1 && !isAuthenticated ? 
                      'Вы будете перенаправлены в личный кабинет...' :
                      isAuthenticated ? 
                      'Вы будете перенаправлены в профиль...' :
                      'Вы будете перенаправлены на главную страницу...'}
                  </div>
                </Alert>
              )}
              
              {isAuthenticated && (
                <Alert variant="info" className="mb-4">
                  <i className="bi bi-info-circle me-2"></i>
                  Вы авторизованы. Поля "Имя", "Телефон" и "Email" заполнены автоматически.
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
                {/* Информация о контактах */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-person-lines-fill me-2"></i>
                      Ваши контактные данные
                    </h5>
                    <small className="text-muted">Эти данные будут доступны владельцам животных</small>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Имя *
                            {isAuthenticated && <Badge bg="info" className="ms-2">Из профиля</Badge>}
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Иван Иванов"
                            isInvalid={!!errors.name}
                            required
                            readOnly={isAuthenticated}
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
                            {isAuthenticated && <Badge bg="info" className="ms-2">Из профиля</Badge>}
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+79111234567 или 89111234567"
                            isInvalid={!!errors.phone}
                            required
                            readOnly={isAuthenticated}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.phone}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted">
                            Только цифры, можно начинать с +7 или 8
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Email *
                            {isAuthenticated && <Badge bg="info" className="ms-2">Из профиля</Badge>}
                          </Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="user@example.com"
                            isInvalid={!!errors.email}
                            required
                            readOnly={isAuthenticated}
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
                        label="Зарегистрироваться в системе"
                        checked={formData.register === 1}
                        onChange={handleChange}
                        className="fw-bold"
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
                                Минимум 7 символов, 1 заглавная, 1 строчная буква, 1 цифра
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
                            placeholder="VL-0214 или другая идентификация"
                          />
                          <Form.Text className="text-muted">
                            Если у животного есть клеймо, татуировка или чип
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
                            placeholder="Опишите животное: пол, примерный возраст, порода, окрас, особые приметы, где и когда найдено, поведение..."
                            isInvalid={!!errors.description}
                            required
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
                      Фотографии животного
                    </h5>
                    <small className="text-muted">Только формат PNG</small>
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
                            accept=".png"
                            onChange={handleChange}
                            isInvalid={!!errors.photo1}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.photo1}
                          </Form.Control.Feedback>
                          {renderImagePreview('photo1')}
                          <Form.Text className="text-muted">
                            Четкое фото животного крупным планом
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Фото 2 (необязательно)</Form.Label>
                          <Form.Control
                            type="file"
                            name="photo2"
                            accept=".png"
                            onChange={handleChange}
                            isInvalid={!!errors.photo2}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.photo2}
                          </Form.Control.Feedback>
                          {renderImagePreview('photo2')}
                          <Form.Text className="text-muted">
                            Дополнительное фото с другого ракурса
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Фото 3 (необязательно)</Form.Label>
                          <Form.Control
                            type="file"
                            name="photo3"
                            accept=".png"
                            onChange={handleChange}
                            isInvalid={!!errors.photo3}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.photo3}
                          </Form.Control.Feedback>
                          {renderImagePreview('photo3')}
                          <Form.Text className="text-muted">
                            Фото особых примет или клейма
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Alert variant="info" className="mt-3">
                      <i className="bi bi-info-circle me-2"></i>
                      Загружайте четкие, хорошо освещенные фотографии в формате PNG.
                    </Alert>
                  </Card.Body>
                </Card>

                {/* Согласие на обработку данных */}
                <Card className="mb-4">
                  <Card.Body>
                    <Form.Check
                      type="checkbox"
                      name="confirm"
                      label="Я даю согласие на обработку моих персональных данных в соответствии с политикой конфиденциальности"
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
                        
                        // Сохраняем контактные данные
                        if (isAuthenticated && userData) {
                          resetData.name = userData.name || '';
                          resetData.phone = userData.phone || '';
                          resetData.email = userData.email || '';
                        }
                        
                        setFormData(prev => ({
                          ...prev,
                          ...resetData
                        }));
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
                  <i className="bi bi-asterisk text-danger me-1"></i>
                  - обязательные поля
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