import './style.scss'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { DRACOLoader } from 'three/examples/jsm/Addons.js';
import gsap from 'gsap';

// 1. Création du manager
const loadingManager = new THREE.LoadingManager();

// 2. Quand TOUT est chargé (modèles, textures, etc.)
loadingManager.onLoad = () => {
  document.getElementById('loader').classList.add('hidden');
  
  // 2. On affiche proprement l'interface HTML
  const ui = document.getElementById('ui-wrapper');
  if (ui) ui.classList.add('ready');
};

const canvas = document.querySelector("#experience-canvas")
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// Projects
const projects = {
  one: document.querySelector(".project.one") ,
  two: document.querySelector(".project.two") ,
  three: document.querySelector(".project.three") ,
  four: document.querySelector(".project.four") ,
  five: document.querySelector(".project.five")
}

// Phone
const phone = document.querySelector(".phone-overlay");
document.querySelector(".phone-exit-button").addEventListener("click", (e) => {
  const phone = e.target.closest(".phone-overlay")
  hideProject(phone)
})

let isProjectOpen = false;


const showProject = (project) => {
  project.style.display = "block";
  isProjectOpen = true;
  controls.enabled = false;

  if (currentHoveredObject) {
    playHoverAnimation(currentHoveredObject, false);
    currentHoveredObject = null;
  }
  document.body.style.cursor = "default";
  

  gsap.set(project, { opacity: 0});
  gsap.to(project, {
    opacity: 1,
    duration: 0.5
  })
}

const hideProject = (project) => {
  isProjectOpen = false;
  controls.enabled = true;
  clickedObject = null;

  gsap.to(project, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      project.style.display = "none";
    }
  })
}

// Fonction pour OUVRIR n'importe quel projet
function openProject(projectKey) {
  const projectDOM = projects[projectKey];
  if (!projectDOM) return;

  const container = projectDOM.querySelector('.book-container');
  const pageRight = projectDOM.querySelector('.page-right');
  const overlay = projectDOM.querySelector('.project-overlay');

  // 1. Bloquer OrbitControls
  controls.enabled = false;
  isProjectOpen = true;

  if (currentHoveredObject) {
    playHoverAnimation(currentHoveredObject, false);
    currentHoveredObject = null;
  }
  document.body.style.cursor = "default";

  // 2. Afficher le conteneur principal
  projectDOM.style.display = "block";

  // 3. Animation d'ouverture
  gsap.timeline()
    .fromTo(projectDOM, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.3 }
    )
    // On force le fond flouté à redevenir opaque (1) à l'ouverture
    .fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 },
      "<" // En même temps que le projectDOM
    )
    .fromTo(container, 
      { scale: 0.4 }, 
      { scale: 1, duration: 0.5, ease: "back.out(1.2)" },
      "<"
    )
    .fromTo(pageRight, 
      { rotateY: -180 }, 
      { 
        rotateY: 0,      
        duration: 0.7,
        ease: "power2.out"
      }, 
      "-=0.2"
    );
}

// Fonction pour FERMER n'importe quel projet
function closeProject(projectKey) {
  const projectDOM = projects[projectKey];
  isProjectOpen = false;
  if (!projectDOM) return;

  const container = projectDOM.querySelector('.book-container');
  const pageRight = projectDOM.querySelector('.page-right');
  const overlay = projectDOM.querySelector('.project-overlay');

  gsap.killTweensOf([projectDOM, container, pageRight, overlay]);

  const tl = gsap.timeline({
    onComplete: () => {
      projectDOM.style.display = "none";
      // Nettoyage propre pour le prochain coup
      gsap.set([container, pageRight], { clearProps: "transform" });
      gsap.set([projectDOM, overlay], { clearProps: "opacity" });
      controls.enabled = true; 
    }
  });

  // 1. D'abord la page se ferme complètement
  tl.to(pageRight, {
    rotateY: -180,
    duration: 0.6,
    ease: "power2.in"
  })
  
  // 2. Ensuite, le livre Rétrécit
  .to(container, {
    scale: 0.4,
    duration: 0.5,
    ease: "power2.in"
  }, "-=0.2")
  
  // 3. EN MÊME TEMPS que le scale, le fond flouté ET le conteneur s'effacent
  .to(overlay, {
    opacity: 0,
    duration: 0.5,
    ease: "power1.in"
  }, "<")
  .to(projectDOM, {
    opacity: 0,
    duration: 0.5,
    ease: "power1.in"
  }, "<"); // Le "<" aligne tout le monde sur l'étape du scale

  clickedObject = null;
}

