const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initial services data
const initialServices = [
  {
    name: 'SSB Mock Interview',
    description: 'Comprehensive mock interview simulating the actual SSB experience with personalized feedback.',
    price: 2999,
    duration: '90 mins',
    features: ['One-on-One Interview', 'Psychological Test Analysis (TAT, WAT, SRT)', 'GTO Task Briefing', 'Personalized Feedback Report', 'Doubt Clearing Session'],
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'interview meeting',
    defaultForce: 'General',
    isBookable: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    name: 'Personal Counselling Session',
    description: 'Guidance and mentorship to help you prepare mentally and strategically for the SSB.',
    price: 1499,
    duration: '60 mins',
    features: ['Career Path Guidance', 'Strengths & Weaknesses Analysis', 'Confidence Building Techniques', 'SSB Procedure Walkthrough'],
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'counseling support',
    defaultForce: 'General',
    isBookable: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    name: 'AFCAT Exam Guidance',
    description: 'Expert guidance and study strategies to crack the AFCAT exam.',
    price: 999,
    duration: '45 mins',
    features: ['Syllabus Overview', 'Study Material Recommendation', 'Time Management Tips', 'Mock Test Strategy'],
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'exam preparation',
    defaultForce: 'Air Force',
    isBookable: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
];

// Initial badges data
const initialBadges = [
  {
    name: 'Pilot Aspirant Badge',
    description: 'Awarded for showing strong aptitude towards aviation concepts during AFCAT guidance.',
    force: 'Air Force',
    rankName: 'Pilot Aspirant',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'air force pilot insignia',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    name: 'Leadership Potential Badge',
    description: 'Recognized for demonstrating key leadership qualities in SSB mock interview.',
    force: 'Army',
    rankName: 'Officer Candidate',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'army officer badge',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    name: 'Strategic Thinker Badge',
    description: 'Commended for excellent strategic thinking during SSB counselling.',
    force: 'Navy',
    rankName: 'Midshipman Aspirant',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'navy insignia',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    name: 'SSB Stage-I Cleared Badge',
    description: 'Successfully cleared Stage-I of the SSB mock process.',
    force: 'General',
    rankName: 'Stage-I Qualified',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'achievement badge',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    name: 'Commendable Effort Badge',
    description: 'Awarded for outstanding effort and dedication during preparation.',
    force: 'General',
    rankName: 'Dedicated Learner',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'star award',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
];

// Initial resources data
const initialResources = [
  {
    title: 'SSB Interview Guide PDF',
    type: 'document',
    url: 'https://example.com/ssb_guide.pdf',
    description: 'A comprehensive guide covering all aspects of the SSB interview.',
    serviceCategory: 'ssb-mock-interview',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    title: 'Psychological Test Practice Video',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=example',
    description: 'Video tutorial on how to approach psychological tests.',
    serviceCategory: 'ssb-mock-interview',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    title: 'AFCAT Study Plan',
    type: 'document',
    url: 'https://example.com/afcat_study_plan.pdf',
    description: 'A structured study plan for AFCAT preparation.',
    serviceCategory: 'afcat-exam-guidance',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    title: 'Important Defence News',
    type: 'link',
    url: 'https://www.indiandefensenews.in/',
    description: 'Stay updated with the latest in defence.',
    serviceCategory: 'general',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
];

// Seed data function
async function seedData() {
  try {
    console.log('🌱 Starting data seeding...');

    // Seed services
    console.log('📦 Seeding services...');
    for (const service of initialServices) {
      await addDoc(collection(db, 'services'), service);
      console.log(`✅ Added service: ${service.name}`);
    }

    // Seed badges
    console.log('🏅 Seeding badges...');
    for (const badge of initialBadges) {
      await addDoc(collection(db, 'badges'), badge);
      console.log(`✅ Added badge: ${badge.name}`);
    }

    // Seed resources
    console.log('📚 Seeding resources...');
    for (const resource of initialResources) {
      await addDoc(collection(db, 'resources'), resource);
      console.log(`✅ Added resource: ${resource.title}`);
    }

    console.log('🎉 Data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${initialServices.length} services added`);
    console.log(`- ${initialBadges.length} badges added`);
    console.log(`- ${initialResources.length} resources added`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedData();
}

module.exports = { seedData }; 