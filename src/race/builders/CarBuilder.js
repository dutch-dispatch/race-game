import * as THREE from 'three';

// CarBuilder class for creating car models
export default class CarBuilder {
  // Create a car model with specified color and type
  createCarModel(carGroup, bodyColor, isPlayerCar = true, orientation = "forward") {
    const carLength = isPlayerCar ? 2 : 1.8;
    
    // Create car body
    const bodyGeometry = new THREE.BoxGeometry(1, 0.5, carLength);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.y = 0.25; // Half of the height
    carBody.castShadow = true;
    carBody.receiveShadow = true;
    carGroup.add(carBody);
    
    // Create car roof (smaller rectangle with colored roof and blue glass)
    const roofGeometry = new THREE.BoxGeometry(0.8, 0.3, isPlayerCar ? 1.2 : 0.9);
    
    // Create materials for different sides of the roof
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x0066cc }), // Right side (blue glass)
      new THREE.MeshStandardMaterial({ color: 0x0066cc }), // Left side (blue glass)
      new THREE.MeshStandardMaterial({ color: bodyColor }), // Top (same as body color)
      new THREE.MeshStandardMaterial({ color: bodyColor }), // Bottom (same as body color)
      new THREE.MeshStandardMaterial({ color: 0x0066cc }), // Front (blue glass)
      new THREE.MeshStandardMaterial({ color: 0x0066cc })  // Back (blue glass)
    ];
    
    const carRoof = new THREE.Mesh(roofGeometry, materials);
    carRoof.position.y = 0.65; // Position on top of the body
    carRoof.castShadow = true;
    carRoof.receiveShadow = true;
    
    // For citizen cars, adjust roof position slightly forward
    if (!isPlayerCar) {
      carRoof.position.z = -0.2;
    }
    
    carGroup.add(carRoof);
    
    // Create common materials
    const plateMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.5
    });
    
    // Add front details (yellow headlights and license plate)
    const frontLightGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.06);
    const frontLightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffcc00,
      emissive: 0xffcc00,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });
    
    // Left front light
    const leftFrontLight = new THREE.Mesh(frontLightGeometry, frontLightMaterial);
    leftFrontLight.position.x = -0.4;
    leftFrontLight.position.y = 0.25;
    leftFrontLight.position.z = -carLength / 2 - 0.02;
    leftFrontLight.castShadow = true;
    leftFrontLight.receiveShadow = true;
    carGroup.add(leftFrontLight);
    
    // Right front light
    const rightFrontLight = new THREE.Mesh(frontLightGeometry, frontLightMaterial);
    rightFrontLight.position.x = 0.4;
    rightFrontLight.position.y = 0.25;
    rightFrontLight.position.z = -carLength / 2 - 0.02;
    rightFrontLight.castShadow = true;
    rightFrontLight.receiveShadow = true;
    carGroup.add(rightFrontLight);
    
    // Front license plate
    const frontPlateGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.08);
    const frontLicensePlate = new THREE.Mesh(frontPlateGeometry, plateMaterial);
    frontLicensePlate.position.y = 0.25;
    frontLicensePlate.position.z = -carLength / 2 - 0.03;
    frontLicensePlate.castShadow = true;
    frontLicensePlate.receiveShadow = true;
    carGroup.add(frontLicensePlate);
    
    // Add back details (red brake lights and license plate)
    const backLightGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.06);
    const backLightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });
    
    // Left back light
    const leftBackLight = new THREE.Mesh(backLightGeometry, backLightMaterial);
    leftBackLight.position.x = -0.4;
    leftBackLight.position.y = 0.25;
    leftBackLight.position.z = carLength / 2 + 0.02;
    leftBackLight.castShadow = true;
    leftBackLight.receiveShadow = true;
    carGroup.add(leftBackLight);
    
    // Right back light
    const rightBackLight = new THREE.Mesh(backLightGeometry, backLightMaterial);
    rightBackLight.position.x = 0.4;
    rightBackLight.position.y = 0.25;
    rightBackLight.position.z = carLength / 2 + 0.02;
    rightBackLight.castShadow = true;
    rightBackLight.receiveShadow = true;
    carGroup.add(rightBackLight);
    
    // Back license plate
    const backPlateGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.08);
    const backLicensePlate = new THREE.Mesh(backPlateGeometry, plateMaterial);
    backLicensePlate.position.y = 0.25;
    backLicensePlate.position.z = carLength / 2 + 0.03;
    backLicensePlate.castShadow = true;
    backLicensePlate.receiveShadow = true;
    carGroup.add(backLicensePlate);
    
    // Add wheels to the car
    const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
    
    // Front left wheel
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.rotation.z = Math.PI / 2; // Rotate to make cylinder horizontal
    frontLeftWheel.position.set(-0.6, 0.2, -carLength / 2 + 0.3);
    frontLeftWheel.castShadow = true;
    frontLeftWheel.receiveShadow = true;
    carGroup.add(frontLeftWheel);
    
    // Front right wheel
    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.rotation.z = Math.PI / 2;
    frontRightWheel.position.set(0.6, 0.2, -carLength / 2 + 0.3);
    frontRightWheel.castShadow = true;
    frontRightWheel.receiveShadow = true;
    carGroup.add(frontRightWheel);
    
    // Rear left wheel
    const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearLeftWheel.rotation.z = Math.PI / 2;
    rearLeftWheel.position.set(-0.6, 0.2, carLength / 2 - 0.3);
    rearLeftWheel.castShadow = true;
    rearLeftWheel.receiveShadow = true;
    carGroup.add(rearLeftWheel);
    
    // Rear right wheel
    const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearRightWheel.rotation.z = Math.PI / 2;
    rearRightWheel.position.set(0.6, 0.2, carLength / 2 - 0.3);
    rearRightWheel.castShadow = true;
    rearRightWheel.receiveShadow = true;
    carGroup.add(rearRightWheel);
    
    // If the car should move backward, rotate the entire car 180 degrees around Y axis
    if (orientation === "backward") {
      carGroup.rotation.y = Math.PI; // 180 degrees rotation
    }
    
    return carGroup;
  }

  // Create a truck model with specified colors
  createTruckModel(carGroup, bodyColor, orientation = "forward") {
    const cabLength = 1.2;
    const cargoLength = 2.0;
    
    // Create truck cab (similar to car body but shorter)
    const cabGeometry = new THREE.BoxGeometry(1.1, 0.7, cabLength);
    const cabMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
    const truckCab = new THREE.Mesh(cabGeometry, cabMaterial);
    truckCab.position.y = 0.35;
    truckCab.position.z = -cargoLength/2; // Position cab at the front
    truckCab.castShadow = true;
    truckCab.receiveShadow = true;
    carGroup.add(truckCab);
    
    // Create cabin roof with windows
    const roofGeometry = new THREE.BoxGeometry(0.9, 0.3, 0.8);
    
    // Create materials for different sides of the roof
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x0066cc }), // Right side (blue glass)
      new THREE.MeshStandardMaterial({ color: 0x0066cc }), // Left side (blue glass)
      new THREE.MeshStandardMaterial({ color: bodyColor }), // Top (same as body color)
      new THREE.MeshStandardMaterial({ color: bodyColor }), // Bottom (same as body color)
      new THREE.MeshStandardMaterial({ color: 0x0066cc }), // Front (blue glass)
      new THREE.MeshStandardMaterial({ color: 0x0066cc })  // Back (blue glass)
    ];
    
    const cabRoof = new THREE.Mesh(roofGeometry, materials);
    cabRoof.position.y = 0.7;
    cabRoof.position.z = -cargoLength/2;
    cabRoof.castShadow = true;
    cabRoof.receiveShadow = true;
    carGroup.add(cabRoof);
    
    // Create cargo container - lifted slightly higher
    const cargoGeometry = new THREE.BoxGeometry(1.2, 1.2, cargoLength);
    const cargoMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xdddddd,
      roughness: 0.6
    });
    const cargoContainer = new THREE.Mesh(cargoGeometry, cargoMaterial);
    cargoContainer.position.y = 0.7; // Increased from 0.6 to lift container up
    cargoContainer.position.z = cargoLength/4; // Position cargo at the back
    cargoContainer.castShadow = true;
    cargoContainer.receiveShadow = true;
    carGroup.add(cargoContainer);
    
    // Create common materials
    const plateMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.5
    });
    
    // Add front details (yellow headlights and license plate)
    const frontLightGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.06);
    const frontLightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffcc00,
      emissive: 0xffcc00,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });
    
    // Front lights
    const leftFrontLight = new THREE.Mesh(frontLightGeometry, frontLightMaterial);
    leftFrontLight.position.x = -0.4;
    leftFrontLight.position.y = 0.35;
    leftFrontLight.position.z = -cargoLength/2 - cabLength/2 - 0.02;
    leftFrontLight.castShadow = true;
    leftFrontLight.receiveShadow = true;
    carGroup.add(leftFrontLight);
    
    const rightFrontLight = new THREE.Mesh(frontLightGeometry, frontLightMaterial);
    rightFrontLight.position.x = 0.4;
    rightFrontLight.position.y = 0.35;
    rightFrontLight.position.z = -cargoLength/2 - cabLength/2 - 0.02;
    rightFrontLight.castShadow = true;
    rightFrontLight.receiveShadow = true;
    carGroup.add(rightFrontLight);
    
    // Front license plate
    const frontPlateGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.08);
    const frontLicensePlate = new THREE.Mesh(frontPlateGeometry, plateMaterial);
    frontLicensePlate.position.y = 0.35;
    frontLicensePlate.position.z = -cargoLength/2 - cabLength/2 - 0.03;
    frontLicensePlate.castShadow = true;
    frontLicensePlate.receiveShadow = true;
    carGroup.add(frontLicensePlate);
    
    // Back lights - adjusted to be more visible
    const backLightGeometry = new THREE.BoxGeometry(0.18, 0.18, 0.08);
    const backLightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.7, // Increased intensity
      roughness: 0.3
    });
    
    const leftBackLight = new THREE.Mesh(backLightGeometry, backLightMaterial);
    leftBackLight.position.x = -0.5;
    leftBackLight.position.y = 0.4; // Raised slightly
    leftBackLight.position.z = cargoLength/2 + 0.04; // Extended further back
    leftBackLight.castShadow = true;
    leftBackLight.receiveShadow = true;
    carGroup.add(leftBackLight);
    
    const rightBackLight = new THREE.Mesh(backLightGeometry, backLightMaterial);
    rightBackLight.position.x = 0.5;
    rightBackLight.position.y = 0.4; // Raised slightly
    rightBackLight.position.z = cargoLength/2 + 0.04; // Extended further back
    rightBackLight.castShadow = true;
    rightBackLight.receiveShadow = true;
    carGroup.add(rightBackLight);
    
    // Back license plate - adjusted to be more visible
    const backPlateGeometry = new THREE.BoxGeometry(0.7, 0.2, 0.08);
    const backLicensePlate = new THREE.Mesh(backPlateGeometry, plateMaterial);
    backLicensePlate.position.y = 0.4; // Raised slightly
    backLicensePlate.position.z = cargoLength/2 + 0.05; // Extended further back
    backLicensePlate.castShadow = true;
    backLicensePlate.receiveShadow = true;
    carGroup.add(backLicensePlate);
    
    // Add wheels to the truck - larger and more of them
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
    
    // Front wheels (cab)
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.rotation.z = Math.PI / 2;
    frontLeftWheel.position.set(-0.6, 0.25, -cargoLength/2 - cabLength/4);
    frontLeftWheel.castShadow = true;
    frontLeftWheel.receiveShadow = true;
    carGroup.add(frontLeftWheel);
    
    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.rotation.z = Math.PI / 2;
    frontRightWheel.position.set(0.6, 0.25, -cargoLength/2 - cabLength/4);
    frontRightWheel.castShadow = true;
    frontRightWheel.receiveShadow = true;
    carGroup.add(frontRightWheel);
    
    // Middle wheels (cargo front)
    const midLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    midLeftWheel.rotation.z = Math.PI / 2;
    midLeftWheel.position.set(-0.6, 0.25, -cargoLength/4);
    midLeftWheel.castShadow = true;
    midLeftWheel.receiveShadow = true;
    carGroup.add(midLeftWheel);
    
    const midRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    midRightWheel.rotation.z = Math.PI / 2;
    midRightWheel.position.set(0.6, 0.25, -cargoLength/4);
    midRightWheel.castShadow = true;
    midRightWheel.receiveShadow = true;
    carGroup.add(midRightWheel);
    
    // Rear wheels (cargo back) - moved more to the back
    const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearLeftWheel.rotation.z = Math.PI / 2;
    rearLeftWheel.position.set(-0.6, 0.25, cargoLength/2 - 0.2); // Moved closer to the end
    rearLeftWheel.castShadow = true;
    rearLeftWheel.receiveShadow = true;
    carGroup.add(rearLeftWheel);
    
    const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearRightWheel.rotation.z = Math.PI / 2;
    rearRightWheel.position.set(0.6, 0.25, cargoLength/2 - 0.2); // Moved closer to the end
    rearRightWheel.castShadow = true;
    rearRightWheel.receiveShadow = true;
    carGroup.add(rearRightWheel);
    
    // If the truck should move backward, rotate the entire truck 180 degrees
    if (orientation === "backward") {
      carGroup.rotation.y = Math.PI;
    }
    
    return carGroup;
  }
}
