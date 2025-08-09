## Persistent Profile Picture Feature Plan

### Goal
Allow users to upload a profile picture that persists across sessions by saving the image to the backend and displaying it from the user's `imgUrl` field.

---

### 1. Backend Review
- [x] Confirm backend `/profile` PUT endpoint supports `multipart/form-data` and updates `imgUrl` (already implemented).
- [x] Confirm returned user object includes updated `imgUrl`.

### 2. Frontend Implementation


#### a. Image Selection
- [x] Use Expo ImagePicker to let user select a new avatar image.

#### b. Image Upload
- [x] Create a `FormData` object and append the image as `image`.
- [x] Send a `PUT` request to `/profile` with `multipart/form-data` and authentication token.
- [x] Handle upload errors and show user feedback.

#### c. Update User State
- [ ] On successful response, update the user context/state with the new user object (including `imgUrl`).
- [ ] Optionally, update the UI immediately for better UX.

#### d. Avatar Display
- [x] Use `user.imgUrl` as the avatar source in the profile and throughout the app.
- [x] Fallback to a default image if `imgUrl` is not set.

### 3. Optional Enhancements
- [ ] Allow editing other profile fields (name, phoneNumber) in the same request.
- [ ] Add loading indicators during upload.
- [ ] Add success/error toasts or alerts.

### 4. Testing
- [ ] Test with various image sizes and formats.
- [ ] Test on both Android and iOS.
- [ ] Test with slow network and error scenarios.

---

### Checklist
- [ ] User can select and upload a new profile picture
- [ ] Image is uploaded to backend and stored in Cloudinary
- [ ] Backend updates and returns new `imgUrl`
- [ ] Frontend updates user state/context with new `imgUrl`
- [ ] Profile picture persists after logout/login
- [ ] Fallback/default avatar works if no image is set
