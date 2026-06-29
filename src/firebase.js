import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAPA8_9Alm4mTdT6GJQ_1UU8vAmc-Z1tgk",
  authDomain: "sp202606-88055.firebaseapp.com",
  projectId: "sp202606-88055",
  storageBucket: "sp202606-88055.firebasestorage.app",
  messagingSenderId: "312897125621",
  appId: "1:312897125621:web:07a9bad91560e631be99bc",
  measurementId: "G-00EFZJ2V7N",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
