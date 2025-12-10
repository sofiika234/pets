// Конфигурация API
const API_BASE_URL = 'https://pets.сделай.site/api';
const IMAGE_BASE_URL = 'https://pets.сделай.site';

export const config = {
  API_BASE_URL,
  IMAGE_BASE_URL
};

// Основная функция для работы с API
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const requestOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };
  
  console.log(`API Request: ${API_BASE_URL}${endpoint}`, requestOptions);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    
    console.log(`API Response ${endpoint}:`, response.status, response.statusText);
    
    // Обрабатываем пустые ответы
    if (response.status === 204 || response.status === 205) {
      return { success: true, status: response.status };
    }
    
    const responseText = await response.text();
    console.log(`Response text from ${endpoint}:`, responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      data = { raw: responseText };
    }
    
    if (!response.ok) {
      const error = new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
    
  } catch (error) {
    console.error(`API Error at ${endpoint}:`, error);
    
    // Улучшенная обработка сетевых ошибок
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Нет подключения к серверу. Проверьте интернет-соединение.');
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    
    throw error;
  }
};

// Основные методы API
export const api = {
  // GET запрос
  get: async (endpoint) => {
    return apiRequest(endpoint, { method: 'GET' });
  },
  
  // POST запрос
  post: async (endpoint, data, isFormData = false) => {
    const options = {
      method: 'POST',
    };
    
    if (isFormData) {
      options.body = data;
      delete options.headers?.['Content-Type']; // Let browser set content-type for FormData
    } else {
      options.body = JSON.stringify(data);
    }
    
    return apiRequest(endpoint, options);
  },
  
  // PUT запрос
  put: async (endpoint, data, isFormData = false) => {
    const options = {
      method: 'PUT',
    };
    
    if (isFormData) {
      options.body = data;
      delete options.headers?.['Content-Type'];
    } else {
      options.body = JSON.stringify(data);
    }
    
    return apiRequest(endpoint, options);
  },
  
  // PATCH запрос
  patch: async (endpoint, data, isFormData = false) => {
    const options = {
      method: 'PATCH',
    };
    
    if (isFormData) {
      options.body = data;
      delete options.headers?.['Content-Type'];
    } else {
      options.body = JSON.stringify(data);
    }
    
    return apiRequest(endpoint, options);
  },
  
  // DELETE запрос
  delete: async (endpoint) => {
    return apiRequest(endpoint, { method: 'DELETE' });
  },
  
  // Функция для получения URL изображений
  getImageUrl: (imagePath) => {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
      return `${IMAGE_BASE_URL}/images/default-pet.jpg`;
    }
    
    // Если уже полный URL
    if (typeof imagePath === 'string' && 
        (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
      return imagePath;
    }
    
    // Если это массив
    if (Array.isArray(imagePath) && imagePath.length > 0) {
      return api.getImageUrl(imagePath[0]);
    }
    
    // Если это строка
    if (typeof imagePath === 'string') {
      const cleanPath = imagePath.replace(/^\/+/, '');
      
      // Проверяем, содержит ли путь уже папку storage/ или uploads/
      if (cleanPath.includes('storage/') || cleanPath.includes('uploads/') || cleanPath.includes('images/')) {
        return `${IMAGE_BASE_URL}/${cleanPath}`;
      }
      
      // Пробуем разные варианты расположения
      const possiblePaths = [
        `storage/${cleanPath}`,
        `uploads/${cleanPath}`,
        `images/${cleanPath}`,
        `storage/uploads/${cleanPath}`,
        cleanPath
      ];
      
      return `${IMAGE_BASE_URL}/${possiblePaths[0]}`;
    }
    
    return `${IMAGE_BASE_URL}/images/default-pet.jpg`;
  }
};

