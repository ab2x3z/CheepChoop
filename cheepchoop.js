import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ******************************  Enums and Constants  ******************************
const LevelType = {
    GROUND: { value: 0, name: 'Ground' },
    WOOD: { value: 1, name: 'Wood' },
    BRICK: { value: 2, name: 'Brick' },
    SAND: { value: 3, name: 'Sand' },
    MARBLE: { value: 4, name: 'Marble' },
    OBSIDIAN: { value: 5, name: 'Obsidian' },
    NULL: { value: 6, name: '???' },
    SCIFI: { value: 7, name: 'Sci-Fi' },
    SLEEP: { value: 8, name: 'Sleep' },
    STOVE: { value: 9, name: 'Stove' },
    TRASH: { value: 10, name: 'Trash' },
    GRIMOIRE: { value: 11, name: 'Grimoire' }
};

const introPrompt = 'CheepChoop is a brutally difficult web platformer. Players endure a climb to absurd heights, repeatedly failing and returning to the start.  There are five levels, each constructed of increasingly smaller platforms: WOOD, BRICK, SAND, MARBLE, and OBSIDIAN.  (Hint: When players reach the final Obsidian platform, they will notice distant objects still above them, suggesting the climb continues...) Deliver a concise introduction, two sentences max.';
const failurePrompt = 'You are a sarcastic, AI-powered game companion. The player has just fallen all the way back to the beginning of CheepChoop, a notoriously difficult platformer. Generate a short, witty, and demoralizing message (2 sentences max) that ridicules their failure and subtly suggests they might be better off quitting. Emphasize their wasted effort and the daunting task ahead. Use dry humor and a slightly patronizing tone.';
const sysPrompt = `You are a sarcastic narrator for CheepChoop, a notoriously difficult web platformer with intentionally low-quality graphics where the player controls a colorful sphere.  Players attempt to climb to absurd heights (up to 700 meters), but usually plummet back to the start. Your goal is to provide amusing commentary on their inevitable failures and occasional successes.

    **Key Rules & Considerations:**

    *   **Condescending Humor (Required):** Your humor should be playful but clearly condescending.  Assume the player is struggling.
    *   **Level Name (Conditional):** IF AND ONLY IF the prompt includes "[LEVEL: X]", incorporate the level name (X) in your message. Do *NOT* mention "[LEVEL: X]" literally. Take these additionnal conditions :
        *   **Obsidian Level (Conditional):** IF AND ONLY IF the level name is 'Obsidian', acknowledge that this is the *definitely* the FINAL LEVEL and its platforms are exceptionally small.
        *   **Secret Level (Conditional):** IF AND ONLY IF the level name is '???', acknowledge the player has found the secret NULL level, calling attention to its invisible nature and (not really) difficult to find.
    *   **Previously Reached (Conditional):** IF AND ONLY IF the prompt includes "[ALREADY_REACHED]", acknowledge that the player has reached this level *before*. Do *NOT* mention "[ALREADY_REACHED]" directly. Imply it with a phrase like "back again?" or "still here?"
    *   **Number of Falls (Conditional):** IF AND ONLY IF the prompt includes "[NUMBER OF FALLS: X]", incorporate the number of falls (X) into the response in a mocking way. Do *NOT* mention "[NUMBER OF FALLS: X]" literally. Example: "After only X falls, you've managed this?"
    *   **Distance Fallen (Conditional):** IF AND ONLY IF the prompt includes "[DISTANCE FALLEN: X]", YOU MUST incorporate the distance fallen (X) in meters into the response. Classify the fall as follows (Do *NOT* mention "[DISTANCE FALLEN: X]" literally):
        *   **Short Fall:** Under 200 meters.
        *   **Medium Fall:** 200 - 599 meters.
        *   **Massive Fall:** 600 - 767 meters (The maximum fall distance).
    *   **Conciseness:** Stick to a single, impactful sentence.

    **Remember to be creative and cutting!**`;
const RepeatFactor = 100;
const gravity = -0.4;
const walkSpeed = 1;
const runSpeed = 2;
const sensitivity = 0.005;
const sphereRadius = 5;
const jumpHeight = 8;
const platformLevels = [
    {
        type: LevelType.WOOD,
        texture: 'Planks020_1K-JPG_Color.jpg',
        normal: 'Planks020_1K-JPG_NormalGL.jpg',
        ao: 'Planks020_1K-JPG_AmbientOcclusion.jpg',
        displacement: 'Planks020_1K-JPG_Displacement.jpg',
        roughness: 'Planks020_1K-JPG_Roughness.jpg',
        size: 69
    },
    {
        type: LevelType.BRICK,
        texture: 'Bricks082A_1K-JPG_Color.jpg',
        normal: 'Bricks082A_1K-JPG_NormalGL.jpg',
        ao: 'Bricks082A_1K-JPG_AmbientOcclusion.jpg',
        displacement: 'Bricks082A_1K-JPG_Displacement.jpg',
        roughness: 'Bricks082A_1K-JPG_Roughness.jpg',
        size: 50
    },
    {
        type: LevelType.SAND,
        texture: 'Ground080_1K-JPG_Color.jpg',
        normal: 'Ground080_1K-JPG_NormalGL.jpg',
        ao: 'Ground080_1K-JPG_AmbientOcclusion.jpg',
        displacement: 'Ground080_1K-JPG_Displacement.jpg',
        roughness: 'Ground080_1K-JPG_Roughness.jpg',
        size: 40
    },
    {
        type: LevelType.MARBLE,
        texture: 'Marble012_1K-JPG_Color.jpg',
        normal: 'Marble012_1K-JPG_NormalGL.jpg',
        displacement: 'Marble012_1K-JPG_Displacement.jpg',
        roughness: 'Marble012_1K-JPG_Roughness.jpg',
        size: 30
    },
    {
        type: LevelType.OBSIDIAN,
        texture: 'Obsidian006_1K-JPG_Color.jpg',
        normal: 'Obsidian006_1K-JPG_NormalGL.jpg',
        displacement: 'Obsidian006_1K-JPG_Displacement.jpg',
        roughness: 'Obsidian006_1K-JPG_Roughness.jpg',
        size: 25
    },
    {
        type: LevelType.NULL,
        size: 100
    },
    {
        type: LevelType.SCIFI,
        model: 'assets/glTFs/roundPlatform/scene.gltf'
    },
    {
        type: LevelType.SLEEP,
        model: 'assets/glTFs/bed/scene.gltf',
        size: 60
    },
    {
        type: LevelType.STOVE,
        model: 'assets/glTFs/gas_stove/scene.gltf',
        size: 38
    },
    {
        type: LevelType.TRASH,
        model: 'assets/glTFs/trashbag/scene.gltf'
    },
    {
        type: LevelType.GRIMOIRE,
        model: 'assets/glTFs/grimoire/scene.gltf',
        size: 15
    }
];

