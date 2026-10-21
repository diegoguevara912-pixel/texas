import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, ContactShadows, Environment, Html, Lightformer, OrbitControls, useGLTF } from '@react-three/drei';

// Visor para modelos .glb AUTORIZADOS de una unidad concreta, subidos desde el panel.
function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function ModelViewer({ url }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [5, 2, 6], fov: 32 }} shadows={false}>
      <color attach="background" args={['#0d0c0b']} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.5} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, 1.5, 6]} scale={[8, 1, 1]} />
        <Lightformer form="rect" intensity={1} position={[-6, 1.5, 0]} rotation-y={Math.PI / 2} scale={[8, 1, 1]} color="#d7b97f" />
      </Environment>
      <Suspense fallback={<Html center><span className="mono muted">Cargando modelo 3D…</span></Html>}>
        <Bounds fit clip observe margin={1.15}>
          <Center top>
            <Model url={url} />
          </Center>
        </Bounds>
        <ContactShadows position={[0, 0, 0]} opacity={0.7} scale={12} blur={2.5} far={3} />
      </Suspense>
      <OrbitControls makeDefault enablePan={false} minPolarAngle={0.2} maxPolarAngle={Math.PI / 2 - 0.05} enableDamping />
    </Canvas>
  );
}
