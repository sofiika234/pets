import React from 'react';

const API_CONFIG = {
  BASE_URL: 'https://pets.сделай.site/api',
  IMAGE_BASE: 'https://pets.сделай.site',
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 2
};

// Утилиты валидации согласно ТЗ
export const validation = {
  validateName: (name) => /^[а-яА-ЯёЁ\s-]+$/.test(name?.trim() || ''),
  
  validatePhone: (phone) => {
    const cleaned = (phone || '').replace(/\s/g, '');
    return /^(\+7|7|8)?[0-9]{10}$/.test(cleaned);
  },
  
  validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() || ''),
  
  validatePassword: (password) => {
    if (!password || password.length < 7) return false;
    if (!/\d/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    return true;
  },

  normalizePhone: (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\s/g, '');
    
    if (cleaned.startsWith('8')) {
      return '+7' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      return '+7' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+7') && cleaned.length === 10) {
      return '+7' + cleaned;
    }
    
    return cleaned;
  }
};

// Утилита для работы с изображениями
export const imageUtils = {
  getImageUrl: (imagePath) => {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
      return `${API_CONFIG.IMAGE_BASE}/images/default-pet.jpg`;
    }
    
    // Если путь уже содержит полный URL
    if (typeof imagePath === 'string' && imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Если путь содержит шаблон {url}
    if (typeof imagePath === 'string' && imagePath.includes('{url}')) {
      return imagePath.replace('{url}', API_CONFIG.IMAGE_BASE);
    }
    
    // Если путь начинается с /
    if (typeof imagePath === 'string' && imagePath.startsWith('/')) {
      return `${API_CONFIG.IMAGE_BASE}${imagePath}`;
    }
    
    // Если это просто имя файла
    if (typeof imagePath === 'string') {
      return `${API_CONFIG.IMAGE_BASE}/images/${imagePath}`;
    }
    
    return `${API_CONFIG.IMAGE_BASE}/images/default-pet.jpg`;
  },
  
  // Функция для преобразования массива фотографий
  processPhotosArray: (photos) => {
    if (!photos) {
      return [`${API_CONFIG.IMAGE_BASE}/images/default-pet.jpg`];
    }
    
    if (Array.isArray(photos)) {
      if (photos.length === 0) {
        return [`${API_CONFIG.IMAGE_BASE}/images/default-pet.jpg`];
      }
      
      return photos
        .map(photo => imageUtils.getImageUrl(photo))
        .filter(url => url);
    }
    
    return [imageUtils.getImageUrl(photos)];
  }
};

// Улучшенная функция для обработки ответов сервера
const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (response.status === 204) {
    return { isJson: true, data: { success: true, status: 204 } };
  }
  
  const text = await response.text();
  
  if (!text.trim()) {
    return { isJson: true, data: {} };
  }
  
  try {
    const data = JSON.parse(text);
    return { isJson: true, data, text };
  } catch (e) {
    return { isJson: false, data: text, text };
  }
};