// ******************************  Scene Setup  ******************************
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg')
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

// Add after scene creation, before loading platforms
const frustum = new THREE.Frustum();
const cameraViewProjectionMatrix = new THREE.Matrix4();

// ******************************  Loading Manager  ******************************
const manager = new THREE.LoadingManager();
const progressBar = document.getElementById('progressBar');
const progressBarContainer = document.getElementById('progressBarContainer');

manager.onStart = () => progressBarContainer.style.display = 'block';
manager.onProgress = (url, itemsLoaded, itemsTotal) =>
    progressBar.style.width = (itemsLoaded / itemsTotal * 100) + '%';
manager.onLoad = () => {
    progressBarContainer.style.display = 'none';
    document.getElementById('bg').style.display = 'block';
    isLoading = false; // Set loading state to false when loading is complete
};

// ******************************  Texture Loading Utilities  ******************************
function loadTexture(manager, path) {
    return new THREE.TextureLoader(manager).load(path);
}

function loadAndRepeatTexture(manager, path, repeatFactor) {
    const texture = loadTexture(manager, path);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatFactor, repeatFactor);
    return texture;
}

// ******************************  Audio Management  ******************************
let backgroundMusic;
let noMusic;
let volume = 1;

function setupBackgroundMusic(music = 'Mind-Bender.mp3') {
    if (backgroundMusic && backgroundMusic.src.endsWith(music)) return;
    if (backgroundMusic) backgroundMusic.pause();
    backgroundMusic = new Audio(`assets/sounds/${music}`);
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3 * volume;
}

function playBackgroundMusic() {
    if (!backgroundMusic) setupBackgroundMusic();
    backgroundMusic.play().catch(error => console.log("Background music play failed:", error));
}

function playSound(soundPath) {
    if (!userHasInteracted) return;
    const sound = new Audio(soundPath);
    sound.volume = 0.2 * volume;
    sound.play().catch(error => console.log("Audio play failed:", error));
}

let noVoiceOver = false;
let conversation = {
    system_instruction: {
        parts: [{ text: sysPrompt }]
    },
    contents: [],
    generationConfig: {
        temperature: 1,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain"
    }
};
let voices = {
    "voices": [
    {
      "name": "en-AU-Standard-A",
      "ssmlGender": "FEMALE",
      "languageCode": "en-AU"
    },
    {
      "name": "en-AU-Standard-B",
      "ssmlGender": "MALE",
      "languageCode": "en-AU"
    },
    {
      "name": "en-AU-Standard-C",
      "ssmlGender": "FEMALE",
      "languageCode": "en-AU"
    },
    {
      "name": "en-AU-Standard-D",
      "ssmlGender": "MALE",
      "languageCode": "en-AU"
    },
    {
      "name": "en-GB-Standard-A",
      "ssmlGender": "FEMALE",
      "languageCode": "en-GB"
    },
    {
      "name": "en-GB-Standard-B",
      "ssmlGender": "MALE",
      "languageCode": "en-GB"
    },
    {
      "name": "en-GB-Standard-C",
      "ssmlGender": "FEMALE",
      "languageCode": "en-GB"
    },
    {
      "name": "en-GB-Standard-D",
      "ssmlGender": "MALE",
      "languageCode": "en-GB"
    },
    {
      "name": "en-GB-Standard-F",
      "ssmlGender": "FEMALE",
      "languageCode": "en-GB"
    },
    {
      "name": "en-GB-Standard-N",
      "ssmlGender": "FEMALE",
      "languageCode": "en-GB"
    },
    {
      "name": "en-GB-Standard-O",
      "ssmlGender": "MALE",
      "languageCode": "en-GB"
    },
    {
      "name": "en-US-Standard-A",
      "ssmlGender": "MALE",
      "languageCode": "en-US"
    },
    {
      "name": "en-US-Standard-B",
      "ssmlGender": "MALE",
      "languageCode": "en-US"
    },
    {
      "name": "en-US-Standard-C",
      "ssmlGender": "FEMALE",
      "languageCode": "en-US"
    },
    {
      "name": "en-US-Standard-D",
      "ssmlGender": "MALE",
      "languageCode": "en-US"
    },
    {
      "name": "en-US-Standard-E",
      "ssmlGender": "FEMALE",
      "languageCode": "en-US"
    },
    {
      "name": "en-US-Standard-F",
      "ssmlGender": "FEMALE",
      "languageCode": "en-US"
    },
    {
      "name": "en-US-Standard-G",
      "ssmlGender": "FEMALE",
      "languageCode": "en-US"
    },
    {
      "name": "en-US-Standard-H",
      "ssmlGender": "FEMALE",
      "languageCode": "en-US"
    },
    {
      "name": "en-US-Standard-I",
      "ssmlGender": "MALE",
      "languageCode": "en-US"
    },
    {
      "name": "en-US-Standard-J",
      "ssmlGender": "MALE",
      "languageCode": "en-US"
    }
  ]
}
let speechAudio = null;

// Default to "en-US-Standard-B"
let selectedVoiceIndex = 12;

async function getSpeechAudio(prompt) {
    const voice = voices.voices[selectedVoiceIndex];
    
    try {
        const response = await fetch('/.netlify/functions/getSpeechAudio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: prompt,
                voice: voice}),
            credentials: 'same-origin'
        });

        if (!response.ok) throw new Error('');

        const base64Audio = await response.json();

        const binaryString = atob(base64Audio.audioContent);
        const byteArray = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            byteArray[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([byteArray], { type: 'audio/ogg' });
        const audioUrl = URL.createObjectURL(blob);

        if (speechAudio) {
            speechAudio.pause();
            speechAudio.currentTime = 0;
            speechAudio = null;
        }

        speechAudio = new Audio(audioUrl);
        speechAudio.volume = 0.8 * volume;
        speechAudio.play();


    } catch (error) {
        console.error("Error fetching and playing audio:", error);
    }
}

