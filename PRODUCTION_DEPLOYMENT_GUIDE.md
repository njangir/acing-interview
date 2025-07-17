# Production Deployment Guide - Armed Forces Interview Ace

## 🚀 Quick Start Checklist

### Phase 1: Firebase Project Setup (30 minutes)

1. **Create Firebase Project** (done)
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project: "Armed Forces Interview Ace"
   - Enable Google Analytics (optional)

2. **Configure Firebase Services**  (done)
   - **Authentication**: Enable Email/Password authentication
   - **Firestore**: Create database in Native mode
   - **Storage**: Enable Firebase Storage
   - **Functions**: Enable Cloud Functions

3. **Get Configuration** (done)
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Click "Add app" > Web app
   - Copy the config object

4. **Set Environment Variables** (done)
   ```bash
   # Create .env.local file
   cp env.example .env.local
   ```
   
   Update `.env.local` with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

### Phase 2: Deploy Firebase Backend (15 minutes)

1. **Install Firebase CLI** (if not already installed) (done)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase** (done)
   ```bash
   firebase login
   ```

3. **Initialize Firebase in project** (done)
   ```bash
   firebase init
   ```
   
   Select:
   - Firestore
   - Functions
   - Storage
   - Hosting (if you want to use Firebase Hosting)

4. **Deploy Firebase resources** (inprogress)
   ```bash
   firebase deploy
   ```

### Phase 3: Initialize Database (10 minutes)

1. **Seed Initial Data** (Optional)
   - The app will create data as users interact with it
   - Or manually add some services/badges through the admin panel

2. **Create Admin User**
   - Sign up with email: `admin@example.com`
   - The Firebase Function will automatically set admin privileges

### Phase 4: Deploy Frontend (10 minutes)

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred hosting**
   
   **Option A: Vercel (Recommended)**
   ```bash
   npm install -g vercel
   vercel --prod
   ```
   
   **Option B: Firebase Hosting**
   ```bash
   firebase deploy --only hosting
   ```
   
   **Option C: Netlify**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `out`

## 🔧 Configuration Details

### Firebase Security Rules

The security rules are already configured in `firestore.rules` and `firestore.indexes.json`. They provide:

- **User Profiles**: Users can read/write their own profile, admins can read all
- **Services**: Publicly readable, writable only by admins
- **Bookings**: Users can manage their own bookings, admins can manage all
- **Testimonials**: Users can create, approved ones are public, admins can manage
- **Resources**: Readable by authenticated users, writable only by admins
- **Messages**: Users can send messages, admins can read all and reply

### Cloud Functions

The following functions are deployed:

- `onUserCreate`: Creates user profiles and sets admin privileges
- `createPaymentOrder`: Creates payment orders (payment gateway integration needed)
- `confirmBooking`: Confirms bookings after payment
- `updateBookingStatus`: Admin function to update booking status
- `processRefundRequest`: Handles refund requests
- `exportBookingsReport`: Exports booking data for admin reports
- `autoCancelUnpaidBookings`: Automatically cancels unpaid bookings
- `onBookingStatusChange`: Creates notifications for booking changes
- `onNewMessage`: Creates notifications for new messages

### Data Migration from Mock

The application automatically migrates from mock data to real Firebase data:

1. **Services**: Fetched from Firestore `services` collection
2. **Bookings**: Stored in Firestore `bookings` collection
3. **Testimonials**: Stored in Firestore `testimonials` collection
4. **User Profiles**: Stored in Firestore `userProfiles` collection
5. **Resources**: Stored in Firestore `resources` collection
6. **Messages**: Stored in Firestore `userMessages` collection
7. **Badges**: Stored in Firestore `badges` collection

## 🛡️ Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use different Firebase projects for development/staging/production
- Rotate API keys regularly

### Admin Access
- Admin privileges are set via Firebase Custom Claims
- Only users with `admin@example.com` email get admin access
- Modify the Firebase Function to change admin logic

### Data Validation
- All data is validated on the client and server
- Firestore security rules provide additional protection
- File uploads are restricted to specific file types and sizes

## 📊 Monitoring & Analytics

### Firebase Analytics
- Automatically tracks user interactions
- Monitor user engagement and conversion rates
- Track booking completion rates

### Error Monitoring
- Firebase Functions logs are available in Firebase Console
- Set up error alerting for critical functions
- Monitor Firestore usage and costs

## 🔄 Continuous Deployment

### GitHub Actions (Recommended)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

### Environment Management
- Use Firebase project aliases for different environments
- Set up staging environment for testing
- Use feature flags for gradual rollouts

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Functions not deploying**
   - Check Node.js version (should be 18+)
   - Verify billing is enabled
   - Check function logs in Firebase Console

2. **Authentication not working**
   - Verify Firebase config in `.env.local`
   - Check if Authentication is enabled in Firebase Console
   - Ensure Email/Password provider is enabled

3. **Firestore rules blocking access**
   - Check security rules in Firebase Console
   - Verify user authentication state
   - Check custom claims for admin access

4. **Storage uploads failing**
   - Verify Storage rules allow uploads
   - Check file size limits
   - Ensure proper file type validation

### Performance Optimization

1. **Firestore Indexes**
   - Monitor query performance in Firebase Console
   - Add composite indexes for complex queries
   - Use pagination for large datasets

2. **Image Optimization**
   - Compress images before upload
   - Use appropriate image formats (WebP for web)
   - Implement lazy loading for images

3. **Bundle Size**
   - Monitor bundle size with `npm run build`
   - Use dynamic imports for large components
   - Optimize Firebase SDK imports

## 📈 Scaling Considerations

### Firestore
- Use pagination for large collections
- Implement proper indexing strategies
- Monitor read/write costs

### Functions
- Set appropriate memory limits
- Use connection pooling for external APIs
- Implement retry logic for failed operations

### Storage
- Implement file cleanup for unused uploads
- Use CDN for frequently accessed files
- Monitor storage costs

## 🎯 Next Steps

1. **Payment Integration**
   - Integrate Razorpay or Stripe for payments
   - Implement webhook handling
   - Add payment analytics

2. **Email Notifications**
   - Set up Firebase Extensions for email
   - Configure email templates
   - Implement email preferences

3. **Advanced Analytics**
   - Set up custom events tracking
   - Implement conversion funnels
   - Add A/B testing capabilities

4. **Mobile App**
   - Consider React Native for mobile app
   - Implement push notifications
   - Add offline capabilities

## 📞 Support

For issues or questions:
1. Check Firebase Console logs
2. Review this deployment guide
3. Check the backend production checklist
4. Contact the development team

---

**Deployment Time Estimate**: 1-2 hours for complete setup
**Maintenance**: Minimal - Firebase handles most infrastructure
**Cost**: Pay-as-you-go based on usage 