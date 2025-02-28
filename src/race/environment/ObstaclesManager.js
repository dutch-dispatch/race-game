import * as THREE from 'three';
import { EntityType, CollisionType } from '../CollisionSystem.js';
import BaseSceneManager from './BaseSceneManager.js';
import { GameEvents } from '../EventBus.js';

class ObstaclesManager extends BaseSceneManager {
  constructor(eventBus, config) {
    super(eventBus);
    
    // Store config
    this.config = config;
    
    // Initialize collections
    this.obstacles = [];
    this.maxLateralPosition = this.config.maxLateralPosition;
    
    // Initialize lastObstacleTime
    this.lastObstacleTime = 0;
    
    // Collision response strategy object
    this.collisionResponses = {
      [EntityType.PLAYER_CAR]: this.handlePlayerCollision.bind(this),
      [EntityType.CITIZEN_CAR]: this.handleCitizenCarCollision.bind(this)
    };
    
    // Subscribe to events
    this.eventBus.subscribe(GameEvents.PHYSICS_UPDATED, this.onPhysicsUpdated.bind(this));
    this.eventBus.subscribe('game:state:reset', this.reset.bind(this));
    
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
    this.eventBus.emit('collision:system:request', { callback: this.setCollisionSystem.bind(this) });
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
    // Listen for collisions with yellow bricks
    this.collisionSystem.addEventListener('collision', this.handleCollision.bind(this), {
      targetType: EntityType.YELLOW_BRICK
    });
    
    // Listen for collisions with blue bricks
    this.collisionSystem.addEventListener('collision', this.handleCollision.bind(this), {
      targetType: EntityType.BLUE_BRICK
    });
  }
  
  /**
   * Generic collision handler that routes to specific handlers based on entity type
   * @param {Object} collision - Collision data from collision system
   */
  handleCollision(collision) {
    const brick = collision.target; // The brick
    const sourceEntity = collision.source;
    const sourceType = sourceEntity.userData.entityType;
    
    // Route to specific handler based on source entity type
    const handler = this.collisionResponses[sourceType];
    if (handler) {
      handler(collision);
    }
  }
  
  /**
   * Handle player collision with bricks
   * @param {Object} collision - Collision data
   */
  handlePlayerCollision(collision) {
    const brick = collision.target;
    const brickType = brick.userData.entityType;
    
    if (brickType === EntityType.YELLOW_BRICK) {
      // Create event data for game to handle (for scoring and effects)
      const brickCollisionEvent = {
        brick: brick,
        position: brick.position.clone(),
        entityType: EntityType.YELLOW_BRICK,
        collidedWith: collision.source
      };
      
      // Emit event through the event bus
      this.eventBus.emit('collision:brick:destroyed', brickCollisionEvent);
      
      // Remove the brick
      this.removeObstacle(brick);
    } else if (brickType === EntityType.BLUE_BRICK) {
      // Create event data for game to handle (for damage effects)
      const brickCollisionEvent = {
        brick: brick,
        position: brick.position.clone(),
        entityType: EntityType.BLUE_BRICK,
        collidedWith: collision.source
      };
      
      // Emit event through the event bus
      this.eventBus.emit('collision:brick:hit', brickCollisionEvent);
    }
  }
  
  /**
   * Handle citizen car collision with bricks
   * @param {Object} collision - Collision data
   */
  handleCitizenCarCollision(collision) {
    const brick = collision.target;
    const citizenCar = collision.source;
    const brickType = brick.userData.entityType;
    
    if (brickType === EntityType.YELLOW_BRICK) {
      // Create event data for game to handle
      const brickCollisionEvent = {
        brick: brick,
        position: brick.position.clone(),
        entityType: EntityType.YELLOW_BRICK,
        collidedWith: citizenCar
      };
      
      // Emit event through the event bus
      this.eventBus.emit('collision:brick:destroyed', brickCollisionEvent);
      
      // Remove the brick
      this.removeObstacle(brick);
    } else if (brickType === EntityType.BLUE_BRICK) {
      // For blue bricks, create a different event
      const brickCollisionEvent = {
        brick: brick,
        position: brick.position.clone(),
        entityType: EntityType.BLUE_BRICK,
        collidedWith: citizenCar
      };
      
      this.eventBus.emit('collision:brick:hit', brickCollisionEvent);
    }
  }
  
