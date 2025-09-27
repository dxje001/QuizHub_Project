# Multi-User Testing Guide

## Setup for Testing Admin Room Monitoring

### Problem: Session Conflicts
When using multiple tabs in the same browser, authentication tokens conflict and users get logged out.

### Solution: Use Different Browser Contexts

#### Option 1: Different Browsers
- **Admin**: Chrome - `http://localhost:3000`
- **User 1**: Firefox - `http://localhost:3000`
- **User 2**: Edge - `http://localhost:3000`

#### Option 2: Chrome Profiles
- **Admin**: Regular Chrome
- **User 1**: Chrome Incognito Window
- **User 2**: Chrome Guest Mode / Different Profile

#### Option 3: Browser Developer Mode
- **Admin**: Regular Chrome
- **User 1**: Chrome Incognito
- **User 2**: Chrome with DevTools -> Application -> Storage -> Clear All

### Testing Steps

1. **Setup Users:**
   - Admin user (with Admin role)
   - Regular user 1
   - Regular user 2

2. **Admin Flow:**
   ```
   1. Login as Admin
   2. Go to http://localhost:3000/admin
   3. Click "Create Live Quiz Room"
   4. Create a room and note the room code
   5. Click "Monitor" button
   6. Should redirect to http://localhost:3000/admin/room/{roomcode}
   ```

3. **User Flow:**
   ```
   1. Login as User 1 in different browser/incognito
   2. Go to "Join Room" and enter room code
   3. Mark as "Ready"
   4. Repeat with User 2
   ```

4. **Admin Control:**
   ```
   1. On admin monitor page, wait for 2+ users to be ready
   2. Click "Start Quiz" button
   3. Monitor real-time quiz progress
   ```

### Real-time Updates Debug

If real-time updates aren't working, check browser console for:
- "Admin joining room group for monitoring: {roomcode}"
- "ParticipantJoined event received: {participant}"
- SignalR connection status

### Expected Behavior

✅ **When users join room:** Admin should see participant count update immediately
✅ **When users mark ready:** Admin should see ready status change immediately
✅ **When quiz starts:** All participants should see quiz start immediately
✅ **During quiz:** Admin should see live answer submissions and leaderboard updates

### Troubleshooting

❌ **Page needs refresh for updates:**
- Check browser console for SignalR connection errors
- Check if admin successfully joined room group
- Check if participants are properly connected

❌ **Users logging each other out:**
- Use different browsers or incognito mode
- Clear localStorage in one of the tabs

❌ **Admin not receiving updates:**
- Check admin has proper Admin role
- Check SignalR connection in browser console
- Verify admin monitoring page is using correct room code