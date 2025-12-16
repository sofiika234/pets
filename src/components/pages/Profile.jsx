import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Button,
  Card,
  Spinner,
  Badge,
  Alert,
  Image,
  Row,
  Col,
  Modal,
  Form,
  Container,
  Tab,
  Tabs,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { authApi, petsApi, API_CONFIG, safeApiCall } from '../../utils/api';


// Расчет дней регистрации
const calculateDaysRegistered = (registrationDate) => {
  if (!registrationDate) return 0;

  try {
    // Формат даты в ТЗ: "01-01-1970" (DD-MM-YYYY)
    const parts = registrationDate.split('-');
    if (parts.length !== 3) {
      console.warn('Неверный формат даты регистрации:', registrationDate);
      return 0;
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Месяцы в JS: 0-11
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    
    if (isNaN(date.getTime())) {
      console.warn('Невалидная дата регистрации:', registrationDate);
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today - date);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Ошибка расчета дней регистрации:', error);
    return 0;
  }
};

// Компонент для редактирования телефона
const EditPhoneModal = ({ show, onHide, currentPhone, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState(currentPhone || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (show) {
      setPhone(currentPhone || '');
      setError('');
      setSuccess('');
    }
  }, [show, currentPhone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!phone.trim()) {
        throw new Error('Телефон обязателен для заполнения');
      }

      const cleanedPhone = phone.replace(/\s/g, '');
      if (!/^(\+7|7|8)?[0-9]{10}$/.test(cleanedPhone)) {
        throw new Error('Формат: +7XXXXXXXXXX или 8XXXXXXXXXX (10 цифр)');
      }

      let normalizedPhone = cleanedPhone;
      if (cleanedPhone.startsWith('8')) {
        normalizedPhone = '+7' + cleanedPhone.substring(1);
      } else if (cleanedPhone.startsWith('7')) {
        normalizedPhone = '+7' + cleanedPhone.substring(1);
      } else if (!cleanedPhone.startsWith('+7') && cleanedPhone.length === 10) {
        normalizedPhone = '+7' + cleanedPhone;
      }

      const result = await safeApiCall(
        () => authApi.updatePhone(normalizedPhone),
        'Ошибка обновления телефона'
      );

      if (!result.success) {
        if (result.status === 422) {
          throw new Error('Некорректный номер телефона');
        } else if (result.status === 401) {
          throw new Error('Требуется авторизация');
        }
        throw new Error(result.error || 'Ошибка сервера');
      }

      setSuccess('Телефон успешно обновлен!');

      setTimeout(() => {
        onUpdate(normalizedPhone);
        onHide();
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Изменение номера телефона</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form.Group>
            <Form.Label>Новый номер телефона *</Form.Label>
            <Form.Control
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+79111234567 или 89111234567"
              required
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Формат: +7XXXXXXXXXX или 8XXXXXXXXXX (10 цифр после +7 или 8)
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Сохранение...
              </>
            ) : 'Сохранить'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Компонент для редактирования email
const EditEmailModal = ({ show, onHide, currentEmail, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(currentEmail || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (show) {
      setEmail(currentEmail || '');
      setError('');
      setSuccess('');
    }
  }, [show, currentEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!email.trim()) {
        throw new Error('Email обязателен для заполнения');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Введите корректный email адрес');
      }

      const result = await safeApiCall(
        () => authApi.updateEmail(email.trim()),
        'Ошибка обновления email'
      );

      if (!result.success) {
        if (result.status === 422) {
          throw new Error('Некорректный email адрес');
        } else if (result.status === 401) {
          throw new Error('Требуется авторизация');
        }
        throw new Error(result.error || 'Ошибка сервера');
      }

      setSuccess('Email успешно обновлен!');

      setTimeout(() => {
        onUpdate(email.trim());
        onHide();
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Изменение адреса электронной почты</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form.Group>
            <Form.Label>Новый email адрес *</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={loading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Сохранение...
              </>
            ) : 'Сохранить'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Компонент для подтверждения удаления
const DeleteConfirmationModal = ({ show, onHide, onConfirm, adTitle, adStatus }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onHide();
    }
  };

  const canDelete = adStatus === 'active' || adStatus === 'onModeration';

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Подтверждение удаления</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Вы уверены, что хотите удалить объявление?</p>
        {adTitle && (
          <p className="fw-bold">"{adTitle}"</p>
        )}
        
        {!canDelete ? (
          <Alert variant="danger" className="small">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Удаление невозможно. Можно удалять только объявления со статусами "Активно" и "На модерации"
          </Alert>
        ) : (
          <Alert variant="warning" className="small">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Это действие нельзя отменить
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Отмена
        </Button>
        <Button 
          variant="danger" 
          onClick={handleConfirm} 
          disabled={loading || !canDelete}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Удаление...
            </>
          ) : 'Удалить'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Компонент для редактирования объявления
const EditAdModal = ({ show, onHide, ad, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    kind: '',
    description: '',
    mark: '',
    photos: []
  });
  const [photoFiles, setPhotoFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (show && ad) {
      setFormData({
        kind: ad.kind || '',
        description: ad.description || '',
        mark: ad.mark || '',
        photos: ad.photos || []
      });
      setPhotoFiles([]);
      setImagePreviews([]);
      setErrors({});
      setSuccess('');
    }
  }, [show, ad]);

  const handlePhotoChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.png')) {
      setErrors({ general: 'Фотографии должны быть в формате PNG' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ general: 'Файл слишком большой. Максимальный размер: 5MB' });
      return;
    }

    setPhotoFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = file;
      return newFiles;
    });

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews(prev => {
        const newPreviews = [...prev];
        newPreviews[index] = reader.result;
        return newPreviews;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      if (ad.status !== 'active' && ad.status !== 'onModeration') {
        throw new Error('Редактирование возможно только для объявлений со статусами "Активно" и "На модерации"');
      }

      if (!formData.description.trim()) {
        throw new Error('Описание обязательно для заполнения');
      }

      if (!photoFiles[0] && (!ad.photos || ad.photos.length === 0)) {
        throw new Error('Фото 1 обязательно для заполнения');
      }

      const formDataToSend = new FormData();
      
      // Добавляем обязательные поля
      if (formData.kind) {
        formDataToSend.append('kind', formData.kind.trim());
      }
      
      formDataToSend.append('description', formData.description.trim());
      
      if (formData.mark.trim()) {
        formDataToSend.append('mark', formData.mark.trim());
      }

      // Добавляем фото
      for (let i = 0; i < 3; i++) {
        if (photoFiles[i]) {
          formDataToSend.append(`photo${i + 1}`, photoFiles[i]);
        } else if (i === 0 && ad.photos && ad.photos[i]) {
          // Если не загружено новое фото, сохраняем ссылку на старое
          formDataToSend.append(`photo${i + 1}_url`, ad.photos[i]);
        }
      }

      const result = await safeApiCall(
        () => petsApi.updatePet(ad.id, formDataToSend),
        'Ошибка редактирования объявления'
      );

      if (!result.success) {
        if (result.status === 422) {
          throw new Error('Ошибка валидации данных. Проверьте все поля.');
        } else if (result.status === 403) {
          throw new Error('Редактирование запрещено для этого объявления');
        } else if (result.status === 401) {
          throw new Error('Требуется авторизация');
        }
        throw new Error(result.error || 'Ошибка сервера');
      }

      setSuccess('Объявление успешно обновлено!');

      setTimeout(() => {
        onUpdate({ 
          ...ad, 
          description: formData.description,
          mark: formData.mark,
          photos: imagePreviews.filter(p => p).length > 0 ? imagePreviews : ad.photos
        });
        onHide();
      }, 1500);

    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!ad) return null;

  const canEdit = ad.status === 'active' || ad.status === 'onModeration';

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Редактирование объявления</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {!canEdit && (
            <Alert variant="danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Редактирование невозможно. Можно редактировать только объявления со статусами "Активно" и "На модерации"
            </Alert>
          )}

          {errors.general && <Alert variant="danger">{errors.general}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Вид животного *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.kind}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    kind: e.target.value
                  }))}
                  required
                  disabled={loading || !canEdit}
                  placeholder="Кошка, собака и т.д."
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Район *</Form.Label>
                <Form.Control
                  type="text"
                  value={ad.district || ''}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Описание *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              required
              disabled={loading || !canEdit}
              placeholder="Подробное описание животного..."
              minLength={10}
            />
            <Form.Text className="text-muted">
              Минимум 10 символов. Опишите животное подробно.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Клеймо (необязательно)</Form.Label>
            <Form.Control
              type="text"
              value={formData.mark}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                mark: e.target.value
              }))}
              placeholder="VL-0214"
              disabled={loading || !canEdit}
            />
            <Form.Text className="text-muted">
              Если у животном есть клеймо, татуировка или чип
            </Form.Text>
          </Form.Group>

          <Alert variant="info" className="small mb-3">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Внимание:</strong> При редактировании объявления можно заменить фотографии. 
            Формат файлов: PNG, максимальный размер: 5MB. Фото 1 обязательно.
          </Alert>

          {[1, 2, 3].map((index) => (
            <Form.Group key={index} className="mb-3">
              <Form.Label>
                Фото {index} {index === 1 && <Badge bg="danger">Обязательно</Badge>}
              </Form.Label>
              
              {imagePreviews[index - 1] || (ad.photos && ad.photos[index - 1]) ? (
                <div className="mb-2">
                  <Image
                    src={imagePreviews[index - 1] || ad.photos[index - 1]}
                    alt={`Фото ${index}`}
                    thumbnail
                    style={{ maxWidth: '150px', maxHeight: '150px' }}
                  />
                </div>
              ) : null}
              
              <Form.Control
                type="file"
                accept=".png,image/png"
                onChange={(e) => handlePhotoChange(e, index - 1)}
                disabled={loading || !canEdit}
              />
              <Form.Text className="text-muted">
                Только PNG формат, максимум 5MB
              </Form.Text>
            </Form.Group>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Отмена
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading || !canEdit}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Сохранение...
              </>
            ) : 'Сохранить изменения'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Карточка объявления
const PetCard = memo(({ ad, onView, onEdit, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          return `${parts[0]}.${parts[1]}.${parts[2]}`;
        }
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': {
        text: 'Активно',
        variant: 'success',
        icon: 'bi-check-circle',
        tooltip: 'Объявление активно и видно всем пользователям'
      },
      'onModeration': {
        text: 'На модерации',
        variant: 'warning',
        icon: 'bi-clock',
        tooltip: 'Объявление проверяется модератором'
      },
      'wasFound': {
        text: 'Хозяин найден',
        variant: 'primary',
        icon: 'bi-heart-fill',
        tooltip: 'Животное нашло хозяина'
      },
      'archive': {
        text: 'В архиве',
        variant: 'secondary',
        icon: 'bi-archive',
        tooltip: 'Объявление в архиве'
      }
    };

    const statusInfo = statusMap[status] || {
      text: status,
      variant: 'secondary',
      icon: 'bi-question-circle',
      tooltip: 'Неизвестный статус'
    };

    const badge = (
      <Badge bg={statusInfo.variant} className="d-flex align-items-center">
        <i className={`bi ${statusInfo.icon} me-1`}></i>
        {statusInfo.text}
      </Badge>
    );

    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>{statusInfo.tooltip}</Tooltip>}
      >
        {badge}
      </OverlayTrigger>
    );
  };

  const getImageUrl = () => {
    try {
      let photo;

      if (ad.photos) {
        if (Array.isArray(ad.photos) && ad.photos.length > 0) {
          photo = ad.photos[0];
        } else if (typeof ad.photos === 'string') {
          photo = ad.photos;
        }
      } else if (ad.photo) {
        photo = ad.photo;
      }

      if (photo) {
        if (typeof photo === 'string') {
          if (photo.includes('{url}')) {
            return photo.replace('{url}', API_CONFIG.IMAGE_BASE);
          }
          if (photo.startsWith('/')) {
            return `${API_CONFIG.IMAGE_BASE}${photo}`;
          }
          if (photo.startsWith('http')) {
            return photo;
          }
          return `${API_CONFIG.IMAGE_BASE}/images/${photo}`;
        }
      }
    } catch (error) {
      console.error('Error getting image URL:', error);
    }

    return `${API_CONFIG.IMAGE_BASE}/images/default-pet.jpg`;
  };

  const imageUrl = getImageUrl();
  const canEditDelete = ad.status === 'active' || ad.status === 'onModeration';

  return (
    <Card className="h-100 shadow-sm hover-shadow transition-all" style={{ transition: '0.3s' }}>
      <div
        className="position-relative cursor-pointer"
        style={{
          height: '200px',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa'
        }}
        onClick={() => onView(ad.id)}
      >
        {!imageLoaded && !imageError && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <Spinner animation="border" size="sm" variant="secondary" />
          </div>
        )}

        <Image
          src={imageError ? `${API_CONFIG.IMAGE_BASE}/images/default-pet.jpg` : imageUrl}
          alt={ad.description || 'Объявление о животном'}
          fluid
          style={{
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s'
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          loading="lazy"
        />

        <div className="position-absolute top-0 end-0 m-2">
          {getStatusBadge(ad.status)}
        </div>

        {ad.district && (
          <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-1">
            <small className="d-flex align-items-center">
              <i className="bi bi-geo-alt me-1"></i>
              {ad.district}
            </small>
          </div>
        )}

        {ad.status === 'wasFound' && (
          <div className="position-absolute top-0 start-0 m-2">
            <Badge bg="success">
              <i className="bi bi-check-circle me-1"></i>
              Найдены хозяева
            </Badge>
          </div>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="h6 mb-0 text-truncate" title={ad.kind || 'Животное'}>
            {ad.kind || 'Животное'}
          </Card.Title>
          {ad.mark && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Клеймо/Татуировка: {ad.mark}</Tooltip>}
            >
              <Badge bg="light" text="dark" className="small">
                <i className="bi bi-tag me-1"></i>
                {ad.mark.length > 8 ? ad.mark.substring(0, 8) + '...' : ad.mark}
              </Badge>
            </OverlayTrigger>
          )}
        </div>

        <div className="mb-2">
          <small className="text-muted d-flex align-items-center">
            <i className="bi bi-calendar me-1"></i>
            {formatDate(ad.date)}
          </small>
        </div>

        <Card.Text
          className="small text-muted mb-3 flex-grow-1"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '60px'
          }}
          title={ad.description}
        >
          {ad.description || 'Нет описания'}
        </Card.Text>

        <div className="d-flex justify-content-between align-items-center mt-auto">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(ad.id);
            }}
            className="d-flex align-items-center"
          >
            <i className="bi bi-eye me-1"></i>
            Подробнее
          </Button>

          {canEditDelete && (
            <div className="d-flex gap-1">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Редактировать</Tooltip>}
              >
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(ad);
                  }}
                >
                  <i className="bi bi-pencil"></i>
                </Button>
              </OverlayTrigger>
              
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Удалить</Tooltip>}
              >
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(
                      ad.id, 
                      ad.description?.substring(0, 30) + (ad.description?.length > 30 ? '...' : '') || 'объявление', 
                      ad.status
                    );
                  }}
                >
                  <i className="bi bi-trash"></i>
                </Button>
              </OverlayTrigger>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
});

