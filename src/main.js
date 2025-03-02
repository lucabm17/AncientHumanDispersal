import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js'
import gsap from 'gsap'

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })

renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

let mouseClicked = false
let xPos = 0, yPos = 0, deltaX = 0, deltaY = 0

const textureLoader = new THREE.TextureLoader()
const globeTexture = textureLoader.load('/public/img/globe.jpg', (texture) => {
    console.log('Texture loaded successfully!')
    sphere.material.map = texture
    sphere.material.needsUpdate = true
}, undefined, (error) => {
    console.error('Error loading texture:', error)
})

// Create Globe
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(5, 50, 50),
    new THREE.MeshBasicMaterial({ map: globeTexture })
)

// Create Group for Globe & Hotspots
const globeGroup = new THREE.Group()
globeGroup.add(sphere)
scene.add(globeGroup)

// Convert lat/lon to 3D positions
function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)

    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    )
}

// Hotspot Data
const hotspots = [
    { lat: 40.7128, lon: -74.0060, name: "New York" },
    { lat: 51.5074, lon: -0.1278, name: "London" },
    { lat: 35.6895, lon: 139.6917, name: "Tokyo" }
]

// Add Hotspots
const hotspotMeshes = []
hotspots.forEach(hotspot => {
    const position = latLonToVector3(hotspot.lat, hotspot.lon, 5.1)
    const hotspotMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    hotspotMesh.position.copy(position)
    globeGroup.add(hotspotMesh)
    hotspotMeshes.push({ mesh: hotspotMesh, name: hotspot.name })
})

// Raycaster Setup
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
})

window.addEventListener('click', () => {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(hotspotMeshes.map(h => h.mesh))
    
    if (intersects.length > 0) {
        const clickedHotspot = hotspotMeshes.find(h => h.mesh === intersects[0].object)
        if (clickedHotspot) {
            alert(`You clicked on: ${clickedHotspot.name}`)
        }
    }
})

// Starfield Background
const starGeometry = new THREE.BufferGeometry()
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff })
const starVertices = []
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000
    const y = (Math.random() - 0.5) * 2000
    const z = -Math.random() * 2000
    starVertices.push(x, y, z)
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
const stars = new THREE.Points(starGeometry, starMaterial)
scene.add(stars)

// Camera Position
camera.position.z = 12

// Mouse Control for Rotation
addEventListener("mousedown", (event) => {
    mouseClicked = true
    xPos = event.clientX
    yPos = event.clientY
})

addEventListener("mouseup", () => {
    mouseClicked = false
})

addEventListener('mousemove', (event) => {
    if (mouseClicked) {
        deltaX = (event.clientX - xPos) * 0.003
        deltaY = (event.clientY - yPos) * 0.003
    } else {
        deltaX = 0
        deltaY = 0
    }
})

// Animation Loop
function animate() {
    requestAnimationFrame(animate)
    
    // Rotate the entire group (globe + hotspots)
    globeGroup.rotation.y += 0.01

    gsap.to(globeGroup.rotation, {
        x: globeGroup.rotation.x + deltaY,
        y: globeGroup.rotation.y + deltaX,
        duration: 1
    })

    // Update Raycaster for Hover Effect
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(hotspotMeshes.map(h => h.mesh))
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default'

    renderer.render(scene, camera)
}
animate()
