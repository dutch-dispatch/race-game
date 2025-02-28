import * as THREE from 'three';

// RoadsideObjectBuilder class for creating roadside objects
export default class RoadsideObjectBuilder {
  // Create a roadside object (tree, house, or unpaved road)
  createRoadsideObject(x, z) {
    // 95% chance for tree, 5% chance for house (removing unpaved road option as it's handled by manager)
    const rand = Math.random();
    if (rand < 0.95) {
      return this.createTree(x, z);
    } else {
      return this.createHouse(x, z);
    }
  }
  
  // Create a single tree
  createTree(x, z) {
    const treeGroup = new THREE.Group();
    treeGroup.userData.type = 'tree';  // Set the type for tracking
    
    // Create trunk with enhanced material properties
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.9,
        metalness: 0.0
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2; // Half of trunk height
    
    // Enable shadows for trunk
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    
    treeGroup.add(trunk);
    
    // Create foliage with enhanced material properties
    const foliageGeometry = new THREE.SphereGeometry(2, 8, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x115511,
        roughness: 1.0,
        metalness: 0.0
    });
    
    // Create 3-5 leaf clusters
    const leafCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < leafCount; i++) {
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial.clone());
        
        // Position leaf clusters on top of the trunk with slight variations
        foliage.position.y = 4 + Math.random() * 2;
        foliage.position.x = (Math.random() - 0.5) * 2;
        foliage.position.z = (Math.random() - 0.5) * 2;
        
        // Random scale for each leaf cluster
        const scale = 0.8 + Math.random() * 0.4;
        foliage.scale.set(scale, scale, scale);
        
        // Enable shadows for foliage
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        
        treeGroup.add(foliage);
    }
    
    // Position and add the tree to the scene
    treeGroup.position.set(x, 0, z);
    
    // Add random rotation for variety
    treeGroup.rotation.y = Math.random() * Math.PI * 2;
    
    return treeGroup;
  }
  
  // Create a house
  createHouse(x, z) {
    const houseGroup = new THREE.Group();
    houseGroup.userData.type = 'building';  // Set the type for tracking
    
    // Create house base with enhanced material properties
    const baseGeometry = new THREE.BoxGeometry(4, 3, 4);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.1
    });
    const houseBase = new THREE.Mesh(baseGeometry, baseMaterial);
    houseBase.position.y = 1.5; // Half of height
    
    // Enable shadows for house base
    houseBase.castShadow = true;
    houseBase.receiveShadow = true;
    
    houseGroup.add(houseBase);
    
    // Create roof with enhanced material properties
    const roofGeometry = new THREE.ConeGeometry(3, 2, 4); // 4-sided pyramid
    const roofMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcc0000,
        roughness: 0.8,
        metalness: 0.1
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 4; // Base height + half of roof height
    roof.rotation.y = Math.PI / 4; // Rotate 45 degrees to align corners with walls
    
    // Enable shadows for roof
    roof.castShadow = true;
    roof.receiveShadow = true;
    
    houseGroup.add(roof);
    
    // Create chimney with enhanced material properties
    const chimneyGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
    const chimneyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x990000,
        roughness: 0.9,
        metalness: 0.1
    });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.y = 4.5; // Position on roof
    chimney.position.x = 1.2; // Offset from center
    chimney.position.z = 1.2; // Offset from center
    
    // Enable shadows for chimney
    chimney.castShadow = true;
    chimney.receiveShadow = true;
    
    houseGroup.add(chimney);
    
    // Create windows with enhanced material properties
    const windowGeometry = new THREE.PlaneGeometry(0.8, 0.8);
    const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0066cc,
        emissive: 0x0066cc,
        emissiveIntensity: 0.2,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.7
    });
    
    // Front windows
    const frontWindow1 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
    frontWindow1.position.set(1, 1.8, 2.01); // Slightly outside the front face
    frontWindow1.castShadow = true;
    frontWindow1.receiveShadow = true;
    houseGroup.add(frontWindow1);
    
    const frontWindow2 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
    frontWindow2.position.set(-1, 1.8, 2.01);
    frontWindow2.castShadow = true;
    frontWindow2.receiveShadow = true;
    houseGroup.add(frontWindow2);
    
    // Right side windows
    const rightWindow1 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
    rightWindow1.position.set(2.01, 1.8, 1);
    rightWindow1.rotation.y = Math.PI / 2;
    rightWindow1.castShadow = true;
    rightWindow1.receiveShadow = true;
    houseGroup.add(rightWindow1);
    
    const rightWindow2 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
    rightWindow2.position.set(2.01, 1.8, -1);
    rightWindow2.rotation.y = Math.PI / 2;
    rightWindow2.castShadow = true;
    rightWindow2.receiveShadow = true;
    houseGroup.add(rightWindow2);
    
    // Left side windows
    const leftWindow1 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
    leftWindow1.position.set(-2.01, 1.8, 1);
    leftWindow1.rotation.y = Math.PI / 2;
    leftWindow1.castShadow = true;
    leftWindow1.receiveShadow = true;
    houseGroup.add(leftWindow1);
    
    const leftWindow2 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
    leftWindow2.position.set(-2.01, 1.8, -1);
    leftWindow2.rotation.y = Math.PI / 2;
    leftWindow2.castShadow = true;
    leftWindow2.receiveShadow = true;
    houseGroup.add(leftWindow2);
    
    // Back windows
    const backWindow1 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
    backWindow1.position.set(1, 1.8, -2.01);
    backWindow1.rotation.y = Math.PI;
    backWindow1.castShadow = true;
    backWindow1.receiveShadow = true;
    houseGroup.add(backWindow1);
    
    const backWindow2 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
    backWindow2.position.set(-1, 1.8, -2.01);
    backWindow2.rotation.y = Math.PI;
    backWindow2.castShadow = true;
    backWindow2.receiveShadow = true;
    houseGroup.add(backWindow2);
    
    // Create white triangle with enhanced material properties
    const triangleShape = new THREE.Shape();
    triangleShape.moveTo(-1.5, 0);
    triangleShape.lineTo(1.5, 0);
    triangleShape.lineTo(0, 1.5);
    triangleShape.lineTo(-1.5, 0);
    
    const triangleGeometry = new THREE.ShapeGeometry(triangleShape);
    const triangleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.1
    });
    const triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
    triangle.position.set(0, 3.2, 2.01); // Place at the front gable
    triangle.castShadow = true;
    triangle.receiveShadow = true;
    houseGroup.add(triangle);
    
    // Add small blue window on the triangle with enhanced material properties
    const atticWindowGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    const atticWindow = new THREE.Mesh(atticWindowGeometry, windowMaterial.clone());
    atticWindow.position.set(0, 3.8, 2.02); // Slightly in front of the triangle
    atticWindow.castShadow = true;
    atticWindow.receiveShadow = true;
    houseGroup.add(atticWindow);
    
    // Position the house
    houseGroup.position.set(x, 0, z);
    
    // Random rotation, but align with cardinal directions (0, 90, 180, 270 degrees)
    const rotations = [0, Math.PI/2, Math.PI, Math.PI*1.5];
    houseGroup.rotation.y = rotations[Math.floor(Math.random() * rotations.length)];
    
    return houseGroup;
  }

  // Helper method to create a traffic cone
  createTrafficCone() {
    const coneGroup = new THREE.Group();
    
    // Create cone body with enhanced material properties
    const coneGeometry = new THREE.ConeGeometry(0.5, 1, 16);
    const coneMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFF4500,
        roughness: 0.7,
        metalness: 0.1
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = 0.5; // Half of cone height
    
    // Enable shadows for cone
    cone.castShadow = true;
    cone.receiveShadow = true;
    
    coneGroup.add(cone);
    
    // Create cone base
    const baseGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.1; // Half of base height
    
    // Enable shadows for base
    base.castShadow = true;
    base.receiveShadow = true;
    
    coneGroup.add(base);
    
    // Create reflective stripes with enhanced material properties
    const stripeGeometry = new THREE.TorusGeometry(0.35, 0.05, 8, 16);
    const stripeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.2
    });
    
    // Add two reflective stripes
    const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe1.position.y = 0.3;
    stripe1.rotation.x = Math.PI / 2;
    stripe1.castShadow = true;
    stripe1.receiveShadow = true;
    
    coneGroup.add(stripe1);
    
    const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe2.position.y = 0.6;
    stripe2.rotation.x = Math.PI / 2;
    stripe2.scale.set(0.7, 0.7, 0.7);
    stripe2.castShadow = true;
    stripe2.receiveShadow = true;
    
    coneGroup.add(stripe2);
    
    return coneGroup;
  }
}
