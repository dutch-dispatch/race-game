import { GameEvents } from '../EventBus.js';

export default class GameStateComponent {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.score = 0;
    this.distanceTraveled = 0;
    this.isGameOver = false;
    this.isExplosionInProgress = false;
    
    // Subscribe to events
    this.eventBus.subscribe(GameEvents.COLLISION_BRICK_DESTROYED, this.increaseScore.bind(this));
    this.eventBus.subscribe(GameEvents.PHYSICS_UPDATED, this.updateDistance.bind(this));
    this.eventBus.subscribe(GameEvents.GAME_OVER, this.setGameOver.bind(this));
    this.eventBus.subscribe(GameEvents.GAME_RESTART, this.restartGame.bind(this));
  }
  
  increaseScore() {
    this.score += 1;
    this.eventBus.emit(GameEvents.SCORE_UPDATED, this.score);
  }
  
  updateDistance(data) {
    // Update distance based on speed and delta time
    if (data && data.carSpeed !== undefined && data.deltaTime !== undefined) {
      // Calculate distance traveled this frame in meters
      const distanceTraveledThisFrame = data.carSpeed * 500 * data.deltaTime;
      this.distanceTraveled += distanceTraveledThisFrame;
      
      // Apply sanity check to prevent unrealistic values
      if (this.distanceTraveled > 10000000) {
        this.distanceTraveled = 0;
      }
      
      this.eventBus.emit(GameEvents.DISTANCE_UPDATED, { distance: this.distanceTraveled });
    }
  }
  
  setGameOver() {
    this.isGameOver = true;
    this.eventBus.emit(GameEvents.UI_SHOW_GAMEOVER, {
      score: this.score,
      distance: this.distanceTraveled
    });
  }
  
  restartGame() {
    // Reset game state
    this.score = 0;
    this.distanceTraveled = 0;
    this.isGameOver = false;
    this.isExplosionInProgress = false;
    
    this.eventBus.emit(GameEvents.GAME_STATE_RESET);
  }
}