// --- ÉCOUTEURS D'ÉVÉNEMENTS AUTOMATIQUES ---

// On attache automatiquement le clic de fermeture sur tous les boutons EXIT
Object.keys(projects).forEach((key) => {
  const exitBtn = projects[key].querySelector(".project-exit-button");
  if (exitBtn) {
    exitBtn.addEventListener("click", () => closeProject(key));
  }
});


function moveCameraToPortrait(cadreCible) {
    // 1. Désactiver temporairement OrbitControls pendant l'animation pour éviter les conflits
    controls.enabled = false;

    // 2. On récupère la position absolue du cadre dans la pièce
    const positionCadre = new THREE.Vector3();
    cadreCible.getWorldPosition(positionCadre);

    // 3. Calcul du recul de la caméra sur l'axe global de la pièce
    // Si tes cadres sont sur le mur de gauche, on recule vers la droite (+X) de la pièce.
    // Ajuste le 2.5 (plus ou moins grand) pour gérer la distance du zoom.
    const positionCameraCible = new THREE.Vector3(
        positionCadre.x + 1.5, 
        positionCadre.y,       
        positionCadre.z        
    );

    // 4. On calcule la rotation exacte (Quaternion) pour faire face au cadre
    const dummyCamera = new THREE.Camera();
    dummyCamera.position.copy(positionCameraCible);
    dummyCamera.lookAt(positionCadre); 
    const rotationCameraCible = dummyCamera.quaternion.clone();

    // --- ANIMATION CLÉ 1 : Déplacement et rotation de la caméra ---
    const dureeAnimation = 1.5;

    gsap.to(camera.position, {
        x: positionCameraCible.x,
        y: positionCameraCible.y,
        z: positionCameraCible.z,
        duration: dureeAnimation,
        ease: "power2.inOut"
    });

    gsap.to(camera.quaternion, {
        x: rotationCameraCible.x,
        y: rotationCameraCible.y,
        z: rotationCameraCible.z,
        w: rotationCameraCible.w,
        duration: dureeAnimation,
        ease: "power2.inOut"
    });

    // --- ANIMATION CLÉ 2 : Déplacer la cible d'OrbitControls sur le cadre ---
    // C'est ça qui empêche la caméra de regarder ailleurs à la fin !
    gsap.to(controls.target, {
        x: positionCadre.x,
        y: positionCadre.y,
        z: positionCadre.z,
        duration: dureeAnimation,
        ease: "power2.inOut",
        onComplete: () => {
            // Une fois l'animation finie, on réactive les contrôles
            // L'utilisateur peut maintenant tourner *autour* du cadre cliqué
            controls.enabled = true;
        }
    });
}



