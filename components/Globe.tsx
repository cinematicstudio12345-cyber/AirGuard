
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { fetchWeather } from '../services/weather';
import { WeatherData } from '../types';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { GeocodeService } from '../services/search';

interface GlobeProps {
  onSelectLocation: (data: WeatherData) => void;
}

const MAJOR_CITIES = [
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "New Delhi", lat: 28.6139, lon: 77.2090 },
    { name: "Beijing", lat: 39.9042, lon: 116.4074 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093 },
    { name: "Paris", lat: 48.8566, lon: 2.3522 },
];

const Globe: React.FC<GlobeProps> = ({ onSelectLocation }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const geoService = useRef(new GeocodeService());

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // GALAXY BACKGROUND
    const starGeo = new THREE.BufferGeometry();
    const starCount = 6000;
    const pos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) {
        pos[i] = (Math.random() - 0.5) * 600;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.3, color: 0xffffff, transparent: true, opacity: 0.8 });
    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);
    scene.background = new THREE.Color(0x020408);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 14; 
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio); 
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0x333333, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(20, 10, 20);
    scene.add(sun);

    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = 23.5 * Math.PI / 180;
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    const loader = new THREE.TextureLoader();

    // Earth Mesh
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(5, 64, 64),
      new THREE.MeshPhongMaterial({
        map: loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
        bumpMap: loader.load('https://unpkg.com/three-globe/example/img/earth-topology.png'),
        bumpScale: 0.05,
        specularMap: loader.load('https://unpkg.com/three-globe/example/img/earth-water.png'),
        specular: new THREE.Color('grey'),
        shininess: 10
      })
    );
    earthGroup.add(earthMesh);

    // Atmosphere Halo
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(5.2, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `varying vec3 vNormal; void main() { float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0); gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity; }`,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      })
    );
    earthGroup.add(atmosphere);

    // City Markers
    const markerGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    
    MAJOR_CITIES.forEach(city => {
        const phi = (90 - city.lat) * (Math.PI / 180);
        const theta = (city.lon + 180) * (Math.PI / 180);
        const r = 5.05; 
        const x = -(r * Math.sin(phi) * Math.cos(theta));
        const z = (r * Math.sin(phi) * Math.sin(theta));
        const y = (r * Math.cos(phi));
        const mesh = new THREE.Mesh(markerGeo, markerMat);
        mesh.position.set(x, y, z);
        earthGroup.add(mesh);
    });

    // Interaction
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0.0005 };

    const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        prevMouse = { x: e.clientX, y: e.clientY };
        rotationVelocity = { x: 0, y: 0 };
    };

    const onMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const deltaX = e.clientX - prevMouse.x;
            const deltaY = e.clientY - prevMouse.y;
            earthGroup.rotation.y += deltaX * 0.005;
            earthGroup.rotation.x += deltaY * 0.005;
            rotationVelocity = { x: deltaY * 0.0001, y: deltaX * 0.0001 };
            prevMouse = { x: e.clientX, y: e.clientY };
        }
    };

    const onMouseUp = () => isDragging = false;
    const onWheel = (e: WheelEvent) => {
        camera.position.z += e.deltaY * 0.01;
        camera.position.z = Math.max(7, Math.min(camera.position.z, 20));
    };

    const onClick = async (e: MouseEvent) => {
        if (isDragging) return;
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / width) * 2 - 1,
            -((e.clientY - rect.top) / height) * 2 + 1
        );
        raycaster.current.setFromCamera(mouse, camera);
        const intersects = raycaster.current.intersectObject(earthMesh);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const localPoint = point.clone().applyMatrix4(earthMesh.matrixWorld.invert()).normalize();
            
            const lat = 90 - (Math.acos(localPoint.y) * 180 / Math.PI);
            const lon = ((Math.atan2(localPoint.z, localPoint.x) * 180 / Math.PI) + 180) % 360 - 180;
            const adjustedLon = lon - 90; // Adjust for texture offset

            // Visual Feedback
            const pin = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            pin.position.copy(point.normalize().multiplyScalar(5.1));
            earthGroup.add(pin);

            setLoading(true);
            try {
                const data = await fetchWeather(`${lat.toFixed(4)},${adjustedLon.toFixed(4)}`);
                onSelectLocation(data);
            } catch (err) {
                setErrorMsg("Weather data unavailable.");
            } finally {
                setLoading(false);
            }
        }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('click', onClick); 
    renderer.domElement.addEventListener('wheel', onWheel);

    const animate = () => {
        requestAnimationFrame(animate);
        if (!isDragging) {
            earthGroup.rotation.y += rotationVelocity.y;
            earthGroup.rotation.x += rotationVelocity.x;
            rotationVelocity.x *= 0.95;
            rotationVelocity.y = Math.max(rotationVelocity.y * 0.95, 0.0005);
        }
        renderer.render(scene, camera);
    };
    animate();

    return () => {
        mountRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
    };
  }, []);

  const handleSearch = async (val: string) => {
      setSearchQuery(val);
      if (val.length > 2) {
          const res = await geoService.current.searchCity(val);
          setSearchResults(res);
      } else { setSearchResults([]); }
  };

  const selectSearchResult = async (res: any) => {
      setSearchQuery(res.displayName);
      setSearchResults([]);
      setLoading(true);
      try {
          const data = await fetchWeather(`${res.lat},${res.lon}`);
          onSelectLocation(data);
      } catch (err) { setErrorMsg("Could not load data."); } finally { setLoading(false); }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
       <div ref={mountRef} className="w-full h-full cursor-move" />
       
       <div className="absolute top-4 left-4 right-4 z-10 max-w-md mx-auto">
          <div className="relative">
             <input 
               type="text" 
               className="w-full bg-black/60 backdrop-blur border border-slate-700 rounded-full py-3 pl-10 pr-4 text-white placeholder-slate-400 outline-none focus:border-cyan-500 transition-colors shadow-2xl"
               placeholder="Search Global Locations..."
               value={searchQuery}
               onChange={(e) => handleSearch(e.target.value)}
             />
             <Search className="absolute left-3 top-3 text-slate-400" size={20} />
             {loading && <Loader2 className="absolute right-3 top-3 text-cyan-500 animate-spin" size={20} />}
          </div>
          
          {searchResults.length > 0 && (
             <div className="mt-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-60 overflow-y-auto">
                {searchResults.map((res, i) => (
                   <div key={i} onClick={() => selectSearchResult(res)} className="p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800">
                      <p className="text-white font-medium text-sm">{res.displayName}</p>
                      <p className="text-xs text-slate-500">{res.country}</p>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};

export default Globe;
