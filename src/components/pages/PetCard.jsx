import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { petsApi } from '../../utils/api';

function PetCard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [contactVisible, setContactVisible] = useState(false);

    useEffect(() => {
        const loadPetData = async () => {
            setLoading(true);
            setError('');
            
            try {
                console.log(`Загрузка данных животного с ID: ${id}`);
                
                // 1. Пробуем разные эндпоинты API
                const endpoints = [
                    `/pets/${id}`,
                    `/orders/${id}`,
                    `/animals/${id}`
                ];
                
                let petData = null;
                
                for (const endpoint of endpoints) {
                    try {
                        const response = await petsApi.get(endpoint);
                        console.log(`Ответ от ${endpoint}:`, response);
                        
                        if (response && response.id) {
                            petData = response;
                            break;
                        }
                        
                        // Проверяем разные форматы ответа
                        if (response && response.data && response.data.id) {
                            petData = response.data;
                            break;
                        }
                        
                        if (response && response.pet && response.pet.id) {
                            petData = response.pet;
                            break;
                        }
                        
                        if (response && response.order && response.order.id) {
                            petData = response.order;
                            break;
                        }
                        
                    } catch (endpointError) {
                        console.log(`Эндпоинт ${endpoint} не сработал:`, endpointError.message);
                        continue;
                    }
                }
                
                if (petData) {
                    console.log('Данные животного получены:', petData);
                    
                    // Форматируем данные для отображения
                    const formattedPet = {
                        id: petData.id || id,
                        title: petData.title || petData.name || petData.kind || 'Животное',
                        kind: petData.kind || petData.type || petData.animal_type || 'Не указано',
                        description: petData.description || 'Нет описания',
                        district: petData.district || petData.location || petData.city || 'Не указан',
                        address: petData.address || petData.full_address || '',
                        date: petData.date || petData.created_at || petData.createdAt || new Date().toISOString().split('T')[0],
                        status: petData.status || 'active',
                        phone: petData.phone || '',
                        email: petData.email || '',
                        user_name: petData.user_name || petData.author || '',
                        user_id: petData.user_id || '',
                        
                        // Обработка изображений
                        images: getImagesArray(petData.photos || petData.photo || petData.image),
                        
                        // Дополнительные поля
                        breed: petData.breed || petData.breed_name || '',
                        age: petData.age || '',
                        color: petData.color || '',
                        gender: petData.gender || petData.sex || '',
                        special_signs: petData.special_signs || petData.features || '',
                        reward: petData.reward || ''
                    };
                    
                    setPet(formattedPet);
                } else {
                    setError('Не удалось загрузить информацию о животном. Возможно, объявление было удалено или перемещено.');
                }
                
            } catch (error) {
                console.error('Ошибка загрузки животного:', error);
                setError('Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
            } finally {
                setLoading(false);
            }
        };

        loadPetData();
    }, [id]);

    // Функция для получения массива изображений
    const getImagesArray = (imageSource) => {
        if (!imageSource) {
            return ['/images/default-pet.jpg'];
        }
        
        // Если это уже массив
        if (Array.isArray(imageSource)) {
            if (imageSource.length === 0) {
                return ['/images/default-pet.jpg'];
            }
            
            // Преобразуем каждый элемент в корректный URL
            return imageSource.map(img => getImageUrl(img)).filter(url => url);
        }
        
        // Если это строка
        if (typeof imageSource === 'string' && imageSource.trim()) {
            return [getImageUrl(imageSource)];
        }
        
        // Во всех остальных случаях - дефолтное изображение
        return ['/images/default-pet.jpg'];
    };

    // Функция для получения корректного URL изображения
    const getImageUrl = (imagePath) => {
        if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
            return '/images/default-pet.jpg';
        }
        
        // Если уже полный URL
        if (typeof imagePath === 'string' && 
            (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
            return imagePath;
        }
        
        // Очищаем путь
        const cleanPath = String(imagePath).replace(/^\/+/, '');
        const baseUrl = 'https://pets.сделай.site';
        
        // Если путь уже содержит storage/ или uploads/
        if (cleanPath.includes('storage/') || cleanPath.includes('uploads/') || cleanPath.includes('images/')) {
            return `${baseUrl}/${cleanPath}`;
        }
        
        // Пробуем разные варианты
        const possiblePaths = [
            `storage/${cleanPath}`,
            `uploads/${cleanPath}`,
            `images/${cleanPath}`,
            `storage/uploads/${cleanPath}`,
            cleanPath
        ];
        
        // Возвращаем первый вариант
        const finalUrl = `${baseUrl}/${possiblePaths[0]}`;
        console.log(`Преобразован URL: ${imagePath} -> ${finalUrl}`);
        return finalUrl;
    };

    // Функция для обработки ошибок загрузки изображений
    const handleImageError = (e, defaultImage = '/images/default-pet.jpg') => {
        console.warn('Ошибка загрузки изображения:', e.target.src);
        e.target.onerror = null;
        e.target.src = defaultImage;
    };

    // Форматирование даты
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
            return dateString || 'Не указана';
        }
    };

    // Получение статуса объявления
    const getStatusBadge = (status) => {
        const statusMap = {
            'active': { text: 'Активно', variant: 'success' },
            'found': { text: 'Найдено', variant: 'primary' },
            'lost': { text: 'Потеряно', variant: 'danger' },
            'pending': { text: 'На модерации', variant: 'warning' },
            'onModeration': { text: 'На модерации', variant: 'warning' },
            'adopted': { text: 'Пристроено', variant: 'info' },
            'closed': { text: 'Закрыто', variant: 'secondary' }
        };
        
        const statusInfo = statusMap[status] || { text: status || 'Неизвестно', variant: 'secondary' };
        return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
    };

    // Копирование контакта в буфер обмена
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(
            () => {
                alert('Контакт скопирован в буфер обмена!');
            },
            (err) => {
                console.error('Ошибка копирования: ', err);
            }
        );
    };

    if (loading) {
        return (
            <div className="container mt-5 py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Загрузка информации о животном...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <Alert variant="danger">
                    <Alert.Heading>Ошибка загрузки</Alert.Heading>
                    <p>{error}</p>
                    <div className="d-flex gap-2 mt-3">
                        <Button variant="primary" onClick={() => navigate(-1)}>
                            Назад
                        </Button>
                        <Button variant="outline-primary" onClick={() => navigate('/search')}>
                            Поиск животных
                        </Button>
                        <Button variant="outline-secondary" onClick={() => navigate('/')}>
                            На главную
                        </Button>
                    </div>
                </Alert>
                
                {/* Демонстрационная карточка для тестирования */}
                <div className="mt-5">
                    <h3 className="text-center mb-4">Пример объявления о животном</h3>
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">Пример: Собака Бобик</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="row">
                                <div className="col-md-6">
                                    <img 
                                        src="/images/default-pet.jpg" 
                                        alt="Пример" 
                                        className="img-fluid rounded mb-3"
                                        style={{ maxHeight: '300px', objectFit: 'cover', width: '100%' }}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <h5>Описание:</h5>
                                    <p>Дружелюбная собака средних размеров, найдена в парке. Откликается на кличку "Бобик".</p>
                                    <p><strong>Район:</strong> Центральный</p>
                                    <p><strong>Дата:</strong> 15.01.2024</p>
                                    <p><strong>Статус:</strong> <Badge bg="success">Активно</Badge></p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        );
    }

    if (!pet) {
        return (
            <div className="container mt-5">
                <Alert variant="warning">
                    <Alert.Heading>Объявление не найдено</Alert.Heading>
                    <p>Объявление с ID {id} не найдено. Возможно, оно было удалено.</p>
                    <div className="d-flex gap-2 mt-3">
                        <Button variant="primary" onClick={() => navigate('/search')}>
                            Поиск животных
                        </Button>
                        <Button variant="outline-secondary" onClick={() => navigate('/')}>
                            На главную
                        </Button>
                    </div>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mt-4 mb-5">
            {/* Хлебные крошки */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/" className="text-decoration-none">
                            <i className="bi bi-house"></i> Главная
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to="/search" className="text-decoration-none">
                            Поиск животных
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        {pet.title}
                    </li>
                </ol>
            </nav>

            <div className="row">
                <div className="col-lg-8">
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white py-3">
                            <h3 className="mb-0">{pet.title}</h3>
                            <div>
                                {getStatusBadge(pet.status)}
                            </div>
                        </Card.Header>
                        
                        <Card.Body className="p-4">
                            {/* Галерея изображений */}
                            <div className="mb-4">
                                {pet.images.length > 0 ? (
                                    <div className="row">
                                        <div className="col-12 mb-3">
                                            <div className="main-image-container rounded" style={{ height: '400px', overflow: 'hidden' }}>
                                                <img
                                                    src={pet.images[0]}
                                                    alt={pet.title}
                                                    className="w-100 h-100"
                                                    style={{ objectFit: 'cover' }}
                                                    onError={(e) => handleImageError(e)}
                                                />
                                            </div>
                                        </div>
                                        
                                        {pet.images.length > 1 && (
                                            <div className="col-12">
                                                <div className="d-flex gap-2 overflow-auto py-2">
                                                    {pet.images.slice(1).map((img, index) => (
                                                        <div 
                                                            key={index} 
                                                            className="thumbnail"
                                                            style={{ 
                                                                width: '120px', 
                                                                height: '80px', 
                                                                flexShrink: 0,
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => {
                                                                // Перемещаем изображение на первое место
                                                                const newImages = [img, ...pet.images.filter((_, i) => i !== index + 1)];
                                                                setPet({...pet, images: newImages});
                                                            }}
                                                        >
                                                            <img
                                                                src={img}
                                                                alt={`${pet.title} ${index + 2}`}
                                                                className="w-100 h-100"
                                                                style={{ objectFit: 'cover' }}
                                                                onError={(e) => handleImageError(e)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-5 bg-light rounded">
                                        <div className="display-1 mb-3">🖼️</div>
                                        <p className="text-muted">Изображения отсутствуют</p>
                                    </div>
                                )}
                            </div>

                            {/* Основная информация */}
                            <div className="mb-4">
                                <h4 className="text-primary mb-3">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Информация о животном
                                </h4>
                                
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <strong className="d-block text-muted mb-1">
                                            <i className="bi bi-tag me-2"></i>
                                            Вид:
                                        </strong>
                                        <span>{pet.kind}</span>
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <strong className="d-block text-muted mb-1">
                                            <i className="bi bi-geo-alt me-2"></i>
                                            Район:
                                        </strong>
                                        <span>{pet.district}</span>
                                    </div>
                                    
                                    {pet.breed && (
                                        <div className="col-md-6 mb-3">
                                            <strong className="d-block text-muted mb-1">
                                                <i className="bi bi-heart me-2"></i>
                                                Порода:
                                            </strong>
                                            <span>{pet.breed}</span>
                                        </div>
                                    )}
                                    
                                    {pet.age && (
                                        <div className="col-md-6 mb-3">
                                            <strong className="d-block text-muted mb-1">
                                                <i className="bi bi-calendar3 me-2"></i>
                                                Возраст:
                                            </strong>
                                            <span>{pet.age}</span>
                                        </div>
                                    )}
                                    
                                    {pet.color && (
                                        <div className="col-md-6 mb-3">
                                            <strong className="d-block text-muted mb-1">
                                                <i className="bi bi-palette me-2"></i>
                                                Окрас:
                                            </strong>
                                            <span>{pet.color}</span>
                                        </div>
                                    )}
                                    
                                    {pet.gender && (
                                        <div className="col-md-6 mb-3">
                                            <strong className="d-block text-muted mb-1">
                                                <i className="bi bi-gender-ambiguous me-2"></i>
                                                Пол:
                                            </strong>
                                            <span>{pet.gender}</span>
                                        </div>
                                    )}
                                    
                                    <div className="col-12 mb-3">
                                        <strong className="d-block text-muted mb-1">
                                            <i className="bi bi-calendar-date me-2"></i>
                                            Дата объявления:
                                        </strong>
                                        <span>{formatDate(pet.date)}</span>
                                    </div>
                                    
                                    {pet.address && (
                                        <div className="col-12 mb-3">
                                            <strong className="d-block text-muted mb-1">
                                                <i className="bi bi-geo me-2"></i>
                                                Адрес:
                                            </strong>
                                            <span>{pet.address}</span>
                                        </div>
                                    )}
                                    
                                    {pet.reward && (
                                        <div className="col-12 mb-3">
                                            <strong className="d-block text-muted mb-1">
                                                <i className="bi bi-currency-exchange me-2"></i>
                                                Вознаграждение:
                                            </strong>
                                            <span className="text-success fw-bold">{pet.reward}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Описание */}
                            <div className="mb-4">
                                <h4 className="text-primary mb-3">
                                    <i className="bi bi-chat-text me-2"></i>
                                    Описание
                                </h4>
                                <div className="p-3 bg-light rounded">
                                    {pet.description.split('\n').map((paragraph, index) => (
                                        <p key={index} className="mb-2">
                                            {paragraph || <span className="text-muted fst-italic">Описание отсутствует</span>}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {/* Особые приметы */}
                            {pet.special_signs && (
                                <div className="mb-4">
                                    <h4 className="text-primary mb-3">
                                        <i className="bi bi-search me-2"></i>
                                        Особые приметы
                                    </h4>
                                    <div className="p-3 bg-light rounded">
                                        {pet.special_signs}
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>

                {/* Боковая панель с контактами */}
                <div className="col-lg-4">
                    <Card className="shadow-sm mb-4 sticky-top" style={{ top: '20px' }}>
                        <Card.Header className="bg-primary text-white py-3">
                            <h5 className="mb-0">
                                <i className="bi bi-telephone me-2"></i>
                                Контакты
                            </h5>
                        </Card.Header>
                        
                        <Card.Body className="p-4">
                            {/* Информация о владельце */}
                            {pet.user_name && (
                                <div className="mb-4">
                                    <h6 className="text-primary mb-2">
                                        <i className="bi bi-person me-2"></i>
                                        Автор объявления
                                    </h6>
                                    <p className="mb-0">{pet.user_name}</p>
                                </div>
                            )}

                            {/* Контактная информация */}
                            {!contactVisible ? (
                                <div className="text-center">
                                    <p className="text-muted mb-3">
                                        Контактная информация скрыта для защиты приватности
                                    </p>
                                    <Button 
                                        variant="primary" 
                                        className="w-100"
                                        onClick={() => setContactVisible(true)}
                                    >
                                        <i className="bi bi-eye me-2"></i>
                                        Показать контакты
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    {pet.phone && (
                                        <div className="mb-3">
                                            <h6 className="text-primary mb-2">
                                                <i className="bi bi-phone me-2"></i>
                                                Телефон
                                            </h6>
                                            <div className="d-flex align-items-center">
                                                <span className="me-2">{pet.phone}</span>
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    onClick={() => copyToClipboard(pet.phone)}
                                                    title="Копировать"
                                                >
                                                    <i className="bi bi-copy"></i>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {pet.email && (
                                        <div className="mb-4">
                                            <h6 className="text-primary mb-2">
                                                <i className="bi bi-envelope me-2"></i>
                                                Email
                                            </h6>
                                            <div className="d-flex align-items-center">
                                                <span className="me-2 text-break">{pet.email}</span>
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    onClick={() => copyToClipboard(pet.email)}
                                                    title="Копировать"
                                                >
                                                    <i className="bi bi-copy"></i>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {!pet.phone && !pet.email && (
                                        <div className="text-center py-3">
                                            <div className="display-1 mb-3">📞</div>
                                            <p className="text-muted">Контактная информация отсутствует</p>
                                        </div>
                                    )}
                                    
                                    <Button 
                                        variant="outline-secondary" 
                                        className="w-100"
                                        onClick={() => setContactVisible(false)}
                                    >
                                        <i className="bi bi-eye-slash me-2"></i>
                                        Скрыть контакты
                                    </Button>
                                </div>
                            )}
                            
                            <hr className="my-4" />
                            
                            {/* Действия */}
                            <div className="d-grid gap-2">
                                <Button 
                                    variant="outline-primary"
                                    onClick={() => navigate('/add-pet')}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Добавить свое объявление
                                </Button>
                                
                                <Button 
                                    variant="outline-secondary"
                                    onClick={() => navigate('/search')}
                                >
                                    <i className="bi bi-search me-2"></i>
                                    Искать другие объявления
                                </Button>
                                
                                <Button 
                                    variant="outline-danger"
                                    onClick={() => {
                                        if (window.confirm('Вы действительно хотите пожаловаться на это объявление?')) {
                                            alert('Жалоба отправлена. Спасибо за бдительность!');
                                        }
                                    }}
                                >
                                    <i className="bi bi-flag me-2"></i>
                                    Пожаловаться на объявление
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Статистика */}
                    <Card className="shadow-sm">
                        <Card.Header className="bg-light py-3">
                            <h6 className="mb-0">
                                <i className="bi bi-bar-chart me-2"></i>
                                Статистика просмотра
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center">
                                <div className="display-6 mb-2 text-primary">👁️</div>
                                <p className="text-muted small mb-0">
                                    Это объявление было просмотрено несколько раз
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* Кнопки навигации */}
            <div className="d-flex justify-content-between mt-4 pt-4 border-top">
                <Button 
                    variant="outline-secondary"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Назад
                </Button>
                
                <div className="d-flex gap-2">
                    {pet.user_id && (
                        <Button 
                            variant="outline-primary"
                            onClick={() => navigate(`/user/${pet.user_id}`)}
                        >
                            <i className="bi bi-person me-2"></i>
                            Профиль автора
                        </Button>
                    )}
                    
                    <Button 
                        variant="primary"
                        onClick={() => navigate('/search')}
                    >
                        <i className="bi bi-search me-2"></i>
                        Поиск животных
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default PetCard;