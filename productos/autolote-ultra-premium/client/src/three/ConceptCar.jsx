import { useMemo } from 'react';
import * as THREE from 'three';

// Vehículo CONCEPTUAL construido por código. No reproduce ningún modelo comercial
// ni ninguna unidad del inventario; la interfaz lo rotula como ilustrativo.

const BELT = 0.975; // altura de la línea de cintura: por encima es vidrio
const HALF = 0.85;

function bodyShape() {
  const s = new THREE.Shape();
  s.moveTo(-2.25, 0.38);
  s.lineTo(-1.84, 0.3);
  s.absarc(-1.4, 0.3, 0.44, Math.PI, 0, true);
  s.lineTo(1.01, 0.3);
  s.absarc(1.45, 0.3, 0.44, Math.PI, 0, true);
  s.lineTo(2.2, 0.33);
  s.quadraticCurveTo(2.37, 0.4, 2.35, 0.58);
  s.lineTo(2.27, 0.73);
  s.quadraticCurveTo(1.6, 0.87, 0.74, 0.93);
  s.quadraticCurveTo(0.34, 1.04, -0.08, 1.3);
  s.quadraticCurveTo(-0.62, 1.39, -1.08, 1.26);
  s.quadraticCurveTo(-1.72, 1.08, -2.16, 0.96);
  s.quadraticCurveTo(-2.33, 0.9, -2.31, 0.7);
  s.lineTo(-2.25, 0.38);
  return s;
}

// Estrecha la carrocería hacia el techo (tumblehome) y en los extremos.
function taper(x, y) {
  const t = THREE.MathUtils.clamp((y - 0.86) / 0.5, 0, 1);
  const top = THREE.MathUtils.lerp(1, 0.7, t * t * (3 - 2 * t));
  // Planta redondeada: el frente y la cola se cierran en curva, no en caja.
  const e = THREE.MathUtils.clamp((Math.abs(x) - 1.55) / 0.82, 0, 1);
  const ends = THREE.MathUtils.lerp(1, x > 0 ? 0.6 : 0.68, Math.pow(e, 2.2));
  const low = THREE.MathUtils.clamp((0.42 - y) / 0.14, 0, 1);
  return top * ends * THREE.MathUtils.lerp(1, 0.93, low);
}

function useBodyGeometry() {
  return useMemo(() => {
    const g = new THREE.ExtrudeGeometry(bodyShape(), {
      depth: HALF * 2,
      bevelEnabled: true,
      bevelThickness: 0.13,
      bevelSize: 0.085,
      bevelSegments: 8,
      curveSegments: 40,
      steps: 1,
    });
    g.translate(0, 0, -HALF);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      p.setZ(i, p.getZ(i) * taper(x, y));
    }
    g.computeVertexNormals();
    return g;
  }, []);
}

function usePaintMaterial(color) {
  return useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.62,
      roughness: 0.24,
      clearcoat: 1,
      clearcoatRoughness: 0.035,
      envMapIntensity: 1.7,
    });
    // Vidrio del habitáculo por encima de la cintura, con transición nítida.
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPos = position;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vPos;\nfloat glassMask(){ return smoothstep(' + BELT.toFixed(3) + ', ' + (BELT + 0.03).toFixed(3) + ', vPos.y) * step(vPos.x, 0.64) * step(-2.0, vPos.x); }')
        .replace('#include <color_fragment>', '#include <color_fragment>\nfloat gm = glassMask();\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.012, 0.013, 0.015), gm);')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.03, gm);')
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.0, gm);');
    };
    return m;
  }, [color]);
}

function Wheel({ position, mirror }) {
  const spokes = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2), []);
  return (
    <group position={position} rotation={[0, mirror ? Math.PI : 0, 0]}>
      <mesh castShadow>
        <torusGeometry args={[0.285, 0.088, 28, 72]} />
        <meshStandardMaterial color="#0c0c0c" roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.262, 0.262, 0.035, 64]} />
        <meshStandardMaterial color="#151515" metalness={0.9} roughness={0.35} />
      </mesh>
      {spokes.map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0.075]} rotation={[0, 0, a]}>
          <boxGeometry args={[0.25, 0.028, 0.025]} />
          <meshStandardMaterial color="#c9c6c0" metalness={1} roughness={0.18} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 32]} />
        <meshStandardMaterial color="#d7b97f" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0.12, 0.13, 0.02]}>
        <boxGeometry args={[0.1, 0.16, 0.05]} />
        <meshStandardMaterial color="#b8955a" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function ConceptCar({ color = '#5b5954', ...props }) {
  const body = useBodyGeometry();
  const paint = usePaintMaterial(color);
  const zW = 0.8;
  return (
    <group {...props}>
      <mesh geometry={body} material={paint} castShadow receiveShadow />
      {/* Barra LED frontal y trasera de ancho completo */}
      <mesh position={[2.31, 0.66, 0]}>
        <boxGeometry args={[0.03, 0.022, 0.98]} />
        <meshStandardMaterial color="#ffffff" emissive="#f4efe6" emissiveIntensity={6} toneMapped={false} />
      </mesh>
      <mesh position={[-2.33, 0.84, 0]}>
        <boxGeometry args={[0.03, 0.032, 1.12]} />
        <meshStandardMaterial color="#5a0b0b" emissive="#ff2a2a" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      {/* Moldura de cintura */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[-0.68, BELT - 0.004, s * (HALF + 0.128) * taper(-0.68, BELT)]}>
          <boxGeometry args={[2.62, 0.008, 0.006]} />
          <meshStandardMaterial color="#d7b97f" metalness={1} roughness={0.2} />
        </mesh>
      ))}
      <Wheel position={[-1.4, 0.374, zW]} />
      <Wheel position={[1.45, 0.374, zW]} />
      <Wheel position={[-1.4, 0.374, -zW]} mirror />
      <Wheel position={[1.45, 0.374, -zW]} mirror />
    </group>
  );
}