  // Create a new obstacle
  createObstacle() {
    if (!this.maxLateralPosition) {
      console.warn('Cannot create obstacle: maxLateralPosition not set');
      return null;
    }
    
    let randomX;
    let randomZ;
    let obstacle;
    let overlapping = true;
    let attempts = 0;
    const maxAttempts = 10; // Limit attempts to avoid infinite loop
    
    // Randomly choose between blue and yellow obstacles
    const isYellowBrick = Math.random() > 0.7; // 30% chance for yellow bricks
    
    // Keep trying positions until we find a non-overlapping one or reach max attempts
    while (overlapping && attempts < maxAttempts) {
      randomX = Math.random() * (this.maxLateralPosition * 2) - this.maxLateralPosition;
      randomZ = -Math.random() * this.config.obstacleSpawnDistance - 50; // Spread obstacles along the road
      
      // Check if this position would overlap with existing obstacles
      // Add a larger buffer for overlap checking (2.5 instead of just the box size)
      if (!this.checkObstacleOverlap(randomX, randomZ, 2.5)) {
        overlapping = false;
      }
      
      attempts++;
    }
    
    if (overlapping) {
      console.warn('Could not find non-overlapping position for obstacle');
      return null;
    }
    
    const obstacleGeometry = new THREE.BoxGeometry(2, 1, 1.5);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ 
      color: isYellowBrick ? 0xffff00 : 0x0066ff,
      emissive: isYellowBrick ? 0xffff00 : 0x000000,
      emissiveIntensity: isYellowBrick ? 0.5 : 0
    });
    
    obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(randomX, 0.5, randomZ);
    
    const entityType = isYellowBrick ? EntityType.YELLOW_BRICK : EntityType.BLUE_BRICK;
    obstacle.userData.entityType = entityType;
    obstacle.userData.type = 'brick';

    // Add obstacle to scene using BaseSceneManager method
    this.addToScene(obstacle);
    this.obstacles.push(obstacle);
    
      
    if (this.collisionSystem) {
      this.collisionSystem.registerEntity(obstacle, entityType);
    }
    
    return obstacle;
  }
  
  // Check if a new obstacle would overlap with existing obstacles
  checkObstacleOverlap(x, z, bufferSize = 1) {
    // Create a temporary bounding box for the potential new obstacle with buffer
    const tempBox = new THREE.Box3();
    const min = new THREE.Vector3(x - bufferSize, 0, z - bufferSize);
    const max = new THREE.Vector3(x + bufferSize, 1, z + bufferSize);
    tempBox.set(min, max);
    
    // Check against all existing obstacles
    for (const obstacle of this.obstacles) {
      const existingBox = new THREE.Box3().setFromObject(obstacle);
      if (tempBox.intersectsBox(existingBox)) {
        return true; // Overlap detected
      }
    }
    
    return false; // No overlap
  }
  
  // Update and manage obstacles
  animate(deltaTime, carSpeed) {
    const currentTime = Date.now();
    
    // Generate obstacles only if below maxObstacles
    if (this.obstacles.length < this.config.maxObstacles && currentTime - this.lastObstacleTime > this.config.obstacleGenerationInterval) {
      this.createObstacle();
      this.lastObstacleTime = currentTime;
    }
    
    // Create additional obstacles if below minimum
    while (this.obstacles.length < this.config.minObstacles) {
      this.createObstacle();
    }
    
    // Update static obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      
      // Move obstacle towards the camera based on car speed
      obstacle.position.z += carSpeed * 2;
      
      if (obstacle.position.z > 10) {
        this.removeObstacle(obstacle);
      }
    }
    
    // Emit event that obstacles have been updated
    this.eventBus.emit('obstacles:updated');
  }
  
  // Remove an obstacle from the scene and manager
  removeObstacle(obstacle) {
    const index = this.obstacles.indexOf(obstacle);
    if (index > -1) {
      // Determine entity type from the obstacle properties
      const entityType = obstacle.userData.entityType;
      
      // Unregister from collision system
      if (this.collisionSystem) {
        this.collisionSystem.unregisterEntity(obstacle, entityType);
      }
      
      // Remove from scene using BaseSceneManager method
      this.removeFromScene(obstacle);
      this.obstacles.splice(index, 1);
    }
  }
  
  // Clear all obstacles - used for reset
  reset() {
    console.log('ObstaclesManager: Received game:state:reset event');
    for (const obstacle of this.obstacles) {
      // Determine entity type
      const entityType = obstacle.userData.entityType;
      
      // Unregister from collision system
      if (this.collisionSystem) {
        this.collisionSystem.unregisterEntity(obstacle, entityType);
      }
      
      // Remove from scene using BaseSceneManager method
      this.removeFromScene(obstacle);
    }
    this.obstacles = [];
  }
}

export default ObstaclesManager;