function moveCameraToOrdi(ordiCible) {
    // 1. Désactiver temporairement OrbitControls pendant l'animation pour éviter les conflits
    controls.enabled = false;

    // 2. On récupère la position absolue du cadre dans la pièce
    const positionOrdi = new THREE.Vector3();
    ordiCible.getWorldPosition(positionOrdi);

    // 3. Calcul du recul de la caméra sur l'axe global de la pièce
    // Si tes Ordis sont sur le mur de gauche, on recule vers la droite (+X) de la pièce.
    // Ajuste le 2.5 (plus ou moins grand) pour gérer la distance du zoom.
    const positionCameraCible = new THREE.Vector3(
        positionOrdi.x, 
        positionOrdi.y,       
        positionOrdi.z + 1.5        
    );

    // 4. On calcule la rotation exacte (Quaternion) pour faire face au Ordi
    const dummyCamera = new THREE.Camera();
    dummyCamera.position.copy(positionCameraCible);
    dummyCamera.lookAt(positionOrdi); 
    const rotationCameraCible = dummyCamera.quaternion.clone();

    // --- ANIMATION CLÉ 1 : Déplacement et rotation de la caméra ---
    const dureeAnimation = 1.5;

    gsap.to(camera.position, {
        x: positionCameraCible.x,
        y: positionCameraCible.y,
        z: positionCameraCible.z,
        duration: dureeAnimation,
        ease: "power2.inOut"
    });

    gsap.to(camera.quaternion, {
        x: rotationCameraCible.x,
        y: rotationCameraCible.y,
        z: rotationCameraCible.z,
        w: rotationCameraCible.w,
        duration: dureeAnimation,
        ease: "power2.inOut"
    });

    // --- ANIMATION CLÉ 2 : Déplacer la cible d'OrbitControls sur le Ordi ---
    // C'est ça qui empêche la caméra de regarder ailleurs à la fin !
    gsap.to(controls.target, {
        x: positionOrdi.x,
        y: positionOrdi.y,
        z: positionOrdi.z,
        duration: dureeAnimation,
        ease: "power2.inOut",
        onComplete: () => {
            // Une fois l'animation finie, on réactive les contrôles
            // L'utilisateur peut maintenant tourner *autour* du Ordi cliqué
            controls.enabled = true;
        }
    });
}

// Scène et caméra
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.2, 1000 );
camera.position.set(5.5, 6, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true});
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Raycaster & Pointeur
const raycasterObjects = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let currentHoveredObject = null;
let clickedObject = null; 


// Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load('/models/room_portfolio_w_materials.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  model.traverse((child) => {
    if (child.isMesh) {
      const parent = child.parent;
      
      if (parent && parent.name.includes('_raycaster')) {
        
        if (!raycasterObjects.includes(parent)) {
          raycasterObjects.push(parent);
          console.log(`✅ Groupe interactif enregistré : "${parent.name}"`);
        }
      }

      if (parent && parent.name.includes('livre')) {
        parent.userData.initialScale = new THREE.Vector3().copy(parent.scale);
        parent.userData.initialPosition = new THREE.Vector3().copy(parent.position);
        parent.userData.initialRotation = new THREE.Vector3().copy(parent.rotation);
      }

      if (parent && parent.name.includes('portrait')) {
        parent.userData.initialScale = new THREE.Vector3().copy(parent.scale)
      }
    }
  });

  console.log(`Total d'objets prêts dans le Raycaster : ${raycasterObjects.length}`);
});


// Controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;
controls.minDistance = 1;
controls.maxDistance = 50;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 6, 0);

const minPan = new THREE.Vector3(-1, -1, -2);
const maxPan = new THREE.Vector3(2, 5, 2);

controls.addEventListener("change", () => {
  if (controls.enabled) {
    controls.target.clamp(minPan, maxPan)
  }
})
controls.update();

controls.addEventListener("start", () => {
  clickedObject = null;
})

// Listeners
window.addEventListener("mousemove", (e) => {
  pointer.x = (e.clientX / sizes.width) * 2 - 1;
  pointer.y = - (e.clientY / sizes.height) * 2 + 1; // Axe Y inversé obligatoire pour Three.js
})

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix()

  renderer.setSize( sizes.width, sizes.height );
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

