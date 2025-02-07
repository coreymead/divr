/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, System } from 'elics';

import { DoubleSide, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, Quaternion, TextureLoader } from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
	Vector3
} from 'three';
import { XR_BUTTONS } from 'gamepad-wrapper';
import { globals } from './global';

export class PictureComponent extends Component {
	reset() {
		this.marker1 = null;
		this.marker2 = null;
		this.line = null;
		this.text = null;
		this.material = null;
		this.position1 = null;
		this.position2 = null;
		this.attachedGamepads = null;
		this.snap = false;
		this._object.removeFromParent();
	}
}

export class ArtSystem extends System {
	init() {
		this._vec3 = new Vector3();
		const { renderer } = globals;
		renderer.xr.addEventListener('sessionstart', () => {
			this._justEnteredXR = true;
		});
	}

	update() {
		const { valueStore, controllers, ratk, scene } = globals;
		ratk.update();
		if (this._justEnteredXR) {
			ratk.createAnchor(new Vector3(), new Quaternion()).then((anchor) => {
				this._anchor = anchor;
			});
		}
		this._justEnteredXR = false;
		if (valueStore.get('mode') === 'Art') {
			['left', 'right'].forEach((handedness) => {
				const controller = controllers[handedness];
				if (!controller) return;

				const { userData, gamepad } = controller;

				if (!gamepad) return;

				if (gamepad.getButtonClick(XR_BUTTONS.TRIGGER)) {
					this.addPicture(userData, scene)
				}
			});
		}
	}

	addPicture(userData, scene) {
		const position = userData.pointer.getWorldPosition(new Vector3());
		const picture = this.world.createEntity();

		const loader = new GLTFLoader();
		const textureLoader = new TextureLoader();

		loader.load(
		'./assets/example.glb', // Replace with your model file path
		(gltf) => {
			const model = gltf.scene;

			const texture = textureLoader.load('./assets/bw_brick.jpg');
			// texture.encoding = sRGBEncoding; // Ensure proper color

			model.traverse((child) => {
				if (child.isMesh) {
					child.material.map = texture;
					child.material.needsUpdate = true; // Ensure the update is applied
				}
			});

			model.scale.set(0.05, 0.05, 0.05); // Scale the model if necessary
			model.position.copy(position);
			// model.position.z += 1;
			scene.add(model);
		},
		undefined,
		(error) => {
			console.error('An error occurred while loading the model:', error);
			throw new Error("ERROR: " + error);
		}
		);
		
		let text = false;
		if (text) {

			const obj = new Object3D();
			const textureLoader = new TextureLoader();
			const texture = textureLoader.load('./assets/brick.png');
			const geometry = new PlaneGeometry(.25, .25); // 2x2 square
			const material = new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent: true, opacity: 0.4 }); // Green material
			const square = new Mesh(geometry, material);
			square.position.copy(position)
			square.rotation.x = -Math.PI / 2;
			obj.add(picture);
	
			picture.addComponent(PictureComponent, {
				position1: position,
				attachedGamepads: [],
				_object: obj
			});
			this._anchor.attach(obj);
			scene.add(square)
		}
	}
}

ArtSystem.queries = {
	measurements: { required: [PictureComponent] },
};