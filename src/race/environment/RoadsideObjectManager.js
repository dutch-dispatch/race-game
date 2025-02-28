import * as THREE from 'three';
import RoadsideObjectBuilder from '../builders/RoadsideObjectBuilder.js';
import BaseSceneManager from './BaseSceneManager.js';
import { GameEvents } from '../EventBus.js';

class RoadsideObjectManager extends BaseSceneManager {
  constructor(eventBus, config) {
    super(eventBus);
    this.config = config;
    
    // Roadside object properties
    this.roadsideObjects = [];
    
    // Clustering properties
    this.clusterChance = 0.6;
    this.clusterSize = { min: 2, max: 5 };
    
    // Unpaved road properties
    this.unpavedRoadChance = 0.15;
    this.unpavedRoadWidth = 5;
    this.unpavedRoadLength = 40;
    
    this.roadsideObjectBuilder = new RoadsideObjectBuilder();
    
    // Subscribe to physics updates
    this.eventBus.subscribe(GameEvents.PHYSICS_UPDATED, this.onPhysicsUpdated.bind(this));
    this.eventBus.subscribe(GameEvents.GAME_STATE_RESET, this.onGameStateReset.bind(this));
  }
  
  onPhysicsUpdated(data) {    
    if (data && data.carSpeed !== undefined) {           
      this.animate(data.deltaTime, data.carSpeed);
    }
  }
  
  onGameStateReset() {
    console.log('RoadsideObjectManager: Received game:state:reset event');
    this.reset();
  }
  
  init() {
    this.createRoadsideObjects();
  }
  
  reset() {
    const objectResetZ = -this.config.objectCount * this.config.objectSpacing;
    
    for (const object of this.roadsideObjects) {
      // Reset object position
      if (object.userData.initialZ) {
        object.position.z = object.userData.initialZ;
      } else {
        object.position.z = objectResetZ - Math.random() * this.config.objectSpacing;
      }
    }
  }
  
  // Create roadside objects alongside the road
  createRoadsideObjects() {
    let leftZ = 0;
    let rightZ = 0;
    
    // Create objects on both sides of the road
    let objectsCreated = 0;
    while (objectsCreated < this.config.objectCount * 2) {
      // Decide if we're creating an unpaved side road
      const createUnpavedRoad = Math.random() < this.unpavedRoadChance;
      
      if (createUnpavedRoad) {
        // Randomly decide which side the unpaved road will be on
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const roadZ = side === 'left' ? leftZ : rightZ;
        
        this.createUnpavedSideRoad(roadZ, side);
        
        // Move positions forward to avoid placing objects on the side road
        if (side === 'left') {
          leftZ -= this.config.objectSpacing * 2;
        } else {
          rightZ -= this.config.objectSpacing * 2;
        }
        
        objectsCreated += 1;
      } else if (Math.random() < this.clusterChance) {
        // Determine cluster size
        const clusterSize = Math.floor(
          Math.random() * (this.clusterSize.max - this.clusterSize.min + 1) + this.clusterSize.min
        );
        
        // Create cluster on left side
        leftZ = this.createClusterAtPosition(
          -(this.config.roadWidth/2), leftZ, clusterSize, 'left'
        );
        
        // Create cluster on right side (different cluster from left side)
        const rightClusterSize = Math.floor(
          Math.random() * (this.clusterSize.max - this.clusterSize.min + 1) + this.clusterSize.min
        );
        rightZ = this.createClusterAtPosition(
          this.config.roadWidth/2, rightZ, rightClusterSize, 'right'
        );
        
        objectsCreated += clusterSize + rightClusterSize;
      } else {
        // Create single objects
        // Left side
        const leftObj = this.createSingleObject(-(this.config.roadWidth/2), leftZ, 'left');
        leftZ = leftObj.position.z - this.config.objectSpacing * 1.2;
        
        // Right side
        const rightObj = this.createSingleObject(this.config.roadWidth/2, rightZ, 'right');
        rightZ = rightObj.position.z - this.config.objectSpacing * 1.2;
        
        objectsCreated += 2;
      }
    }
  }
  
