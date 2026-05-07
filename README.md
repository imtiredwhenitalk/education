# Луцький ліцей №4 імені Модеста Левицького Fullstack

Готовий fullstack-проєкт шкільного порталу з:

- реєстрацією учнів і вчителів
- входом і ролями (student / teacher / admin)
- адмін-панеллю (інформаційна панель користувачів)
- профілем (редагування даних, аватар, тема)
- новинами школи

## Стек

- Frontend: React + Vite + Tailwind CSS
- Backend: Python + FastAPI + JWT
- Сховище: JSON-файл `backend_py/data/store.json`

## Швидкий старт

1. Встановити Node.js (версія 18+) та Python (версія 3.11+).
2. У корені проєкту `education` виконати:

```bash
npm install
pip install -r backend_py/requirements.txt
```

3. Запустити fullstack в режимі розробки:

```bash
npm run dev
```

4. Відкрити сайт:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Запуск через Docker

У корені проєкту `education`:

```bash
docker compose up --build
```

Перед запуском переконайся, що Docker Desktop запущений.

Перевірка статусу:

```bash
docker compose ps
```

Сервіси:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Тестові акаунти

- admin@school.local / admin123
- teacher@school.local / teacher123
- student@school.local / student123

## Deploy на Render (коротко)

Якщо Frontend і Backend розгорнуті як 2 різні сервіси (2 домени), потрібно:

- **Frontend (React/Vite):** у Render додати env `VITE_API_TARGET` = `https://<ваш-backend>.onrender.com` (обов'язково `https`).
- **Backend (FastAPI):** дозволити CORS для домену фронта. Можна задати env `CORS_ORIGINS` як список через кому, напр.
	`CORS_ORIGINS=https://<ваш-frontend>.onrender.com,http://localhost:5173`.

Якщо `VITE_API_TARGET` не заданий, фронт буде робити запити відносно свого домену (і логін може падати).

## Основні API маршрути

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users` (admin/teacher)
- `GET /api/news`
- `POST /api/news` (teacher/admin)
- `PUT /api/news/:id` (teacher/admin)
- `DELETE /api/news/:id` (teacher/admin)
- `GET /api/dashboard`

## Структура

- `src` - фронтенд
- `backend_py/app` - Python API сервер
- `backend_py/data/store.json` - локальна база даних
- `docker-compose.yml` - запуск frontend + backend в контейнерах