async function getGeminiResponse(prompt) {
    if (noVoiceOver) { return; }

    const height = `[DISTANCE FALLEN: ${Math.round(fallDistance / 10)}]`;
    const falls = felled > 0 ? `[NUMBER OF FALLS: ${felled}]` : ``;

    if (typeof prompt !== 'string') {
        const name = `[LEVEL: ${prompt.name}]`;
        const reached = maxLevel.value >= prompt.value ? `[ALREADY_REACHED]` : ``;

        prompt = `Reached the beginning of a level. ${name} ${reached} ${falls}`;
    } else if (prompt === failurePrompt) {
        prompt += `${height} ${falls}`;
    }

    conversation.contents.push({
        role: "user",
        parts: [{ text: prompt }],
    });

    try {
        const response = await fetch('/.netlify/functions/getGeminiResponse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversation: conversation
            }),
            credentials: 'same-origin'
        });

        if (!response.ok) throw new Error('');

        const result = await response.json();
        getSpeechAudio(result.candidates[0].content.parts[0].text.replace(/\*/g, ''));
        conversation.contents.push({
            role: "model",
            parts: [{ text: result.candidates[0].content.parts[0].text }],
        });

    } catch (error) {

    }
}

// ******************************  Create Player  ******************************
const geometrySphere = new THREE.SphereGeometry(sphereRadius, 32, 32);
const rockMap = loadTexture(manager, 'assets/player/ChristmasTreeOrnament017_1K-JPG_Color.jpg');
const rockNormalMap = loadTexture(manager, 'assets/player/ChristmasTreeOrnament017_1K-JPG_NormalGL.jpg');
const rockRoughnessMap = loadTexture(manager, 'assets/player/ChristmasTreeOrnament017_1K-JPG_Roughness.jpg');
const rockMetalnessMap = loadTexture(manager, 'assets/player/ChristmasTreeOrnament017_1K-JPG_Metalness.jpg');
const rockDisplacementMap = loadTexture(manager, 'assets/player/ChristmasTreeOrnament017_1K-JPG_Displacement.jpg');

const materialSphere = new THREE.MeshStandardMaterial({
    map: rockMap,
    normalMap: rockNormalMap,
    roughnessMap: rockRoughnessMap,
    metalnessMap: rockMetalnessMap,
    displacementMap: rockDisplacementMap,
    displacementScale: 0.05,
    color: new THREE.Color(1, 1, 1).multiplyScalar(2),
    metalness: 0.6,
    roughness: 0
});
const sphere = new THREE.Mesh(geometrySphere, materialSphere);
sphere.position.y = 10;


// ******************************  Create Ground  ******************************
const groundSize = 10000;
const groundSegments = 500;
const geometryPlane = new THREE.PlaneGeometry(groundSize, groundSize, groundSegments, groundSegments);

const grassMap = loadAndRepeatTexture(manager, 'assets/ground/Grass001_1K-JPG_Color.jpg', RepeatFactor);
const grassNormalMap = loadAndRepeatTexture(manager, 'assets/ground/Grass001_1K-JPG_NormalGL.jpg', RepeatFactor);
const grassAoMap = loadAndRepeatTexture(manager, 'assets/ground/Grass001_1K-JPG_AmbientOcclusion.jpg', RepeatFactor);
const grassDisplacementMap = loadAndRepeatTexture(manager, 'assets/ground/Grass001_1K-JPG_Displacement.jpg', RepeatFactor);
const grassRoughnessMap = loadAndRepeatTexture(manager, 'assets/ground/Grass001_1K-JPG_Roughness.jpg', RepeatFactor);

const materialPlane = new THREE.MeshStandardMaterial({
    map: grassMap,
    normalMap: grassNormalMap,
    aoMap: grassAoMap,
    displacementMap: grassDisplacementMap,
    displacementScale: 2,
    roughnessMap: grassRoughnessMap,
    roughness: 1
});

const plane = new THREE.Mesh(geometryPlane, materialPlane);
plane.rotateX(Math.PI * 1.5);

// ******************************  Create Arrow  ******************************
const arrowShape = new THREE.Shape();
arrowShape.moveTo(0, 0);
arrowShape.lineTo(-3, -6);
arrowShape.lineTo(-1.5, -6);
arrowShape.lineTo(-1.5, -15);
arrowShape.lineTo(1.5, -15);
arrowShape.lineTo(1.5, -6);
arrowShape.lineTo(3, -6);
arrowShape.lineTo(0, 0);
const extrudeSettings = {
    steps: 2,
    depth: 1,
    bevelEnabled: false,
};

const arrowGeometry = new THREE.ExtrudeGeometry(arrowShape, extrudeSettings);
const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
arrow.position.z = 32;
scene.add(arrow);

// ******************************  Create Text  ******************************
const fontLoader = new FontLoader(manager);

