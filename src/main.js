import './style.scss'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { DRACOLoader } from 'three/examples/jsm/Addons.js';
import gsap from 'gsap';

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

document.querySelectorAll(".project-exit-button").forEach((button) => {
  button.addEventListener("click", (e) => {
    const project = e.target.closest(".project");
    hideProject(project);
  })
})

const showProject = (project) => {
  project.style.display = "block";

  gsap.set(project, { opacity: 0});
  gsap.to(project, {
    opacity: 1,
    duration: 0.5
  })
}

const hideProject = (project) => {
  gsap.to(project, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      project.style.display = "none";
    }
  })
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

// Réseaux sociaux
const socialLinks = {
  Github: "https://github.com/",
  Facebook: "https://facebook.com/",
  Instagram: "https://instagram.com/",
  LinkedIn: "https://linkedin.com/"
}


// Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load('/models/room_portfolio_w_materials.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  model.traverse((child) => {
    if (child.isMesh) {
      const parent = child.parent;
      
      // On vérifie si le parent existe et contient bien le suffixe "_raycaster"
      if (parent && parent.name.includes('_raycaster')) {
        
        // CORRECTION : On ajoute le PARENT dans le tableau, s'il n'y est pas déjà
        if (!raycasterObjects.includes(parent)) {
          raycasterObjects.push(parent);
          console.log(`✅ Groupe interactif enregistré : "${parent.name}"`);
        }
      }
    }
  });

  console.log(`Total d'objets prêts dans le Raycaster : ${raycasterObjects.length}`);
});

// Controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 6, 0);
controls.update();

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
            
            // Exemple : si tu veux déclencher une action spécifique selon le nom
            if (target.name === "livre1_raycaster") {
              showProject(projects.one);
            }else if (target.name == "livre2_raycaster") {
              showProject(projects.two)
            }else if (target.name == "livre3_raycaster") {
              showProject(projects.three)
            }else if (target.name == "livre4_raycaster") {
              showProject(projects.four)
            }else if (target.name == "livre5_raycaster") {
              showProject(projects.five)
            }
        }
    }
});

// Boucle de rendu
const render = () => {
  controls.update();

  raycaster.setFromCamera(pointer, camera);
  
  // on active le paramètre récursif (true) pour que le Raycaster
  // cherche les meshes enfants à l'intérieur de nos 9 groupes parents
  const intersects = raycaster.intersectObjects(raycasterObjects, true);

  if (intersects.length > 0) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
  }

  renderer.render( scene, camera );
  window.requestAnimationFrame(render)
}

render()