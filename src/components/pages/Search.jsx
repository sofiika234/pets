import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, Form, Pagination, Badge, Alert } from 'react-bootstrap';
import { api } from '../../utils/api';

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  const [searchForm, setSearchForm] = useState({
    district: '',
    kind: '',
    query: ''
  });

  // Константы для API
  const API_BASE_URL = 'https://pets.сделай.site/api';
  const IMAGE_BASE_URL = 'https://pets.сделай.site';

  useEffect(() => {
    const district = searchParams.get('district') || '';
    const kind = searchParams.get('kind') || '';
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    
    setSearchForm({
      district,
      kind,
      query
    });
    setCurrentPage(page);
    
    // Запускаем поиск при любых параметрах
    performSearch(district, kind, query, page);
  }, [searchParams]);

  const performSearch = async (district, kind, query, page = 1) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Starting search with params:', { district, kind, query, page });
      
      // Формируем query параметры согласно ТЗ
      const params = new URLSearchParams();
      if (district) params.append('district', district);
      if (kind) params.append('kind', kind);
      if (query) params.append('query', query);
      if (page > 1) params.append('page', page);
      
      let endpoint = '/search/order';
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      console.log('API endpoint:', endpoint);
      
      // Пробуем загрузить данные с API
      let response;
      try {
        response = await api.get(endpoint);
        console.log('API response:', response);
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // Если API не работает, используем тестовые данные
        setError('API временно недоступен, показываем тестовые данные');
        const testData = getTestData(district, kind, query);
        setSearchResults(testData);
        setTotalResults(testData.length);
        setTotalPages(Math.max(1, Math.ceil(testData.length / 12)));
        return;
      }
      
      if (response && response.data?.orders) {
        const results = response.data.orders.map(order => {
          console.log('Processing order:', order);
          
          return {
            id: order.id || order._id || Math.random(),
            name: order.kind || order.type || 'Животное',
            type: order.kind || order.type || 'Неизвестно',
            district: order.district || order.location || 'Не указан',
            image: getImageUrl(order.photos || order.photo || order.image),
            description: order.description || 'Нет описания',
            date: order.date || order.created_at || order.createdAt || new Date().toISOString().split('T')[0],
            phone: order.phone || 'Не указан',
            email: order.email || 'Не указан',
            status: order.status || 'active',
            mark: order.mark || order.tag || ''
          };
        });
        
        console.log('Processed results:', results);
        setSearchResults(results);
        setTotalResults(results.length);
        
        // Серверная пагинация (если есть в ответе)
        if (response.data.totalPages) {
          setTotalPages(response.data.totalPages);
        } else {
          // Клиентская пагинация
          setTotalPages(Math.max(1, Math.ceil(results.length / 12)));
        }
        
      } else if (response && response.data?.pets) {
        // Альтернативный формат ответа
        const results = response.data.pets.map(pet => {
          return {
            id: pet.id || Math.random(),
            name: pet.kind || 'Животное',
            type: pet.kind || 'Неизвестно',
            district: pet.district || 'Не указан',
            image: getImageUrl(pet.photos || pet.photo),
            description: pet.description || 'Нет описания',
            date: pet.date || new Date().toISOString().split('T')[0],
            phone: pet.phone || 'Не указан',
            email: pet.email || 'Не указан',
            status: 'active',
            mark: pet.mark || ''
          };
        });
        
        setSearchResults(results);
        setTotalResults(results.length);
        setTotalPages(Math.max(1, Math.ceil(results.length / 12)));
        
      } else {
        console.log('No orders in response, using test data');
        const testData = getTestData(district, kind, query);
        setSearchResults(testData);
        setTotalResults(testData.length);
        setTotalPages(Math.max(1, Math.ceil(testData.length / 12)));
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'Ошибка при выполнении поиска');
      
      // Тестовые данные при ошибке
      const testData = getTestData(searchForm.district, searchForm.kind, searchForm.query);
      setSearchResults(testData);
      setTotalResults(testData.length);
      setTotalPages(Math.max(1, Math.ceil(testData.length / 12)));
      
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения тестовых данных
  const getTestData = (district, kind, query) => {
    const allTestData = [
      {
        id: 1,
        name: 'Собака',
        type: 'Собака',
        district: 'Центральный',
        image: '/images/default-pet.png',
        description: 'Найдена дружелюбная собака в центре города',
        date: '2024-01-15',
        phone: '+7 (999) 123-45-67',
        email: 'finder@example.com',
        status: 'active',
        mark: 'Ошейник с именем "Бобик"'
      },
      {
        id: 2,
        name: 'Кошка',
        type: 'Кошка',
        district: 'Северный',
        image: '/images/default-pet.png',
        description: 'Котенок ищет дом, очень ласковый',
        date: '2024-01-14',
        phone: '+7 (999) 987-65-43',
        email: 'catlover@example.com',
        status: 'active',
        mark: ''
      },
      {
        id: 3,
        name: 'Кролик',
        type: 'Кролик',
        district: 'Южный',
        image: '/images/default-pet.png',
        description: 'Потерявшийся декоративный кролик',
        date: '2024-01-13',
        phone: '+7 (999) 111-22-33',
        email: 'rabbit@example.com',
        status: 'active',
        mark: 'Розовый ошейник'
      },
      {
        id: 4,
        name: 'Собака',
        type: 'Собака',
        district: 'Западный',
        image: '/images/default-pet.png',
        description: 'Найдена собака породы хаски',
        date: '2024-01-12',
        phone: '+7 (999) 444-55-66',
        email: 'husky@example.com',
        status: 'active',
        mark: 'Синий ошейник'
      },
      {
        id: 5,
        name: 'Кошка',
        type: 'Кошка',
        district: 'Восточный',
        image: '/images/default-pet.png',
        description: 'Найдена кошка сфинкс',
        date: '2024-01-11',
        phone: '+7 (999) 777-88-99',
        email: 'sphynx@example.com',
        status: 'active',
        mark: 'Клеймо Х123'
      },
      {
        id: 6,
        name: 'Попугай',
        type: 'Попугай',
        district: 'Василеостровский',
        image: '/images/default-pet.png',
        description: 'Найден говорящий попугай',
        date: '2024-01-10',
        phone: '+7 (999) 222-33-44',
        email: 'bird@example.com',
        status: 'active',
        mark: 'Клетка с инициалами'
      }
    ];
    
    // Фильтруем тестовые данные по параметрам
    return allTestData.filter(pet => {
      if (district && pet.district !== district) return false;
      if (kind && pet.type !== kind) return false;
      if (query) {
        const searchLower = query.toLowerCase();
        return (
          pet.description.toLowerCase().includes(searchLower) ||
          pet.name.toLowerCase().includes(searchLower) ||
          (pet.mark && pet.mark.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  };

  // Функция для получения URL изображения
  const getImageUrl = (photos) => {
    console.log('Getting image URL for:', photos);
    
    if (!photos) {
      console.log('No photos, using default');
      return `${IMAGE_BASE_URL}/images/default-pet.png`;
    }
    
    let imagePath;
    
    if (Array.isArray(photos) && photos.length > 0) {
      imagePath = photos[0];
    } else if (typeof photos === 'string') {
      imagePath = photos;
    } else {
      console.log('Invalid photo format, using default');
      return `${IMAGE_BASE_URL}/images/default-pet.png`;
    }
    
    console.log('Image path:', imagePath);
    
    // Если это уже полный URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('Already full URL:', imagePath);
      return imagePath;
    }
    
    // Если есть переменная {url}
    if (imagePath.includes('{url}')) {
      return imagePath.replace('{url}', IMAGE_BASE_URL);
    }
    
    // Формируем URL вручную
    let finalUrl;
    if (imagePath.startsWith('/')) {
      finalUrl = `${IMAGE_BASE_URL}${imagePath}`;
    } else {
      finalUrl = `${IMAGE_BASE_URL}/${imagePath}`;
    }
    
    console.log('Manual URL:', finalUrl);
    return finalUrl;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (searchForm.district) params.append('district', searchForm.district);
    if (searchForm.kind) params.append('kind', searchForm.kind);
    if (searchForm.query) params.append('q', searchForm.query);
    
    setSearchParams(params);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchForm({ district: '', kind: '', query: '' });
    setSearchParams({});
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Не указана';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    } catch (e) {
      return dateString;
    }
  };

  const districts = [
    'Центральный', 'Северный', 'Южный', 'Западный', 'Восточный',
    'Василеостровский', 'Адмиралтейский', 'Кировский', 'Московский'
  ];

  const animalTypes = [
    'Собака', 'Кошка', 'Кролик', 'Хомяк', 'Попугай',
    'Крыса', 'Морская свинка', 'Черепаха', 'Другое'
  ];

  // Рассчитываем отображаемые результаты для текущей страницы
  const itemsPerPage = 12;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = searchResults.slice(startIndex, endIndex);
  const totalPagesCount = Math.max(1, Math.ceil(searchResults.length / itemsPerPage));

  // Функция обработки ошибки загрузки изображения
  const handleImageError = (e) => {
    console.warn('Image failed to load:', e.target.src);
    e.target.onerror = null;
    e.target.src = `${IMAGE_BASE_URL}/images/default-pet.png`;
  };

  return (
    <div className="container mt-4 mb-5">
      <h1 className="text-center mb-4 text-primary">
        <i className="bi bi-search me-2"></i>
        Поиск животных
      </h1>
      
      <Card className="mb-4 shadow-sm border-0">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-filter me-2"></i>
            Параметры поиска
          </h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-geo-alt me-2 text-primary"></i>
                    Район
                  </Form.Label>
                  <Form.Select
                    name="district"
                    value={searchForm.district}
                    onChange={handleInputChange}
                    className="py-2"
                  >
                    <option value="">Все районы</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-paw me-2 text-primary"></i>
                    Вид животного
                  </Form.Label>
                  <Form.Select
                    name="kind"
                    value={searchForm.kind}
                    onChange={handleInputChange}
                    className="py-2"
                  >
                    <option value="">Все виды</option>
                    {animalTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-search me-2 text-primary"></i>
                    Ключевые слова
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="query"
                    value={searchForm.query}
                    onChange={handleInputChange}
                    placeholder="Описание, клеймо..."
                    className="py-2"
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="d-flex gap-2 justify-content-center mt-4">
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
                className="px-4 py-2"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Поиск...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    Найти
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline-secondary" 
                type="button"
                onClick={handleReset}
                className="px-4 py-2"
              >
                <i className="bi bi-x-circle me-2"></i>
                Сбросить
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {error && (
        <Alert variant={error.includes('тестовые данные') ? 'info' : 'warning'} className="text-center">
          <i className={`bi ${error.includes('тестовые данные') ? 'bi-info-circle' : 'bi-exclamation-triangle'} me-2`}></i>
          {error}
        </Alert>
      )}
      
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 fs-5">Выполняется поиск...</p>
        </div>
      )}
      
      {!loading && searchResults.length > 0 && (
        <>
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="text-primary">
                <i className="bi bi-list me-2"></i>
                Найдено животных: <span className="badge bg-primary ms-2">{totalResults}</span>
              </h4>
              <Button 
                variant="outline-primary" 
                onClick={() => navigate('/add-pet')}
                size="sm"
              >
                <i className="bi bi-plus-circle me-2"></i>
                Добавить объявление
              </Button>
            </div>
          </div>
          
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {currentResults.map(animal => (
              <div key={animal.id} className="col">
                <Card className="h-100 shadow-sm border-0 hover-shadow">
                  <div 
                    style={{ 
                      height: '200px', 
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/pet/${animal.id}`)}
                  >
                    <Card.Img 
                      variant="top" 
                      src={animal.image}
                      alt={animal.name}
                      style={{ 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onError={handleImageError}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                    <div className="position-absolute top-0 end-0 m-2">
                      <Badge bg="success">
                        <i className="bi bi-paw me-1"></i>
                        {animal.type}
                      </Badge>
                    </div>
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="h5 mb-2">
                      {animal.name}
                    </Card.Title>
                    
                    <Card.Text className="flex-grow-1 small text-muted mb-3">
                      {animal.description.length > 100 
                        ? `${animal.description.substring(0, 100)}...` 
                        : animal.description}
                    </Card.Text>
                    
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <small className="text-muted">
                          <i className="bi bi-geo-alt me-1"></i>
                          {animal.district}
                        </small>
                        <small className="text-muted">
                          <i className="bi bi-calendar me-1"></i>
                          {formatDate(animal.date)}
                        </small>
                      </div>
                      
                      <Button 
                        variant="primary" 
                        onClick={() => navigate(`/pet/${animal.id}`)}
                        className="w-100 py-2"
                      >
                        <i className="bi bi-eye me-2"></i>
                        Подробнее
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
          
          {totalPagesCount > 1 && (
            <div className="d-flex justify-content-center mt-5">
              <Pagination>
                <Pagination.First 
                  onClick={() => handlePageChange(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                />
                
                {[...Array(totalPagesCount)].map((_, index) => {
                  const pageNum = index + 1;
                  // Показываем только первые, последние и рядом с текущей
                  if (
                    pageNum === 1 ||
                    pageNum === totalPagesCount ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    // Показываем многоточие
                    return <Pagination.Ellipsis key={`ellipsis-${pageNum}`} disabled />;
                  }
                  return null;
                })}
                
                <Pagination.Next 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPagesCount}
                />
                <Pagination.Last 
                  onClick={() => handlePageChange(totalPagesCount)} 
                  disabled={currentPage === totalPagesCount}
                />
              </Pagination>
              
              <div className="ms-3 d-flex align-items-center">
                <span className="text-muted">
                  Страница {currentPage} из {totalPagesCount}
                </span>
              </div>
            </div>
          )}
        </>
      )}
      
      {!loading && searchResults.length === 0 && (searchForm.district || searchForm.kind || searchForm.query) && (
        <div className="text-center py-5">
          <div className="display-1 mb-4 text-muted">
            <i className="bi bi-search"></i>
          </div>
          <p className="lead">По вашему запросу ничего не найдено</p>
          <p className="text-muted mb-4">Попробуйте изменить параметры поиска</p>
          <Button variant="outline-primary" onClick={handleReset} className="px-4 py-2">
            <i className="bi bi-x-circle me-2"></i>
            Сбросить фильтры
          </Button>
        </div>
      )}
      
      {!loading && !searchForm.district && !searchForm.kind && !searchForm.query && searchResults.length === 0 && (
        <div className="text-center py-5">
          <div className="display-1 mb-4 text-muted">
            <i className="bi bi-search-heart"></i>
          </div>
          <p className="lead">Введите параметры для поиска животных</p>
          <p className="text-muted">Используйте фильтры выше, чтобы найти потерянных питомцев</p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/add-pet')}
            className="mt-3 px-4 py-2"
          >
            <i className="bi bi-plus-circle me-2"></i>
            Добавить объявление о найденном животном
          </Button>
        </div>
      )}
    </div>
  );
}

export default Search;