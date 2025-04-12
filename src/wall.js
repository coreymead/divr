/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { System } from 'elics';
import { Text } from 'troika-three-text';
import { XR_BUTTONS } from 'gamepad-wrapper';
import { globals } from './global';

export class WallSystem extends System {
    init() {
        this._vec3 = new Vector3();
        this._firstPoint = null;
        this._previewBox = null;
        this._wallText = null;
    }

    update() {
        const { valueStore, controllers, scene } = globals;
        if (valueStore.get('mode') === 'Wall') {
            ['left', 'right'].forEach((handedness) => {
                const controller = controllers[handedness];
                if (!controller) return;

                const { userData, gamepad } = controller;
                if (!gamepad) return;

                if (gamepad.getButtonClick(XR_BUTTONS.TRIGGER)) {
                    const position = userData.pointer.getWorldPosition(new Vector3());
                    position.y = 0; // Keep on the ground plane

                    if (!this._firstPoint) {
                        // First point selected
                        this._firstPoint = position.clone();
                        
                        // Create preview box
                        if (!this._previewBox) {
                            const geometry = new BoxGeometry(1, 3, 0.1);
                            const material = new MeshBasicMaterial({ 
                                transparent: true, 
                                opacity: 0.3,
                                color: 0x808080 // Gray
                            });
                            this._previewBox = new Mesh(geometry, material);
                            scene.add(this._previewBox);
                        }

                        // Create text for area display
                        if (!this._wallText) {
                            this._wallText = new Text();
                            this._wallText.text = '--';
                            this._wallText.fontSize = 0.1; // Increased font size
                            this._wallText.anchorX = 'center';
                            this._wallText.anchorY = 'middle';
                            this._wallText.sync();
                            this._wallText.material.depthTest = false;
                            this._wallText.renderOrder = 999;
                            scene.add(this._wallText);
                        }
                    } else {
                        // Second point selected
                        const secondPoint = position.clone();
                        
                        // Calculate wall dimensions
                        const width = this._firstPoint.distanceTo(secondPoint);
                        const height = 3; // Standard wall height
                        
                        // Create the final wall
                        const wallGroup = new Group();
                        const wallGeometry = new BoxGeometry(width, height, 0.1);
                        const wallMaterial = new MeshBasicMaterial({ 
                            transparent: true, 
                            opacity: 0.6,
                            color: 0x45bd63 // Green
                        });
                        const wall = new Mesh(wallGeometry, wallMaterial);
                        
                        // Position the wall between the two points
                        wallGroup.position.lerpVectors(this._firstPoint, secondPoint, 0.5);
                        wallGroup.position.y = height / 2; // Center vertically
                        
                        // Calculate direction vector and ensure it's horizontal
                        const direction = new Vector3().subVectors(secondPoint, this._firstPoint);
                        direction.y = 0; // Force horizontal alignment
                        direction.normalize();
                        
                        // Set wall orientation
                        wallGroup.lookAt(new Vector3().addVectors(wallGroup.position, direction));
                        wallGroup.rotateY(Math.PI / 2); // Rotate to align with the wall direction
                        
                        wallGroup.add(wall);
                        scene.add(wallGroup);
                        
                        // Calculate and display area
                        const area = width * height;
                        const unit = valueStore.get('unit');
                        let displayText;
                        if (unit === 'Metric') {
                            displayText = `${(area * 10000).toFixed(2)} cm²`;
                        } else {
                            displayText = `${((area * 10000) / 929.03).toFixed(2)} ft²`; // Convert to square feet
                        }
                        
                        this._wallText.text = displayText;
                        this._wallText.sync();
                        this._wallText.position.copy(wallGroup.position);
                        this._wallText.lookAt(globals.playerHead.position); // Make text face the player
                        
                        // Reset for next wall
                        this._firstPoint = null;
                        if (this._previewBox) {
                            scene.remove(this._previewBox);
                            this._previewBox = null;
                        }
                    }
                }

                // Update preview box if first point is selected
                if (this._firstPoint && this._previewBox) {
                    const currentPos = userData.pointer.getWorldPosition(new Vector3());
                    currentPos.y = 0;
                    
                    const width = this._firstPoint.distanceTo(currentPos);
                    const height = 3;
                    
                    this._previewBox.scale.set(width, height, 0.1);
                    this._previewBox.position.lerpVectors(this._firstPoint, currentPos, 0.5);
                    this._previewBox.position.y = height / 2; // Center vertically
                    
                    // Calculate direction vector and ensure it's horizontal
                    const direction = new Vector3().subVectors(currentPos, this._firstPoint);
                    direction.y = 0; // Force horizontal alignment
                    direction.normalize();
                    
                    // Set preview box orientation
                    this._previewBox.lookAt(new Vector3().addVectors(this._previewBox.position, direction));
                    this._previewBox.rotateY(Math.PI / 2); // Rotate to align with the wall direction

                    // Update preview text position
                    if (this._wallText) {
                        this._wallText.position.copy(this._previewBox.position);
                        this._wallText.lookAt(globals.playerHead.position);
                    }
                }
            });
        } else {
            // Clean up when switching out of Wall mode
            if (this._previewBox) {
                scene.remove(this._previewBox);
                this._previewBox = null;
            }
            if (this._wallText) {
                scene.remove(this._wallText);
                this._wallText = null;
            }
            this._firstPoint = null;
        }
    }
} 