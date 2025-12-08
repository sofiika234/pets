import { API_CONFIG } from '../App';

export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  },

  async post(endpoint, data, isFormData = false) {
    const options = {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data)
    };

    this.addAuthHeader(options);
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    return this.handleResponse(response);
  },

  async patch(endpoint, data, isFormData = false) {
    const options = {
      method: 'PATCH',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data)
    };

    this.addAuthHeader(options);
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    return this.handleResponse(response);
  },

  async delete(endpoint) {
    const options = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    this.addAuthHeader(options);
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    return this.handleResponse(response);
  },

  async handleResponse(response) {
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error?.message || 'Ошибка сервера');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  },

  getHeaders() {
    const headers = {};
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  addAuthHeader(options) {
    const token = localStorage.getItem('authToken');
    if (token) {
      if (!options.headers) options.headers = {};
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  },

  getImageUrl(imagePath) {
    if (!imagePath) return `${API_CONFIG.IMAGE_BASE}/images/default-pet.png`;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return `${API_CONFIG.IMAGE_BASE}${imagePath}`;
    return `${API_CONFIG.IMAGE_BASE}/${imagePath}`;
  }
};

export const petsApi = {
  async getSlider() {
    try {
      return await api.get('/pets/slider');
    } catch (error) {
      // Если нет слайдера, возвращаем пустой массив
      if (error.status === 404) {
        return { data: { pets: [] } };
      }
      throw error;
    }
  },

  async search(query) {
    return api.get(`/search${query ? `?query=${encodeURIComponent(query)}` : ''}`);
  },

  async getRecentPets() {
    return api.get('/pets');
  },

  async getPet(id) {
    return api.get(`/pets/${id}`);
  },

  async addPet(formData) {
    return api.post('/pets/new', formData, true);
  },

  async updatePet(id, formData) {
    return api.patch(`/pets/${id}`, formData, true);
  }
};

export const authApi = {
  async register(userData) {
    return api.post('/register', userData);
  },

  async login(credentials) {
    const data = await api.post('/login', credentials);
    if (data.data?.token) {
      localStorage.setItem('authToken', data.data.token);
    }
    return data;
  },

  async getUser(id) {
    return api.get(`/users/${id}`);
  },

  async updatePhone(id, phone) {
    return api.patch(`/users/${id}/phone`, { phone });
  },

  async updateEmail(id, email) {
    return api.patch(`/users/${id}/email`, { email });
  }
};