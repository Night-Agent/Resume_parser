# 🔧 LOGIN/SIGNUP TROUBLESHOOTING GUIDE

## Quick Diagnosis

**Run this first:** Double-click `DIAGNOSE_LOGIN_ISSUE.bat`

This will automatically check:
- ✅ Backend server status
- ✅ MongoDB connection
- ✅ API endpoints
- ✅ Configuration files

---

## Common Issues & Solutions

### Issue 1: "Cannot connect to server" / "Network Error"

**Symptoms:**
- Error message in browser console
- "Network error. Please try again."
- Unable to register or login

**Solution:**

1. **Check if backend is running:**
   ```bash
   # Open browser and go to:
   http://localhost:5000/health
   
   # Should show: {"status":"OK","message":"AI Resume Platform API is running"}
   ```

2. **If backend is NOT running:**
   ```bash
   # Option A: Use automated script
   Double-click START_ALL.bat
   
   # Option B: Start manually
   cd backend
   npm run dev
   ```

3. **Check backend terminal for errors:**
   - Look for error messages
   - Most common: MongoDB connection failed

---

### Issue 2: "MongoDB Connection Failed"

**Symptoms:**
- Backend crashes on startup
- Error: "MongooseServerSelectionError"
- "Connection refused to localhost:27017"

**Solution A: Use MongoDB Atlas (Cloud - Recommended)**

1. Go to https://mongodb.com/cloud/atlas/register
2. Create FREE account
3. Create FREE cluster (M0)
4. Click "Connect" → "Connect your application"
5. Copy connection string (looks like):
   ```
   mongodb+srv://username:<password>@cluster.mongodb.net/
   ```
6. Open `backend\.env`
7. Update:
   ```env
   MONGODB_URI=mongodb+srv://username:YOUR_PASSWORD@cluster.mongodb.net/resumeparser
   ```
8. Restart backend

**Solution B: Install MongoDB Locally**

1. Download MongoDB: https://www.mongodb.com/try/download/community
2. Install with default settings
3. Start MongoDB:
   ```bash
   net start MongoDB
   ```
4. Restart backend

**Solution C: Check if MongoDB is running**
```bash
# Check status
sc query MongoDB

# If stopped, start it
net start MongoDB
```

---

### Issue 3: "Invalid credentials" (Even with correct password)

**Symptoms:**
- Can register successfully
- Login fails with "Invalid credentials"
- Password is definitely correct

**Solution:**

1. **Check JWT_SECRET in .env:**
   ```bash
   # Open backend\.env
   # Make sure JWT_SECRET is NOT the default value
   
   # Should NOT be:
   JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
   
   # Should be a long random string (32+ characters):
   JWT_SECRET=a9f8d7e6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1
   ```

2. **Generate new JWT_SECRET:**
   ```bash
   # Windows PowerShell:
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   
   # Or use online generator:
   https://randomkeygen.com/
   ```

3. **Clear old data and try again:**
   - Clear browser localStorage (F12 → Application → Local Storage → Clear)
   - Register a NEW account
   - Try logging in

---

### Issue 4: "Passwords do not match" (Even when they match)

**Symptoms:**
- Registration form shows error
- Passwords are identical but error persists

**Solution:**

1. **Check for spaces:**
   - Remove any spaces before/after password
   - Make sure Caps Lock is off

2. **Password requirements:**
   - Minimum 6 characters
   - For "Strong" rating: Mix of uppercase, lowercase, numbers, symbols

---

### Issue 5: "Cannot find module 'openai'"

**Symptoms:**
- Backend crashes on startup
- TypeScript error: TS2307

**Solution:**

```bash
# Run this:
cd backend
npm install openai

# Or use automated script:
Double-click INSTALL_OPENAI.bat
```

---

### Issue 6: Port 5000 Already in Use

**Symptoms:**
- "EADDRINUSE: address already in use :::5000"
- Backend won't start

**Solution:**

```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace 1234 with actual PID)
taskkill /PID 1234 /F

# Or change port in backend\.env:
PORT=5001
```

---

### Issue 7: CORS Error

**Symptoms:**
- Browser console: "CORS policy: No 'Access-Control-Allow-Origin'"
- Frontend can't reach backend

**Solution:**

1. **Check backend/.env:**
   ```env
   FRONTEND_URL=http://localhost:3000
   ```

2. **Make sure backend is running on port 5000:**
   ```bash
   # Check health endpoint:
   curl http://localhost:5000/health
   ```

3. **Make sure frontend .env has correct API URL:**
   ```env
   # In frontend folder (create if missing):
   REACT_APP_API_URL=http://localhost:5000
   ```

---

## Testing Login/Signup Manually

### Test Registration:

1. **Open browser console (F12)**
2. **Go to Network tab**
3. **Register a new account:**
   - Email: `test@example.com`
   - Password: `Test123!@#`
   - First Name: `Test`
   - Last Name: `User`
4. **Check Network tab for:**
   - Request to `http://localhost:5000/api/auth/register`
   - Status: 200 or 201 (Success)
   - Response: `{"success":true,"token":"...","user":{...}}`

### Test Login:

1. **Open browser console (F12)**
2. **Go to Network tab**
3. **Login with account:**
   - Email: `test@example.com`
   - Password: `Test123!@#`
4. **Check Network tab for:**
   - Request to `http://localhost:5000/api/auth/login`
   - Status: 200 (Success)
   - Response: `{"success":true,"token":"...","user":{...}}`

---

## Using curl to Test Backend

### Test Registration:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"test123456\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@test.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "user"
  }
}
```

### Test Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"test123456\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@test.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "user"
  }
}
```

---

## Checklist Before Asking for Help

- [ ] Backend is running (`http://localhost:5000/health` shows OK)
- [ ] MongoDB is connected (no errors in backend terminal)
- [ ] OpenAI package is installed (`backend\node_modules\openai` exists)
- [ ] JWT_SECRET is set in `.env` (not the default value)
- [ ] Frontend is running (`http://localhost:3000` opens)
- [ ] Browser console shows no CORS errors (F12 → Console)
- [ ] Network tab shows 200/201 status for API calls (F12 → Network)

---

## Still Not Working?

### Step-by-Step Reset:

1. **Stop all servers** (Close all terminal windows)

2. **Check MongoDB:**
   ```bash
   net start MongoDB
   ```

3. **Install dependencies:**
   ```bash
   cd backend
   npm install openai
   cd ..
   ```

4. **Update .env with proper values:**
   - MongoDB URI (Atlas or local)
   - JWT_SECRET (32+ random characters)

5. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Wait for: "✓ Server running on port 5000"

6. **Start frontend (new terminal):**
   ```bash
   cd frontend
   npm start
   ```

7. **Test:**
   - Go to `http://localhost:3000`
   - Register new account
   - Login

---

## Quick Scripts Available

- `START_ALL.bat` - Automated startup (recommended)
- `FIX_LOGIN.bat` - Fixes common login issues
- `DIAGNOSE_LOGIN_ISSUE.bat` - Diagnoses problems
- `INSTALL_OPENAI.bat` - Installs OpenAI package

---

## Contact Information

If nothing works, provide this information:

1. **Backend terminal output** (copy last 20 lines)
2. **Browser console errors** (F12 → Console → screenshot)
3. **Network tab** (F12 → Network → screenshot of failed request)
4. **.env configuration** (hide passwords!)
5. **MongoDB status:** Output of `sc query MongoDB`

---

Good luck! 🚀
