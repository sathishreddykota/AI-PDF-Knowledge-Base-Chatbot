# API Endpoints Documentation

The NestJS backend server exposes the REST API endpoints documented below. All requests and responses use the `application/json` format (except file uploads, which use `multipart/form-data`).

---

## 🔑 Authentication Endpoints

### 1. Admin Login
- **Endpoint**: `POST /auth/login`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "admin@admin.com",
    "password": "Admin@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "6a744fc61a7639ce8a1d3101",
        "email": "admin@admin.com"
      }
    }
  }
  ```

### 2. Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

## 📁 Document Management (Protected - JWT Bearer Token Required)

### 1. Upload PDF
- **Endpoint**: `POST /documents/upload`
- **Authentication**: Bearer Token
- **Request Type**: `multipart/form-data`
- **Request Parameters**:
  - `file`: Binary PDF file (Max 50MB)
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "6a744fc61a7639ce8a1d3106",
      "filename": "EmployeeHandbook.pdf",
      "size": 129665,
      "status": "processing",
      "uploadDate": "2026-08-06T14:41:34.000Z",
      "totalChunks": 0,
      "createdAt": "2026-08-06T14:41:34.000Z"
    }
  }
  ```

### 2. List Documents
- **Endpoint**: `GET /documents`
- **Authentication**: Bearer Token
- **Query Parameters**:
  - `search` (Optional): Query string to filter filenames.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "6a744fc61a7639ce8a1d3106",
        "filename": "EmployeeHandbook.pdf",
        "size": 129665,
        "status": "completed",
        "uploadDate": "2026-08-06T14:41:34.000Z",
        "totalChunks": 57,
        "createdAt": "2026-08-06T14:41:34.000Z"
      }
    ]
  }
  ```

### 3. Reprocess Document
- **Endpoint**: `POST /documents/:id/reprocess`
- **Authentication**: Bearer Token
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "6a744fc61a7639ce8a1d3106",
      "filename": "EmployeeHandbook.pdf",
      "size": 129665,
      "status": "processing",
      "uploadDate": "2026-08-06T14:41:34.000Z",
      "totalChunks": 0,
      "createdAt": "2026-08-06T14:41:34.000Z"
    }
  }
  ```

### 4. Delete Document
- **Endpoint**: `DELETE /documents/:id`
- **Authentication**: Bearer Token
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Document deleted successfully"
    }
  }
  ```

---

## 💬 Public Chat Endpoints (No Authentication Required)

### 1. Ask a Question
- **Endpoint**: `POST /chat/ask`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "sessionId": "session_1786007903127_wm5egg9",
    "question": "What is the probation period?"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "6a7452d01a7639ce8a1d319c",
      "sessionId": "session_1786007903127_wm5egg9",
      "question": "What is the probation period?",
      "answer": "According to Section 3 of the Employee Handbook, the probation period for all new full-time hires is 3 months.",
      "sources": [
        {
          "filename": "EmployeeHandbook.pdf",
          "pageNumber": 4
        }
      ],
      "suggestedQuestions": [
        "Can the probation period be extended?",
        "What benefits are active during probation?",
        "How is performance evaluated during probation?"
      ],
      "timestamp": "2026-08-06T14:50:31.000Z"
    }
  }
  ```

### 2. Fetch Chat History
- **Endpoint**: `GET /chat/history/:sessionId`
- **Authentication**: None
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "6a7452d01a7639ce8a1d319c",
        "sessionId": "session_1786007903127_wm5egg9",
        "question": "What is the probation period?",
        "answer": "According to Section 3 of the Employee Handbook, the probation period for all new full-time hires is 3 months.",
        "sources": [
          {
            "filename": "EmployeeHandbook.pdf",
            "pageNumber": 4
          }
        ],
        "suggestedQuestions": [
          "Can the probation period be extended?",
          "What benefits are active during probation?"
        ],
        "timestamp": "2026-08-06T14:50:31.000Z"
      }
    ]
  }
  ```

---

## 📊 Dashboard Analytics (Protected - JWT Bearer Token Required)

### 1. Fetch Stats
- **Endpoint**: `GET /dashboard/stats`
- **Authentication**: Bearer Token
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalPdfs": 1,
      "totalSessions": 1,
      "totalQuestions": 1,
      "recentDocuments": [
        {
          "id": "6a744fc61a7639ce8a1d3106",
          "filename": "EmployeeHandbook.pdf",
          "size": 129665,
          "status": "completed",
          "uploadDate": "2026-08-06T14:41:34.000Z",
          "totalChunks": 57,
          "createdAt": "2026-08-06T14:41:34.000Z"
        }
      ]
    }
  }
  ```
