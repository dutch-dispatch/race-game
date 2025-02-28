import * as THREE from 'three';
import BaseSceneManager from './BaseSceneManager.js';
import CarBuilder from '../builders/CarBuilder.js';
import { EntityType, CollisionType } from '../CollisionSystem.js';
import { GameEvents } from '../EventBus.js';

class CitizenCarManager extends BaseSceneManager {
  constructor(eventBus, config) {
    super(eventBus);
    
    // Store config
    this.config = config;
    
    // Initialize collections
    this.citizenCars = [];
    this.maxLateralPosition = this.config.maxLateralPosition;
    
    // Citizen car properties - using config values
    this.citizenCarGenerationInterval = 3000; // milliseconds
    this.lastCitizenCarTime = 0;
    this.carBuilder = new CarBuilder();
    
    // Collision response strategy object
    this.collisionResponses = {
      [EntityType.PLAYER_CAR]: this.handlePlayerCarCollision.bind(this),
      [EntityType.CITIZEN_CAR]: this.handleCitizenCarCollision.bind(this),
      [EntityType.YELLOW_BRICK]: this.handleBrickCollision.bind(this),
      [EntityType.BLUE_BRICK]: this.handleBrickCollision.bind(this)
    };
   
    this.eventBus.subscribe(GameEvents.PHYSICS_UPDATED, this.onPhysicsUpdated.bind(this));
    this.eventBus.subscribe(GameEvents.GAME_STATE_RESET, this.reset.bind(this));
    
    // Will be set when collision system is registered
    this.collisionSystem = null;
  }
  
  
  onPhysicsUpdated(data) {
    if (data && data.deltaTime !== undefined && data.carSpeed !== undefined) {
      this.animate(data.deltaTime, data.carSpeed);
    }
  }
  
  init() {
    // Request collision system
    this.eventBus.emit(GameEvents.COLLISION_SYSTEM_REQUEST, { callback: this.setCollisionSystem.bind(this) });
  }
  
  setCollisionSystem(collisionSystem) {
    this.collisionSystem = collisionSystem;
    
    // Set up collision listeners now that we have the system
    if (this.collisionSystem) {
      this.setupCollisionListeners();
    }
  }
  
  /**
   * Set up collision event listeners
   */
  setupCollisionListeners() {
    // Listen for collisions where a citizen car is the source or target
    this.collisionSystem.addEventListener('collision', this.handleCollision.bind(this), {
      sourceType: EntityType.CITIZEN_CAR
    });
    
    this.collisionSystem.addEventListener('collision', this.handleCollision.bind(this), {
      targetType: EntityType.CITIZEN_CAR
    });
  }
  
  /**
   * Generic collision handler that routes to specific handlers based on entity type
   * @param {Object} collision - Collision data from collision system
   */
  handleCollision(collision) {
    let citizenCar, otherEntity, otherEntityType;
    
    // Determine which entity in the collision is the citizen car
    if (collision.source.userData.entityType === EntityType.CITIZEN_CAR) {
      citizenCar = collision.source;
      otherEntity = collision.target;
    } else if (collision.target.userData.entityType === EntityType.CITIZEN_CAR) {
      citizenCar = collision.target;
      otherEntity = collision.source;
    } else {
      return; // Neither entity is a citizen car
    }
    
    otherEntityType = otherEntity.userData.entityType;
    
    // Route to specific handler based on other entity type
    const handler = this.collisionResponses[otherEntityType];
    if (handler) {
      handler(citizenCar, collision.collisionType, otherEntity);
    }
  }
  
  /**
   * Handle collision between a citizen car and player car
   * @param {Object} citizenCar - The citizen car involved
   * @param {string} collisionType - Type of collision (front, back, side)
   * @param {Object} playerCar - The player's car
   */
  handlePlayerCarCollision(citizenCar, collisionType, playerCar) {
    // Create collision event data
    const collisionEvent = {
      type: 'citizenCarCollision',
      citizenCar: citizenCar,
      playerCar: playerCar,
      collisionType: collisionType,
      position: citizenCar.position.clone(),
      speed: citizenCar.userData.speed
    };
    
    if (collisionType === CollisionType.SIDE) {
      // Side collision - get pushed by player
      const pushDirection = playerCar.position.x > citizenCar.position.x ? -1 : 1;
      this.pushCitizenCar(citizenCar, pushDirection);
    } else {
      // Front/back collision - stop the car
      citizenCar.userData.speed = 0;
      citizenCar.userData.collisionStopped = true;
      
      // Visual indication of collision
      const carBody = citizenCar.children[0];
      carBody.material.color.set(0xff9900);  // Orange
    }
    
    // Emit event through the event bus instead of direct DOM event
    this.eventBus.emit(GameEvents.COLLISION_CITIZENCAR, collisionEvent);
  }
  
