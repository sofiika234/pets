import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Carousel, Card, Button, Spinner, Badge } from 'react-bootstrap';
import labradorImg from '../assets/labrador.jpg';
import catImg from '../assets/cat.jpg';

function Main() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [stories, setStories] = useState([]);
    const [recentPets, setRecentPets] = useState([]);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
    const [newsletterMessage, setNewsletterMessage] = useState('');

    // Моковые данные для историй успеха
    const successStories = [
        {
            id: 1,
            image: labradorImg,
            title: 'Барсик нашел дом',
            description: 'После 2 месяцев поисков Барсик обрел любящую семью с двумя детьми',
            date: '2024-01-15'
        },
        {
            id: 2,
            image: labradorImg,
            title: 'Шарик вернулся домой',
            description: 'Потерявшийся пес через неделю был найден и возвращен хозяевам',
            date: '2024-01-14'
        },
        {
            id: 3,
            image: catImg,
            title: 'Мурка обрела семью',
            description: 'Пушистая красавица нашла новых хозяев в пригороде',
            date: '2024-01-12'
        },
        {
            id: 4,
            image: labradorImg,
            title: 'Рекс нашел друга',
            description: 'Энергичный щенок теперь играет с ребенком в большом доме',
            date: '2024-01-10'
        },
        {
            id: 5,
            image: catImg,
            title: 'Снежок в тепле',
            description: 'Белый котик переехал в квартиру с камином',
            date: '2024-01-08'
        },
        {
            id: 6,
            image: labradorImg,
            title: 'Люси и ее новые друзья',
            description: 'Добродушная собака теперь живет с другими питомцами',
            date: '2024-01-05'
        }
    ];

    // Моковые данные для последних найденных животных
    const mockPets = [
        { 
            id: 1, 
            name: 'Мурка', 
            date: '2024-01-15', 
            type: 'Кошка', 
            district: 'Центральный', 
            image: catImg,
            description: 'Ласковая кошка с белой шерстью, найдена в центре города возле парка' 
        },
        { 
            id: 2, 
            name: 'Дружок', 
            date: '2024-01-14', 
            type: 'Собака', 
            district: 'Северный',
            image: labradorImg,
            description: 'Дружелюбный пес средних размеров, очень активный и игривый' 
        },
        { 
            id: 3, 
            name: 'Рыжик', 
            date: '2024-01-13', 
            type: 'Кот', 
            district: 'Южный',
            image: catImg,
            description: 'Игривый котенок с яркой рыжей шерстью, найден у метро' 
        },
        { 
            id: 4, 
            name: 'Бобик', 
            date: '2024-01-12', 
            type: 'Собака', 
            district: 'Западный',
            image: labradorImg,
            description: 'Верный и преданный друг, отлично ладит с детьми' 
        },
        { 
            id: 5, 
            name: 'Васька', 
            date: '2024-01-11', 
            type: 'Кот', 
            district: 'Восточный',
            image: catImg,
            description: 'Спокойный и мудрый кот, любит уют и домашнюю атмосферу' 
        },
        { 
            id: 6, 
            name: 'Шарик', 
            date: '2024-01-10', 
            type: 'Собака', 
            district: 'Центральный',
            image: labradorImg,
            description: 'Энергичный щенок, обожает активные игры и прогулки' 
        }
    ];

    useEffect(() => {
        // Имитация загрузки данных
        const timer = setTimeout(() => {
            setStories(successStories);
            setRecentPets(mockPets);
            setIsLoading(false);
            
            // Анимация слогана
            animateSlogan();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const animateSlogan = () => {
        const sloganParts = document.querySelectorAll('.slogan-part');
        const sloganSubtext = document.querySelector('.slogan-subtext');
        const decoration = document.querySelector('.slogan-decoration');
        
        if (sloganParts.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animation = 'none';
                        setTimeout(() => {
                            entry.target.style.animation = '';
                        }, 10);
                    }
                });
            }, { threshold: 0.5 });
            
            sloganParts.forEach(part => observer.observe(part));
            if (sloganSubtext) observer.observe(sloganSubtext);
            if (decoration) observer.observe(decoration);
        }
    };

    const handleViewPet = (petId) => {
        navigate(`/pet/${petId}`);
    };

    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        
        if (!newsletterEmail || !validateEmail(newsletterEmail)) {
            setNewsletterMessage('Пожалуйста, введите корректный email');
            return;
        }
        
        // Имитация отправки
        setNewsletterSubmitted(true);
        setNewsletterMessage('Вы успешно подписались на новости! Будем держать вас в курсе новых объявлений.');
        
        // Сброс через 5 секунд
        setTimeout(() => {
            setNewsletterSubmitted(false);
            setNewsletterEmail('');
            setNewsletterMessage('');
        }, 5000);
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch (e) {
            return dateString;
        }
    };

    const getAnimalTypeText = (type) => {
        const typeMap = {
            'Кошка': 'Кошка',
            'Собака': 'Собака',
            'Кот': 'Кот',
            'cat': 'Кошка',
            'dog': 'Собака'
        };
        return typeMap[type] || type;
    };

    return (
        <main>
            {/* Слоган */}
            <section className="py-5 bg-light" aria-labelledby="main-slogan">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 text-center">
                            <div className="slogan-container">
                                <h1 id="main-slogan" className="slogan-text display-5 fw-bold text-primary mb-3">
                                    <span className="slogan-part">Каждое животное</span>
                                    <span className="slogan-part">заслуживает</span>
                                    <span className="slogan-part">любящий дом</span>
                                </h1>
                                <p className="slogan-subtext lead text-muted">
                                    Объединяем сердца людей и лапы животных. Вместе мы можем изменить жизни!
                                </p>
                                <div className="slogan-decoration mt-4" aria-hidden="true">
                                    <div className="decoration-dot"></div>
                                    <div className="decoration-dot"></div>
                                    <div className="decoration-dot"></div>
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
                        Найденные животные
                    </h2>
                    <p className="text-center mb-4 text-muted">Истории успеха: питомцы, которые уже обрели дом</p>
                    
                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Загрузка историй успеха...</p>
                        </div>
                    ) : (
                        <Carousel 
                            interval={4000} 
                            pause="hover" 
                            className="shadow rounded"
                            indicators={false}
                        >
                            {stories.map((story, index) => (
                                <Carousel.Item key={story.id}>
                                    <div className="position-relative">
                                        <img
                                            className="d-block w-100"
                                            src={story.image}
                                            alt={story.title}
                                            style={{ 
                                                height: '500px', 
                                                objectFit: 'cover',
                                                filter: 'brightness(0.7)'
                                            }}
                                        />
                                        <div className="carousel-caption d-flex flex-column justify-content-center h-100">
                                            <div className="caption-content bg-dark bg-opacity-50 p-4 rounded">
                                                <h3 className="display-6 mb-3">{story.title}</h3>
                                                <p className="lead">{story.description}</p>
                                                <p className="text-light opacity-75">
                                                    <i className="bi bi-calendar-check me-2"></i>
                                                    Найден дом: {formatDate(story.date)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Carousel.Item>
                            ))}
                        </Carousel>
                    )}
                </div>
            </section>

            {/* Последние найденные животные */}
            <section className="py-5" aria-labelledby="recent-pets-heading">
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
                    ) : (
                        <div className="row">
                            {recentPets.map(pet => (
                                <div key={pet.id} className="col-lg-4 col-md-6 mb-4">
                                    <Card className="h-100 shadow-sm hover-shadow transition-all">
                                        <div className="position-relative">
                                            <Card.Img 
                                                variant="top" 
                                                src={pet.image}
                                                alt={pet.name}
                                                style={{ height: '250px', objectFit: 'cover' }}
                                            />
                                            <div className="position-absolute top-0 end-0 m-2">
                                                <Badge bg="primary">{pet.type}</Badge>
                                            </div>
                                        </div>
                                        <Card.Body className="d-flex flex-column">
                                            <Card.Title className="text-primary">{pet.name}</Card.Title>
                                            <Card.Text className="flex-grow-1">{pet.description}</Card.Text>
                                            <div className="mt-auto">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <span className="text-muted">
                                                        <i className="bi bi-geo-alt me-1"></i>
                                                        {pet.district}
                                                    </span>
                                                    <span className="text-muted">
                                                        <i className="bi bi-calendar me-1"></i>
                                                        {formatDate(pet.date)}
                                                    </span>
                                                </div>
                                                <Button 
                                                    variant="outline-primary" 
                                                    className="w-100"
                                                    onClick={() => handleViewPet(pet.id)}
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
                    )}
                    
                    <div className="text-center mt-5">
                        <Button 
                            variant="primary" 
                            size="lg"
                            onClick={() => navigate('/search')}
                        >
                            <i className="bi bi-search me-2"></i>
                            Найти больше животных
                        </Button>
                    </div>
                </div>
            </section>

            {/* Преимущества */}
            <section className="py-5 bg-light" aria-labelledby="features-heading">
                <div className="container">
                    <h2 id="features-heading" className="text-center mb-5 text-primary">
                        Почему выбирают нас
                    </h2>
                    
                    <div className="row text-center">
                        <div className="col-md-4 mb-4">
                            <div className="feature-card p-4 h-100 rounded shadow-sm bg-white">
                                <div className="feature-icon mb-3">
                                    <span className="display-1">🏠</span>
                                </div>
                                <h3 className="h4 text-primary mb-3">Найдите дом</h3>
                                <p className="text-muted">
                                    Помогите животному обрести любящую семью. Мы обеспечиваем безопасное и ответственное устройство.
                                </p>
                            </div>
                        </div>
                        
                        <div className="col-md-4 mb-4">
                            <div className="feature-card p-4 h-100 rounded shadow-sm bg-white">
                                <div className="feature-icon mb-3">
                                    <span className="display-1">🔍</span>
                                </div>
                                <h3 className="h4 text-primary mb-3">Быстрый поиск</h3>
                                <p className="text-muted">
                                    Мощные инструменты для поиска потерявшихся питомцев с фильтрами по местоположению и виду.
                                </p>
                            </div>
                        </div>
                        
                        <div className="col-md-4 mb-4">
                            <div className="feature-card p-4 h-100 rounded shadow-sm bg-white">
                                <div className="feature-icon mb-3">
                                    <span className="display-1">❤️</span>
                                </div>
                                <h3 className="h4 text-primary mb-3">Сообщество</h3>
                                <p className="text-muted">
                                    Присоединяйтесь к тысячам волонтеров, которые ежедневно помогают животным по всей стране.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Подписка на новости */}
            <section className="py-5" aria-labelledby="newsletter-heading">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-6">
                            <Card className="border-0 shadow-lg">
                                <Card.Body className="text-center p-5">
                                    <div className="feature-icon mb-4">
                                        <span className="display-1">📧</span>
                                    </div>
                                    <Card.Title id="newsletter-heading" className="h2 text-primary mb-3">
                                        Подписка на новости
                                    </Card.Title>
                                    <p className="text-muted mb-4 lead">
                                        Будьте в курсе новых объявлений и успешных историй
                                    </p>
                                    
                                    {!newsletterSubmitted ? (
                                        <form onSubmit={handleNewsletterSubmit}>
                                            <div className="input-group input-group-lg mb-3">
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    placeholder="Ваш email"
                                                    value={newsletterEmail}
                                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                                    required
                                                />
                                                <Button variant="primary" type="submit">
                                                    Подписаться
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="alert alert-success" role="alert">
                                            <h4 className="alert-heading">Спасибо за подписку!</h4>
                                            <p>{newsletterMessage}</p>
                                        </div>
                                    )}
                                    
                                    <p className="text-muted small mt-3">
                                        Мы не спамим. Отписаться можно в любой момент.
                                    </p>
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