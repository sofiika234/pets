import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, Form, Pagination, Badge, Alert } from 'react-bootstrap';
import { api } from '../../utils/api';
import { API_CONFIG } from '../../App'; // Добавляем импорт конфигурации

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
      
      // Формируем query параметры
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
        throw new Error('API недоступен, показываем тестовые данные');
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
          setTotalPages(Math.ceil(results.length / 12));
        }
        
      } else {
        console.log('No orders in response');
        // Тестовые данные для демонстрации
        const testData = getTestData(district, kind, query);
        setSearchResults(testData);
        setTotalResults(testData.length);
        setTotalPages(Math.ceil(testData.length / 12));
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'Ошибка при выполнении поиска');
      
      // Тестовые данные при ошибке
      const testData = getTestData(searchForm.district, searchForm.kind, searchForm.query);
      setSearchResults(testData);
      setTotalResults(testData.length);
      setTotalPages(Math.ceil(testData.length / 12));
      
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
        image: `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`,
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
        image: `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`,
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
        image: `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`,
        description: 'Потерявшийся декоративный кролик',
        date: '2024-01-13',
        phone: '+7 (999) 111-22-33',
        email: 'rabbit@example.com',
        status: 'active',
        mark: 'Розовый ошейник'
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

  // Функция для получения URL изображения (ИСПРАВЛЕННАЯ)
  const getImageUrl = (photos) => {
    console.log('Getting image URL for:', photos);
    
    if (!photos) {
      console.log('No photos, using default');
      return `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`;
    }
    
    let imagePath;
    
    if (Array.isArray(photos) && photos.length > 0) {
      imagePath = photos[0];
    } else if (typeof photos === 'string') {
      imagePath = photos;
    } else {
      console.log('Invalid photo format, using default');
      return `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`;
    }
    
    console.log('Image path:', imagePath);
    
    // Если это уже полный URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('Already full URL:', imagePath);
      return imagePath;
    }
    
    // Если функция getImageUrl существует в api, используем её
    if (api.getImageUrl && typeof api.getImageUrl === 'function') {
      try {
        const url = api.getImageUrl(imagePath);
        console.log('Using api.getImageUrl:', url);
        return url;
      } catch (error) {
        console.warn('api.getImageUrl failed:', error);
      }
    }
    
    // Формируем URL вручную
    let finalUrl;
    if (imagePath.startsWith('/')) {
      finalUrl = `${API_CONFIG.IMAGE_BASE}${imagePath}`;
    } else {
      finalUrl = `${API_CONFIG.IMAGE_BASE}/${imagePath}`;
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
  const startIndex = (currentPage - 1) * 12;
  const endIndex = startIndex + 12;
  const currentResults = searchResults.slice(startIndex, endIndex);

  return (
    <div className="container mt-4 mb-5">
      <h1 className="text-center mb-4 text-primary">
        <i className="bi bi-search me-2"></i>
        Поиск животных
      </h1>
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Район</Form.Label>
                  <Form.Select
                    name="district"
                    value={searchForm.district}
                    onChange={handleInputChange}
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
                  <Form.Label>Вид животного</Form.Label>
                  <Form.Select
                    name="kind"
                    value={searchForm.kind}
                    onChange={handleInputChange}
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
                  <Form.Label>Ключевые слова</Form.Label>
                  <Form.Control
                    type="text"
                    name="query"
                    value={searchForm.query}
                    onChange={handleInputChange}
                    placeholder="Описание, клеймо..."
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="d-flex gap-2 justify-content-center mt-4">
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
                className="px-4"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Поиск...
                  </>
                ) : 'Найти'}
              </Button>
              
              <Button 
                variant="outline-secondary" 
                type="button"
                onClick={handleReset}
              >
                Сбросить
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {error && !error.includes('тестовые данные') && (
        <Alert variant="warning" className="text-center">
          {error}
        </Alert>
      )}
      
      {error && error.includes('тестовые данные') && (
        <Alert variant="info" className="text-center">
          <i className="bi bi-info-circle me-2"></i>
          API временно недоступен. Показаны тестовые данные для демонстрации.
        </Alert>
      )}
      
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Выполняется поиск...</p>
        </div>
      )}
      
      {!loading && searchResults.length > 0 && (
        <>
          <div className="mb-4">
            <h4>Найдено животных: {totalResults}</h4>
          </div>
          
          <div className="row">
            {currentResults.map(animal => (
              <div key={animal.id} className="col-md-6 col-lg-4 mb-4">
                <Card className="h-100">
                  <div style={{ height: '200px', overflow: 'hidden' }}>
                    <Card.Img 
                      variant="top" 
                      src={animal.image}
                      alt={animal.name}
                      style={{ height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        console.log('Image load error, setting default');
                        e.target.src = `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`;
                      }}
                    />
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title>{animal.name}</Card.Title>
                      <Badge bg="info">{animal.type}</Badge>
                    </div>
                    
                    <Card.Text className="flex-grow-1">
                      {animal.description}
                    </Card.Text>
                    
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <small className="text-muted">
                          <i className="bi bi-geo-alt me-1"></i>
                          {animal.district}
                        </small>
                        <small className="text-muted">
                          {formatDate(animal.date)}
                        </small>
                      </div>
                      
                      <Button 
                        variant="primary" 
                        onClick={() => navigate(`/pet/${animal.id}`)}
                        className="w-100"
                      >
                        Подробнее
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => handlePageChange(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                />
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
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
                  }
                  return null;
                })}
                
                <Pagination.Next 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => handlePageChange(totalPages)} 
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
      
      {!loading && searchResults.length === 0 && (searchForm.district || searchForm.kind || searchForm.query) && (
        <div className="text-center py-5">
          <p className="lead">По вашему запросу ничего не найдено</p>
          <p>Попробуйте изменить параметры поиска</p>
          <Button variant="outline-primary" onClick={handleReset}>
            Сбросить фильтры
          </Button>
        </div>
      )}
      
      {!loading && !searchForm.district && !searchForm.kind && !searchForm.query && searchResults.length === 0 && (
        <div className="text-center py-5">
          <p>Введите параметры для поиска животных</p>
        </div>
      )}
    </div>
  );
}

export default Search;