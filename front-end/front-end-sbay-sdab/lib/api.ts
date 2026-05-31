interface ApiResponse {
  success?: boolean;
  token?: string;
  user?: Record<string, unknown>;
  data?: unknown;
  error?: string;
  message?: string;
  pagination?: unknown;
  [key: string]: unknown;
}

type ApiHeaders = Record<string, string>;

const API = {
  base: process.env.NEXT_PUBLIC_API_URL || '/api',
  _token: null as string | null,

  getToken(): string | null {
    if (this._token) return this._token;
    if (typeof window !== 'undefined') {
      this._token = localStorage.getItem('sbay_sdab_token');
    }
    return this._token;
  },

  setToken(token: string | null): void {
    this._token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('sbay_sdab_token', token);
      } else {
        localStorage.removeItem('sbay_sdab_token');
      }
    }
  },

  _headers(includeAuth = false): ApiHeaders {
    const headers: ApiHeaders = { 'Content-Type': 'application/json' } as ApiHeaders;
    if (includeAuth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async _handleResponse(res: Response): Promise<ApiResponse> {
    if (!res.ok) {
      try {
        const body = await res.json();
        return { success: false, error: body.error || body.message || `HTTP ${res.status}` };
      } catch {
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return res.json();
    }
    const text = await res.text();
    try { return JSON.parse(text); } catch {
      return { success: true, data: text };
    }
  },

  async get(endpoint: string, auth = false): Promise<ApiResponse> {
    const res = await fetch(this.base + endpoint, {
      headers: this._headers(auth)
    });
    return this._handleResponse(res);
  },

  async post(endpoint: string, data: Record<string, unknown>, auth = false): Promise<ApiResponse> {
    const res = await fetch(this.base + endpoint, {
      method: 'POST',
      headers: this._headers(auth),
      body: JSON.stringify(data)
    });
    return this._handleResponse(res);
  },

  async patch(endpoint: string, data: Record<string, unknown> = {}, auth = false): Promise<ApiResponse> {
    const res = await fetch(this.base + endpoint, {
      method: 'PATCH',
      headers: this._headers(auth),
      body: JSON.stringify(data)
    });
    return this._handleResponse(res);
  },

  async delete(endpoint: string, auth = false): Promise<ApiResponse> {
    const res = await fetch(this.base + endpoint, {
      method: 'DELETE',
      headers: this._headers(auth)
    });
    return this._handleResponse(res);
  },

  async login(email: string, password: string): Promise<ApiResponse> {
    const res = await this.post('/auth/login', { email, password });
    if (res.token) {
      this.setToken(res.token as string);
    }
    return res;
  },

  async register(name: string, email: string, password: string): Promise<ApiResponse> {
    const res = await this.post('/auth/register', { name, email, password });
    if (res.token) {
      this.setToken(res.token as string);
    }
    return res;
  },

  async logout(): Promise<ApiResponse> {
    this.setToken(null);
    return { success: true };
  },

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return this.post('/auth/reset-password', { token, password });
  },

  async getMe(): Promise<ApiResponse> {
    return this.get('/auth/me', true);
  }
};

export default API;
