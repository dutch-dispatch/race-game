import InputManager from './InputManager.js';
import EventBus, { GameEvents } from './EventBus.js';
import RenderingComponent from './components/RenderingComponent.js';
import GameStateComponent from './components/GameStateComponent.js';
import PhysicsSystem from './PhysicsSystem.js';
import UIComponent from './components/UIComponent.js';
import EnvironmentComponent from './components/EnvironmentComponent.js';
import VehicleComponent from './components/VehicleComponent.js';
import DebugComponent from './components/DebugComponent.js';

class RaceGame {
  constructor() {
    this.canvas = document.getElementById('race-canvas');
    this.eventBus = new EventBus();
    this.components = {};
    this.lastTime = null;
    this.isGameOver = false;
    
    // Register core components
    this.registerComponent('renderer', new RenderingComponent(this.eventBus, this.canvas));
    this.registerComponent('input', new InputManager(this.eventBus));
    this.registerComponent('gameState', new GameStateComponent(this.eventBus));
    this.registerComponent('ui', new UIComponent(this.eventBus));
    this.registerComponent('physics', new PhysicsSystem(this.eventBus));
    this.registerComponent('environment', new EnvironmentComponent(this.eventBus));
    this.registerComponent('vehicles', new VehicleComponent(this.eventBus));
    this.registerComponent('debug', new DebugComponent(this.eventBus));
    
    // Subscribe to game events
    this.eventBus.subscribe(GameEvents.GAME_OVER, () => {
      console.log('Game Over');
      this.isGameOver = true;
    });
    this.eventBus.subscribe(GameEvents.GAME_RESTART, () => {
      console.log('Game Restarted');
      this.isGameOver = false;
      this.lastTime = performance.now();
      this.animate();
    });
    
    // Initialize all components
    Object.values(this.components).forEach(component => {
      if (typeof component.init === 'function') {
        component.init();
      }
    });

    // Add window resize handler
    window.addEventListener('resize', () => {
      this.eventBus.emit('window:resize');
    });
    
    // Start the game loop with proper timing
    this.lastTime = performance.now();
    this.animating = true;
    this.animate();
  }

  registerComponent(name, component) {
    this.components[name] = component;
  }
  
  getComponent(name) {
    return this.components[name];
  }
  
  animate() {
    if (this.isGameOver) return
    
    requestAnimationFrame(() => this.animate());
    
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms (10fps min)
    this.lastTime = currentTime;
    
    // Emit frame update event for all components to respond to
    this.eventBus.emit('game:frame', { deltaTime });
  }
}

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the game
  const game = new RaceGame();
});