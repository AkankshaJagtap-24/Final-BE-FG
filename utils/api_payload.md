POST http://localhost:5000/api/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}

Response:
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": 1,
        "email": "john@example.com",
        "name": "John Doe"
    }
}
signup
POST http://localhost:5000/api/signup
Content-Type: application/json

{
    "name": "New User",
    "email": "newuser@example.com",
    "password": "password123",
    "phone": "+1234567890"
}

Response:
{
    "success": true,
    "message": "User created successfully"
}


POST http://localhost:5000/api/sos_hit
Authorization: Bearer your_jwt_token
Content-Type: application/json

{
    "userId": 1,
    "location": "123 Emergency St, City",
    "description": "Medical emergency needed"
}

Response:
{
    "success": true,
    "message": "SOS alert sent successfully",
    "alertId": 1
}


GET http://localhost:5000/api/forum
Authorization: Bearer your_jwt_token

Response:
{
    "success": true,
    "posts": [
        {
            "id": 1,
            "title": "Safety Tips",
            "content": "Here are some important safety tips...",
            "user_id": 1,
            "created_at": "2024-01-20T10:00:00Z"
        }
    ]
}

POST http://localhost:5000/api/forum
Authorization: Bearer your_jwt_token
Content-Type: application/json

{
    "userId": 1,
    "title": "New Forum Post",
    "content": "This is the content of the forum post"
}

Response:
{
    "success": true,
    "message": "Post created successfully",
    "postId": 1
}
---- 


POST /api/admin/login
Body:
{
    "email": "admin@example.com",
    "password": "admin_password"
}

GET /api/admin/sos-alerts
Headers:
Authorization: Bearer admin_token

GET /api/admin/forum-posts
Headers:
Authorization: Bearer admin_token


GET /api/admin/users
Headers:
Authorization: Bearer admin_token