fontLoader.load('assets/fonts/helvetiker_regular.typeface.json', function (font) {
    const moveTextGeometry = new TextGeometry('Use wasd or arrow\n keys to move.', {
        font: font,
        size: 3,
        height: 0.5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    });
    const jumpTextGeometry = new TextGeometry('Use space to jump\n and shift to run.', {
        font: font,
        size: 3,
        height: 0.5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    });
    const lookTextGeometry = new TextGeometry('Use the mouse to\n look around', {
        font: font,
        size: 3,
        height: 0.5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    });

    moveTextGeometry.computeBoundingBox();
    jumpTextGeometry.computeBoundingBox();
    lookTextGeometry.computeBoundingBox();

    const moveTextWidth = moveTextGeometry.boundingBox.max.x - moveTextGeometry.boundingBox.min.x;
    const jumpTextWidth = jumpTextGeometry.boundingBox.max.x - jumpTextGeometry.boundingBox.min.x;
    const lookTextWidth = lookTextGeometry.boundingBox.max.x - lookTextGeometry.boundingBox.min.x;

    const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const moveTextMesh = new THREE.Mesh(moveTextGeometry, textMaterial);
    const jumpTextMesh = new THREE.Mesh(jumpTextGeometry, textMaterial);
    const lookTextMesh = new THREE.Mesh(lookTextGeometry, textMaterial);

    moveTextMesh.scale.set(1, 1, 0.05);
    jumpTextMesh.scale.set(1, 1, 0.05);
    lookTextMesh.scale.set(1, 1, 0.05);


    moveTextMesh.position.set(-40, 15, moveTextWidth / 2);
    moveTextMesh.rotation.set(0, Math.PI / 2, 0);
    jumpTextMesh.position.set(40, 15, -jumpTextWidth / 2);
    jumpTextMesh.rotation.set(0, -Math.PI / 2, 0);
    lookTextMesh.position.set(-lookTextWidth / 2, 15, -35);
    lookTextMesh.rotation.set(0, 0, 0);


    scene.add(moveTextMesh, jumpTextMesh, lookTextMesh);
});
// ******************************  Create Platforms  ******************************
function createPlatforms(manager, levels) {
    const platforms = [];
    let lastPlatformPosition = new THREE.Vector3(0, 0, 0);
    const loader = new GLTFLoader(manager);

    // Pre-create geometries and materials for each level
    const levelMaterials = levels.slice(0, -1).map(level => {
        const texture = loadTexture(manager, `assets/platforms/${level.texture}`);
        const normal = loadTexture(manager, `assets/platforms/${level.normal}`);
        const displacement = loadTexture(manager, `assets/platforms/${level.displacement}`);
        const roughness = loadTexture(manager, `assets/platforms/${level.roughness}`);

        if (level.ao) {
            const ao = loadTexture(manager, `assets/platforms/${level.ao}`);

            return new THREE.MeshStandardMaterial({
                map: texture,
                normalMap: normal,
                aoMap: ao,
                displacementMap: displacement,
                roughnessMap: roughness,
                displacementScale: 0
            });
        }

        return new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: normal,
            displacementMap: displacement,
            roughnessMap: roughness,
            displacementScale: 0
        });
    });

    levels.forEach((level, levelIndex) => {
        const numberOfPlatforms = levelIndex === levels.length - 1 ? 10 : 10; // Only one at the end

        for (let i = 0; i < numberOfPlatforms; i++) {
            let platform;

            if (level.type === LevelType.NULL) {
                platform = new THREE.Mesh(
                    new THREE.BoxGeometry(level.size, 1, level.size),
                    new THREE.MeshBasicMaterial({ visible: false })
                );
            } else if (level.type === LevelType.SCIFI) {
                platform = new THREE.Mesh();
                loader.load(level.model, (gltf) => {
                    const model = gltf.scene;
                    model.scale.set(10, 10, 10);
                    model.position.y += 1;
                    platform.add(model);
                });
            } else if (level.type === LevelType.SLEEP) {
                platform = new THREE.Mesh(new THREE.BoxGeometry(level.size / 2, 1, level.size), new THREE.MeshBasicMaterial({ visible: false }));
                loader.load(level.model, (gltf) => {
                    const model = gltf.scene;
                    model.scale.set(0.03, 0.03, 0.03);
                    model.position.y -= 4;
                    platform.add(model);
                });
            } else if (level.type === LevelType.STOVE) {
                platform = new THREE.Mesh(new THREE.BoxGeometry(level.size, 1, level.size), new THREE.MeshBasicMaterial({ visible: false }));
                loader.load(level.model, (gltf) => {
                    const model = gltf.scene;
                    model.scale.set(0.5, 0.5, 0.5);
                    model.position.y += 1.5;
                    model.rotateX(Math.PI);
                    platform.add(model);
                });
            } else if (level.type === LevelType.TRASH) {
                platform = new THREE.Mesh();
                loader.load(level.model, (gltf) => {
                    const model = gltf.scene;
                    model.scale.set(10, 10, 10);
                    model.position.y -= 8;
                    model.rotateX(Math.PI);
                    platform.add(model);
                });
            } else if (level.type === LevelType.GRIMOIRE) {
                platform = new THREE.Mesh(new THREE.BoxGeometry(level.size, 1, level.size), new THREE.MeshBasicMaterial({ visible: false }));
                loader.load(level.model, (gltf) => {
                    const model = gltf.scene;
                    model.scale.set(7, 7, 7);
                    model.rotateX(Math.PI / 2);
                    model.rotateY(-(Math.PI / 6));
                    model.position.y -= 1;
                    model.position.x -= 2;
                    platform.add(model);
                });
            } else {
                const geometryPlatform = new THREE.BoxGeometry(
                    level.size + (Math.random() * level.size / 2 - 10),
                    3,
                    level.size + (Math.random() * level.size / 2 - 10)
                );
                platform = new THREE.Mesh(geometryPlatform, levelMaterials[levelIndex]);
            }

            platform.levelType = level.type;

            // Calculate position
            let newPosition = new THREE.Vector3();
            newPosition.y = lastPlatformPosition.y + 69;

            let angle = Math.random() * 2 * Math.PI;
            let horizontalOffset = new THREE.Vector3(
                Math.cos(angle) * 69,
                0,
                Math.sin(angle) * 69
            );

            newPosition.x = lastPlatformPosition.x + horizontalOffset.x;
            newPosition.z = lastPlatformPosition.z + horizontalOffset.z;

            if (platform.levelType === LevelType.NULL) {
                newPosition.x = lastPlatformPosition.x;
                newPosition.z = lastPlatformPosition.z;
            }

            platform.position.copy(newPosition);

            // Add frustum culling properties
            platform.frustumCulled = true;
            platform.visible = false;

            platforms.push(platform);
            lastPlatformPosition.copy(newPosition);
        }
    });

    return platforms;
}

function updateVisiblePlatforms(camera, platforms, sphere) {
    // Update the frustum
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

    // Get sphere and camera positions
    const spherePosition = sphere.position.clone();
    const cameraPosition = camera.position.clone();
    const cameraToSphere = spherePosition.clone().sub(cameraPosition);
    const distanceToSphere = cameraToSphere.length();
    cameraToSphere.normalize();

    platforms.forEach(platform => {
        // Only process platforms within reasonable distance
        const distance = platform.position.distanceTo(spherePosition);
        if (distance > 1000) {
            platform.visible = false;
            return;
        }

        // Check if platform is in view frustum
        const inFrustum = frustum.intersectsObject(platform);
        if (!inFrustum) {
            platform.visible = false;
            return;
        }

        // Check if platform is between camera and sphere
        const cameraToPlatform = platform.position.clone().sub(cameraPosition);
        const distanceToPlatform = cameraToPlatform.length();

        // If platform is closer than sphere and if the camera is pointed upwards
        const cameraDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const isCameraPointingUpward = cameraDirection.y < 0.9 && camera.position.y < sphere.position.y;
        const isBetweenCameraAndSphere = distanceToPlatform < distanceToSphere && isCameraPointingUpward;

        platform.visible = inFrustum && !isBetweenCameraAndSphere;
    });
}

const platforms = createPlatforms(manager, platformLevels);

// ******************************  Create Light  ******************************
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 1000, 0);

