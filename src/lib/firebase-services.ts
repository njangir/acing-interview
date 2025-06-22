import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  writeBatch,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { db, auth, storage } from './firebase';
import type { 
  Service, 
  Booking, 
  Testimonial, 
  Resource, 
  UserProfile, 
  UserMessage, 
  Badge,
  FeedbackSubmissionHistoryEntry
} from '@/types';

// Helper function to convert Firestore timestamps
const convertTimestamps = (data: any) => {
  if (!data) return data;
  
  const converted = { ...data };
  if (converted.createdAt?.toDate) {
    converted.createdAt = converted.createdAt.toDate().toISOString();
  }
  if (converted.updatedAt?.toDate) {
    converted.updatedAt = converted.updatedAt.toDate().toISOString();
  }
  if (converted.timestamp?.toDate) {
    converted.timestamp = converted.timestamp.toDate().toISOString();
  }
  
  return converted;
};

// Authentication Services
export const authService = {
  async signIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async signUp(email: string, password: string, userData: Partial<UserProfile>) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    const userProfile: Omit<UserProfile, 'uid'> = {
      name: userData.name || 'New User',
      email,
      phone: userData.phone || '',
      imageUrl: userData.imageUrl || '',
      awardedBadges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'userProfiles'), {
      ...userProfile,
      uid: userCredential.user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return userCredential.user;
  },

  async signOut() {
    await signOut(auth);
  },

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};

