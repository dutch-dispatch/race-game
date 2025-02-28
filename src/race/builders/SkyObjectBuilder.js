import * as THREE from 'three';

// SkyObjectBuilder class for creating sky objects like airplanes and clouds
export default class SkyObjectBuilder {
  // Create an airplane model with specified parameters
  createAirplaneModel(airplaneGroup, flyLeftToRight = Math.random() > 0.5) {
    // Create a container to correctly orient the airplane
    // This container will be rotated to match flight direction
    const airplaneContainer = new THREE.Group();
    airplaneGroup.add(airplaneContainer);
    
    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x88ccff });
    
    // Airplane body - long white rectangle - aligned along Z axis for proper orientation
    const bodyGeometry = new THREE.BoxGeometry(3, 2, 15);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    airplaneContainer.add(body);
    
    // Wings - two adjusted blocks
    const wingGeometry = new THREE.BoxGeometry(12, 0.5, 6);
    const leftWing = new THREE.Mesh(wingGeometry, bodyMaterial);
    leftWing.position.set(0, 0, 0);
    airplaneContainer.add(leftWing);
    
    // Tail - vertical block
    const tailGeometry = new THREE.BoxGeometry(3, 3, 1);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 1, -7);
    airplaneContainer.add(tail);
    
    // Cockpit - blue block on top
    const cockpitGeometry = new THREE.BoxGeometry(2, 1.5, 3);
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 1, 5);
    airplaneContainer.add(cockpit);
    
    // Position the airplane behind the player
    const startX = flyLeftToRight ? -150 : 150;
    const startZ = 100; // Start behind the player (assuming player is at z=0)
    const height = 50 + Math.random() * 40;
    
    airplaneGroup.position.set(startX, height, startZ);
    
    // Set flight direction angle (in radians)
    // For left-to-right: angle points to positive X and negative Z (towards horizon)
    // For right-to-left: angle points to negative X and negative Z (towards horizon)
    const baseAngle = flyLeftToRight ? -Math.PI / 4 : -Math.PI * 3/4; // -45° or -135°
    const randomVariation = (Math.random() * 0.3) - 0.15; // Small random variation ±0.15 radians
    const flightAngle = baseAngle + randomVariation;
    
    // Rotate the airplane to align with flight direction
    airplaneGroup.rotation.y = flightAngle;
    
    // Set flight properties
    airplaneGroup.userData.type = 'airplane';
    airplaneGroup.userData.speed = 0.8 + Math.random() * 0.4; // Slightly faster for diagonal flight
    airplaneGroup.userData.directionVariation = (Math.random() * 0.001) - 0.0005; // Smaller variations
    airplaneGroup.userData.flightAngle = flightAngle;
    airplaneGroup.userData.flyLeftToRight = flyLeftToRight;
    
    return airplaneGroup;
  }

  // Create a cloud in the sky
  createCloud() {
    const cloudGeometry = new THREE.SphereGeometry(1, 7, 7);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Pure white
      emissive: 0xcccccc, // Add slight emissive glow for brightness
      emissiveIntensity: 0.2,
      flatShading: true,
      transparent: true,
      opacity: 0.9 // Increased opacity for more solid white appearance
    });
    
    // Create a cloud group made of multiple spheres
    const cloudGroup = new THREE.Group();
      
    // Random cloud size - increased base and maximum size
    const cloudSize = 5 + Math.random() * 3;
      
    // Add 3-7 sphere meshes for each cloud
    const sphereCount = 3 + Math.floor(Math.random() * 5);
      
    for (let j = 0; j < sphereCount; j++) {
      const sphere = new THREE.Mesh(cloudGeometry, cloudMaterial.clone());
        
      // Randomize sphere size and position within the cloud
      const scale = 3 + Math.random() * 1.0; // Increased scale
      sphere.scale.set(scale, scale, scale);
        
      sphere.position.x = (Math.random() - 0.5) * cloudSize;
      sphere.position.y = (Math.random() - 0.5) * cloudSize * 0.5;
      sphere.position.z = (Math.random() - 0.5) * cloudSize;
        
      cloudGroup.add(sphere);
    }
      
    // Position the cloud randomly in the sky
    cloudGroup.position.x = (Math.random() - 0.5) * 300; // Increased spread
    cloudGroup.position.y = 25 + Math.random() * 40; // Adjusted height range
    cloudGroup.position.z = -200 + Math.random() * 400; // Increased depth range
      
    // Add some random rotation
    cloudGroup.rotation.y = Math.random() * Math.PI * 2;
      
    // Set cloud movement properties
    cloudGroup.userData.type = 'cloud';
    cloudGroup.userData.speedX = (Math.random() - 0.5) * 0.02 * 0.5;
    
    return cloudGroup;
  }
}
