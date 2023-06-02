// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
let firebaseConfig = {
  apiKey: "AIzaSyAugMYHQNuyJjzwHeY_6uYYt7ghAIenaQ8",
  authDomain: "australian-library.firebaseapp.com",
  projectId: "australian-library",
  storageBucket: "australian-library.appspot.com",
  messagingSenderId: "822874894523",
  appId: "1:822874894523:web:e64f77a59ca59636db399e",
  measurementId: "G-QGXC9MQ97F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

const db = getFirestore(app);
const storage = getStorage(app);

if (import.meta.env.MODE === "development" ) {
  /**
   * This is a hack to get around the 'Internal server error: Firestore has already been started and its settings can no
   * longer be changed. You can only modify settings before calling any other methods on a Firestore object.'
   *
   * which started for no reason, not to sure of the implications of this hack, but it seems to work for now
   *
   * @see https://stackoverflow.com/questions/71574102/firebase-error-firestore-has-already-been-started-and-its-settings-can-no-lon
   */
  if (!db._settingsFrozen) {
    connectFirestoreEmulator(db, "localhost", 8081);
  }
  connectStorageEmulator(storage, "localhost", 8089);
}

export { db };
export { storage };
