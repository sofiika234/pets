import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Carousel, Card, Button, Spinner } from 'react-bootstrap';
import { petsApi, api } from '../../utils/api';

function Main() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [stories, setStories] = useState([]);
    const [recentPets, setRecentPets] = useState([]);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
    const [newsletterMessage, setNewsletterMessage] = useState('');
    const [newsletterError, setNewsletterError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                // Загрузка слайдера
                try {
                    const sliderResponse = await petsApi.getSlider();
                    console.log('Slider response:', sliderResponse);
                    
                    // Обрабатываем разные форматы ответа
                    let sliderData = sliderResponse;
                    
                    // Если ответ имеет структуру {data: {...}}
                    if (sliderResponse && sliderResponse.data) {
                        sliderData = sliderResponse.data;
                    }
                    
                    // Проверяем наличие pets или orders в ответе
                    const pets = sliderData.pets || sliderData.orders || sliderData;
                    
                    if (pets && Array.isArray(pets) && pets.length > 0) {
                        const formattedStories = pets.slice(0, 5).map(pet => ({
                            id: pet.id || Math.random(),
                            image: getCorrectImageUrl(pet.image || pet.photos || pet.photo),
                            title: pet.kind || pet.type || 'Найдено животное',
                            description: pet.description || 'Питомец нашел дом',
                            date: pet.date || pet.created_at || new Date().toISOString().split('T')[0]
                        }));
                        setStories(formattedStories);
                    } else {
                        // Если слайдер пустой, используем дефолтные данные
                        setStories([
                            {
                                id: 1,
                                image: getDefaultImage(),
                                title: 'Истории успеха',
                                description: 'Питомцы, которые обрели новый дом благодаря нашему сервису',
                                date: '2024-01-15'
                            }
                        ]);
                    }
                } catch (sliderError) {
                    console.log('Слайдер ошибка:', sliderError);
                    // Дефолтные данные для слайдера
                    setStories([
                        {
                            id: 1,
                            image: getDefaultImage(),
                            title: 'Истории успеха',
                            description: 'Питомцы, которые обрели новый дом благодаря нашему сервису',
                            date: '2024-01-15'
                        }
                    ]);
                }

                // Загрузка последних животных
                try {
                    const petsResponse = await petsApi.getRecentPets();
                    console.log('Recent pets response:', petsResponse);
                    
                    // Обрабатываем разные форматы ответа
                    let petsData = petsResponse;
                    
                    // Если ответ имеет структуру {data: {...}}
                    if (petsResponse && petsResponse.data) {
                        petsData = petsResponse.data;
                    }
                    
                    // Проверяем наличие orders или pets в ответе
                    const orders = petsData.orders || petsData.pets || petsData;
                    
                    if (orders && Array.isArray(orders)) {
                        const formattedPets = orders.slice(0, 6).map(order => ({
                            id: order.id || Math.random(),
                            name: order.kind || order.type || 'Без имени',
                            date: order.date || order.created_at || new Date().toISOString().split('T')[0],
                            type: order.kind || order.type || 'Неизвестно',
                            district: order.district || order.location || 'Не указан',
                            image: getCorrectImageUrl(order.photos || order.photo || order.image),
                            description: order.description || 'Нет описания',
                            phone: order.phone || '',
                            email: order.email || '',
                            status: order.status || 'active'
                        }));
                        setRecentPets(formattedPets);
                    } else {
                        // Если нет данных, используем дефолтные
                        setRecentPets([
                            { 
                                id: 1, 
                                name: 'Собака', 
                                date: '2024-01-15', 
                                type: 'Собака', 
                                district: 'Центральный', 
                                image: getDefaultImage(),
                                description: 'Найдена дружелюбная собака в центре города' 
                            },
                            { 
                                id: 2, 
                                name: 'Кошка', 
                                date: '2024-01-14', 
                                type: 'Кошка', 
                                district: 'Северный', 
                                image: getDefaultImage(),
                                description: 'Котенок ищет дом' 
                            }
                        ]);
                    }
                } catch (petsError) {
                    console.log('Recent pets ошибка:', petsError);
                    // Дефолтные данные для карточек
                    setRecentPets([
                        { 
                            id: 1, 
                            name: 'Собака', 
                            date: '2024-01-15', 
                            type: 'Собака', 
                            district: 'Центральный', 
                            image: getDefaultImage(),
                            description: 'Найдена дружелюбная собака в центре города' 
                        },
                        { 
                            id: 2, 
                            name: 'Кошка', 
                            date: '2024-01-14', 
                            type: 'Кошка', 
                            district: 'Северный', 
                            image: getDefaultImage(),
                            description: 'Котенок ищет дом' 
                        }
                    ]);
                }
            } catch (error) {
                console.error('Общая ошибка загрузки:', error);
                // Моковые данные при ошибке
                setStories([
                    {
                        id: 1,
                        image: getDefaultImage(),
                        title: 'Истории успеха',
                        description: 'Питомцы, которые обрели новый дом благодаря нашему сервису',
                        date: '2024-01-15'
                    }
                ]);
                setRecentPets([
                    { 
                        id: 1, 
                        name: 'Пример животного', 
                        date: '2024-01-15', 
                        type: 'Кошка', 
                        district: 'Центральный', 
                        image: getDefaultImage(),
                        description: 'Это демонстрационная карточка животного' 
                    }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Функция для получения корректного URL изображения
    const getCorrectImageUrl = (imagePath) => {
        if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
            return getDefaultImage();
        }
        
        // Если путь уже полный URL
        if (typeof imagePath === 'string' && 
            (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
            return imagePath;
        }
        
        // Если это массив фото, берем первое
        if (Array.isArray(imagePath) && imagePath.length > 0) {
            const firstImage = imagePath[0];
            return getCorrectImageUrl(firstImage);
        }
        
        // Если это строка, пробуем получить через api.getImageUrl
        if (typeof imagePath === 'string') {
            // Убираем начальный слеш если есть
            const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
            
            try {
                // Проверяем, есть ли метод getImageUrl
                if (api && typeof api.getImageUrl === 'function') {
                    return api.getImageUrl(cleanPath);
                }
                
                // Или пробуем сформировать URL вручную
                if (cleanPath.includes('storage/')) {
                    return `https://pets.сделай.site/${cleanPath}`;
                }
                
                return `https://pets.сделай.site/storage/${cleanPath}`;
            } catch (error) {
                console.error('Ошибка получения URL изображения:', error);
                return getDefaultImage();
            }
        }
        
        return getDefaultImage();
    };

    // Функция для получения дефолтного изображения
    const getDefaultImage = () => {
        // Используем относительный путь к изображению в public
        return '/images/default-pet.png';
    };

    const handleViewPet = (petId) => {
        navigate(`/pet/${petId}`);
    };

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();
        setNewsletterError('');
        
        if (!newsletterEmail) {
            setNewsletterError('Пожалуйста, введите email');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newsletterEmail)) {
            setNewsletterError('Пожалуйста, введите корректный email');
            return;
        }
        
        try {
            await api.post('/subscription', { email: newsletterEmail });
            setNewsletterSubmitted(true);
            setNewsletterMessage('Вы успешно подписались на новости!');
            
            setTimeout(() => {
                setNewsletterSubmitted(false);
                setNewsletterEmail('');
                setNewsletterMessage('');
                setNewsletterError('');
            }, 5000);
        } catch (error) {
            console.error('Ошибка подписки:', error);
            if (error.status === 422) {
                setNewsletterError('Ошибка валидации email');
            } else {
                setNewsletterError('Ошибка при подписке. Попробуйте позже.');
            }
        }
    };

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

    return (
        <main>
            {/* Слоган */}
            <section className="py-5 bg-primary bg-opacity-10 position-relative" aria-labelledby="main-slogan">
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-white opacity-10"></div>
                <div className="container position-relative z-1">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 text-center">
                            <div className="slogan-container">
                                <h1 id="main-slogan" className="slogan-text display-5 fw-bold text-primary mb-3">
                                    <span className="d-block">Каждое животное</span>
                                    <span className="d-block">заслуживает</span>
                                    <span className="d-block">любящий дом</span>
                                </h1>
                                <p className="slogan-subtext lead text-dark mb-4">
                                    Объединяем сердца людей и лапы животных. Вместе мы можем изменить жизни!
                                </p>
                                
                                <div className="mt-4 pt-3 border-top border-primary border-opacity-25">
                                    <p className="text-muted small">
                                        Начните с просмотра животных, ожидающих хозяев, или подпишитесь на наши новости
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Слайдер с найденными животными */}
            <section className="py-5" aria-labelledby="success-stories-heading">
                <div className="container">
                    <h2 id="success-stories-heading" className="text-center mb-4 text-primary">
                        Успешные истории
                    </h2>
                    <p className="text-center mb-4 text-muted">Питомцы, которые уже обрели дом благодаря нашему сервису</p>
                    
                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Загрузка историй успеха...</p>
                        </div>
                    ) : stories.length > 0 ? (
                        <Carousel 
                            interval={4000} 
                            pause="hover" 
                            className="shadow-lg rounded overflow-hidden"
                        >
                            {stories.map((story, index) => (
                                <Carousel.Item key={story.id}>
                                    <div className="position-relative" style={{ height: '500px' }}>
                                        <img
                                            className="d-block w-100 h-100"
                                            src={story.image}
                                            alt={story.title}
                                            style={{ 
                                                objectFit: 'cover',
                                                filter: 'brightness(0.8)'
                                            }}
                                            onError={(e) => {
                                                e.target.src = getDefaultImage();
                                                e.target.onerror = null; // Предотвращаем бесконечный цикл ошибок
                                            }}
                                        />
                                        <div className="carousel-caption d-flex flex-column justify-content-center h-100">
                                            <div className="caption-content bg-dark bg-opacity-60 p-4 rounded">
                                                <h3 className="display-6 mb-3 text-white">{story.title}</h3>
                                                <p className="lead text-white">{story.description}</p>
                                                <p className="text-light opacity-90">
                                                    <i className="bi bi-calendar-check me-2"></i>
                                                    Найден дом: {formatDate(story.date)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Carousel.Item>
                            ))}
                        </Carousel>
                    ) : (
                        <div className="text-center py-5 bg-light rounded">
                            <div className="display-1 mb-3">🐾</div>
                            <h4>Пока нет успешных историй</h4>
                            <p className="text-muted">Будьте первым, кто поможет животному найти дом!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Последние найденные животные */}
            <section className="py-5 bg-light" aria-labelledby="recent-pets-heading">
                <div className="container">
                    <h2 id="recent-pets-heading" className="text-center mb-4 text-primary">
                        Ожидают хозяев
                    </h2>
                    <p className="text-center mb-5 text-muted">
                        Животные, которые ищут дом прямо сейчас
                    </p>
                    
                    {isLoading ? (
                        <div className="text-center">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Загрузка списка животных...</p>
                        </div>
                    ) : recentPets.length > 0 ? (
                        <div className="row">
                            {recentPets.map(pet => (
                                <div key={pet.id} className="col-lg-4 col-md-6 mb-4">
                                    <Card className="h-100 shadow-sm border-0 hover-shadow transition-all">
                                        <div className="position-relative" style={{ height: '250px', overflow: 'hidden' }}>
                                            <Card.Img 
                                                variant="top" 
                                                src={pet.image}
                                                alt={pet.name}
                                                style={{ 
                                                    height: '100%', 
                                                    width: '100%', 
                                                    objectFit: 'cover' 
                                                }}
                                                onError={(e) => {
                                                    e.target.src = getDefaultImage();
                                                    e.target.onerror = null; // Предотвращаем бесконечный цикл ошибок
                                                }}
                                            />
                                        </div>
                                        <Card.Body className="d-flex flex-column">
                                            <Card.Title className="text-primary">{pet.name}</Card.Title>
                                            <Card.Text className="flex-grow-1" style={{ 
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {pet.description}
                                            </Card.Text>
                                            <div className="mt-auto">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <span className="badge bg-primary">{pet.type}</span>
                                                    <span className="text-muted">
                                                        <i className="bi bi-geo-alt me-1"></i>
                                                        {pet.district}
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <small className="text-muted">
                                                        <i className="bi bi-calendar me-1"></i>
                                                        {formatDate(pet.date)}
                                                    </small>
                                                </div>
                                                <Button 
                                                    variant="outline-primary" 
                                                    className="w-100"
                                                    onClick={() => handleViewPet(pet.id)}
                                                >
                                                    Подробнее
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <div className="display-1 mb-3">🐕</div>
                            <h4>Пока нет животных, ожидающих хозяев</h4>
                            <p className="text-muted mb-4">Но скоро они появятся!</p>
                        </div>
                    )}
                    
                    {recentPets.length > 0 && (
                        <div className="text-center mt-5">
                            <Button 
                                variant="primary" 
                                size="lg"
                                onClick={() => navigate('/search')}
                            >
                                Найти больше животных
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Преимущества */}
            <section className="py-5" aria-labelledby="features-heading">
                <div className="container">
                    <h2 id="features-heading" className="text-center mb-5 text-primary">
                        Почему выбирают нас
                    </h2>
                    
                    <div className="row text-center">
                        <div className="col-md-4 mb-4">
                            <div className="feature-card p-4 h-100 rounded shadow-sm bg-white border">
                                <div className="feature-icon mb-3">
                                    <span className="display-1 text-primary">🏠</span>
                                </div>
                                <h3 className="h4 text-primary mb-3">Найдите дом</h3>
                                <p className="text-muted">
                                    Помогите животному обрести любящую семью. Простая система добавления и поиска объявлений.
                                </p>
                            </div>
                        </div>
                        
                        <div className="col-md-4 mb-4">
                            <div className="feature-card p-4 h-100 rounded shadow-sm bg-white border">
                                <div className="feature-icon mb-3">
                                    <span className="display-1 text-primary">🔍</span>
                                </div>
                                <h3 className="h4 text-primary mb-3">Быстрый поиск</h3>
                                <p className="text-muted">
                                    Мощные инструменты для поиска потерявшихся питомцев по району, типу животного и дате.
                                </p>
                            </div>
                        </div>
                        
                        <div className="col-md-4 mb-4">
                            <div className="feature-card p-4 h-100 rounded shadow-sm bg-white border">
                                <div className="feature-icon mb-3">
                                    <span className="display-1 text-primary">❤️</span>
                                </div>
                                <h3 className="h4 text-primary mb-3">Сообщество</h3>
                                <p className="text-muted">
                                    Присоединяйтесь к тысячам волонтеров и неравнодушных людей, помогающих животным.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Подписка на новости */}
            <section className="py-5 bg-primary bg-opacity-10" aria-labelledby="newsletter-heading">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <Card className="border-0 shadow bg-white">
                                <Card.Body className="text-center p-5">
                                    <div className="feature-icon mb-3">
                                        <span className="display-1 text-primary">📧</span>
                                    </div>
                                    <Card.Title id="newsletter-heading" className="h2 text-primary mb-3">
                                        Подписка на новости
                                    </Card.Title>
                                    <p className="text-muted mb-4">
                                        Будьте в курсе новых объявлений и успешных историй. Получайте уведомления о найденных животных в вашем районе.
                                    </p>
                                    
                                    {!newsletterSubmitted ? (
                                        <form onSubmit={handleNewsletterSubmit} className="mx-auto" style={{ maxWidth: '500px' }}>
                                            <div className="input-group mb-3">
                                                <input
                                                    type="email"
                                                    className={`form-control ${newsletterError ? 'is-invalid' : ''}`}
                                                    placeholder="Ваш email"
                                                    value={newsletterEmail}
                                                    onChange={(e) => {
                                                        setNewsletterEmail(e.target.value);
                                                        setNewsletterError('');
                                                    }}
                                                    required
                                                />
                                                <Button variant="primary" type="submit">
                                                    Подписаться
                                                </Button>
                                            </div>
                                            {newsletterError && (
                                                <div className="invalid-feedback d-block">{newsletterError}</div>
                                            )}
                                            <p className="text-muted small">
                                                Подписываясь, вы соглашаетесь с обработкой персональных данных
                                            </p>
                                        </form>
                                    ) : (
                                        <div className="alert alert-success mx-auto" style={{ maxWidth: '500px' }} role="alert">
                                            {newsletterMessage}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Main;