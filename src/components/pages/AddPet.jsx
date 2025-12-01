import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AddPet() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    animalType: '',
    district: '',
    mark: '',
    description: '',
    photos: ['', '', ''], // Для хранения превью
    files: [null, null, null], // Для хранения файлов
    registerOption: 'no',
    password: '',
    confirmPassword: '',
    agree: false
  });
  
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
      // Автоматически заполняем поля для авторизованного пользователя
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || ''
      }));
    }
  }, []);

  // Валидация полей
  const validateField = (name, value) => {
    switch(name) {
      case 'name':
        if (!value.trim()) return 'Обязательное поле';
        return /^[А-Яа-яёЁ\s\-]+$/.test(value) ? '' : 'Только кириллица, пробелы и дефисы';
      case 'phone':
        if (!value.trim()) return 'Обязательное поле';
        return /^[\+\d]+$/.test(value) ? '' : 'Только цифры и знак +';
      case 'email':
        if (!value.trim()) return 'Обязательное поле';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Пожалуйста, введите корректный email';
      case 'password':
        if (formData.registerOption === 'yes') {
          if (!value) return 'Обязательное поле при регистрации';
          if (value.length < 7) return 'Минимум 7 символов';
          if (!/\d/.test(value)) return 'Должна быть хотя бы одна цифра';
          if (!/[a-z]/.test(value)) return 'Должна быть хотя бы одна строчная буква';
          if (!/[A-Z]/.test(value)) return 'Должна быть хотя бы одна заглавная буква';
        }
        return '';
      case 'confirmPassword':
        if (formData.registerOption === 'yes') {
          if (!value) return 'Обязательное поле при регистрации';
          return value === formData.password ? '' : 'Пароли не совпадают';
        }
        return '';
      case 'animalType':
      case 'district':
        return value ? '' : 'Пожалуйста, выберите значение';
      case 'description':
        return value.trim() ? '' : 'Пожалуйста, заполните описание';
      case 'photos[0]':
        return formData.files[0] ? '' : 'Требуется хотя бы одна фотография';
      case 'agree':
        return value ? '' : 'Необходимо согласие';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (name === 'registerOption') {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    if (type === 'file') {
      const fileIndex = parseInt(name.replace('photo', '')) - 1;
      const file = files[0];
      
      if (file) {
        // Проверяем формат PNG
        if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
          setErrors(prev => ({ 
            ...prev, 
            [`photos[${fileIndex}]`]: 'Поддерживается только формат PNG'
          }));
          return;
        }

        // Проверяем размер (максимум 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setErrors(prev => ({ 
            ...prev, 
            [`photos[${fileIndex}]`]: 'Размер файла не должен превышать 5MB'
          }));
          return;
        }

        // Создаем превью
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhotos = [...formData.photos];
          const newFiles = [...formData.files];
          newPhotos[fileIndex] = e.target.result;
          newFiles[fileIndex] = file;
          
          setFormData(prev => ({ 
            ...prev, 
            photos: newPhotos,
            files: newFiles
          }));
          
          setErrors(prev => ({ 
            ...prev, 
            [`photos[${fileIndex}]`]: ''
          }));
        };
        reader.readAsDataURL(file);
      } else {
        const newPhotos = [...formData.photos];
        const newFiles = [...formData.files];
        newPhotos[fileIndex] = '';
        newFiles[fileIndex] = null;
        
        setFormData(prev => ({ 
          ...prev, 
          photos: newPhotos,
          files: newFiles
        }));
      }
      return;
    }

    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Валидация в реальном времени
    const error = validateField(name, fieldValue);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = [...formData.photos];
    const newFiles = [...formData.files];
    newPhotos[index] = '';
    newFiles[index] = null;
    
    setFormData(prev => ({ 
      ...prev, 
      photos: newPhotos,
      files: newFiles
    }));
    
    const input = document.getElementById(`addPhoto${index + 1}`);
    if (input) input.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    // Проверяем все обязательные поля
    const requiredFields = ['name', 'phone', 'email', 'animalType', 'district', 'description'];
    const newErrors = {};
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    // Проверяем первую фотографию
    if (!formData.files[0]) {
      newErrors['photos[0]'] = 'Требуется хотя бы одна фотография';
    }

    // Проверяем пароли если выбрана регистрация
    if (formData.registerOption === 'yes') {
      const passwordError = validateField('password', formData.password);
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      if (passwordError) newErrors.password = passwordError;
      if (confirmError) newErrors.confirmPassword = confirmError;
    }

    // Проверяем согласие
    if (!formData.agree) {
      newErrors.agree = 'Необходимо согласие';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Создаем новый объект объявления
      const adData = {
        id: Date.now(),
        userId: currentUser?.id || Date.now(),
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        animalType: formData.animalType,
        district: formData.district,
        mark: formData.mark || '',
        description: formData.description,
        date: new Date().toISOString().split('T')[0],
        status: 'onModeration',
        // Преобразуем файлы в Data URLs для хранения
        photos: formData.photos.filter(photo => photo),
        image: formData.photos[0] || 'default-pet.jpg'
      };

      // Если выбрана регистрация и пользователь не авторизован
      if (formData.registerOption === 'yes' && !currentUser) {
        const userData = {
          id: Date.now(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          registrationDate: new Date().toISOString().split('T')[0]
        };

        // Сохраняем пользователя
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const existingUser = users.find(u => u.email === formData.email);
        
        if (!existingUser) {
          users.push(userData);
          localStorage.setItem('users', JSON.stringify(users));
        }

        // Входим как новый пользователь
        localStorage.setItem('currentUser', JSON.stringify({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          registrationDate: userData.registrationDate
        }));

        adData.userId = userData.id;
      }

      // Сохраняем объявление
      const userAds = JSON.parse(localStorage.getItem('userAds')) || [];
      userAds.push(adData);
      localStorage.setItem('userAds', JSON.stringify(userAds));

      setMessage('Объявление успешно добавлено и отправлено на модерацию! Перенаправляем...');

      // Перенаправляем через 2 секунды
      setTimeout(() => {
        if (currentUser || formData.registerOption === 'yes') {
          navigate('/profile');
        } else {
          navigate('/main');
        }
      }, 2000);

    } catch (error) {
      setMessage(`Ошибка: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/main');
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Добавить объявление о найденном животном</h3>
              
              {message && (
                <div className={`alert ${message.includes('успешно') ? 'alert-success' : 'alert-danger'}`}>
                  {message}
                </div>
              )}
              
              <form id="addPetForm" onSubmit={handleSubmit}>
                {/* Личная информация */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5>Личная информация</h5>
                    <hr />
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="addName" className="form-label">Имя *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : formData.name && !errors.name ? 'is-valid' : ''}`}
                        id="addName"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        readOnly={!!currentUser}
                        required
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="addPhone" className="form-label">Телефон *</label>
                      <input
                        type="tel"
                        className={`form-control ${errors.phone ? 'is-invalid' : formData.phone && !errors.phone ? 'is-valid' : ''}`}
                        id="addPhone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        readOnly={!!currentUser}
                        required
                      />
                      {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label htmlFor="addEmail" className="form-label">Email *</label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : formData.email && !errors.email ? 'is-valid' : ''}`}
                        id="addEmail"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        readOnly={!!currentUser}
                        required
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>
                  </div>
                </div>

                {/* Регистрация */}
                {!currentUser && (
                  <div className="row mb-4">
                    <div className="col-12">
                      <h5>Регистрация</h5>
                      <hr />
                    </div>
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Зарегистрироваться при добавлении объявления?</label>
                        <div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="registerOption"
                              id="registerNo"
                              value="no"
                              checked={formData.registerOption === 'no'}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="registerNo">Нет</label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="registerOption"
                              id="registerYes"
                              value="yes"
                              checked={formData.registerOption === 'yes'}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="registerYes">Да</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Поля для пароля (только если выбрана регистрация и нет текущего пользователя) */}
                {formData.registerOption === 'yes' && !currentUser && (
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="addPassword" className="form-label">Пароль *</label>
                        <input
                          type="password"
                          className={`form-control ${errors.password ? 'is-invalid' : formData.password && !errors.password ? 'is-valid' : ''}`}
                          id="addPassword"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                        <div className="form-text">Минимум 7 символов, 1 цифра, 1 строчная и 1 заглавная буква</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="addPasswordConfirm" className="form-label">Подтверждение пароля *</label>
                        <input
                          type="password"
                          className={`form-control ${errors.confirmPassword ? 'is-invalid' : formData.confirmPassword && !errors.confirmPassword ? 'is-valid' : ''}`}
                          id="addPasswordConfirm"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                        {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Информация о животном */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5>Информация о животном</h5>
                    <hr />
                  </div>

                  {/* Фото */}
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="addPhoto1" className="form-label">Фото 1 *</label>
                      <input
                        type="file"
                        className={`form-control ${errors['photos[0]'] ? 'is-invalid' : formData.photos[0] ? 'is-valid' : ''}`}
                        id="addPhoto1"
                        name="photo1"
                        accept=".png"
                        onChange={handleChange}
                      />
                      {errors['photos[0]'] && <div className="invalid-feedback">{errors['photos[0]']}</div>}
                      <div className="form-text">
                        <small className="text-info">📷 Поддерживается только формат PNG</small>
                      </div>
                      
                      {formData.photos[0] && (
                        <div className="mt-2">
                          <img 
                            src={formData.photos[0]} 
                            alt="Предпросмотр" 
                            className="img-thumbnail"
                            style={{ maxWidth: '100%', maxHeight: '150px' }}
                          />
                          <button 
                            type="button"
                            className="btn btn-sm btn-outline-danger mt-1"
                            onClick={() => handleRemovePhoto(0)}
                          >
                            Удалить фото
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="addPhoto2" className="form-label">Фото 2</label>
                      <input
                        type="file"
                        className={`form-control ${formData.photos[1] ? 'is-valid' : ''}`}
                        id="addPhoto2"
                        name="photo2"
                        accept=".png"
                        onChange={handleChange}
                      />
                      <div className="form-text text-success">Необязательное поле</div>
                      <div className="form-text">
                        <small className="text-info">📷 Только PNG формат</small>
                      </div>
                      
                      {formData.photos[1] && (
                        <div className="mt-2">
                          <img 
                            src={formData.photos[1]} 
                            alt="Предпросмотр" 
                            className="img-thumbnail"
                            style={{ maxWidth: '100%', maxHeight: '150px' }}
                          />
                          <button 
                            type="button"
                            className="btn btn-sm btn-outline-danger mt-1"
                            onClick={() => handleRemovePhoto(1)}
                          >
                            Удалить фото
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="addPhoto3" className="form-label">Фото 3</label>
                      <input
                        type="file"
                        className={`form-control ${formData.photos[2] ? 'is-valid' : ''}`}
                        id="addPhoto3"
                        name="photo3"
                        accept=".png"
                        onChange={handleChange}
                      />
                      <div className="form-text text-success">Необязательное поле</div>
                      <div className="form-text">
                        <small className="text-info">📷 Только PNG формат</small>
                      </div>
                      
                      {formData.photos[2] && (
                        <div className="mt-2">
                          <img 
                            src={formData.photos[2]} 
                            alt="Предпросмотр" 
                            className="img-thumbnail"
                            style={{ maxWidth: '100%', maxHeight: '150px' }}
                          />
                          <button 
                            type="button"
                            className="btn btn-sm btn-outline-danger mt-1"
                            onClick={() => handleRemovePhoto(2)}
                          >
                            Удалить фото
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="mb-3">
                      <label htmlFor="animalType" className="form-label">Вид животного *</label>
                      <select
                        className={`form-control ${errors.animalType ? 'is-invalid' : formData.animalType && !errors.animalType ? 'is-valid' : ''}`}
                        id="animalType"
                        name="animalType"
                        value={formData.animalType}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Выберите вид</option>
                        <option value="cat">Кошка</option>
                        <option value="dog">Собака</option>
                        <option value="other">Другое</option>
                      </select>
                      {errors.animalType && <div className="invalid-feedback">{errors.animalType}</div>}
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="mb-3">
                      <label htmlFor="district" className="form-label">Район *</label>
                      <select
                        className={`form-control ${errors.district ? 'is-invalid' : formData.district && !errors.district ? 'is-valid' : ''}`}
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Выберите район</option>
                        <option value="Центральный">Центральный</option>
                        <option value="Северный">Северный</option>
                        <option value="Южный">Южный</option>
                        <option value="Западный">Западный</option>
                        <option value="Восточный">Восточный</option>
                      </select>
                      {errors.district && <div className="invalid-feedback">{errors.district}</div>}
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="mb-3">
                      <label htmlFor="addMark" className="form-label">Клеймо</label>
                      <input
                        type="text"
                        className="form-control"
                        id="addMark"
                        name="mark"
                        value={formData.mark}
                        onChange={handleChange}
                        placeholder="Необязательное поле"
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="mb-3">
                      <label htmlFor="addDescription" className="form-label">Описание *</label>
                      <textarea
                        className={`form-control ${errors.description ? 'is-invalid' : formData.description && !errors.description ? 'is-valid' : ''}`}
                        id="addDescription"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Опишите животное, место и время находки..."
                        required
                      />
                      {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                    </div>
                  </div>
                </div>

                {/* Согласие */}
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className={`form-check-input ${errors.agree ? 'is-invalid' : formData.agree ? 'is-valid' : ''}`}
                    id="addConfirm"
                    name="agree"
                    checked={formData.agree}
                    onChange={handleChange}
                    required
                  />
                  <label className="form-check-label" htmlFor="addConfirm">
                    Согласие на обработку персональных данных *
                  </label>
                  {errors.agree && <div className="invalid-feedback d-block">{errors.agree}</div>}
                </div>

                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg flex-grow-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Обработка...
                      </>
                    ) : 'Добавить объявление'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-lg"
                    onClick={handleCancel}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddPet;