/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MeasurementComponent } from './measurement';
import { Object3D } from 'three';
import { System } from 'elics';
import {
	Vector3
} from 'three';
import { XR_BUTTONS } from 'gamepad-wrapper';
import { globals } from './global';

export class StudSystem extends System {
	init() {
		this._vec3 = new Vector3();
	}

	update() {
		const { valueStore, controllers } = globals;
		if (valueStore.get('mode') === 'Stud') {
			['left', 'right'].forEach((handedness) => {
				const controller = controllers[handedness];
				if (!controller) return;

				const { userData, gamepad } = controller;

				if (!gamepad) return;

				if (gamepad.getButtonClick(XR_BUTTONS.TRIGGER)) {
					const position = userData.pointer.getWorldPosition(new Vector3());
					position.y = 0;
					const position2 = userData.pointer.getWorldPosition(new Vector3());
					position2.y = 3;
					const measurement = this.world.createEntity();
					measurement.addComponent(MeasurementComponent, {
						position1: position,
						position2: position2,
						attachedGamepads: [],
						_object: new Object3D(),
						snap: true
					});
				}
			});
		}
	}
}