// API для работы с питомцами/объявлениями
export const petsApi = {
  // Получение слайдера
  getSlider: async () => {
    try {
      // Пробуем разные эндпоинты для слайдера
      const endpoints = [
        '/pets?limit=5&orderBy=created_at&order=desc',
        '/orders?limit=5&orderBy=created_at&order=desc',
        '/animals?limit=5',
        '/pets?status=found&limit=5'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          
          // Проверяем разные форматы ответа
          if (response && (Array.isArray(response) || response.data || response.pets || response.orders)) {
            return response;
          }
        } catch (error) {
          console.log(`Эндпоинт ${endpoint} не сработал:`, error.message);
          continue;
        }
      }
      
      // Если ничего не сработало, возвращаем демо-данные
      return {
        data: [
          {
            id: 1,
            kind: 'Собака',
            description: 'Дружелюбная собака нашла дом',
            photo: '/images/default-pet.jpg',
            created_at: '2024-01-15'
          },
          {
            id: 2,
            kind: 'Кошка',
            description: 'Котенок обрел новую семью',
            photo: '/images/default-pet.jpg',
            created_at: '2024-01-10'
          }
        ]
      };
      
    } catch (error) {
      console.error('Ошибка в getSlider:', error);
      throw error;
    }
  },
  
  // Получение последних питомцев
  getRecentPets: async (limit = 6) => {
    try {
      const endpoints = [
        `/pets?limit=${limit}&orderBy=created_at&order=desc`,
        `/orders?limit=${limit}&orderBy=created_at&order=desc`,
        `/animals?limit=${limit}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          
          if (response && (Array.isArray(response) || response.data || response.pets || response.orders)) {
            return response;
          }
        } catch (error) {
          console.log(`Эндпоинт ${endpoint} не сработал:`, error.message);
          continue;
        }
      }
      
      // Демо-данные
      return {
        data: [
          {
            id: 1,
            kind: 'Собака',
            description: 'Найдена в парке',
            district: 'Центральный',
            photos: ['/images/default-pet.jpg'],
            created_at: '2024-01-15',
            status: 'active'
          },
          {
            id: 2,
            kind: 'Кошка',
            description: 'Ищет дом',
            district: 'Северный',
            photos: ['/images/default-pet.jpg'],
            created_at: '2024-01-14',
            status: 'active'
          }
        ]
      };
      
    } catch (error) {
      console.error('Ошибка в getRecentPets:', error);
      throw error;
    }
  },
  
  // Поиск питомцев
  search: async (query, filters = {}) => {
    const params = new URLSearchParams();
    
    if (query) params.append('q', query);
    if (filters.type) params.append('type', filters.type);
    if (filters.district) params.append('district', filters.district);
    if (filters.status) params.append('status', filters.status);
    if (filters.gender) params.append('gender', filters.gender);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/search?${queryString}` : '/search';
    
    return api.get(endpoint);
  },
  
  // Получение конкретного питомца
  getPet: async (id) => {
    try {
      // Пробуем разные эндпоинты
      const endpoints = [
        `/pets/${id}`,
        `/orders/${id}`,
        `/animals/${id}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          
          if (response && (response.id || response.data?.id || response.pet?.id || response.order?.id)) {
            return response;
          }
        } catch (error) {
          console.log(`Эндпоинт ${endpoint} не сработал:`, error.message);
          continue;
        }
      }
      
      throw new Error(`Питомец с ID ${id} не найден`);
      
    } catch (error) {
      console.error(`Ошибка в getPet(${id}):`, error);
      throw error;
    }
  },
  
  // Создание нового объявления
  createPet: async (petData, isFormData = false) => {
    const endpoint = '/pets';
    return api.post(endpoint, petData, isFormData);
  },
  
  // Обновление объявления
  updatePet: async (id, petData, isFormData = false) => {
    const endpoint = `/pets/${id}`;
    return api.patch(endpoint, petData, isFormData);
  },
  
  // Удаление объявления
  deletePet: async (id) => {
    const endpoint = `/pets/${id}`;
    return api.delete(endpoint);
  },
  
  // Получение объявлений пользователя
  getUserPets: async (userId = 'me') => {
    return api.get(`/users/${userId}/pets`);
  }
};

// API для аутентификации
export const authApi = {
  // Регистрация
  register: async (userData) => {
    console.log('Регистрация нового пользователя:', userData);
    
    const registrationData = {
      name: userData.name?.trim(),
      email: userData.email?.trim(),
      password: userData.password,
      password_confirmation: userData.password_confirmation || userData.password
    };
    
    // Добавляем телефон, если есть
    if (userData.phone?.trim()) {
      registrationData.phone = userData.phone.trim();
    }
    
    try {
      const response = await api.post('/register', registrationData);
      console.log('Регистрация успешна:', response);
      return response;
      
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      
      // Улучшенная обработка ошибок
      if (error.status === 422) {
        const errorMsg = this.parseValidationErrors(error.data);
        error.message = errorMsg;
      } else if (error.status === 409) {
        error.message = 'Пользователь с таким email уже существует';
      } else if (error.status === 400) {
        error.message = 'Неверный формат данных';
      }
      
      throw error;
    }
  },
  
  // Вход
  login: async (credentials) => {
    console.log('Вход пользователя:', credentials);
    
    const loginData = {
      email: credentials.email?.trim(),
      password: credentials.password
    };
    
    try {
      const response = await api.post('/login', loginData);
      console.log('Ответ входа:', response);
      
      // Извлекаем токен из разных форматов ответа
      let token = null;
      let userData = null;
      
      if (response.token) {
        token = response.token;
        userData = response.user || response.data;
      } else if (response.data?.token) {
        token = response.data.token;
        userData = response.data.user || response.data;
      } else if (response.access_token) {
        token = response.access_token;
        userData = response.user || response;
      } else if (response.data?.access_token) {
        token = response.data.access_token;
        userData = response.data.user || response.data;
      }
      
      if (token) {
        console.log('Токен найден, сохраняем в localStorage');
        localStorage.setItem('authToken', token);
        
        // Сохраняем данные пользователя
        if (userData) {
          const preparedUser = {
            id: userData.id || userData._id || `user-${Date.now()}`,
            name: userData.name || userData.username || credentials.email.split('@')[0],
            email: userData.email || credentials.email,
            phone: userData.phone || '',
            registrationDate: userData.created_at || userData.createdAt || new Date().toISOString().split('T')[0]
          };
          
          localStorage.setItem('currentUser', JSON.stringify(preparedUser));
          console.log('Данные пользователя сохранены:', preparedUser);
        }
      } else {
        console.warn('Токен не найден в ответе:', response);
      }
      
      return response;
      
    } catch (error) {
      console.error('Ошибка входа:', error);
      
      if (error.status === 401) {
        error.message = 'Неверный email или пароль';
      } else if (error.status === 422) {
        error.message = 'Ошибка валидации данных';
      } else if (error.status === 404) {
        error.message = 'Пользователь не найден';
      }
      
      throw error;
    }
  },
  
  // Выход
  logout: async () => {
    try {
      await api.post('/logout', {});
    } catch (error) {
      console.warn('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      console.log('Пользователь вышел из системы');
    }
  },
  
  // Получение данных пользователя
  getUser: async (id = 'me') => {
    try {
      const response = await api.get(`/users/${id}`);
      console.log('Данные пользователя получены:', response);
      return response;
      
    } catch (error) {
      console.error(`Ошибка получения пользователя ${id}:`, error);
      
      // Пробуем получить сохраненные данные
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        console.log('Используем сохраненные данные пользователя');
        try {
          return { 
            data: { 
              user: JSON.parse(savedUser) 
            } 
          };
        } catch (parseError) {
          console.error('Ошибка парсинга сохраненного пользователя:', parseError);
        }
      }
      
      throw error;
    }
  },
  
  // Обновление профиля
  updateProfile: async (id, userData) => {
    return api.patch(`/users/${id}`, userData);
  },
  
  // Проверка авторизации
  checkAuth: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
      await this.getUser('me');
      return true;
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        console.log('Токен истек, удаляем из localStorage');
      }
      return false;
    }
  },
  
  // Парсинг ошибок валидации
  parseValidationErrors: (errorData) => {
    if (!errorData) return 'Ошибка валидации данных';
    
    if (typeof errorData === 'string') {
      return errorData;
    }
    
    if (errorData.errors) {
      const errors = errorData.errors;
      if (typeof errors === 'object') {
        return Object.entries(errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
      }
    }
    
    if (errorData.message) {
      return errorData.message;
    }
    
    return 'Пожалуйста, проверьте введенные данные';
  }
};

// API для подписок
export const subscriptionApi = {
  subscribe: async (email) => {
    return api.post('/subscription', { email });
  },
  
  unsubscribe: async (email) => {
    return api.post('/subscription/unsubscribe', { email });
  }
};

// API для отладки и тестирования
export const debugApi = {
  // Проверка соединения с API
  testConnection: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      return {
        success: response.ok,
        status: response.status,
        url: API_BASE_URL,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url: API_BASE_URL,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  // Проверка авторизации
  testAuth: async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { 
        success: false, 
        error: 'Нет токена в localStorage',
        hasToken: false 
      };
    }
    
    try {
      const response = await api.get('/users/me');
      return { 
        success: true, 
        data: response,
        hasToken: true,
        tokenLength: token.length
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        status: error.status,
        hasToken: true,
        tokenLength: token.length
      };
    }
  },
  
  // Тест эндпоинтов
  testEndpoints: async () => {
    const endpoints = [
      '/pets',
      '/orders',
      '/animals',
      '/users/me',
      '/health'
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: { 'Accept': 'application/json' }
        });
        const endTime = Date.now();
        
        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
          responseTime: endTime - startTime
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 'error',
          ok: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
};

// Утилиты для работы с изображениями
export const imageUtils = {
  // Проверка доступности изображения
  checkImageAvailability: async (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ available: true, url });
      img.onerror = () => resolve({ available: false, url });
      img.src = url;
    });
  },
  
  // Получение дефолтного изображения
  getDefaultImage: () => {
    return `${IMAGE_BASE_URL}/images/default-pet.jpg`;
  },
  
  // Преобразование File в Base64
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  },
  
  // Создание FormData для загрузки изображений
  createImageFormData: (files, fieldName = 'photos') => {
    const formData = new FormData();
    
    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append(`${fieldName}[${index}]`, file);
      });
    } else if (files) {
      formData.append(fieldName, files);
    }
    
    return formData;
  }
};

// Экспорт по умолчанию
export default {
  api,
  petsApi,
  authApi,
  subscriptionApi,
  debugApi,
  imageUtils,
  config
};