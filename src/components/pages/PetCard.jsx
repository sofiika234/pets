import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

function PetCard() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Ищем животное в данных
    const allPets = JSON.parse(localStorage.getItem('allPets')) || [];
    const userAds = JSON.parse(localStorage.getItem('userAds')) || [];
    const allAnimals = [...allPets, ...userAds];
    
    const foundPet = allAnimals.find(p => p.id === parseInt(id));
    
    if (foundPet) {
      setPet(foundPet);
    }
    
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Объявление не найдено</div>
        <div className="text-center">
          <Link to="/search" className="btn btn-outline-primary">
            Вернуться к поиску
          </Link>
        </div>
      </div>
    );
  }

  const getAnimalTypeText = (type) => {
    const typeMap = {
      'cat': 'Кошка',
      'dog': 'Собака',
      'other': 'Другое',
      'Кошка': 'Кошка',
      'Собака': 'Собака',
      'Кот': 'Кот'
    };
    return typeMap[type] || type;
  };

  const getStatusText = (status) => {
    const statusMap = {
      'active': 'Активное',
      'wasFound': 'Хозяин найден',
      'onModeration': 'На модерации',
      'archive': 'В архиве'
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classMap = {
      'active': 'bg-success',
      'wasFound': 'bg-primary',
      'onModeration': 'bg-warning',
      'archive': 'bg-secondary'
    };
    return classMap[status] || 'bg-secondary';
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card">
            <div className="row g-0">
              <div className="col-md-6">
                <img 
                  src={pet.image || 'default-pet.jpg'} 
                  className="img-fluid rounded-start h-100 w-100" 
                  style={{ objectFit: 'cover' }}
                  alt={pet.description}
                />
              </div>
              <div className="col-md-6">
                <div className="card-body">
                  <h3 className="card-title">{pet.name || 'Без имени'}</h3>
                  <p className="card-text">{pet.description}</p>
                  
                  <div className="mb-3">
                    <strong>Район:</strong> {pet.district}
                  </div>
                  
                  <div className="mb-3">
                    <strong>Вид животного:</strong> {getAnimalTypeText(pet.animalType || pet.type)}
                  </div>
                  
                  {pet.mark && (
                    <div className="mb-3">
                      <strong>Клеймо:</strong> {pet.mark}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <strong>Дата находки:</strong> {pet.date}
                  </div>
                  
                  <div className="mb-3">
                    <strong>Статус:</strong> 
                    <span className={`badge ${getStatusBadgeClass(pet.status || 'active')} ms-2`}>
                      {getStatusText(pet.status || 'active')}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <h5>Контактная информация</h5>
                    <p><strong>Имя:</strong> {pet.name}</p>
                    {pet.phone && <p><strong>Телефон:</strong> {pet.phone}</p>}
                    {pet.email && <p><strong>Email:</strong> {pet.email}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-4">
        <button 
          className="btn btn-outline-primary"
          onClick={() => navigate('/search')}
        >
          Вернуться к поиску
        </button>
      </div>
    </div>
  );
}

export default PetCard;