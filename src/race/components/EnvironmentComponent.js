import * as THREE from 'three';
import SkyManager from '../environment/SkyManager.js';
import RoadsideObjectManager from '../environment/RoadsideObjectManager.js';
import RoadManager from '../environment/RoadManager.js';
import ObstaclesManager from '../environment/ObstaclesManager.js';
import CitizenCarManager from '../environment/CitizenCarManager.js';
import EnvironmentConfig from '../environment/EnvironmentConfig.js';
import { GameEvents } from '../EventBus.js';

export default class EnvironmentComponent {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.ground = null;
      this.config = new EnvironmentConfig();
      
      // Initialize managers with config
      this.skyManager = new SkyManager(this.eventBus); 
      this.roadManager = new RoadManager(this.eventBus, this.config);
      this.obstaclesManager = new ObstaclesManager(this.eventBus, this.config);
      this.roadsideObjectManager = new RoadsideObjectManager(this.eventBus, this.config);
      this.citizenCarManager = new CitizenCarManager(this.eventBus, this.config);
    }
    
    init() {
      this.createGround();
      
      // Initialize managers
      this.skyManager.init();
      this.roadManager.init();
      this.roadsideObjectManager.init();
      this.obstaclesManager.init();
      this.citizenCarManager.init();
      
      // Emit max lateral position to physics system
      this.eventBus.emit(GameEvents.ROAD_MAX_LATERAL_POSITION, this.config.maxLateralPosition);
    }
    
    createGround() {
      const groundGeometry = new THREE.PlaneGeometry(this.config.groundWidth, this.config.groundLength);
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3d9e3d,
        roughness: 0.9,
        metalness: 0.0,
      });
      this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
      this.ground.rotation.x = -Math.PI / 2;
      this.ground.position.y = -0.1;
      this.ground.position.z = -this.config.groundLength/4;
      this.ground.receiveShadow = true;
      this.ground.userData.type = 'ground';
      
      this.eventBus.emit('scene:add', this.ground);
    }
}