// Базовые функции API
export const api = {
  // Функция для получения URL изображения
  getImageUrl: imageUtils.getImageUrl,
  
  // Функция для обработки массива фотографий
  processPhotosArray: imageUtils.processPhotosArray,

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Accept': 'application/json',
      ...options.headers
    };
    
    if (!options.isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token && !options.public) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    console.log(`📤 API Request [${options.method || 'GET'} ${endpoint}]:`, url);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.DEFAULT_TIMEOUT);
      
      const fetchOptions = {
        ...options,
        headers,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      };
      
      const response = await fetch(url, fetchOptions);
      
      clearTimeout(timeoutId);
      return await this.handleResponse(response, endpoint);
      
    } catch (error) {
      console.error(`❌ API Error [${endpoint}]:`, error);
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Timeout (${API_CONFIG.DEFAULT_TIMEOUT/1000}s)`);
        timeoutError.status = 408;
        throw timeoutError;
      }
      
      const networkError = new Error('Network error');
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
  },

  async handleResponse(response, endpoint) {
    console.log(`📥 API Response [${endpoint}]:`, response.status);
    
    const { isJson, data, text } = await parseResponse(response);
    
    if (!response.ok) {
      let errorMessage = `Server error ${response.status}`;
      let errorDetails = {};
      
      if (isJson && data.error) {
        errorMessage = data.error.message || data.error;
        errorDetails = data.error.errors || data.error.details || {};
      } else if (isJson && data.message) {
        errorMessage = data.message;
      } else if (isJson && data.errors) {
        errorMessage = 'Validation error';
        errorDetails = data.errors;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.errors = errorDetails;
      error.data = data;
      throw error;
    }
    
    return {
      success: true,
      status: response.status,
      data: data.data || data,
      message: data.message || 'Success',
      isJson: true
    };
  },

  get(endpoint, params = null, options = {}) {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });
      url = `${endpoint}?${queryParams.toString()}`;
    }
    return this.request(url, { method: 'GET', ...options });
  },

  post(endpoint, data = null, isFormData = false, options = {}) {
    const requestOptions = {
      method: 'POST',
      ...options,
      isFormData
    };
    
    if (isFormData && data instanceof FormData) {
      delete requestOptions.headers?.['Content-Type'];
      requestOptions.body = data;
    } else if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    
    return this.request(endpoint, requestOptions);
  },

  patch(endpoint, data = null, isFormData = false, options = {}) {
    const requestOptions = {
      method: 'PATCH',
      ...options,
      isFormData
    };
    
    if (isFormData && data instanceof FormData) {
      delete requestOptions.headers?.['Content-Type'];
      requestOptions.body = data;
    } else if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    
    return this.request(endpoint, requestOptions);
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
};

// API для авторизации и пользователей согласно ТЗ
export const authApi = {
  // 1. Регистрация (POST /api/register)
  async register(userData) {
    try {
      const formattedData = {
        name: userData.name?.trim(),
        phone: validation.normalizePhone(userData.phone),
        email: userData.email?.trim(),
        password: userData.password,
        password_confirmation: userData.password_confirmation,
        confirm: userData.confirm ? 1 : 0
      };
      
      console.log('📝 Регистрация:', { ...formattedData, password: '***', password_confirmation: '***' });
      const response = await api.post('/register', formattedData, false, { public: true });
      
      if (response.status === 204) {
        console.log('✅ Регистрация успешна, токен не возвращен (204)');
        return {
          success: true,
          status: 200,
          data: { message: 'Registration successful' }
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Ошибка регистрации:', error);
      throw error;
    }
  },

  // 2. Аутентификация (POST /api/login)
  async login(credentials) {
    try {
      const loginData = {
        email: credentials.email?.trim(),
        password: credentials.password
      };
      
      console.log('🔐 Вход:', { ...loginData, password: '***' });
      const response = await api.post('/login', loginData, false, { public: true });
      
      console.log('🔑 Ответ от входа:', response);
      
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
        console.log('✅ Токен сохранен:', response.data.token.substring(0, 20) + '...');
        
        // Загружаем данные пользователя
        try {
          await this.getUser();
        } catch (userError) {
          console.warn('Не удалось загрузить данные пользователя после входа:', userError);
        }
      } else if (response.data?.data?.token) {
        localStorage.setItem('authToken', response.data.data.token);
        console.log('✅ Токен сохранен (вложенный):', response.data.data.token.substring(0, 20) + '...');
        
        try {
          await this.getUser();
        } catch (userError) {
          console.warn('Не удалось загрузить данные пользователя:', userError);
        }
      }
      
      return response;
    } catch (error) {
      console.error('❌ Ошибка входа:', error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    console.log('✅ Выход выполнен');
  },

  // 3. Информация о пользователе (GET /api/users/)
  async getUser() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      console.log('👤 Запрос данных пользователя...');
      const response = await api.get('/users/', null, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('👤 Ответ от получения пользователя:', response);
      
      if (response.data) {
        let userData = response.data;
        
        // Если данные вложены в data.data
        if (userData.data) {
          userData = userData.data;
        }
        
        // Расчет дней регистрации
        if (userData.registrationDate) {
          try {
            const parts = userData.registrationDate.split('-');
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              const year = parseInt(parts[2], 10);
              const regDate = new Date(year, month, day);
              const today = new Date();
              const diffTime = Math.abs(today - regDate);
              userData.daysRegistered = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
          } catch (e) {
            console.warn('Ошибка расчета дней:', e);
            userData.daysRegistered = 0;
          }
        }
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        console.log('✅ Данные пользователя сохранены:', userData);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Ошибка загрузки пользователя:', error);
      
      // Если ошибка 401, удаляем токен
      if (error.status === 401) {
        console.log('🚨 Токен невалиден, удаляем');
        localStorage.removeItem('authToken');
      }
      
      throw error;
    }
  },

  // 4. Изменение телефона (PATCH /api/users/phone)
  async updatePhone(phone) {
    try {
      const normalizedPhone = validation.normalizePhone(phone);
      console.log('📱 Обновление телефона:', normalizedPhone);
      const response = await api.patch('/users/phone', { phone: normalizedPhone });
      
      // Обновляем данные пользователя в localStorage
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        currentUser.phone = normalizedPhone;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('✅ Телефон обновлен в localStorage');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Ошибка обновления телефона:', error);
      throw error;
    }
  },

  // 5. Изменение email (PATCH /api/users/email)
  async updateEmail(email) {
    try {
      const trimmedEmail = email.trim();
      console.log('📧 Обновление email:', trimmedEmail);
      const response = await api.patch('/users/email', { email: trimmedEmail });
      
      // Обновляем данные пользователя в localStorage
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        currentUser.email = trimmedEmail;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('✅ Email обновлен в localStorage');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Ошибка обновления email:', error);
      throw error;
    }
  },

  // 6. Объявления пользователя (GET /api/users/orders/)
  async getUserOrders() {
    try {
      const token = this.getToken();
      if (!token) {
        console.log('🚨 Токен отсутствует');
        return {
          success: false,
          error: 'Требуется авторизация',
          status: 401,
          data: []
        };
      }

      console.log('📋 Запрос объявлений пользователя...');
      
      const response = await api.get('/users/orders/', null, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('📋 Ответ от получения объявлений:', response);
      
      // Детальная обработка разных форматов ответа
      let orders = [];
      
      if (response.data) {
        // Формат 1: data содержит orders массив
        if (response.data.orders && Array.isArray(response.data.orders)) {
          orders = response.data.orders;
          console.log('📋 Формат: data.orders');
        } 
        // Формат 2: data - это массив
        else if (Array.isArray(response.data)) {
          orders = response.data;
          console.log('📋 Формат: data (array)');
        } 
        // Формат 3: data.data содержит массив
        else if (response.data.data && Array.isArray(response.data.data)) {
          orders = response.data.data;
          console.log('📋 Формат: data.data');
        } 
        // Формат 4: data.data.orders содержит массив
        else if (response.data.data?.orders && Array.isArray(response.data.data.orders)) {
          orders = response.data.data.orders;
          console.log('📋 Формат: data.data.orders');
        }
        // Формат 5: data - это объект с id (одно объявление)
        else if (typeof response.data === 'object' && response.data.id) {
          orders = [response.data];
          console.log('📋 Формат: single object');
        }
      }
      
      console.log(`📊 Извлечено ${orders.length} объявлений из ответа`);
      
      // Обрабатываем и обогащаем данные
      const processedOrders = orders.map(order => {
        const processedOrder = {
          id: order.id || order._id || Math.random().toString(36).substr(2, 9),
          kind: order.kind || order.type || 'Не указано',
          description: order.description || order.text || '',
          district: order.district || '',
          date: order.date || order.created_at || new Date().toLocaleDateString('en-GB').split('/').join('-'),
          status: order.status || 'onModeration',
          photos: this.processPhotos(order.photos || order.photo || order.photo1),
          mark: order.mark || '',
          phone: order.phone || '',
          email: order.email || '',
          name: order.name || order.user?.name || 'Пользователь',
          registred: order.registred || false,
          user_id: order.user_id || order.user?.id
        };
        
        // Убедимся, что photos - это массив
        if (!Array.isArray(processedOrder.photos)) {
          processedOrder.photos = processedOrder.photos ? [processedOrder.photos] : [];
        }
        
        return processedOrder;
      }).sort((a, b) => {
        // Сортировка по дате (убывание)
        try {
          const dateA = a.date ? new Date(a.date.split('-').reverse().join('-')) : new Date(0);
          const dateB = b.date ? new Date(b.date.split('-').reverse().join('-')) : new Date(0);
          return dateB - dateA;
        } catch (e) {
          return 0;
        }
      });
      
      console.log(`📊 Обработано ${processedOrders.length} объявлений`);
      
      return {
        success: true,
        data: processedOrders,
        status: response.status,
        rawResponse: response
      };
    } catch (error) {
      console.error('❌ Ошибка загрузки объявлений:', error);
      
      // Проверяем, не истек ли токен
      if (error.status === 401 || error.message.includes('Unauthorized')) {
        console.log('🚨 Токен истек или невалиден');
        localStorage.removeItem('authToken');
        
        return {
          success: false,
          error: 'Требуется повторная авторизация',
          status: 401,
          data: []
        };
      }
      
      // Если ошибка сети
      if (error.isNetworkError || error.status === 0) {
        console.log('🌐 Ошибка сети, возвращаем пустой массив');
        return {
          success: true,
          data: [],
          status: 200,
          message: 'Не удалось загрузить объявления. Проверьте подключение к интернету.'
        };
      }
      
      // Для 404 ошибки (нет объявлений)
      if (error.status === 404 || error.status === 204) {
        console.log('📭 Нет объявлений (404/204)');
        return {
          success: true,
          data: [],
          status: 200,
          message: 'У вас пока нет объявлений'
        };
      }
      
      // Для других ошибок
      return {
        success: true,
        data: [],
        status: 200,
        message: 'Нет объявлений или временная проблема с сервером'
      };
    }
  },

  // 7. Удаление объявления пользователя (DELETE /api/users/orders/{id})
  async deleteOrder(id) {
    try {
      console.log(`🗑️ Удаление объявления ${id}`);
      const response = await api.delete(`/users/orders/${id}`);
      console.log('✅ Ответ от удаления объявления:', response);
      return response;
    } catch (error) {
      console.error(`❌ Ошибка удаления объявления ${id}:`, error);
      throw error;
    }
  },

  // Вспомогательная функция для обработки фото
  processPhotos(photos) {
    if (!photos) return [];
    
    if (Array.isArray(photos)) {
      return photos.map(photo => imageUtils.getImageUrl(photo));
    }
    
    if (typeof photos === 'string') {
      return [imageUtils.getImageUrl(photos)];
    }
    
    return [];
  },

  // Утилитные методы
  getToken() {
    return localStorage.getItem('authToken');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  getCurrentUser() {
    const savedUser = localStorage.getItem('currentUser');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  }
};

// API для работы с животными согласно ТЗ
export const petsApi = {
  // 1. Слайдер (GET /api/pets/slider)
  async getSlider() {
    try {
      const response = await api.get('/pets/slider', null, { public: true });
      console.log('🎠 Ответ слайдера:', response);
      return response;
    } catch (error) {
      console.error('❌ Ошибка слайдера:', error);
      throw error;
    }
  },

  // 2. Быстрый поиск (GET /api/search)
  async quickSearch(query) {
    try {
      const params = query ? { query: query.trim() } : {};
      const response = await api.get('/search', params, { public: true });
      console.log('🔍 Ответ поиска:', response);
      return response;
    } catch (error) {
      console.error('❌ Ошибка поиска:', error);
      throw error;
    }
  },

  // 3. Карточки животных (GET /api/pets)
  async getRecentPets() {
    try {
      const response = await api.get('/pets', null, { public: true });
      console.log('🐾 Ответ карточек животных:', response);
      return response;
    } catch (error) {
      console.error('❌ Ошибка загрузки животных:', error);
      throw error;
    }
  },

  // 4. Карточка животного (GET /api/pets/{id})
  async getPet(id) {
    try {
      console.log(`🔍 Загрузка животного с ID: ${id}`);
      const response = await api.get(`/pets/${id}`, null, { public: true });
      console.log('🐶 Ответ карточки животного:', response);
      
      // Обработка изображений в ответе
      if (response.data) {
        // Обработка разных форматов ответа
        if (response.data.pet && Array.isArray(response.data.pet) && response.data.pet.length > 0) {
          response.data.pet.forEach(pet => {
            if (pet.photos) {
              pet.photos = imageUtils.processPhotosArray(pet.photos);
            }
          });
        } else if (response.data.photos) {
          response.data.photos = imageUtils.processPhotosArray(response.data.photos);
        }
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Ошибка животного ${id}:`, error);
      throw error;
    }
  },

  // 5. Добавление объявления (POST /api/pets)
  async addPet(formData) {
    try {
      console.log('➕ Добавление объявления...');
      
      // Логируем содержимое FormData
      console.log('📋 Содержимое FormData:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}:`, value);
        }
      }
      
      // Отправляем запрос без токена, если пользователь не авторизован
      const token = localStorage.getItem('authToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await api.post('/pets', formData, true, { headers });
      console.log('✅ Ответ от добавления:', response);
      return response;
    } catch (error) {
      console.error('❌ Ошибка добавления:', error);
      throw error;
    }
  },

  // 6. Редактирование объявления (POST /api/pets/{id}) - В ТЗ указан POST, а не PATCH
  async updatePet(id, formData) {
    try {
      console.log(`✏️ Редактирование объявления ${id}...`);
      
      console.log('📋 Содержимое FormData:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}:`, value);
        }
      }
      
      // Согласно ТЗ: Method: POST
      const response = await api.post(`/pets/${id}`, formData, true);
      console.log('✅ Ответ от редактирования:', response);
      return response;
    } catch (error) {
      console.error(`❌ Ошибка редактирования ${id}:`, error);
      throw error;
    }
  },

  // 7. Удаление объявления (DELETE /api/users/orders/{id})
  async deletePet(id) {
    try {
      // Используем endpoint из users для удаления объявления
      return await authApi.deleteOrder(id);
    } catch (error) {
      console.error(`❌ Ошибка удаления ${id}:`, error);
      throw error;
    }
  },

  // Подписка на новости
  async subscribe(email) {
    try {
      console.log('📧 Подписка на новости:', email);
      const response = await api.post('/subscription', { email: email.trim() }, false, { public: true });
      console.log('✅ Ответ подписки:', response);
      return response;
    } catch (error) {
      console.error('❌ Ошибка подписки:', error);
      throw error;
    }
  }
};

