import * as THREE from 'three';
import CarBuilder from '../builders/CarBuilder.js';
import { GameEvents } from '../EventBus.js';

export default class VehicleComponent {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.playerCar = null;
      
      this.eventBus.subscribe(GameEvents.GAME_RESTART, this.handleRestart.bind(this));
    }
    
    init() {
      this.createPlayerCar();
      // Notify other systems about the player car
      this.eventBus.emit(GameEvents.VEHICLES_PLAYER_CAR_CREATED, this.playerCar);
    }
    
    createPlayerCar() {
      this.playerCar = new THREE.Group();
      const carBuilder = new CarBuilder();
      carBuilder.createCarModel(this.playerCar, 0xff0000);
      
      this.playerCar.position.set(0, 0, 0);
      this.eventBus.emit(GameEvents.SCENE_ADD, this.playerCar);
    }
    
    getPlayerCar() {
      return this.playerCar;
    }
    

    handleRestart() {
      console.log('VehicleComponent: Restarting game...');
      // Reset player car
      if (this.playerCar) {
        this.playerCar.position.set(0, 0, 0);
        this.eventBus.emit(GameEvents.SCENE_ADD, this.playerCar);
        this.eventBus.emit(GameEvents.VEHICLES_PLAYER_CAR_CREATED, this.playerCar);
      }
    }
}