// ******************************  Load Skybox  ******************************
const skybox = new THREE.CubeTextureLoader(manager).load([
    'assets/skybox/px.jpg',
    'assets/skybox/nx.jpg',
    'assets/skybox/py.jpg',
    'assets/skybox/ny.jpg',
    'assets/skybox/pz.jpg',
    'assets/skybox/nz.jpg',
]);

// ******************************  Add elements to scene  ******************************
scene.add(sphere, plane, directionalLight, ambientLight);
platforms.forEach(platform => {
    scene.add(platform);
});
scene.background = skybox;


// ******************************  Game Logic  ******************************

// Get key presses
let userHasInteracted = false;
const interactionMessageDiv = document.getElementById('interactionMessage');
const currentHeightDiv = document.getElementById('currentHeight');
const maxHeightDiv = document.getElementById('maxHeight');
const currentLevelDiv = document.getElementById('currentLevel');
const keysPressed = {};
let isDialogOpen = false;
let previousLevel;

document.addEventListener('keydown', (event) => {
    if (isLoading || !userHasInteracted || isDialogOpen) return; // Ignore input if loading, the user didn't click or the dialog is open
    keysPressed[event.key.toLowerCase()] = true;

    if (event.key === 'g' && import.meta.env.MODE === 'development') {
        godMode = !godMode;
        if (godMode) {
            previousLevel = document.getElementById('currentLevel').textContent;
            document.getElementById('currentLevel').textContent = 'GodMode';
        } else {
            document.getElementById('currentLevel').textContent = previousLevel;
        }
    }
});
document.addEventListener('keyup', (event) => {
    if (isDialogOpen) return; // Ignore input if dialog is open
    keysPressed[event.key.toLowerCase()] = false;
});
document.addEventListener('click', function () {
    if (isLoading) return; // Ignore input if loading
    if (!userHasInteracted) { getGeminiResponse(introPrompt); }
    userHasInteracted = true;
    interactionMessageDiv.style.display = 'none';
    currentHeightDiv.style.setProperty("--hud-display", "flex");
    maxHeightDiv.style.setProperty("--hud-display", "flex");
    currentLevelDiv.style.setProperty("--hud-display", "block");
});
function keyIsPressed(key) {
    return keysPressed[key.toLowerCase()] === true;
}

// Game variables
let grounded = false;
let jumpVelocity = 0;
let momentum = new THREE.Vector3(0, 0, 0);
let maxHeight = 0;
let maxLevel = LevelType.GROUND;
let playerCurrentLevel = LevelType.GROUND;
let lastHeight;
let fallDistance;
let isFalling;
let godMode = false;
const upVector = new THREE.Vector3(0, 1, 0);
let isLoading = true;
let felled = 0;

// Collision detection function (Sphere - Box)
function checkSphereBoxCollision(sphere, box) {
    const spherePosition = sphere.position.clone();
    const boxPosition = box.position.clone();

    if (box.levelType === LevelType.SCIFI) {
        // For model platforms, use a cylindrical collision shape
        const radiusSquared = 550; // Radius of 5 units for collision
        const height = 1.5; // Height of collision cylinder

        // Check horizontal distance (using x and z)
        const dx = spherePosition.x - boxPosition.x;
        const dz = spherePosition.z - boxPosition.z;
        const distanceSquared = dx * dx + dz * dz;

        // Check if within radius and height
        if (distanceSquared <= radiusSquared) {
            const dy = Math.abs(spherePosition.y - boxPosition.y);
            return dy <= height + sphereRadius;
        }
        return false;
    } else if (box.levelType === LevelType.TRASH) {
        // For model platforms, use a cylindrical collision shape
        const radiusSquared = 100; // Radius of 5 units for collision
        const height = 1.5; // Height of collision cylinder

        // Check horizontal distance (using x and z)
        const dx = spherePosition.x - boxPosition.x;
        const dz = spherePosition.z - boxPosition.z;
        const distanceSquared = dx * dx + dz * dz;

        // Check if within radius and height
        if (distanceSquared <= radiusSquared) {
            const dy = Math.abs(spherePosition.y - boxPosition.y);
            return dy <= height + sphereRadius;
        }
        return false;
    }

    // Original box collision for other platform types
    const boxSize = new THREE.Vector3(box.geometry.parameters.width / 2, 1.5, box.geometry.parameters.depth / 2); // Half the box size

    // Get box min and max coordinates
    const boxMin = new THREE.Vector3().copy(boxPosition).sub(boxSize);
    const boxMax = new THREE.Vector3().copy(boxPosition).add(boxSize);

    // Check if the sphere is outside the platform's X and Z bounds
    if (spherePosition.x < boxMin.x || spherePosition.x > boxMax.x ||
        spherePosition.z < boxMin.z || spherePosition.z > boxMax.z) {
        return false; // Sphere is outside the platform's bounds
    }

    // Get closest point on box to sphere center
    const closestPoint = new THREE.Vector3();
    closestPoint.x = Math.max(boxMin.x, Math.min(spherePosition.x, boxMax.x));
    closestPoint.y = Math.max(boxMin.y, Math.min(spherePosition.y, boxMax.y));
    closestPoint.z = Math.max(boxMin.z, Math.min(spherePosition.z, boxMax.z));

    // Calculate distance between sphere center and closest point
    const distance = spherePosition.distanceTo(closestPoint);

    return distance <= sphereRadius;
}

// Collision detection function (Sphere - Plane)
function checkSpherePlaneCollision(sphere, plane) {
    // Calculate the distance between the sphere's center and the plane
    const distance = sphere.position.y - sphereRadius;

    // If the distance is less than or equal to zero, then the sphere is colliding with the plane
    return distance <= 0;
}

// Mouse controls variables
let isPointerLocked = false;
let yaw = 0;
let pitch = 0;

// Function to lock pointer and hide cursor
function lockPointer() {
    const canvas = renderer.domElement;
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

    if (canvas.requestPointerLock && !isLoading) {
        canvas.requestPointerLock();
    }
}

// Event listener for pointer lock change
document.addEventListener('pointerlockchange', pointerLockChange, false);
document.addEventListener('mozpointerlockchange', pointerLockChange, false);

function pointerLockChange() {
    if (!isLoading) {
        if (document.pointerLockElement === renderer.domElement || document.mozPointerLockElement === renderer.domElement) {
            isPointerLocked = true;
            togglePauseMenu(false);
        } else {
            isPointerLocked = false;
            togglePauseMenu(true);
        }
    }
}

