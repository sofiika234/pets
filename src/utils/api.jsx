const API_CONFIG = {
  BASE_URL: 'https://pets.сделай.site/api',
  IMAGE_BASE: 'https://pets.сделай.site'
};

// Утилиты валидации согласно ТЗ
export const validation = {
  validateName: (name) => /^[а-яА-ЯёЁ\s-]+$/.test(name),
  validatePhone: (phone) => /^\+?[0-9]+$/.test(phone.replace(/\s/g, '')),
  validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  validatePassword: (password) => {
    if (password.length < 7) return false;
    if (!/\d/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    return true;
  }
};

// Хелпер для нормализации ответов API
const normalizeApiResponse = (responseData, status) => {
  if (!responseData) {
    return {
      success: status >= 200 && status < 300,
      status: status,
      data: null
    };
  }

  // Если уже нормализованный ответ
  if (responseData.success !== undefined) {
    return responseData;
  }

  // Формат 1: { data: { ... } }
  if (responseData.data !== undefined) {
    return {
      success: true,
      status: status,
      data: responseData.data,
      ...responseData
    };
  }

  // Формат 2: Прямые данные
  return {
    success: true,
    status: status,
    data: responseData
  };
};

// Базовые функции API
export const api = {
  async request(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('authToken');

      const headers = {
        'Accept': 'application/json',
        ...options.headers
      };

      // Для multipart/form-data НЕ добавляем Content-Type автоматически
      if (!options.isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      // Добавляем токен авторизации для защищенных эндпоинтов
      if (token && !options.public) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${API_CONFIG.BASE_URL}${endpoint}`;

      console.log(`API Request: ${options.method} ${url}`, { headers });

      const fetchOptions = {
        ...options,
        headers,
        mode: 'cors',
        credentials: 'omit'
      };

      // Таймаут запроса
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Таймаут запроса')), 10000)
      );

      const response = await Promise.race([
        fetch(url, fetchOptions),
        timeoutPromise
      ]);

      return await this.handleResponse(response);

    } catch (error) {
      console.error('API Request Error:', error);

      // Улучшенная обработка ошибок сети
      if (error.message.includes('Failed to fetch') ||
          error.message.includes('Network Error') ||
          error.message.includes('Таймаут')) {
        const networkError = new Error('Нет подключения к серверу. Проверьте интернет-соединение.');
        networkError.status = 0;
        error.isNetworkError = true;
        throw networkError;
      }

      throw error;
    }
  },

  async handleResponse(response) {
    console.log(`API Response Status: ${response.status} ${response.statusText}`);

    // 204 No Content
    if (response.status === 204) {
      console.log('API Response: 204 No Content');
      return {
        success: true,
        status: 204,
        data: null
      };
    }

    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await response.text();
      console.log(`API Response (non-JSON): ${response.status}`, errorText.substring(0, 200));

      if (response.ok) {
        return {
          success: true,
          status: response.status,
          text: errorText,
          data: { message: errorText }
        };
      } else {
        const error = new Error(`HTTP error ${response.status}: ${errorText.substring(0, 100)}`);
        error.status = response.status;
        error.text = errorText;
        throw error;
      }
    }

    try {
      const data = await response.json();
      console.log(`API Response JSON: ${response.status}`, data);

      // Обработка ошибок от сервера
      if (!response.ok || data.error) {
        const errorData = data.error || data;
        const error = new Error(errorData.message || `Ошибка сервера ${response.status}`);
        error.status = response.status || errorData.code;
        error.code = errorData.code;
        error.errors = errorData.errors || {};
        error.data = data;
        throw error;
      }

      // Успешный ответ - нормализуем его
      return normalizeApiResponse(data, response.status);

    } catch (jsonError) {
      console.error('JSON Parse Error:', jsonError);

      if (response.ok) {
        return {
          success: true,
          status: response.status,
          data: null
        };
      }

      const error = new Error('Ошибка обработки ответа сервера');
      error.status = response.status;
      error.originalError = jsonError;
      throw error;
    }
  },

  get(endpoint, params = null, options = {}) {
    let url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });
      url = `${endpoint}?${queryParams.toString()}`;
    }

    return this.request(url, { method: 'GET', ...options });
  },

  post(endpoint, data = null, isFormData = false, options = {}) {
    const requestOptions = { method: 'POST', ...options };
    if (isFormData) {
      requestOptions.body = data;
      requestOptions.isFormData = true;
    } else if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return this.request(endpoint, requestOptions);
  },

  patch(endpoint, data = null, options = {}) {
    const requestOptions = { method: 'PATCH', ...options };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return this.request(endpoint, requestOptions);
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  },

  put(endpoint, data = null, isFormData = false, options = {}) {
    const requestOptions = { method: 'PUT', ...options };
    if (isFormData) {
      requestOptions.body = data;
      requestOptions.isFormData = true;
    } else if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return this.request(endpoint, requestOptions);
  },

  getImageUrl(imagePath) {
    if (!imagePath) {
      return `${API_CONFIG.IMAGE_BASE}/images/default-pet.jpg`;
    }
    if (typeof imagePath === 'string') {
      if (imagePath.startsWith('http')) return imagePath;
      if (imagePath.includes('{url}')) return imagePath.replace('{url}', API_CONFIG.IMAGE_BASE);
      if (imagePath.startsWith('/')) return `${API_CONFIG.IMAGE_BASE}${imagePath}`;
      return `${API_CONFIG.IMAGE_BASE}/${imagePath}`;
    }
    if (Array.isArray(imagePath) && imagePath.length > 0) {
      return this.getImageUrl(imagePath[0]);
    }
    return `${API_CONFIG.IMAGE_BASE}/images/default-pet.jpg`;
  },

  getImageUrls(photos) {
    if (!photos) return [this.getImageUrl(null)];

    if (Array.isArray(photos)) {
      return photos.map(photo => this.getImageUrl(photo));
    }

    if (typeof photos === 'string') {
      return [this.getImageUrl(photos)];
    }

    return [this.getImageUrl(null)];
  }
};

// API для работы с животными
export const petsApi = {
  // 1. Слайдер с объявлениями (ТЗ: {host}/api/pets/slider)
  getSlider() {
    return api.get('/pets/slider', null, { public: true });
  },

  // 2. Быстрый поиск по объявлениям (ТЗ: {host}/api/search)
  quickSearch(query) {
    const params = query ? { query } : {};
    return api.get('/search', params, { public: true });
  },

  // 3. Карточки найденных животных (ТЗ: {host}/api/pets)
  getRecentPets() {
    return api.get('/pets', null, { public: true });
  },

  // 4. Карточка одного животного (ТЗ: {host}/api/pets/{id})
  getPet(id) {
    return api.get(`/pets/${id}`, null, { public: true });
  },

  // 5. Добавление объявления (ТЗ: {host}/api/pets, POST, multipart/form-data)
  async addPet(formData) {
    try {
      return await api.post('/pets', formData, true);
    } catch (error) {
      console.error('Ошибка при добавлении объявления:', error);
      throw error;
    }
  },

  // 6. Редактирование объявления (ТЗ: {host}/api/pets/{id}, POST, multipart/form-data)
  async updatePet(id, formData) {
    try {
      return await api.post(`/pets/${id}`, formData, true);
    } catch (error) {
      console.error('Ошибка при редактировании объявления:', error);
      throw error;
    }
  },

  // 7. Удаление объявления (ТЗ: {host}/api/users/orders/{id}, DELETE)
  async deleteOrder(id) {
    try {
      return await api.delete(`/users/orders/${id}`);
    } catch (error) {
      console.error('Ошибка при удалении объявления:', error);
      throw error;
    }
  }
};

// API для авторизации и пользователей
export const authApi = {
  // 1. Регистрация (ТЗ: {host}/api/register, POST)
  async register(userData) {
    try {
      console.log('Регистрация пользователя:', userData);
      const response = await api.post('/register', userData, false, { public: true });

      console.log('Ответ регистрации:', response);

      // Согласно ТЗ: при успешной регистрации может вернуться токен или статус 204
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
        console.log('Токен сохранен при регистрации');
      } else if (response.status === 204 || response.status === 200) {
        console.log('Регистрация успешна, но токен не получен');
        // Возвращаем успешный ответ
        return {
          success: true,
          status: response.status,
          data: { message: 'Регистрация успешна' }
        };
      }

      return response;

    } catch (error) {
      console.error('Ошибка регистрации:', error);

      // Обработка ошибок валидации
      if (error.status === 422) {
        const formattedError = new Error('Ошибка валидации');
        formattedError.status = 422;
        formattedError.errors = error.errors || error.data?.error?.errors || {};
        throw formattedError;
      }

      throw error;
    }
  },

  // 2. Аутентификация (ТЗ: {host}/api/login, POST)
  async login(credentials) {
    try {
      const response = await api.post('/login', credentials, false, { public: true });

      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
        console.log('Токен сохранен при входе');
      }

      return response;
    } catch (error) {
      console.error('Ошибка входа:', error);

      // Обработка ошибок валидации
      if (error.status === 422) {
        const formattedError = new Error('Ошибка валидации');
        formattedError.status = 422;
        formattedError.errors = error.errors || error.data?.error?.errors || {};
        throw formattedError;
      }

      throw error;
    }
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
  },

  // 3. Информация о пользователе (ТЗ: {host}/api/users/, GET)
  async getUser() {
    try {
      const response = await api.get('/users/');

      // Обработка согласно ТЗ
      let userData;
      if (response.data?.user) {
        userData = Array.isArray(response.data.user) ? response.data.user[0] : response.data.user;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        if (userData.id) {
          localStorage.setItem('userId', userData.id.toString());
        }
      } else if (response.data) {
        userData = response.data;
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }

      return response;
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error);
      throw error;
    }
  },

  // 4. Изменение телефона (ТЗ: {host}/api/users/phone, PATCH)
  async updatePhone(phone) {
    try {
      return await api.patch('/users/phone', { phone });
    } catch (error) {
      console.error('Ошибка обновления телефона:', error);
      throw error;
    }
  },

  // 5. Изменение email (ТЗ: {host}/api/users/email, PATCH)
  async updateEmail(email) {
    try {
      return await api.patch('/users/email', { email });
    } catch (error) {
      console.error('Ошибка обновления email:', error);
      throw error;
    }
  },

  // 6. Объявления пользователя (ТЗ: {host}/api/users/orders/, GET)
  async getUserOrders() {
    try {
      return await api.get('/users/orders/');
    } catch (error) {
      console.error('Ошибка загрузки объявлений пользователя:', error);
      throw error;
    }
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  getCurrentUser() {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  },

  getUserId() {
    return localStorage.getItem('userId');
  }
};

// API для подписки на новости
export const subscriptionApi = {
  // Подписка на новости (ТЗ: {host}/api/subscription, POST)
  async subscribe(email) {
    try {
      return await api.post('/subscription', { email }, false, { public: true });
    } catch (error) {
      console.error('Ошибка подписки:', error);
      throw error;
    }
  }
};

// API для поиска по объявлениям с пагинацией
export const searchApi = {
  // Поиск с фильтрами (ТЗ: {host}/api/search/, GET с параметрами district и kind)
  search(filters = {}, page = 1, limit = 10) {
    const params = {
      ...filters,
      page,
      limit
    };

    return api.get('/search/', params, { public: true });
  }
};

export { API_CONFIG };