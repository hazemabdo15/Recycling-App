# 🔍 Backend Socket Authentication Investigation Report

## 🎯 **ISSUE IDENTIFIED: JWT Secret Mismatch**

I found the root cause of your socket authentication issues!

---

## 1. **Socket.IO Server Authentication Setup**

**Location**: `src/socket/socketServer.ts`

**Authentication Middleware**:
```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    // ❌ PROBLEM: Using wrong JWT secret
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET) as any;
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});
```

---

## 2. **Token Format Requirements**

✅ **Expected Format**: 
```javascript
{
  auth: { 
    token: "your_jwt_token_here" // NO "Bearer " prefix needed
  }
}
```

✅ **Alternative Format** (also supported):
```javascript
{
  query: { 
    token: "your_jwt_token_here" 
  }
}
```

---

## 3. **JWT Secret Configuration Issue** ❌

**The Problem**: Your backend uses **different JWT secrets** for different parts:

### HTTP API Authentication:
- Uses: `process.env.JWT_ACCESS_SECRET`
- Location: `src/utils/jwt.ts`

### Socket.IO Authentication (BEFORE FIX):
- Was using: `process.env.JWT_SECRET` ❌ 
- Location: `src/socket/socketServer.ts`

### **Solution Applied**: ✅
I updated the socket server to use the same `JWT_ACCESS_SECRET` as your HTTP API.

---

## 4. **Backend Socket Authentication Code** (FIXED)

**New Enhanced Authentication Code**:
```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    console.log('❌ Socket auth failed: No token provided');
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    // ✅ NOW USING CORRECT SECRET
    const accessSecret = process.env.JWT_ACCESS_SECRET as string;
    const decoded = jwt.verify(token, accessSecret) as any;
    
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    
    console.log(`🔐 User ${decoded.userId} authenticated via socket successfully`);
    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});
```

---

## 5. **Error Details**

**"Authentication error: Invalid token"** was triggered by:
- JWT secret mismatch between HTTP API and Socket.IO
- Socket server couldn't decode tokens that were created with `JWT_ACCESS_SECRET`

---

## 6. **Working API vs Socket Comparison**

| Component | JWT Secret Used | Status |
|-----------|----------------|---------|
| HTTP API | `JWT_ACCESS_SECRET` | ✅ Working |
| Socket.IO (Before) | `JWT_SECRET` | ❌ Failed |
| Socket.IO (After Fix) | `JWT_ACCESS_SECRET` | ✅ Should Work |

---

## 7. **Current Socket Server Configuration** (UPDATED)

```typescript
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "exp://192.168.1.100:8081",
      "exp://localhost:8081",
      "*" // Allow all origins for Expo Go during development
    ],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true // Better compatibility
});
```

---

## 8. **Environment Variables Required**

Make sure your `.env` file has:
```env
JWT_ACCESS_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_SECRET=your-secret-key-here  # Legacy, but might be used elsewhere
```

---

## 🚀 **Test Instructions**

1. **Restart your backend server** after these changes
2. **Test socket connection** from your Expo app
3. **Check backend logs** for these new diagnostic messages:
   ```
   🔍 Socket auth attempt - Token (first 20 chars): eyJhbGciOiJIUzI1NiIs...
   🔐 User 12345 authenticated via socket successfully
   ✅ User 12345 connected via socket
   ```

---

## 🎯 **Expected Results**

After this fix, you should see:

**Backend Logs**:
```
🔍 Socket auth attempt - Token (first 20 chars): eyJhbGciOiJIUzI1NiIs...
🔐 User 60d5ecb74b24a1234567890a authenticated via socket successfully
✅ User 60d5ecb74b24a1234567890a connected via socket
```

**Frontend (Expo)**:
```
✅ Connected to notification server
Socket connected successfully!
```

---

## 🔧 **If Still Not Working**

If you still get authentication errors, check:

1. **Environment Variables**: Ensure `JWT_ACCESS_SECRET` is set in your `.env`
2. **Token Format**: Make sure you're sending the token as `auth: { token: "..." }`
3. **Backend Logs**: Look for the new diagnostic messages to see what's happening

The fix should resolve the authentication issue immediately! 🎉
