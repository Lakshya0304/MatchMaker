# Frontend API Integration Guide 🚀

This guide provides instructions and code snippets for integrating the backend authentication and protected APIs into your React frontend.

---

## 1. Setup Axios and Interceptors

To avoid manually attaching the JWT `Authorization` header to every API call, configure a base Axios instance with an interceptor to automatically attach the token from `localStorage`.

Create a file named `src/services/api.js` (or `.ts`) on your frontend:

```javascript
import axios from 'axios';

// Create base axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Token Expirations (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized/Token Expired. Redirecting to login...");
      localStorage.removeItem('token');
      localStorage.removeItem('matchmaker');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 2. API Integration Examples

### A. Matchmaker Login (`POST /api/auth/login`)
Authenticates the user and saves the token to storage.

```javascript
import api from './api';

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    // Save token and matchmaker details
    const { token, matchmaker } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('matchmaker', JSON.stringify(matchmaker));
    
    return { success: true, matchmaker };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed. Please try again.',
    };
  }
};
```

---

### B. Fetch All Assigned Customers (`GET /api/customers/all`)
Fetches client cards for the dashboard. This route is **protected** and requires a valid token.

```javascript
import api from './api';

export const getCustomers = async () => {
  try {
    const response = await api.get('/customers/all');
    return response.data; // Array of formatted customer objects
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};
```

---

### C. Fetch Customer Detailed Biodata (`GET /api/customers/:id`)
Fetches deep profile metrics and call history logs for a single customer. This route is **protected**.

```javascript
import api from './api';

export const getCustomerById = async (id) => {
  try {
    const response = await api.get(`/customers/${id}`);
    return response.data; // Full biodata details and note logs
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw error;
  }
};
```

---

### D. Evaluate Candidates using AI Engine (`GET /api/matching/evaluate/:clientId`)
Triggers the OpenRouter AI matching engine to fetch compatibilities. This route is **protected**.

```javascript
import api from './api';

export const getAIMatches = async (clientId) => {
  try {
    const response = await api.get(`/matching/evaluate/${clientId}`);
    return response.data; // Returns ranked compatibility scoring metrics
  } catch (error) {
    console.error(`Error evaluating matches for client ${clientId}:`, error);
    throw error;
  }
};
```

---

## 3. Route Protection on React Router (Frontend Guard)

Create a wrapper component `ProtectedRoute.jsx` to ensure only logged-in users can access dashboards:

```jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to login page if token is missing
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### Usage in `App.jsx`
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
```
