import { GameEvents } from '../EventBus.js';

export default class UIComponent {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.score = 0;
    this.distance = 0;
    this.speedDisplay = document.getElementById('speed-display');
    this.scoreDisplay = document.getElementById('score-display');
    this.distanceDisplay = document.getElementById('distance-display');
    this.cameraModeDisplay = document.getElementById('camera-mode-display');
    this.gameOverDisplay = null;
    this.isGameOver = false;
  }
  
  init() {
    this.createGameOverDisplay();
    
    // Subscribe to events
    this.eventBus.subscribe(GameEvents.PHYSICS_UPDATED, data => this.handlePhysicsUpdated(data));
    this.eventBus.subscribe(GameEvents.DISTANCE_UPDATED, data => this.updateDistanceDisplay(data));
    this.eventBus.subscribe(GameEvents.UI_SHOW_GAMEOVER, data => this.showGameOver(data));
    this.eventBus.subscribe(GameEvents.SCORE_UPDATED, () => {
      this.score++;
      this.updateScoreDisplay(this.score);
    });
    this.eventBus.subscribe(GameEvents.GAME_RESTART, () => this.handleGameRestart());
    this.eventBus.subscribe('camera:mode:changed', data => this.updateCameraModeDisplay(data));
    
    // Initialize displays
    this.updateDashboard();
  }
  
  createGameOverDisplay() {
    this.gameOverDisplay = document.createElement('div');
    this.gameOverDisplay.style.position = 'absolute';
    this.gameOverDisplay.style.top = '30%'; // Move higher up above horizon
    this.gameOverDisplay.style.left = '50%';
    this.gameOverDisplay.style.transform = 'translate(-50%, -50%)';
    this.gameOverDisplay.style.fontSize = '24px';
    this.gameOverDisplay.style.color = 'white';
    this.gameOverDisplay.style.fontWeight = 'bold';
    this.gameOverDisplay.style.textAlign = 'center';
    this.gameOverDisplay.style.padding = '20px 40px';
    this.gameOverDisplay.style.backgroundColor = 'rgba(64, 64, 64, 0.9)'; // Semi-transparent grey background
    this.gameOverDisplay.style.borderRadius = '10px'; // Rounded corners
    this.gameOverDisplay.style.display = 'none';
    this.gameOverDisplay.style.zIndex = '1000'; // Ensure it's above the game canvas
    document.body.appendChild(this.gameOverDisplay);
  }
  
  handlePhysicsUpdated(data) {
    if (data) {
      if (data.carSpeed !== undefined) {
        this.updateSpeedDisplay(data.carSpeed);
      }
      if (data.distanceTraveled !== undefined) {
        this.distance = data.distanceTraveled;
        this.updateDistanceDisplay({ distance: this.distance });
      }
    }
  }
  
  updateSpeedDisplay(speed) {
    if (this.speedDisplay) {
      // Get the speed in km/h
      const speedKmh = Math.round(speed * 500);
      this.speedDisplay.textContent = `Speed: ${speedKmh} km/h`;
      
      // Add warning effect for dangerous speed
      if (speedKmh >= 100) {
        this.speedDisplay.style.color = 'red';
        this.speedDisplay.style.textShadow = '0 0 10px red';
      } else {
        this.speedDisplay.style.color = '';
        this.speedDisplay.style.textShadow = '';
      }
    }
  }
  
  updateScoreDisplay(score) {
    this.score = score;
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = `Score: ${this.score} points`;
    }
  }
  
  updateDistanceDisplay(data) {
    if (data && data.distance !== undefined) {
      this.distance = data.distance;
    }
    
    if (this.distanceDisplay) {
      // Calculate distance in km (with 2 decimal places)
      const distanceKm = (this.distance / 1000).toFixed(2);
      
      // Add a sanity check to avoid unrealistic values
      const displayDistance = parseFloat(distanceKm) > 10000 ? "0.00" : distanceKm;
      this.distanceDisplay.textContent = `Distance: ${displayDistance} km`;
    }
  }
  
  updateCameraModeDisplay(data) {
    if (this.cameraModeDisplay) {
      const modeText = data.mode;
      this.cameraModeDisplay.textContent = `Camera: ${modeText} (Press C to toggle)`;
    }
  }
  
  showGameOver(data) {
    this.isGameOver = true;
    const distanceKm = (this.distance / 1000).toFixed(2);
    
    this.gameOverDisplay.innerHTML = `You lost!<br>You scored ${this.score} points<br>and traveled ${distanceKm} kms<br><br>Press SPACE or tap here to restart`;
    this.gameOverDisplay.style.display = 'block';
    this.gameOverDisplay.style.cursor = 'pointer'; // Add pointer cursor to indicate it's clickable
    
    // Add click event listener to game over display
    this.gameOverDisplay.addEventListener('click', () => {
      this.eventBus.emit(GameEvents.GAME_RESTART);
    }, { once: true });
  }
  
  handleGameRestart() {
    // Reset local UI state
    this.isGameOver = false;
    this.score = 0;
    this.distance = 0;
    
    // Hide game over display
    this.gameOverDisplay.style.display = 'none';
    
    // Update dashboard
    this.updateDashboard();
  }
  
  updateDashboard() {
    this.updateScoreDisplay(this.score);
    this.updateDistanceDisplay({ distance: this.distance });
    this.updateSpeedDisplay(0); // Default to zero speed
  }
}