// User Profile Services
export const userProfileService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userQuery = query(collection(db, 'userProfiles'), where('uid', '==', uid));
      const snapshot = await getDocs(userQuery);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...convertTimestamps(doc.data()) } as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>) {
    try {
      const userQuery = query(collection(db, 'userProfiles'), where('uid', '==', uid));
      const snapshot = await getDocs(userQuery);
      
      if (snapshot.empty) throw new Error('User profile not found');
      
      const docRef = doc(db, 'userProfiles', snapshot.docs[0].id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async uploadProfileImage(uid: string, file: File): Promise<string> {
    try {
      const fileRef = storageRef(storage, `profile-images/${uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }
};

// Services
export const serviceService = {
  async getAllServices(): Promise<Service[]> {
    try {
      const snapshot = await getDocs(collection(db, 'services'));
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as Service[];
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  async getService(id: string): Promise<Service | null> {
    try {
      const docRef = doc(db, 'services', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Service;
    } catch (error) {
      console.error('Error fetching service:', error);
      throw error;
    }
  },

  async createService(serviceData: Omit<Service, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'services'), {
        ...serviceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  async updateService(id: string, updates: Partial<Service>): Promise<void> {
    try {
      const docRef = doc(db, 'services', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  async deleteService(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'services', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },

  async uploadServiceImage(serviceId: string, file: File): Promise<string> {
    try {
      const fileRef = storageRef(storage, `service-images/${serviceId}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading service image:', error);
      throw error;
    }
  }
};

// Bookings
export const bookingService = {
  async getUserBookings(uid: string): Promise<Booking[]> {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as Booking[];
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  },

  async getAllBookings(): Promise<Booking[]> {
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as Booking[];
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      throw error;
    }
  },

  async createBooking(bookingData: Omit<Booking, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<void> {
    try {
      const docRef = doc(db, 'bookings', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  async getBooking(id: string): Promise<Booking | null> {
    try {
      const docRef = doc(db, 'bookings', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Booking;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  }
};

// Testimonials
export const testimonialService = {
  async getApprovedTestimonials(): Promise<Testimonial[]> {
    try {
      const q = query(
        collection(db, 'testimonials'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as Testimonial[];
    } catch (error) {
      console.error('Error fetching approved testimonials:', error);
      throw error;
    }
  },

  async getAllTestimonials(): Promise<Testimonial[]> {
    try {
      const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as Testimonial[];
    } catch (error) {
      console.error('Error fetching all testimonials:', error);
      throw error;
    }
  },

  async createTestimonial(testimonialData: Omit<Testimonial, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'testimonials'), {
        ...testimonialData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating testimonial:', error);
      throw error;
    }
  },

  async updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<void> {
    try {
      const docRef = doc(db, 'testimonials', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating testimonial:', error);
      throw error;
    }
  },

  async uploadTestimonialImage(testimonialId: string, file: File): Promise<string> {
    try {
      const fileRef = storageRef(storage, `testimonial-images/${testimonialId}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading testimonial image:', error);
      throw error;
    }
  }
};

// Resources
export const resourceService = {
  async getResources(serviceCategory?: string): Promise<Resource[]> {
    try {
      let q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
      
      if (serviceCategory) {
        q = query(
          collection(db, 'resources'),
          where('serviceCategory', '==', serviceCategory),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as Resource[];
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  },

  async createResource(resourceData: Omit<Resource, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'resources'), {
        ...resourceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  },

  async updateResource(id: string, updates: Partial<Resource>): Promise<void> {
    try {
      const docRef = doc(db, 'resources', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  },

  async deleteResource(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'resources', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  },

  async uploadResourceFile(resourceId: string, file: File): Promise<string> {
    try {
      const fileRef = storageRef(storage, `resources/${resourceId}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading resource file:', error);
      throw error;
    }
  }
};

// User Messages
export const messageService = {
  async getUserMessages(uid: string): Promise<UserMessage[]> {
    try {
      const q = query(
        collection(db, 'userMessages'),
        where('uid', '==', uid),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as UserMessage[];
    } catch (error) {
      console.error('Error fetching user messages:', error);
      throw error;
    }
  },

  async getAllMessages(): Promise<UserMessage[]> {
    try {
      const q = query(collection(db, 'userMessages'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as UserMessage[];
    } catch (error) {
      console.error('Error fetching all messages:', error);
      throw error;
    }
  },

  async createMessage(messageData: Omit<UserMessage, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'userMessages'), {
        ...messageData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  },

  async updateMessage(id: string, updates: Partial<UserMessage>): Promise<void> {
    try {
      const docRef = doc(db, 'userMessages', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }
};

// Badges
export const badgeService = {
  async getAllBadges(): Promise<Badge[]> {
    try {
      const snapshot = await getDocs(collection(db, 'badges'));
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as Badge[];
    } catch (error) {
      console.error('Error fetching badges:', error);
      throw error;
    }
  },

  async createBadge(badgeData: Omit<Badge, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'badges'), {
        ...badgeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating badge:', error);
      throw error;
    }
  },

  async updateBadge(id: string, updates: Partial<Badge>): Promise<void> {
    try {
      const docRef = doc(db, 'badges', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating badge:', error);
      throw error;
    }
  },

  async deleteBadge(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'badges', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting badge:', error);
      throw error;
    }
  },

  async uploadBadgeImage(badgeId: string, file: File): Promise<string> {
    try {
      const fileRef = storageRef(storage, `badge-images/${badgeId}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading badge image:', error);
      throw error;
    }
  }
};

// Service Availability
export const availabilityService = {
  async getAvailability(date: string): Promise<string[]> {
    try {
      const docRef = doc(db, 'serviceAvailability', date);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return [];
      
      return docSnap.data().timeSlots || [];
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  },

  async setAvailability(date: string, timeSlots: string[]): Promise<void> {
    try {
      const docRef = doc(db, 'serviceAvailability', date);
      await updateDoc(docRef, {
        timeSlots,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting availability:', error);
      throw error;
    }
  },

  async getAvailabilityRange(startDate: string, endDate: string): Promise<Record<string, string[]>> {
    try {
      const q = query(
        collection(db, 'serviceAvailability'),
        where('__name__', '>=', startDate),
        where('__name__', '<=', endDate)
      );
      const snapshot = await getDocs(q);
      
      const availability: Record<string, string[]> = {};
      snapshot.docs.forEach(doc => {
        availability[doc.id] = doc.data().timeSlots || [];
      });
      
      return availability;
    } catch (error) {
      console.error('Error fetching availability range:', error);
      throw error;
    }
  }
};

// Real-time listeners
export const realtimeService = {
  onServicesChange(callback: (services: Service[]) => void) {
    return onSnapshot(collection(db, 'services'), (snapshot) => {
      const services = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as Service[];
      callback(services);
    });
  },

  onUserBookingsChange(uid: string, callback: (bookings: Booking[]) => void) {
    const q = query(
      collection(db, 'bookings'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as Booking[];
      callback(bookings);
    });
  },

  onTestimonialsChange(callback: (testimonials: Testimonial[]) => void) {
    const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const testimonials = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as Testimonial[];
      callback(testimonials);
    });
  },

  onUserMessagesChange(uid: string, callback: (messages: UserMessage[]) => void) {
    const q = query(
      collection(db, 'userMessages'),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...convertTimestamps(doc.data()) 
      })) as UserMessage[];
      callback(messages);
    });
  }
}; 