  // Create a side unpaved road that connects to the main road
  createUnpavedSideRoad(z, side) {
    // Position at the edge of the main road
    const xStart = side === 'left' ? -this.config.roadWidth/2 : this.config.roadWidth/2;
    // Direction to extend (negative for left, positive for right)
    const xDirection = side === 'left' ? -1 : 1;
    
    // Create the unpaved road geometry
    const roadGeometry = new THREE.PlaneGeometry(this.unpavedRoadLength, this.unpavedRoadWidth);
    
    // Brown dirt texture for unpaved road
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      roughness: 0.9,
      metalness: 0.1
    });
    
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    
    // Position the road to connect to the main road
    road.position.set(
      xStart + (xDirection * this.unpavedRoadLength / 2), 
      0.01, // Slightly above ground to avoid z-fighting
      z
    );
    road.rotation.x = -Math.PI / 2; // Rotate to lay flat on the ground
    road.userData.initialZ = z; // Store initial Z for reset
    road.receiveShadow = true; // Enable shadow receiving
    
    // Add some detail/texture to make it look like an unpaved road
    const noiseGeometry = new THREE.PlaneGeometry(this.unpavedRoadLength, this.unpavedRoadWidth, 10, 2);
    const vertices = noiseGeometry.attributes.position.array;
    
    // Add some random height to vertices to create bumps
    for (let i = 0; i < vertices.length; i += 3) {
      if (i % 9 !== 0) { // Don't modify edge vertices
        vertices[i + 1] = Math.random() * 0.2;
      }
    }
    
    const noiseMesh = new THREE.Mesh(
      noiseGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x9b7653,
        roughness: 1.0,
        metalness: 0.0
      })
    );
    
    noiseMesh.position.set(
      xStart + (xDirection * this.unpavedRoadLength / 2),
      0.02, // Slightly above the base road
      z
    );
    noiseMesh.rotation.x = -Math.PI / 2;
    noiseMesh.userData.initialZ = z; // Store initial Z for reset
    noiseMesh.receiveShadow = true; // Enable shadow receiving
    noiseMesh.castShadow = true; // Enable shadow casting for the bumps
    
    this.addToScene(road);
    this.addToScene(noiseMesh);
    
    // Add these to roadsideObjects so they'll be updated with movement
    this.roadsideObjects.push(road);
    this.roadsideObjects.push(noiseMesh);
    
    // Add cones at the entrance of the unpaved road using the builder's method
    this.addConesAtUnpavedRoadEntrance(xStart, z, side);
    
    // Add objects along the unpaved road
    this.addObjectsAlongUnpavedRoad(xStart, z, side);
    
    return z - this.config.objectSpacing;
  }
  
  // Add traffic cones at the entrance of the unpaved road
  addConesAtUnpavedRoadEntrance(xStart, z, side) {
    const coneCount = 3; // Use 3 cones to block the road
    const xDirection = side === 'left' ? -1 : 1;
    
    for (let i = 0; i < coneCount; i++) {
      // Use the builder to create a traffic cone
      const cone = this.roadsideObjectBuilder.createTrafficCone();
      
      // Position cones across the unpaved road entrance
      // Calculate position near the junction of main road and unpaved road
      const coneX = xStart + (xDirection * 2); // 2 units down the unpaved road
      // Spread cones across the width of the unpaved road
      const coneZ = z + (i - 1) * 1.5; // Center cone at z, others spaced 1.5 units
      
      cone.position.set(coneX, 0, coneZ);
      cone.userData.initialZ = coneZ; // Store initial Z for reset
      
      this.addToScene(cone);
      this.roadsideObjects.push(cone);
    }
  }
  
  // Add some objects along the unpaved side road
  addObjectsAlongUnpavedRoad(xStart, z, side) {
    // Number of objects to place along the road
    const objectCount = Math.floor(Math.random() * 3) + 1;
    const xDirection = side === 'left' ? -1 : 1;
    
    for (let i = 0; i < objectCount; i++) {
      // Position object along the unpaved road
      // Place objects further down the unpaved road
      const distanceFromMainRoad = 10 + (i * 8) + (Math.random() * 5);
      const xPos = xStart + (xDirection * distanceFromMainRoad);
      
      // Add some offset from center of the road
      const zOffset = (Math.random() - 0.5) * 5;
      const zPos = z + zOffset;
      
      const object = this.roadsideObjectBuilder.createRoadsideObject(xPos, zPos);
      object.userData.initialZ = zPos; // Store initial Z for reset
      
      // Random scale for more natural variation
      const scale = 0.8 + Math.random() * 0.5;
      object.scale.set(scale, scale, scale);
      
      this.addToScene(object);
      this.roadsideObjects.push(object);
    }
  }
  
  // Create a cluster of objects at a specific position
  createClusterAtPosition(baseX, baseZ, clusterSize, side) {
    const clusterSpread = 10; // Increased from 5 to 10 to cover more territory
    let furthestZ = baseZ;
    
    for (let i = 0; i < clusterSize; i++) {
      // Create a mixed distance distribution - some objects close to road, some far away
      let distanceVariation;
      
      if (Math.random() < 0.7) {
        // 70% of objects follow the original pattern (closer to road)
        const distanceFunction = Math.pow(Math.random(), 2);
        distanceVariation = 2 + distanceFunction * 18; // 2-20 units from road edge
      } else {
        // 30% of objects appear farther away for more realistic landscape
        distanceVariation = 20 + Math.random() * 30; // 20-50 units from road edge
      }
      
      // Calculate position with clustering
      const xOffset = Math.random() * clusterSpread - clusterSpread/2;
      const zOffset = Math.random() * clusterSpread - clusterSpread/2;
      const xDir = side === 'left' ? -1 : 1;
      
      const x = baseX + (xDir * distanceVariation) + xOffset;
      const z = baseZ + zOffset;
      
      if (z < furthestZ) {
        furthestZ = z;
      }
      
      // Create the object
      const object = this.roadsideObjectBuilder.createRoadsideObject(x, z);
      object.userData.initialZ = z; // Store initial Z for reset
      
      // Random scale for more natural variation (0.8 to 1.3)
      const scale = 0.8 + Math.random() * 0.5;
      object.scale.set(scale, scale, scale);
      
      this.addToScene(object);
      this.roadsideObjects.push(object);
    }
    
    // Return the furthest z position for next object/cluster placement
    return furthestZ - this.config.objectSpacing;
  }
  
  // Create a single object at a position
  createSingleObject(baseX, baseZ, side) {
    // Create a mixed distance distribution - some objects close to road, some far away
    let distanceVariation;
    
    if (Math.random() < 0.7) {
      // 70% of objects follow the original pattern (closer to road)
      const distanceFunction = Math.pow(Math.random(), 2);
      distanceVariation = 2 + distanceFunction * 18; // 2-20 units from road edge
    } else {
      // 30% of objects appear farther away for more realistic landscape
      distanceVariation = 20 + Math.random() * 30; // 20-50 units from road edge
    }
    
    const xDir = side === 'left' ? -1 : 1;
    const x = baseX + (xDir * distanceVariation);
    
    // Add slight z variation
    const z = baseZ - Math.random() * 5;
    
    const object = this.roadsideObjectBuilder.createRoadsideObject(x, z);
    object.userData.initialZ = z; // Store initial Z for reset
    
    // Random scale for more natural variation (0.8 to 1.3)
    const scale = 0.8 + Math.random() * 0.5;
    object.scale.set(scale, scale, scale);
    
    this.addToScene(object);
    this.roadsideObjects.push(object);
    
    return object;
  }
  
  // Update roadside objects position based on car movement
  updateRoadsideObjects(carSpeed) {
    const objectResetZ = -this.config.objectCount * this.config.objectSpacing;
    const objectViewDistance = 30;
    
    for (const object of this.roadsideObjects) {
      // Move object based on car speed (doubled)
      object.position.z += carSpeed * 2;
      
      // Reset object position when it moves past the camera
      if (object.position.z > objectViewDistance) {
        // For unpaved road objects (checking if it's a plane geometry with appropriate dimensions)
        if (object.geometry instanceof THREE.PlaneGeometry && 
            (object.geometry.parameters.width === this.unpavedRoadLength && 
             object.geometry.parameters.height === this.unpavedRoadWidth)) {
          
          // Create a new unpaved side road at the back
          object.position.z = objectResetZ - Math.random() * (this.config.objectSpacing * 3);
          
          // Randomly decide which side the new road will be on
          const side = Math.random() < 0.5 ? 'left' : 'right';
          const xStart = side === 'left' ? -this.config.roadWidth/2 : this.config.roadWidth/2;
          const xDirection = side === 'left' ? -1 : 1;
          
          // Reset position
          object.position.x = xStart + (xDirection * this.unpavedRoadLength / 2);
        } else {
          // Regular objects - use existing repositioning code
          // Add variation to z position for less uniform appearance
          object.position.z = objectResetZ - Math.random() * this.config.objectSpacing;
          
          // Randomize X position with greater variation while keeping on correct side
          if (object.position.x < 0) {
            // Left side - mixed distance distribution
            if (Math.random() < 0.7) {
              const distanceFunction = Math.pow(Math.random(), 2);
              const leftDistanceVariation = 2 + distanceFunction * 18; // Closer objects
              object.position.x = -(this.config.roadWidth/2 + leftDistanceVariation);
            } else {
              const leftDistanceVariation = 20 + Math.random() * 30; // Farther objects
              object.position.x = -(this.config.roadWidth/2 + leftDistanceVariation);
            }
          } else {
            // Right side - mixed distance distribution
            if (Math.random() < 0.7) {
              const distanceFunction = Math.pow(Math.random(), 2);
              const rightDistanceVariation = 2 + distanceFunction * 18; // Closer objects
              object.position.x = (this.config.roadWidth/2 + rightDistanceVariation);
            } else {
              const rightDistanceVariation = 20 + Math.random() * 30; // Farther objects
              object.position.x = (this.config.roadWidth/2 + rightDistanceVariation);
            }
          }
          
          // Randomize scale for more natural variation (0.8 to 1.3)
          const newScale = 0.8 + Math.random() * 0.5;
          object.scale.set(newScale, newScale, newScale);
          
          // Randomize rotation for variety when recycling
          object.rotation.y = Math.random() * Math.PI * 2;
        }
      }
    }
  }
  
  // Main animation method called from game loop
  animate(deltaTime, carSpeed) {
    this.updateRoadsideObjects(carSpeed);
    
    // Emit an event that the roadside objects have been updated
    this.eventBus.emit('roadside:updated');
  }
}

export default RoadsideObjectManager;
