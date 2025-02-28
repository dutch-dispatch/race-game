import * as THREE from 'three';
import { GameEvents } from './EventBus.js';

// Entity types for collision detection
export const EntityType = {
  PLAYER_CAR: 'playerCar',
  CITIZEN_CAR: 'citizenCar',
  YELLOW_BRICK: 'yellowBrick',
  BLUE_BRICK: 'blueBrick'
};

// Collision types
export const CollisionType = {
  SIDE: 'side',
  BACK: 'back',
  FRONT: 'front'
};

/**
 * CollisionSystem - Handles all collision detection and notification
 */
export 
class CollisionSystem {
  constructor(eventBus) {
    // Store entities by type for organized collision checking
    this.entities = {
      [EntityType.PLAYER_CAR]: null,
      [EntityType.CITIZEN_CAR]: [],
      [EntityType.YELLOW_BRICK]: [],
      [EntityType.BLUE_BRICK]: []
    };
    
    // Collision matrix defines which entity types can collide with each other
    this.collisionMatrix = {
      [EntityType.PLAYER_CAR]: [EntityType.CITIZEN_CAR, EntityType.YELLOW_BRICK, EntityType.BLUE_BRICK],
      [EntityType.CITIZEN_CAR]: [EntityType.PLAYER_CAR, EntityType.CITIZEN_CAR, EntityType.YELLOW_BRICK, EntityType.BLUE_BRICK],
      [EntityType.YELLOW_BRICK]: [EntityType.PLAYER_CAR, EntityType.CITIZEN_CAR],
      [EntityType.BLUE_BRICK]: [EntityType.PLAYER_CAR, EntityType.CITIZEN_CAR]
    };
    
    // Event listeners for collision events
    this.eventListeners = {
      'collision': []
    };
    
    this.eventBus = eventBus;
    this.eventBus.subscribe(GameEvents.GAME_STATE_RESET, this.clear.bind(this));    
  }
  
  /**
   * Register an entity with the collision system
   * @param {Object} entity - The entity object (THREE.Mesh or THREE.Group)
   * @param {string} type - The entity type from EntityType enum
   */
  registerEntity(entity, type) {
    if (type === EntityType.PLAYER_CAR) {
      this.entities[type] = entity;
    } else {
      this.entities[type].push(entity);
    }
    
    // Add entity type to userData for easy reference
    entity.userData.entityType = type;
  }
  
  /**
   * Unregister an entity from the collision system
   * @param {Object} entity - The entity to unregister
   * @param {string} type - The entity type
   */
  unregisterEntity(entity, type) {
    if (type === EntityType.PLAYER_CAR) {
      this.entities[type] = null;
    } else {
      const index = this.entities[type].indexOf(entity);
      if (index !== -1) {
        this.entities[type].splice(index, 1);
      }
    }
  }
  
  /**
   * Add an event listener for collision events
   * @param {string} eventType - The event type (e.g., 'collision')
   * @param {Function} callback - The function to call when event occurs
   * @param {Object} filter - Optional filter for collision events (sourceType, targetType)
   */
  addEventListener(eventType, callback, filter = null) {
    if (!this.eventListeners[eventType]) {
      this.eventListeners[eventType] = [];
    }
    
    this.eventListeners[eventType].push({
      callback: callback,
      filter: filter
    });
  }
  