// API для подписки на новости согласно ТЗ (POST /api/subscription)
export const subscriptionApi = {
  async subscribe(email) {
    try {
      const response = await api.post('/subscription', { email: email.trim() }, false, { public: true });
      console.log('📧 Ответ подписки:', response);
      return response;
    } catch (error) {
      console.error('❌ Ошибка подписки:', error);
      throw error;
    }
  }
};

// API для поиска с пагинацией (GET /api/search/)
export const searchApi = {
  async search(filters = {}, page = 1, limit = 10) {
    try {
      const params = {
        ...filters,
        page,
        limit
      };
      
      const response = await api.get('/search/', params, { public: true });
      console.log('🔍 Ответ поиска с пагинацией:', response);
      return response;
    } catch (error) {
      console.error('❌ Ошибка поиска:', error);
      throw error;
    }
  }
};

// Хелпер для создания FormData
export const formHelper = {
  createPetFormData(data) {
    const formData = new FormData();
    
    // Базовые поля
    const fields = ['name', 'phone', 'email', 'kind', 'district', 'description', 'mark'];
    
    fields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        formData.append(field, String(data[field]).trim());
      }
    });
    
    // Чекбоксы
    if (data.confirm !== undefined) {
      formData.append('confirm', data.confirm ? '1' : '0');
    }
    
    if (data.register !== undefined) {
      formData.append('register', data.register ? '1' : '0');
    }
    
    // Пароли
    if (data.password) {
      formData.append('password', data.password);
    }
    
    if (data.password_confirmation) {
      formData.append('password_confirmation', data.password_confirmation);
    }
    
    // Файлы
    if (data.photo1 instanceof File) {
      formData.append('photo1', data.photo1);
    }
    
    if (data.photo2 instanceof File) {
      formData.append('photo2', data.photo2);
    }
    
    if (data.photo3 instanceof File) {
      formData.append('photo3', data.photo3);
    }
    
    return formData;
  }
};

