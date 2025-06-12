import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child } from "firebase/database";
import { getAuth, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCLHoy2bFX3Vbo2J8J0ExaSWy7S3xb2TTw",
    authDomain: "secret-game-2eeb8.firebaseapp.com",
    databaseURL: "https://secret-game-2eeb8-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "secret-game-2eeb8",
    storageBucket: "secret-game-2eeb8.firebasestorage.app",
    messagingSenderId: "128070206",
    appId: "1:128070206:web:4bacdaa9f10f4e2b4d176f"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Initialize Firebase
export function initFirebase() {
    // Set up auth state listener
    auth.onAuthStateChanged((user) => {
        const authButtons = document.getElementById('auth-buttons');
        if (user) {
            // User is signed in
            authButtons.classList.remove('hidden');
            document.getElementById('login-btn').classList.add('hidden');
            document.getElementById('logout-btn').classList.remove('hidden');
        } else {
            // User is signed out
            authButtons.classList.remove('hidden');
            document.getElementById('login-btn').classList.remove('hidden');
            document.getElementById('logout-btn').classList.add('hidden');
        }
    });
}

// Generate a random 6-digit PIN
function generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Compress game data for storage
function compressData(data) {
    const jsonString = JSON.stringify(data);
    return btoa(jsonString); // Simple base64 encoding (in a real game, use better compression)
}

// Decompress game data
function decompressData(compressed) {
    try {
        return JSON.parse(atob(compressed));
    } catch (e) {
        console.error("Failed to decompress data:", e);
        return null;
    }
}

// Create a new world
export async function createNewWorld(worldName) {
    const pin = generatePin();
    const worldData = {
        seed: Math.floor(Math.random() * 1000000),
        createdAt: new Date().toISOString(),
        worldName: worldName
    };
    
    const compressedData = compressData({
        world: worldData,
        player: {
            position: { x: 0, y: 70, z: 0 },
            health: 100,
            xp: 0,
            level: 1,
            inventory: []
        }
    });
    
    await set(ref(database, `users/PIN-${pin}`), {
        worldName: worldName,
        saveData: compressedData,
        lastModified: new Date().toISOString()
    });
    
    return pin;
}

// Load an existing world
export async function loadWorld(pin) {
    const snapshot = await get(child(ref(database), `users/PIN-${pin}`));
    if (!snapshot.exists()) {
        throw new Error("World not found");
    }
    
    const data = snapshot.val();
    const decompressed = decompressData(data.saveData);
    
    if (!decompressed) {
        throw new Error("Failed to load world data");
    }
    
    return decompressed;
}

// Save world data
export async function saveWorld(pin, world, player) {
    const compressedData = compressData({
        world: world.getSaveData(),
        player: player.getSaveData()
    });
    
    await set(ref(database, `users/PIN-${pin}`), {
        worldName: "Existing World", // You might want to keep track of this
        saveData: compressedData,
        lastModified: new Date().toISOString()
    });
}

// Auth functions
export async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Google login error:", error);
    }
}

export async function loginWithFacebook() {
    const provider = new FacebookAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Facebook login error:", error);
    }
}

export async function loginWithGithub() {
    const provider = new GithubAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("GitHub login error:", error);
    }
}

export async function loginWithEmail(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Email login error:", error);
    }
}

export async function logout() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Logout error:", error);
    }
}
