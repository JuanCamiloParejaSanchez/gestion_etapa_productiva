// Módulo cliente API
const APIClient = {
    baseURL: window.location.origin,

    // Método genérico para requests
    async request(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            ...options
        };

        // Agregar CSRF token si existe
        const csrfToken = this.getCsrfToken();
        if (csrfToken) {
            defaultOptions.headers['X-CSRF-Token'] = csrfToken;
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, defaultOptions);

            // Manejar respuestas no exitosas
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },

    // GET request
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        return this.request(url.pathname + url.search);
    },

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    },

    // Upload file
    async uploadFile(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                // No establecer Content-Type para FormData
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    // Obtener CSRF token
    getCsrfToken() {
        const token = document.querySelector('meta[name="csrf-token"]');
        return token ? token.getAttribute('content') : null;
    },

    // Set base URL
    setBaseURL(url) {
        this.baseURL = url;
    }
};

// Exportar módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
} else {
    window.APIClient = APIClient;
}