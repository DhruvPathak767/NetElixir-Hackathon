# Marketing Forecast API

A production-ready backend built with **FastAPI** (Python), designed to handle marketing forecast operations, data upload, and analysis.

---

## Project Structure

```text
backend/
├── .env                # App configuration (environment variables)
├── requirements.txt    # Project dependencies (like package.json)
├── README.md           # This explanation file
├── uploads/            # Temporary storage for uploaded CSV/Excel files
├── processed/          # Storage for processed forecast output files
└── app/
    ├── main.py         # App entrypoint (like server.js/app.js)
    ├── api/            # Route modules (like routes/ in Express)
    ├── services/       # Business/Forecasting logic (like controllers/services)
    ├── database/       # DB session and setup (like config/db.js)
    └── models/         # Pydantic schemas (validation) & DB models (ORM schemas)
```

---

## File Explanations

1. **`app/main.py`**: Initializes the FastAPI app object, loads environment variables using `python-dotenv`, instantiates configuration variables using validated Pydantic settings, maps request paths to endpoint functions, and serves endpoints `/` and `/health`.
2. **`requirements.txt`**: Declares package dependencies. `pip` reads this file to install everything needed to run the app.
3. **`.env`**: Stores configuration parameters. Unlike Node.js where environment variables are untyped strings in `process.env`, FastAPI uses Pydantic's `BaseSettings` to load, cast, and validate variables into concrete Python types.
4. **`uploads/` & `processed/`**: Designated directories for local file storage to process data using Pandas and model forecasting algorithms.

---

## FastAPI vs. Express.js: Concept Comparison

As an Express developer, this quick translation guide will help you understand FastAPI design patterns:

### 1. The Application Instance
*   **Express.js**:
    ```javascript
    const express = require('express');
    const app = express();
    ```
*   **FastAPI**:
    ```python
    from fastapi import FastAPI
    app = FastAPI()
    ```

### 2. Running the Server (Hot-Reload)
*   **Express.js**: You run `node server.js` or use `nodemon` for file-watching.
*   **FastAPI**: FastAPI is just the framework, not the server runner. We use **Uvicorn** (an ASGI web server).
    ```bash
    uvicorn app.main:app --reload
    ```
    *Here, `app.main` points to the `app/main.py` module, and `:app` is the variable name of the FastAPI instance.*

### 3. Route Handlers
*   **Express.js**: Route handlers are callback functions that receive Request/Response objects.
    ```javascript
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy' });
    });
    ```
*   **FastAPI**: Route handlers are decorated Python functions. FastAPI serializes return values to JSON automatically.
    ```python
    @app.get("/health")
    async def health():
        return {"status": "healthy"}
    ```

### 4. Input & Request Validation
*   **Express.js**: You validate request bodies manually or use third-party libraries like **Zod** or **Joi**.
    ```javascript
    const schema = z.object({ email: z.string().email() });
    app.post('/user', (req, res) => {
      const result = schema.safeParse(req.body);
      if (!result.success) return res.status(400).send(result.error);
      ...
    });
    ```
*   **FastAPI**: Validation is a first-class citizen powered by **Pydantic**. You define validation models as classes, and FastAPI validates requests against these schemas before executing the endpoint. If validation fails, it automatically returns a structured `422 Unprocessable Entity` error.
    ```python
    from pydantic import BaseModel, EmailStr

    class UserCreate(BaseModel):
        email: EmailStr

    @app.post("/user")
    async def create_user(user: UserCreate):
        return {"message": f"User {user.email} created successfully!"}
    ```

### 5. Dependency Injection (DI) vs Middleware
*   **Express.js**: Middleware chains are used to intercept requests, perform checks (like authentication), and pass control.
    ```javascript
    const checkAuth = (req, res, next) => { ... next(); }
    app.get('/dashboard', checkAuth, (req, res) => { ... });
    ```
*   **FastAPI**: Supports standard middleware, but prefers **Dependency Injection** using `Depends`. This allows endpoints to cleanly request dependencies (DB sessions, authentication helpers, rate limiters) dynamically.
    ```python
    from fastapi import Depends

    async def get_current_user(token: str):
        # auth logic...
        return user

    @app.get("/dashboard")
    async def dashboard(current_user: User = Depends(get_current_user)):
        return {"data": "Secure Dashboard"}
    ```

### 6. Interactive API Documentation (Swagger UI)
*   **Express.js**: Requires installing `swagger-ui-express` and manually writing OpenAPI/Swagger specs in YAML or comments.
*   **FastAPI**: Generates interactive Swagger documentation automatically based on Pydantic schemas and Python type declarations. Just navigate to `/docs` on your running local server!

---

## How to Get Started

### 1. Setting Up the Virtual Environment
Create and activate a local Python virtual environment to isolate project packages:

```bash
# Inside the backend/ directory:
python -m venv .venv

# Activate it:
# Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Windows (Command Prompt):
.venv\Scripts\activate.bat

# macOS / Linux:
source .venv/bin/activate
```

### 2. Installing Dependencies
Install project requirements:
```bash
pip install -r requirements.txt
```

### 3. Running the Server locally
Start the development server with hot-reload enabled:
```bash
uvicorn app.main:app --reload
```

- **Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Root Endpoint**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Health Endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
