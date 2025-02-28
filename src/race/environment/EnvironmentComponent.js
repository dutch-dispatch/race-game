export default class EnvironmentComponent {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.ground = null;
      this.groundWidth = 1000;
      this.groundLength = 1000;
      
      // Initialize managers
      this.skyManager = new SkyManager(this.eventBus); 
      this.roadManager = new RoadManager(this.eventBus);
      this.obstaclesManager = new ObstaclesManager(this.eventBus);
      this.citizenCarManager = new CitizenCarManager(this.eventBus);
    }
    
    // ...existing code...
    
    createGround() {
      const groundGeometry = new THREE.PlaneGeometry(this.groundWidth, this.groundLength);
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3d9e3d,
        roughness: 0.8
      });
      this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
      this.ground.rotation.x = -Math.PI / 2;
      this.ground.position.y = -0.1;
      this.ground.position.z = -this.groundLength/4;
      this.ground.receiveShadow = true;
      this.ground.userData.type = 'ground';
      
      this.eventBus.emit('scene:add', this.ground);
    }
}