import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Spinner,
  Badge,
  Alert,
  Image,
  Row,
  Col,
  Modal,
  Form,
  Container,
  Tab,
  Tabs,
  Dropdown
} from 'react-bootstrap';
import { authApi, petsApi } from '../../utils/api';

// Вспомогательные функции
const safeApiCall = async (apiFunction, fallbackMessage = 'Ошибка запроса') => {
  try {
    console.log(`Вызов API: ${apiFunction.name || 'anonymous'}`);
    const response = await apiFunction();
    console.log(`API ответ успешен:`, response);
    return { success: true, data: response };
  } catch (error) {
    console.error(`${fallbackMessage}:`, {
      message: error.message,
      status: error.status,
      code: error.code
    });
    return {
      success: false,
      error: error.message || fallbackMessage,
      status: error.status || error.response?.status,
      details: error
    };
  }
};

// Расчет дней регистрации согласно ТЗ
const calculateDaysRegistered = (registrationDate) => {
  if (!registrationDate) return 0;

  try {
    // Пробуем разные форматы даты
    let date;

    // Формат из ТЗ: "01-01-1970"
    if (registrationDate.includes('-') && registrationDate.split('-').length === 3) {
      const parts = registrationDate.split('-');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      date = new Date(year, month, day);
    }
    // Формат ISO: "1970-01-01"
    else if (registrationDate.includes('-') && registrationDate.split('-')[0].length === 4) {
      date = new Date(registrationDate);
    }
    // Другие форматы
    else {
      date = new Date(registrationDate);
    }

    if (isNaN(date.getTime())) {
      console.warn('Невалидная дата регистрации:', registrationDate);
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today - date);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Ошибка расчета дней регистрации:', error);
  }

  return 0;
};

