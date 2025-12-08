import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Image } from 'react-bootstrap';
import { petsApi, api } from '../../utils/api';

function PetCard() {
    const { id } = useParams();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const loadPet = async () => {
            try {
                const response = await petsApi.getPet(id);
                if (response.data?.pet) {
                    const petData = response.data.pet[0] || response.data.pet;
                    
                    let photos = [];
                    if (petData.photos) {
                        if (Array.isArray(petData.photos)) {
                            photos = petData.photos.map(photo => api.getImageUrl(photo));
                        } else {
                            photos = [api.getImageUrl(petData.photos)];
                        }
                    }
                    
                    if (photos.length === 0) {
                        photos = [api.getImageUrl('/images/default-pet.png')];
                    }
                    
                    setPet({
                        id: petData.id,
                        name: petData.name || petData.kind || 'Без имени',
                        type: petData.kind || 'Неизвестно',
                        district: petData.district || 'Не указан',
                        photos: photos,
                        description: petData.description || 'Нет описания',
                        date: petData.date || new Date().toISOString().split('T')[0],
                        phone: petData.phone || 'Не указан',
                        email: petData.email || 'Не указан',
                        status: petData.status || 'active',
                        mark: petData.mark || 'Отсутствует',
                        registered: petData.registered || false
                    });
                } else {
                    setError('Объявление не найдено');
                }
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                if (error.status === 404) {
                    setError('Объявление не найдено');
                } else if (error.status === 204) {
                    setError('Информация о животном временно недоступна');
                } else {
                    setError('Не удалось загрузить информацию о животном');
                }
            } finally {
                setLoading(false);
            }
        };

        loadPet();
    }, [id]);

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            'active': 'Ищет дом',
            'wasFound': 'Хозяин найден',
            'onModeration': 'На модерации',
            'archive': 'В архиве'
        };
        return statusMap[status] || status;
    };

    const getStatusClass = (status) => {
        const classMap = {
            'active': 'success',
            'wasFound': 'primary',
            'onModeration': 'warning',
            'archive': 'secondary'
        };
        return classMap[status] || 'secondary';
    };

    const handlePreviousImage = () => {
        setCurrentImageIndex(prev => 
            prev === 0 ? pet.photos.length - 1 : prev - 1
        );
    };

    const handleNextImage = () => {
        setCurrentImageIndex(prev => 
            prev === pet.photos.length - 1 ? 0 : prev + 1
        );
    };

    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Загрузка информации о животном...</p>
            </div>
        );
    }

    if (error || !pet) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger text-center">
                    <div className="display-4 mb-3">😿</div>
                    <h4>{error || 'Объявление не найдено'}</h4>
                    <p className="mb-0">Возможно, объявление было удалено или перемещено</p>
                </div>
                <div className="text-center mt-4">
                    <Button 
                        variant="outline-primary"
                        onClick={() => navigate('/search')}
                        className="me-2"
                    >
                        Вернуться к поиску
                    </Button>
                    <Button 
                        variant="primary"
                        onClick={() => navigate('/main')}
                    >
                        На главную
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4 mb-5">
            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <nav aria-label="breadcrumb" className="mb-4">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <a href="/main" onClick={(e) => { e.preventDefault(); navigate('/main'); }}>Главная</a>
                            </li>
                            <li className="breadcrumb-item">
                                <a href="/search" onClick={(e) => { e.preventDefault(); navigate('/search'); }}>Поиск</a>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">{pet.name}</li>
                        </ol>
                    </nav>

                    <Card className="shadow border-0 mb-4">
                        <div className="row g-0">
                            <div className="col-md-6">
                                <div className="position-relative" style={{ height: '500px' }}>
                                    <img
                                        src={pet.photos[currentImageIndex]}
                                        className="img-fluid rounded-start h-100 w-100"
                                        style={{ objectFit: 'cover' }}
                                        alt={pet.name}
                                        onError={(e) => {
                                            e.target.src = api.getImageUrl('/images/default-pet.png');
                                        }}
                                    />
                                    
                                    {pet.photos.length > 1 && (
                                        <>
                                            <Button
                                                variant="light"
                                                className="position-absolute top-50 start-0 translate-middle-y bg-white bg-opacity-75"
                                                onClick={handlePreviousImage}
                                                style={{ left: '10px' }}
                                            >
                                                ←
                                            </Button>
                                            <Button
                                                variant="light"
                                                className="position-absolute top-50 end-0 translate-middle-y bg-white bg-opacity-75"
                                                onClick={handleNextImage}
                                                style={{ right: '10px' }}
                                            >
                                                →
                                            </Button>
                                            
                                            <div className="position-absolute bottom-0 start-0 end-0 p-3 bg-dark bg-opacity-50 text-white text-center">
                                                Фото {currentImageIndex + 1} из {pet.photos.length}
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                {pet.photos.length > 1 && (
                                    <div className="d-flex gap-2 p-3">
                                        {pet.photos.map((photo, index) => (
                                            <div 
                                                key={index}
                                                className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                                                onClick={() => setCurrentImageIndex(index)}
                                                style={{ 
                                                    width: '80px', 
                                                    height: '60px',
                                                    cursor: 'pointer',
                                                    border: index === currentImageIndex ? '3px solid #0d6efd' : '1px solid #dee2e6',
                                                    borderRadius: '5px',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <img
                                                    src={photo}
                                                    alt={`Фото ${index + 1}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.src = api.getImageUrl('/images/default-pet.png');
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="col-md-6">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-4">
                                        <Card.Title className="h2 text-primary mb-0">{pet.name}</Card.Title>
                                        <span className={`badge bg-${getStatusClass(pet.status)} fs-6`}>
                                            {getStatusText(pet.status)}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <span className="badge bg-info me-2 fs-6">{pet.type}</span>
                                        <span className="badge bg-secondary fs-6">
                                            <i className="bi bi-geo-alt me-1"></i>
                                            {pet.district}
                                        </span>
                                    </div>
                                    
                                    <Card.Text className="fs-5 mb-4">
                                        {pet.description}
                                    </Card.Text>
                                    
                                    <div className="mb-4">
                                        <h5 className="mb-3 border-bottom pb-2">Информация</h5>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <strong className="d-block text-muted mb-1">Дата находки:</strong>
                                                <span>{formatDate(pet.date)}</span>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <strong className="d-block text-muted mb-1">Клеймо:</strong>
                                                <span>{pet.mark}</span>
                                            </div>
                                            <div className="col-md-12 mb-3">
                                                <strong className="d-block text-muted mb-1">Статус объявления:</strong>
                                                <span>{pet.registered ? 'От зарегистрированного пользователя' : 'От анонимного пользователя'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <h5 className="mb-3 border-bottom pb-2">Контактная информация</h5>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <strong className="d-block text-muted mb-1">Телефон:</strong>
                                                <span className="fs-5">{pet.phone}</span>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <strong className="d-block text-muted mb-1">Email:</strong>
                                                <span>{pet.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="d-grid gap-2">
                                        <Button 
                                            variant="primary" 
                                            size="lg"
                                            onClick={() => window.location.href = `tel:${pet.phone}`}
                                            className="py-3"
                                        >
                                            <i className="bi bi-telephone me-2"></i>
                                            Позвонить
                                        </Button>
                                        <Button 
                                            variant="outline-primary" 
                                            onClick={() => window.location.href = `mailto:${pet.email}`}
                                        >
                                            <i className="bi bi-envelope me-2"></i>
                                            Написать на email
                                        </Button>
                                        <Button 
                                            variant="outline-secondary" 
                                            onClick={() => navigate('/search')}
                                        >
                                            <i className="bi bi-arrow-left me-2"></i>
                                            Вернуться к поиску
                                        </Button>
                                    </div>
                                </Card.Body>
                            </div>
                        </div>
                    </Card>
                    
                    <div className="text-center mt-4">
                        <p className="text-muted">
                            <small>
                                Информация актуальна на {new Date().toLocaleDateString('ru-RU')}
                            </small>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PetCard;