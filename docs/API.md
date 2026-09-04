# Yokai AI REST & Real-Time SSE API Specification

Base URL: `http://localhost:5000/api`  
Frontend Proxy: Handled transparently by Vite via `/api`

---

## 1. Authentication Endpoints

### 1.1 User Registration
Creates a new user account with hashed password and returns an access token.

- **URL**: `POST /auth/signup`
- **Rate Limit**: 10 requests / minute
- **Request Body** (`application/json`):
```json
{
  "full_name": "Ashlin Mirsha",
  "email": "ashlin@karunya.edu.in",
  "password": "SecurePassword123!"
}
```
- **Response** (`201 Created`):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "ashlin@karunya.edu.in",
    "full_name": "Ashlin Mirsha",
    "documents_used": 0,
    "documents_limit": 50
  }
}
```

---

### 1.2 User Sign-In
Authenticates credentials and issues a JWT Bearer token.

- **URL**: `POST /auth/signin`
- **Rate Limit**: 10 requests / minute
- **Request Body** (`application/json`):
```json
{
  "email": "ashlin@karunya.edu.in",
  "password": "SecurePassword123!"
}
```
- **Response** (`200 OK`):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "ashlin@karunya.edu.in",
    "full_name": "Ashlin Mirsha",
    "documents_used": 12,
    "documents_limit": 50
  }
}
```

---

### 1.3 Get Current User Profile & Quota
Retrieves profile, document processing quota, and active subscription plan.

- **URL**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (`200 OK`):
```json
{
  "id": 1,
  "email": "ashlin@karunya.edu.in",
  "full_name": "Ashlin Mirsha",
  "documents_used": 12,
  "documents_limit": 50,
  "created_at": "2026-09-01T10:00:00Z"
}
```

---

## 2. Document Job Processing Endpoints

### 2.1 Submit Document Generation Job
Uploads a Word document (`.docx`), optional reference photos/diagrams, and instruction prompt.

- **URL**: `POST /jobs`
- **Headers**: `Authorization: Bearer <access_token>`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `docx_file`: The `.docx` file (Binary, max 50MB).
  - `images`: One or more reference images (PNG/JPEG/WEBP, max 15MB each, multiple allowed).
  - `prompt`: Text instructions describing what to fill (String).
- **Response** (`202 Accepted`):
```json
{
  "job_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "processing",
  "message": "Job queued for processing"
}
```

---

### 2.2 Stream Job Progress (Server-Sent Events)
Provides a live, real-time stream of document processing status directly matching the 5 stages on the frontend.

- **URL**: `GET /jobs/{job_id}/stream`
- **Response Content-Type**: `text/event-stream`
- **Event Data Format**:
```json
data: {"job_id": "9b1deb...", "status": "processing", "step": 1, "message": "Reading document..."}

data: {"job_id": "9b1deb...", "status": "processing", "step": 2, "message": "Understanding structure..."}

data: {"job_id": "9b1deb...", "status": "processing", "step": 3, "message": "Generating content with AI..."}

data: {"job_id": "9b1deb...", "status": "processing", "step": 4, "message": "Updating document & embedding photos..."}

data: {"job_id": "9b1deb...", "status": "completed", "step": 5, "message": "Document ready for download!"}
```

#### Frontend Client Example (JavaScript EventSource)
```javascript
const eventSource = new EventSource(`/api/jobs/${jobId}/stream`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`Step ${data.step}/5: ${data.message}`);
  
  if (data.status === 'completed') {
    eventSource.close();
    triggerDownload(jobId);
  } else if (data.status === 'error') {
    eventSource.close();
    showErrorMessage(data.error);
  }
};
```

---

### 2.3 Download Final Filled Document
Downloads the generated `.docx` file with 100% original formatting preserved.

- **URL**: `GET /jobs/{job_id}/download`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**:
  - `Content-Type`: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `Content-Disposition`: `attachment; filename="Yokai_Filled_Document.docx"`

---

## 3. Standard Error Format

All error responses adhere to a consistent JSON structure:

```json
{
  "detail": "Description of the error",
  "status_code": 400,
  "error_type": "ValidationError"
}
```

| HTTP Status Code | Meaning | Common Scenario |
| :--- | :--- | :--- |
| `400 Bad Request` | Invalid payload / File format error | Non-docx file or potential zip-bomb detected |
| `401 Unauthorized` | Invalid or expired JWT token | Missing/invalid Bearer token |
| `403 Forbidden` | Monthly quota reached | User exceeded 50 documents/month limit |
| `413 Payload Too Large`| File exceeds maximum limit | Document $>50\text{ MB}$ or Image $>15\text{ MB}$ |
| `429 Too Many Requests`| Rate limit exceeded | Exceeded 10 auth requests or 5 jobs per minute |
| `502 Bad Gateway` | AI Provider Failover Exhausted | All 3 AI tiers (NVIDIA, OpenCode, Gemini) failed |
