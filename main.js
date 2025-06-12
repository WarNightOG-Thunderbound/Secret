import { World } from './world.js';
import { Player } from './player.js';
import { initFirebase, createNewWorld, loadWorld } from './firebase.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
        this.clock = new THREE.Clock();
        
        this.world = null;
        this.player = null;
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupEventListeners();
        this.showMenu();
        
        // Initialize Firebase
        initFirebase();
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);
        this.renderer.shadowMap.enabled = true;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        document.getElementById('new-world-btn').addEventListener('click', () => this.createNewWorld());
        document.getElementById('load-world-btn').addEventListener('click', () => this.showLoadWorldDialog());
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    showMenu() {
        document.getElementById('menu-screen').classList.remove('hidden');
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
    }
    
    hideMenu() {
        document.getElementById('menu-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        document.getElementById('hud').classList.remove('hidden');
    }
    
    async createNewWorld() {
        const worldName = prompt("Enter a name for your new world:");
        if (!worldName) return;
        
        try {
            const pin = await createNewWorld(worldName);
            alert(`Your world PIN is: ${pin}\nWrite this down to load your world later!`);
            this.startGame(pin);
        } catch (error) {
            console.error("Error creating world:", error);
            alert("Failed to create world. Please try again.");
        }
    }
    
    showLoadWorldDialog() {
        const pin = prompt("Enter your 6-digit world PIN:");
        if (!pin || pin.length !== 6) {
            alert("Invalid PIN. Please enter a 6-digit number.");
            return;
        }
        
        this.startGame(pin);
    }
    
    async startGame(pin) {
        document.getElementById('loading-screen').classList.remove('hidden');
        
        try {
            const saveData = await loadWorld(pin);
            
            // Initialize world with loaded data
            this.world = new World(this.scene, saveData);
            
            // Initialize player
            this.player = new Player(this.camera, this.scene, this.world, saveData?.player);
            
            // Position camera
            this.camera.position.set(0, 20, 0);
            
            this.hideMenu();
            document.getElementById('loading-screen').classList.add('hidden');
            
            // Start game loop
            this.gameLoop();
        } catch (error) {
            console.error("Error loading world:", error);
            alert("Failed to load world. Invalid PIN or corrupted data.");
            document.getElementById('loading-screen').classList.add('hidden');
        }
    }
    
    gameLoop() {
        const delta = this.clock.getDelta();
        
        // Update game systems
        if (this.player) this.player.update(delta);
        if (this.world) this.world.update(this.player.position);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when everything is loaded
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
