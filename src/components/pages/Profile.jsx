import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [editAd, setEditAd] = useState(null);
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Загружаем данные пользователя
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
      navigate('/login');
      return;
    }
    
    setCurrentUser(user);
    
    // Загружаем объявления пользователя
    const ads = JSON.parse(localStorage.getItem('userAds')) || [];
    const userAds = ads.filter(ad => ad.userId === user.id);
    setUserAds(userAds);
  }, [navigate]);

  const handlePhoneChange = (e) => {
    e.preventDefault();
    if (currentUser && newPhone) {
      const updatedUser = { ...currentUser, phone: newPhone };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      // Обновляем в списке пользователей
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const updatedUsers = users.map(u => 
        u.id === updatedUser.id ? { ...u, phone: newPhone } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      setMessage('Телефон успешно изменен');
      setNewPhone('');
    }
  };

  const handleEmailChange = (e) => {
    e.preventDefault();
    if (currentUser && newEmail) {
      const updatedUser = { ...currentUser, email: newEmail };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      // Обновляем в списке пользователей
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const updatedUsers = users.map(u => 
        u.id === updatedUser.id ? { ...u, email: newEmail } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      setMessage('Email успешно изменен');
      setNewEmail('');
    }
  };

  const handleDeleteAd = (adId) => {
    const ads = JSON.parse(localStorage.getItem('userAds')) || [];
    const updatedAds = ads.filter(ad => ad.id !== adId);
    localStorage.setItem('userAds', JSON.stringify(updatedAds));
    setUserAds(updatedAds.filter(ad => ad.userId === currentUser.id));
    setMessage('Объявление удалено');
  };

  const calculateDaysSinceRegistration = () => {
    if (!currentUser?.registrationDate) return 0;
    const regDate = new Date(currentUser.registrationDate);
    const today = new Date();
    const diffTime = Math.abs(today - regDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!currentUser) {
    return <div className="text-center mt-5">Загрузка...</div>;
  }

  return (
    <div className="container mt-4">
      {message && (
        <div className="alert alert-info" role="alert">
          {message}
        </div>
      )}

      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5>Информация о пользователе</h5>
            </div>
            <div className="card-body">
              <p><strong>Имя:</strong> {currentUser.name}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Телефон:</strong> {currentUser.phone}</p>
              <p><strong>Дата регистрации:</strong> {currentUser.registrationDate}</p>
              <p><strong>Дней с регистрации:</strong> {calculateDaysSinceRegistration()}</p>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h5>Изменение телефона</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handlePhoneChange}>
                <div className="mb-3">
                  <label htmlFor="newPhone" className="form-label">Новый телефон *</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="newPhone"
                    pattern="[\+\d]+"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                  <div className="invalid-feedback">Только цифры и знак +</div>
                </div>
                <button type="submit" className="btn btn-primary">
                  Изменить телефон
                </button>
              </form>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h5>Изменение email</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleEmailChange}>
                <div className="mb-3">
                  <label htmlFor="newEmail" className="form-label">Новый email *</label>
                  <input
                    type="email"
                    className="form-control"
                    id="newEmail"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <div className="invalid-feedback">Пожалуйста, введите корректный email</div>
                </div>
                <button type="submit" className="btn btn-primary">
                  Изменить email
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Мои объявления</h5>
              <span className="badge bg-primary">{userAds.length} объявлений</span>
            </div>
            <div className="card-body">
              {userAds.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <p>У вас пока нет объявлений</p>
                  <Link to="/add-pet" className="btn btn-primary">
                    Добавить первое объявление
                  </Link>
                </div>
              ) : (
                <div className="row">
                  {userAds.map(ad => (
                    <div key={ad.id} className="col-md-6 mb-4">
                      <div className="card h-100">
                        {ad.photos && ad.photos[0] && (
                          <img 
                            src={ad.photos[0]} 
                            className="card-img-top" 
                            alt={ad.description}
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                        )}
                        <div className="card-body">
                          <h5 className="card-title">{ad.animalType || 'Животное'}</h5>
                          <p className="card-text">{ad.description.substring(0, 100)}...</p>
                          <p className="card-text">
                            <small className="text-muted">Район: {ad.district}</small><br />
                            <small className="text-muted">Дата: {ad.date}</small>
                          </p>
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => navigate(`/pet/${ad.id}`)}
                            >
                              Подробнее
                            </button>
                            <button 
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteAd(ad.id)}
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;