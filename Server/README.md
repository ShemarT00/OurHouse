# OurHouse Server API

Python Flask backend for the OurHouse mobile application. See the [root README](../README.md) for setup, running and testing.

## Architecture

The server uses a **Blueprint-based architecture** where each feature domain has its own blueprint with routes and business logic.

```
Server/
├── app.py                 # Application factory and blueprint registration
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── schema/               # Shared data models
├── auth/                 # Authentication (login, signup, JWT)
├── users/                # User profile management
├── households/           # Household management (CRUD)
├── members/              # Household member management & invites
├── lists/                # Shopping list operations
├── items/                # Shopping list item operations  
├── notifications/        # Notification management
└── database/             # Database migrations and scripts
```

## Blueprints

### `auth/` - Authentication
- Login with email/password
- User signup
- Password reset
- JWT token refresh
- Session management

**Routes:**
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Create account
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/refresh` - Refresh access token

---

### `users/` - User Profiles
- Get/update user profile
- User information management

**Routes:**
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/{OHID}` - Get user by ID

---

### `households/` - Household Management
- Create/read/update/delete households
- Household information

**Routes:**
- `GET /api/households` - List user's households
- `POST /api/households` - Create household
- `GET /api/households/{OHID}` - Get household details
- `PUT /api/households/{OHID}` - Update household
- `DELETE /api/households/{OHID}` - Delete household

---

### `members/` - Member Management
- Manage household members
- Send and manage invitations
- Member access control

**Routes:**
- `GET /api/households/{householdId}/members` - List household members
- `GET /api/households/{householdId}/members/{OHID}` - Get member
- `POST /api/households/{householdId}/members/invite` - Invite member
- `DELETE /api/households/{householdId}/members/{OHID}` - Remove member
- `GET /api/members/invites` - Get pending invites
- `POST /api/members/invites/{inviteId}/accept` - Accept invite
- `POST /api/members/invites/{inviteId}/decline` - Decline invite

---

### `lists/` - Shopping Lists
- Create/read/update/delete shopping lists
- List management within households

**Routes:**
- `GET /api/households/{householdId}/shopping-lists` - List shopping lists
- `POST /api/households/{householdId}/shopping-lists` - Create list
- `GET /api/households/{householdId}/shopping-lists/{OHID}` - Get list
- `PUT /api/households/{householdId}/shopping-lists/{OHID}` - Update list
- `DELETE /api/households/{householdId}/shopping-lists/{OHID}` - Delete list

---

### `items/` - Shopping List Items
- Add/edit/remove items from lists
- Item completion tracking
- Priority management

**Routes:**
- `GET /api/households/{householdId}/shopping-lists/{listId}/items` - List items
- `POST /api/households/{householdId}/shopping-lists/{listId}/items` - Create item
- `GET /api/households/{householdId}/shopping-lists/{listId}/items/{OHID}` - Get item
- `PUT /api/households/{householdId}/shopping-lists/{listId}/items/{OHID}` - Update item
- `PUT /api/households/{householdId}/shopping-lists/{listId}/items/{OHID}/toggle` - Toggle completion
- `DELETE /api/households/{householdId}/shopping-lists/{listId}/items/{OHID}` - Delete item
- `GET /api/households/{householdId}/shopping-lists/{listId}/items/priority/{priority}` - Filter by priority

---

### `notifications/` - Notifications
- Send notifications to household members
- Mark notifications as read
- Notification history

**Routes:**
- `GET /api/notifications` - List notifications
- `GET /api/notifications/{OHID}` - Get notification
- `POST /api/notifications/{OHID}/mark-read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/{OHID}` - Delete notification

---

### `schema/` - Data Models
Shared Marshmallow schemas and dataclasses for serialization/deserialization and validation.

- `user.py` - User data model
- `household.py` - Household data model
- `member.py` - Member data model
- `shopping_list.py` - Shopping list data model
- `item.py` - Item data model
- `notification.py` - Notification data model
- `store.py` - Store data model

## Setup

### Prerequisites
- Python 3.9+
- pip

### Installation

1. **Navigate to server:**
   ```bash
   cd Server
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run server:**
   ```bash
   python app.py
   ```

   Server runs on `http://localhost:5000` by default

## Environment Variables

Create `.env` file (see `.env.example`):

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# CORS
CORS_ORIGINS=http://localhost:8081,exp://
```

## Database

Database migrations are stored in `database/migrations/`.

Migrations are run through Supabase or before app startup.

## API Response Format

All endpoints return JSON with consistent format:

### Success Response (200, 201)
```json
{
  "data": { /* response data */ },
  "success": true
}
```

### Error Response (4xx, 5xx)
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

## Authentication

Uses JWT tokens with Supabase authentication:

1. **Login** → Get access token
2. **Attach token** to Authorization header: `Authorization: Bearer <token>`
3. **Verify token** in protected routes
4. **Refresh token** when expired

Protected routes require valid JWT token.

## Development

### Running Tests
```bash
pip install pytest pytest-flask
pytest
```

### Code Style
Follow PEP 8. Use Black for formatting and Flake8 for linting.

```bash
pip install black flake8
black .
flake8 .
```

## Deployment

### Production Checklist
- [ ] Set `FLASK_ENV=production`
- [ ] Use strong `SECRET_KEY`
- [ ] Use Supabase production credentials
- [ ] Enable HTTPS
- [ ] Configure production database
- [ ] Set up monitoring/logging
- [ ] Configure email service
- [ ] Test all endpoints

## Troubleshooting

### Port Already in Use
Change port in `.env`: `PORT=5001`

### Module Import Errors
Make sure you're in Server directory with venv activated

### CORS Errors
Update `CORS_ORIGINS` in `.env`

### Database Connection Issues
Verify Supabase credentials in `.env`

## Contributing

1. Create feature branch
2. Implement changes in appropriate blueprint folder
3. Update schema models if needed
4. Test endpoints
5. Follow PEP 8 guidelines
6. Create PR for review