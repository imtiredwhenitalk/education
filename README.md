# School Portal Fullstack

Готовий fullstack-проєкт шкільного порталу з:

- реєстрацією учнів і вчителів
- входом і ролями (student / teacher / admin)
- виставленням оцінок вчителями
- електронним щоденником
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
- `GET /api/grades`
- `POST /api/grades` (teacher)
- `PUT /api/grades/:id` (teacher/admin)
- `DELETE /api/grades/:id` (teacher/admin)
- `GET /api/dashboard`

## Структура

- `src` - фронтенд
- `backend_py/app` - Python API сервер
- `backend_py/data/store.json` - локальна база даних
- `docker-compose.yml` - запуск frontend + backend в контейнерах
