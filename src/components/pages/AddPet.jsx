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
import { petsApi, authApi } from '../../utils/api';

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

  // Загрузка данных пользователя при монтировании
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      // Загружаем данные пользователя из localStorage
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
        } catch (error) {
          console.error('Error parsing saved user:', error);
        }
      }
    }
  }, []);

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};

    console.log('=== ВАЛИДАЦИЯ ФОРМЫ ===');
    console.log('Данные формы:', formData);

    // Проверка имени
    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно для заполнения';
      console.log('Ошибка имени: поле пустое');
    } else if (!/^[а-яА-ЯёЁ\s\-]+$/.test(formData.name)) {
      newErrors.name = 'Допустимы только кириллические буквы, пробелы и дефисы';
      console.log('Ошибка имени: недопустимые символы');
    }

    // Проверка телефона
    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен для заполнения';
      console.log('Ошибка телефона: поле пустое');
    } else {
      // Очищаем телефон от лишних символов
      const cleanedPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
      console.log('Очищенный телефон:', cleanedPhone);

      if (!/^(\+7|8)[0-9]{10}$/.test(cleanedPhone)) {
        newErrors.phone = 'Формат: +7XXXXXXXXXX или 8XXXXXXXXXX (10 цифр)';
        console.log('Ошибка телефона: неверный формат');
      }
    }

    // Проверка email
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
      console.log('Ошибка email: поле пустое');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
      console.log('Ошибка email: неверный формат');
    }

    // Проверка вида животного
    if (!formData.kind.trim()) {
      newErrors.kind = 'Вид животного обязателен для заполнения';
      console.log('Ошибка вида животного: не выбрано');
    }

    // Проверка района
    if (!formData.district.trim()) {
      newErrors.district = 'Район обязателен для заполнения';
      console.log('Ошибка района: не выбран');
    }

    // Проверка описания
    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно для заполнения';
      console.log('Ошибка описания: поле пустое');
    }

    // Проверка фото
    if (!formData.photo1) {
      newErrors.photo1 = 'Фото 1 обязательно для загрузки';
      console.log('Ошибка фото1: не загружено');
    } else {
      console.log('Фото1 проверка:', {
        type: formData.photo1.type,
        name: formData.photo1.name,
        size: formData.photo1.size
      });

      const isPNG = formData.photo1.type === 'image/png' ||
                   formData.photo1.name.toLowerCase().endsWith('.png');

      if (!isPNG) {
        newErrors.photo1 = 'Фото должно быть в формате PNG';
        console.log('Ошибка фото1: не PNG формат');
      }
    }

    // Проверка дополнительных фото
    if (formData.photo2) {
      const isPNG = formData.photo2.type === 'image/png' ||
                   formData.photo2.name.toLowerCase().endsWith('.png');
      if (!isPNG) {
        newErrors.photo2 = 'Фото должно быть в формате PNG';
      }
    }

    if (formData.photo3) {
      const isPNG = formData.photo3.type === 'image/png' ||
                   formData.photo3.name.toLowerCase().endsWith('.png');
      if (!isPNG) {
        newErrors.photo3 = 'Фото должно быть в формате PNG';
      }
    }

    // Проверка пароля при регистрации
    if (formData.register === 1) {
      if (!formData.password) {
        newErrors.password = 'Пароль обязателен для регистрации';
      } else if (formData.password.length < 7) {
        newErrors.password = 'Пароль должен содержать не менее 7 символов';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Пароль должен содержать минимум 1 заглавную букву, 1 строчную букву и 1 цифру';
      }

      if (!formData.password_confirmation) {
        newErrors.password_confirmation = 'Подтверждение пароля обязательно';
      } else if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Пароли не совпадают';
      }
    }

    // Проверка согласия
    if (!formData.confirm) {
      newErrors.confirm = 'Необходимо согласие на обработку персональных данных';
      console.log('Ошибка согласия: не отмечено');
    }

    console.log('Найдено ошибок:', Object.keys(newErrors).length);
    console.log('Ошибки:', newErrors);
    console.log('=== КОНЕЦ ВАЛИДАЦИИ ===');

    return newErrors;
  };

  // Обработчик изменения полей
  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;

    console.log(`Изменение поля ${name}:`, { value, type, checked, files });

    if (type === 'checkbox') {
      const newValue = checked ? 1 : 0;
      console.log(`Checkbox ${name}: ${checked} -> ${newValue}`);

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
      }
    } else if (type === 'file' && files && files[0]) {
      const file = files[0];
      console.log(`Файл ${name}:`, {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Проверка PNG формата
      const isPNG = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

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
      // Для авторизованных пользователей запрещаем изменение контактных данных
      if (isAuthenticated && (name === 'name' || name === 'phone' || name === 'email')) {
        console.log(`Поле ${name} заблокировано для авторизованного пользователя`);
        return;
      }

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

    console.log('=== НАЧАЛО ОТПРАВКИ ФОРМЫ ===');

    // Валидация
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      console.log('Валидация не пройдена, ошибки:', validationErrors);
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

    console.log('Валидация пройдена успешно');

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Создание FormData
      const formDataToSend = new FormData();

      console.log('=== ФОРМИРОВАНИЕ FORMDATA ===');

      // Контактные данные
      formDataToSend.append('name', formData.name.trim());
      console.log('Добавлено name:', formData.name.trim());

      formDataToSend.append('phone', formData.phone.trim());
      console.log('Добавлено phone:', formData.phone.trim());

      formDataToSend.append('email', formData.email.trim());
      console.log('Добавлено email:', formData.email.trim());

      // Данные животного
      formDataToSend.append('kind', formData.kind.trim());
      console.log('Добавлено kind:', formData.kind.trim());

      formDataToSend.append('district', formData.district.trim());
      console.log('Добавлено district:', formData.district.trim());

      formDataToSend.append('description', formData.description.trim());
      console.log('Добавлено description:', formData.description.trim());

      // Клеймо (необязательное)
      if (formData.mark.trim()) {
        formDataToSend.append('mark', formData.mark.trim());
        console.log('Добавлено mark:', formData.mark.trim());
      }

      // Фотографии
      formDataToSend.append('photo1', formData.photo1);
      console.log('Добавлено photo1:', formData.photo1.name);

      if (formData.photo2) {
        formDataToSend.append('photo2', formData.photo2);
        console.log('Добавлено photo2:', formData.photo2.name);
      }

      if (formData.photo3) {
        formDataToSend.append('photo3', formData.photo3);
        console.log('Добавлено photo3:', formData.photo3.name);
      }

      // Checkbox значения как строки "1" или "0"
      formDataToSend.append('confirm', formData.confirm.toString());
      console.log('Добавлено confirm:', formData.confirm.toString());

      formDataToSend.append('register', formData.register.toString());
      console.log('Добавлено register:', formData.register.toString());

      // Пароли при регистрации
      if (formData.register === 1) {
        formDataToSend.append('password', formData.password);
        console.log('Добавлено password:', '[скрыто]');

        formDataToSend.append('password_confirmation', formData.password_confirmation);
        console.log('Добавлено password_confirmation:', '[скрыто]');
      }

      // Логирование содержимого FormData
      console.log('=== СОДЕРЖАНИЕ FORMDATA ===');
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name}, ${value.type}, ${value.size} байт`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      console.log('=== КОНЕЦ FORMDATA ===');

      console.log('Отправка запроса на /api/pets...');

      // Отправка запроса
      const response = await petsApi.addPet(formDataToSend);

      console.log('Ответ сервера:', response);

      if (response.status === 200 || response.status === 201 || response.status === 204) {
        console.log('Успешная отправка!');
        setSuccessMessage('Объявление успешно добавлено!');

        // Если регистрация прошла успешно
        if (formData.register === 1 && response.data?.token) {
          localStorage.setItem('authToken', response.data.token);
          setIsAuthenticated(true);

          // Загружаем данные пользователя
          try {
            await authApi.getUser();
          } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
          }
        }

        // Перенаправление через 2 секунды
        setTimeout(() => {
          if (isAuthenticated || (formData.register === 1 && response.data?.token)) {
            navigate('/profile');
          } else {
            navigate('/');
          }
        }, 2000);
      }

    } catch (error) {
      console.error('=== ОШИБКА ПРИ ОТПРАВКЕ ===');
      console.error('Тип ошибки:', error.constructor.name);
      console.error('Сообщение:', error.message);
      console.error('Статус:', error.status);
      console.error('Код:', error.code);
      console.error('Данные ошибки:', error.data);
      console.error('Ошибки валидации:', error.errors);

      // Обработка ошибок валидации
      if (error.status === 422) {
        const serverErrors = error.errors || error.data?.error?.errors || {};
        console.log('Ошибки с сервера:', serverErrors);

        setErrors(serverErrors);

        // Формируем понятное сообщение об ошибках
        let errorMessage = 'Ошибки при заполнении формы:\n\n';
        let hasErrors = false;

        for (const [field, messages] of Object.entries(serverErrors)) {
          if (Array.isArray(messages)) {
            errorMessage += `${field}: ${messages.join(', ')}\n`;
            hasErrors = true;
          } else if (typeof messages === 'string') {
            errorMessage += `${field}: ${messages}\n`;
            hasErrors = true;
          }
        }

        if (hasErrors) {
          alert(errorMessage);
        } else {
          alert('Ошибка валидации. Пожалуйста, проверьте правильность всех полей.');
        }
      } else if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
        alert('Ошибка соединения с сервером. Проверьте интернет-соединение и попробуйте снова.');
      } else if (error.message.includes('fetch')) {
        alert('Не удалось подключиться к серверу. Возможно, проблема с сетью или сервер недоступен.');
      } else {
        alert(`Ошибка: ${error.message || 'Неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false);
      console.log('=== ЗАВЕРШЕНИЕ ОТПРАВКИ ===');
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

  // Районы согласно ТЗ
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
                    {formData.register === 1 ?
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

              <Form onSubmit={handleSubmit} noValidate>
                {/* Информация о контактах */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-person-lines-fill me-2"></i>
                      Ваши контактные данные
                    </h5>
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
                            placeholder="+79111234567"
                            isInvalid={!!errors.phone}
                            required
                            readOnly={isAuthenticated}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.phone}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted">
                            Формат: +7XXXXXXXXXX
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
                            Четкое фото животного
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
                            Дополнительное фото
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
                            Фото особых примет
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
                        setFormData({
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
                        });
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