import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Загружаем данные пользователя из localStorage
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Моковые данные для поиска
  const allPets = [
    { id: 1, name: 'Мурка', type: 'Кошка', district: 'Центральный', 
      image: 'default-cat.jpg', description: 'Ласковая кошка с белой шерстью' },
    { id: 2, name: 'Дружок', type: 'Собака', district: 'Северный',
      image: 'default-dog.jpg', description: 'Дружелюбный пес средних размеров' },
    // ... другие животные
  ];

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowSearchResults(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= 2) {
      const results = allPets.filter(pet => 
        pet.description.toLowerCase().includes(value.toLowerCase()) ||
        pet.name.toLowerCase().includes(value.toLowerCase()) ||
        pet.type.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
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
              
              {/* Результаты поиска */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="nav-search-results position-absolute top-100 start-0 end-0 bg-white shadow mt-1 rounded">
                  {searchResults.map(pet => (
                    <div 
                      key={pet.id} 
                      className="search-result-item p-2 border-bottom"
                      onClick={() => {
                        navigate(`/pet/${pet.id}`);
                        setShowSearchResults(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="me-2">
                          <span className="fs-5">
                            {pet.type === 'Собака' ? '🐕' : '🐈'}
                          </span>
                        </div>
                        <div>
                          <div className="fw-bold">{pet.name}</div>
                          <div className="small text-muted">{pet.description.substring(0, 40)}...</div>
                        </div>
                      </div>
                    </div>
                  ))}
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