// Mouse movement handler
function onMouseMove(event) {
    if (isDialogOpen || !isPointerLocked) return;

    // Clamp mouse movement to prevent large jumps
    const movementX = Math.max(-30, Math.min(30, event.movementX || 0));
    const movementY = Math.max(-30, Math.min(30, event.movementY || 0));

    yaw -= movementX * sensitivity;
    pitch -= movementY * sensitivity;

    // Limit pitch to prevent looking too far up or down
    pitch = Math.max((-Math.PI / 2) + 0.5, Math.min(Math.PI / 2, pitch));
}

document.addEventListener('mousemove', onMouseMove, false);

// Add click event to request pointer lock
renderer.domElement.addEventListener('click', function () {
    lockPointer();
});

function getHeightColor(height) {
    const maxHeight = 1000;
    const value = Math.min(height, maxHeight) / maxHeight;

    if (value < 0.33) {
        return `rgb(${Math.floor(255 * (value * 3))}, 255, 0)`; // Green to yellow
    } else if (value < 0.66) {
        return `rgb(255, ${Math.floor(255 * (1 - ((value - 0.33) * 3)))}, 0)`; // Yellow to red
    }
    return `rgb(${Math.floor(255 * (1 - ((value - 0.66) * 3)))}, 0, 0)`; // Red to black
}

function setLevelText(levelName) {
    document.getElementById('currentLevel').textContent = godMode ? 'GodMode' : levelName;
}

function setMaxLevel(level) {
    maxLevel = level;
    document.getElementById('maxHeight').style.setProperty('--maxLevel', `"${maxLevel.name}"`);
}

