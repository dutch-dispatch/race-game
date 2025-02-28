import * as THREE from 'three';
import BaseSceneManager from './BaseSceneManager.js';
import { GameEvents } from '../EventBus.js';

class RoadManager extends BaseSceneManager {
  constructor(eventBus, config) {
    super(eventBus);
    
    // Store config
    this.config = config;
    
    // Road properties
    this.roadSegment = null;
    
    // Road marking properties
    this.roadMarkings = [];
    
    // Side barriers
    this.barriers = [];
    
    // Traffic sign properties
    this.trafficSigns = [];
    this.signMinDistance = 300;
    this.signMaxDistance = 500;
    this.signHeight = 4;
    this.signWidth = 1.8;
    this.poleRadius = 0.1;
    this.totalRoadLength = this.config.roadLength;
    
    // Subscribe to events
    this.eventBus.subscribe(GameEvents.PHYSICS_UPDATED, this.onPhysicsUpdated.bind(this));
    this.eventBus.subscribe(GameEvents.GAME_STATE_RESET, this.onGameStateReset.bind(this));
  }
  
  onPhysicsUpdated(data) {    
    if (data && data.carSpeed !== undefined) {            
      this.animate(data.deltaTime, data.carSpeed);
    }
  }
  
  onGameStateReset() {
    console.log('RoadManager: Received game:state:reset event');
    // Reset road elements positions if needed
    this.reset();
  }
  
  reset() {
    // Reset road markings
    this.resetRoadMarkings();
    
    // Reset barriers
    this.resetBarriers();
    
    // Reset traffic signs
    this.resetTrafficSigns();
  }
  
  resetRoadMarkings() {
    // Reset all road markings to their initial positions
    const startZ = -this.config.roadLength / 2;
    
    for (let i = 0; i < this.roadMarkings.length; i++) {
      const marking = this.roadMarkings[i];
      marking.position.z = startZ + i * (this.config.markingLength + this.config.markingGap) + this.config.markingLength / 2;
    }
  }
  
  resetBarriers() {
    // Reset all barriers to their initial positions
    for (let i = 0; i < this.config.barrierCount; i++) {
      const leftBarrier = this.barriers[i * 2];
      const rightBarrier = this.barriers[i * 2 + 1];
      
      leftBarrier.position.z = -i * this.config.barrierSpacing;
      rightBarrier.position.z = -i * this.config.barrierSpacing;
    }
  }
  
  resetTrafficSigns() {
    // Reset all traffic signs to their initial positions
    for (const sign of this.trafficSigns) {
      const initialZ = sign.initialZ;
      sign.pole.position.z = initialZ;
      sign.signFace.position.z = initialZ;
    }
  }
  
  init() {
    // Create a single long road segment
    this.createRoadSegment();
    
    // Create road markings for the entire road
    this.createRoadMarkings();
    
    // Create side barriers
    this.createSideBarriers();
    
    // Create traffic signs
    this.createTrafficSigns();
  }
  
