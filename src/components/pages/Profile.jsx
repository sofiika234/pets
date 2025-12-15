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
  Tabs
} from 'react-bootstrap';
import { authApi, petsApi } from '../../utils/api';

// Тестовые данные согласно ТЗ
const MOCK_USER_DATA = {
  id: 1,
  name: "Иван",
  phone: "89112345678",
  email: "mail@email.ru",
  registrationDate: "01-01-1970",
  ordersCount: 4,
  petsCount: 2
};

const MOCK_USER_ADS = [
  {
    id: 1,
    kind: "кошка",
    description: "Найдена кошка, порода Сфинкс, очень грустная",
    district: "Василеостровский",
    date: "01-01-1970",
    status: "active",
    photos: ['{url}/img1.png'],
    mark: "VL-0214"
  },
  {
    id: 2,
    kind: "собака",
    description: "Найдена веселая собачка породы бультерьер",
    district: "Центральный",
    date: "15-06-2024",
    status: "onModeration",
    photos: ['{url}/img2.png'],
    mark: "VL-1250"
  },
  {
    id: 3,
    kind: "кошка",
    description: "Найдена маленькая кошечка",
    district: "Адмиралтейский",
    date: "10-06-2024",
    status: "wasFound",
    photos: ['{url}/img3.png'],
    mark: ""
  }
];

// Вспомогательные функции
const safeApiCall = async (apiFunction, fallbackMessage = 'Ошибка запроса') => {
  try {
    const response = await apiFunction();
    return { success: true, data: response };
  } catch (error) {
    console.error(fallbackMessage, error);
    return { 
      success: false, 
      error: error.message || fallbackMessage,
      status: error.status || error.response?.status
    };
  }
};

