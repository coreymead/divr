import * as THREE from 'three';
import { System } from 'elics';
import { Text } from 'troika-three-text';
import { XR_BUTTONS } from 'gamepad-wrapper';
import { globals } from './global';

const MENU_OPTIONS = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];

export class RadialMenuSystem extends System {
    init() {
        this._menuVisible = false;
        this._menuGroup = new THREE.Group();
        this._createMenu();
        globals.scene.add(this._menuGroup);
        this._menuGroup.visible = false;
    }

    _createMenu() {
        const radius = 0.2;
        const angleStep = (2 * Math.PI) / MENU_OPTIONS.length;
        
        MENU_OPTIONS.forEach((option, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const geometry = new THREE.CircleGeometry(0.07, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0x0077ff, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
            this._menuGroup.add(mesh);

            // Add text label
            const text = new Text();
            text.text = option;
            text.fontSize = 0.04;
            text.anchorX = 'center';
            text.anchorY = 'middle';
            text.position.set(mesh.position.x, mesh.position.y, 0.01);
            text.sync();
            
            this._menuGroup.add(text);
        });
    }

    update() {
        const rightController = globals.controllers['right'];
        if (!rightController) return;
        
        const rightGamepad = rightController.gamepad;
        if (rightGamepad?.getButtonClick(XR_BUTTONS.THUMBSTICK)) {
            this._menuVisible = !this._menuVisible;
            this._menuGroup.visible = this._menuVisible;
            if (this._menuVisible) {
                this._syncTransform(rightController);
            }
        }

        if (this._menuVisible) {
            this._syncTransform(rightController);
        }
    }

    _syncTransform(controller) {
        const userHead = globals.playerHead; // Reference to the player's head for orientation
        controller.userData.pointer.getWorldPosition(this._menuGroup.position);
        
        // Offset the menu relative to the controller
        const offset = new THREE.Vector3(0, 0.1, -0.1).applyQuaternion(controller.quaternion);
        this._menuGroup.position.add(offset);

        // Make the menu face the player
        userHead.getWorldPosition(this._menuGroup.quaternion);
        this._menuGroup.lookAt(userHead.position);
    }
}
