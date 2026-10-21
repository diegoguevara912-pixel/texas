import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, MeshReflectorMaterial, OrbitControls } from '@react-three/drei';
import gsap from 'gsap';
import ConceptCar from './ConceptCar.jsx';

// En pantallas anchas el vehículo se desplaza a la derecha para dejar aire al titular.
const WIDE = typeof window !== 'undefined' && window.innerWidth / window.innerHeight > 1.15;
export const VIEWS = {
  hero: WIDE ? { pos: [8.7, 2.0, 8.5], target: [-1.0, 1.32, 1.0] } : { pos: [10, 2.6, 11], target: [0, 1.6, 0] },
  front: { pos: [6.2, 1.1, 0.6], target: [0, 0.6, 0] },
  side: { pos: [0.2, 1.05, 7.2], target: [0, 0.6, 0] },
  rear: { pos: [-5.8, 1.5, -4.4], target: [0, 0.6, 0] },
  top: { pos: [0.6, 7.4, 0.8], target: [0, 0.4, 0] },
};
const INTRO_FROM = { pos: [11, 0.7, 2.5], target: [0, 0.7, 0] };

const HOTSPOTS = [
  { id: 'led', pos: [2.36, 0.68, 0.45], title: 'Firma lumínica', text: 'Barra LED de ancho completo. Elemento ilustrativo del concepto.' },
  { id: 'wheel', pos: [1.45, 0.38, 1.0], title: 'Rin de diez radios', text: 'Pinzas de freno en champán, el color de acento de la marca.' },
  { id: 'glass', pos: [-0.5, 1.36, 0.25], title: 'Techo de vidrio', text: 'Habitáculo de vidrio continuo, de parabrisas a luneta.' },
  { id: 'rear', pos: [-2.36, 0.86, -0.4], title: 'Silueta fastback', text: 'Caída de techo larga hasta la barra trasera.' },
];