  /**
   * Remove an event listener
   * @param {string} eventType - The event type
   * @param {Function} callback - The callback to remove
   */
  removeEventListener(eventType, callback) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType] = this.eventListeners[eventType].filter(
        listener => listener.callback !== callback
      );
    }
  }
  
  /**
   * Dispatch a collision event to all registered listeners
   * @param {Object} collisionData - Data about the collision
   */
  dispatchEvent(collisionData) {
    const eventType = 'collision';
    
    // Also emit through EventBus if available
    if (this.eventBus) {
      this.eventBus.emit(GameEvents.COLLISION_DETECTED, collisionData);
    }
    
    if (!this.eventListeners[eventType]) {
      return;
    }
    
    // Process each listener and check if it should receive this event
    this.eventListeners[eventType].forEach(listener => {
      // Check if the listener has a filter and if the collision matches the filter
      if (listener.filter) {
        const { sourceType, targetType } = listener.filter;
        
        if (sourceType && targetType) {
          // Filter by both source and target type
          if (collisionData.source.userData.entityType !== sourceType || 
              collisionData.target.userData.entityType !== targetType) {
            return; // Skip this listener
          }
        } else if (sourceType) {
          // Filter by source type only
          if (collisionData.source.userData.entityType !== sourceType) {
            return; // Skip this listener
          }
        } else if (targetType) {
          // Filter by target type only
          if (collisionData.target.userData.entityType !== targetType) {
            return; // Skip this listener
          }
        }
      }
      
      // If we got here, the filter matches or there is no filter
      listener.callback(collisionData);
    });
  }
  
  /**
   * Check if two entities are colliding
   * @param {Object} entity1 - First entity to check
   * @param {Object} entity2 - Second entity to check
   * @returns {boolean} True if collision detected
   */
  checkEntityCollision(entity1, entity2) {
    const box1 = new THREE.Box3().setFromObject(entity1);
    const box2 = new THREE.Box3().setFromObject(entity2);
    return box1.intersectsBox(box2);
  }
  
  /**
   * Determine the type of collision between two entities
   * @param {Object} entity1 - First entity
   * @param {Object} entity2 - Second entity
   * @returns {string} The collision type
   */
  determineCollisionType(entity1, entity2) {
    // Calculate relative positions
    const x1 = entity1.position.x;
    const z1 = entity1.position.z;
    const x2 = entity2.position.x;
    const z2 = entity2.position.z;
    
    // Check if collision is more from the side or front/back
    const xDiff = Math.abs(x1 - x2);
    const zDiff = Math.abs(z1 - z2);
    
    if (xDiff > zDiff) {
      return CollisionType.SIDE;
    } else {
      // Determine front or back collision based on z position
      return z1 > z2 ? CollisionType.BACK : CollisionType.FRONT;
    }
  }
  
  /**
   * Notify all registered handlers about a collision
   * @param {Object} collision - Collision data
   * @private
   */
  notifyCollision(collision) {
    this.dispatchEvent(collision);
  }
  
  /**
   * Check for all collisions in the system
   */
  checkCollisions() {
    // Check player car collisions first
    this._checkPlayerCollisions();
    
    // Check citizen car collisions
    this._checkCitizenCarCollisions();
    
    // No need to check brick-to-brick collisions as they're static
  }
  
  /**
   * Check for player car collisions with other entities
   * @private
   */
  _checkPlayerCollisions() {
    const playerCar = this.entities[EntityType.PLAYER_CAR];
    if (!playerCar) return;
    
    // Get collision targets for player car
    const collisionTargets = this.collisionMatrix[EntityType.PLAYER_CAR];
    // Check against each target type
    collisionTargets.forEach(targetType => {
      const targets = this.entities[targetType];
      if (!targets || (Array.isArray(targets) && targets.length === 0)) return;
      
      if (Array.isArray(targets)) {
        // Check against array of entities
        for (const target of targets) {
          if (this.checkEntityCollision(playerCar, target)) {
            const collisionType = this.determineCollisionType(playerCar, target);
            
            // Create collision data object
            const collision = {
              source: playerCar,
              target: target,
              collisionType: collisionType,
              position: target.position.clone()
            };
            
            // Notify handlers
            this.notifyCollision(collision);
          }
        }
      }
    });
  }
  
  /**
   * Check for citizen car collisions with other entities
   * @private
   */
  _checkCitizenCarCollisions() {
    const citizenCars = this.entities[EntityType.CITIZEN_CAR];
    if (!citizenCars || citizenCars.length === 0) return;
    
    // Check for collisions between citizen cars
    for (let i = 0; i < citizenCars.length; i++) {
      for (let j = i + 1; j < citizenCars.length; j++) {
        if (this.checkEntityCollision(citizenCars[i], citizenCars[j])) {
          const collisionType = this.determineCollisionType(citizenCars[i], citizenCars[j]);
          
          // Create collision data object
          const collision = {
            source: citizenCars[i],
            target: citizenCars[j],
            collisionType: collisionType,
            position: new THREE.Vector3().addVectors(
              citizenCars[i].position,
              citizenCars[j].position
            ).divideScalar(2)
          };
          
          this.notifyCollision(collision);
        }
      }
      
      // Check citizen car collisions with bricks
      const brickTypes = [EntityType.YELLOW_BRICK, EntityType.BLUE_BRICK];
      for (const brickType of brickTypes) {
        const bricks = this.entities[brickType];
        if (!bricks || bricks.length === 0) continue; // Use continue instead of return
        
        for (const brick of bricks) {
          if (this.checkEntityCollision(citizenCars[i], brick)) {
            const collisionType = this.determineCollisionType(citizenCars[i], brick);
            
            // Create collision data object
            const collision = {
              source: citizenCars[i],
              target: brick,
              collisionType: collisionType,
              position: brick.position.clone()
            };
            
            this.notifyCollision(collision);
          }
        }
      }
    }
  }
  
  /**
   * Clear all registered entities
   */
  clear() {
    console.log('CollisionSystem: Received game:state:reset event');
    this.entities = {
      [EntityType.PLAYER_CAR]: null,
      [EntityType.CITIZEN_CAR]: [],
      [EntityType.YELLOW_BRICK]: [],
      [EntityType.BLUE_BRICK]: []
    };
  }
}

export default CollisionSystem;
