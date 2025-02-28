export default class EnvironmentConfig {
    constructor() {
        // Road dimensions
        this.roadWidth = 20;
        this.roadLength = 2000;
        this.maxLateralPosition = this.roadWidth / 2;

        // Road markings
        this.markingLength = 5;
        this.markingGap = 5;
        this.markingWidth = 0.5;

        // Barriers
        this.barrierCount = 40;
        this.barrierSpacing = 15;

        // Ground
        this.groundWidth = 1000;
        this.groundLength = 1000;

        // Obstacles
        this.obstacleGenerationInterval = 1500;
        this.maxObstacles = 15;
        this.minObstacles = 8;
        this.obstacleSpawnDistance = 100;
        this.obstacleSpacing = 20;

        // Roadside objects
        this.objectCount = 40;
        this.objectSpacing = 30;
        this.objectDistance = 20;

        // Citizen cars
        this.citizenCarGenerationInterval = 2000;
        this.citizenCarSpawnDistance = 120;
        this.citizenCarMinSpeed = 45;
        this.citizenCarMaxSpeed = 120;
        this.citizenCarTruckProbability = 0.1;
        this.citizenCarBackwardProbability = 0.7;
    }
}