import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge, Row, Col, Carousel } from 'react-bootstrap';
import { petsApi } from '../../utils/api';

function PetCard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [contactVisible, setContactVisible] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        const loadPetData = async () => {
            setLoading(true);
            setError('');
            
            try {
                console.log(`Загрузка данных животного с ID: ${id}`);
                
                // Согласно ТЗ: GET /api/pets/{id}
                const response = await petsApi.getPet(id);
                console.log('Ответ API:', response);
                
                if (response && response.data) {
                    // Согласно ТЗ: ответ содержит { "data": { "pet": [ {...} ] } }
                    if (response.data.pet && Array.isArray(response.data.pet) && response.data.pet.length > 0) {
                        const petData = response.data.pet[0];
                        console.log('Данные животного получены:', petData);
                        
                        // Форматируем данные согласно ТЗ
                        const formattedPet = formatPetData(petData);
                        setPet(formattedPet);
                    } else if (response.data.pet && typeof response.data.pet === 'object') {
                        // Если pet не массив, а объект
                        const formattedPet = formatPetData(response.data.pet);
                        setPet(formattedPet);
                    } else {
                        // Проверяем другие возможные форматы
                        if (Array.isArray(response.data) && response.data.length > 0) {
                            const formattedPet = formatPetData(response.data[0]);
                            setPet(formattedPet);
                        } else if (response.data.id) {
                            const formattedPet = formatPetData(response.data);
                            setPet(formattedPet);
                        } else {
                            setError('Данные о животном не найдены в ответе сервера');
                        }
                    }
                } else if (response && response.id) {
                    // Если ответ напрямую содержит данные животного
                    const formattedPet = formatPetData(response);
                    setPet(formattedPet);
                } else {
                    setError('Не удалось загрузить информацию о животном. Сервер вернул некорректные данные.');
                }
                
            } catch (error) {
                console.error('Ошибка загрузки животного:', error);
                
                if (error.status === 404) {
                    setError('Объявление с таким ID не найдено.');
                } else if (error.status === 401) {
                    setError('Требуется авторизация для просмотра этого объявления.');
                    navigate('/login');
                } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
                    setError('Нет подключения к серверу. Проверьте интернет-соединение и попробуйте позже.');
                } else {
                    setError('Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
                }
            } finally {
                setLoading(false);
            }
        };

        loadPetData();
    }, [id, navigate]);

    // Функция для форматирования данных животного согласно ТЗ
    const formatPetData = (petData) => {
        // Преобразуем photos в массив URL согласно ТЗ формату
        const images = getImagesArray(petData.photos || petData.photo);
        
        return {
            id: petData.id || id,
            title: `${petData.kind || 'Животное'} - ${petData.district || 'Район не указан'}`,
            kind: petData.kind || 'Не указано',
            description: petData.description || 'Нет описания',
            district: petData.district || 'Не указан',
            date: petData.date || 'Не указана',
            status: petData.status || 'active',
            phone: petData.phone || '',
            email: petData.email || '',
            name: petData.name || '',
            images: images,
            mark: petData.mark || '',
            registered: petData.registered || false
        };
    };

    // Функция для получения массива изображений согласно ТЗ
    const getImagesArray = (photos) => {
        const BASE_URL = 'https://pets.сделай.site';
        const DEFAULT_IMAGE = `${BASE_URL}/images/default-pet.jpg`;
        
        if (!photos) {
            return [DEFAULT_IMAGE];
        }
        
        if (Array.isArray(photos)) {
            if (photos.length === 0) {
                return [DEFAULT_IMAGE];
            }
            
            // Согласно ТЗ: photos содержит массив строк типа ['{url}/img1.png', ...]
            return photos.map(photo => {
                if (!photo) return DEFAULT_IMAGE;
                
                // Обрабатываем строку с шаблоном {url}
                if (typeof photo === 'string' && photo.includes('{url}')) {
                    return photo.replace('{url}', BASE_URL);
                }
                
                // Если это полный URL
                if (typeof photo === 'string' && photo.startsWith('http')) {
                    return photo;
                }
                
                // Если путь начинается с /
                if (typeof photo === 'string' && photo.startsWith('/')) {
                    return `${BASE_URL}${photo}`;
                }
                
                // Если это просто имя файла
                if (typeof photo === 'string') {
                    return `${BASE_URL}/images/${photo}`;
                }
                
                return DEFAULT_IMAGE;
            }).filter(url => url && url !== DEFAULT_IMAGE).length > 0 
                ? photos.map(photo => processPhoto(photo, BASE_URL)).filter(url => url)
                : [DEFAULT_IMAGE];
        }
        
        if (typeof photos === 'string') {
            const processed = processPhoto(photos, BASE_URL);
            return processed ? [processed] : [DEFAULT_IMAGE];
        }
        
        return [DEFAULT_IMAGE];
    };

    // Вспомогательная функция для обработки одного фото
    const processPhoto = (photo, baseUrl) => {
        if (!photo) return null;
        
        if (typeof photo === 'string') {
            if (photo.includes('{url}')) {
                return photo.replace('{url}', baseUrl);
            }
            if (photo.startsWith('http')) {
                return photo;
            }
            if (photo.startsWith('/')) {
                return `${baseUrl}${photo}`;
            }
            return `${baseUrl}/images/${photo}`;
        }
        
        return null;
    };

    // Функция для обработки ошибок загрузки изображений
    const handleImageError = (e) => {
        console.warn('Ошибка загрузки изображения:', e.target.src);
        e.target.onerror = null;
        e.target.src = 'https://pets.сделай.site/images/default-pet.jpg';
    };

    // Форматирование даты согласно ТЗ (формат "01-01-1970")
    const formatDate = (dateString) => {
        if (!dateString || dateString === '01-01-1970' || dateString === '1970-01-01') {
            return 'Не указана';
        }
        
        try {
            // Пробуем разные форматы даты
            let date;
            
            if (dateString.includes('-')) {
                const parts = dateString.split('-');
                if (parts.length === 3) {
                    // Формат DD-MM-YYYY (как в ТЗ)
                    if (parts[2].length === 4) {
                        date = new Date(parts[2], parts[1] - 1, parts[0]);
                    } else {
                        date = new Date(dateString);
                    }
                }
            } else {
                date = new Date(dateString);
            }
            
            if (isNaN(date.getTime())) {
                return dateString;
            }
            
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
            'active': { text: 'Активно', variant: 'success', icon: 'bi-check-circle' },
            'found': { text: 'Хозяин найден', variant: 'primary', icon: 'bi-heart-fill' },
            'on_moderation': { text: 'На модерации', variant: 'warning', icon: 'bi-clock' },
            'archive': { text: 'В архиве', variant: 'secondary', icon: 'bi-archive' },
            'wasFound': { text: 'Хозяин найден', variant: 'primary', icon: 'bi-heart-fill' },
            'onModeration': { text: 'На модерации', variant: 'warning', icon: 'bi-clock' }
        };
        
        const statusInfo = statusMap[status] || { 
            text: status || 'Неизвестно', 
            variant: 'secondary', 
            icon: 'bi-question-circle' 
        };
        
        return (
            <Badge bg={statusInfo.variant} className="d-flex align-items-center gap-1 px-3 py-2">
                <i className={`bi ${statusInfo.icon}`}></i>
                {statusInfo.text}
            </Badge>
        );
    };

    // Копирование контакта в буфер обмена
    const copyToClipboard = (text, fieldName) => {
        if (!text) return;
        
        navigator.clipboard.writeText(text).then(
            () => {
                // Показываем уведомление
                const alert = document.createElement('div');
                alert.className = 'alert alert-success position-fixed top-0 end-0 m-3';
                alert.style.zIndex = '9999';
                alert.innerHTML = `
                    <div class="d-flex align-items-center">
                        <i class="bi bi-check-circle-fill me-2"></i>
                        ${fieldName} скопирован в буфер обмена!
                    </div>
                `;
                document.body.appendChild(alert);
                
                setTimeout(() => {
                    alert.remove();
                }, 3000);
            },
            (err) => {
                console.error('Ошибка копирования: ', err);
                alert('Не удалось скопировать текст. Пожалуйста, скопируйте вручную.');
            }
        );
    };

    // Если загружается
    if (loading) {
        return (
            <div className="container mt-5 py-5 text-center">
                <Spinner animation="border" variant="primary" size="lg" />
                <p className="mt-3 fs-5">Загрузка информации о животном...</p>
                <p className="text-muted small">ID объявления: {id}</p>
            </div>
        );
    }

    return (
        <div className="container mt-4 mb-5">
            {/* Хлебные крошки */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb bg-light p-3 rounded">
                    <li className="breadcrumb-item">
                        <Link to="/" className="text-decoration-none">
                            <i className="bi bi-house me-1"></i> Главная
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to="/search" className="text-decoration-none">
                            Поиск животных
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        {pet?.title || 'Карточка животного'}
                    </li>
                </ol>
            </nav>

            {error && (
                <Alert variant="warning" className="mb-4" dismissible onClose={() => setError('')}>
                    <Alert.Heading>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Внимание
                    </Alert.Heading>
                    <p>{error}</p>
                </Alert>
            )}

            {pet ? (
                <div className="row">
                    {/* Основной контент */}
                    <div className="col-lg-8">
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Header className="bg-primary text-white py-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h1 className="h4 mb-0">
                                        <i className="bi bi-paw me-2"></i>
                                        {pet.title}
                                    </h1>
                                    {getStatusBadge(pet.status)}
                                </div>
                            </Card.Header>
                            
                            <Card.Body className="p-4">
                                {/* Галерея изображений */}
                                <div className="mb-5">
                                    {pet.images.length > 0 ? (
                                        <>
                                            <Carousel 
                                                activeIndex={activeImageIndex} 
                                                onSelect={setActiveImageIndex}
                                                indicators={pet.images.length > 1}
                                                controls={pet.images.length > 1}
                                                className="mb-3"
                                            >
                                                {pet.images.map((img, index) => (
                                                    <Carousel.Item key={index}>
                                                        <div 
                                                            className="d-flex justify-content-center align-items-center" 
                                                            style={{ 
                                                                height: '400px',
                                                                backgroundColor: '#f8f9fa',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            <img
                                                                src={img}
                                                                alt={`${pet.title} - фото ${index + 1}`}
                                                                className="img-fluid"
                                                                style={{ 
                                                                    maxHeight: '100%',
                                                                    maxWidth: '100%',
                                                                    objectFit: 'contain'
                                                                }}
                                                                onError={handleImageError}
                                                            />
                                                        </div>
                                                    </Carousel.Item>
                                                ))}
                                            </Carousel>
                                            
                                            {pet.images.length > 1 && (
                                                <div className="d-flex flex-wrap gap-2 mt-3">
                                                    {pet.images.map((img, index) => (
                                                        <div 
                                                            key={index}
                                                            className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                                                            style={{ 
                                                                width: '80px', 
                                                                height: '60px',
                                                                cursor: 'pointer',
                                                                border: index === activeImageIndex ? '3px solid #0d6efd' : '1px solid #dee2e6',
                                                                borderRadius: '4px',
                                                                overflow: 'hidden'
                                                            }}
                                                            onClick={() => setActiveImageIndex(index)}
                                                        >
                                                            <img
                                                                src={img}
                                                                alt={`Миниатюра ${index + 1}`}
                                                                className="w-100 h-100"
                                                                style={{ objectFit: 'cover' }}
                                                                onError={handleImageError}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-5 bg-light rounded">
                                            <div className="display-1 mb-3 text-muted">
                                                <i className="bi bi-image"></i>
                                            </div>
                                            <p className="text-muted">Изображения отсутствуют</p>
                                        </div>
                                    )}
                                </div>

                                {/* Описание */}
                                <div className="mb-5">
                                    <h3 className="h4 text-primary mb-3">
                                        <i className="bi bi-chat-left-text me-2"></i>
                                        Описание
                                    </h3>
                                    <div className="p-3 bg-light rounded">
                                        <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                                            {pet.description || 'Описание отсутствует'}
                                        </p>
                                    </div>
                                </div>

                                {/* Информация о животном согласно ТЗ */}
                                <div className="mb-5">
                                    <h3 className="h4 text-primary mb-3">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Информация о находке
                                    </h3>
                                    <Row>
                                        <Col md={6} className="mb-3">
                                            <div className="d-flex align-items-start">
                                                <div className="me-3 text-primary">
                                                    <i className="bi bi-tag fs-4"></i>
                                                </div>
                                                <div>
                                                    <small className="text-muted d-block">Вид животного</small>
                                                    <strong>{pet.kind}</strong>
                                                </div>
                                            </div>
                                        </Col>
                                        
                                        <Col md={6} className="mb-3">
                                            <div className="d-flex align-items-start">
                                                <div className="me-3 text-primary">
                                                    <i className="bi bi-geo-alt fs-4"></i>
                                                </div>
                                                <div>
                                                    <small className="text-muted d-block">Район</small>
                                                    <strong>{pet.district}</strong>
                                                </div>
                                            </div>
                                        </Col>
                                        
                                        {pet.mark && (
                                            <Col md={6} className="mb-3">
                                                <div className="d-flex align-items-start">
                                                    <div className="me-3 text-primary">
                                                        <i className="bi bi-tags fs-4"></i>
                                                    </div>
                                                    <div>
                                                        <small className="text-muted d-block">Клеймо/Чип</small>
                                                        <strong>{pet.mark}</strong>
                                                    </div>
                                                </div>
                                            </Col>
                                        )}
                                        
                                        <Col md={6} className="mb-3">
                                            <div className="d-flex align-items-start">
                                                <div className="me-3 text-primary">
                                                    <i className="bi bi-calendar-date fs-4"></i>
                                                </div>
                                                <div>
                                                    <small className="text-muted d-block">Дата находки</small>
                                                    <strong>{formatDate(pet.date)}</strong>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>

                    {/* Боковая панель */}
                    <div className="col-lg-4">
                        {/* Контакты согласно ТЗ */}
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Header className="bg-primary text-white py-3">
                                <h5 className="mb-0">
                                    <i className="bi bi-telephone me-2"></i>
                                    Контактная информация
                                </h5>
                            </Card.Header>
                            
                            <Card.Body className="p-4">
                                {/* Автор */}
                                {pet.name && (
                                    <div className="mb-4">
                                        <h6 className="text-primary mb-3">
                                            <i className="bi bi-person me-2"></i>
                                            Автор объявления
                                        </h6>
                                        <div className="d-flex align-items-center bg-light p-3 rounded">
                                            <div className="flex-shrink-0 me-3">
                                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                                                     style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-person fs-5"></i>
                                                </div>
                                            </div>
                                            <div>
                                                <strong>{pet.name}</strong>
                                                {pet.registered && (
                                                    <div className="text-success small">
                                                        <i className="bi bi-check-circle me-1"></i>
                                                        Зарегистрированный пользователь
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Контакты - скрыты по умолчанию */}
                                {!contactVisible ? (
                                    <div className="text-center py-3">
                                        <div className="display-1 mb-3 text-muted">
                                            <i className="bi bi-shield-lock"></i>
                                        </div>
                                        <p className="text-muted mb-3">
                                            Контакты скрыты для защиты приватности автора
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
                                            <div className="mb-4">
                                                <h6 className="text-primary mb-3">
                                                    <i className="bi bi-phone me-2"></i>
                                                    Телефон
                                                </h6>
                                                <div className="bg-light p-3 rounded">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <a 
                                                            href={`tel:${pet.phone}`} 
                                                            className="text-decoration-none fs-5"
                                                        >
                                                            {pet.phone}
                                                        </a>
                                                        <Button 
                                                            variant="outline-primary" 
                                                            size="sm"
                                                            onClick={() => copyToClipboard(pet.phone, 'Телефон')}
                                                            title="Копировать номер"
                                                        >
                                                            <i className="bi bi-copy"></i>
                                                        </Button>
                                                    </div>
                                                    <div className="mt-2">
                                                        <Button 
                                                            variant="success" 
                                                            size="sm"
                                                            className="me-2"
                                                            as="a"
                                                            href={`tel:${pet.phone}`}
                                                        >
                                                            <i className="bi bi-telephone me-1"></i> Позвонить
                                                        </Button>
                                                        <Button 
                                                            variant="info" 
                                                            size="sm"
                                                            as="a"
                                                            href={`sms:${pet.phone}`}
                                                        >
                                                            <i className="bi bi-chat me-1"></i> SMS
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {pet.email && (
                                            <div className="mb-4">
                                                <h6 className="text-primary mb-3">
                                                    <i className="bi bi-envelope me-2"></i>
                                                    Email
                                                </h6>
                                                <div className="bg-light p-3 rounded">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <a 
                                                            href={`mailto:${pet.email}`} 
                                                            className="text-decoration-none"
                                                        >
                                                            {pet.email}
                                                        </a>
                                                        <Button 
                                                            variant="outline-primary" 
                                                            size="sm"
                                                            onClick={() => copyToClipboard(pet.email, 'Email')}
                                                            title="Копировать email"
                                                        >
                                                            <i className="bi bi-copy"></i>
                                                        </Button>
                                                    </div>
                                                    <Button 
                                                        variant="primary" 
                                                        size="sm"
                                                        className="mt-2"
                                                        as="a"
                                                        href={`mailto:${pet.email}`}
                                                    >
                                                        <i className="bi bi-envelope me-1"></i> Написать
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {(!pet.phone && !pet.email) && (
                                            <div className="text-center py-4">
                                                <div className="display-1 mb-3 text-muted">
                                                    <i className="bi bi-slash-circle"></i>
                                                </div>
                                                <p className="text-muted">Контактная информация отсутствует</p>
                                            </div>
                                        )}
                                        
                                        <Button 
                                            variant="outline-secondary" 
                                            className="w-100 mt-3"
                                            onClick={() => setContactVisible(false)}
                                        >
                                            <i className="bi bi-eye-slash me-2"></i>
                                            Скрыть контакты
                                        </Button>
                                    </div>
                                )}
                                
                                <hr className="my-4" />
                                
                                {/* Быстрые действия */}
                                <div className="d-grid gap-2">
                                    <Button 
                                        variant="primary"
                                        onClick={() => navigate('/add-pet')}
                                        className="py-2"
                                    >
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Добавить объявление
                                    </Button>
                                    
                                    <Button 
                                        variant="outline-primary"
                                        onClick={() => navigate('/search')}
                                        className="py-2"
                                    >
                                        <i className="bi bi-search me-2"></i>
                                        Поиск животных
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Полезная информация */}
                        <Card className="shadow-sm border-0">
                            <Card.Header className="bg-light py-3">
                                <h6 className="mb-0">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Что делать, если вы узнали животное?
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <ul className="list-unstyled mb-0">
                                    <li className="mb-2">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        Свяжитесь с автором объявления
                                    </li>
                                    <li className="mb-2">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        Предоставьте доказательства владения
                                    </li>
                                    <li className="mb-2">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        Договоритесь о встрече в безопасном месте
                                    </li>
                                    <li>
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        После воссоединения сообщите об этом администрации
                                    </li>
                                </ul>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="text-center py-5">
                    <div className="display-1 mb-3 text-muted">
                        <i className="bi bi-exclamation-circle"></i>
                    </div>
                    <h3 className="mb-3">Животное не найдено</h3>
                    <p className="text-muted mb-4">
                        Объявление с ID {id} не существует или было удалено.
                    </p>
                    <Button 
                        variant="primary"
                        onClick={() => navigate('/search')}
                        className="me-2"
                    >
                        <i className="bi bi-search me-1"></i>
                        Поиск животных
                    </Button>
                    <Button 
                        variant="outline-primary"
                        onClick={() => navigate('/')}
                    >
                        <i className="bi bi-house me-1"></i>
                        На главную
                    </Button>
                </div>
            )}

            {/* Навигация */}
            {pet && (
                <div className="d-flex justify-content-between align-items-center mt-4 pt-4 border-top">
                    <Button 
                        variant="outline-secondary"
                        onClick={() => navigate(-1)}
                        className="px-4 py-2"
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Назад
                    </Button>
                    
                    <div className="d-flex gap-2">
                        <Button 
                            variant="outline-primary"
                            onClick={() => window.print()}
                            className="px-4 py-2"
                        >
                            <i className="bi bi-printer me-2"></i>
                            Печать
                        </Button>
                        
                        <Button 
                            variant="primary"
                            onClick={() => navigate('/search')}
                            className="px-4 py-2"
                        >
                            <i className="bi bi-search me-2"></i>
                            Поиск животных
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PetCard;