// auth.js
import axios from 'axios';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('jwtToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    
    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    // Interceptor para adicionar token às requisições
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar erros de autenticação
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Método de login único
  async login(credentials) {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', credentials);
      this.setAuthData(response.data);
      
      // Redirecionar baseado no role
      this.redirectBasedOnRole();
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro no login');
    }
  }

  // Salvar dados de autenticação
  setAuthData(authData) {
    this.token = authData.token;
    this.user = authData.user;
    
    localStorage.setItem('jwtToken', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
  }

  // Redirecionar baseado no role
  redirectBasedOnRole() {
    if (!this.user) return;
    
    const currentPath = window.location.pathname;
    
    // Se já está em uma página adequada, não redireciona
    if (this.isAdmin() && currentPath.includes('/dashboard')) return;
    if (this.isUser() && currentPath.includes('/pdv')) return;
    
    // Redirecionar para página correta
    if (this.isAdmin()) {
      window.location.href = '/dashboard';
    } else if (this.isUser()) {
      window.location.href = '/pdv';
    }
  }

  // Verificar roles
  isAdmin() {
    return this.user && this.user.roles && this.user.roles.includes('ROLE_ADMIN');
  }

  isUser() {
    return this.user && this.user.roles && this.user.roles.includes('ROLE_USER');
  }

  hasRole(role) {
    return this.user && this.user.roles && this.user.roles.includes(role);
  }

  // Obter role principal
  getMainRole() {
    if (!this.user || !this.user.roles) return null;
    
    // Prioridade: ADMIN > USER
    if (this.user.roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN';
    if (this.user.roles.includes('ROLE_USER')) return 'ROLE_USER';
    
    return null;
  }

  // Fazer logout
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Verificar se está autenticado
  isAuthenticated() {
    return !!this.token && !this.isTokenExpired();
  }

  // Verificar se o token expirou
  isTokenExpired() {
    if (!this.token) return true;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch (error) {
      return true;
    }
  }

  // Obter usuário atual
  getCurrentUser() {
    return this.user;
  }

  // Middleware para proteção de rotas
  requireAuth(requiredRole = null) {
    if (!this.isAuthenticated()) {
      window.location.href = '/login';
      return false;
    }

    if (requiredRole && !this.hasRole(requiredRole)) {
      window.location.href = '/unauthorized';
      return false;
    }

    return true;
  }

  // Verificar acesso à página atual
  checkPageAccess() {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/dashboard') && !this.isAdmin()) {
      window.location.href = '/unauthorized';
      return false;
    }
    
    if (currentPath.includes('/pdv') && !this.isUser()) {
      window.location.href = '/unauthorized';
      return false;
    }
    
    return true;
  }
}

// Instância global
const authService = new AuthService();
export default authService;
