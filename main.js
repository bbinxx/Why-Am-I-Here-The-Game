        // Game state
        const gameState = {
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            experience: 0,
            maxExperience: 100,
            objectsFound: 0,
            isRunning: false,
            isCrouching: false,
            isJumping: false
        };

        const sounds = {
            walk: new Audio('https://example.com/walk.mp3'),
            jump: new Audio('https://example.com/jump.mp3'),
            ambient: new Audio('https://example.com/ambient.mp3')
        };

        // Input handling
        const keys = {
            w: false, a: false, s: false, d: false,
            ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
            space: false, shift: false, e: false, c: false
        };

        let mouseX = 0, mouseY = 0;
        let isPointerLocked = false;

        // Three.js variables
        let scene, camera, renderer, controls;
        let player, terrain, sky;
        let objects = [];
        let clock, mixer;

        // Movement variables
        const moveSpeed = 5;
        const runMultiplier = 2;
        const jumpForce = 15;
        let velocity = { x: 0, y: 0, z: 0 };
        const gravity = -30;

        // Head bobbing and mouse sway variables
        let headBobTimer = 0;
        let headBobAmount = 0.15;
        let mouseSway = 0;
        let mouseSwaySpeed = 2;

        // Initialize the game
        function init() {
            // Create scene
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

            // Create camera
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 5, 10);

            // Create renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x87CEEB);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.getElementById('gameContainer').appendChild(renderer.domElement);

            // Initialize clock
            clock = new THREE.Clock();

            // Create lighting
            createLighting();

            // Create terrain
            createTerrain();

            // Create sky
            createSky();

            // Create interactive objects
            createObjects();

            // Create player representation (invisible collision box)
            createPlayer();

            // Setup controls
            setupControls();

            // Setup UI
            setupUI();

            // Initialize sounds
            initSounds();

            // Start game loop
            animate();

            // Hide loading screen
            document.getElementById('loading').style.display = 'none';
            document.getElementById('ui').style.display = 'block';
            document.getElementById('instructions').style.display = 'block';

            showMessage('Welcome to the 3D Explorer! Click to start playing.');

            createGround();
            createBillboards();
            addMobileControls();
            addEnvironmentDetails();
        }

        function createLighting() {
            // Ambient light
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            scene.add(ambientLight);

            // Directional light (sun)
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(50, 50, 25);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.1;
            directionalLight.shadow.camera.far = 200;
            directionalLight.shadow.camera.left = -50;
            directionalLight.shadow.camera.right = 50;
            directionalLight.shadow.camera.top = 50;
            directionalLight.shadow.camera.bottom = -50;
            scene.add(directionalLight);

            // Point lights for atmosphere
            const pointLight1 = new THREE.PointLight(0xff6b6b, 0.5, 30);
            pointLight1.position.set(-20, 10, -20);
            scene.add(pointLight1);

            const pointLight2 = new THREE.PointLight(0x6bcfff, 0.5, 30);
            pointLight2.position.set(20, 10, 20);
            scene.add(pointLight2);
        }

        function createTerrain() {
            // Create a more interesting terrain with hills
            const terrainGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
            const vertices = terrainGeometry.attributes.position.array;

            // Add some noise to create hills
            for (let i = 0; i < vertices.length; i += 3) {
                const x = vertices[i];
                const z = vertices[i + 2];
                vertices[i + 1] = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 5 +
                                 Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
            }

            terrainGeometry.attributes.position.needsUpdate = true;
            terrainGeometry.computeVertexNormals();

            const terrainMaterial = new THREE.MeshLambertMaterial({
                color: 0x4a7c59,
                transparent: true,
                opacity: 0.9
            });

            terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
            terrain.rotation.x = -Math.PI / 2;
            terrain.receiveShadow = true;
            scene.add(terrain);

            // Add some rocks
            createRocks();

            // Add trees
            createTrees();

            // Add flowers
            createFlowers();

            // Add butterflies
            createButterflies();
        }

        function createRocks() {
            const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
            const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

            for (let i = 0; i < 20; i++) {
                const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                rock.position.set(
                    (Math.random() - 0.5) * 180,
                    2,
                    (Math.random() - 0.5) * 180
                );
                rock.scale.set(
                    Math.random() * 2 + 0.5,
                    Math.random() * 2 + 0.5,
                    Math.random() * 2 + 0.5
                );
                rock.castShadow = true;
                scene.add(rock);
            }
        }

        function createTrees() {
            for (let i = 0; i < 30; i++) {
                const tree = new THREE.Group();

                // Trunk
                const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 8, 8);
                const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.position.y = 4;
                trunk.castShadow = true;

                // Leaves
                const leavesGeometry = new THREE.SphereGeometry(4, 8, 6);
                const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
                leaves.position.y = 10;
                leaves.castShadow = true;

                tree.add(trunk);
                tree.add(leaves);

                tree.position.set(
                    (Math.random() - 0.5) * 160,
                    0,
                    (Math.random() - 0.5) * 160
                );

                scene.add(tree);
            }
        }

        function createSky() {
            const skyGeometry = new THREE.SphereGeometry(500, 32, 15);
            const skyMaterial = new THREE.MeshBasicMaterial({
                color: 0x87CEEB,
                side: THREE.BackSide
            });
            sky = new THREE.Mesh(skyGeometry, skyMaterial);
            scene.add(sky);

            // Add some clouds
            createClouds();
        }

        function createClouds() {
            const cloudGeometry = new THREE.SphereGeometry(5, 8, 6);
            const cloudMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });

            for (let i = 0; i < 20; i++) {
                const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
                cloud.position.set(
                    (Math.random() - 0.5) * 400,
                    Math.random() * 50 + 30,
                    (Math.random() - 0.5) * 400
                );
                cloud.scale.set(
                    Math.random() * 2 + 1,
                    Math.random() * 0.5 + 0.5,
                    Math.random() * 2 + 1
                );
                scene.add(cloud);
            }
        }

        function createObjects() {
            // Create treasure chests
            for (let i = 0; i < 10; i++) {
                const chest = createTreasureChest();
                chest.position.set(
                    (Math.random() - 0.5) * 150,
                    3,
                    (Math.random() - 0.5) * 150
                );
                objects.push(chest);
                scene.add(chest);
            }

            // Create glowing orbs
            for (let i = 0; i < 15; i++) {
                const orb = createGlowingOrb();
                orb.position.set(
                    (Math.random() - 0.5) * 180,
                    Math.random() * 10 + 5,
                    (Math.random() - 0.5) * 180
                );
                objects.push(orb);
                scene.add(orb);
            }
        }

        function createTreasureChest() {
            const chest = new THREE.Group();
            chest.userData = { type: 'chest', collected: false };

            // Chest body
            const bodyGeometry = new THREE.BoxGeometry(3, 2, 2);
            const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.castShadow = true;

            // Chest lid
            const lidGeometry = new THREE.BoxGeometry(3, 0.3, 2);
            const lidMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
            const lid = new THREE.Mesh(lidGeometry, lidMaterial);
            lid.position.y = 1.15;
            lid.castShadow = true;

            // Gold trim
            const trimGeometry = new THREE.BoxGeometry(3.2, 0.2, 2.2);
            const trimMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
            const trim = new THREE.Mesh(trimGeometry, trimMaterial);
            trim.position.y = 0.5;

            chest.add(body);
            chest.add(lid);
            chest.add(trim);

            return chest;
        }

        function createGlowingOrb() {
            const orb = new THREE.Group();
            orb.userData = { type: 'orb', collected: false };

            const orbGeometry = new THREE.SphereGeometry(1, 16, 12);
            const orbMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.8
            });
            const orbMesh = new THREE.Mesh(orbGeometry, orbMaterial);

            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(1.5, 16, 12);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);

            orb.add(orbMesh);
            orb.add(glow);

            return orb;
        }

        function createPlayer() {
            // Invisible collision box for the player
            const playerGeometry = new THREE.BoxGeometry(1, 4, 1);
            const playerMaterial = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0
            });
            player = new THREE.Mesh(playerGeometry, playerMaterial);
            player.position.copy(camera.position);
            scene.add(player);
        }

        function setupControls() {
            // Keyboard controls
            document.addEventListener('keydown', (event) => {
                if (keys.hasOwnProperty(event.key)) {
                    keys[event.key] = true;
                } else if (event.key === 'e') {
                    interactWithNearbyObjects();
                }
            });

            document.addEventListener('keyup', (event) => {
                if (keys.hasOwnProperty(event.key)) {
                    keys[event.key] = false;
                }
            });

            // Mouse controls
            document.addEventListener('click', () => {
                if (!isPointerLocked) {
                    renderer.domElement.requestPointerLock();
                }
            });

            document.addEventListener('pointerlockchange', () => {
                isPointerLocked = document.pointerLockElement === renderer.domElement;
            });

            document.addEventListener('mousemove', (event) => {
                if (isPointerLocked) {
                    mouseX -= event.movementX * 0.002;
                    mouseY -= event.movementY * 0.002;
                    mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, mouseY));
                }
            });

            // Window resize
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }

        function setupUI() {
            updateUI();
        }

        function updateUI() {
            // Update health bar
            const healthPercent = (gameState.health / gameState.maxHealth) * 100;
            document.getElementById('healthBar').style.width = healthPercent + '%';
            document.getElementById('healthText').textContent = Math.floor(gameState.health);

            // Update energy bar
            const energyPercent = (gameState.energy / gameState.maxEnergy) * 100;
            document.getElementById('energyBar').style.width = energyPercent + '%';
            document.getElementById('energyText').textContent = Math.floor(gameState.energy);

            // Update XP bar
            const xpPercent = (gameState.experience / gameState.maxExperience) * 100;
            document.getElementById('xpBar').style.width = xpPercent + '%';
            document.getElementById('xpText').textContent = gameState.experience;

            // Update position
            const pos = camera.position;
            document.getElementById('position').textContent = 
                `${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}`;

            // Update objects found
            document.getElementById('objectsFound').textContent = gameState.objectsFound;
        }

        function handleMovement(deltaTime) {
            const speed = gameState.isRunning ? moveSpeed * runMultiplier : moveSpeed;
            
            // Calculate movement direction
            const moveVector = new THREE.Vector3();
            
            if (keys.w || keys.ArrowUp) moveVector.z -= 1;
            if (keys.s || keys.ArrowDown) moveVector.z += 1;
            if (keys.a || keys.ArrowLeft) moveVector.x -= 1;
            if (keys.d || keys.ArrowRight) moveVector.x += 1;

            // Head bobbing and mouse sway while moving
            if (moveVector.length() > 0) {
                headBobTimer += deltaTime * (gameState.isRunning ? 12 : 8);
                const bobOffset = Math.sin(headBobTimer) * headBobAmount;
                camera.position.y += bobOffset * (gameState.isCrouching ? 0.5 : 1);

                // Add mouse sway while moving
                mouseSway = Math.sin(headBobTimer * 0.5) * 0.02;
                mouseX += mouseSway * deltaTime * mouseSwaySpeed;
            }

            // Handle running energy consumption
            if (keys.shift && (keys.w || keys.a || keys.s || keys.d) && gameState.energy > 0) {
                gameState.isRunning = true;
                gameState.energy -= 30 * deltaTime;
                if (gameState.energy < 0) gameState.energy = 0;
            } else {
                gameState.isRunning = false;
                // Regenerate energy
                if (gameState.energy < gameState.maxEnergy) {
                    gameState.energy += 20 * deltaTime;
                    if (gameState.energy > gameState.maxEnergy) gameState.energy = gameState.maxEnergy;
                }
            }

            // Handle crouching
            gameState.isCrouching = keys.c;

            if (moveVector.length() > 0) {
                moveVector.normalize();
                
                // Apply camera rotation to movement
                const euler = new THREE.Euler(0, mouseX, 0, 'YXZ');
                moveVector.applyEuler(euler);
                
                velocity.x = moveVector.x * speed;
                velocity.z = moveVector.z * speed;
            } else {
                velocity.x *= 0.9; // Friction
                velocity.z *= 0.9;
            }

            // Handle jumping
            if (keys.space && !gameState.isJumping && gameState.energy > 10) {
                velocity.y = jumpForce;
                gameState.isJumping = true;
                gameState.energy -= 10;
            }

            // Apply gravity
            velocity.y += gravity * deltaTime;

            // Update position
            camera.position.x += velocity.x * deltaTime;
            camera.position.y += velocity.y * deltaTime;
            camera.position.z += velocity.z * deltaTime;

            // Simple ground collision
            const groundY = gameState.isCrouching ? 2 : 5;
            if (camera.position.y <= groundY) {
                camera.position.y = groundY;
                velocity.y = 0;
                gameState.isJumping = false;
            }

            // Keep player within world bounds
            camera.position.x = Math.max(-90, Math.min(90, camera.position.x));
            camera.position.z = Math.max(-90, Math.min(90, camera.position.z));

            // Update camera rotation
            camera.rotation.set(mouseY, mouseX, 0, 'YXZ');

            // Update player collision box position
            player.position.copy(camera.position);
        }

        function interactWithNearbyObjects() {
            const playerPos = camera.position;
            
            objects.forEach((obj, index) => {
                if (obj.userData.collected) return;
                
                const distance = playerPos.distanceTo(obj.position);
                if (distance < 5) {
                    obj.userData.collected = true;
                    gameState.objectsFound++;
                    
                    if (obj.userData.type === 'chest') {
                        gameState.experience += 20;
                        gameState.health = Math.min(gameState.maxHealth, gameState.health + 10);
                        showMessage('🎁 Found treasure chest! +20 XP, +10 Health');
                        
                        // Chest opening animation
                        const lid = obj.children[1];
                        lid.rotation.x = -Math.PI / 4;
                        
                    } else if (obj.userData.type === 'orb') {
                        gameState.experience += 10;
                        gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 15);
                        showMessage('⚡ Collected energy orb! +10 XP, +15 Energy');
                        
                        // Remove orb with fade effect
                        obj.traverse((child) => {
                            if (child.material) {
                                child.material.transparent = true;
                                const fadeOut = () => {
                                    child.material.opacity -= 0.05;
                                    if (child.material.opacity > 0) {
                                        requestAnimationFrame(fadeOut);
                                    } else {
                                        scene.remove(obj);
                                    }
                                };
                                fadeOut();
                            }
                        });
                    }
                    
                    // Level up check
                    if (gameState.experience >= gameState.maxExperience) {
                        levelUp();
                    }
                }
            });
        }

        function levelUp() {
            gameState.experience = 0;
            gameState.maxExperience += 50;
            gameState.maxHealth += 20;
            gameState.maxEnergy += 20;
            gameState.health = gameState.maxHealth;
            gameState.energy = gameState.maxEnergy;
            
            showMessage('🎉 LEVEL UP! Health and Energy increased!');
        }

        function showMessage(text) {
            const messagesContainer = document.getElementById('messages');
            const message = document.createElement('div');
            message.className = 'message';
            message.textContent = text;
            messagesContainer.appendChild(message);
            
            setTimeout(() => {
                message.remove();
            }, 5000);
        }

        function initSounds() {
            sounds.ambient.loop = true;
            sounds.ambient.volume = 0.3;
            
            // Play ambient sound on user interaction
            document.addEventListener('click', () => {
                sounds.ambient.play();
            }, { once: true });
            
            // Walking sound
            function playWalkSound() {
                if ((keys.w || keys.s || keys.a || keys.d) && !gameState.isJumping) {
                    if (!sounds.walk.playing) {
                        sounds.walk.play();
                        sounds.walk.playing = true;
                    }
                } else {
                    sounds.walk.pause();
                    sounds.walk.playing = false;
                }
            }
            
            // Add to animation loop
            setInterval(playWalkSound, 500);
        }

        function createFlowers() {
            const flowerColors = [0xff0000, 0xffff00, 0xff69b4, 0x9932cc, 0xffa500];
            
            for (let i = 0; i < 200; i++) {
                const flowerGroup = new THREE.Group();
                
                // Stem
                const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 4);
                const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                const stem = new THREE.Mesh(stemGeometry, stemMaterial);
                stem.position.y = 0.5;
                
                // Flower head
                const petalGeometry = new THREE.SphereGeometry(0.2, 8, 8);
                const petalMaterial = new THREE.MeshLambertMaterial({ 
                    color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
                });
                const flowerHead = new THREE.Mesh(petalGeometry, petalMaterial);
                flowerHead.position.y = 1;
                flowerHead.scale.y = 0.3;
                
                flowerGroup.add(stem);
                flowerGroup.add(flowerHead);
                
                // Position flower
                flowerGroup.position.set(
                    (Math.random() - 0.5) * 180,
                    0,
                    (Math.random() - 0.5) * 180
                );
                
                scene.add(flowerGroup);
            }
        }

        function createButterflies() {
            for (let i = 0; i < 20; i++) {
                const butterfly = new THREE.Group();
                
                // Wings
                const wingGeometry = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    0, 0, 0,
                    1, 0.5, 0,
                    0, 1, 0
                ]);
                wingGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                
                const wingMaterial = new THREE.MeshBasicMaterial({
                    color: Math.random() * 0xffffff,
                    side: THREE.DoubleSide
                });
                
                const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
                const rightWing = leftWing.clone();
                leftWing.scale.set(0.5, 0.5, 0.5);
                rightWing.scale.set(-0.5, 0.5, 0.5);
                
                butterfly.add(leftWing);
                butterfly.add(rightWing);
                
                // Position butterfly
                butterfly.position.set(
                    (Math.random() - 0.5) * 180,
                    Math.random() * 20 + 5,
                    (Math.random() - 0.5) * 180
                );
                
                // Add animation data
                butterfly.userData = {
                    originalY: butterfly.position.y,
                    speed: Math.random() * 2 + 1,
                    wingSpeed: Math.random() * 10 + 5
                };
                
                scene.add(butterfly);
                objects.push(butterfly);
            }
        }

        function createBillboards() {
            const news = [
                "Breaking: Local Dragon Spotted!",
                "Weather: Sunny with a chance of magic",
                "Hero wanted: Apply at Castle",
                "Potion sale: 50% off today!",
                "Missing: Pet Phoenix - Reward",
                "Learn Magic: Now enrolling"
            ];
            
            const billboardGeometry = new THREE.PlaneGeometry(10, 5);
            const billboardMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xffffff,
                side: THREE.DoubleSide 
            });

            for (let i = 0; i < 4; i++) {
                const billboard = new THREE.Group();
                const board = new THREE.Mesh(billboardGeometry, billboardMaterial);
                
                // Create text canvas
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 256;
                const context = canvas.getContext('2d');
                
                // Create text texture
                const texture = new THREE.CanvasTexture(canvas);
                board.material = new THREE.MeshLambertMaterial({
                    map: texture,
                    side: THREE.DoubleSide
                });
                
                // Update text periodically
                setInterval(() => {
                    context.fillStyle = '#000066';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.fillStyle = '#ffffff';
                    context.font = 'bold 48px Arial';
                    context.textAlign = 'center';
                    context.fillText(news[Math.floor(Math.random() * news.length)], 
                                   canvas.width/2, canvas.height/2);
                    texture.needsUpdate = true;
                }, 5000);

                billboard.add(board);
                billboard.position.set(
                    Math.cos(i * Math.PI/2) * 70,
                    8,
                    Math.sin(i * Math.PI/2) * 70
                );
                billboard.rotation.y = i * Math.PI/2;
                scene.add(billboard);
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            
            const deltaTime = clock.getDelta();
            
            // Handle movement
            handleMovement(deltaTime);
            
            // Animate objects
            objects.forEach((obj) => {
                if (obj.userData.type === 'orb' && !obj.userData.collected) {
                    obj.rotation.y += deltaTime;
                    obj.position.y += Math.sin(Date.now() * 0.001 + obj.position.x) * 0.01;
                }

                // Animate butterflies
                if (obj.userData.wingSpeed) {
                    obj.rotation.y = Math.sin(Date.now() * 0.001) * 0.5;
                    obj.position.y = obj.userData.originalY + Math.sin(Date.now() * 0.001) * 0.5;
                    obj.position.x += Math.sin(Date.now() * 0.001) * 0.01 * obj.userData.speed;
                    obj.position.z += Math.cos(Date.now() * 0.001) * 0.01 * obj.userData.speed;
                }
            });
            
            // Update UI
            updateUI();
            
            // Render
            renderer.render(scene, camera);
        }

        // Update createTerrain function
        function createGround() {
            // Ground texture
            const textureLoader = new THREE.TextureLoader();
            const grassTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
            grassTexture.wrapS = THREE.RepeatWrapping;
            grassTexture.wrapT = THREE.RepeatWrapping;
            grassTexture.repeat.set(50, 50);

            const groundGeometry = new THREE.PlaneGeometry(200, 200, 100, 100);
            const groundMaterial = new THREE.MeshStandardMaterial({
                map: grassTexture,
                bumpMap: grassTexture,
                bumpScale: 0.5,
            });
            
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            scene.add(ground);
        }

        // Initialize the game when the page loads
        init();

        // Add mobile controls for touch devices
        function addMobileControls() {
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                const mobileControls = document.createElement('div');
                mobileControls.innerHTML = `
                    <div id="mobileControls" style="position: fixed; bottom: 20px; left: 20px; z-index: 1000;">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                            <button class="mobile-btn" id="leftBtn">←</button>
                            <button class="mobile-btn" id="upBtn">↑</button>
                            <button class="mobile-btn" id="rightBtn">→</button>
                            <button class="mobile-btn" id="jumpBtn">Jump</button>
                            <button class="mobile-btn" id="downBtn">↓</button>
                            <button class="mobile-btn" id="interactBtn">E</button>
                        </div>
                    </div>
                    <style>
                        .mobile-btn {
                            width: 60px;
                            height: 60px;
                            background: rgba(255,255,255,0.3);
                            border: 2px solid white;
                            border-radius: 50%;
                            color: white;
                            font-size: 20px;
                            touch-action: none;
                        }
                    </style>
                `;
                document.body.appendChild(mobileControls);

                // Add touch events
                const buttons = {
                    upBtn: 'w',
                    downBtn: 's',
                    leftBtn: 'a',
                    rightBtn: 'd',
                    jumpBtn: 'space',
                    interactBtn: 'e'
                };

                Object.entries(buttons).forEach(([btnId, key]) => {
                    const btn = document.getElementById(btnId);
                    btn.addEventListener('touchstart', () => keys[key] = true);
                    btn.addEventListener('touchend', () => keys[key] = false);
                });
            }
        }

        // Call the function to add mobile controls
        addMobileControls();

        function addEnvironmentDetails() {
            // Add fog
            scene.fog = new THREE.FogExp2(0x88ccee, 0.002);
            
            // Add particles (floating dust/pollen)
            const particleCount = 1000;
            const particles = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount * 3; i += 3) {
                positions[i] = (Math.random() - 0.5) * 200;
                positions[i + 1] = Math.random() * 100;
                positions[i + 2] = (Math.random() - 0.5) * 200;
            }
            
            particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const particleMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.1,
                transparent: true,
                opacity: 0.5
            });
            
            const particleSystem = new THREE.Points(particles, particleMaterial);
            scene.add(particleSystem);
        }