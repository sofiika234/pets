import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { petsApi, authApi, api } from '../../utils/api';
import { Button, Card, Spinner, Form, Alert } from 'react-bootstrap';
import { API_CONFIG } from '../../App';

function AddPet() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Согласно ТЗ поля формы
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    kind: '',
    district: '',
    mark: '',
    description: '',
    photo1: null,
    photo2: null,
    photo3: null,
    register: false, // boolean согласно ТЗ
    password: '',
    password_confirmation: '',
    confirm: 0 // integer 0 или 1 согласно ТЗ
  });
  
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // success/danger
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState(['', '', '']);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          console.log('Проверка авторизации...');
          // Пробуем получить данные пользователя разными способами
          let userResponse;
          
          try {
            userResponse = await api.get('/users/me');
          } catch (error) {
            console.log('Первый эндпоинт не сработал, пробуем второй...');
            try {
              userResponse = await authApi.getUser('me');
            } catch (error2) {
              console.log('Не удалось получить данные пользователя:', error2);
              // Используем данные из localStorage если есть
              const savedUser = localStorage.getItem('currentUser');
              if (savedUser) {
                try {
                  const parsedUser = JSON.parse(savedUser);
                  setCurrentUser(parsedUser);
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
              setLoading(false);
              return;
            }
          }
          
          console.log('Ответ пользователя:', userResponse);
          
          let userData;
          
          // Обрабатываем разные форматы ответа
          if (userResponse.data) {
            if (userResponse.data.user && typeof userResponse.data.user === 'object') {
              userData = userResponse.data.user;
            } else if (Array.isArray(userResponse.data)) {
              userData = userResponse.data[0] || {};
            } else if (typeof userResponse.data === 'object') {
              userData = userResponse.data;
            }
          } else if (typeof userResponse === 'object') {
            userData = userResponse;
          }
          
          if (userData) {
            const preparedUser = {
              id: userData.id || userData._id,
              name: userData.name || userData.username || '',
              phone: userData.phone || userData.phoneNumber || '',
              email: userData.email || ''
            };
            
            setCurrentUser(preparedUser);
            setFormData(prev => ({
              ...prev,
              name: preparedUser.name || '',
              phone: preparedUser.phone || '',
              email: preparedUser.email || ''
            }));
          }
        } catch (error) {
          console.error('Ошибка проверки авторизации:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const validateField = (name, value) => {
    console.log('Валидация поля:', name, 'значение:', value);
    
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
      case 'kind':
        return value ? '' : 'Пожалуйста, выберите вид животного';
      case 'district':
        return value ? '' : 'Пожалуйста, выберите район';
      case 'description':
        if (!value.trim()) return 'Пожалуйста, заполните описание';
        if (value.trim().length < 10) return 'Слишком короткое описание';
        return '';
      case 'password':
        if (formData.register === true) {
          if (!value) return 'Обязательное поле при регистрации';
          if (value.length < 7) return 'Минимум 7 символов';
          if (!/\d/.test(value)) return 'Должна быть хотя бы одна цифра';
          if (!/[a-z]/.test(value)) return 'Должна быть хотя бы одна строчная буква';
          if (!/[A-Z]/.test(value)) return 'Должна быть хотя бы одна заглавная буква';
        }
        return '';
      case 'password_confirmation':
        if (formData.register === true) {
          if (!value) return 'Обязательное поле при регистрации';
          return value === formData.password ? '' : 'Пароли не совпадают';
        }
        return '';
      case 'confirm':
        return value === 1 ? '' : 'Необходимо согласие';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let fieldValue;
    
    if (name === 'register') {
      fieldValue = checked; // boolean согласно ТЗ
    } else if (type === 'checkbox') {
      fieldValue = checked ? 1 : 0; // integer 0 или 1 согласно ТЗ
    } else {
      fieldValue = value;
    }
    
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

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('Выбран файл:', file.name, 'тип:', file.type, 'размер:', file.size);

    // Проверяем формат PNG
    const isPNG = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    if (!isPNG) {
      setErrors(prev => ({ 
        ...prev, 
        [`photo${index + 1}`]: 'Поддерживается только формат PNG'
      }));
      return;
    }

    // Проверяем размер (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ 
        ...prev, 
        [`photo${index + 1}`]: 'Размер файла не должен превышать 5MB'
      }));
      return;
    }

    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      const newPreviews = [...photoPreviews];
      newPreviews[index] = e.target.result;
      setPhotoPreviews(newPreviews);
      
      setFormData(prev => ({ 
        ...prev, 
        [`photo${index + 1}`]: file
      }));
      
      setErrors(prev => ({ 
        ...prev, 
        [`photo${index + 1}`]: ''
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index) => {
    const newPreviews = [...photoPreviews];
    newPreviews[index] = '';
    setPhotoPreviews(newPreviews);
    
    setFormData(prev => ({ 
      ...prev, 
      [`photo${index + 1}`]: null
    }));
    
    setErrors(prev => ({ 
      ...prev, 
      [`photo${index + 1}`]: ''
    }));
    
    const input = document.getElementById(`photo${index + 1}`);
    if (input) input.value = '';
  };

  // Функция для показа сообщений
  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Основная функция отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    console.log('Начало отправки формы, данные:', {
      ...formData,
      photo1: formData.photo1 ? 'Файл выбран' : 'Нет файла',
      photo2: formData.photo2 ? 'Файл выбран' : 'Нет файла',
      photo3: formData.photo3 ? 'Файл выбран' : 'Нет файла'
    });

    // Проверяем обязательные поля
    const newErrors = {};
    const requiredFields = ['name', 'phone', 'email', 'kind', 'district', 'description', 'confirm'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    // Проверяем первую фотографию согласно ТЗ (photo1 обязательное)
    if (!formData.photo1) {
      newErrors.photo1 = 'Требуется хотя бы одна фотография';
    }

    // Проверяем пароли если выбрана регистрация
    if (formData.register === true && !currentUser) {
      const passwordError = validateField('password', formData.password);
      const confirmError = validateField('password_confirmation', formData.password_confirmation);
      if (passwordError) newErrors.password = passwordError;
      if (confirmError) newErrors.password_confirmation = confirmError;
    }

    console.log('Ошибки валидации:', newErrors);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      showMessage('Пожалуйста, исправьте ошибки в форме', 'danger');
      return;
    }

    try {
      // Создаем FormData для отправки
      const formDataToSend = new FormData();
      
      // Обязательные поля согласно ТЗ
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('phone', formData.phone.trim());
      formDataToSend.append('email', formData.email.trim());
      formDataToSend.append('kind', formData.kind);
      formDataToSend.append('district', formData.district);
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('confirm', formData.confirm.toString());
      
      // Опциональные поля
      if (formData.mark && formData.mark.trim()) {
        formDataToSend.append('mark', formData.mark.trim());
      }
      
      // Фотографии (photo1 обязательное согласно ТЗ)
      if (formData.photo1) {
        formDataToSend.append('photo1', formData.photo1);
      }
      if (formData.photo2) {
        formDataToSend.append('photo2', formData.photo2);
      }
      if (formData.photo3) {
        formDataToSend.append('photo3', formData.photo3);
      }
      
      // Регистрационные данные если нужно
      if (formData.register === true && !currentUser) {
        formDataToSend.append('password', formData.password);
        formDataToSend.append('password_confirmation', formData.password_confirmation);
        formDataToSend.append('register', '1'); // Согласно ТЗ: 1 для регистрации
      } else {
        formDataToSend.append('register', '0'); // Согласно ТЗ: 0 без регистрации
      }
      
      console.log('Отправляемые данные FormData:');
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name + ' (файл)' : pair[1]));
      }

      // Отправляем запрос согласно ТЗ: POST /api/pets/new
      console.log('Отправка запроса на:', `${API_CONFIG.BASE_URL}/pets/new`);
      
      const token = localStorage.getItem('authToken');
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Не добавляем Content-Type для FormData - браузер сам установит с boundary
      const response = await fetch(`${API_CONFIG.BASE_URL}/pets/new`, {
        method: 'POST',
        headers: headers,
        body: formDataToSend
      });
      
      console.log('Ответ сервера:', response.status, response.statusText);
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('Тело ответа:', responseData);
      } catch (parseError) {
        console.error('Ошибка парсинга ответа:', parseError);
        throw new Error('Некорректный ответ от сервера');
      }
      
      if (response.ok) {
        if (responseData.data?.token) {
          localStorage.setItem('authToken', responseData.data.token);
          console.log('Токен сохранен');
        }
        
        if (responseData.data?.id) {
          console.log('ID созданного объявления:', responseData.data.id);
        }
        
        showMessage('Объявление успешно добавлено и отправлено на модерацию!', 'success');
        
        // Если пользователь зарегистрировался, сохраняем данные
        if (formData.register === true && !currentUser) {
          const newUser = {
            id: Date.now(),
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            registrationDate: new Date().toISOString().split('T')[0]
          };
          localStorage.setItem('currentUser', JSON.stringify(newUser));
        }
        
        // Перенаправляем через 3 секунды
        setTimeout(() => {
          if (currentUser || formData.register === true) {
            navigate('/profile');
          } else {
            navigate('/');
          }
        }, 3000);
        
      } else {
        // Обработка ошибок
        console.error('Ошибка сервера:', responseData);
        
        if (response.status === 422) {
          let errorMessage = 'Ошибка валидации: ';
          if (responseData.error?.errors) {
            const errorList = Object.values(responseData.error.errors).flat();
            errorMessage += errorList.join(', ');
          } else if (responseData.error?.message) {
            errorMessage += responseData.error.message;
          } else {
            errorMessage += 'Проверьте введенные данные';
          }
          showMessage(errorMessage, 'danger');
        } else if (response.status === 401) {
          showMessage('Требуется авторизация', 'danger');
          navigate('/login');
        } else {
          showMessage('Ошибка при добавлении объявления: ' + (responseData.error?.message || 'Неизвестная ошибка'), 'danger');
        }
      }
      
    } catch (error) {
      console.error('Ошибка отправки формы:', error);
      showMessage(`Ошибка при добавлении объявления: ${error.message || 'Проверьте подключение к интернету'}`, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center py-5">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3 fs-5">Загрузка формы...</p>
      </div>
    );
  }

  const districts = [
    'Центральный', 'Северный', 'Южный', 'Западный', 'Восточный',
    'Василеостровский', 'Адмиралтейский', 'Кировский', 'Московский'
  ];

  const animalTypes = [
    'Кошка', 'Собака', 'Кролик', 'Хомяк', 'Попугай',
    'Крыса', 'Морская свинка', 'Черепаха', 'Другое'
  ];

  return (
    <div className="container mt-4 mb-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <Card className="shadow border-0">
            <Card.Body className="p-4 p-lg-5">
              <h1 className="text-center mb-4 text-primary">
                <i className="bi bi-plus-circle me-2"></i>
                Добавить объявление о найденном животном
              </h1>
              
              {message && (
                <Alert variant={messageType === 'danger' ? 'danger' : 'success'} dismissible onClose={() => setMessage('')}>
                  {message}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit} id="addPetForm">
                {/* Личная информация */}
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Header className="bg-light py-3">
                    <h5 className="mb-0">
                      <i className="bi bi-person-badge me-2"></i>
                      Личная информация
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold">Имя *</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={!!currentUser || isSubmitting}
                            isInvalid={!!errors.name}
                            placeholder="Иван Иванов"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.name}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted small">
                            Только кириллица, пробелы и дефисы
                          </Form.Text>
                        </Form.Group>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold">Телефон *</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={!!currentUser || isSubmitting}
                            isInvalid={!!errors.phone}
                            placeholder="+79111234567"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.phone}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted small">
                            Только цифры и знак +
                          </Form.Text>
                        </Form.Group>
                      </div>
                      
                      <div className="col-12 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold">Email *</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!!currentUser || isSubmitting}
                            isInvalid={!!errors.email}
                            placeholder="user@example.com"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.email}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </div>
                    </div>
                    
                    {/* Регистрация при добавлении объявления */}
                    {!currentUser && (
                      <div className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="register"
                          name="register"
                          label="Зарегистрироваться при добавлении объявления"
                          checked={formData.register === true}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="fs-6"
                        />
                      </div>
                    )}
                    
                    {/* Поля пароля если выбрана регистрация */}
                    {formData.register === true && !currentUser && (
                      <div className="row mt-3 border-top pt-3">
                        <div className="col-md-6 mb-3">
                          <Form.Group>
                            <Form.Label className="fw-semibold">Пароль *</Form.Label>
                            <Form.Control
                              type="password"
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              isInvalid={!!errors.password}
                              className="py-2"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.password}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted small">
                              Минимум 7 символов, 1 цифра, 1 строчная и 1 заглавная буква
                            </Form.Text>
                          </Form.Group>
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <Form.Group>
                            <Form.Label className="fw-semibold">Подтверждение пароля *</Form.Label>
                            <Form.Control
                              type="password"
                              name="password_confirmation"
                              value={formData.password_confirmation}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              isInvalid={!!errors.password_confirmation}
                              className="py-2"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.password_confirmation}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Фотографии */}
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Header className="bg-light py-3">
                    <h5 className="mb-0">
                      <i className="bi bi-camera me-2"></i>
                      Фотографии животного
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <div className="row">
                      {[0, 1, 2].map(index => (
                        <div key={index} className="col-md-4 mb-3">
                          <Form.Group>
                            <Form.Label className="fw-semibold">
                              {index === 0 ? 'Фото 1 *' : `Фото ${index + 1}`}
                            </Form.Label>
                            <Form.Control
                              type="file"
                              id={`photo${index + 1}`}
                              accept=".png"
                              onChange={(e) => handleFileChange(e, index)}
                              disabled={isSubmitting}
                              isInvalid={!!errors[`photo${index + 1}`]}
                              className="py-2"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors[`photo${index + 1}`]}
                            </Form.Control.Feedback>
                            <Form.Text className={`small ${index === 0 ? 'text-danger' : 'text-success'}`}>
                              {index === 0 ? 'Обязательное поле' : 'Необязательное поле'}
                            </Form.Text>
                            
                            {photoPreviews[index] && (
                              <div className="mt-2">
                                <img 
                                  src={photoPreviews[index]} 
                                  alt={`Предпросмотр ${index + 1}`}
                                  className="img-thumbnail w-100"
                                  style={{ height: '150px', objectFit: 'cover' }}
                                />
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="mt-1 w-100 py-1"
                                  onClick={() => handleRemovePhoto(index)}
                                  disabled={isSubmitting}
                                >
                                  <i className="bi bi-trash me-1"></i>
                                  Удалить фото
                                </Button>
                              </div>
                            )}
                          </Form.Group>
                        </div>
                      ))}
                    </div>
                    <Alert variant="info" className="mt-3">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Важно:</strong> Поддерживается только формат PNG. Максимальный размер файла - 5MB.
                      Первая фотография обязательна.
                    </Alert>
                  </Card.Body>
                </Card>

                {/* Информация о животном */}
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Header className="bg-light py-3">
                    <h5 className="mb-0">
                      <i className="bi bi-paw me-2"></i>
                      Информация о животном
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold">Вид животного *</Form.Label>
                          <Form.Select
                            name="kind"
                            value={formData.kind}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            isInvalid={!!errors.kind}
                            className="py-2"
                          >
                            <option value="">Выберите вид</option>
                            {animalTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.kind}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold">Район *</Form.Label>
                          <Form.Select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            isInvalid={!!errors.district}
                            className="py-2"
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
                      </div>
                      
                      <div className="col-12 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Клеймо <span className="text-muted small">(необязательно)</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="mark"
                            value={formData.mark}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="Например: клеймо на ухе, номер чипа и т.д."
                            className="py-2"
                          />
                        </Form.Group>
                      </div>
                      
                      <div className="col-12 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold">Описание *</Form.Label>
                          <Form.Control
                            as="textarea"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            disabled={isSubmitting}
                            isInvalid={!!errors.description}
                            placeholder="Опишите животное, место и время находки, особенности поведения, состояние здоровья..."
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.description}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted small">
                            Подробное описание поможет быстрее найти хозяев
                          </Form.Text>
                        </Form.Group>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                {/* Согласие на обработку данных */}
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <Form.Check
                      type="checkbox"
                      id="confirm"
                      name="confirm"
                      label="Согласие на обработку персональных данных *"
                      checked={formData.confirm === 1}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      isInvalid={!!errors.confirm}
                      className="fs-5"
                    />
                    <Form.Control.Feedback type="invalid" className="d-block">
                      {errors.confirm}
                    </Form.Control.Feedback>
                    <p className="text-muted small mt-2">
                      Нажимая на кнопку, вы даете согласие на обработку персональных данных
                      и соглашаетесь с политикой конфиденциальности
                    </p>
                  </Card.Body>
                </Card>

                {/* Кнопки отправки */}
                <div className="d-flex flex-column flex-md-row gap-3 mt-4">
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="flex-grow-1 py-3"
                  >
                    {isSubmitting ? (
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
                  
                  <Button
                    variant="outline-secondary"
                    size="lg"
                    onClick={() => navigate('/')}
                    disabled={isSubmitting}
                    className="py-3"
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Отмена
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AddPet;