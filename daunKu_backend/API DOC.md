DaunKu API Documentation

Base URL: https://ramoses.my.id/

##Authentication

###Register User

`POST /auth/register`

Request Body:

```json
{
  "userName": "string",
  "email": "string",
  "password": "string"
}
```

Responses:

- `201 Created`: `{ "id": number, "userName": "string", "email": "string" }`
- `400 Bad Request`: `Missing/invalid fields or duplicate username/email`
- `500 Internal Server Error`

### Login User

`POST /auth/login`

Request Body:

```json
{
  "email": "string",
  "password": "string"
}
```

Responses:

- `200 OK`: `{ "access_token": "string", "user": { "id": number, "userName": "string", "email": "string" } }`
- `400 Bad Request`: `Missing fields`
- `401 Unauthorized`: `Invalid email or password`
- `500 Internal Server Error`

### Google Login

`POST /auth/google`

Request Body:

```json
{ "id_token": "string" }
```

Responses:

`200 OK`: `{ "access_token": "string", "user": { "id": number, "userName": "string", "email": "string" } }`
`400 Bad Request`: `Missing or invalid id_token`
`500 Internal Server Error`

### Protected Endpoints

`All following endpoints require Authorization: Bearer <token> header.`

Plant Management
Plant Identification
`POST /plants/identify`

Request: Multipart form data with image file

Field name: image
Supported formats: JPG, PNG
Responses:

`200 OK`: `Plant identification results with species information`
`400 Bad Request`: `No image uploaded`
`401 Unauthorized`: `Missing or invalid token`
`500 Internal Server Error`

### Get All Plants

`GET /plants`

Responses:

`200 OK`: `Array of user's plants with care logs`
`401 Unauthorized`: `Missing or invalid token`
`500 Internal Server Error`

### Add Plant to Collection

`POST /plants/add-plant`

Request Body:

```json
{
  "nickname": "string",
  "speciesName": "string",
  "commonName": "string",
  "acquisitionDate": "date",
  "location": "string",
  "imageUrl": "string",
  "notes": "string"
}
```

Responses:

`201 Created`: `Created plant object`
`400 Bad Request`: `Missing required fields`
`401 Unauthorized`: `Missing or invalid token`
`500 Internal Server Error`

### Get Plant Statistics

`GET /plants/stats/summary`

Responses:

`200 OK`: `Plant statistics summary`
`401 Unauthorized`: `Missing or invalid token`
`500 Internal Server Error`

### Get Plant by ID

`GET /plants/:id`

Responses:

`200 OK`: `Plant details with care logs`
`401 Unauthorized`: `Missing or invalid token`
`404 Not Found`: `Plant not found or not authorized`
`500 Internal Server Error`

### Update Plant

`PUT /plants/update/:id`

Request Body:

```json
{
  "nickname": "string",
  "speciesName": "string",
  "commonName": "string",
  "location": "string",
  "notes": "string"
}
```

Responses:

`200 OK`: `Updated plant object`
`401 Unauthorized`: `Missing or invalid token`
`404 Not Found`: `Plant not found or not authorized`
`500 Internal Server Error`

### Delete Plant

`DELETE /plants/delete/:id`

Responses:

`200 OK`: `{ "message": "Plant deleted successfully" }`
`401 Unauthorized`: `Missing or invalid token`
`404 Not Found`: `Plant not found or not authorized`
`500 Internal Server Error`

## Care Log Management

### Get All Care Logs

`GET /care-logs`

Responses:

`200 OK`: `Array of user's care logs with plant information`
`401 Unauthorized`: `Missing or invalid token`
`500 Internal Server Error`

### Add Care Log

`POST /care-logs/add-care`

Request Body:

```json

{
    "plantId": number,
    "careType": "string",
    "date": "date",
    "notes": "string",
    "problemDescription": "string",  "problemImageUrl": "string",
    "solution": "string"
}
```

Responses:

`201 Created`: `{ "message": "string", "careLog": object }`
`400 Bad Request`: `Missing required fields`
`401 Unauthorized`: `Missing or invalid token`
`404 Not Found`: `Plant not found or not authorized`
`500 Internal Server Error`

### Get Care Logs by Plant

`GET /care-logs/plant/:plantId`

Responses:

`200 OK`: `Array of care logs for specific plant`
`401 Unauthorized`: `Missing or invalid token`
`404 Not Found`: `Plant not found or not authorized`
`500 Internal Server Error`

### Update Care Log

`PUT /care-logs/updatecare/:id`

Request Body:

```json
{
  "type": "string",
  "date": "date",
  "notes": "string",
  "problemDescription": "string",
  "problemImageUrl": "string",
  "solution": "string"
}
```

Responses:

`200 OK`: `Updated care log object`
`401 Unauthorized`: `Missing or invalid token`
`404 Not Found`: `Care log not found or not authorized`
`500 Internal Server Error`

### Delete Care Log

`DELETE /care-logs/delete/:id`

Responses:

`200 OK`: `{ "message": "Care log deleted successfully" }`
`401 Unauthorized`: `Missing or invalid token`
`404 Not Found`: `Care log not found or not authorized`
`500 Internal Server Error`

## AI Assistance

### Diagnose Plant Problem

`POST /ai/diagnose`

Request Body:

```json

{
    "plantId": number,
    "problemDescription": "string",  "problemImageUrl": "string"
}
```

Responses:

`200 OK`: `{ "message": "string", "advice": "string" }`
`401 Unauthorized`: `Missing or invalid token`
`404 Not Found`: `Plant not found or not authorized`
`500 Internal Server Error`: `AI generation error`

### Get Care Advice

`POST /ai/care-advice`

Request Body:

```json

{
    "plantId": number,
    "careType": "string"
}
```

Responses:

`200 OK`: `{ "message": "string", "advice": "string" }`
`401 Unauthorized`: `Missing or invalid token`
`404 Not Found`: `Plant not found or not authorized`
`500 Internal Server Error`: `AI generation error`

## Data Models

### User

```json

{
    "id": number,
    "userName": "string",
    "email": "string",
    "googleId": "string",
    "createdAt": "date",
    "updatedAt": "date"
}
```

### Plant

```json

{
    "id": number,
    "userId": number,
    "nickname": "string",
    "speciesName": "string",
    "commonName": "string",
    "acquisitionDate": "date",
    "location": "string",
    "imageUrl": "string",
    "lastWatered": "date",
    "notes": "string",
    "createdAt": "date",
    "updatedAt": "date",
    "careLogs": [CareLog]
}
```

### Care Log

```json

{
    "id": number,
    "plantId": number,
    "type": "string",
    "date": "date",
    "notes": "string",
    "problemDescription": "string",  "problemImageUrl": "string",
    "solution": "string",
    "createdAt": "date",
    "updatedAt": "date",
    "plant": {
        "id": number,
        "nickname": "string",
        "speciesName": "string"
    }
}
```

## Error Format

### All error responses return JSON:

```json
{
  "message": "Error description"
}
```

## Notes

- All plant and care log operations are user-scoped (users can only access their own data)
- Plant identification uses PlantNet API for species recognition
- AI features use Google Gemini API for plant care advice and problem diagnosis
- Image uploads are handled through Cloudinary
- Authentication supports both email/password and Google OAuth
- Care logs automatically update plant's lastWatered field when type is "watering"
