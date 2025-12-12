// src/components/pages/Profile.jsx
import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, Badge, Alert, Image, Placeholder } from 'react-bootstrap';
import { authApi, petsApi } from '../../utils/api';

// Оптимизированный компонент карточки с React.memo
const PetCard = memo(({ ad, onView, onEdit, onDelete, getImageUrl }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => setImageError(true);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
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

  return (
    <Card className="h-100 shadow-sm border-0 hover-shadow pet-card">
      <div 
        className="position-relative image-container" 
        style={{ 
          height: '200px', 
          overflow: 'hidden',
          cursor: 'pointer',
          backgroundColor: '#f8f9fa'
        }}
        onClick={() => onView(ad.id)}
      >
        {!imageLoaded && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <Spinner animation="border" size="sm" variant="secondary" />
          </div>
        )}
        
        <Image
          src={imageError ? getImageUrl('/images/default-pet.jpg') : getImageUrl(ad.image)}
          alt={ad.title}
          fluid
          style={{ 
            height: '100%', 
            width: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            opacity: imageLoaded ? 1 : 0,
            position: 'absolute',
            top: 0,
            left: 0
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
        />
        
        <div className="position-absolute top-0 end-0 m-2">
          {getStatusBadge(ad.status)}
        </div>
        
        <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-50 text-white p-2">
          <small className="d-flex align-items-center">
            <i className="bi bi-geo-alt me-1"></i>
            {ad.district}
          </small>
        </div>
      </div>
      
      <Card.Body className="d-flex flex-column">
        <Card.Title className="h6 mb-2 text-truncate" title={ad.title}>
          {ad.title}
        </Card.Title>
        
        <div className="mb-2">
          <Badge bg="info" className="me-1">
            <i className="bi bi-tag me-1"></i>
            {ad.kind}
          </Badge>
          <small className="text-muted">
            <i className="bi bi-calendar me-1"></i>
            {formatDate(ad.date)}
          </small>
        </div>
        
        <Card.Text className="small text-muted mb-3 text-truncate-2" style={{ 
          WebkitLineClamp: 2,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {ad.description}
        </Card.Text>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => onView(ad.id)}
            >
              <i className="bi bi-eye me-1"></i> Подробнее
            </Button>
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="me-1"
                onClick={() => onEdit(ad.id)}
              >
                <i className="bi bi-pencil"></i>
              </Button>
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(ad.id, ad.title);
                }}
              >
                <i className="bi bi-trash"></i>
              </Button>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
});

PetCard.displayName = 'PetCard';

// Основной компонент профиля
function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState({ profile: true, ads: true });
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    daysRegistered: 0,
    ordersCount: 0,
    petsCount: 0
  });

  // Константа API URL
  const API_URL = 'https://pets.сделай.site/api';
  const IMAGE_BASE_URL = 'https://pets.сделай.site';

  // Мемоизированная функция для получения URL изображения
  const getImageUrl = useCallback((imagePath) => {
    if (!imagePath) return `${IMAGE_BASE_URL}/images/default-pet.jpg`;
    
    if (typeof imagePath === 'string') {
      if (imagePath.startsWith('http')) return imagePath;
      if (imagePath.includes('{url}')) return imagePath.replace('{url}', IMAGE_BASE_URL);
      if (imagePath.startsWith('/')) return `${IMAGE_BASE_URL}${imagePath}`;
      return `${IMAGE_BASE_URL}/${imagePath}`;
    }
    
    return `${IMAGE_BASE_URL}/images/default-pet.jpg`;
  }, [IMAGE_BASE_URL]);

  // Расчет количества дней с регистрации
  const calculateDaysRegistered = useCallback((registrationDate) => {
    if (!registrationDate) return 0;
    try {
      const regDate = new Date(registrationDate);
      const today = new Date();
      const diffTime = Math.abs(today - regDate);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }, []);

  // Загрузка данных пользователя
  const loadUserData = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Требуется авторизация');
    }

    try {
      // Пробуем получить данные через API
      let userData = null;
      try {
        // Пробуем эндпоинт для текущего пользователя
        const response = await authApi.getUser('me');
        if (response?.data?.user?.[0]) {
          userData = response.data.user[0];
        } else if (response?.data) {
          userData = response.data;
        }
      } catch (apiError) {
        console.log('API не сработал, пробуем localStorage:', apiError);
      }

      // Если не удалось через API, используем localStorage
      if (!userData) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          userData = JSON.parse(savedUser);
        }
      }

      // Демо-данные для тестирования
      if (!userData) {
        userData = {
          id: 1,
          name: 'Иван Иванов',
          email: 'user@example.com',
          phone: '+79111234567',
          registrationDate: '2023-01-01',
          ordersCount: 4,
          petsCount: 2
        };
      }

      return userData;
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      throw error;
    }
  }, []);

  // Загрузка объявлений пользователя с оптимизацией
  const loadUserAds = useCallback(async (userId) => {
    try {
      let adsData = [];
      
      // Пробуем получить через API
      try {
        const response = await petsApi.getUserOrders(userId);
        
        if (response?.data?.orders) {
          adsData = response.data.orders.slice(0, 6).map((ad, index) => ({
            id: ad.id || ad._id || `demo-${index}`,
            title: ad.description ? 
              (ad.description.length > 30 ? ad.description.substring(0, 30) + '...' : ad.description) 
              : 'Объявление',
            kind: ad.kind || 'Не указано',
            description: ad.description || 'Нет описания',
            district: ad.district || 'Не указан',
            date: ad.date || ad.created_at || new Date().toISOString().split('T')[0],
            status: ad.status || 'active',
            image: Array.isArray(ad.photos) && ad.photos.length > 0 ? ad.photos[0] : 
                   ad.photo || ad.image || null
          }));
        }
      } catch (apiError) {
        console.log('Не удалось получить объявления через API:', apiError);
      }

      // Демо-данные
      if (adsData.length === 0) {
        const demoImages = [
          '/images/pets/dog1.jpg',
          '/images/pets/cat1.jpg',
          '/images/pets/rabbit1.jpg',
          '/images/pets/bird1.jpg'
        ];
        
        adsData = [
          { 
            id: 'demo-1', 
            title: 'Найдена собака породы хаски', 
            kind: 'Собака', 
            status: 'active', 
            image: demoImages[0],
            description: 'Найдена собака породы хаски в Центральном районе',
            district: 'Центральный',
            date: '2023-10-15'
          },
          { 
            id: 'demo-2', 
            title: 'Ищет дом котенок', 
            kind: 'Кошка', 
            status: 'onModeration', 
            image: demoImages[1],
            description: 'Маленький котенок ищет дом',
            district: 'Василеостровский',
            date: '2023-10-10'
          },
          { 
            id: 'demo-3', 
            title: 'Найден попугай', 
            kind: 'Попугай', 
            status: 'wasFound', 
            image: demoImages[3],
            description: 'Найден говорящий попугай',
            district: 'Адмиралтейский',
            date: '2023-09-28'
          },
          { 
            id: 'demo-4', 
            title: 'Потерялся кролик', 
            kind: 'Кролик', 
            status: 'archive', 
            image: demoImages[2],
            description: 'Потерялся декоративный кролик',
            district: 'Кировский',
            date: '2023-09-15'
          }
        ];
      }

      return adsData;
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
      return [];
    }
  }, []);

  // Основная загрузка данных
  useEffect(() => {
    let mounted = true;

    const loadProfileData = async () => {
      setLoading({ profile: true, ads: true });
      setError('');

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Требуется авторизация');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Загружаем данные пользователя
        const userData = await loadUserData();
        if (mounted && userData) {
          setCurrentUser(userData);
          
          // Сохраняем в localStorage
          localStorage.setItem('currentUser', JSON.stringify(userData));
          
          // Рассчитываем статистику
          const daysRegistered = calculateDaysRegistered(userData.registrationDate);
          setStats({
            daysRegistered,
            ordersCount: userData.ordersCount || 0,
            petsCount: userData.petsCount || 0
          });
          
          setLoading(prev => ({ ...prev, profile: false }));

          // Загружаем объявления пользователя
          const adsData = await loadUserAds(userData.id);
          if (mounted) {
            setUserAds(adsData);
            setLoading(prev => ({ ...prev, ads: false }));
          }
        }

      } catch (error) {
        if (mounted) {
          console.error('Ошибка загрузки профиля:', error);
          setError(error.message || 'Ошибка при загрузке профиля');
          setLoading({ profile: false, ads: false });
        }
      }
    };

    loadProfileData();

    return () => {
      mounted = false;
    };
  }, [navigate, loadUserData, calculateDaysRegistered, loadUserAds]);

  // Обработчики событий
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleViewAd = (adId) => {
    navigate(`/pet/${adId}`);
  };

  const handleEditAd = (adId) => {
    navigate(`/edit-pet/${adId}`);
  };

  const handleDeleteAd = async (adId, adTitle) => {
    if (window.confirm(`Вы уверены, что хотите удалить объявление "${adTitle}"?`)) {
      try {
        // API вызов для удаления
        await petsApi.deletePet(adId);
        
        // Обновляем локальное состояние
        setUserAds(prev => prev.filter(ad => ad.id !== adId));
        
        // Показываем уведомление
        alert('Объявление успешно удалено');
      } catch (error) {
        console.error('Ошибка удаления объявления:', error);
        alert('Не удалось удалить объявление');
      }
    }
  };

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Не указана';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }, []);

  // Скелетон для загрузки
  const renderSkeleton = () => (
    <>
      <div className="row">
        <div className="col-lg-4 mb-4">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-light">
              <Placeholder as={Card.Title} animation="glow">
                <Placeholder xs={6} />
              </Placeholder>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-4">
                <Placeholder as={Image} roundedCircle animation="glow" style={{ width: '100px', height: '100px' }} />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="mb-3">
                  <Placeholder animation="glow">
                    <Placeholder xs={12} />
                  </Placeholder>
                </div>
              ))}
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-lg-8">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-light">
              <Placeholder as={Card.Title} animation="glow">
                <Placeholder xs={8} />
              </Placeholder>
            </Card.Header>
            <Card.Body>
              <div className="row row-cols-1 row-cols-md-2 g-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="col">
                    <Card className="h-100">
                      <Placeholder as={Card.Img} animation="glow" style={{ height: '200px' }} />
                      <Card.Body>
                        <Placeholder as={Card.Title} animation="glow">
                          <Placeholder xs={8} />
                        </Placeholder>
                        <Placeholder as={Card.Text} animation="glow">
                          <Placeholder xs={12} />
                        </Placeholder>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </>
  );

  if (loading.profile && loading.ads) {
    return (
      <div className="container mt-4 mb-5">
        {renderSkeleton()}
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
              <Button 
                variant="outline-primary" 
                onClick={() => navigate('/')} 
                className="me-2"
                size="sm"
              >
                <i className="bi bi-house me-1"></i> На главную
              </Button>
              <Button 
                variant="outline-danger" 
                onClick={handleLogout}
                size="sm"
              >
                <i className="bi bi-box-arrow-right me-1"></i> Выйти
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="warning" className="mb-4" dismissible onClose={() => setError('')}>
          <Alert.Heading>Ошибка!</Alert.Heading>
          <p>{error}</p>
          <div className="mt-3">
            <Button variant="primary" onClick={() => window.location.reload()} size="sm">
              <i className="bi bi-arrow-clockwise me-2"></i> Обновить
            </Button>
          </div>
        </Alert>
      )}

      {currentUser ? (
        <div className="row">
          {/* Боковая панель профиля */}
          <div className="col-lg-4 mb-4">
            <Card className="mb-4 shadow-sm border-0 profile-card">
              <Card.Header className="bg-primary text-white py-3">
                <h5 className="mb-0">
                  <i className="bi bi-person-circle me-2"></i> Профиль
                </h5>
              </Card.Header>
              
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <div className="position-relative d-inline-block">
                    <Image 
                      src={getImageUrl(currentUser.avatar || '/images/default-avatar.png')}
                      alt="Аватар" 
                      roundedCircle 
                      fluid
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        objectFit: 'cover',
                        border: '3px solid #0d6efd'
                      }}
                      loading="lazy"
                    />
                    <div className="position-absolute bottom-0 end-0 bg-success rounded-circle p-1 border border-white">
                      <i className="bi bi-check text-white"></i>
                    </div>
                  </div>
                  <h4 className="text-primary mt-3 mb-2">{currentUser.name}</h4>
                  <p className="text-muted small">
                    <i className="bi bi-calendar-check me-1"></i>
                    На сайте {stats.daysRegistered} {stats.daysRegistered === 1 ? 'день' : 
                    stats.daysRegistered < 5 ? 'дня' : 'дней'}
                  </p>
                </div>
                
                <div className="mb-3">
                  <label className="text-muted small mb-1 d-block">
                    <i className="bi bi-envelope me-2"></i>Email:
                  </label>
                  <p className="mb-0 fw-semibold text-truncate">{currentUser.email || 'Не указан'}</p>
                </div>
                
                <div className="mb-3">
                  <label className="text-muted small mb-1 d-block">
                    <i className="bi bi-telephone me-2"></i>Телефон:
                  </label>
                  <p className="mb-0 fw-semibold">{currentUser.phone || 'Не указан'}</p>
                </div>
                
                <div className="mb-4">
                  <label className="text-muted small mb-1 d-block">
                    <i className="bi bi-calendar-event me-2"></i>Дата регистрации:
                  </label>
                  <p className="mb-0 fw-semibold">{formatDate(currentUser.registrationDate)}</p>
                </div>
                
                {/* Статистика */}
                <div className="row g-2 mb-4">
                  <div className="col-6">
                    <div className="bg-light rounded p-3 text-center">
                      <div className="text-primary fw-bold fs-4">{stats.ordersCount}</div>
                      <div className="text-muted small">Объявлений</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded p-3 text-center">
                      <div className="text-success fw-bold fs-4">{stats.petsCount}</div>
                      <div className="text-muted small">Найдено хозяев</div>
                    </div>
                  </div>
                </div>
                
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={() => navigate('/add-pet')}>
                    <i className="bi bi-plus-circle me-2"></i> Добавить объявление
                  </Button>
                  <Button variant="outline-primary" onClick={() => navigate('/search')}>
                    <i className="bi bi-search me-2"></i> Найти животных
                  </Button>
                  <Button variant="outline-secondary" onClick={() => navigate('/profile/edit')}>
                    <i className="bi bi-pencil me-2"></i> Редактировать профиль
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Объявления пользователя */}
          <div className="col-lg-8">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white py-3">
                <h5 className="mb-0">
                  <i className="bi bi-newspaper me-2"></i> Мои объявления
                  {!loading.ads && userAds.length > 0 && (
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
              </Card.Header>
              
              <Card.Body className="p-4">
                {loading.ads ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Загрузка объявлений...</p>
                  </div>
                ) : userAds.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="display-1 text-muted mb-4">
                      <i className="bi bi-newspaper"></i>
                    </div>
                    <h4 className="text-muted mb-3">У вас пока нет объявлений</h4>
                    <p className="text-muted mb-4">Добавьте первое объявление о найденном животном</p>
                    <Button variant="primary" onClick={() => navigate('/add-pet')} size="lg">
                      <i className="bi bi-plus-circle me-2"></i> Добавить объявление
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="row row-cols-1 row-cols-md-2 g-4">
                      {userAds.map(ad => (
                        <div key={ad.id} className="col">
                          <PetCard
                            ad={ad}
                            onView={handleViewAd}
                            onEdit={handleEditAd}
                            onDelete={handleDeleteAd}
                            getImageUrl={getImageUrl}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {userAds.length > 4 && (
                      <div className="text-center mt-4">
                        <Button variant="outline-primary" onClick={() => navigate('/my-ads')}>
                          <i className="bi bi-list me-2"></i> Показать все объявления
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-center mt-4 pt-3 border-top">
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
          <p>Не удалось загрузить данные профиля. Возможно, срок вашей сессии истек.</p>
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/login')} className="me-2">
              <i className="bi bi-box-arrow-in-right me-2"></i> Войти
            </Button>
            <Button variant="outline-primary" onClick={() => navigate('/register')}>
              <i className="bi bi-person-plus me-2"></i> Зарегистрироваться
            </Button>
          </div>
        </Alert>
      )}
    </div>
  );
}

export default Profile;