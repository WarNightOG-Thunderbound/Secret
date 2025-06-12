import * as THREE from 'three';

export class Player {
    constructor(camera, scene, world, saveData = null) {
        this.camera = camera;
        this.scene = scene;
        this.world = world;
        
        // Physics
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveSpeed = 5;
        this.jumpForce = 8;
        this.gravity = 20;
        this.isGrounded = false;
        
        // Player state
        this.position = saveData?.position || new THREE.Vector3(0, 70, 0);
        this.health = saveData?.health || 100;
        this.maxHealth = 100;
        this.xp = saveData?.xp || 0;
        this.level = saveData?.level || 1;
        this.inventory = saveData?.inventory || [];
        this.unlockedElements = saveData?.unlockedElements || [];
        this.truePotentialActive = false;
        
        // Controls
        this.keys = {};
        this.setupControls();
        
        // Initialize camera and player
        this.initPlayer();
    }
    
    initPlayer() {
        // Create player collider (invisible)
        this.collider = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 1.8, 0.8),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        this.collider.position.copy(this.position);
        this.scene.add(this.collider);
        
        // Position camera
        this.camera.position.copy(this.position);
        this.camera.position.y += 1.6; // Eye level
        this.camera.rotation.set(0, 0, 0);
        
        // Add event listeners
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('click', (e) => this.onMouseClick(e));
    }
    
    setupControls() {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            sprint: false
        };
    }
    
    onKeyDown(e) {
        switch(e.code) {
            case 'KeyW': this.keys.forward = true; break;
            case 'KeyA': this.keys.left = true; break;
            case 'KeyS': this.keys.backward = true; break;
            case 'KeyD': this.keys.right = true; break;
            case 'Space': this.keys.jump = true; break;
            case 'ShiftLeft': this.keys.sprint = true; break;
            case 'KeyE': this.toggleInventory(); break;
            case 'KeyF': this.useElementalPower(); break;
        }
    }
    
    onKeyUp(e) {
        switch(e.code) {
            case 'KeyW': this.keys.forward = false; break;
            case 'KeyA': this.keys.left = false; break;
            case 'KeyS': this.keys.backward = false; break;
            case 'KeyD': this.keys.right = false; break;
            case 'Space': this.keys.jump = false; break;
            case 'ShiftLeft': this.keys.sprint = false; break;
        }
    }
    
    onMouseMove(e) {
        // Only rotate camera when pointer is locked
        if (document.pointerLockElement === document.getElementById('game-canvas')) {
            const movementX = e.movementX || 0;
            const movementY = e.movementY || 0;
            
            // Horizontal rotation
            this.camera.rotation.y -= movementX * 0.002;
            
            // Vertical rotation (with limits)
            this.camera.rotation.x -= movementY * 0.002;
            this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation.x));
        }
    }
    
    onMouseClick(e) {
        // Request pointer lock when clicking the game
        if (e.target === document.getElementById('game-canvas') {
            document.getElementById('game-canvas').requestPointerLock();
        }
        
        // Handle block breaking/placing
        if (document.pointerLockElement) {
            this.handleBlockInteraction();
        }
    }
    
    handleBlockInteraction() {
        // Implement raycasting to detect blocks the player is looking at
        // Then break or place blocks based on what they're holding
    }
    
    toggleInventory() {
        // Show/hide inventory UI
    }
    
    useElementalPower() {
        // Activate the currently selected elemental power
        if (this.unlockedElements.length === 0) return;
        
        // Implement elemental power effects
    }
    
    activateTruePotential() {
        if (this.truePotentialActive) return;
        
        // Only activate when health is critically low
        if (this.health <= 15) {
            this.truePotentialActive = true;
            
            // Temporary invulnerability
            // Enhanced abilities
            // Visual effects
            
            setTimeout(() => {
                this.truePotentialActive = false;
            }, 10000); // Lasts 10 seconds
        }
    }
    
    takeDamage(amount) {
        if (this.truePotentialActive) return;
        
        this.health -= amount;
        this.updateHUD();
        
        if (this.health <= 0) {
            this.die();
        } else if (this.health <= 15) {
            this.activateTruePotential();
        }
    }
    
    die() {
        // Handle player death
        // Maybe respawn or show game over screen
    }
    
    addXP(amount) {
        this.xp += amount;
        const xpNeeded = this.level * 100;
        
        if (this.xp >= xpNeeded) {
            this.levelUp();
        }
        
        this.updateHUD();
    }
    
    levelUp() {
        this.level++;
        this.xp = 0;
        this.maxHealth += 10;
        this.health = this.maxHealth;
        
        // Unlock new elements at certain levels
        const elements = ['earth', 'fire', 'water', 'wind', 'lightning'];
        if (this.level <= elements.length) {
            this.unlockedElements.push(elements[this.level - 1]);
        }
        
        this.updateHUD();
    }
    
    updateHUD() {
        // Update health bar, XP bar, element display, etc.
        document.getElementById('health-bar').style.width = `${(this.health / this.maxHealth) * 100}%`;
        document.getElementById('xp-bar').style.width = `${(this.xp / (this.level * 100)) * 100}%`;
        
        const elementDisplay = document.getElementById('element-display');
        elementDisplay.innerHTML = this.unlockedElements.map(el => 
            `<div class="element ${el}"></div>`
        ).join('');
    }
    
    update(delta) {
        // Handle movement
        this.handleMovement(delta);
        
        // Apply gravity
        this.applyGravity(delta);
        
        // Update collider position
        this.collider.position.copy(this.position);
        
        // Update camera position and rotation
        this.camera.position.copy(this.position);
        this.camera.position.y += 1.6; // Eye level
        
        // Handle collisions with world
        this.handleCollisions();
    }
    
    handleMovement(delta) {
        const speed = this.keys.sprint ? this.moveSpeed * 1.5 : this.moveSpeed;
        const actualSpeed = speed * delta;
        
        this.direction.z = Number(this.keys.forward) - Number(this.keys.backward);
        this.direction.x = Number(this.keys.right) - Number(this.keys.left);
        this.direction.normalize();
        
        // Move in the direction the camera is facing
        if (this.direction.z !== 0 || this.direction.x !== 0) {
            const angle = Math.atan2(this.direction.x, this.direction.z) + this.camera.rotation.y;
            this.velocity.x = Math.sin(angle) * actualSpeed;
            this.velocity.z = Math.cos(angle) * actualSpeed;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
        
        // Jumping
        if (this.keys.jump && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
        
        // Apply movement
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;
    }
    
    applyGravity(delta) {
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * delta;
        }
    }
    
    handleCollisions() {
        // Implement block collision detection
        // This would check if the player is colliding with any blocks in the world
        // and adjust position/velocity accordingly
        
        // Simple ground check (in a real game, you'd need proper collision detection)
        const blockBelow = this.world.getBlockAt(
            Math.floor(this.position.x),
            Math.floor(this.position.y - 1),
            Math.floor(this.position.z)
        );
        
        this.isGrounded = blockBelow && blockBelow.type !== 'air';
        
        if (this.isGrounded && this.velocity.y < 0) {
            this.velocity.y = 0;
            this.position.y = Math.ceil(this.position.y);
        }
    }
    
    getSaveData() {
        return {
            position: this.position,
            health: this.health,
            maxHealth: this.maxHealth,
            xp: this.xp,
            level: this.level,
            inventory: this.inventory,
            unlockedElements: this.unlockedElements
        };
    }
}
