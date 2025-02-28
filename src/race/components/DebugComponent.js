import { GameEvents } from '../EventBus.js';

export default class DebugComponent {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.counts = {
            trees: 0,
            cars: 0,
            buildings: 0,
            bricks: 0
        };

        // Get DOM elements
        this.treesCountElement = document.getElementById('trees-count');
        this.carsCountElement = document.getElementById('cars-count');
        this.buildingsCountElement = document.getElementById('buildings-count');
        this.bricksCountElement = document.getElementById('bricks-count');

        // Subscribe to events
        this.eventBus.subscribe(GameEvents.SCENE_ADD, this.handleObjectAdded.bind(this));
        this.eventBus.subscribe(GameEvents.SCENE_REMOVE, this.handleObjectRemoved.bind(this));
        this.eventBus.subscribe(GameEvents.GAME_RESTART, this.handleGameRestart.bind(this));
    }

    handleObjectAdded(object) {
        if (!object) return;
        if (!object.userData.type){
            return
        }
        // Check object type through userData or geometry
        if (object.userData && object.userData.type === 'tree') {
            this.counts.trees++;
        } else if (object.userData && (object.userData.type === 'vehicle')) {
            this.counts.cars++;
        } else if (object.userData && object.userData.type === 'building') {
            this.counts.buildings++;
        } else if (object.userData && (object.userData.type === 'brick')) {
            this.counts.bricks++;
        }

        this.updateDisplay();
    }

    handleObjectRemoved(object) {
        if (!object) return;
        if (!object.userData.type){
            return;
        }
        // Check object type through userData or geometry
        if (object.userData && object.userData.type === 'tree') {
            this.counts.trees = Math.max(0, this.counts.trees - 1);
        } else if (object.userData && (object.userData.type === 'vehicle')) {
            this.counts.cars = Math.max(0, this.counts.cars - 1);
        } else if (object.userData && object.userData.type === 'building') {
            this.counts.buildings = Math.max(0, this.counts.buildings - 1);
        } else if (object.userData && (object.userData.type === 'brick')) {
            this.counts.bricks = Math.max(0, this.counts.bricks - 1);
        }

        this.updateDisplay();
    }

    handleGameRestart() {
        // Reset all counts
        Object.keys(this.counts).forEach(key => {
            if (key === 'trees') {
                this.counts[key] = this.counts[key];
            }else {
                this.counts[key] = 0;
            }
        });
        this.updateDisplay();
    }

    updateDisplay() {
        // Update DOM elements with current counts
        if (this.treesCountElement) this.treesCountElement.textContent = this.counts.trees;
        if (this.carsCountElement) this.carsCountElement.textContent = this.counts.cars;
        if (this.buildingsCountElement) this.buildingsCountElement.textContent = this.counts.buildings;
        if (this.bricksCountElement) this.bricksCountElement.textContent = this.counts.bricks;
    }
}