function move() {
    if (isLoading) return; // Don't allow movement while loading

    let moveDirection = new THREE.Vector3();
    let moveSpeed = keyIsPressed('Shift') ? runSpeed : walkSpeed;

    if (keyIsPressed('w') || keyIsPressed('ArrowUp')) {
        moveDirection.z -= 1;
    }
    if (keyIsPressed('s') || keyIsPressed('ArrowDown')) {
        moveDirection.z += 1;
    }
    if (keyIsPressed('a') || keyIsPressed('ArrowLeft')) {
        moveDirection.x -= 1;
    }
    if (keyIsPressed('d') || keyIsPressed('ArrowRight')) {
        moveDirection.x += 1;
    }

    //Rotate and move the sphere
    moveDirection.normalize();

    //Apply camera rotation to move direction
    const cameraRotation = new THREE.Euler(0, yaw, 0, 'YXZ');
    const rotatedMoveDirection = new THREE.Vector3().copy(moveDirection).applyEuler(cameraRotation);


    const rotationAxis = new THREE.Vector3().crossVectors(upVector, rotatedMoveDirection).normalize();
    const rotationAngle = rotatedMoveDirection.length() * moveSpeed / 5;
    const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);
    sphere.quaternion.premultiply(rotationQuaternion);

    if (grounded || godMode) {
        // Update horizontal momentum based on current input.
        momentum.copy(rotatedMoveDirection).multiplyScalar(moveSpeed);
        sphere.position.add(momentum);
    } else {
        // Use horizontal momentum if in the air
        sphere.position.add(momentum);
    }

    // Jump
    if (keyIsPressed(' ') && (grounded || godMode)) {
        if (!godMode) { playSound("assets/sounds/se_common_jump.wav"); }
        jumpVelocity = jumpHeight;
        grounded = false;
    }

    if (!grounded) {
        jumpVelocity += gravity;
        if (jumpVelocity < -3) { jumpVelocity = -3; }
        sphere.position.y += jumpVelocity;
    }

    // Collision checks
    let onGround = checkSpherePlaneCollision(sphere, plane); // Check ground collision first
    let landedOnPlatformThisFrame = false; // Track if we just landed on a platform this frame
    let onPlatform = false;
    let closestPlatformY = -Infinity; // Keep track of the highest platform we are colliding with

    platforms.forEach(platform => {
        if (checkSphereBoxCollision(sphere, platform)) {
            // Sphere is colliding with a platform
            if (jumpVelocity < 0) { // Only snap to platform if falling
                // Determine if this is the closest platform
                if (platform.position.y > closestPlatformY) {
                    closestPlatformY = platform.position.y;
                }
                landedOnPlatformThisFrame = true; // Mark that we landed on a platform

                // Play the sound based on the material
                switch (platform.levelType) {
                    case LevelType.WOOD:
                        playSound("assets/sounds/se_common_landing_wood.wav");
                        setLevelText(LevelType.WOOD.name);
                        if (playerCurrentLevel !== LevelType.WOOD.name) {
                            playerCurrentLevel = LevelType.WOOD.name;
                        }
                        if (maxLevel.value < LevelType.WOOD.value) {
                            setMaxLevel(LevelType.WOOD);
                        }
                        break;

                    case LevelType.BRICK:
                        playSound("assets/sounds/se_common_landing_brick.wav");
                        setLevelText(LevelType.BRICK.name);
                        if (playerCurrentLevel !== LevelType.BRICK.name) {
                            playerCurrentLevel = LevelType.BRICK.name;
                        }
                        if (maxLevel.value < LevelType.BRICK.value) {
                            setMaxLevel(LevelType.BRICK);
                        }
                        break;

                    case LevelType.SAND:
                        playSound("assets/sounds/se_common_landing_sand.wav");
                        setLevelText(LevelType.SAND.name);
                        if (playerCurrentLevel !== LevelType.SAND.name) {
                            playerCurrentLevel = LevelType.SAND.name;
                            getGeminiResponse(LevelType.SAND);
                        }
                        if (maxLevel.value < LevelType.SAND.value) {
                            setMaxLevel(LevelType.SAND);
                        }
                        break;

                    case LevelType.MARBLE:
                        playSound("assets/sounds/se_common_landing_marble.wav");
                        setLevelText(LevelType.MARBLE.name);
                        if (playerCurrentLevel !== LevelType.MARBLE.name) {
                            playerCurrentLevel = LevelType.MARBLE.name;
                        }
                        if (maxLevel.value < LevelType.MARBLE.value) {
                            setMaxLevel(LevelType.MARBLE);
                        }
                        break;

                    case LevelType.OBSIDIAN:
                        playSound("assets/sounds/se_common_landing_obsidian.wav");
                        setLevelText(LevelType.OBSIDIAN.name);
                        if (playerCurrentLevel !== LevelType.OBSIDIAN.name) {
                            playerCurrentLevel = LevelType.OBSIDIAN.name;
                            getGeminiResponse(LevelType.OBSIDIAN);
                        }
                        if (maxLevel.value < LevelType.OBSIDIAN.value) {
                            setMaxLevel(LevelType.OBSIDIAN);
                        }
                        break;

                    case LevelType.NULL:
                        setLevelText(LevelType.NULL.name);
                        if (playerCurrentLevel !== LevelType.NULL.name) {
                            playerCurrentLevel = LevelType.NULL.name;
                            getGeminiResponse(LevelType.NULL);
                        }
                        if (maxLevel.value < LevelType.NULL.value) {
                            setMaxLevel(LevelType.NULL);
                        }
                        break;

                    case LevelType.SCIFI:
                        playSound("assets/sounds/se_common_landing_sci-fi.wav");
                        setLevelText(LevelType.SCIFI.name);
                        if (playerCurrentLevel !== LevelType.SCIFI.name) {
                            playerCurrentLevel = LevelType.SCIFI.name;
                        }
                        if (maxLevel.value < LevelType.SCIFI.value) {
                            setMaxLevel(LevelType.SCIFI);
                        }
                        break;

                    case LevelType.SLEEP:
                        playSound("assets/sounds/se_common_landing_bed.wav");
                        setLevelText(LevelType.SLEEP.name);
                        if (playerCurrentLevel !== LevelType.SLEEP.name) {
                            playerCurrentLevel = LevelType.SLEEP.name;
                        }
                        if (maxLevel.value < LevelType.SLEEP.value) {
                            setMaxLevel(LevelType.SLEEP);
                        }
                        break;

                    case LevelType.STOVE:
                        playSound("assets/sounds/se_common_metal_landing.wav");
                        setLevelText(LevelType.STOVE.name);
                        if (playerCurrentLevel !== LevelType.STOVE.name) {
                            playerCurrentLevel = LevelType.STOVE.name;
                        }
                        if (maxLevel.value < LevelType.STOVE.value) {
                            setMaxLevel(LevelType.STOVE);
                        }
                        break;

                    case LevelType.TRASH:
                        playSound("assets/sounds/se_common_landing_trash.wav");
                        setLevelText(LevelType.TRASH.name);
                        if (playerCurrentLevel !== LevelType.TRASH.name) {
                            playerCurrentLevel = LevelType.TRASH.name;
                            getGeminiResponse(LevelType.TRASH);
                        }
                        if (maxLevel.value < LevelType.TRASH.value) {
                            setMaxLevel(LevelType.TRASH);
                        }
                        break;

                    case LevelType.GRIMOIRE:
                        playSound("assets/sounds/se_common_landing_book.wav");
                        setLevelText(LevelType.GRIMOIRE.name);
                        if (playerCurrentLevel !== LevelType.GRIMOIRE.name) {
                            playerCurrentLevel = LevelType.GRIMOIRE.name;
                        }
                        if (maxLevel.value < LevelType.GRIMOIRE.value) {
                            setMaxLevel(LevelType.GRIMOIRE);
                        }
                        break;

                    default:
                        console.log("Invalid platform type");
                        break;
                }
            } else if (jumpVelocity == 0) {
                onPlatform = true;
            }
        }
    });

    if (landedOnPlatformThisFrame) {
        // Snap to the closest platform
        sphere.position.y = closestPlatformY + 1.5 + sphereRadius; // Adjust position to sit on platform
        jumpVelocity = 0;
        grounded = true;
    } else if (onGround) {
        // Sphere is on the ground
        sphere.position.y = sphereRadius;
        jumpVelocity = 0;

        // Display the current level
        setLevelText(LevelType.GROUND.name);

        if (!grounded) {
            playSound("assets/sounds/se_common_landing_grass.wav");
            if (isFalling) {
                getGeminiResponse(failurePrompt);
            }
        }
        grounded = true;
    } else if (!onPlatform) {
        // In the air
        grounded = false;
    }


    if (sphere.position.y < lastHeight) {
        fallDistance += lastHeight - sphere.position.y;
        if (fallDistance > 100 && !isFalling && sphere.position.y > 700) {
            playSound("assets/sounds/se_common_oh-no.wav");
            isFalling = true;
            felled++;
            setTimeout(() => {
                setupBackgroundMusic('Past Sadness.mp3');
                if (!noMusic) {
                    playBackgroundMusic();
                }
            }, 500);
        }
    } else if (grounded && isFalling) {
        setupBackgroundMusic('Mind-Bender.mp3');
        if (backgroundMusic.paused && !noMusic) {
            playBackgroundMusic();
        }
        fallDistance = 0;
        isFalling = false;
    } else if (!isFalling) {
        setupBackgroundMusic('Mind-Bender.mp3');
        if (backgroundMusic.paused && !noMusic) {
            playBackgroundMusic();
        }
        fallDistance = 0;
    }

    lastHeight = sphere.position.y;

    // Reset position if falls below ground
    if (sphere.position.y < plane.position.y + sphereRadius) {
        sphere.position.y = plane.position.y + sphereRadius;
        jumpVelocity = 0;
        grounded = true;
    }

    // Update the player height display
    let currentHeight = sphere.position.y < 0 ? 0 : Math.round(sphere.position.y / 10);
    const heightElement = document.getElementById('currentHeight');
    heightElement.textContent = `${currentHeight} m`;
    heightElement.style.color = getHeightColor(currentHeight);
    heightElement.style.borderColor = getHeightColor(currentHeight);

    if (currentHeight > maxHeight) {
        maxHeight = currentHeight;
        document.getElementById('maxHeight').textContent = `${maxHeight} m`;
    }

    // Adjust camera to follow the player
    const cameraOffset = new THREE.Vector3(0, 10, 30);
    const cameraRotationOffset = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    cameraOffset.applyEuler(cameraRotationOffset); // Apply rotations to the offset.

    camera.position.copy(sphere.position).add(cameraOffset);
    camera.lookAt(sphere.position);

    // Teleport if too far from origin
    if (onGround && sphere.position.distanceTo(new THREE.Vector3(0, sphere.position.y, 0)) > 500) {
        sphere.position.set(0, sphereRadius, 0);
        momentum.set(0, 0, 0);
        sphere.rotation.set(0, 0, 0);
        sphere.quaternion.set(0, 0, 0, 1);
        yaw = 0;
        pitch = 0;
    }
}

const dialog = document.getElementById('usernameDialog');
const cancelButton = document.getElementById('cancelDialog');

cancelButton.addEventListener('click', () => {
    dialog.close();
    isDialogOpen = false;
});

