/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureLoader } from 'three';

export const globals = {
	renderer: undefined,
	camera: undefined,
	scene: undefined,
	ratk: undefined,
	playerHead: undefined,
	controllers: undefined,
	textureLoader: new TextureLoader(),
	gltfLoader: new GLTFLoader(),
	valueStore: new Map(),
};
