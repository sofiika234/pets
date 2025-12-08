import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../App';

function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Загружаем данные пользователя из localStorage
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Функция для поиска животных через API
  const searchAnimals = useCallback(async (query) => {
    if (!query || query.length < 3) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/search?query=${encodeURIComponent(query)}`);
      
      if (response.status === 204) {
        // Нет результатов
        setSearchResults([]);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.orders) {
          // Преобразуем данные API в нужный формат
          const formattedResults = data.data.orders.slice(0, 5).map(order => ({
            id: order.id,
            name: order.kind || 'Без имени',
            type: order.kind || 'Неизвестно',
            district: order.district || 'Не указан',
            image: order.photos ? (typeof order.photos === 'string' ? order.photos : order.photos[0]) : null,
            description: order.description || 'Нет описания',
            date: order.date
          }));
          setSearchResults(formattedResults);
        }
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowSearchResults(false);
      setSearchTerm('');
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Очищаем предыдущий таймер
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    if (value.length >= 3) {
      // Устанавливаем новый таймер для debounce (1000ms как в ТЗ)
      const timer = setTimeout(() => {
        searchAnimals(value);
        setShowSearchResults(true);
      }, 1000);
      
      setDebounceTimer(timer);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  // Получение URL изображения
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/default-pet.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_CONFIG.IMAGE_BASE}${imagePath}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    navigate('/main');
  };

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <Link className="navbar-brand" to="/main">
            <div className="logo">
              <span className="logo-icon">🐾</span>
            </div>
            Найди друга
          </Link>
          
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/search">Поиск животных</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/add-pet">Добавить объявление</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/profile">Личный кабинет</Link>
              </li>
            </ul>
            
            {/* Поиск в навигации */}
            <div className="navbar-search me-3 position-relative">
              <form onSubmit={handleSearch} className="input-group input-group-sm">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Поиск по описанию..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                />
                <button className="btn btn-outline-light" type="submit">
                  <span>🔍</span>
                </button>
              </form>
              
              {/* Индикатор загрузки */}
              {isLoading && (
                <div className="position-absolute top-100 start-0 end-0 bg-white shadow mt-1 rounded p-2">
                  <div className="text-center">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Загрузка...</span>
                    </div>
                    <span className="ms-2 small">Поиск...</span>
                  </div>
                </div>
              )}
              
              {/* Результаты поиска */}
              {showSearchResults && !isLoading && (
                <div className="nav-search-results position-absolute top-100 start-0 end-0 bg-white shadow mt-1 rounded">
                  {searchResults.length > 0 ? (
                    <>
                      {searchResults.map(pet => (
                        <div 
                          key={pet.id} 
                          className="search-result-item p-2 border-bottom"
                          onClick={() => {
                            navigate(`/pet/${pet.id}`);
                            setShowSearchResults(false);
                            setSearchTerm('');
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex align-items-center">
                            <div className="me-2 flex-shrink-0">
                              <img 
                                src={getImageUrl(pet.image)} 
                                alt={pet.name}
                                className="rounded"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = '/default-pet.jpg';
                                }}
                              />
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-bold">{pet.name}</div>
                              <div className="small text-muted text-truncate">
                                {pet.description}
                              </div>
                              <div className="small">
                                <span className="badge bg-secondary me-1">{pet.type}</span>
                                <span className="badge bg-light text-dark">{pet.district}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="p-2 text-center small border-top">
                        <Link to={`/search?q=${encodeURIComponent(searchTerm)}`} className="text-primary">
                          Показать все результаты →
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 text-center text-muted">
                      <div>🐾</div>
                      <div className="small">Ничего не найдено</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Кнопки авторизации */}
            <ul className="navbar-nav">
              {currentUser ? (
                <>
                  <li className="nav-item">
                    <span className="nav-link">Привет, {currentUser.name}!</span>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link btn btn-link" onClick={handleLogout}>
                      Выйти
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Вход</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">Регистрация</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;