  // Create a single long road segment
  createRoadSegment() {
    const trackGeometry = new THREE.PlaneGeometry(this.config.roadWidth, this.config.roadLength);
  
    // Create material with improved properties for better shadow appearance
    const trackMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x555555,
      roughness: 0.8, // Add roughness for better shadow appearance
      metalness: 0.1  // Add slight metalness for asphalt-like appearance
    });
    
    // Create mesh
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    
    // Enable shadow receiving on the road
    track.receiveShadow = true;
    
    // Create group and add the track mesh
    const roadSegment = new THREE.Group();
    roadSegment.add(track);
    
    // Apply transformations to the GROUP
    roadSegment.rotation.x = -Math.PI / 2; // Lay flat
    roadSegment.position.y = 0.01; // Slightly above ground
    roadSegment.position.z = -this.config.roadLength / 4; // Position so road stretches toward the horizon
    roadSegment.userData.type = 'road-segment';
        
    // Add the GROUP to the scene using base class method
    this.addToScene(roadSegment);
    
    // Store the road segment
    this.roadSegment = roadSegment;
    
    return roadSegment;
  }
  
  // Create road markings for the entire road
  createRoadMarkings() {
    // Create multiple markings along the segment length
    const markingsCount = Math.floor(this.config.roadLength / (this.config.markingLength + this.config.markingGap));
    const startZ = -this.config.roadLength / 2;
    
    for (let i = 0; i < markingsCount; i++) {
      const markingGeometry = new THREE.PlaneGeometry(this.config.markingWidth, this.config.markingLength);
      const markingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.3,
        emissive: 0xffffff,
        emissiveIntensity: 0.2
      });
      
      const marking = new THREE.Mesh(markingGeometry, markingMaterial);
      
      // Position each marking with equal spacing
      const zPos = startZ + i * (this.config.markingLength + this.config.markingGap) + this.config.markingLength / 2;
      marking.rotation.x = -Math.PI / 2; // Lay flat like the road
      marking.position.set(0, 0.02, zPos); // Slightly above road to avoid z-fighting
      
      // Enable shadows for markings
      marking.castShadow = true;
      marking.receiveShadow = true;
      
      this.addToScene(marking);
      this.roadMarkings.push(marking);
    }
  }
  
  // Create side barriers for enhanced speed perception
  createSideBarriers() {
    const barrierGeometry = new THREE.BoxGeometry(0.5, 1.5, 1);
    const leftBarrierMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffdd00,
        roughness: 0.7,
        metalness: 0.2 
    });
    const rightBarrierMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffdd00,
        roughness: 0.7,
        metalness: 0.2 
    });
    
    // Position for barriers
    const barrierXPosition = this.config.roadWidth / 2 + 1;
    
    // Create barriers on both sides of the road
    for (let i = 0; i < this.config.barrierCount; i++) {
        // Left barrier
        const leftBarrier = new THREE.Mesh(barrierGeometry, leftBarrierMaterial);
        leftBarrier.position.set(-barrierXPosition, 0.75, -i * this.config.barrierSpacing);
        
        // Enable shadows for barriers
        leftBarrier.castShadow = true;
        leftBarrier.receiveShadow = true;
        
        this.addToScene(leftBarrier);
        this.barriers.push(leftBarrier);
        
        // Right barrier
        const rightBarrier = new THREE.Mesh(barrierGeometry, rightBarrierMaterial);
        rightBarrier.position.set(barrierXPosition, 0.75, -i * this.config.barrierSpacing);
        
        // Enable shadows for barriers
        rightBarrier.castShadow = true;
        rightBarrier.receiveShadow = true;
        
        this.addToScene(rightBarrier);
        this.barriers.push(rightBarrier);
    }
  }
  
  // Create traffic signs
  createTrafficSigns() {
    let distance = 0;
    
    while (distance < this.totalRoadLength) {
      // Random distance between min and max
      const nextSignDistance = Math.floor(Math.random() * 
        (this.signMaxDistance - this.signMinDistance)) + this.signMinDistance;
      
      // Random side (left or right)
      const isLeft = Math.random() > 0.5;
      
      // Random sign type (speed limit or info)
      const isSpeedLimit = Math.random() > 0.5;
      
      // Position for sign
      const xPosition = isLeft ? 
        -(this.config.roadWidth / 2 + 2) : 
        (this.config.roadWidth / 2 + 2);
      
      const zPosition = -distance;
      
      // Create the sign
      this.createTrafficSign(xPosition, zPosition, isSpeedLimit);
      
      // Increase the distance
      distance += nextSignDistance;
    }
  }
  
  createTrafficSign(xPosition, zPosition, isSpeedLimit) {
    // Create the pole (white cylinder)
    const poleGeometry = new THREE.CylinderGeometry(this.poleRadius, this.poleRadius, this.signHeight, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.7 
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(xPosition, this.signHeight / 2, zPosition);
    
    // Enable shadows for the pole
    pole.castShadow = true;
    pole.receiveShadow = true;
    
    this.addToScene(pole);
    
    // Create the sign face
    let signFace;
    
    if (isSpeedLimit) {
        // Speed limit sign - red circle with white center
        const signGroup = new THREE.Group();
        
        // Red outer circle
        const outerGeometry = new THREE.CircleGeometry(this.signWidth / 2, 32);
        const outerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            side: THREE.DoubleSide,
            roughness: 0.5
        });
        const outerCircle = new THREE.Mesh(outerGeometry, outerMaterial);
        outerCircle.castShadow = true;
        outerCircle.receiveShadow = true;
        
        // White inner circle
        const innerGeometry = new THREE.CircleGeometry(this.signWidth / 3, 32);
        const innerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide,
            roughness: 0.5
        });
        const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
        innerCircle.position.z = 0.01; // Slight offset to avoid z-fighting
        innerCircle.castShadow = true;
        innerCircle.receiveShadow = true;
        
        // Add both circles to the group
        signGroup.add(outerCircle);
        signGroup.add(innerCircle);
        
        signFace = signGroup;
    } else {
        // Info sign - light blue rectangle
        const signGeometry = new THREE.PlaneGeometry(this.signWidth, this.signWidth);
        const signMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4aa8ff,
            side: THREE.DoubleSide,
            roughness: 0.5
        });
        signFace = new THREE.Mesh(signGeometry, signMaterial);
    }
    
    // Position the sign at the top of the pole
    signFace.position.set(xPosition, this.signHeight * 0.9, zPosition);
    
    // Fix the rotation: Rotate to properly face the player
    signFace.rotation.y = 0; // This makes the sign face directly toward the player
    
    // Enable shadows for the sign face
    signFace.castShadow = true;
    signFace.receiveShadow = true;
    
    this.addToScene(signFace);
    
    // Store the sign components
    this.trafficSigns.push({
        pole: pole,
        signFace: signFace,
        initialZ: zPosition
    });
}
  
  // Main animation method that updates all road components
  animate(deltaTime, carSpeed) {
    // We don't need to update the road position anymore since it's static
    // Just update the barriers and signs for visual effect
    this.updateBarriers(carSpeed);
    this.updateTrafficSigns(carSpeed);
    this.updateRoadMarkings(carSpeed);
    
    // Emit an event that the road has been updated
    this.eventBus.emit(GameEvents.ROAD_UPDATED);
  }
  
  // Update road segments - not needed anymore since the road is static
  // But kept for compatibility
  updateRoad(carSpeed) {
    // No need to move the road anymore
  }
  
  // Update road markings
  updateRoadMarkings(carSpeed) {
    const markingMaxZ = 20;
    const markingFullLength = this.config.markingLength + this.config.markingGap;
    const markingResetZ = -this.config.roadLength / 2;
    
    for (let i = 0; i < this.roadMarkings.length; i++) {
      const marking = this.roadMarkings[i];
      
      // Move marking based on car speed (doubled)
      marking.position.z += carSpeed * 2;
      
      // Reset marking position when it moves past the camera
      if (marking.position.z > markingMaxZ) {
        // Find the last marking in the sequence
        let lastZ = markingResetZ;
        for (const m of this.roadMarkings) {
          if (m.position.z < lastZ && m !== marking) {
            lastZ = m.position.z;
          }
        }
        // Place this marking behind the last one
        marking.position.z = lastZ - markingFullLength;
      }
    }
  }
  
  // Update side barriers
  updateBarriers(carSpeed) {
    const barrierMaxZ = 20;
    const barrierResetZ = -this.config.barrierCount * this.config.barrierSpacing;
    
    for (let i = 0; i < this.barriers.length; i++) {
      const barrier = this.barriers[i];
      
      // Move barrier based on car speed (doubled)
      barrier.position.z += carSpeed * 2;
      
      // Reset barrier position when it moves past the camera
      if (barrier.position.z > barrierMaxZ) {
        barrier.position.z = barrierResetZ;
      }
    }
  }
  
  // Update traffic signs
  updateTrafficSigns(carSpeed) {
    for (let i = 0; i < this.trafficSigns.length; i++) {
      const sign = this.trafficSigns[i];
      
      // Move sign based on car speed (doubled)
      sign.pole.position.z += carSpeed * 2;
      sign.signFace.position.z += carSpeed * 2;
      
      // Reset sign position when it moves past the camera
      if (sign.pole.position.z > 75) {
        // Move the sign back to the far end
        const offset = -(this.totalRoadLength + 75);
        sign.pole.position.z += offset;
        sign.signFace.position.z += offset;
      }
    }
  }
}

export default RoadManager;
