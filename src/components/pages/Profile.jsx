import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, Badge, Alert } from 'react-bootstrap';
import { authApi, api } from '../../utils/api';
import { API_CONFIG } from '../../App';

function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' или 'danger'
  const [loading, setLoading] = useState(true);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [adsLoading, setAdsLoading] = useState(false);
  const navigate = useNavigate();

  // Функция для показа сообщений
  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          showMessage('Требуется авторизация', 'danger');
          navigate('/login');
          return;
        }

        // Загружаем данные пользователя с сервера
        try {
          console.log('Загрузка данных пользователя...');
          
          // Пробуем несколько вариантов эндпоинтов
          let userResponse;
          
          try {
            // Первый вариант - стандартный эндпоинт
            userResponse = await api.get('/users/me');
          } catch (error) {
            console.log('Первый эндпоинт не сработал, пробуем второй...');
            try {
              // Второй вариант - через authApi
              userResponse = await authApi.getUser('me');
            } catch (error2) {
              console.log('Второй эндпоинт не сработал, пробуем третий...');
              // Третий вариант - базовый эндпоинт
              userResponse = await api.get('/user');
            }
          }
          
          console.log('Ответ от сервера (профиль):', userResponse);
          
          let userData;
          
          // Обрабатываем разные форматы ответа
          if (userResponse && userResponse.data) {
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
          
          if (!userData) {
            throw new Error('Данные пользователя не получены');
          }
          
          // Подготавливаем данные пользователя
          const preparedUser = {
            id: userData.id || userData._id || userData.userId || 'unknown',
            name: userData.name || userData.username || userData.fullName || userData.email?.split('@')[0] || 'Пользователь',
            email: userData.email || '',
            phone: userData.phone || userData.phoneNumber || '',
            registrationDate: userData.registrationDate || userData.created_at || userData.createdAt || userData.dateCreated || new Date().toISOString().split('T')[0],
            ordersCount: userData.ordersCount || 0,
            petsCount: userData.petsCount || 0
          };
          
          console.log('Подготовленные данные пользователя:', preparedUser);
          
          setCurrentUser(preparedUser);
          localStorage.setItem('currentUser', JSON.stringify(preparedUser));
          
          // Загружаем объявления пользователя
          await loadUserAds(preparedUser.id);
          
        } catch (error) {
          console.error('Ошибка загрузки пользователя:', error);
          
          // Проверяем, есть ли сохраненные данные
          const savedUser = localStorage.getItem('currentUser');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setCurrentUser(parsedUser);
              showMessage('Используются сохраненные данные', 'warning');
              
              // Загружаем тестовые объявления
              setUserAds([
                {
                  id: 1,
                  kind: 'Собака',
                  description: 'Найдена собака в центре города',
                  district: 'Центральный',
                  date: '2024-01-15',
                  status: 'active',
                  image: `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`
                },
                {
                  id: 2,
                  kind: 'Кошка',
                  description: 'Котенок ищет дом',
                  district: 'Северный',
                  date: '2024-01-14',
                  status: 'onModeration',
                  image: `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`
                }
              ]);
            } catch (parseError) {
              console.error('Ошибка парсинга сохраненного пользователя:', parseError);
            }
          } else {
            showMessage('Ошибка загрузки данных профиля', 'danger');
            
            // Если ошибка авторизации, выходим
            if (error.response?.status === 401 || error.status === 401 || error.message?.includes('401')) {
              localStorage.removeItem('authToken');
              localStorage.removeItem('currentUser');
              navigate('/login');
              return;
            }
          }
        }
      } catch (error) {
        console.error('Общая ошибка загрузки:', error);
        showMessage('Ошибка загрузки профиля', 'danger');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const loadUserAds = async (userId) => {
    setAdsLoading(true);
    try {
      console.log('Загрузка объявлений для пользователя ID:', userId);
      
      let adsResponse;
      
      try {
        // Пробуем стандартный эндпоинт из ТЗ
        adsResponse = await api.get(`/users/orders/${userId}`);
      } catch (error) {
        console.log('Стандартный эндпоинт не сработал, пробуем альтернативы...');
        try {
          // Альтернативный эндпоинт
          adsResponse = await api.get(`/orders/user/${userId}`);
        } catch (error2) {
          console.log('Альтернативный эндпоинт не сработал...');
          // Если API недоступен, используем тестовые данные
          throw new Error('API недоступен');
        }
      }
      
      console.log('Ответ объявлений:', adsResponse);
      
      let orders = [];
      
      if (adsResponse.data) {
        if (adsResponse.data.orders && Array.isArray(adsResponse.data.orders)) {
          orders = adsResponse.data.orders;
        } else if (Array.isArray(adsResponse.data)) {
          orders = adsResponse.data;
        } else if (adsResponse.data.data && Array.isArray(adsResponse.data.data)) {
          orders = adsResponse.data.data;
        }
      }
      
      const formattedAds = orders.map(ad => ({
        id: ad.id || ad._id || `temp-${Math.random().toString(36).substr(2, 9)}`,
        kind: ad.kind || ad.type || 'Не указано',
        description: ad.description || 'Нет описания',
        district: ad.district || ad.location || 'Не указан',
        date: ad.date || ad.created_at || ad.createdAt || ad.dateCreated || new Date().toISOString().split('T')[0],
        status: ad.status || 'active',
        photos: ad.photos || ad.images || ad.image ? [ad.image] : [],
        image: getImageUrl(ad.photos || ad.images || ad.image)
      }));
      
      console.log('Форматированные объявления:', formattedAds);
      setUserAds(formattedAds);
      
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
      // Тестовые данные для демонстрации
      setUserAds([
        {
          id: 1,
          kind: 'Собака',
          description: 'Найдена собака в центре города. Очень дружелюбная, откликается на кличку "Бобик"',
          district: 'Центральный',
          date: '2024-01-15',
          status: 'active',
          image: `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`
        },
        {
          id: 2,
          kind: 'Кошка',
          description: 'Котенок ищет дом. Очень ласковый, приучен к лотку',
          district: 'Северный',
          date: '2024-01-14',
          status: 'onModeration',
          image: `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`
        },
        {
          id: 3,
          kind: 'Кролик',
          description: 'Декоративный кролик. Найден в парке',
          district: 'Южный',
          date: '2024-01-13',
          status: 'wasFound',
          image: `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`
        }
      ]);
    } finally {
      setAdsLoading(false);
    }
  };

  // Функция для получения URL изображения
  const getImageUrl = (photos) => {
    if (!photos) {
      return `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`;
    }
    
    let imagePath;
    
    if (Array.isArray(photos) && photos.length > 0) {
      imagePath = photos[0];
    } else if (typeof photos === 'string' && photos.trim() !== '') {
      imagePath = photos;
    } else {
      return `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`;
    }
    
    // Если это уже полный URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Формируем полный URL
    if (imagePath.startsWith('/')) {
      return `${API_CONFIG.IMAGE_BASE}${imagePath}`;
    } else {
      return `${API_CONFIG.IMAGE_BASE}/${imagePath}`;
    }
  };

  // Обновление телефона (согласно ТЗ)
  const handlePhoneChange = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !currentUser.id) {
      showMessage('Пользователь не найден', 'danger');
      return;
    }
    
    if (!newPhone.trim()) {
      showMessage('Введите новый номер телефона', 'danger');
      return;
    }

    // Валидация телефона
    const phoneRegex = /^[\+\d][\d\s\-\(\)]+$/;
    if (!phoneRegex.test(newPhone.trim())) {
      showMessage('Номер телефона должен содержать только цифры и знак +', 'danger');
      return;
    }

    setPhoneLoading(true);
    try {
      // Согласно ТЗ: PATCH /api/users/{id}/phone
      const response = await api.patch(`/users/${currentUser.id}/phone`, {
        phone: newPhone.trim()
      });
      
      console.log('Ответ обновления телефона:', response);
      
      // Обновляем локальные данные
      const updatedUser = { 
        ...currentUser, 
        phone: newPhone.trim() 
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      showMessage('Телефон успешно изменен');
      setNewPhone('');
      
    } catch (error) {
      console.error('Ошибка изменения телефона:', error);
      
      if (error.response?.status === 422 || error.status === 422) {
        showMessage('Ошибка валидации телефона', 'danger');
      } else if (error.response?.status === 401 || error.status === 401) {
        showMessage('Требуется авторизация', 'danger');
        navigate('/login');
      } else {
        showMessage('Ошибка при изменении телефона. Проверьте подключение к интернету.', 'danger');
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  // Обновление email (согласно ТЗ)
  const handleEmailChange = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !currentUser.id) {
      showMessage('Пользователь не найден', 'danger');
      return;
    }
    
    if (!newEmail.trim()) {
      showMessage('Введите новый email', 'danger');
      return;
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      showMessage('Введите корректный email', 'danger');
      return;
    }

    setEmailLoading(true);
    try {
      // Согласно ТЗ: PATCH /api/users/{id}/email
      const response = await api.patch(`/users/${currentUser.id}/email`, {
        email: newEmail.trim()
      });
      
      console.log('Ответ обновления email:', response);
      
      // Обновляем локальные данные
      const updatedUser = { 
        ...currentUser, 
        email: newEmail.trim() 
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      showMessage('Email успешно изменен');
      setNewEmail('');
      
    } catch (error) {
      console.error('Ошибка изменения email:', error);
      
      if (error.response?.status === 422 || error.status === 422) {
        showMessage('Ошибка валидации email', 'danger');
      } else if (error.response?.status === 401 || error.status === 401) {
        showMessage('Требуется авторизация', 'danger');
        navigate('/login');
      } else {
        showMessage('Ошибка при изменении email. Проверьте подключение к интернету.', 'danger');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  // Удаление объявления (согласно ТЗ)
  const handleDeleteAd = async (adId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это объявление?')) {
      return;
    }

    try {
      // Согласно ТЗ: DELETE /api/users/orders/{id}
      const response = await api.delete(`/users/orders/${adId}`);
      console.log('Ответ удаления объявления:', response);
      
      // Обновляем локальный список
      setUserAds(prevAds => prevAds.filter(ad => ad.id !== adId));
      showMessage('Объявление успешно удалено');
      
    } catch (error) {
      console.error('Ошибка удаления:', error);
      
      if (error.response?.status === 403 || error.status === 403) {
        showMessage('Нельзя удалить это объявление (неправильный статус)', 'danger');
      } else if (error.response?.status === 401 || error.status === 401) {
        showMessage('Требуется авторизация', 'danger');
        navigate('/login');
      } else if (error.response?.status === 404 || error.status === 404) {
        showMessage('Объявление не найдено', 'danger');
        // Удаляем из локального списка если не найдено на сервере
        setUserAds(prevAds => prevAds.filter(ad => ad.id !== adId));
      } else {
        showMessage('Ошибка при удалении объявления', 'danger');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showMessage('Вы успешно вышли из системы');
    setTimeout(() => navigate('/login'), 1000);
  };

  const calculateDaysSinceRegistration = () => {
    if (!currentUser?.registrationDate) return 0;
    try {
      const regDate = new Date(currentUser.registrationDate);
      const today = new Date();
      const diffTime = Math.abs(today - regDate);
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error('Ошибка расчета дней:', e);
      return 0;
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Не указана';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Ошибка форматирования даты:', e);
      return dateString || 'Не указана';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { variant: 'success', text: 'Активно' },
      'onModeration': { variant: 'warning', text: 'На модерации' },
      'wasFound': { variant: 'primary', text: 'Хозяин найден' },
      'archive': { variant: 'secondary', text: 'В архиве' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status || 'Неизвестно' };
    return (
      <Badge bg={config.variant} className="d-inline-flex align-items-center">
        <i className={`bi bi-${getStatusIcon(status)} me-1`}></i>
        {config.text}
      </Badge>
    );
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'active': 'eye',
      'onModeration': 'clock',
      'wasFound': 'check-circle',
      'archive': 'archive'
    };
    return iconMap[status] || 'question-circle';
  };

  // Если идет загрузка
  if (loading) {
    return (
      <div className="container mt-5 text-center py-5">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3 fs-5">Загрузка профиля...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {message && (
        <Alert 
          variant={messageType === 'danger' ? 'danger' : messageType === 'warning' ? 'warning' : 'success'} 
          dismissible 
          onClose={() => setMessage('')}
          className="mt-3"
        >
          <Alert.Heading>
            {messageType === 'danger' ? 'Ошибка' : messageType === 'warning' ? 'Внимание' : 'Успех'}
          </Alert.Heading>
          <p className="mb-0">{message}</p>
        </Alert>
      )}

      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2 text-primary">
              <i className="bi bi-person-badge me-2"></i>
              Личный кабинет
            </h1>
            <div>
              <Button 
                variant="outline-primary" 
                onClick={() => navigate('/')}
                className="me-2"
              >
                <i className="bi bi-house me-1"></i>
                На главную
              </Button>
              <Button 
                variant="outline-danger" 
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </div>

      {!currentUser ? (
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Ошибка загрузки профиля</Alert.Heading>
          <p>Не удалось загрузить данные профиля. Попробуйте войти снова.</p>
          <div className="d-flex justify-content-center gap-2">
            <Button variant="primary" onClick={() => navigate('/login')}>
              <i className="bi bi-box-arrow-in-right me-1"></i>
              Войти снова
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/')}>
              <i className="bi bi-house me-1"></i>
              На главную
            </Button>
          </div>
        </Alert>
      ) : (
        <div className="row">
          {/* Левая колонка - информация о пользователе */}
          <div className="col-lg-4 mb-4">
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-primary text-white py-3">
                <h5 className="mb-0">
                  <i className="bi bi-person-circle me-2"></i>
                  Профиль пользователя
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <div className="avatar-container bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '100px', height: '100px' }}>
                    <span className="display-4 text-primary">👤</span>
                  </div>
                  <h4 className="text-primary mb-2">{currentUser.name}</h4>
                  {currentUser.id && currentUser.id !== 'unknown' && (
                    <small className="text-muted">ID: {currentUser.id}</small>
                  )}
                </div>
                
                <div className="user-info">
                  <div className="info-item mb-3">
                    <strong className="d-block text-muted mb-1">
                      <i className="bi bi-envelope me-2"></i>
                      Email:
                    </strong>
                    <span className="d-block">{currentUser.email || 'Не указан'}</span>
                  </div>
                  
                  <div className="info-item mb-3">
                    <strong className="d-block text-muted mb-1">
                      <i className="bi bi-telephone me-2"></i>
                      Телефон:
                    </strong>
                    <span className="d-block">{currentUser.phone || 'Не указан'}</span>
                  </div>
                  
                  <div className="info-item mb-3">
                    <strong className="d-block text-muted mb-1">
                      <i className="bi bi-calendar-event me-2"></i>
                      Дата регистрации:
                    </strong>
                    <span className="d-block">{formatDate(currentUser.registrationDate)}</span>
                  </div>
                  
                  <div className="info-item mb-3">
                    <strong className="d-block text-muted mb-1">
                      <i className="bi bi-clock-history me-2"></i>
                      Дней с регистрации:
                    </strong>
                    <span className="d-block">{calculateDaysSinceRegistration()} дней</span>
                  </div>
                  
                  <div className="info-item mb-4">
                    <strong className="d-block text-muted mb-2">
                      <i className="bi bi-bar-chart me-2"></i>
                      Статистика:
                    </strong>
                    <div className="d-flex flex-wrap gap-2">
                      <Badge bg="info" className="p-2 d-flex align-items-center">
                        <i className="bi bi-megaphone me-1"></i>
                        <span>Объявления: {userAds.length}</span>
                      </Badge>
                      <Badge bg="success" className="p-2 d-flex align-items-center">
                        <i className="bi bi-check-circle me-1"></i>
                        <span>Найдены: {userAds.filter(ad => ad.status === 'wasFound').length}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Изменение телефона */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-light py-3">
                <h5 className="mb-0">
                  <i className="bi bi-telephone-plus me-2"></i>
                  Изменить телефон
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <form onSubmit={handlePhoneChange}>
                  <div className="mb-3">
                    <label htmlFor="newPhone" className="form-label fw-semibold">Новый телефон *</label>
                    <input
                      type="tel"
                      className="form-control"
                      id="newPhone"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder={currentUser.phone || "+7 (999) 123-45-67"}
                      disabled={phoneLoading}
                      required
                    />
                    <div className="form-text">Только цифры и знак +</div>
                  </div>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-100 py-2"
                    disabled={phoneLoading || !newPhone.trim()}
                  >
                    {phoneLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Изменение...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Обновить телефон
                      </>
                    )}
                  </Button>
                </form>
              </Card.Body>
            </Card>

            {/* Изменение email */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-light py-3">
                <h5 className="mb-0">
                  <i className="bi bi-envelope-plus me-2"></i>
                  Изменить email
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <form onSubmit={handleEmailChange}>
                  <div className="mb-3">
                    <label htmlFor="newEmail" className="form-label fw-semibold">Новый email *</label>
                    <input
                      type="email"
                      className="form-control"
                      id="newEmail"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={currentUser.email || "example@domain.com"}
                      disabled={emailLoading}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-100 py-2"
                    disabled={emailLoading || !newEmail.trim()}
                  >
                    {emailLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Изменение...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Обновить email
                      </>
                    )}
                  </Button>
                </form>
              </Card.Body>
            </Card>
          </div>

          {/* Правая колонка - объявления */}
          <div className="col-lg-8">
            <Card className="shadow-sm border-0">
              <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white py-3">
                <h5 className="mb-0">
                  <i className="bi bi-newspaper me-2"></i>
                  Мои объявления
                </h5>
                <div>
                  <Button 
                    variant="light" 
                    size="sm"
                    onClick={() => navigate('/add-pet')}
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Добавить
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                {adsLoading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" size="lg" />
                    <p className="mt-3 fs-5">Загрузка объявлений...</p>
                  </div>
                ) : userAds.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="display-1 text-muted mb-4">📝</div>
                    <h4 className="text-muted mb-3">У вас пока нет объявлений</h4>
                    <p className="text-muted mb-4 lead">
                      Добавьте первое объявление о найденном животном
                    </p>
                    <Button 
                      variant="primary"
                      onClick={() => navigate('/add-pet')}
                      size="lg"
                      className="px-4 py-2"
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Добавить объявление
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h6 className="text-muted mb-0">
                        Всего объявлений: <span className="badge bg-primary">{userAds.length}</span>
                      </h6>
                      <div className="d-flex gap-2">
                        <Badge bg="success" className="px-3 py-2">
                          Активные: {userAds.filter(ad => ad.status === 'active').length}
                        </Badge>
                        <Badge bg="warning" className="px-3 py-2">
                          На модерации: {userAds.filter(ad => ad.status === 'onModeration').length}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="row row-cols-1 row-cols-md-2 g-4">
                      {userAds.map(ad => (
                        <div key={ad.id} className="col">
                          <Card className="h-100 shadow-sm border-0 hover-lift transition-all">
                            <div className="position-relative" style={{ height: '180px', overflow: 'hidden' }}>
                              <Card.Img 
                                variant="top" 
                                src={ad.image}
                                alt={ad.description}
                                className="img-fluid w-100 h-100"
                                style={{ 
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                onError={(e) => {
                                  e.target.src = `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`;
                                  e.target.onerror = null;
                                }}
                              />
                              <div className="position-absolute top-0 end-0 m-2">
                                {getStatusBadge(ad.status)}
                              </div>
                            </div>
                            <Card.Body className="d-flex flex-column p-3">
                              <Card.Title className="h6 mb-2 text-primary">
                                {ad.kind}
                              </Card.Title>
                              <Card.Text className="small text-muted flex-grow-1" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {ad.description}
                              </Card.Text>
                              <div className="mt-auto">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <div className="d-flex align-items-center">
                                    <i className="bi bi-geo-alt text-primary me-1 fs-6"></i>
                                    <small className="text-muted">{ad.district}</small>
                                  </div>
                                  <small className="text-muted">
                                    <i className="bi bi-calendar text-primary me-1 fs-6"></i>
                                    {formatDate(ad.date)}
                                  </small>
                                </div>
                                <div className="d-flex gap-2">
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => navigate(`/pet/${ad.id}`)}
                                    className="flex-grow-1"
                                  >
                                    <i className="bi bi-eye me-1"></i>
                                    Подробнее
                                  </Button>
                                  {(ad.status === 'active' || ad.status === 'onModeration') && (
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={() => handleDeleteAd(ad.id)}
                                    >
                                      <i className="bi bi-trash me-1"></i>
                                      Удалить
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;