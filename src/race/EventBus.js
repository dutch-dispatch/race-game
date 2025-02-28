export default class EventBus {
  constructor() {
    this.listeners = {};
  }
  
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.unsubscribe(event, callback);
  }
  
  unsubscribe(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
  
  emit(event, data) {
    if (this.listeners[event]) {
      // Make a copy of listeners to avoid issues if a callback modifies the listeners
      const callbacks = [...this.listeners[event]];
      callbacks.forEach(callback => callback(data));
    }
  }
  
  // Method aliases for compatibility with legacy code
  addEventListener(eventName, callback) {
    return this.subscribe(eventName, callback);
  }
  
  removeEventListener(eventName, callback) {
    this.unsubscribe(eventName, callback);
  }
  
  dispatchEvent(eventName, data) {
    this.emit(eventName, data);
  }
  
  clearEventListeners(eventName) {
    if (eventName) {
      this.listeners[eventName] = [];
    } else {
      this.listeners = {};
    }
  }
}

// Define common event names for game events
export const GameEvents = {
  // Collision events
  COLLISION_BRICK_DESTROYED: 'collision:brick:destroyed',
  COLLISION_BRICK_HIT: 'collision:brick:hit',
  COLLISION_CITIZENCAR_CITIZENCAR: 'collision:citizencar:citizencar',
  COLLISION_CITIZENCAR_BRICK: 'collision:citizencar:brick',
  COLLISION_CITIZENCAR: 'collision:citizenCar',
  COLLISION_DETECTED: 'collision:detected',
  COLLISION_SYSTEM_REQUEST: 'collision:system:request',
  
  // Road and environment events
  ROAD_MAX_LATERAL_POSITION: 'road:max_lateral_position',
  ROAD_INITIALIZED: 'road:initialized',
  ROAD_UPDATED: 'road:updated',
  OBSTACLES_UPDATED: 'obstacles:updated',
  CITIZENCARS_UPDATED: 'citizenCars:updated',
  
  // Game state events
  GAME_OVER: 'game:over',
  GAME_RESTART: 'game:restart',
  GAME_STATE_RESET: 'game:state:reset',
  GAME_FRAME: 'game:frame',
  
  // Physics events
  PHYSICS_UPDATED: 'physics:updated',
  
  // UI events
  SCORE_UPDATED: 'score:updated',
  DISTANCE_UPDATED: 'distance:updated',
  UI_SHOW_GAMEOVER: 'ui:show:gameover',
  
  // Scene management events
  SCENE_ADD: 'scene:add',
  SCENE_REMOVE: 'scene:remove',
  SCENE_READY: 'scene:ready',
  SCENE_REQUEST: 'scene:request',
  
  // Vehicle events
  VEHICLES_PLAYER_CAR_CREATED: 'vehicles:playerCar:created',
  
  // Camera events
  CAMERA_TOGGLE_MODE: 'camera:toggle:mode',
  CAMERA_MODE_CHANGED: 'camera:mode:changed',
  
  // Window events
  WINDOW_RESIZE: 'window:resize'
};
