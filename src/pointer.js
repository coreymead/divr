/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CylinderGeometry, Group, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three';

import { System } from 'elics';
import { XR_BUTTONS } from 'gamepad-wrapper';
import { globals } from './global';

const LINE_GEOMETRY = new CylinderGeometry(0.002, 0.002, 3).rotateX(0).rotateZ(0);

export class PointerSystem extends System {
	
	init() {
		this._leftPointerVec3 = new Vector3();
		this._rightPointerVec3 = new Vector3();
	}

	update() {
		const { controllers, scene, valueStore } = globals;
		['left', 'right'].forEach((handedness) => {
			const controller = controllers[handedness];
			if (!controller) return;
			if (valueStore.get('mode') !== controller.userData.mode) {
				controller.userData.pointer = null;
				controller.raySpace.remove(controller.pointerSpace);
				if (controller.userData.lineGroup) {
					scene.remove(controller.userData.lineGroup);
					controller.userData.lineGroup = null;
				}
			}
			if (!controller.userData.pointer) {
				controller.pointerSpace = new Group();
				controller.raySpace.add(controller.pointerSpace);
				controller.pointerSpace.position.set(
					0.0074962213231061225 * (handedness === 'left' ? -1 : 1),
					-0.06522086887323097,
					0.10447758896833176,
				);
				let pointer;
				if (valueStore.get('mode') === 'Stud') {
					// Create a new group that will be independent of controller orientation
					const lineGroup = new Group();
					scene.add(lineGroup);
					
					// Create the line mesh
					pointer = new Mesh(LINE_GEOMETRY, new MeshBasicMaterial({ transparent: true, opacity: 0.6 }));
					lineGroup.add(pointer);
					
					// Store both the line and its container group
					controller.userData.pointer = pointer;
					controller.userData.lineGroup = lineGroup;
				} else {
					pointer = new Mesh(
						new SphereGeometry(0.004),
						new MeshBasicMaterial({ transparent: true, opacity: 0.6 }),
					);
					controller.pointerSpace.add(pointer);
					controller.userData.pointer = pointer;
				}
				controller.userData.mode = valueStore.get('mode')
			}

			// Update the line position and orientation in the update loop
			if (valueStore.get('mode') === 'Stud' && controller.userData.pointer) {
				// Get the controller's world position
				const worldPos = new Vector3();
				controller.pointerSpace.getWorldPosition(worldPos);
				
				// Update the line group's position to match the controller
				controller.userData.lineGroup.position.copy(worldPos);
				
				// Keep the line vertical
				controller.userData.lineGroup.rotation.set(0, 0, 0);
				controller.userData.lineGroup.up.set(0, 1, 0);
			}
		});

		const leftController = controllers.left;
		const rightController = controllers.right;
		if (leftController && rightController) {
			if (
				leftController.gamepad?.getButtonClick(XR_BUTTONS.BUTTON_2) ||
				rightController.gamepad?.getButtonClick(XR_BUTTONS.BUTTON_2)
			) {
				[leftController, rightController].forEach((controller) => {
					const pointer = controller.userData.pointer;
					scene.attach(pointer);
					leftController.pointerSpace.getWorldPosition(this._leftPointerVec3);
					rightController.pointerSpace.getWorldPosition(this._rightPointerVec3);
					pointer.position.lerpVectors(
						this._leftPointerVec3,
						this._rightPointerVec3,
						0.5,
					);
					controller.pointerSpace.attach(pointer);
				});
			}
		}
	}
}
