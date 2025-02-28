import { GameEvents } from './EventBus.js';

/**
 * Manages all user inputs for the racing game, including keyboard, touch, and button interactions
 */
export default class InputManager {
  /**
   * Creates a new InputManager
   * @param {HTMLElement} canvas - The game canvas element
   * @param {Function} cameraToggleCallback - Callback to toggle camera mode
   * @param {Function} restartCallback - Callback to restart the game
   */
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.controlState = {
      upPressed: false,
      downPressed: false,
      leftPressed: false,
      rightPressed: false
    };
    this.isGameOver = false;
    
    // Set up event listeners
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Touch support for mobile
    document.addEventListener('touchstart', this.handleTouch.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    
    // Subscribe to game over events
    this.eventBus.subscribe(GameEvents.GAME_OVER, () => {
      this.setGameOver(true);
    });
    
    // Subscribe to game restart events
    this.eventBus.subscribe(GameEvents.GAME_RESTART, () => {
      this.setGameOver(false);
    });
  }
  
  handleKeyDown(event) {
    if (this.isGameOver) {
      if (event.code === 'Space') {
        // Restart game on space press if game over
        this.eventBus.emit(GameEvents.GAME_RESTART);
        return;
      }
      return;
    }
    
    switch(event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.controlState.upPressed = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.controlState.downPressed = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.controlState.leftPressed = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.controlState.rightPressed = true;
        break;
      case 'KeyC':
        this.eventBus.emit('camera:toggle:mode');
        break;
      default:
        break;
    }
    
    this.emitControlStateUpdate();
  }
  
  handleKeyUp(event) {
    switch(event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.controlState.upPressed = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.controlState.downPressed = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.controlState.leftPressed = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.controlState.rightPressed = false;
        break;
      default:
        break;
    }
    
    this.emitControlStateUpdate();
  }
  
  emitControlStateUpdate() {
    this.eventBus.emit('control:state:updated', { ...this.controlState });
  }
  
  // Touch controls implementation
  handleTouch(event) {
    if (this.isGameOver) {
      // Restart game on touch if game over
      this.eventBus.emit(GameEvents.GAME_RESTART);
      return;
    }
    
    if (event.touches.length === 0) return;
    
    const touch = event.touches[0];
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.lastTouchX = touch.clientX;
    this.lastTouchY = touch.clientY;
    
    this.updateTouchControls(touch.clientX, touch.clientY, width, height);
  }
  
  handleTouchMove(event) {
    if (this.isGameOver || event.touches.length === 0) return;
    
    const touch = event.touches[0];
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.lastTouchX = touch.clientX;
    this.lastTouchY = touch.clientY;
    
    this.updateTouchControls(touch.clientX, touch.clientY, width, height);
  }
  
  updateTouchControls(x, y, width, height) {
    // Reset control state
    this.controlState.leftPressed = false;
    this.controlState.rightPressed = false;
    this.controlState.upPressed = false;
    this.controlState.downPressed = false;
    
    // Horizontal controls - left/right based on touch position
    if (x < width / 3) {
      this.controlState.leftPressed = true;
    } else if (x > width * 2/3) {
      this.controlState.rightPressed = true;
    }
    
    // Vertical controls - up/down based on touch position
    if (y < height / 2) {
      this.controlState.upPressed = true;
    } else {
      this.controlState.downPressed = true;
    }
    
    this.emitControlStateUpdate();
  }
  
  handleTouchEnd() {
    // Reset all controls when touch ends
    this.controlState.upPressed = false;
    this.controlState.downPressed = false;
    this.controlState.leftPressed = false;
    this.controlState.rightPressed = false;
    
    this.emitControlStateUpdate();
  }
  
  setGameOver(isOver) {
    this.isGameOver = isOver;
  }
  
  getControlState() {
    return { ...this.controlState };
  }
}