// Вспомогательная функция для безопасных вызовов API
export const safeApiCall = async (apiFunction, fallbackMessage = 'Ошибка запроса') => {
  try {
    console.log(`🔍 Вызов API: ${apiFunction.name || 'anonymous'}`);
    
    const response = await apiFunction();
    
    console.log(`📥 API Response:`, response);
    
    if (response && (response.success || response.status === 200 || response.status === 204 || response.status === 201)) {
      console.log(`✅ API успешно`);
      return { 
        success: true, 
        data: response.data || response,
        status: response.status,
        message: response.message,
        rawResponse: response
      };
    } else {
      return {
        success: false,
        error: response?.error || response?.message || fallbackMessage,
        status: response?.status,
        details: response
      };
    }
  } catch (error) {
    console.error(`❌ API ошибка: ${error.message}`);
    
    return {
      success: false,
      error: error.message || fallbackMessage,
      status: error.status || 500,
      details: error
    };
  }
};

// Функция для тестирования подключения к API
export const testApiConnection = async () => {
  try {
    console.log('🔍 Тестирование подключения к API...');
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/pets/slider`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const isOk = response.ok;
    console.log(`🌐 API ${isOk ? 'доступен' : 'недоступен'}: ${response.status} ${response.statusText}`);
    
    return {
      success: isOk,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('❌ Ошибка подключения к API:', error);
    return {
      success: false,
      error: error.message,
      isNetworkError: true
    };
  }
};

// Функция для отладки запросов
export const debugApiRequest = (url, options) => {
  console.log('🐛 Отладка API запроса:');
  console.log('URL:', `${API_CONFIG.BASE_URL}${url}`);
  console.log('Метод:', options?.method || 'GET');
  console.log('Заголовки:', options?.headers);
  if (options?.body) {
    if (options.body instanceof FormData) {
      console.log('Body: [FormData]');
      for (let [key, value] of options.body.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `[File] ${value.name}` : value);
      }
    } else {
      console.log('Body:', options.body);
    }
  }
};

// Экспортируем все необходимое
export { API_CONFIG };