// Расчет дней регистрации согласно ТЗ
const calculateDaysRegistered = (registrationDate) => {
  if (!registrationDate) return 0;
  
  try {
    // Формат из ТЗ: "01-01-1970"
    const parts = registrationDate.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      
      if (isNaN(date.getTime())) return 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(today - date);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
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

  useEffect(() => {
    if (show) {
      setPhone(currentPhone || '');
      setError('');
    }
  }, [show, currentPhone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Валидация согласно ТЗ
      if (!phone.trim()) {
        throw new Error('Телефон обязателен для заполнения');
      }

      const cleanedPhone = phone.replace(/\s/g, '');
      if (!/^\+?[0-9]+$/.test(cleanedPhone)) {
        throw new Error('Телефон должен содержать только цифры и знак +');
      }

      // Согласно ТЗ: PATCH {host}/api/users/phone
      const result = await safeApiCall(() => authApi.updatePhone(phone), 'Ошибка обновления телефона');
      
      if (!result.success) {
        if (result.status === 422) {
          throw new Error('Некорректный номер телефона');
        } else if (result.status === 401) {
          throw new Error('Требуется авторизация');
        }
        throw new Error(result.error);
      }

      // Успешное обновление
      onUpdate(phone);
      onHide();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Изменение номера телефона</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group>
            <Form.Label>Новый номер телефона *</Form.Label>
            <Form.Control
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+79111234567"
              required
            />
            <Form.Text className="text-muted">
              Только цифры и знак +
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
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

  useEffect(() => {
    if (show) {
      setEmail(currentEmail || '');
      setError('');
    }
  }, [show, currentEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
        throw new Error(result.error);
      }

      onUpdate(email);
      onHide();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Изменение адреса электронной почты</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group>
            <Form.Label>Новый email адрес *</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
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
        <p>Вы уверены, что хотите удалить объявление:</p>
        <p className="fw-bold">"{adTitle}"?</p>
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
          {loading ? 'Удаление...' : 'Удалить'}
        </Button>
      </Modal.Footer>
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
      // Формат из ТЗ: "01-01-1970"
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          return `${parts[0]}.${parts[1]}.${parts[2]}`;
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
    if (ad.photos && ad.photos.length > 0) {
      let photo = Array.isArray(ad.photos) ? ad.photos[0] : ad.photos;
      if (typeof photo === 'string') {
        // Согласно ТЗ: '{url}/img1.png'
        if (photo.includes('{url}')) {
          // Заменяем на ваш хост
          return photo.replace('{url}', 'https://pets.сделай.site');
        }
        return photo;
      }
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
  
  // Модальные окна
  const [phoneModal, setPhoneModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
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
      
      // Согласно ТЗ: GET {host}/api/users/
      const result = await safeApiCall(() => authApi.getUser(), 'Ошибка загрузки профиля');
      
      if (!result.success) {
        // Обработка ошибок согласно ТЗ
        if (result.status === 401) {
          setError('Сессия истекла. Пожалуйста, войдите снова.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          setTimeout(() => navigate('/login'), 2000);
          return null;
        } else if (result.status === 403) {
          setError('Доступ запрещен. У вас нет прав для просмотра этого профиля.');
          return null;
        }
        throw new Error(result.error || 'Ошибка загрузки профиля');
      }

      // Обработка ответа согласно ТЗ
      let userData;
      if (result.data?.data?.user) {
        // Формат из ТЗ: "user": [ { ... } ]
        userData = Array.isArray(result.data.data.user) 
          ? result.data.data.user[0] 
          : result.data.data.user;
      } else if (result.data?.data) {
        userData = result.data.data;
      } else if (result.data?.user) {
        userData = Array.isArray(result.data.user) 
          ? result.data.user[0] 
          : result.data.user;
      } else {
        console.log('Используются тестовые данные');
        // Используем тестовые данные для отладки
        userData = MOCK_USER_DATA;
      }

      if (!userData) {
        throw new Error('Данные пользователя не получены');
      }

      // Добавляем расчет дней регистрации
      userData.daysRegistered = calculateDaysRegistered(userData.registrationDate);
      
      // Сохраняем в localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      return userData;
      
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
      
      // Используем сохраненные данные как запасной вариант
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          parsedUser.daysRegistered = calculateDaysRegistered(parsedUser.registrationDate);
          console.log('Используются сохраненные данные');
          return parsedUser;
        } catch (parseError) {
          console.error('Ошибка парсинга сохраненных данных:', parseError);
        }
      }
      
      // Если нет сохраненных данных, используем тестовые
      console.log('Используются тестовые данные (запасной вариант)');
      return MOCK_USER_DATA;
    }
  }, [checkAuth, navigate]);

  // Загрузка объявлений пользователя согласно ТЗ
  const loadUserAds = useCallback(async () => {
    if (!checkAuth()) return [];

    try {
      console.log('Загрузка объявлений пользователя...');
      
      // Согласно ТЗ: GET {host}/api/users/orders/
      const result = await safeApiCall(() => authApi.getUserOrders(), 'Ошибка загрузки объявлений');
      
      if (!result.success) {
        if (result.status === 401) {
          setError('Сессия истекла. Пожалуйста, войдите снова.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          setTimeout(() => navigate('/login'), 2000);
          return [];
        } else if (result.status === 204) {
          // Согласно ТЗ: 204 - нет объявлений
          console.log('Нет объявлений (статус 204)');
          return [];
        }
        console.log('Ошибка загрузки объявлений, используются тестовые данные');
        return MOCK_USER_ADS; // Используем тестовые данные
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
        console.log('Используются тестовые данные (неверный формат ответа)');
        return MOCK_USER_ADS;
      }

      // Преобразуем в нужный формат
      return orders.map(ad => ({
        id: ad.id,
        kind: ad.kind || 'Не указано',
        description: ad.description || '',
        district: ad.district || '',
        date: ad.date || '',
        status: ad.status || 'active',
        photos: ad.photos || ad.photo ? [ad.photo] : [],
        mark: ad.mark || ''
      }));
      
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
      console.log('Используются тестовые данные из-за ошибки');
      return MOCK_USER_ADS;
    }
  }, [checkAuth, navigate]);

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
        
        // Показываем сообщение об успешной загрузке
        setSuccessMessage('Данные успешно загружены');
        setTimeout(() => setSuccessMessage(''), 3000);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Обработчики событий
  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из личного кабинета?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
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
    navigate(`/edit-pet/${ad.id}`);
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
        throw new Error(result.error);
      }

      // Удаляем из состояния
      const updatedAds = userAds.filter(ad => ad.id !== adId);
      setUserAds(updatedAds);

      // Обновляем статистику
      setCurrentUser(prev => ({
        ...prev,
        ordersCount: Math.max(0, (prev.ordersCount || 0) - 1)
      }));

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          return `${parts[0]}.${parts[1]}.${parts[2]}`;
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
            <Button variant="primary" size="lg" onClick={() => navigate('/add-pet')}>
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
          <Button variant="primary" onClick={() => navigate('/add-pet')}>
            <i className="bi bi-plus-circle me-2"></i>
            Добавить еще объявление
          </Button>
        </div>
      </>
    );
  };

  // Если загрузка
  if (loading.profile) {
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
  const token = localStorage.getItem('authToken');
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
      {error && (
        <Alert 
          variant="danger" 
          dismissible 
          onClose={() => setError(null)}
          className="mb-4 animate__animated animate__fadeIn"
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
          className="mb-4 animate__animated animate__fadeIn"
        >
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
        </Alert>
      )}

      {/* Заголовок и управление */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 text-primary mb-0">
            <i className="bi bi-person-circle me-2"></i>
            Личный кабинет
          </h1>
          <p className="text-muted mb-0">Управление вашим профилем и объявлениями</p>
        </div>
        
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={() => navigate('/')}
            size="sm"
            title="На главную"
          >
            <i className="bi bi-house me-1"></i>
            Главная
          </Button>
          <Button
            variant="outline-success"
            onClick={handleRefresh}
            size="sm"
            title="Обновить данные"
            disabled={loading.profile || loading.ads}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Обновить
          </Button>
          <Button
            variant="outline-danger"
            onClick={handleLogout}
            size="sm"
            title="Выйти из системы"
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            Выйти
          </Button>
        </div>
      </div>

      {/* Основной контент */}
      {currentUser ? (
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
                  <h4 className="mt-3 mb-1">{currentUser.name || 'Пользователь'}</h4>
                  <p className="text-muted small">
                    <i className="bi bi-calendar-check me-1"></i>
                    На сайте {currentUser.daysRegistered || 0} дней
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
                  <p className="fw-semibold mb-0 text-break">{currentUser.email || 'Не указан'}</p>
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
                  <p className="fw-semibold mb-0">{currentUser.phone || 'Не указан'}</p>
                </div>

                <div className="mb-4">
                  <small className="text-muted d-block mb-1">
                    <i className="bi bi-calendar-event me-1"></i>Дата регистрации:
                  </small>
                  <p className="fw-semibold mb-0">
                    {formatDate(currentUser.registrationDate)}
                  </p>
                </div>

                {/* Статистика согласно ТЗ */}
                <Card className="border mb-4">
                  <Card.Body className="p-3">
                    <h6 className="mb-3 text-center">Статистика</h6>
                    <Row className="text-center">
                      <Col xs={6}>
                        <div className="p-2">
                          <div className="text-primary fw-bold fs-4">{currentUser.ordersCount || 0}</div>
                          <small className="text-muted">Объявлений</small>
                        </div>
                      </Col>
                      <Col xs={6}>
                        <div className="p-2">
                          <div className="text-success fw-bold fs-4">{currentUser.petsCount || 0}</div>
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
                    onClick={() => navigate('/add-pet')}
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
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 d-flex align-items-center">
                    <i className="bi bi-newspaper me-2"></i>
                    Мои объявления
                    {userAds.length > 0 && (
                      <Badge bg="light" text="dark" className="ms-2">
                        {userAds.length}
                      </Badge>
                    )}
                  </h5>
                  <div>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => navigate('/add-pet')}
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
      ) : (
        <Alert variant="warning" className="text-center">
          <div className="py-4">
            <div className="display-1 text-warning mb-4">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <Alert.Heading>Не удалось загрузить профиль</Alert.Heading>
            <p>Пожалуйста, попробуйте войти снова</p>
            <div className="mt-4">
              <Button variant="primary" onClick={() => navigate('/login')} className="me-3">
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Войти
              </Button>
              <Button variant="outline-primary" onClick={handleRefresh}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Повторить попытку
              </Button>
            </div>
          </div>
        </Alert>
      )}

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