window.addEventListener("click", () => {
    // 1. Mettre à jour le raycaster avec la position du curseur et la caméra
    raycaster.setFromCamera(pointer, camera);

    // 2. Calculer les intersections avec les objets cibles (en récursif)
    const intersects = raycaster.intersectObjects(raycasterObjects, true);

    // 3. Si on a au moins une intersection
    if (intersects.length > 0) {
        // L'objet intersecté est souvent un Mesh enfant, 
        // on cherche donc son parent qui appartient à raycasterObjects
        let target = intersects[0].object;

        // On remonte les parents jusqu'à trouver celui qui est dans notre liste
        while (target && !raycasterObjects.includes(target)) {
            target = target.parent;
        }

        if (target) {
            console.log(`🎯 Objet cliqué : ${target.name}`);

            clickedObject = target;

            if (target.name == "phone_raycaster") {
              showProject(phone)
            }

            if (target.name == "portrait1_raycaster") {
              moveCameraToPortrait(target);
            } else if (target.name == "portrait2_raycaster") {
              moveCameraToPortrait(target);
            } else if (target.name == "portrait3_raycaster") {
              moveCameraToPortrait(target);
            } else if (target.name == "ordi_raycaster") {
              moveCameraToOrdi(target);
            }
            
            if (target.name === "livre1_raycaster") {
              openProject('one');
            }else if (target.name == "livre2_raycaster") {
              openProject('two')
            }else if (target.name == "livre3_raycaster") {
              openProject('three')
            }else if (target.name == "livre4_raycaster") {
              openProject('four')
            }else if (target.name == "livre5_raycaster") {
              openProject('five')
            }
        }
    }
});


//fonction hovering
function playHoverAnimation(object, isHovering) {
  gsap.killTweensOf(object.position);
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);

  if (isHovering) {
    gsap.to(object.position, {
      z: object.userData.initialPosition.z + 0.4,
      duration: 0.5,
      ease: "bounce.out(1.8)",
    });
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * 1.2,
      z: object.userData.initialScale.z * 1.2,
      duration: 0.5,
      ease: "bounce.out(1.8)",
    });
    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x + Math.PI / 8,
      duration: 0.5,
      ease: "bounce.out(1.8)",
    })
  }else {
    gsap.to(object.position, {
      z: object.userData.initialPosition.z,
      duration: 0.5,
      ease: "bounce.out(1.8)",
    });
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "bounce.out(1.8)",
    });
    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x,
      duration: 0.3,
      ease: "bounce.out(1.8)",
    })
  }
}

function playHoverCadre(object, isHovering) {
  gsap.killTweensOf(object.scale);

  if (isHovering) {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * 1.2,
      z: object.userData.initialScale.z * 1.2,
      duration: 0.5,
      ease: "power1.inOut(1.3)",
    });
  }else {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "power1.inOut(1.3)",
    });
  }
}

//ghost glow
const applyGhostGlow = (object, intensity) => {
  const nomValide = object.name.includes("livre") || object.name.includes("portrait") || object.name.includes("phone") || object.name.includes("ordi");
  
  if (!nomValide) return;

  // On remet d'abord l'objet d'origine à 0 pour qu'il garde sa couleur 100% normale
  object.traverse((child) => {
    if (child.isMesh && child.material && child.material.emissive) {
      child.material.emissiveIntensity = 0; 
    }
  });

  // --- CRÉATION DU CONTOUR (S'il n'existe pas déjà) ---
  if (!object.userData.outlineMesh) {
    // On crée une version "fil de fer" (Wireframe) blanche
    // On utilise EdgesGeometry pour n'avoir QUE les arêtes extérieures nettes
    const geometries = [];
    object.traverse((child) => {
      if (child.isMesh) geometries.push(child.geometry.clone());
    });

    if (geometries.length > 0) {
      // Si l'objet est complexe, on crée un contour sur son premier mesh principal
      object.traverse((child) => {
        if (child.isMesh && !object.userData.outlineMesh) {
          const edges = new THREE.EdgesGeometry(child.geometry);
          const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff, 
            linewidth: 2, // Épaisseur du trait
            transparent: true,
            depthTest: true // Pour que le contour passe bien derrière les autres objets cachés
          });
          
          const outline = new THREE.LineSegments(edges, lineMaterial);

          outline.raycast = () => null;
          
          // On cale le contour exactement sur la position du modèle
          outline.position.copy(child.position);
          outline.rotation.copy(child.rotation);
          outline.scale.copy(child.scale).multiplyScalar(1.02); // Légèrement plus grand pour envelopper l'objet
          
          child.add(outline);
          object.userData.outlineMesh = outline;
        }
      });
    }
  }

  // --- ANIMATION DU CONTOUR ---
  if (object.userData.outlineMesh) {
    // On fait pulser l'opacité de la ligne blanche plutôt que l'émissivité
    object.userData.outlineMesh.material.opacity = intensity * 2; // Multiplié pour que ce soit bien visible
  }
};


