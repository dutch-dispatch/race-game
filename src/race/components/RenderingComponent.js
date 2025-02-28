import * as THREE from 'three';
import { GameEvents } from '../EventBus.js';

export default class RenderingComponent {
  constructor(eventBus, canvas) {
    this.eventBus = eventBus;
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    
    // Camera properties moved from RaceGame
    this.cameraFollowMode = false;
    this.cameraFollowOffsetY = 1.2;
    this.cameraFollowOffsetZ = 3.0;
    this.cameraFollowLookAheadZ = -5.0;
    this.initialFOV = 75;
    this.maxFOVIncrease = 30;
    this.cameraShakeIntensity = 0;
    this.maxCameraShake = 0.1;
    
    // Target car for camera following
    this.targetCar = null;
    
    // Subscribe to events
    this.eventBus.subscribe(GameEvents.CAMERA_TOGGLE_MODE, this.toggleCameraMode.bind(this));
    this.eventBus.subscribe(GameEvents.PHYSICS_UPDATED, this.updateCameraEffects.bind(this));
    this.eventBus.subscribe(GameEvents.GAME_FRAME, this.render.bind(this));
    this.eventBus.subscribe(GameEvents.WINDOW_RESIZE, this.handleResize.bind(this));
    this.eventBus.subscribe(GameEvents.VEHICLES_PLAYER_CAR_CREATED, this.handlePlayerCarCreated.bind(this));
    this.eventBus.subscribe(GameEvents.SCENE_ADD, this.addToScene.bind(this));
    this.eventBus.subscribe(GameEvents.SCENE_REMOVE, this.removeFromScene.bind(this));
    this.eventBus.subscribe(GameEvents.SCENE_REQUEST, this.provideScene.bind(this));
    
    this.init();
  }
  
  init() {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x87CEEB); // Sky blue background
    
    // Enable and configure shadows in the renderer for better quality
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Smoother shadow edges
    
    // Set up camera
    this.camera.position.set(0, 3, 5);
    this.camera.lookAt(0, 0, -10);
    
    // Add ambient light with reduced intensity to make shadows more visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    // Add directional light (sunlight) with enhanced shadow support
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 0);
    
    // Configure directional light for improved shadows
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;  // Increased resolution
    directionalLight.shadow.mapSize.height = 4096; // Increased resolution
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;      // Increased range
    directionalLight.shadow.camera.left = -50;     // Wider area
    directionalLight.shadow.camera.right = 50;     // Wider area
    directionalLight.shadow.camera.top = 50;       // Wider area
    directionalLight.shadow.camera.bottom = -50;   // Wider area
    directionalLight.shadow.bias = -0.001;         // Reduce shadow acne
    
    this.scene.add(directionalLight);
  }

  addToScene(object) {
    this.scene.add(object);
  }
  
  removeFromScene(object) {
    this.scene.remove(object);
  }
  
  setTargetCar(car) {
    this.targetCar = car;
  }
  
  toggleCameraMode() {
    this.cameraFollowMode = !this.cameraFollowMode;
    
    // Reset camera position when switching modes
    if (!this.cameraFollowMode) {
      // Return to fixed camera mode
      this.camera.position.set(0, 3, 5);
      this.camera.lookAt(0, 0, -10);
    } else if (this.targetCar) {
      // Set camera position behind the car when switching to follow mode
      this.camera.position.set(
        this.targetCar.position.x,
        this.targetCar.position.y + this.cameraFollowOffsetY,
        this.targetCar.position.z + this.cameraFollowOffsetZ
      );
      this.camera.lookAt(
        this.targetCar.position.x, 
        this.targetCar.position.y, 
        this.targetCar.position.z + this.cameraFollowLookAheadZ
      );
    }
    
    // Emit event about camera mode change
    this.eventBus.emit(GameEvents.CAMERA_MODE_CHANGED, { mode: this.cameraFollowMode ? "Follow" : "Fixed" });
  }
  
  updateCameraEffects(physicsData) {
    const { carSpeed, maxSpeed, targetCar } = physicsData;
    
    // Apply camera effects based on speed
    const speedRatio = carSpeed / maxSpeed;
    this.camera.fov = this.initialFOV + (this.maxFOVIncrease * speedRatio);
    this.camera.updateProjectionMatrix();
    
    // Update camera position in follow mode
    if (this.cameraFollowMode && targetCar) {
      // Position camera behind the car so the car is visible
      this.camera.position.x = targetCar.position.x;
      this.camera.position.y = targetCar.position.y + this.cameraFollowOffsetY;
      this.camera.position.z = targetCar.position.z + this.cameraFollowOffsetZ;
      
      // Look at the car and slightly ahead
      this.camera.lookAt(
        targetCar.position.x, 
        targetCar.position.y, 
        targetCar.position.z + this.cameraFollowLookAheadZ
      );
    }
    
    // Add camera shake based on speed
    if (carSpeed > 0) {
      const shakeAmount = this.maxCameraShake * speedRatio;
      
      if (this.cameraFollowMode && targetCar) {
        // In follow mode, keep x position aligned with car
        this.camera.position.x = targetCar.position.x + (Math.random() - 0.5) * shakeAmount;
        this.camera.position.y = targetCar.position.y + this.cameraFollowOffsetY + (Math.random() - 0.5) * shakeAmount;
      } else {
        // In fixed mode, apply shake to both x and y
        this.camera.position.y = 3 + (Math.random() - 0.5) * shakeAmount;
        this.camera.position.x = (Math.random() - 0.5) * shakeAmount;
      }
    }
  }
  
  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  

  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  getCameraMode() {
    return this.cameraFollowMode ? "Follow" : "Fixed";
  }

  provideScene() {
    // Provide the scene to components that request it
    this.eventBus.emit(GameEvents.SCENE_READY, this.scene);
  }

  handlePlayerCarCreated(playerCar) {
    // Set the player car as the target for camera following
    this.setTargetCar(playerCar);
    console.log('Camera target set to player car');
  }
}
