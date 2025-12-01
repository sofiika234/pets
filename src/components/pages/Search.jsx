import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Badge, Pagination, Form, Spinner } from 'react-bootstrap';
import labradorImg from '../assets/labrador.jpg';
import catImg from '../assets/cat.jpg';

function Search() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useState({
        district: '',
        type: ''
    });
    const [searchResults, setSearchResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [itemsPerPage] = useState(9); // 3 ряда по 3 карточки

    // Моковые данные всех животных
    const allPets = [
        { id: 1, name: 'Мурка', date: '2024-01-15', type: 'Кошка', district: 'Центральный', 
          image: catImg, description: 'Ласковая кошка с белой шерстью, найдена в центре города возле парка' },
        { id: 2, name: 'Дружок', date: '2024-01-14', type: 'Собака', district: 'Северный',
          image: labradorImg, description: 'Дружелюбный пес средних размеров, очень активный и игривый' },
        { id: 3, name: 'Рыжик', date: '2024-01-13', type: 'Кот', district: 'Южный',
          image: catImg, description: 'Игривый котенок с яркой рыжей шерстью, найден у метро' },
        { id: 4, name: 'Бобик', date: '2024-01-12', type: 'Собака', district: 'Западный',
          image: labradorImg, description: 'Верный и преданный друг, отлично ладит с детьми' },
        { id: 5, name: 'Васька', date: '2024-01-11', type: 'Кот', district: 'Восточный',
          image: catImg, description: 'Спокойный и мудрый кот, любит уют и домашнюю атмосферу' },
        { id: 6, name: 'Шарик', date: '2024-01-10', type: 'Собака', district: 'Центральный',
          image: labradorImg, description: 'Энергичный щенок, обожает активные игры и прогулки' },
        { id: 7, name: 'Снежка', date: '2024-01-09', type: 'Кошка', district: 'Северный',
          image: catImg, description: 'Белая пушистая кошечка с голубыми глазами, очень нежная' },
        { id: 8, name: 'Тузик', date: '2024-01-08', type: 'Собака', district: 'Южный',
          image: labradorImg, description: 'Охранник по натуре, преданный и смелый пес' },
        { id: 9, name: 'Багира', date: '2024-01-07', type: 'Кошка', district: 'Западный',
          image: catImg, description: 'Элегантная черная кошка с изумрудными глазами' },
        { id: 10, name: 'Лорд', date: '2024-01-06', type: 'Собака', district: 'Восточный',
          image: labradorImg, description: 'Благородный пес с прекрасными манерами, идеален для семьи' },
        { id: 11, name: 'Маркиз', date: '2024-01-05', type: 'Кот', district: 'Центральный',
          image: catImg, description: 'Пушистый красавец с важным видом, любит внимание' },
        { id: 12, name: 'Зевс', date: '2024-01-04', type: 'Собака', district: 'Северный',
          image: labradorImg, description: 'Мощный и сильный, но с добрым сердцем, отличный компаньон' },
        { id: 13, name: 'Луна', date: '2024-01-03', type: 'Кошка', district: 'Южный',
          image: catImg, description: 'Загадочная кошечка с серебристой шерстью, очень грациозная' },
        { id: 14, name: 'Рекс', date: '2024-01-02', type: 'Собака', district: 'Западный',
          image: labradorImg, description: 'Энергичный и умный, быстро обучается командам' },
        { id: 15, name: 'Сима', date: '2024-01-01', type: 'Кошка', district: 'Восточный',
          image: catImg, description: 'Ласковая и общительная, обожает сидеть на руках' },
        { id: 16, name: 'Граф', date: '2023-12-31', type: 'Собака', district: 'Центральный',
          image: labradorImg, description: 'Аристократичный пес с прекрасной родословной' },
        { id: 17, name: 'Ириска', date: '2023-12-30', type: 'Кошка', district: 'Северный',
          image: catImg, description: 'Рыжая красавица с полосатой шерстью, очень игривая' },
        { id: 18, name: 'Барс', date: '2023-12-29', type: 'Собака', district: 'Южный',
          image: labradorImg, description: 'Сильный и выносливый, идеален для активных хозяев' }
    ];

    useEffect(() => {
        // Проверяем параметры URL для поиска
        const searchParams = new URLSearchParams(location.search);
        const searchQuery = searchParams.get('q');
        
        if (searchQuery) {
            setSearchParams(prev => ({ ...prev, type: searchQuery }));
            performSearch(searchQuery);
        } else {
            // Показываем все животные при первой загрузке
            setSearchResults(allPets);
            setFilteredResults(allPets);
            calculatePagination(allPets);
        }
    }, [location]);

    useEffect(() => {
        // При изменении параметров поиска
        if (searchParams.district || searchParams.type) {
            performSearch();
        }
    }, [searchParams]);

    useEffect(() => {
        // При изменении страницы
        calculatePagination(filteredResults);
    }, [currentPage, filteredResults]);

    const performSearch = (searchQuery = null) => {
        setIsLoading(true);
        
        // Имитация задержки поиска
        setTimeout(() => {
            let results = [...allPets];
            
            const searchTerm = searchQuery || searchParams.type;
            
            // Фильтрация по району
            if (searchParams.district) {
                results = results.filter(pet => 
                    pet.district === searchParams.district
                );
            }
            
            // Фильтрация по виду животного
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                results = results.filter(pet => 
                    pet.type.toLowerCase().includes(term) ||
                    pet.name.toLowerCase().includes(term) ||
                    pet.description.toLowerCase().includes(term) ||
                    getAnimalTypeText(pet.type).toLowerCase().includes(term)
                );
            }
            
            setSearchResults(results);
            setFilteredResults(results);
            setCurrentPage(1);
            calculatePagination(results);
            setIsLoading(false);
        }, 300);
    };

    const calculatePagination = (results) => {
        const total = results.length;
        const pages = Math.ceil(total / itemsPerPage);
        setTotalPages(pages || 1);
    };

    const getCurrentPageResults = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredResults.slice(startIndex, endIndex);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        performSearch();
    };

    const handleClearSearch = () => {
        setSearchParams({ district: '', type: '' });
        setSearchResults(allPets);
        setFilteredResults(allPets);
        setCurrentPage(1);
    };

    const handleViewPet = (petId) => {
        navigate(`/pet/${petId}`);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            'cat': 'Кошка',
            'dog': 'Собака',
            'other': 'Другое',
            'Кошка': 'Кошка',
            'Собака': 'Собака',
            'Кот': 'Кот'
        };
        return typeMap[type] || type;
    };

    const getStatusBadgeClass = () => {
        return 'bg-success';
    };

    const getStatusText = () => {
        return 'Ищет дом';
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const items = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Первая страница
        if (startPage > 1) {
            items.push(
                <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
                    1
                </Pagination.Item>
            );
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
            }
        }

        // Страницы
        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <Pagination.Item 
                    key={i} 
                    active={i === currentPage}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </Pagination.Item>
            );
        }

        // Последняя страница
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
            }
            items.push(
                <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
                    {totalPages}
                </Pagination.Item>
            );
        }

        return (
            <Pagination className="justify-content-center mt-4">
                <Pagination.Prev 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                />
                {items}
                <Pagination.Next 
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                />
            </Pagination>
        );
    };

    return (
        <div className="container py-5">
            {/* Заголовок */}
            <div className="text-center mb-5">
                <h1 className="display-4 text-primary mb-3">Поиск животных</h1>
                <p className="lead text-muted">Найдите своего нового друга среди потерявшихся животных</p>
            </div>

            {/* Форма поиска */}
            <Card className="shadow-lg mb-5 border-0">
                <Card.Body className="p-4">
                    <Form onSubmit={handleSearchSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label className="fw-bold">Район</Form.Label>
                                    <Form.Select 
                                        value={searchParams.district}
                                        onChange={(e) => setSearchParams(prev => ({ ...prev, district: e.target.value }))}
                                        className="form-control-lg"
                                    >
                                        <option value="">Все районы</option>
                                        <option value="Центральный">Центральный</option>
                                        <option value="Северный">Северный</option>
                                        <option value="Южный">Южный</option>
                                        <option value="Западный">Западный</option>
                                        <option value="Восточный">Восточный</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label className="fw-bold">Вид животного</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="кошка, собака..."
                                        value={searchParams.type}
                                        onChange={(e) => setSearchParams(prev => ({ ...prev, type: e.target.value }))}
                                        className="form-control-lg"
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-12">
                                <div className="d-flex gap-2">
                                    <Button 
                                        type="submit" 
                                        variant="primary" 
                                        size="lg"
                                        className="flex-grow-1"
                                    >
                                        <i className="bi bi-search me-2"></i>
                                        Найти животных
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="outline-secondary" 
                                        size="lg"
                                        onClick={handleClearSearch}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Очистить
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {/* Результаты поиска */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="h3 mb-0">
                        Результаты поиска
                        <span className="text-muted fs-6 ms-2">
                            ({filteredResults.length} {filteredResults.length === 1 ? 'животное' : filteredResults.length < 5 ? 'животных' : 'животных'})
                        </span>
                    </h2>
                    {searchParams.district || searchParams.type ? (
                        <div className="text-muted">
                            {searchParams.district && <Badge bg="info" className="me-2">{searchParams.district}</Badge>}
                            {searchParams.type && <Badge bg="info">{searchParams.type}</Badge>}
                        </div>
                    ) : null}
                </div>

                {/* Лоадер */}
                {isLoading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" size="lg" />
                        <p className="mt-3">Поиск животных...</p>
                    </div>
                ) : filteredResults.length === 0 ? (
                    // Нет результатов
                    <Card className="text-center py-5 border-0 shadow">
                        <Card.Body>
                            <div className="display-1 text-muted mb-4">🐾</div>
                            <h3 className="mb-3">Ничего не найдено</h3>
                            <p className="text-muted mb-4">Попробуйте изменить параметры поиска</p>
                            <Button 
                                variant="outline-primary" 
                                onClick={handleClearSearch}
                            >
                                Показать всех животных
                            </Button>
                        </Card.Body>
                    </Card>
                ) : (
                    // Список результатов
                    <>
                        <div className="row">
                            {getCurrentPageResults().map(pet => (
                                <div key={pet.id} className="col-lg-4 col-md-6 mb-4">
                                    <Card className="h-100 shadow-sm hover-shadow transition-all">
                                        <div className="position-relative">
                                            <Card.Img 
                                                variant="top" 
                                                src={pet.image}
                                                alt={pet.name}
                                                style={{ 
                                                    height: '250px', 
                                                    objectFit: 'cover',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => handleViewPet(pet.id)}
                                            />
                                            <div className="position-absolute top-0 end-0 m-2">
                                                <Badge bg="primary">{pet.type}</Badge>
                                            </div>
                                            <div className="position-absolute top-0 start-0 m-2">
                                                <Badge bg={getStatusBadgeClass()}>
                                                    {getStatusText()}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Card.Body className="d-flex flex-column">
                                            <Card.Title 
                                                className="text-primary mb-3" 
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleViewPet(pet.id)}
                                            >
                                                {pet.name}
                                            </Card.Title>
                                            <Card.Text className="flex-grow-1 mb-3">
                                                {pet.description}
                                            </Card.Text>
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
                                                    variant="primary" 
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

                        {/* Пагинация */}
                        {renderPagination()}

                        {/* Информация о странице */}
                        <div className="text-center text-muted mt-3">
                            Страница {currentPage} из {totalPages} • 
                            Показано {Math.min(itemsPerPage, getCurrentPageResults().length)} из {filteredResults.length} животных
                        </div>
                    </>
                )}
            </div>

            {/* Быстрые ссылки */}
            <div className="row mt-5">
                <div className="col-md-4 mb-3">
                    <Card className="text-center border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="display-3 mb-3">🏠</div>
                            <Card.Title>Хотите помочь?</Card.Title>
                            <Card.Text>
                                Приютите животное или станьте волонтером
                            </Card.Text>
                            <Button 
                                variant="outline-primary" 
                                onClick={() => navigate('/add-pet')}
                            >
                                Добавить объявление
                            </Button>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-4 mb-3">
                    <Card className="text-center border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="display-3 mb-3">📞</div>
                            <Card.Title>Потеряли питомца?</Card.Title>
                            <Card.Text>
                                Сообщите о пропаже, мы поможем в поисках
                            </Card.Text>
                            <Button 
                                variant="outline-primary"
                                onClick={() => navigate('/add-pet')}
                            >
                                Сообщить о пропаже
                            </Button>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-4 mb-3">
                    <Card className="text-center border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="display-3 mb-3">❤️</div>
                            <Card.Title>Станьте волонтером</Card.Title>
                            <Card.Text>
                                Присоединяйтесь к нашему сообществу
                            </Card.Text>
                            <Button 
                                variant="outline-primary"
                                onClick={() => navigate('/register')}
                            >
                                Зарегистрироваться
                            </Button>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Search;