// Boucle de rendu
const render = () => {
  controls.update();

  // Vitesse du clignotement
  const time = performance.now() * 0.003;

  // Le pulse oscille proprement entre 0 et 1 de manière identique à chaque coup
  const pulse = (Math.sin(time) + 1) / 2;

  // On multiplie par 0.5 pour que l'intensité de la lueur blanche reste subtile
  const glowIntensity = pulse * 0.5;

  if (!isProjectOpen) {
    raycasterObjects.forEach((obj) => {
      if (obj === clickedObject) {
        // 1. SI L'OBJET EST CLIQUÉ : On coupe immédiatement le glow (retour couleur d'origine)
        applyGhostGlow(obj, 0);
      } else if (obj === currentHoveredObject) {
        // 2. SI L'OBJET EST SURVOLÉ (et pas cliqué) : Intensité fixe légère
        applyGhostGlow(obj, 0); 
      } else {
        // 3. TOUS LES AUTRES OBJS : Clignotement normal
        applyGhostGlow(obj, glowIntensity);
      }
    });
  } else {
    // Sécurité : Si un projet est ouvert, on s'assure que TOUT LE MONDE reste à sa couleur d'origine
    raycasterObjects.forEach((obj) => applyGhostGlow(obj, 0));
  }

  if(!isProjectOpen){

    raycaster.setFromCamera(pointer, camera);
    
    // on active le paramètre récursif (true) pour que le Raycaster
    // cherche les meshes enfants à l'intérieur de nos 9 groupes parents
    const intersects = raycaster.intersectObjects(raycasterObjects, true);

    if (intersects.length > 0) {
      let target = intersects[0].object;
      while (target && !raycasterObjects.includes(target)) {
        target = target.parent;
      }

      if (target.name.includes("livre")) {
        if (target !== currentHoveredObject) {
          if (currentHoveredObject) {
            playHoverAnimation(currentHoveredObject, false)
          }
          playHoverAnimation(target, true);
          currentHoveredObject = target;
        }
      } else if (target.name.includes("portrait")) {
        if (target !== currentHoveredObject) {
          if (currentHoveredObject) {
            playHoverCadre(currentHoveredObject, false)
          }
          playHoverCadre(target, true);
          currentHoveredObject = target;
        }
      }

      document.body.style.cursor = "pointer";
    } else {
      if (currentHoveredObject) {
        if (currentHoveredObject.name.includes('livre')) {
          playHoverAnimation(currentHoveredObject, false);
        } else if (currentHoveredObject.name.includes('portrait')) {
          playHoverCadre(currentHoveredObject, false);
        }
        currentHoveredObject = null;
      }
      document.body.style.cursor = "default";
    }
  }

  renderer.render( scene, camera );
  window.requestAnimationFrame(render)
}

render()





//Heure en temps réel
const heureReelle = () => {
  const maintenant = new Date();

  let heures = maintenant.getHours();
  let minutes = maintenant.getMinutes();

  heures = heures < 10 ? "0" + heures : heures;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  const heureFormatee = `${heures}:${minutes}`;

  document.getElementById('heure').textContent = heureFormatee;
}
heureReelle();
setInterval(heureReelle, 1000)

// Date en temps réel
const dateReelle = () => {
  const maintenant = new Date();

  const options = {
    weekday: 'short',
    day: 'numeric',
    month: 'long'
  }

  let dateFormatee = maintenant.toLocaleDateString('en-US', options);
  dateFormatee = dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1);

  document.getElementById('date-complete').textContent = dateFormatee;
}
dateReelle();
setInterval(dateReelle, 60000);