PetCard.displayName = 'PetCard';

// Основной компонент Profile (ИСПРАВЛЕННЫЙ)
function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const mountedRef = useRef(true);

  
    // ТЕСТОВЫЕ ДАННЫЕ - 2 объявления которые можно редактировать и удалять
  const TEST_ADS = [
    {
      id: 101,
      kind: 'кошка',
      description: 'Найдена милая кошечка возле метро. Возраст около 2 лет, очень ласковая.',
      district: 'Василеостровский',
      date: '20-01-2024',
      status: 'active',
      photos: [`${API_CONFIG.IMAGE_BASE}/images/default-cat.jpg`],
      mark: 'VL-2024',
      phone: '+79111234567',
      email: 'test@example.com',
      name: 'Иван Иванов',
      registred: true
    },
    {
      id: 102,
      kind: 'собака',
      description: 'Найдена собака породы лабрадор. Очень дружелюбная, откликается на кличку "Барсик".',
      district: 'Центральный',
      date: '18-01-2024',
      status: 'onModeration',
      photos: [`${API_CONFIG.IMAGE_BASE}/images/default-dog.jpg`],
      mark: '',
      phone: '+79111234567',
      email: 'test@example.com',
      name: 'Иван Иванов',
      registred: true
    }
  ];

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState({ profile: true, ads: true });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [networkError, setNetworkError] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  const [phoneModal, setPhoneModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [editAdModal, setEditAdModal] = useState({
    show: false,
    ad: null
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    adId: null,
    adTitle: '',
    adStatus: ''
  });

  // Проверка авторизации
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Требуется авторизация. Вы будете перенаправлены на страницу входа.');
      setTimeout(() => navigate('/login'), 2000);
      return false;
    }
    return true;
  }, [navigate]);

  // Загрузка данных пользователя
  const loadUserData = useCallback(async () => {
    if (!checkAuth()) return null;
    
    try {
      console.log('👤 Загрузка данных пользователя...');
      
      const result = await safeApiCall(() => authApi.getUser(), 'Ошибка загрузки профиля');
      
      if (result.success && result.data) {
        let userData = result.data;

        // Добавляем расчет дней регистрации
        if (userData.registrationDate) {
          userData.daysRegistered = calculateDaysRegistered(userData.registrationDate);
        } else {
          userData.daysRegistered = 0;
        }

        // Нормализуем данные
        userData.name = userData.name || 'Пользователь';
        userData.phone = userData.phone || '';
        userData.email = userData.email || '';
        userData.ordersCount = userData.ordersCount || 0;
        userData.petsCount = userData.petsCount || 0;

        localStorage.setItem('currentUser', JSON.stringify(userData));
        return userData;
      }

      // Используем данные из localStorage
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('Используем сохраненные данные пользователя');
          return parsedUser;
        } catch (e) {
          console.error('Ошибка парсинга сохраненного пользователя:', e);
        }
      }

      return null;
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
      
      if (error.message.includes('Unauthorized') || error.status === 401) {
        setError('Требуется авторизация. Пожалуйста, войдите снова.');
        setTimeout(() => {
          authApi.logout();
          navigate('/login');
        }, 2000);
        return null;
      }
      
      return null;
    }
  }, [checkAuth, navigate]);

  // Загрузка объявлений пользователя (ИСПРАВЛЕННАЯ)
  const loadUserAds = useCallback(async () => {
    if (!checkAuth()) return [];
    
    try {
      console.log('📋 Запрос ВАШИХ объявлений с сервера...');
      setApiStatus('loading');

      const result = await safeApiCall(() => authApi.getUserOrders(), 'Ошибка загрузки объявлений');
      
      console.log('📋 Результат загрузки объявлений:', result);

      if (result.success) {
        console.log(`📊 Загружено ${result.data?.length || 0} объявлений`);
        setApiStatus('success');
        
        let ads = result.data || [];
        
        console.log('📊 Сырые данные объявлений:', ads);
        
        // Форматируем объявления
        const formattedAds = ads.map(ad => ({
          id: ad.id || ad._id || Math.random().toString(36).substr(2, 9),
          kind: ad.kind || ad.type || 'Не указано',
          description: ad.description || ad.text || '',
          district: ad.district || '',
          date: ad.date || ad.created_at || '',
          status: ad.status || 'onModeration',
          photos: Array.isArray(ad.photos) ? ad.photos : 
                  ad.photo ? [ad.photo] : 
                  [],
          mark: ad.mark || '',
          phone: ad.phone,
          email: ad.email,
          name: ad.name || ad.user?.name,
          registred: ad.registred || false
        })).sort((a, b) => {
          // Сортировка по дате (убывание)
          if (!a.date || !b.date) return 0;
          
          try {
            const dateA = new Date(a.date.split('-').reverse().join('-'));
            const dateB = new Date(b.date.split('-').reverse().join('-'));
            return dateB - dateA;
          } catch (error) {
            return 0;
          }
        });
        
        console.log('📊 Отформатированные объявления:', formattedAds);
        console.log('📊 Статистика по статусам:', {
          active: formattedAds.filter(a => a.status === 'active').length,
          onModeration: formattedAds.filter(a => a.status === 'onModeration').length,
          wasFound: formattedAds.filter(a => a.status === 'wasFound').length,
          archive: formattedAds.filter(a => a.status === 'archive').length
        });
        
        setNetworkError(false);
        return formattedAds;
      } else {
        console.log('⚠️ Не удалось загрузить объявления:', result.error);
        setNetworkError(result.error?.includes('сети') || false);
        return [];
      }
      
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
      
      if (error.status === 401) {
        setError('Требуется авторизация. Пожалуйста, войдите снова.');
        setTimeout(() => {
          authApi.logout();
          navigate('/login');
        }, 2000);
      } else if (error.message.includes('Network error') || error.status === 0) {
        console.log('🌐 Ошибка сети при загрузке объявлений');
        setNetworkError(true);
      } else {
        console.log('Другая ошибка при загрузке объявлений:', error.message);
      }
      
      return [];
    }
  }, [checkAuth, navigate]);

  // Загрузка всех данных
  const loadAllData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    console.log('🔄 Начало загрузки всех данных...');
    setLoading({ profile: true, ads: true });
    setError(null);

    try {
      // Загружаем последовательно
      console.log('1. Загрузка данных пользователя...');
      const userData = await loadUserData();
      
      console.log('2. Загрузка объявлений пользователя...');
      const adsData = await loadUserAds();
      
      if (mountedRef.current) {
        setCurrentUser(userData);
        setUserAds(adsData);
        
        console.log('📊 Загруженные объявления:', adsData);
        console.log('📊 Фильтр по статусам:', {
          active: adsData.filter(a => a.status === 'active').length,
          onModeration: adsData.filter(a => a.status === 'onModeration').length,
          wasFound: adsData.filter(a => a.status === 'wasFound').length,
          archive: adsData.filter(a => a.status === 'archive').length
        });
        
        if (adsData.length > 0) {
          setSuccessMessage(`Загружено ${adsData.length} объявлений`);
          setTimeout(() => {
            if (mountedRef.current) setSuccessMessage('');
          }, 3000);
        }
        
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Общая ошибка загрузки данных:', error);
      if (mountedRef.current) {
        setError('Не удалось загрузить данные. Пожалуйста, попробуйте обновить страницу.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading({ profile: false, ads: false });
        console.log('✅ Загрузка данных завершена');
      }
    }
  }, [loadUserData, loadUserAds]);

  // Инициализация при монтировании
  useEffect(() => {
    mountedRef.current = true;
    
    const init = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('Пользователь не авторизован, перенаправление на страницу входа');
        navigate('/login');
        return;
      }
      
      await loadAllData();
    };

    init();

    return () => {
      mountedRef.current = false;
    };
  }, [navigate, loadAllData]);

  // Обновление данных при переходе из формы добавления
  useEffect(() => {
    if (location.state?.refreshData) {
      console.log('🔄 Обновление данных профиля после добавления объявления');
      console.log('📍 State:', location.state);
      
      if (location.state.newAdId) {
        setSuccessMessage(`Объявление успешно добавлено! ID: ${location.state.newAdId}`);
      } else {
        setSuccessMessage('Объявление успешно добавлено!');
      }
      
      setTimeout(() => {
        loadAllData();
      }, 1000);
      
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, loadAllData]);

  // Обработчики событий
  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из личного кабинета?')) {
      authApi.logout();
      navigate('/login');
    }
  };

  const handleViewAd = (adId) => {
    navigate(`/pet/${adId}`);
  };

  const handleEditAd = (ad) => {
    setEditAdModal({ show: true, ad });
  };

  const handleUpdateAd = (updatedAd) => {
    setUserAds(prev => prev.map(ad => ad.id === updatedAd.id ? updatedAd : ad));
    setSuccessMessage('Объявление успешно обновлено');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteClick = (adId, adTitle, adStatus) => {
    setDeleteModal({
      show: true,
      adId,
      adTitle: adTitle || 'объявление',
      adStatus
    });
  };

  const handleDeleteConfirm = async () => {
    const { adId, adStatus } = deleteModal;
    
    if (adStatus !== 'active' && adStatus !== 'onModeration') {
      alert('Удаление запрещено. Можно удалять только объявления со статусами "Активно" и "На модерации"');
      setDeleteModal({ show: false, adId: null, adTitle: '', adStatus: '' });
      return;
    }

    try {
      const result = await safeApiCall(
        () => authApi.deleteOrder(adId), 
        'Ошибка удаления объявления'
      );

      if (result.success) {
        const updatedAds = userAds.filter(ad => ad.id !== adId);
        setUserAds(updatedAds);

        setSuccessMessage('Объявление успешно удалено');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Ошибка удаления объявления:', error);
      setError(`Ошибка удаления: ${error.message}`);
    } finally {
      setDeleteModal({ show: false, adId: null, adTitle: '', adStatus: '' });
    }
  };

  const handleUpdatePhone = async (newPhone) => {
    try {
      const result = await safeApiCall(
        () => authApi.updatePhone(newPhone),
        'Ошибка обновления телефона'
      );

      if (result.success) {
        const updatedUser = { ...currentUser, phone: newPhone };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        setSuccessMessage('Номер телефона успешно обновлен');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Ошибка обновления телефона:', error);
      setError(`Ошибка обновления телефона: ${error.message}`);
    }
  };

  const handleUpdateEmail = async (newEmail) => {
    try {
      const result = await safeApiCall(
        () => authApi.updateEmail(newEmail),
        'Ошибка обновления email'
      );

      if (result.success) {
        const updatedUser = { ...currentUser, email: newEmail };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        setSuccessMessage('Email успешно обновлен');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Ошибка обновления email:', error);
      setError(`Ошибка обновления email: ${error.message}`);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 Ручное обновление данных...');
    await loadAllData();
  };

  const handleAddNewAd = () => {
    navigate('/add-pet');
  };

  // Вспомогательные функции
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          return `${parts[0]}.${parts[1]}.${parts[2]}`;
        }
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const getAdsByStatus = (status) => {
    return userAds.filter(ad => ad.status === status);
  };

  const getStatusTabs = () => {
    const statuses = ['all', 'active', 'onModeration', 'wasFound', 'archive'];
    const statusCounts = {
      all: userAds.length,
      active: getAdsByStatus('active').length,
      onModeration: getAdsByStatus('onModeration').length,
      wasFound: getAdsByStatus('wasFound').length,
      archive: getAdsByStatus('archive').length
    };

    return statuses.filter(status => status === 'all' || statusCounts[status] > 0);
  };

  const renderAdsContent = (ads, isLoading, typeText) => {
    if (isLoading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Загрузка {typeText}...</p>
        </div>
      );
    }

    if (ads.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="display-1 text-muted mb-4 opacity-50">
            <i className="bi bi-newspaper"></i>
          </div>
          <h4 className="text-muted mb-3">
            {typeText === 'всех объявлений' ? 'Объявлений пока нет' : `Нет ${typeText}`}
          </h4>
          <p className="text-muted mb-4">
            {typeText === 'всех объявлений'
              ? 'Если вы только что добавили объявление, попробуйте обновить данные'
              : `У вас пока нет ${typeText}`}
          </p>
          {typeText === 'всех объявлений' && (
            <div className="d-flex justify-content-center gap-3">
              <Button variant="primary" size="lg" onClick={handleRefresh} className="me-3">
                <i className="bi bi-arrow-clockwise me-2"></i>
                Обновить данные
              </Button>
              <Button variant="outline-primary" size="lg" onClick={handleAddNewAd}>
                <i className="bi bi-plus-circle me-2"></i>
                Добавить объявление
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <Row className="g-4">
        {ads.map(ad => (
          <Col key={ad.id} xs={12} md={6} lg={4}>
            <PetCard
              ad={ad}
              onView={handleViewAd}
              onEdit={handleEditAd}
              onDelete={handleDeleteClick}
            />
          </Col>
        ))}
      </Row>
    );
  };

  // Показ загрузки
  if (loading.profile && !currentUser) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3">Загрузка профиля...</p>
        </div>
      </Container>
    );
  }

  // Проверка токена
  const token = localStorage.getItem('authToken');
  if (!token) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <div className="py-4">
            <div className="display-1 text-warning mb-4">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <Alert.Heading>Требуется авторизация</Alert.Heading>
            <p>Для просмотра личного кабинета необходимо войти в систему</p>
            <div className="mt-4">
              <Button variant="primary" onClick={() => navigate('/login')} className="me-3">
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Войти
              </Button>
              <Button variant="outline-primary" onClick={() => navigate('/')}>
                <i className="bi bi-house me-2"></i>
                На главную
              </Button>
            </div>
          </div>
        </Alert>
      </Container>
    );
  }

  // Основной рендеринг
  return (
    <Container className="py-4">
      {networkError && (
        <Alert variant="warning" className="mb-4">
          <i className="bi bi-wifi-off me-2"></i>
          Проблемы с подключением к серверу. Данные могут быть не актуальными.
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
          className="mb-4"
        >
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <Alert.Heading>Ошибка!</Alert.Heading>
              <p>{error}</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRefresh}
              disabled={loading.profile || loading.ads}
            >
              {loading.profile || loading.ads ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Повторить
                </>
              )}
            </Button>
          </div>
        </Alert>
      )}

      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccessMessage('')}
          className="mb-4"
        >
          <div className="d-flex align-items-center">
            <i className="bi bi-check-circle me-2 fs-5"></i>
            <span>{successMessage}</span>
          </div>
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div className="mb-3 mb-md-0">
          <h1 className="h2 text-primary mb-1">
            <i className="bi bi-person-circle me-2"></i>
            Личный кабинет
          </h1>
          <p className="text-muted mb-0">
            Управление вашим профилем и объявлениями
            {lastUpdated && (
              <small className="ms-2 text-muted">
                <i className="bi bi-clock me-1"></i>
                Обновлено: {lastUpdated}
              </small>
            )}
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Button
            variant="outline-primary"
            onClick={() => navigate('/')}
            size="sm"
            className="mb-1"
            title="На главную"
          >
            <i className="bi bi-house me-1"></i>
            Главная
          </Button>
          <Button
            variant="outline-success"
            onClick={handleRefresh}
            size="sm"
            className="mb-1"
            title="Обновить данные"
            disabled={loading.profile || loading.ads}
          >
            {loading.profile || loading.ads ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-1"></i>
                Обновить
              </>
            )}
          </Button>
          <Button
            variant="outline-danger"
            onClick={handleLogout}
            size="sm"
            className="mb-1"
            title="Выйти из системы"
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            Выйти
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-primary text-white py-3">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-person-badge me-2"></i>
                Профиль пользователя
              </h5>
            </Card.Header>

            <Card.Body>
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block">
                  <Image
                    src={`${API_CONFIG.IMAGE_BASE}/images/default-avatar.png`}
                    alt="Аватар"
                    roundedCircle
                    fluid
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      border: '3px solid var(--bs-primary)'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://ui-avatars.com/api/?name=' + 
                        encodeURIComponent(currentUser?.name || 'User') + 
                        '&background=0d6efd&color=fff&size=120';
                    }}
                  />
                  <Badge 
                    bg="success" 
                    className="position-absolute bottom-0 end-0 rounded-circle p-1"
                    style={{ width: '30px', height: '30px' }}
                    title="Активный пользователь"
                  >
                    <i className="bi bi-check-lg"></i>
                  </Badge>
                </div>
                <h4 className="mt-3 mb-1">{currentUser?.name || 'Пользователь'}</h4>
                <p className="text-muted small d-flex align-items-center justify-content-center">
                  <i className="bi bi-calendar-check me-1"></i>
                  На сайте {currentUser?.daysRegistered || 0} дней
                  {currentUser?.daysRegistered > 365 && (
                    <Badge bg="warning" className="ms-2">
                      <i className="bi bi-star-fill me-1"></i>
                      Постоянный клиент
                    </Badge>
                  )}
                </p>
              </div>

              <Card className="border mb-3">
                <Card.Body className="p-3">
                  <h6 className="mb-3 text-center">Контактная информация</h6>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="text-muted">
                        <i className="bi bi-envelope me-1"></i>Email:
                      </small>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-decoration-none"
                        onClick={() => setEmailModal(true)}
                        title="Изменить email"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                    </div>
                    <p className="fw-semibold mb-0 text-break" title={currentUser?.email}>
                      {currentUser?.email || 'Не указан'}
                    </p>
                  </div>

                  <div className="mb-0">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="text-muted">
                        <i className="bi bi-telephone me-1"></i>Телефон:
                      </small>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-decoration-none"
                        onClick={() => setPhoneModal(true)}
                        title="Изменить телефон"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                    </div>
                    <p className="fw-semibold mb-0" title={currentUser?.phone}>
                      {currentUser?.phone || 'Не указан'}
                    </p>
                  </div>
                </Card.Body>
              </Card>

              <div className="mb-3">
                <small className="text-muted d-block mb-1">
                  <i className="bi bi-calendar-event me-1"></i>Дата регистрации:
                </small>
                <p className="fw-semibold mb-0">
                  {formatDate(currentUser?.registrationDate) || 'Не указана'}
                </p>
              </div>

              <Card className="border mb-4">
                <Card.Body className="p-3">
                  <h6 className="mb-3 text-center">Ваша статистика</h6>
                  <Row className="text-center">
                    <Col xs={6}>
                      <div className="p-2 border-end">
                        <div className="text-primary fw-bold fs-4">
                          {currentUser?.ordersCount || userAds.length}
                        </div>
                        <small className="text-muted">Объявлений</small>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="p-2">
                        <div className="text-success fw-bold fs-4">
                          {currentUser?.petsCount || userAds.filter(ad => ad.status === 'wasFound').length}
                        </div>
                        <small className="text-muted">Найдено хозяев</small>
                      </div>
                    </Col>
                  </Row>
                  {userAds.filter(ad => ad.status === 'wasFound').length > 0 && (
                    <div className="text-center mt-2">
                      <Badge bg="success" className="px-3 py-2">
                        <i className="bi bi-heart-fill me-1"></i>
                        Вы помогли {userAds.filter(ad => ad.status === 'wasFound').length} животным!
                      </Badge>
                    </div>
                  )}
                </Card.Body>
              </Card>

              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  onClick={handleAddNewAd}
                  className="d-flex align-items-center justify-content-center py-2"
                >
                  <i className="bi bi-plus-circle me-2 fs-5"></i>
                  Добавить объявление
                </Button>
                
                <Button
                  variant="outline-primary"
                  onClick={() => navigate('/search')}
                  className="d-flex align-items-center justify-content-center py-2"
                >
                  <i className="bi bi-search me-2"></i>
                  Поиск животных
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-primary text-white py-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="bi bi-newspaper me-2"></i>
                  Мои объявления
                  {userAds.length > 0 && (
                    <Badge bg="light" text="dark" className="ms-2 fs-6">
                      {userAds.length}
                    </Badge>
                  )}
                </h5>
                <div className="mt-2 mt-md-0">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={handleAddNewAd}
                    className="me-2"
                  >
                    <i className="bi bi-plus-circle me-1"></i> 
                    Добавить
                  </Button>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading.ads}
                  >
                    {loading.ads ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Обновить
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card.Header>

            <Card.Body className="p-0">
              {userAds.length === 0 && !loading.ads ? (
                <div className="text-center py-5">
                  <div className="display-1 text-muted mb-4 opacity-50">
                    <i className="bi bi-inbox"></i>
                  </div>
                  <h4 className="text-muted mb-3">У вас пока нет объявлений</h4>
                  <p className="text-muted mb-4">
                    Если вы только что добавили объявление, попробуйте обновить данные
                  </p>
                  <div className="d-flex justify-content-center gap-3">
                    <Button variant="primary" size="lg" onClick={handleRefresh} className="me-3">
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Обновить данные
                    </Button>
                    <Button variant="outline-primary" size="lg" onClick={handleAddNewAd}>
                      <i className="bi bi-plus-circle me-2"></i>
                      Добавить объявление
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-3 px-3 pt-3"
                    fill
                  >
                    <Tab 
                      eventKey="all" 
                      title={
                        <div className="d-flex align-items-center">
                          Все
                          <Badge bg="secondary" className="ms-1" pill>
                            {userAds.length}
                          </Badge>
                        </div>
                      }
                    >
                      <div className="p-3">
                        {renderAdsContent(userAds, loading.ads, 'всех объявлений')}
                      </div>
                    </Tab>
                    
                    {getAdsByStatus('active').length > 0 && (
                      <Tab 
                        eventKey="active" 
                        title={
                          <div className="d-flex align-items-center">
                            <i className="bi bi-check-circle me-1 text-success"></i>
                            Активные
                            <Badge bg="success" className="ms-1" pill>
                              {getAdsByStatus('active').length}
                            </Badge>
                          </div>
                        }
                      >
                        <div className="p-3">
                          {renderAdsContent(getAdsByStatus('active'), loading.ads, 'активных объявлений')}
                        </div>
                      </Tab>
                    )}
                    
                    {getAdsByStatus('onModeration').length > 0 && (
                      <Tab 
                        eventKey="onModeration" 
                        title={
                          <div className="d-flex align-items-center">
                            <i className="bi bi-clock me-1 text-warning"></i>
                            На модерации
                            <Badge bg="warning" className="ms-1" pill>
                              {getAdsByStatus('onModeration').length}
                            </Badge>
                          </div>
                        }
                      >
                        <div className="p-3">
                          {renderAdsContent(getAdsByStatus('onModeration'), loading.ads, 'объявлений на модерации')}
                        </div>
                      </Tab>
                    )}
                    
                    {getAdsByStatus('wasFound').length > 0 && (
                      <Tab 
                        eventKey="wasFound" 
                        title={
                          <div className="d-flex align-items-center">
                            <i className="bi bi-heart-fill me-1 text-primary"></i>
                            Найдены хозяева
                            <Badge bg="primary" className="ms-1" pill>
                              {getAdsByStatus('wasFound').length}
                            </Badge>
                          </div>
                        }
                      >
                        <div className="p-3">
                          {renderAdsContent(getAdsByStatus('wasFound'), loading.ads, 'объявлений с найденными хозяевами')}
                        </div>
                      </Tab>
                    )}
                    
                    {getAdsByStatus('archive').length > 0 && (
                      <Tab 
                        eventKey="archive" 
                        title={
                          <div className="d-flex align-items-center">
                            <i className="bi bi-archive me-1 text-secondary"></i>
                            Архив
                            <Badge bg="secondary" className="ms-1" pill>
                              {getAdsByStatus('archive').length}
                            </Badge>
                          </div>
                        }
                      >
                        <div className="p-3">
                          {renderAdsContent(getAdsByStatus('archive'), loading.ads, 'архивных объявлений')}
                        </div>
                      </Tab>
                    )}
                  </Tabs>
                </>
              )}
            </Card.Body>
            
            {userAds.length > 0 && !loading.ads && (
              <Card.Footer className="text-muted small">
                <div className="d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-info-circle me-1"></i>
                    Подсказка: нажмите на карточку для просмотра подробностей
                  </span>
                  <span>
                    Всего: {userAds.length} объявлений
                  </span>
                </div>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>

      <EditPhoneModal
        show={phoneModal}
        onHide={() => setPhoneModal(false)}
        currentPhone={currentUser?.phone}
        onUpdate={handleUpdatePhone}
      />

      <EditEmailModal
        show={emailModal}
        onHide={() => setEmailModal(false)}
        currentEmail={currentUser?.email}
        onUpdate={handleUpdateEmail}
      />

      <EditAdModal
        show={editAdModal.show}
        onHide={() => setEditAdModal({ show: false, ad: null })}
        ad={editAdModal.ad}
        onUpdate={handleUpdateAd}
      />

      <DeleteConfirmationModal
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, adId: null, adTitle: '', adStatus: '' })}
        onConfirm={handleDeleteConfirm}
        adTitle={deleteModal.adTitle}
        adStatus={deleteModal.adStatus}
      />
    </Container>
  );
}

export default Profile;