function CameraRig({ mode, view, intro, reduced, controls }) {
  const { camera } = useThree();
  const t0 = useRef(performance.now());
  const done = useRef(!intro || reduced);

  // Intro cinematográfica: un solo recorrido, se omite con movimiento reducido.
  useEffect(() => {
    const target = VIEWS.hero;
    if (done.current) {
      camera.position.set(...target.pos);
      controls.current?.target.set(...target.target);
      return;
    }
    camera.position.set(...INTRO_FROM.pos);
    const tgt = controls.current?.target || { set() {} };
    tgt.set?.(...INTRO_FROM.target);
    const state = { k: 0 };
    const from = { p: [...INTRO_FROM.pos], t: [...INTRO_FROM.target] };
    const tween = gsap.to(state, {
      k: 1,
      duration: 2.6,
      ease: 'power3.inOut',
      onUpdate: () => {
        const k = state.k;
        // Trayectoria en arco alrededor del vehículo
        const ang = Math.atan2(from.p[2], from.p[0]) * (1 - k) + Math.atan2(target.pos[2], target.pos[0]) * k;
        const rad = Math.hypot(from.p[0], from.p[2]) * (1 - k) + Math.hypot(target.pos[0], target.pos[2]) * k;
        camera.position.set(Math.cos(ang) * rad, from.p[1] + (target.pos[1] - from.p[1]) * k, Math.sin(ang) * rad);
        controls.current?.target.set(...from.t.map((v, i) => v + (target.target[i] - v) * k));
        controls.current?.update();
      },
      onComplete: () => (done.current = true),
    });
    return () => tween.kill();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cambio de vista solicitado por los botones.
  useEffect(() => {
    if (!view || !done.current) return;
    const v = VIEWS[view];
    const c = controls.current;
    if (reduced) {
      camera.position.set(...v.pos);
      c?.target.set(...v.target);
      c?.update();
      return;
    }
    const tl = gsap.timeline();
    tl.to(camera.position, { x: v.pos[0], y: v.pos[1], z: v.pos[2], duration: 1.4, ease: 'power3.inOut', onUpdate: () => c?.update() }, 0);
    if (c) tl.to(c.target, { x: v.target[0], y: v.target[1], z: v.target[2], duration: 1.4, ease: 'power3.inOut' }, 0);
    return () => tl.kill();
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deriva suave de cámara en modo vitrina.
  useFrame(() => {
    if (mode !== 'showcase' || reduced || !done.current) return;
    const t = (performance.now() - t0.current) / 1000;
    const base = VIEWS.hero.pos;
    const a = Math.atan2(base[2], base[0]) + Math.sin(t * 0.12) * 0.22;
    const r = Math.hypot(base[0], base[2]);
    camera.position.x += (Math.cos(a) * r - camera.position.x) * 0.02;
    camera.position.z += (Math.sin(a) * r - camera.position.z) * 0.02;
    camera.position.y += (base[1] + Math.sin(t * 0.2) * 0.08 - camera.position.y) * 0.02;
    controls.current?.update();
  });
  return null;
}

function Studio({ tier }) {
  return (
    <>
      <color attach="background" args={['#0d0c0b']} />
      <fog attach="fog" args={['#0d0c0b', 9, 22]} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[6, 3, 5]} intensity={1.4} color="#fff3e0" />
      <spotLight position={[0, 7, 0]} angle={0.55} penumbra={0.9} intensity={60} castShadow={tier === 'high'} shadow-mapSize={[1024, 1024]} color="#fff6e8" />
      <Environment resolution={tier === 'high' ? 256 : 128} frames={1}>
        {/* Tiras de luz cenitales tipo estudio */}
        {[-3, -1, 1, 3].map((x) => (
          <Lightformer key={x} form="rect" intensity={2.2} position={[x, 4.5, 0]} rotation-x={Math.PI / 2} scale={[0.5, 9, 1]} />
        ))}
        <Lightformer form="rect" intensity={4} position={[0, 2, 8]} scale={[10, 1.2, 1]} color="#f6efe2" />
        <Lightformer form="rect" intensity={2.5} position={[0, 1.2, -8]} scale={[12, 1, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[6, 0.4, 6]} rotation-y={-Math.PI / 4} scale={[6, 0.4, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-8, 1.5, -2]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} color="#d7b97f" />
        <Lightformer form="rect" intensity={1.2} position={[8, 1.5, 2]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, 6, -6]} scale={3} color="#e9dcc2" />
      </Environment>
      {/* Paneles de luz visibles que se reflejan en el piso */}
      {[-2.2, 0, 2.2].map((x) => (
        <mesh key={x} position={[x, 5.6, 0]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[0.18, 7]} />
          <meshBasicMaterial color="#fffaf0" toneMapped={false} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        {tier === 'high' ? (
          <MeshReflectorMaterial blur={[300, 80]} resolution={1024} mixBlur={1} mixStrength={38} roughness={0.85} depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.3} color="#121110" metalness={0.6} mirror={0.6} />
        ) : (
          <meshStandardMaterial color="#141311" roughness={0.55} metalness={0.4} />
        )}
      </mesh>
      {/* Anillo de piso: plataforma del showroom */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
        <ringGeometry args={[3.35, 3.38, 128]} />
        <meshBasicMaterial color="#d7b97f" transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <ContactShadows position={[0, 0.004, 0]} opacity={0.85} scale={9} blur={2.4} far={2} resolution={tier === 'high' ? 1024 : 512} color="#000" />
    </>
  );
}

function Hotspots({ active, onSelect }) {
  return HOTSPOTS.map((h) => (
    <Html key={h.id} position={h.pos} zIndexRange={[20, 0]} center={false}>
      <div className="hotspot">
        <button type="button" aria-label={h.title} aria-expanded={active === h.id} onClick={() => onSelect(active === h.id ? null : h.id)} />
        {active === h.id && (
          <div className="tip" role="note">
            <b>{h.title}</b>
            {h.text}
          </div>
        )}
      </div>
    </Html>
  ));
}

function Ready({ onReady }) {
  const called = useRef(false);
  useFrame(() => {
    if (!called.current) {
      called.current = true;
      requestAnimationFrame(() => onReady?.());
    }
  });
  return null;
}

export default function Showroom({ tier = 'high', mode = 'showcase', view, reduced, active, onSelectHotspot, onReady, visible = true, intro = true, color }) {
  const controls = useRef();
  const dpr = useMemo(() => (tier === 'high' ? [1, 1.75] : [1, 1.25]), [tier]);
  const [fov] = useState(() => (window.innerWidth < 700 ? 42 : 30));
  return (
    <Canvas
      shadows={tier === 'high'}
      dpr={dpr}
      frameloop={visible ? 'always' : 'never'}
      camera={{ position: INTRO_FROM.pos, fov, near: 0.1, far: 60 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      aria-hidden={mode === 'showcase'}
    >
      <Suspense fallback={null}>
        <Studio tier={tier} />
        <ConceptCar color={color} rotation-y={0} />
        {mode === 'explore' && <Hotspots active={active} onSelect={onSelectHotspot} />}
        <Ready onReady={onReady} />
      </Suspense>
      <OrbitControls
        ref={controls}
        enabled={mode === 'explore'}
        enablePan={false}
        enableZoom={mode === 'explore'}
        minDistance={4}
        maxDistance={mode === 'explore' ? 12 : 20}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.06}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
      />
      <CameraRig mode={mode} view={view} intro={intro} reduced={reduced} controls={controls} />
    </Canvas>
  );
}