let scoreSubmitted = false;

dialog.querySelector('form').addEventListener('submit', async (e) => {
    if (scoreSubmitted) return;
    scoreSubmitted = true;

    e.preventDefault();
    let username = document.getElementById('username').value.trim();
    if (!username) return;

    // Input validation and sanitization
    if (username.length > 50) { alert('Username too long'); return; }

    // Only allow alphanumeric characters and common symbols
    if (!/^[a-zA-Z0-9-_. ]+$/.test(username)) { alert('Username contains invalid characters'); return; }

    // Additional XSS protection
    username = username
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    try {
        const response = await fetch('/.netlify/functions/submitScore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerName: username,
                score: Math.max(0, Math.min(maxHeight, 9999)),
                level: maxLevel.name
            }),
            credentials: 'same-origin'
        });

        // Check if the response status indicates success (2xx)
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 409) {
                throw new Error(errorData.error, { cause: `higher` });
            }
            throw new Error(`Failed to submit score. error: ${errorData.error}, status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Score submitted:', result);

        isDialogOpen = false; // Reset dialog state
        window.location.href = 'index.html'; // Redirect to main menu
    } catch (error) {
        scoreSubmitted = false; // Reset submission state
        console.error('Error submitting score:', error);
        // Check for the specific error message we threw above
        if (error.cause === 'higher') {
            alert(error.message);
        } else {
            // Handle other errors (network issues, generic server errors, etc.)
            alert('Failed to submit score. Please try again.');
        }
        isDialogOpen = false; // Reset dialog state on error
    }
});

// Pause menu elements
const pauseMenu = document.getElementById('pauseMenu');
const audioSettingsMenu = document.getElementById('audioSettingsMenu');
const audioSettingsButton = document.getElementById('audioSettingsButton');
const musicToggle = document.getElementById('musicToggle');
const voiceToggle = document.getElementById('voiceToggle');
const voiceDropdown = document.getElementById('voiceDropdown');
const volumeSlider = document.getElementById('volumeSlider');
const returnButton = document.getElementById('returnButton');
const submitScoreButton = document.getElementById('submitScoreButton');
const resumeButton = document.getElementById('resumeButton');
const backToPauseMenuButton = document.getElementById('backToPauseMenuButton');

// Event listeners for pause menu buttons
audioSettingsButton.addEventListener('click', () => {
    pauseMenu.style.display = 'none';
    audioSettingsMenu.style.display = 'block';
});

backToPauseMenuButton.addEventListener('click', () => {
    audioSettingsMenu.style.display = 'none';
    pauseMenu.style.display = 'block';
});

musicToggle.addEventListener('click', () => {
    if (backgroundMusic) {
        if (backgroundMusic.paused) {
            noMusic = false;
            backgroundMusic.play();
            musicToggle.textContent = 'Disable Music';
        } else {
            noMusic = true;
            backgroundMusic.pause();
            musicToggle.textContent = 'Enable Music';
        }
    }
});

returnButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});

submitScoreButton.addEventListener('click', () => {
    dialog.showModal();
    isDialogOpen = true;
});

resumeButton.addEventListener('click', () => {
    lockPointer();
    togglePauseMenu(false);
});
// Placeholder for voice toggle and volume slider logic
voiceToggle.addEventListener('click', () => {
    if (noVoiceOver) {
        voiceDropdown.disabled = false;
        noVoiceOver = false;
        voiceToggle.textContent = 'Disable Voice Over';
    } else {
        if (speechAudio) {
            speechAudio.pause();
            speechAudio = null;
        }
        voiceDropdown.disabled = true;
        noVoiceOver = true;
        voiceToggle.textContent = 'Enable Voice Over';
    }
});
volumeSlider.addEventListener('input', (event) => {
    volume = event.target.value / 100;
    if (backgroundMusic) {
        backgroundMusic.volume = 0.3 * volume; // Update background music volume dynamically
    }
});

// Populate voice dropdown
voices.voices.forEach((voice, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${voice.name} (${voice.languageCode}, ${voice.ssmlGender})`;
    voiceDropdown.appendChild(option);
});
voiceDropdown.value = selectedVoiceIndex;

const voiceChangeLines = [
    "Welcome to CheepChoop. Will this voice be the one?",
    "So, this is the voice we're going with, huh? Bold choice.",
    "Trying on a new sound, are we? Fascinating.",
    "Welcome, player. Still searching for the perfect tone?",
    "Another voice enters the arena. Prepare for disappointment, player.",
    "CheepChoop welcomes you... in this particular frequency.",
    "Let's see if this voice can handle the inevitable splat.",
    "Ah, a fresh voice for the same old platforming pain.",
    "Welcome to CheepChoop. Don't get attached to this voice, or your progress.",
    "Testing, testing. Can you hear the impending failure in this voice?",
    "So, this is how we're narrating your descent today? Lovely.",
    "Another attempt, another voice. How many more will we cycle through?",
    "Welcome back to CheepChoop. And welcome to this vocal experiment.",
    "Let's hope this voice is more resilient than your platforming skills.",
    "CheepChoop. Where the graphics are low-quality and the voices are... in flux.",
    "Welcome. Still trying to find a narrator who can hide their amusement?",
    "Is this the voice of a champion? Probably not.",
    "Welcome to CheepChoop. Let the vocal exploration commence.",
    "So, you're liking this voice? Give it five minutes.",
    "Welcome. And may this be the most successful voice yet... for my commentary."
];
voiceDropdown.addEventListener('change', (event) => {
    selectedVoiceIndex = event.target.value;
    getSpeechAudio(voiceChangeLines[Math.floor(Math.random() * voiceChangeLines.length)]);
});

// Function to show/hide pause menu
function togglePauseMenu(show) {
    pauseMenu.style.display = show ? 'block' : 'none';
}

// ******************************  Game Loop  ******************************
function animate() {
    requestAnimationFrame(animate);
    if (!userHasInteracted && !isLoading) {
        interactionMessageDiv.style.display = 'flex';
        return; // Pause game logic until interaction
    }
    if (!isPointerLocked) return; // Pause game when menu is open
    move();

    // Update visible platforms
    updateVisiblePlatforms(camera, platforms, sphere);

    if (godMode) {
        sphere.material.color.set(0xff0000);
    } else {
        sphere.material.color.set(0xffffff);
    }

    arrow.position.y = 20 + Math.sin((performance.now() * 0.001) * 2) * 2;
    renderer.render(scene, camera);
}

animate();