// Компонент для редактирования телефона
const EditPhoneModal = ({ show, onHide, currentPhone, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState(currentPhone || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (show) {
      setPhone(currentPhone || '');
      setError('');
      setSuccess('');
    }
  }, [show, currentPhone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Валидация согласно ТЗ
      if (!phone.trim()) {
        throw new Error('Телефон обязателен для заполнения');
      }

      const cleanedPhone = phone.replace(/\s/g, '');
      if (!/^(\+7|8)[0-9]{10}$/.test(cleanedPhone)) {
        throw new Error('Формат: +7XXXXXXXXXX или 8XXXXXXXXXX (10 цифр)');
      }

      // Согласно ТЗ: PATCH {host}/api/users/phone
      const result = await safeApiCall(() => authApi.updatePhone(phone), 'Ошибка обновления телефона');

      if (!result.success) {
        if (result.status === 422) {
          throw new Error('Некорректный номер телефона');
        } else if (result.status === 401) {
          throw new Error('Требуется авторизация');
        }
        throw new Error(result.error || 'Ошибка сервера');
      }

      // Успешное обновление
      setSuccess('Телефон успешно обновлен!');

      // Даем время увидеть сообщение об успехе
      setTimeout(() => {
        onUpdate(phone);
        onHide();
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Изменение номера телефона</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form.Group>
            <Form.Label>Новый номер телефона *</Form.Label>
            <Form.Control
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+79111234567"
              required
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Формат: +7XXXXXXXXXX или 8XXXXXXXXXX
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Сохранение...
              </>
            ) : 'Сохранить'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Компонент для редактирования email
const EditEmailModal = ({ show, onHide, currentEmail, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(currentEmail || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (show) {
      setEmail(currentEmail || '');
      setError('');
      setSuccess('');
    }
  }, [show, currentEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Валидация согласно ТЗ
      if (!email.trim()) {
        throw new Error('Email обязателен для заполнения');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Введите корректный email адрес');
      }

      // Согласно ТЗ: PATCH {host}/api/users/email
      const result = await safeApiCall(() => authApi.updateEmail(email), 'Ошибка обновления email');

      if (!result.success) {
        if (result.status === 422) {
          throw new Error('Некорректный email адрес');
        } else if (result.status === 401) {
          throw new Error('Требуется авторизация');
        }
        throw new Error(result.error || 'Ошибка сервера');
      }

      setSuccess('Email успешно обновлен!');

      setTimeout(() => {
        onUpdate(email);
        onHide();
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Изменение адреса электронной почты</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form.Group>
            <Form.Label>Новый email адрес *</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={loading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Сохранение...
              </>
            ) : 'Сохранить'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Компонент для подтверждения удаления
const DeleteConfirmationModal = ({ show, onHide, onConfirm, adTitle }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onHide();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Подтверждение удаления</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Вы уверены, что хотите удалить объявление?</p>
        {adTitle && (
          <p className="fw-bold">"{adTitle}"</p>
        )}
        <Alert variant="warning" className="small">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Удаление возможно только для объявлений со статусами "Активно" и "На модерации"
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Отмена
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Удаление...
            </>
          ) : 'Удалить'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Компонент для редактирования объявления
const EditAdModal = ({ show, onHide, ad, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: ad?.description || '',
    mark: ad?.mark || ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (show && ad) {
      setFormData({
        description: ad.description || '',
        mark: ad.mark || ''
      });
      setErrors({});
      setSuccess('');
    }
  }, [show, ad]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      // Валидация
      if (!formData.description.trim()) {
        throw new Error('Описание обязательно');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('description', formData.description.trim());
      if (formData.mark.trim()) {
        formDataToSend.append('mark', formData.mark.trim());
      }

      const result = await safeApiCall(() =>
        petsApi.updatePet(ad.id, formDataToSend),
        'Ошибка редактирования объявления'
      );

      if (!result.success) {
        if (result.status === 422) {
          throw new Error('Ошибка валидации данных');
        } else if (result.status === 403) {
          throw new Error('Редактирование запрещено для этого объявления');
        }
        throw new Error(result.error || 'Ошибка сервера');
      }

      setSuccess('Объявление успешно обновлено!');

      setTimeout(() => {
        onUpdate({ ...ad, ...formData });
        onHide();
      }, 1500);

    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!ad) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Редактирование объявления</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {errors.general && <Alert variant="danger">{errors.general}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Вид животного</Form.Label>
            <Form.Control
              type="text"
              value={ad.kind || ''}
              readOnly
              className="bg-light"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Район</Form.Label>
            <Form.Control
              type="text"
              value={ad.district || ''}
              readOnly
              className="bg-light"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Описание *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              required
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Клеймо (необязательно)</Form.Label>
            <Form.Control
              type="text"
              value={formData.mark}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                mark: e.target.value
              }))}
              placeholder="VL-0214"
              disabled={loading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Сохранение...
              </>
            ) : 'Сохранить'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Карточка объявления согласно ТЗ
const PetCard = memo(({ ad, onView, onEdit, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      // Пробуем разные форматы даты
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          // Формат DD-MM-YYYY
          if (parts[0].length === 2) {
            return `${parts[0]}.${parts[1]}.${parts[2]}`;
          }
          // Формат YYYY-MM-DD
          else if (parts[0].length === 4) {
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
          }
        }
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': {
        text: 'Активно',
        variant: 'success',
        icon: 'bi-check-circle',
        description: 'Объявление активно'
      },
      'onModeration': {
        text: 'На модерации',
        variant: 'warning',
        icon: 'bi-clock',
        description: 'Объявление на проверке'
      },
      'wasFound': {
        text: 'Хозяин найден',
        variant: 'primary',
        icon: 'bi-heart-fill',
        description: 'Хозяин найден'
      },
      'archive': {
        text: 'В архиве',
        variant: 'secondary',
        icon: 'bi-archive',
        description: 'В архиве'
      }
    };

    const statusInfo = statusMap[status] || {
      text: status,
      variant: 'secondary',
      icon: 'bi-question-circle',
      description: 'Неизвестный статус'
    };

    return (
      <Badge bg={statusInfo.variant} title={statusInfo.description}>
        <i className={`bi ${statusInfo.icon} me-1`}></i>
        {statusInfo.text}
      </Badge>
    );
  };

  // Обработка URL изображения согласно ТЗ
  const getImageUrl = () => {
    try {
      if (ad.photos) {
        let photo;

        if (Array.isArray(ad.photos) && ad.photos.length > 0) {
          photo = ad.photos[0];
        } else if (typeof ad.photos === 'string') {
          photo = ad.photos;
        } else if (ad.photo) {
          photo = ad.photo;
        }

        if (photo) {
          if (typeof photo === 'string') {
            // Согласно ТЗ: '{url}/img1.png'
            if (photo.includes('{url}')) {
              return photo.replace('{url}', 'https://pets.xn--80adjb3c7a.xn--p1ai');
            }
            // Если это относительный путь
            if (photo.startsWith('/')) {
              return `https://pets.xn--80adjb3c7a.xn--p1ai${photo}`;
            }
            // Если это уже полный URL
            if (photo.startsWith('http')) {
              return photo;
            }
            // Просто имя файла
            return `https://pets.xn--80adjb3c7a.xn--p1ai/images/${photo}`;
          }
        }
      }
    } catch (error) {
      console.error('Error getting image URL:', error);
    }

    return '/images/default-pet.png';
  };

  const imageUrl = getImageUrl();

  return (
    <Card className="h-100 shadow-sm">
      <div
        className="position-relative"
        style={{
          height: '200px',
          overflow: 'hidden',
          cursor: 'pointer',
          backgroundColor: '#f8f9fa'
        }}
        onClick={() => onView(ad.id)}
      >
        {!imageLoaded && !imageError && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <Spinner animation="border" size="sm" variant="secondary" />
          </div>
        )}

        <Image
          src={imageError ? '/images/default-pet.png' : imageUrl}
          alt={ad.description || 'Объявление о животном'}
          fluid
          style={{
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            console.warn('Error loading image:', imageUrl);
            setImageError(true);
            setImageLoaded(true);
          }}
          loading="lazy"
        />

        <div className="position-absolute top-0 end-0 m-2">
          {getStatusBadge(ad.status)}
        </div>

        {ad.district && (
          <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-1">
            <small>
              <i className="bi bi-geo-alt me-1"></i>
              {ad.district}
            </small>
          </div>
        )}
      </div>

      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="h6 mb-0">{ad.kind || 'Животное'}</Card.Title>
          {ad.mark && (
            <Badge bg="light" text="dark" className="small">
              <i className="bi bi-tag me-1"></i>
              {ad.mark}
            </Badge>
          )}
        </div>

        <div className="mb-2">
          <small className="text-muted">
            <i className="bi bi-calendar me-1"></i>
            {formatDate(ad.date)}
          </small>
        </div>

        <Card.Text
          className="small text-muted mb-3"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '60px'
          }}
          title={ad.description}
        >
          {ad.description || 'Нет описания'}
        </Card.Text>

        <div className="d-flex justify-content-between align-items-center">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onView(ad.id)}
          >
            <i className="bi bi-eye me-1"></i>
            Подробнее
          </Button>

          {(ad.status === 'active' || ad.status === 'onModeration') && (
            <div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(ad);
                }}
                title="Редактировать"
              >
                <i className="bi bi-pencil"></i>
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(ad.id, ad.description?.substring(0, 30) || 'объявление');
                }}
                title="Удалить"
              >
                <i className="bi bi-trash"></i>
              </Button>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
});

