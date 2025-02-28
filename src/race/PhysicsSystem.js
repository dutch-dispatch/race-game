import * as THREE from 'three';
import CollisionSystem from './CollisionSystem.js';
import { EntityType } from './CollisionSystem.js';
import { GameEvents } from './EventBus.js';

export default class PhysicsSystem {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.collisionSystem = new CollisionSystem(eventBus);
    this.playerCar = null;
    this.speed = 0.05;
    this.maxSpeed = 0.42; // Supports up to 210 km/h
    this.minSpeed = 0;
    this.lateralSpeed = 0.15; // Increased from default value
    this.maxLateralPosition = 8; // Default, will be updated later
    this.distanceTraveled = 0;
    this.explosionInProgress = false;
    this.explosionStartTime = 0;
    this.explosionDuration = 700; // 1.5 seconds for explosion animation
    this.yellowBrickParticles = [];
    this.frameTime = 1/60; // Default frame time
    this.controlState = {
      leftPressed: false,
      rightPressed: false,
      upPressed: false,
      downPressed: false
    };
  }
  
  init() {
    // Setup collision handlers
    this.setupCollisionHandlers();
       
    this.eventBus.subscribe('game:restart', this.resetState.bind(this));
    this.eventBus.subscribe('game:frame', data => this.update(data.deltaTime));
    
    // Listen for control states
    this.eventBus.subscribe('control:state:updated', this.handleControlState.bind(this));
    
    // Listen for player car creation event
    this.eventBus.subscribe('vehicles:playerCar:created', car => {
      this.setPlayerCar(car);
    });
    
    // Listen for collision system requests and respond with the collision system
    // Fix: Use the callback function provided in the request event data
    this.eventBus.subscribe('collision:system:request', (data) => {
      if (data && typeof data.callback === 'function') {
        // Call the callback with the collision system
        data.callback(this.collisionSystem);
      } else {
        // Fallback to the old method for backward compatibility
        this.eventBus.emit('collision:system:response', this.getCollisionSystem());
      }
    });
  }
  
  setPlayerCar(car) {
    this.playerCar = car;
    // Register player car with collision system
    this.collisionSystem.registerEntity(car, EntityType.PLAYER_CAR);
  }
  
  setMaxLateralPosition(maxPos) {
    this.maxLateralPosition = maxPos;
  }

  setupCollisionHandlers() {
    // Listen for all player car collisions through the collision system
    this.collisionSystem.addEventListener('collision', this.handlePlayerCollision.bind(this), {
      sourceType: EntityType.PLAYER_CAR
    });
    

    // Listen for specific collision events
    this.eventBus.subscribe(GameEvents.COLLISION_BRICK_DESTROYED, this.handleBrickDestroyed.bind(this));
    this.eventBus.subscribe(GameEvents.COLLISION_BRICK_HIT, this.handleBrickCollision.bind(this));
  }
  
  handlePlayerCollision(collision) {
    if (!this.playerCar) return;
    
    let otherEntity, otherEntityType;
    
    // Determine which entity is the player car and which is the other entity
    if (collision.source === this.playerCar) {
      otherEntity = collision.target;
      otherEntityType = otherEntity.userData.entityType;
    } else if (collision.target === this.playerCar) {
      otherEntity = collision.source;
      otherEntityType = otherEntity.userData.entityType;
    } else {
      return; // Neither entity is the player car
    }

    // Create collision event data
    const collisionEvent = {
      detail: {
        playerCar: this.playerCar,
        otherEntity: otherEntity,
        collisionType: collision.collisionType,
        position: collision.position.clone(),
        speed: Math.round(this.speed * 500)
      }
    };
    
    // Emit appropriate event based on entity type
    if (otherEntityType === EntityType.CITIZEN_CAR) {
      this.handleCitizenCarCollision(collisionEvent);
    }
  }
  
  handleBrickDestroyed(event) {
    // Create particle effects at the brick position
    this.createExplosionParticles(event.position);
  }
  
  handleBrickCollision(event) {
    if (event.collidedWith === this.playerCar) {
      const speedKmh = Math.round(this.speed * 500);
      
      if (speedKmh >= 100) {
        this.startExplosionSequence();
      } else {
        this.speed = 0;
        this.playerCar.children[0].material.color.set(0xff9900);
        setTimeout(() => {
          this.playerCar.children[0].material.color.set(0xff0000);
        }, 1000);
      }
    }
  }
  
  handleCitizenCarCollision(event) {
    if (!event.detail) return;
    
    const {collisionType} = event.detail;    
    // Handle collision based on the data provided by the event
    if (collisionType === 'side') {
      // Slight slowdown for player on side collision
      this.speed *= 0.8;
      
      // Visual feedback
      this.playerCar.children[0].material.color.set(0xff9900);
      setTimeout(() => {
        this.playerCar.children[0].material.color.set(0xff0000);
      }, 500);
    } else {
      
      // Front/back collision
      const speedKmh = Math.round(this.speed * 500);
      if (speedKmh >= 100) {
        this.startExplosionSequence();
      } else {
        this.speed = 0;
        this.playerCar.children[0].material.color.set(0xff9900);
        setTimeout(() => {
          this.playerCar.children[0].material.color.set(0xff0000);
        }, 1000);
      }
    }
  }
  
  createExplosionParticles(position, color = 0xffff00) {
    const particleCount = 30;
    const scene = this.playerCar ? this.playerCar.parent : null;
    if (!scene) return;
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 1.0
      });
      
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 1.0,
        Math.random() * 1.0,
        (Math.random() - 0.5) * 1.0
      );
      
      particle.userData.lifetime = 2.0;
      
      scene.add(particle);
      this.yellowBrickParticles.push(particle);
    }
  }
  
  startExplosionSequence() {
    if (this.explosionInProgress || !this.playerCar) return;
    
    this.explosionInProgress = true;
    this.explosionStartTime = Date.now();
    
    const scene = this.playerCar.parent;
    
    // Create initial explosion at car's position
    this.createExplosionParticles(this.playerCar.position, 0xff0000);
    
    // Create a ring of explosions around the car
    const explosionCount = 8;
    for (let i = 0; i < explosionCount; i++) {
      const angle = (i / explosionCount) * Math.PI * 2;
      const radius = 2;
      const offset = new THREE.Vector3(
        Math.cos(angle) * radius,
        0.5,
        Math.sin(angle) * radius
      );
      const explosionPos = this.playerCar.position.clone().add(offset);
      this.createExplosionParticles(explosionPos, 0xff0000);
    }

    // Make the car flash red before disappearing
    const carBody = this.playerCar.children[0];
    const carRoof = this.playerCar.children[1];
    
    carBody.material.emissive.set(0xff0000);
    carBody.material.emissiveIntensity = 1;
    carRoof.material.forEach(mat => {
      if (mat) {
        mat.emissive.set(0xff0000);
        mat.emissiveIntensity = 1;
      }
    });

    // Remove car after a short delay
    setTimeout(() => {
      if (this.playerCar && scene) {
        scene.remove(this.playerCar);
      }
    }, 500);
  }
  
  resetState() {
    this.speed = 0.05;
    this.distanceTraveled = 0;
    this.explosionInProgress = false;
    
    // Clear particles
    const scene = this.playerCar ? this.playerCar.parent : null;
    if (scene) {
      for (const particle of this.yellowBrickParticles) {
        scene.remove(particle);
      }
    }
    this.yellowBrickParticles = [];
    
    // Reset car appearance if it exists
    if (this.playerCar) {
      const carBody = this.playerCar.children[0];
      const carRoof = this.playerCar.children[1];
      carBody.material.emissive.set(0x000000);
      carBody.material.emissiveIntensity = 0;
      carBody.material.color.set(0xff0000);
      carRoof.material.forEach(mat => {
        if (mat) {
          mat.emissive.set(0x000000);
          mat.emissiveIntensity = 0;
        }
      });
    }
  }
  
  handleControlState(controls) {
    this.controlState = { ...controls };  // Update the control state
  }

  updatePlayerCar(deltaTime) {
    if (!this.playerCar || this.explosionInProgress) return;
    
    const cappedDeltaTime = Math.min(deltaTime, 0.1);
    
    if (this.controlState.leftPressed) {
      this.moveLeft(cappedDeltaTime);
    }
    if (this.controlState.rightPressed) {
      this.moveRight(cappedDeltaTime);
    }
    if (this.controlState.upPressed) {
      this.accelerate();
    }
    if (this.controlState.downPressed) {
      this.decelerate();
    }
  }
  
  accelerate() {
    if (this.explosionInProgress) return;
    this.speed += 0.005;
    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }
  }
  
  decelerate() {
    if (this.explosionInProgress) return;
    this.speed -= 0.005;
    if (this.speed < this.minSpeed) {
      this.speed = this.minSpeed;
    }
  }
  
  moveLeft(deltaTime = 1/60) {
    if (!this.playerCar || this.explosionInProgress) return;
    // Always use provided deltaTime to ensure smooth movement
    const movement = this.lateralSpeed * deltaTime * 60;
    this.playerCar.position.x -= movement;
    if (this.playerCar.position.x < -this.maxLateralPosition) {
      this.playerCar.position.x = -this.maxLateralPosition;
    }
  }
  
  moveRight(deltaTime = 1/60) {
    if (!this.playerCar || this.explosionInProgress) return;
    // Always use provided deltaTime to ensure smooth movement
    const movement = this.lateralSpeed * deltaTime * 60;
    this.playerCar.position.x += movement;
    if (this.playerCar.position.x > this.maxLateralPosition) {
      this.playerCar.position.x = this.maxLateralPosition;
    }
  }
  
  updateParticles(deltaTime) {
    const scene = this.playerCar ? this.playerCar.parent : null;
    if (!scene) return;
    
    for (let i = this.yellowBrickParticles.length - 1; i >= 0; i--) {
      const particle = this.yellowBrickParticles[i];
      
      // Update particle position
      particle.position.add(particle.userData.velocity);
      particle.userData.velocity.y -= 0.02; // Gravity effect
      
      // Update lifetime
      particle.userData.lifetime -= deltaTime;
      
      // Fade out
      particle.material.opacity = particle.userData.lifetime;
      particle.material.transparent = true;
      
      // Remove dead particles
      if (particle.userData.lifetime <= 0) {
        scene.remove(particle);
        this.yellowBrickParticles.splice(i, 1);
      }
    }
  }
  
  checkExplosionProgress() {
    if (this.explosionInProgress) {
      const currentTime = Date.now();
      
      // Create additional explosion particles during the animation
      if (Math.random() < 0.3 && this.playerCar) { // 30% chance each frame
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 2,
          (Math.random() - 0.5) * 4
        );
        const explosionPos = this.playerCar.position.clone().add(offset);
        this.createExplosionParticles(explosionPos, 0xff0000);
      }
      
      // Check if explosion animation is complete
      if (currentTime - this.explosionStartTime > this.explosionDuration) {
        this.explosionInProgress = false; // Reset explosion state
        this.eventBus.emit(GameEvents.GAME_OVER);
        return true;
      }
    }
    return false;
  }
  
  update(deltaTime) {
    // Store the current frame time for consistent movement
    this.frameTime = deltaTime;
    
    // Check if explosion animation is complete
    if (this.checkExplosionProgress()) {
      return;
    }

    // Update distance traveled based on car speed and delta time
    if (!this.explosionInProgress) {
      // Cap deltaTime to prevent huge jumps in distance if the tab was inactive
      const cappedDeltaTime = Math.min(deltaTime, 0.1);
      this.distanceTraveled += this.speed * 500 * cappedDeltaTime; // Convert to meters/second
      
      // Add a sanity check to prevent unrealistic values
      if (this.distanceTraveled > 10000000) {
        this.distanceTraveled = 0;
      }
      
      // Update player car position based on control state
      this.updatePlayerCar(cappedDeltaTime);
    }
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Check for collisions
    this.collisionSystem.checkCollisions();
    
    // Emit physics updated event with all relevant data
    this.eventBus.emit(GameEvents.PHYSICS_UPDATED, {
      carSpeed: this.speed,
      maxSpeed: this.maxSpeed,
      distanceTraveled: this.distanceTraveled,
      deltaTime: deltaTime,
      targetCar: this.playerCar,
      explosionInProgress: this.explosionInProgress,
      cameraShakeIntensity: this.calculateCameraShakeIntensity()  // Add camera shake based on speed
    });
  }
  
  // Add method to calculate camera shake intensity based on speed
  calculateCameraShakeIntensity() {
    // Reduce or disable camera shake at lower speeds
    const speedKmh = this.speed * 500;
    if (speedKmh < 80) {
      return 0; // No camera shake at low speeds
    } else {
      // Gradually increase camera shake with speed
      return Math.min(1.0, (speedKmh - 80) / 130);
    }
  }
  
  getCollisionSystem() {
    return this.collisionSystem;
  }
}
