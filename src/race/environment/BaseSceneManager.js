import { GameEvents } from '../EventBus.js';

export default class BaseSceneManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }
  
  addToScene(object) {
    this.eventBus.emit(GameEvents.SCENE_ADD, object);
  }
  
  removeFromScene(object) {
    this.eventBus.emit(GameEvents.SCENE_REMOVE, object);
  }
  
  // Common lifecycle methods
  init() {}
  reset() {}
  animate(deltaTime, speed) {}
}