  /**
   * Handle collision between two citizen cars
   * @param {Object} citizenCar - The first citizen car
   * @param {string} collisionType - Type of collision
   * @param {Object} otherCar - The second citizen car
   */
  handleCitizenCarCollision(citizenCar, collisionType, otherCar) {
    // For now, both cars stop
    citizenCar.userData.speed = 0;
    citizenCar.userData.collisionStopped = true;
    
    // Visual indication of collision
    const carBody = citizenCar.children[0];
    carBody.material.color.set(0xff9900);  // Orange
  }
  
  /**
   * Handle collision between a citizen car and a brick
   * @param {Object} citizenCar - The citizen car
   * @param {string} collisionType - Type of collision
   * @param {Object} brick - The brick object
   */
  handleBrickCollision(citizenCar, collisionType, brick) {
    // Check brick type and respond appropriately
    if (brick.userData.entityType === EntityType.BLUE_BRICK) {
      // Stop the car only for blue bricks
      citizenCar.userData.speed = 0;
      citizenCar.userData.collisionStopped = true;
      
      // Create explosion particles
      this.createExplosionParticles(citizenCar.position.clone());
      
      // Remove the car after a short delay for visual effect
      setTimeout(() => {
        this.removeCitizenCar(citizenCar);
      }, 500);
      
      // Visual indication of collision before explosion
      const carBody = citizenCar.children[0];
      if (carBody) {
        carBody.material.emissive = new THREE.Color(0xff0000);
        carBody.material.emissiveIntensity = 1;
      }
    } else if (brick.userData.entityType === EntityType.YELLOW_BRICK) {
      // For yellow bricks, don't stop the car
      // Just provide visual feedback
      const carBody = citizenCar.children[0];
      if (carBody) {
        // Flash yellow briefly
        const originalColor = carBody.material.color.clone();
        carBody.material.color.set(0xffff00);
        
        // Reset color after a short delay
        setTimeout(() => {
          carBody.material.color.copy(originalColor);
        }, 300);
      }
    }
    
    // Create event for more specific handling if needed
    const collisionEvent = {
      type: 'citizenCarBrickCollision',
      citizenCar: citizenCar,
      brick: brick,
      brickType: brick.userData.entityType,
      collisionType: collisionType,
      position: brick.position.clone()
    };
    
    // Emit event through event bus instead of direct DOM event
    this.eventBus.emit(GameEvents.COLLISION_CITIZENCAR_BRICK, collisionEvent);
  }
  
