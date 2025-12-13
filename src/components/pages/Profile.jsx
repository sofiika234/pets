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

// Вспомогательная функция для безопасных запросов
const safeApiCall = async (apiFunction, fallbackMessage = 'Ошибка запроса') => {
  try {
    const response = await apiFunction();
    return { success: true, data: response };
  } catch (error) {
    console.error(fallbackMessage, error);
    return { 
      success: false, 
      error: error.message || fallbackMessage,
      isNetworkError: error.message?.includes('Failed to fetch') || error.message?.includes('Network Error')
    };
  }
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
      if (!phone.trim()) {
        throw new Error('Телефон обязателен для заполнения');
      }

      const cleanedPhone = phone.replace(/\s/g, '');
      if (!/^\+?[0-9]+$/.test(cleanedPhone)) {
        throw new Error('Телефон должен содержать только цифры и знак +');
      }

      const result = await safeApiCall(() => authApi.updatePhone(phone), 'Ошибка обновления телефона');
      
      if (!result.success) {
        throw new Error(result.error);
      }

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
      if (!email.trim()) {
        throw new Error('Email обязателен для заполнения');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Введите корректный email адрес');
      }

      const result = await safeApiCall(() => authApi.updateEmail(email), 'Ошибка обновления email');
      
      if (!result.success) {
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

// Карточка объявления
const PetCard = memo(({ ad, onView, onEdit, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
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

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { text: 'Активно', variant: 'success', icon: 'bi-check-circle' },
      'onModeration': { text: 'На модерации', variant: 'warning', icon: 'bi-clock' },
      'wasFound': { text: 'Хозяин найден', variant: 'primary', icon: 'bi-heart-fill' },
      'archive': { text: 'В архиве', variant: 'secondary', icon: 'bi-archive' }
    };

    const statusInfo = statusMap[status] || { text: status, variant: 'secondary', icon: 'bi-question-circle' };

    return (
      <Badge bg={statusInfo.variant} className="d-flex align-items-center gap-1">
        <i className={`bi ${statusInfo.icon}`}></i>
        {statusInfo.text}
      </Badge>
    );
  };

  const getFirstImage = () => {
    if (ad.photos && ad.photos.length > 0) {
      let photo = Array.isArray(ad.photos) ? ad.photos[0] : ad.photos;
      if (typeof photo === 'string') {
        if (photo.includes('{url}')) {
          return photo.replace('{url}', 'https://pets.сделай.site');
        }
        if (photo.startsWith('/')) {
          return `https://pets.сделай.site${photo}`;
        }
        return photo;
      }
    }
    return '/images/default-pet.png';
  };

  return (
    <Card className="h-100 shadow-sm border-0">
      <div className="position-relative" style={{ height: '200px', overflow: 'hidden', cursor: 'pointer' }}>
        {!imageLoaded && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <Spinner animation="border" size="sm" variant="secondary" />
          </div>
        )}
        <Image
          src={imageError ? '/images/default-pet.png' : getFirstImage()}
          alt={ad.description || 'Объявление о животном'}
          fluid
          style={{ height: '100%', width: '100%', objectFit: 'cover', opacity: imageLoaded ? 1 : 0 }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
        <div className="position-absolute top-0 end-0 m-2">
          {getStatusBadge(ad.status)}
        </div>
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="h6">{ad.kind || 'Животное'}</Card.Title>
        <Card.Text className="small text-muted mb-2">
          {formatDate(ad.date)}
        </Card.Text>
        <Card.Text className="small mb-3" style={{ 
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {ad.description || 'Нет описания'}
        </Card.Text>
        <div className="mt-auto d-flex justify-content-between">
          <Button variant="outline-primary" size="sm" onClick={() => onView(ad.id)}>
            <i className="bi bi-eye me-1"></i> Подробнее
          </Button>
          {(ad.status === 'active' || ad.status === 'onModeration') && (
            <div>
              <Button variant="outline-secondary" size="sm" className="me-1" onClick={() => onEdit(ad)}>
                <i className="bi bi-pencil"></i>
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => onDelete(ad.id, ad.description?.substring(0, 30))}>
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

// Основной компонент профиля
function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    // Восстановление из localStorage при инициализации
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState({ profile: false, ads: false });
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const [phoneModal, setPhoneModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, adId: null, adTitle: '' });

  // Проверка авторизации
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setApiError('Требуется авторизация');
      setTimeout(() => navigate('/login'), 1500);
      return false;
    }
    return true;
  }, [navigate]);

  // Загрузка данных пользователя с обработкой ошибок
  const loadUserData = useCallback(async (useFallback = true) => {
    if (!checkAuth()) return null;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Токен авторизации отсутствует');

      const result = await safeApiCall(() => authApi.getUser(), 'Ошибка загрузки данных пользователя');
      
      if (!result.success) {
        if (result.isNetworkError) {
          throw new Error('Ошибка соединения с сервером');
        }
        throw new Error(result.error);
      }

      if (!result.data || !result.data.data) {
        throw new Error('Неверный формат ответа сервера');
      }

      let userData;
      if (result.data.data.user) {
        userData = Array.isArray(result.data.data.user) 
          ? result.data.data.user[0] 
          : result.data.data.user;
      } else {
        userData = result.data.data;
      }

      if (!userData) {
        throw new Error('Данные пользователя не получены');
      }

      // Расчет дней регистрации
      if (userData.registrationDate) {
        try {
          const parts = userData.registrationDate.split('-');
          if (parts.length === 3) {
            const date = new Date(parts[2], parts[1] - 1, parts[0]);
            const today = new Date();
            const diffTime = Math.abs(today - date);
            userData.daysRegistered = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        } catch {
          userData.daysRegistered = 0;
        }
      }

      // Сохраняем данные
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return userData;

    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
      
      // Используем сохраненные данные как запасной вариант
      if (useFallback) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            return parsedUser;
          } catch {
            // Не удалось распарсить сохраненные данные
          }
        }
      }

      // Показываем ошибку только если не используем запасной вариант
      if (!useFallback) {
        if (error.message.includes('соединения')) {
          setApiError('Ошибка соединения с сервером. Проверьте интернет-соединение.');
        } else if (error.message.includes('Токен') || error.message.includes('401')) {
          setApiError('Сессия истекла. Пожалуйста, войдите снова.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          setTimeout(() => navigate('/login'), 1500);
        } else {
          setApiError(error.message);
        }
      }
      
      return null;
    }
  }, [checkAuth, navigate]);

  // Загрузка объявлений пользователя
  const loadUserAds = useCallback(async (useFallback = true) => {
    if (!checkAuth()) return [];

    try {
      const result = await safeApiCall(() => authApi.getUserOrders(), 'Ошибка загрузки объявлений');
      
      if (!result.success) {
        if (result.isNetworkError) {
          throw new Error('Ошибка соединения при загрузке объявлений');
        }
        throw new Error(result.error);
      }

      let orders = [];
      
      // Проверяем разные форматы ответа
      if (result.data?.status === 204 || !result.data) {
        return [];
      }
      
      if (result.data.data?.orders) {
        orders = result.data.data.orders;
      } else if (result.data.orders) {
        orders = result.data.orders;
      } else if (Array.isArray(result.data.data)) {
        orders = result.data.data;
      } else if (Array.isArray(result.data)) {
        orders = result.data;
      }

      return orders.map(ad => ({
        id: ad.id,
        kind: ad.kind || 'Не указано',
        description: ad.description || '',
        district: ad.district || '',
        date: ad.date || '',
        status: ad.status || 'active',
        photos: ad.photos || [],
        mark: ad.mark || ''
      }));

    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
      
      // Используем пустой массив как запасной вариант
      if (useFallback) {
        return [];
      }

      if (error.message.includes('соединения')) {
        setApiError('Ошибка соединения при загрузке объявлений');
      }
      
      return [];
    }
  }, [checkAuth]);

  // Загрузка всех данных
  const loadAllData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading({ profile: true, ads: true });
    }
    setApiError('');
    setSuccessMessage('');

    try {
      // Загружаем данные пользователя (пробуем получить свежие, но используем сохраненные как запасной вариант)
      const userData = await loadUserData(false);
      
      if (userData) {
        setCurrentUser(userData);
        
        // Загружаем объявления (также с запасным вариантом)
        const adsData = await loadUserAds(false);
        setUserAds(adsData);
        
        if (showLoading) {
          setSuccessMessage('Данные успешно загружены');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } else {
        // Если не удалось загрузить пользователя, используем сохраненные данные
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setCurrentUser(parsedUser);
            
            // Все равно пытаемся загрузить объявления
            const adsData = await loadUserAds(true);
            setUserAds(adsData);
          } catch {
            // Если не удалось распарсить сохраненные данные
            setApiError('Не удалось загрузить данные профиля');
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      if (!apiError) {
        setApiError('Ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
      }
    } finally {
      if (showLoading) {
        setLoading({ profile: false, ads: false });
      }
    }
  }, [loadUserData, loadUserAds, apiError]);

  // Первоначальная загрузка
  useEffect(() => {
    const init = async () => {
      // Проверяем авторизацию
      const token = localStorage.getItem('authToken');
      if (!token) {
        setApiError('Требуется авторизация');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }

      // Проверяем есть ли сохраненные данные
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setCurrentUser(parsedUser);
          
          // Показываем сохраненные данные и пытаемся обновить их в фоне
          setUserAds([]); // Очищаем объявления
          loadAllData(true);
        } catch {
          // Если сохраненные данные повреждены, загружаем все заново
          loadAllData(true);
        }
      } else {
        // Если нет сохраненных данных, загружаем все
        loadAllData(true);
      }
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Обработчики событий
  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      navigate('/login');
    }
  };

  const handleViewAd = (adId) => {
    navigate(`/pet/${adId}`);
  };

  const handleEditAd = (ad) => {
    if (ad.status !== 'active' && ad.status !== 'onModeration') {
      alert('Редактирование возможно только для объявлений со статусами "Активно" и "На модерации"');
      return;
    }
    navigate(`/edit-pet/${ad.id}`);
  };

  const handleDeleteClick = (adId, adTitle) => {
    setDeleteModal({ show: true, adId, adTitle: adTitle || 'объявление' });
  };

  const handleDeleteConfirm = async () => {
    const { adId } = deleteModal;
    
    try {
      const result = await safeApiCall(() => petsApi.deleteOrder(adId), 'Ошибка удаления объявления');
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const updatedAds = userAds.filter(ad => ad.id !== adId);
      setUserAds(updatedAds);

      setSuccessMessage('Объявление успешно удалено');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Ошибка удаления объявления:', error);
      alert(`Не удалось удалить объявление: ${error.message}`);
    } finally {
      setDeleteModal({ show: false, adId: null, adTitle: '' });
    }
  };

  const handleUpdatePhone = (newPhone) => {
    const updatedUser = { ...currentUser, phone: newPhone };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setSuccessMessage('Номер телефона успешно обновлен');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleUpdateEmail = (newEmail) => {
    const updatedUser = { ...currentUser, email: newEmail };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setSuccessMessage('Email успешно обновлен');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRefresh = () => {
    loadAllData(true);
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

  // Фильтрация объявлений
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
            <Col key={ad.id} xs={12} md={6}>
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

  // Если нет авторизации
  if (!localStorage.getItem('authToken')) {
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
      {apiError && (
        <Alert variant="danger" dismissible onClose={() => setApiError('')} className="mb-4">
          <Alert.Heading>Ошибка!</Alert.Heading>
          <p>{apiError}</p>
          {apiError.includes('соединения') && (
            <Button variant="primary" size="sm" onClick={handleRefresh} className="mt-2">
              <i className="bi bi-arrow-clockwise me-1"></i>
              Повторить попытку
            </Button>
          )}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')} className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
        </Alert>
      )}

      {/* Заголовок */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 text-primary mb-0">
            <i className="bi bi-person-circle me-2"></i>
            Личный кабинет
          </h1>
          <p className="text-muted mb-0">Управление вашим профилем и объявлениями</p>
        </div>
        
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => navigate('/')} size="sm">
            <i className="bi bi-house me-1"></i> Главная
          </Button>
          <Button variant="outline-success" onClick={handleRefresh} size="sm" disabled={loading.profile}>
            <i className="bi bi-arrow-clockwise me-1"></i> Обновить
          </Button>
          <Button variant="outline-danger" onClick={handleLogout} size="sm">
            <i className="bi bi-box-arrow-right me-1"></i> Выйти
          </Button>
        </div>
      </div>

      {/* Основной контент */}
      {currentUser ? (
        <Row>
          {/* Профиль */}
          <Col lg={4} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-primary text-white py-3">
                <h5 className="mb-0">
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
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                  />
                  <h4 className="mt-3 mb-1">{currentUser.name || 'Пользователь'}</h4>
                  <p className="text-muted small">
                    <i className="bi bi-calendar-check me-1"></i>
                    На сайте {currentUser.daysRegistered || 0} дней
                  </p>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">
                      <i className="bi bi-envelope me-2"></i>Email:
                    </span>
                    <Button variant="link" size="sm" className="p-0" onClick={() => setEmailModal(true)}>
                      <i className="bi bi-pencil"></i>
                    </Button>
                  </div>
                  <p className="mb-0 fw-semibold">{currentUser.email || 'Не указан'}</p>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">
                      <i className="bi bi-telephone me-2"></i>Телефон:
                    </span>
                    <Button variant="link" size="sm" className="p-0" onClick={() => setPhoneModal(true)}>
                      <i className="bi bi-pencil"></i>
                    </Button>
                  </div>
                  <p className="mb-0 fw-semibold">{currentUser.phone || 'Не указан'}</p>
                </div>

                <div className="mb-4">
                  <span className="text-muted d-block">Дата регистрации:</span>
                  <p className="mb-0 fw-semibold">{formatDate(currentUser.registrationDate)}</p>
                </div>

                {/* Статистика */}
                <Card className="border mb-4">
                  <Card.Body className="p-3">
                    <h6 className="mb-3 text-center">Статистика</h6>
                    <Row className="text-center">
                      <Col xs={6}>
                        <div className="p-2">
                          <div className="text-primary fw-bold fs-4">{currentUser.ordersCount || 0}</div>
                          <div className="text-muted small">Объявлений</div>
                        </div>
                      </Col>
                      <Col xs={6}>
                        <div className="p-2">
                          <div className="text-success fw-bold fs-4">{currentUser.petsCount || 0}</div>
                          <div className="text-muted small">Найдено хозяев</div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Действия */}
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={() => navigate('/add-pet')}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Добавить объявление
                  </Button>
                  <Button variant="outline-primary" onClick={() => navigate('/search')}>
                    <i className="bi bi-search me-2"></i>
                    Поиск животных
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Объявления */}
          <Col lg={8}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-primary text-white py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-newspaper me-2"></i>
                    Мои объявления
                    {userAds.length > 0 && (
                      <Badge bg="light" text="dark" className="ms-2">{userAds.length}</Badge>
                    )}
                  </h5>
                  <div>
                    <Button variant="light" size="sm" onClick={() => navigate('/add-pet')} className="me-2">
                      <i className="bi bi-plus-circle me-1"></i> Добавить
                    </Button>
                    <Button variant="outline-light" size="sm" onClick={() => navigate('/search')}>
                      <i className="bi bi-search me-1"></i> Поиск
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3 px-3 pt-3">
                  <Tab eventKey="all" title={<span>Все <Badge bg="secondary" className="ms-1">{userAds.length}</Badge></span>}>
                    <div className="p-3">{renderAdsContent(userAds, loading.ads, 'всех объявлений')}</div>
                  </Tab>
                  <Tab eventKey="active" title={<span>Активные <Badge bg="success" className="ms-1">{getAdsByStatus('active').length}</Badge></span>}>
                    <div className="p-3">{renderAdsContent(getAdsByStatus('active'), loading.ads, 'активных объявлений')}</div>
                  </Tab>
                  <Tab eventKey="moderation" title={<span>На модерации <Badge bg="warning" className="ms-1">{getAdsByStatus('onModeration').length}</Badge></span>}>
                    <div className="p-3">{renderAdsContent(getAdsByStatus('onModeration'), loading.ads, 'объявлений на модерации')}</div>
                  </Tab>
                  <Tab eventKey="found" title={<span>Хозяин найден <Badge bg="primary" className="ms-1">{getAdsByStatus('wasFound').length}</Badge></span>}>
                    <div className="p-3">{renderAdsContent(getAdsByStatus('wasFound'), loading.ads, 'объявлений с найденными хозяевами')}</div>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Загрузка профиля...</p>
        </div>
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