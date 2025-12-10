import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, Badge, Alert, Image } from 'react-bootstrap';

function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = 'https://pets.сделай.site/api';

  // Функция для получения URL изображения
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://pets.сделай.site/images/default-pet.jpg';
    
    if (typeof imagePath === 'string') {
      if (imagePath.startsWith('http')) return imagePath;
      if (imagePath.startsWith('/')) return `https://pets.сделай.site${imagePath}`;
      return `https://pets.сделай.site/${imagePath}`;
    }
    
    return 'https://pets.сделай.site/images/default-pet.jpg';
  };

  // Загрузка данных пользователя
  const loadUserData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Требуется авторизация');
      setTimeout(() => navigate('/login'), 2000);
      return null;
    }

    try {
      // Загрузка профиля
      const userResponse = await fetch(`${API_URL}/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        return {
          id: userData.id || userData._id || `user-${Date.now()}`,
          name: userData.name || userData.username || 'Пользователь',
          email: userData.email || '',
          phone: userData.phone || '',
          registrationDate: userData.created_at || new Date().toISOString().split('T')[0],
          avatar: userData.avatar || ''
        };
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }

    // Если API не ответил, используем сохраненные данные
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }

    return null;
  };

  // Загрузка объявлений пользователя
  const loadUserAds = async (token) => {
    try {
      const response = await fetch(`${API_URL}/pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const ads = Array.isArray(data) ? data : (data.pets || data.data || []);
        
        return ads.slice(0, 4).map(ad => ({
          id: ad.id || Math.random(),
          title: ad.title || ad.kind || 'Объявление',
          kind: ad.kind || ad.type || 'Не указано',
          description: ad.description || 'Нет описания',
          district: ad.district || ad.location || 'Не указан',
          date: ad.created_at || ad.date || new Date().toISOString().split('T')[0],
          status: ad.status || 'active',
          image: getImageUrl(ad.photos?.[0] || ad.photo || ad.image)
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
    }

    // Демо-данные если API не ответил
    return [
      { id: 1, title: 'Найдена собака', kind: 'Собака', status: 'active', image: getImageUrl(null) },
      { id: 2, title: 'Ищет дом котенок', kind: 'Кошка', status: 'active', image: getImageUrl(null) }
    ];
  };

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Требуется авторизация');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const userData = await loadUserData();
        if (userData) {
          setCurrentUser(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
        } else {
          setError('Не удалось загрузить профиль');
        }

        const adsData = await loadUserAds(token);
        setUserAds(adsData);

      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        setError('Ошибка при загрузке профиля');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Не указана';
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch (e) {
      return dateString || 'Не указана';
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { text: 'Активно', variant: 'success' },
      'onModeration': { text: 'На модерации', variant: 'warning' },
      'found': { text: 'Найдено', variant: 'primary' },
      'published': { text: 'Опубликовано', variant: 'success' },
      'pending': { text: 'На рассмотрении', variant: 'warning' }
    };
    
    const statusInfo = statusMap[status] || { text: status || 'Неизвестно', variant: 'secondary' };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const handleImageError = (e) => {
    e.target.src = 'https://pets.сделай.site/images/default-pet.jpg';
    e.target.onerror = null;
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Загрузка профиля...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2 text-primary">
              <i className="bi bi-person-badge me-2"></i>
              Личный кабинет
            </h1>
            <div>
              <Button variant="outline-primary" onClick={() => navigate('/')} className="me-2">
                <i className="bi bi-house me-1"></i> На главную
              </Button>
              <Button variant="outline-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i> Выйти
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="info" className="mb-4">
          <p>{error}</p>
        </Alert>
      )}

      {currentUser ? (
        <div className="row">
          {/* Боковая панель профиля */}
          <div className="col-lg-4 mb-4">
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-primary text-white py-3">
                <h5 className="mb-0"><i className="bi bi-person-circle me-2"></i> Профиль</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <Image 
                    src={currentUser.avatar ? getImageUrl(currentUser.avatar) : 'https://pets.сделай.site/images/default-avatar.png'} 
                    alt="Аватар" 
                    roundedCircle 
                    fluid
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    onError={handleImageError}
                  />
                  <h4 className="text-primary mt-3 mb-2">{currentUser.name}</h4>
                </div>
                
                <div className="mb-3">
                  <strong className="text-muted"><i className="bi bi-envelope me-2"></i>Email:</strong>
                  <p className="mb-0">{currentUser.email || 'Не указан'}</p>
                </div>
                
                <div className="mb-3">
                  <strong className="text-muted"><i className="bi bi-telephone me-2"></i>Телефон:</strong>
                  <p className="mb-0">{currentUser.phone || 'Не указан'}</p>
                </div>
                
                <div className="mb-4">
                  <strong className="text-muted"><i className="bi bi-calendar-event me-2"></i>Дата регистрации:</strong>
                  <p className="mb-0">{formatDate(currentUser.registrationDate)}</p>
                </div>
                
                <div className="d-grid gap-2">
                  <Button variant="outline-primary" onClick={() => navigate('/add-pet')}>
                    <i className="bi bi-plus-circle me-2"></i> Добавить объявление
                  </Button>
                  <Button variant="outline-secondary" onClick={() => navigate('/search')}>
                    <i className="bi bi-search me-2"></i> Найти животных
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Объявления пользователя */}
          <div className="col-lg-8">
            <Card className="shadow-sm border-0">
              <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white py-3">
                <h5 className="mb-0"><i className="bi bi-newspaper me-2"></i> Мои объявления</h5>
                <Button variant="light" size="sm" onClick={() => navigate('/add-pet')}>
                  <i className="bi bi-plus-circle me-1"></i> Добавить
                </Button>
              </Card.Header>
              
              <Card.Body className="p-4">
                {userAds.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="display-1 text-muted mb-4">📝</div>
                    <h4 className="text-muted mb-3">У вас пока нет объявлений</h4>
                    <Button variant="primary" onClick={() => navigate('/add-pet')} className="mt-3">
                      <i className="bi bi-plus-circle me-2"></i> Добавить первое объявление
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="row row-cols-1 row-cols-md-2 g-4">
                      {userAds.map(ad => (
                        <div key={ad.id} className="col">
                          <Card className="h-100 shadow-sm border-0">
                            <div style={{ height: '180px', overflow: 'hidden' }}>
                              <Card.Img 
                                variant="top" 
                                src={ad.image}
                                alt={ad.title}
                                style={{ height: '100%', objectFit: 'cover' }}
                                onError={handleImageError}
                              />
                              <div className="position-absolute top-0 end-0 m-2">
                                {getStatusBadge(ad.status)}
                              </div>
                            </div>
                            <Card.Body className="d-flex flex-column">
                              <Card.Title className="h6 mb-2">{ad.title}</Card.Title>
                              <Card.Text className="small text-muted mb-2">{ad.kind}</Card.Text>
                              <Card.Text className="small text-muted flex-grow-1">
                                {ad.description?.substring(0, 100)}...
                              </Card.Text>
                              <div className="mt-auto">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <small className="text-muted">{ad.district}</small>
                                  <small className="text-muted">{formatDate(ad.date)}</small>
                                </div>
                                <Button variant="outline-primary" size="sm" onClick={() => navigate(`/pet/${ad.id}`)}>
                                  <i className="bi bi-eye me-1"></i> Подробнее
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center mt-4">
                      <Button variant="primary" onClick={() => navigate('/add-pet')}>
                        <i className="bi bi-plus-circle me-2"></i> Добавить еще объявление
                      </Button>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      ) : (
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Профиль не найден</Alert.Heading>
          <p>Не удалось загрузить данные профиля.</p>
          <Button variant="primary" onClick={() => navigate('/login')} className="mt-3">
            <i className="bi bi-box-arrow-in-right me-2"></i> Войти
          </Button>
        </Alert>
      )}
    </div>
  );
}

export default Profile;