  /**
   * Create explosion particles at the specified position
   * @param {THREE.Vector3} position - The position for the explosion
   */
  createExplosionParticles(position) {
    const particleCount = 20;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const material = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 1.0
      });
      
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      
      // Add random velocity
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        Math.random() * 0.8,
        (Math.random() - 0.5) * 0.8
      );
      
      particle.userData.lifetime = 1.5;
      
      // Use BaseSceneManager's addToScene method
      this.addToScene(particle);
      particles.push(particle);
    }
    
    // Update particles animation
    const updateParticles = () => {
      if (particles.length === 0) return;
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Update particle position
        particle.position.add(particle.userData.velocity);
        particle.userData.velocity.y -= 0.02; // Gravity effect
        
        // Update lifetime and opacity
        particle.userData.lifetime -= 0.05;
        particle.material.opacity = particle.userData.lifetime / 1.5;
        particle.material.transparent = true;
        
        // Remove dead particles
        if (particle.userData.lifetime <= 0) {
          this.removeFromScene(particle);
          particles.splice(i, 1);
        }
      }
      
      // Continue animation if particles remain
      if (particles.length > 0) {
        requestAnimationFrame(updateParticles);
      }
    };
    
    // Start particle animation
    requestAnimationFrame(updateParticles);
  }
  
  /**
   * Create a new citizen car
   * @returns {Object} The created citizen car
   */
  createCitizenCar() {
    
    // Use config probability for direction
    const isForward = Math.random() > this.config.citizenCarBackwardProbability;
    
    // Position based on direction and road width from config
    let randomX;
    if (isForward) {
      randomX = this.maxLateralPosition / 2 + Math.random() * (this.maxLateralPosition / 2);
    } else {
      randomX = -this.maxLateralPosition / 2 - Math.random() * (this.maxLateralPosition / 2 - 0.5);
    }
    
    const citizenCar = new THREE.Group();
    
    const colors = [0xff00ff, 0x00ffff, 0xffff00, 0x00ff00, 0xff8800];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Use config probability for truck
    const isTruck = Math.random() < this.config.citizenCarTruckProbability;
    
    if (isTruck) {
      this.carBuilder.createTruckModel(citizenCar, randomColor, isForward ? "forward" : "backward");
      citizenCar.userData.isTruck = true;
    } else {
      this.carBuilder.createCarModel(citizenCar, randomColor, false, isForward ? "forward" : "backward");
      citizenCar.userData.isTruck = false;
    }
    
    // Use config spawn distance
    const startingZ = isForward ? -this.config.citizenCarSpawnDistance : -this.config.citizenCarSpawnDistance * 1.5;
    citizenCar.position.set(randomX, 0, startingZ);
    
    let randomSpeed;
    if (isForward) {
      if (isTruck) {
        randomSpeed = (this.config.citizenCarMinSpeed + Math.random() * 35) / 500;
      } else {
        randomSpeed = (this.config.citizenCarMinSpeed + 5 + Math.random() * 45) / 500;
      }
    } else {
      if (isTruck) {
        randomSpeed = -(this.config.citizenCarMinSpeed + 20 + Math.random() * 45) / 500;
      } else {
        randomSpeed = -(this.config.citizenCarMinSpeed + 30 + Math.random() * 55) / 500;
      }
    }
    
    citizenCar.userData.speed = randomSpeed;
    citizenCar.userData.isForward = isForward;
    citizenCar.userData.type = 'vehicle';
    
    // Add to scene using BaseSceneManager method
    this.addToScene(citizenCar);
    this.citizenCars.push(citizenCar);
    
    // Store the entity type directly in userData
    citizenCar.userData.entityType = EntityType.CITIZEN_CAR;
    
    // Register with collision system
    if (this.collisionSystem) {
      this.collisionSystem.registerEntity(citizenCar, EntityType.CITIZEN_CAR);
    }
    
    return citizenCar;
  }
  
  /**
   * Handle citizen car pushed by player (side collision)
   * @param {Object} citizenCar - The citizen car to push
   * @param {number} pushDirection - Direction to push (-1 for left, 1 for right)
   */
  pushCitizenCar(citizenCar, pushDirection) {
    citizenCar.userData.pushVelocity = pushDirection * 0.3;
    citizenCar.userData.pushDecay = 0.95; // Decay rate for the push
  }
  
  /**
   * Remove a citizen car from the scene and manager
   * @param {Object} car - The car to remove
   */
  removeCitizenCar(car) {
    const index = this.citizenCars.indexOf(car);
    if (index > -1) {
      // Unregister from collision system
      if (this.collisionSystem) {
        this.collisionSystem.unregisterEntity(car, EntityType.CITIZEN_CAR);
      }
      
      // Remove from scene using BaseSceneManager method
      this.removeFromScene(car);
      this.citizenCars.splice(index, 1);
    }
  }
  
  /**
   * Update citizen car positions and behaviors
   * Called from animate method
   * @param {number} deltaTime - Time since last frame
   * @param {number} carSpeed - The player car's speed
   */
  animate(deltaTime, carSpeed) {
    const currentTime = Date.now();
    
    if (currentTime - this.lastCitizenCarTime > this.config.citizenCarGenerationInterval) {
      this.createCitizenCar();
      if (Math.random() < 0.3) {
        setTimeout(() => this.createCitizenCar(), 500);
      }
      this.lastCitizenCarTime = currentTime;
    }
    
    // Update citizen cars
    for (let i = this.citizenCars.length - 1; i >= 0; i--) {
      const citizenCar = this.citizenCars[i];
      
      // Handle collision-stopped cars differently
      if (citizenCar.userData.collisionStopped) {
        // Move collision-stopped cars exactly with the camera speed
        // This makes them appear stationary relative to the road
        citizenCar.position.z += carSpeed * 2;
      } else {
        // Normal movement for cars that haven't collided
        if (citizenCar.userData.isForward) {
          // Forward-moving cars (same direction as player)
          // Their relative speed is player speed minus their speed
          citizenCar.position.z += (carSpeed * 2) - (Math.abs(citizenCar.userData.speed) * 2);
        } else {
          // Backward-moving cars (opposite direction to player)
          // Their relative speed is player speed plus their speed
          citizenCar.position.z += (carSpeed * 2) + (Math.abs(citizenCar.userData.speed) * 2);
        }
      }
      
      // Apply push velocity if exists (for side collisions)
      if (citizenCar.userData.pushVelocity) {
        citizenCar.position.x += citizenCar.userData.pushVelocity;
        citizenCar.userData.pushVelocity *= citizenCar.userData.pushDecay;
        
        // Stop pushing when velocity becomes small
        if (Math.abs(citizenCar.userData.pushVelocity) < 0.01) {
          citizenCar.userData.pushVelocity = 0;
        }
        
        // Keep within road boundaries
        if (Math.abs(citizenCar.position.x) > this.maxLateralPosition) {
          citizenCar.position.x = Math.sign(citizenCar.position.x) * this.maxLateralPosition;
        }
      }
      
      // Remove citizen cars that pass the camera or fall too far behind
      if (citizenCar.position.z > 10 || citizenCar.position.z < -200) {
        this.removeCitizenCar(citizenCar);
      }
    }
    
    // Emit event that citizen cars have been updated
    this.eventBus.emit(GameEvents.CITIZENCARS_UPDATED);
  }
  
  /**
   * Clear all citizen cars - used for reset
   */
  reset() {
    console.log('CitizenCarManager: Received game:state:reset event');
    for (const car of this.citizenCars) {
      // Unregister from collision system
      if (this.collisionSystem) {
        this.collisionSystem.unregisterEntity(car, EntityType.CITIZEN_CAR);
      }
      
      // Remove from scene using BaseSceneManager method
      this.removeFromScene(car);
    }
    this.citizenCars = [];
  }
}

export default CitizenCarManager;
