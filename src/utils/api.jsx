// utils/api.js
const API_CONFIG = {
  BASE_URL: 'https://pets.сделай.site/api',
  IMAGE_BASE: 'https://pets.сделай.site'
};

// Базовые функции API
export const api = {
  // GET запрос
  async get(endpoint) {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, { headers });
    return this.handleResponse(response);
  },

  // POST запрос
  async post(endpoint, data, isFormData = false) {
    const token = localStorage.getItem('authToken');
    const options = {
      method: 'POST',
      headers: isFormData ? {} : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: isFormData ? data : JSON.stringify(data)
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    return this.handleResponse(response);
  },

  // PATCH запрос
  async patch(endpoint, data, isFormData = false) {
    const token = localStorage.getItem('authToken');
    const options = {
      method: 'PATCH',
      headers: isFormData ? {} : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: isFormData ? data : JSON.stringify(data)
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    return this.handleResponse(response);
  },

  // DELETE запрос
  async delete(endpoint) {
    const token = localStorage.getItem('authToken');
    const options = {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    return this.handleResponse(response);
  },

  // Обработка ответа
  async handleResponse(response) {
    console.log('Response status:', response.status);
    
    if (response.status === 204) {
      return { success: true };
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        const error = new Error(data.error?.message || 'Ошибка сервера');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      return data;
    } else {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return { success: true };
    }
  },

  // Получение URL изображения
  getImageUrl(imagePath) {
    if (!imagePath) return '/default-pet.jpg';
    if (typeof imagePath === 'string' && imagePath.startsWith('http')) return imagePath;
    if (typeof imagePath === 'string' && imagePath.startsWith('/')) {
      return `${API_CONFIG.IMAGE_BASE}${imagePath}`;
    }
    return `${API_CONFIG.IMAGE_BASE}/${imagePath}`;
  }
};

// Специфичные функции для приложения
export const petsApi = {
  // Получение слайдера
  async getSlider() {
    return api.get('/pets/slider');
  },

  // Поиск животных
  async search(query) {
    return api.get(`/search${query ? `?query=${encodeURIComponent(query)}` : ''}`);
  },

  // Получение последних объявлений
  async getRecentPets() {
    return api.get('/pets');
  },

  // Получение одного животного
  async getPet(id) {
    return api.get(`/pets/${id}`);
  },

  // Добавление нового объявления
  async addPet(formData) {
    return api.post('/pets/new', formData, true);
  },

  // Редактирование объявления
  async updatePet(id, formData) {
    return api.patch(`/pets/${id}`, formData, true);
  },

  // Удаление объявления
  async deletePet(id) {
    return api.delete(`/pets/${id}`);
  },

  // Получить объявления пользователя (согласно ТЗ)
  async getUserOrders(userId) {
    return api.get(`/users/orders/${userId}`);
  }
};

export const authApi = {
  // Регистрация
  async register(userData) {
    return api.post('/register', userData);
  },

  // Вход
  async login(credentials) {
    const data = await api.post('/login', credentials);
    if (data.data?.token) {
      localStorage.setItem('authToken', data.data.token);
    }
    return data;
  },

  // Получение информации о пользователе (согласно ТЗ)
  async getUser(id) {
    return api.get(`/users/${id}`);
  },

  // Обновление телефона
  async updatePhone(id, phone) {
    return api.patch(`/users/${id}/phone`, { phone });
  },

  // Обновление email
  async updateEmail(id, email) {
    return api.patch(`/users/${id}/email`, { email });
  },

  // Получить текущего пользователя
  async getCurrentUser() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      
      // Сначала попробуем получить по ID из токена
      // Если в токене нет ID, попробуем endpoint /me или /user
      const response = await api.get('/user/me');
      return response.data || response;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
};

export const subscriptionApi = {
  async subscribe(email) {
    return api.post('/subscription', { email });
  }
};