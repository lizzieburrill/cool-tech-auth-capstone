# Cool Tech Auth Capstone

### How to Run
1. **Server:** `cd server` -> `npm install` -> `node index.js`
2. **Client:** `cd client` -> `npm install` -> `npm start`
3. **Database:** Ensure MongoDB is running locally on port 27017.

### Login Credentials for Testing
**Important:** Please run the seed endpoint first to generate these users.
1. Open Postman
2. POST http://localhost:5000/seed
3. Use the credentials below:

**1. Admin User**
* **Username:** adminUser
* **Password:** admin123
* **Role:** Admin (Access to Admin Panel, Manage Users/OUs)

**2. Management User**
* **Username:** managerUser
* **Password:** manager123
* **Role:** Management (Can update credentials)

**3. Normal User**
* **Username:** normalUser
* **Password:** normal123
* **Role:** Normal (View/Add only)