PetCard.displayName = 'PetCard';

// Основной компонент Profile
function Profile() {
  const navigate = useNavigate();

  // Состояния
  const [currentUser, setCurrentUser] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState({ profile: true, ads: true });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showTestDataAlert, setShowTestDataAlert] = useState(false);

  // Модальные окна
  const [phoneModal, setPhoneModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [editAdModal, setEditAdModal] = useState({
    show: false,
    ad: null
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    adId: null,
    adTitle: ''
  });

  // Проверка авторизации
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Требуется авторизация. Вы будете перенаправлены на страницу входа.');
      setTimeout(() => navigate('/login'), 2000);
      return false;
    }
    return true;
  }, [navigate]);

  // Загрузка данных пользователя согласно ТЗ
  const loadUserData = useCallback(async () => {
    if (!checkAuth()) return null;

    try {
      console.log('Загрузка данных пользователя...');

      // Сначала проверяем localStorage
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('Используем сохраненные данные пользователя');
          parsedUser.daysRegistered = calculateDaysRegistered(parsedUser.registrationDate);
          return parsedUser;
        } catch (parseError) {
          console.error('Ошибка парсинга сохраненных данных:', parseError);
        }
      }

      // Пробуем загрузить с сервера
      const result = await safeApiCall(() => authApi.getUser(), 'Ошибка загрузки профиля');

      if (!result.success) {
        // Обработка ошибок согласно ТЗ
        if (result.status === 401) {
          setError('Сессия истекла. Пожалуйста, войдите снова.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          setTimeout(() => navigate('/login'), 2000);
          return null;
        }

        console.warn('Не удалось загрузить данные с сервера, используем тестовые данные');
        setShowTestDataAlert(true);

        // Тестовые данные пользователя
        const testUser = {
          id: 1,
          name: "Иван Иванов",
          phone: "+79111234567",
          email: "ivan@example.com",
          registrationDate: "01-01-2024",
          ordersCount: 3,
          petsCount: 1,
          daysRegistered: calculateDaysRegistered("01-01-2024")
        };

        localStorage.setItem('currentUser', JSON.stringify(testUser));
        return testUser;
      }

      // Обработка ответа
      let userData;

      if (result.data?.data?.user) {
        userData = Array.isArray(result.data.data.user)
          ? result.data.data.user[0]
          : result.data.data.user;
      } else if (result.data?.data) {
        userData = result.data.data;
      } else if (result.data?.user) {
        userData = Array.isArray(result.data.user)
          ? result.data.user[0]
          : result.data.user;
      } else if (result.data) {
        userData = result.data;
      }

      if (!userData) {
        console.warn('Нет данных пользователя в ответе');

        // Тестовые данные
        const testUser = {
          id: 1,
          name: "Иван Иванов",
          phone: "+79111234567",
          email: "ivan@example.com",
          registrationDate: "01-01-2024",
          ordersCount: 0,
          petsCount: 0,
          daysRegistered: calculateDaysRegistered("01-01-2024")
        };

        setShowTestDataAlert(true);
        localStorage.setItem('currentUser', JSON.stringify(testUser));
        return testUser;
      }

      // Добавляем расчет дней регистрации
      userData.daysRegistered = calculateDaysRegistered(userData.registrationDate);

      // Сохраняем в localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));

      return userData;

    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);

      // Тестовые данные в случае ошибки
      const testUser = {
        id: 1,
        name: "Иван Иванов",
        phone: "+79111234567",
        email: "ivan@example.com",
        registrationDate: "01-01-2024",
        ordersCount: 0,
        petsCount: 0,
        daysRegistered: calculateDaysRegistered("01-01-2024")
      };

      setShowTestDataAlert(true);
      localStorage.setItem('currentUser', JSON.stringify(testUser));
      return testUser;
    }
  }, [checkAuth, navigate]);

  // Тестовые данные для объявлений
  const getTestAds = useCallback(() => {
    return [
      {
        id: 1,
        kind: "кошка",
        description: "Найдена маленькая кошечка в центре города",
        district: "Центральный",
        date: "15-12-2024",
        status: "active",
        photos: ['/images/cat1.png'],
        mark: "VL-0214"
      },
      {
        id: 2,
        kind: "собака",
        description: "Найдена веселая собачка породы бультерьер",
        district: "Василеостровский",
        date: "10-12-2024",
        status: "onModeration",
        photos: ['/images/dog1.png'],
        mark: "VL-1250"
      },
      {
        id: 3,
        kind: "котёнок",
        description: "Найден маленький котенок в парке",
        district: "Адмиралтейский",
        date: "05-12-2024",
        status: "wasFound",
        photos: ['/images/kitten1.png'],
        mark: ""
      }
    ];
  }, []);

  // Загрузка объявлений пользователя согласно ТЗ
  const loadUserAds = useCallback(async () => {
    if (!checkAuth()) return [];

    try {
      console.log('Загрузка объявлений пользователя...');

      const result = await safeApiCall(() => authApi.getUserOrders(), 'Ошибка загрузки объявлений');

      if (!result.success) {
        if (result.status === 401) {
          console.warn('Ошибка авторизации при загрузке объявлений');
          return [];
        }

        if (result.status === 204) {
          console.log('Нет объявлений (статус 204)');
          return [];
        }

        console.warn('Используем тестовые данные объявлений из-за ошибки API');
        setShowTestDataAlert(true);
        return getTestAds();
      }

      let orders = [];

      // Обработка разных форматов ответа
      if (result.data?.status === 204) {
        return [];
      }

      if (result.data?.data?.orders) {
        orders = result.data.data.orders;
      } else if (result.data?.orders) {
        orders = result.data.orders;
      } else if (Array.isArray(result.data?.data)) {
        orders = result.data.data;
      } else if (Array.isArray(result.data)) {
        orders = result.data;
      } else {
        console.warn('Неверный формат ответа, используем тестовые данные');
        setShowTestDataAlert(true);
        return getTestAds();
      }

      if (!orders || orders.length === 0) {
        console.log('Нет объявлений пользователя');
        return [];
      }

      // Преобразуем в нужный формат
      return orders.map(ad => ({
        id: ad.id || Math.random(),
        kind: ad.kind || 'Не указано',
        description: ad.description || '',
        district: ad.district || '',
        date: ad.date || '',
        status: ad.status || 'active',
        photos: ad.photos || (ad.photo ? [ad.photo] : []),
        mark: ad.mark || ''
      }));

    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
      console.log('Используем тестовые данные из-за ошибки');
      setShowTestDataAlert(true);
      return getTestAds();
    }
  }, [checkAuth, getTestAds]);

  // Загрузка всех данных
  const loadAllData = useCallback(async () => {
    setLoading({ profile: true, ads: true });
    setError(null);
    setSuccessMessage('');

    try {
      const userData = await loadUserData();
      if (userData) {
        setCurrentUser(userData);

        const adsData = await loadUserAds();
        setUserAds(adsData);

        // Обновляем количество объявлений
        if (userData.ordersCount !== adsData.length) {
          const updatedUser = { ...userData, ordersCount: adsData.length };
          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }

        // Показываем сообщение об успешной загрузке
        if (adsData.length > 0) {
          setSuccessMessage(`Загружено ${adsData.length} объявлений`);
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setError('Не удалось загрузить данные профиля. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading({ profile: false, ads: false });
    }
  }, [loadUserData, loadUserAds]);

  // Инициализация при загрузке компонента
  useEffect(() => {
    loadAllData();

    // Слушаем событие добавления нового объявления
    const handleNewAdAdded = () => {
      console.log('Новое объявление добавлено, обновляем список...');
      loadAllData();
    };

    window.addEventListener('newAdAdded', handleNewAdAdded);

    return () => {
      window.removeEventListener('newAdAdded', handleNewAdAdded);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Обработчики событий
  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из личного кабинета?')) {
      authApi.logout();
      navigate('/login');
    }
  };

  const handleViewAd = (adId) => {
    navigate(`/pet/${adId}`);
  };

  const handleEditAd = (ad) => {
    // Проверка статуса согласно ТЗ
    if (ad.status !== 'active' && ad.status !== 'onModeration') {
      alert('Редактирование возможно только для объявлений со статусами "Активно" и "На модерации"');
      return;
    }
    setEditAdModal({ show: true, ad });
  };

  const handleUpdateAd = (updatedAd) => {
    setUserAds(prev => prev.map(ad => ad.id === updatedAd.id ? updatedAd : ad));
    setSuccessMessage('Объявление успешно обновлено');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteClick = (adId, adTitle) => {
    setDeleteModal({
      show: true,
      adId,
      adTitle: adTitle || 'объявление'
    });
  };

  const handleDeleteConfirm = async () => {
    const { adId, adTitle } = deleteModal;

    try {
      // Согласно ТЗ: DELETE {host}/api/users/orders/{id}
      const result = await safeApiCall(() => petsApi.deleteOrder(adId), 'Ошибка удаления объявления');

      if (!result.success) {
        if (result.status === 403) {
          throw new Error('Удаление запрещено. Можно удалять только объявления со статусами "Активно" и "На модерации"');
        } else if (result.status === 401) {
          throw new Error('Требуется авторизация');
        }
        throw new Error(result.error || 'Ошибка сервера');
      }

      // Удаляем из состояния
      const updatedAds = userAds.filter(ad => ad.id !== adId);
      setUserAds(updatedAds);

      // Обновляем статистику
      setCurrentUser(prev => ({
        ...prev,
        ordersCount: Math.max(0, (prev.ordersCount || 0) - 1)
      }));

      // Сохраняем обновленного пользователя
      const updatedUser = { ...currentUser, ordersCount: Math.max(0, (currentUser.ordersCount || 0) - 1) };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      // Показываем уведомление
      setSuccessMessage(`Объявление "${adTitle.substring(0, 30)}..." успешно удалено`);
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Ошибка удаления объявления:', error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      setDeleteModal({ show: false, adId: null, adTitle: '' });
    }
  };

  const handleUpdatePhone = async (newPhone) => {
    try {
      // Обновляем локальное состояние
      const updatedUser = { ...currentUser, phone: newPhone };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      setSuccessMessage('Номер телефона успешно обновлен');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Ошибка обновления телефона:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleUpdateEmail = async (newEmail) => {
    try {
      // Обновляем локальное состояние
      const updatedUser = { ...currentUser, email: newEmail };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      setSuccessMessage('Email успешно обновлен');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Ошибка обновления email:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleRefresh = () => {
    loadAllData();
  };

  const handleAddNewAd = () => {
    navigate('/add-pet');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          // Формат DD-MM-YYYY
          if (parts[0].length === 2) {
            return `${parts[0]}.${parts[1]}.${parts[2]}`;
          }
          // Формат YYYY-MM-DD
          else if (parts[0].length === 4) {
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
          }
        }
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  // Фильтрация объявлений по статусу
  const getAdsByStatus = (status) => {
    return userAds.filter(ad => ad.status === status);
  };

  // Рендеринг контента объявлений
  const renderAdsContent = (ads, isLoading, typeText) => {
    if (isLoading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Загрузка {typeText}...</p>
        </div>
      );
    }

    if (ads.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="display-1 text-muted mb-4">
            <i className="bi bi-newspaper"></i>
          </div>
          <h4 className="text-muted mb-3">
            {typeText === 'всех объявлений' ? 'Объявлений пока нет' : `Нет ${typeText}`}
          </h4>
          <p className="text-muted mb-4">
            {typeText === 'всех объявлений'
              ? 'Добавьте первое объявление о найденном животном'
              : `У вас пока нет ${typeText}`}
          </p>
          {typeText === 'всех объявлений' && (
            <Button variant="primary" size="lg" onClick={handleAddNewAd}>
              <i className="bi bi-plus-circle me-2"></i>
              Добавить объявление
            </Button>
          )}
        </div>
      );
    }

    return (
      <>
        <Row className="g-4">
          {ads.map(ad => (
            <Col key={ad.id} xs={12} md={6} lg={6}>
              <PetCard
                ad={ad}
                onView={handleViewAd}
                onEdit={handleEditAd}
                onDelete={handleDeleteClick}
              />
            </Col>
          ))}
        </Row>

        <div className="text-center mt-4 pt-4 border-top">
          <p className="text-muted mb-3">
            {typeText === 'всех объявлений'
              ? `Всего объявлений: ${ads.length}`
              : `${typeText}: ${ads.length}`}
          </p>
          <Button variant="primary" onClick={handleAddNewAd}>
            <i className="bi bi-plus-circle me-2"></i>
            Добавить еще объявление
          </Button>
        </div>
      </>
    );
  };

  // Если загрузка
  if (loading.profile && !currentUser) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Загрузка профиля...</p>
        </div>
      </Container>
    );
  }

  // Если нет авторизации
  const token = authApi.getToken();
  if (!token) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <div className="py-4">
            <div className="display-1 text-warning mb-4">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <Alert.Heading>Требуется авторизация</Alert.Heading>
            <p>Для просмотра личного кабинета необходимо войти в систему</p>
            <div className="mt-4">
              <Button variant="primary" onClick={() => navigate('/login')} className="me-3">
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Войти
              </Button>
              <Button variant="outline-primary" onClick={() => navigate('/register')}>
                <i className="bi bi-person-plus me-2"></i>
                Зарегистрироваться
              </Button>
            </div>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Уведомления */}
      {showTestDataAlert && (
        <Alert
          variant="info"
          dismissible
          onClose={() => setShowTestDataAlert(false)}
          className="mb-4"
        >
          <Alert.Heading>Используются тестовые данные</Alert.Heading>
          <p>Сервер API временно недоступен. Для демонстрации работы приложения используются тестовые данные.</p>
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
          className="mb-4"
        >
          <Alert.Heading>Ошибка!</Alert.Heading>
          <p>{error}</p>
          {error.includes('авторизация') || error.includes('Сессия') ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/login')}
              className="mt-2"
            >
              Перейти к авторизации
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRefresh}
              className="mt-2"
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Повторить попытку
            </Button>
          )}
        </Alert>
      )}

      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccessMessage('')}
          className="mb-4"
        >
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
        </Alert>
      )}

      {/* Заголовок и управление */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div className="mb-3 mb-md-0">
          <h1 className="h2 text-primary mb-0">
            <i className="bi bi-person-circle me-2"></i>
            Личный кабинет
          </h1>
          <p className="text-muted mb-0">Управление вашим профилем и объявлениями</p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Button
            variant="outline-primary"
            onClick={() => navigate('/')}
            size="sm"
            className="mb-1"
            title="На главную"
          >
            <i className="bi bi-house me-1"></i>
            Главная
          </Button>
          <Button
            variant="outline-success"
            onClick={handleRefresh}
            size="sm"
            className="mb-1"
            title="Обновить данные"
            disabled={loading.profile || loading.ads}
          >
            {loading.profile || loading.ads ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-1"></i>
                Обновить
              </>
            )}
          </Button>
          <Button
            variant="outline-danger"
            onClick={handleLogout}
            size="sm"
            className="mb-1"
            title="Выйти из системы"
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            Выйти
          </Button>
        </div>
      </div>

      {/* Основной контент */}
      <Row>
        {/* Боковая панель профиля */}
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-primary text-white py-3">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-person-badge me-2"></i>
                Профиль пользователя
              </h5>
            </Card.Header>

            <Card.Body>
              <div className="text-center mb-4">
                <Image
                  src="/images/default-avatar.png"
                  alt="Аватар"
                  roundedCircle
                  fluid
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                    border: '3px solid var(--bs-primary)'
                  }}
                />
                <h4 className="mt-3 mb-1">{currentUser?.name || 'Пользователь'}</h4>
                <p className="text-muted small">
                  <i className="bi bi-calendar-check me-1"></i>
                  На сайте {currentUser?.daysRegistered || 0} дней
                </p>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-muted">
                    <i className="bi bi-envelope me-1"></i>Email:
                  </small>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-decoration-none"
                    onClick={() => setEmailModal(true)}
                    title="Изменить email"
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                </div>
                <p className="fw-semibold mb-0 text-break">{currentUser?.email || 'Не указан'}</p>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-muted">
                    <i className="bi bi-telephone me-1"></i>Телефон:
                  </small>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-decoration-none"
                    onClick={() => setPhoneModal(true)}
                    title="Изменить телефон"
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                </div>
                <p className="fw-semibold mb-0">{currentUser?.phone || 'Не указан'}</p>
              </div>

              <div className="mb-4">
                <small className="text-muted d-block mb-1">
                  <i className="bi bi-calendar-event me-1"></i>Дата регистрации:
                </small>
                <p className="fw-semibold mb-0">
                  {formatDate(currentUser?.registrationDate)}
                </p>
              </div>

              {/* Статистика согласно ТЗ */}
              <Card className="border mb-4">
                <Card.Body className="p-3">
                  <h6 className="mb-3 text-center">Статистика</h6>
                  <Row className="text-center">
                    <Col xs={6}>
                      <div className="p-2">
                        <div className="text-primary fw-bold fs-4">{currentUser?.ordersCount || 0}</div>
                        <small className="text-muted">Объявлений</small>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="p-2">
                        <div className="text-success fw-bold fs-4">{currentUser?.petsCount || 0}</div>
                        <small className="text-muted">Найдено хозяев</small>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Действия */}
              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  onClick={handleAddNewAd}
                  className="d-flex align-items-center justify-content-center"
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Добавить объявление
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={() => navigate('/search')}
                  className="d-flex align-items-center justify-content-center"
                >
                  <i className="bi bi-search me-2"></i>
                  Поиск животных
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Объявления пользователя */}
        <Col lg={8}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-primary text-white py-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="bi bi-newspaper me-2"></i>
                  Мои объявления
                  {userAds.length > 0 && (
                    <Badge bg="light" text="dark" className="ms-2">
                      {userAds.length}
                    </Badge>
                  )}
                </h5>
                <div className="mt-2 mt-md-0">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={handleAddNewAd}
                    className="me-2"
                  >
                    <i className="bi bi-plus-circle me-1"></i> Добавить
                  </Button>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => navigate('/search')}
                  >
                    <i className="bi bi-search me-1"></i> Поиск
                  </Button>
                </div>
              </div>
            </Card.Header>

            <Card.Body className="p-0">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3 px-3 pt-3"
              >
                <Tab eventKey="all" title={
                  <span>
                    Все
                    <Badge bg="secondary" className="ms-1">{userAds.length}</Badge>
                  </span>
                }>
                  <div className="p-3">
                    {renderAdsContent(userAds, loading.ads, 'всех объявлений')}
                  </div>
                </Tab>
                <Tab eventKey="active" title={
                  <span>
                    Активные
                    <Badge bg="success" className="ms-1">{getAdsByStatus('active').length}</Badge>
                  </span>
                }>
                  <div className="p-3">
                    {renderAdsContent(getAdsByStatus('active'), loading.ads, 'активных объявлений')}
                  </div>
                </Tab>
                <Tab eventKey="moderation" title={
                  <span>
                    На модерации
                    <Badge bg="warning" className="ms-1">{getAdsByStatus('onModeration').length}</Badge>
                  </span>
                }>
                  <div className="p-3">
                    {renderAdsContent(getAdsByStatus('onModeration'), loading.ads, 'объявлений на модерации')}
                  </div>
                </Tab>
                <Tab eventKey="found" title={
                  <span>
                    Хозяин найден
                    <Badge bg="primary" className="ms-1">{getAdsByStatus('wasFound').length}</Badge>
                  </span>
                }>
                  <div className="p-3">
                    {renderAdsContent(getAdsByStatus('wasFound'), loading.ads, 'объявлений с найденными хозяевами')}
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Модальные окна */}
      <EditPhoneModal
        show={phoneModal}
        onHide={() => setPhoneModal(false)}
        currentPhone={currentUser?.phone}
        onUpdate={handleUpdatePhone}
      />

      <EditEmailModal
        show={emailModal}
        onHide={() => setEmailModal(false)}
        currentEmail={currentUser?.email}
        onUpdate={handleUpdateEmail}
      />

      <EditAdModal
        show={editAdModal.show}
        onHide={() => setEditAdModal({ show: false, ad: null })}
        ad={editAdModal.ad}
        onUpdate={handleUpdateAd}
      />

      <DeleteConfirmationModal
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, adId: null, adTitle: '' })}
        onConfirm={handleDeleteConfirm}
        adTitle={deleteModal.adTitle}
      />
    </Container>
  );
}

export default Profile;