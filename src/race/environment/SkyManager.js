import * as THREE from 'three';
import BaseSceneManager from './BaseSceneManager.js';
import SkyObjectBuilder from '../builders/SkyObjectBuilder.js';
import { GameEvents } from '../EventBus.js';

class SkyManager extends BaseSceneManager {
  constructor(eventBus) {
    super(eventBus);
    
    // Cloud properties
    this.clouds = [];
    this.cloudCount = 30; 
    this.cloudMoveSpeed = 0.02;
    
    // Airplane properties
    this.airplane = null;
    this.airplanePresent = false;
    this.timeSinceLastAirplane = 0;
    this.nextAirplaneTime = this.getRandomAirplaneInterval();
    
    // Initialize builders
    this.skyObjectBuilder = new SkyObjectBuilder();
    
    // Subscribe to physics updates
    this.eventBus.subscribe(GameEvents.PHYSICS_UPDATED, this.onPhysicsUpdated.bind(this));
  }
  
  onPhysicsUpdated(data) {
    if (data && data.deltaTime !== undefined) {
      this.animate(data.deltaTime, data.carSpeed);
    }
  }
  
  init() {
    // Initialize the sky elements
    this.createClouds();
  }

  // Create clouds in the sky
  createClouds() {
    for (let i = 0; i < this.cloudCount; i++) {
      // Create a cloud using the builder
      const cloudGroup = this.skyObjectBuilder.createCloud();

      // Add to scene via base class method
      this.addToScene(cloudGroup);
      this.clouds.push(cloudGroup);
    }
  }
  
  // Create an airplane
  createAirplane() {
    // Create a group for the airplane
    const airplaneGroup = new THREE.Group();
    
    // Determine if airplane flies left-to-right or right-to-left (50% chance each)
    const flyLeftToRight = Math.random() > 0.5;
    
    // Use the airplane builder to create and configure the airplane
    this.skyObjectBuilder.createAirplaneModel(airplaneGroup, flyLeftToRight);
    
    // Add to scene using the base class method
    this.addToScene(airplaneGroup);
    this.airplane = airplaneGroup;
    this.airplanePresent = true;
  }
  
  // Get random time interval between airplane appearances (10-30 seconds)
  getRandomAirplaneInterval() {
    return 10 + Math.random() * 20; // 10-30 seconds (assuming 60 fps)
  }
  
  // Override animate method from base class
  animate(deltaTime = 1/60, speed = 0) {
    // Animate clouds
    for (const cloud of this.clouds) {
      // Move cloud horizontally
      cloud.position.x += cloud.userData.speedX;
      
      // If cloud moves too far to the sides, reset its position
      if (cloud.position.x > 100) {
        cloud.position.x = -100;
        cloud.position.z = -150 + Math.random() * 300;
      } else if (cloud.position.x < -100) {
        cloud.position.x = 100;
        cloud.position.z = -150 + Math.random() * 300;
      }
    }
    
    // Airplane logic
    if (this.airplanePresent) {
      const airplane = this.airplane;
      
      // Calculate movement based on flight angle
      const speed = airplane.userData.speed;
      const dx = Math.cos(airplane.userData.flightAngle) * speed;
      const dz = Math.sin(airplane.userData.flightAngle) * speed;
      
      // Move the airplane along its flight path
      airplane.position.x += dx;
      airplane.position.z += dz;
      
      // Add slight direction variation for more natural flight
      const variation = airplane.userData.directionVariation;
      airplane.userData.flightAngle += variation;
      
      // Apply the updated rotation to keep the nose aligned with direction
      airplane.rotation.y = airplane.userData.flightAngle;
      
      // Remove airplane when it's out of view (either past horizon or off sides)
      const isOffScreen = 
        (airplane.position.z < -600) || // Past the horizon
        (airplane.userData.flyLeftToRight && airplane.position.x > 500) || // Off right side
        (!airplane.userData.flyLeftToRight && airplane.position.x < -500); // Off left side
      
      if (isOffScreen) {
        this.removeFromScene(airplane);
        this.airplanePresent = false;
      }
    } else {
      // Count time until next airplane
      this.timeSinceLastAirplane += deltaTime;
      
      // Create new airplane when it's time
      if (this.timeSinceLastAirplane > this.nextAirplaneTime) {
        this.createAirplane();
        this.timeSinceLastAirplane = 0;
        this.nextAirplaneTime = this.getRandomAirplaneInterval();
      }
    }
  }
  
  reset() {
    // Reset airplane state if needed
    if (this.airplanePresent) {
      this.removeFromScene(this.airplane);
      this.airplanePresent = false;
    }
    this.timeSinceLastAirplane = 0;
    this.nextAirplaneTime = this.getRandomAirplaneInterval();
  }
}

export default SkyManager;
