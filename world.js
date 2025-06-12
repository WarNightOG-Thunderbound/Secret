import * as THREE from 'three';
import SimplexNoise from 'simplex-noise'; // You'll need to add this library

export class World {
    constructor(scene, saveData = null) {
        this.scene = scene;
        this.chunks = {};
        this.activeChunks = new Set();
        this.chunkSize = 16;
        this.chunkHeight = 300;
        this.renderDistance = 4; // Default to 4 chunks (64 blocks)
        
        this.noise = new SimplexNoise();
        this.seed = saveData?.seed || Math.floor(Math.random() * 1000000);
        
        // Load from save if available
        if (saveData) {
            this.loadFromSave(saveData);
        }
        
        // Add lighting
        this.addLighting();
    }
    
    addLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }
    
    generateChunk(x, z) {
        const chunkKey = `${x},${z}`;
        
        // Return existing chunk if already generated
        if (this.chunks[chunkKey]) {
            return this.chunks[chunkKey];
        }
        
        const chunkGroup = new THREE.Group();
        chunkGroup.position.set(x * this.chunkSize, 0, z * this.chunkSize);
        
        // Generate terrain
        for (let bx = 0; bx < this.chunkSize; bx++) {
            for (let bz = 0; bz < this.chunkSize; bz++) {
                const worldX = x * this.chunkSize + bx;
                const worldZ = z * this.chunkSize + bz;
                
                // Get surface height
                const height = this.getHeight(worldX, worldZ);
                
                // Generate layers
                for (let by = 0; by < this.chunkHeight; by++) {
                    const worldY = by;
                    
                    if (worldY > height) {
                        // Air block - skip
                        continue;
                    }
                    
                    let blockType;
                    if (worldY === Math.floor(height)) {
                        blockType = 'grass';
                    } else if (worldY > height - 4) {
                        blockType = 'dirt';
                    } else if (this.shouldPlaceOre(worldX, worldY, worldZ)) {
                        blockType = this.getOreType(worldY);
                    } else {
                        blockType = 'stone';
                    }
                    
                    this.addBlock(chunkGroup, worldX, worldY, worldZ, blockType);
                }
            }
        }
        
        this.scene.add(chunkGroup);
        this.chunks[chunkKey] = chunkGroup;
        return chunkGroup;
    }
    
    getHeight(x, z) {
        // Use simplex noise for natural terrain
        const scale = 0.05;
        const heightScale = 30;
        const baseHeight = 64;
        
        let noiseValue = this.noise.noise2D(x * scale, z * scale);
        noiseValue = (noiseValue + 1) / 2; // Convert from [-1,1] to [0,1]
        
        // Add additional noise layers for detail
        const detailNoise = this.noise.noise2D(x * scale * 4, z * scale * 4) * 0.1;
        
        return baseHeight + Math.floor(noiseValue * heightScale + detailNoise * 10);
    }
    
    shouldPlaceOre(x, y, z) {
        // Determine if we should place an ore here based on noise
        if (y > 50) return false; // No ores near surface
        
        const oreNoise = this.noise.noise3D(x * 0.1, y * 0.1, z * 0.1);
        const threshold = this.getOreThreshold(y);
        
        return oreNoise > threshold;
    }
    
    getOreThreshold(y) {
        // Ores become more common as you go deeper
        const depthRatio = 1 - (y / this.chunkHeight);
        return 0.8 - (depthRatio * 0.5);
    }
    
    getOreType(y) {
        // Deeper ores are more valuable
        const depth = this.chunkHeight - y;
        
        if (depth > 250 && Math.random() < 0.01) return 'diamond';
        if (depth > 200 && Math.random() < 0.03) return 'gold';
        if (depth > 150 && Math.random() < 0.05) return 'iron';
        if (depth > 100 && Math.random() < 0.1) return 'coal';
        if (depth > 50 && Math.random() < 0.2) return 'copper';
        
        return 'stone';
    }
    
    addBlock(chunkGroup, x, y, z, type) {
        // In a real implementation, you'd use instanced meshes for performance
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        let material;
        switch(type) {
            case 'grass':
                material = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
                break;
            case 'dirt':
                material = new THREE.MeshStandardMaterial({ color: 0x795548 });
                break;
            case 'stone':
                material = new THREE.MeshStandardMaterial({ color: 0x9E9E9E });
                break;
            case 'coal':
                material = new THREE.MeshStandardMaterial({ color: 0x212121 });
                break;
            case 'iron':
                material = new THREE.MeshStandardMaterial({ color: 0xA19D94 });
                break;
            case 'gold':
                material = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
                break;
            case 'diamond':
                material = new THREE.MeshStandardMaterial({ color: 0x4EE2EC });
                break;
            case 'copper':
                material = new THREE.MeshStandardMaterial({ color: 0xB87333 });
                break;
            default:
                material = new THREE.MeshStandardMaterial({ color: 0xFF0000 }); // Red for unknown
        }
        
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x, y, z);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData = { type, x, y, z };
        
        chunkGroup.add(block);
    }
    
    update(playerPosition) {
        // Determine which chunks should be active based on player position
        const playerChunkX = Math.floor(playerPosition.x / this.chunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / this.chunkSize);
        
        const newActiveChunks = new Set();
        
        // Load chunks within render distance
        for (let x = playerChunkX - this.renderDistance; x <= playerChunkX + this.renderDistance; x++) {
            for (let z = playerChunkZ - this.renderDistance; z <= playerChunkZ + this.renderDistance; z++) {
                const chunkKey = `${x},${z}`;
                newActiveChunks.add(chunkKey);
                
                if (!this.activeChunks.has(chunkKey)) {
                    this.generateChunk(x, z);
                }
            }
        }
        
        // Unload chunks outside render distance
        for (const chunkKey of this.activeChunks) {
            if (!newActiveChunks.has(chunkKey) {
                this.unloadChunk(chunkKey);
            }
        }
        
        this.activeChunks = newActiveChunks;
    }
    
    unloadChunk(chunkKey) {
        const chunk = this.chunks[chunkKey];
        if (chunk) {
            this.scene.remove(chunk);
            // Note: In a real game, you might want to keep the chunk data in memory
            // but just not render it, depending on your memory constraints
            delete this.chunks[chunkKey];
        }
    }
    
    loadFromSave(saveData) {
        // Implement loading from compressed save data
        // This would parse the save data and rebuild the world
    }
    
    getSaveData() {
        // Implement compression and saving of world data
        return {
            seed: this.seed,
            chunks: this.chunks,
            // Other world data...
        };
    }
}
