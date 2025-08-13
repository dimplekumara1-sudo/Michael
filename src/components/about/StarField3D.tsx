import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarFieldProps {
  count?: number;
}

const StarField: React.FC<StarFieldProps> = ({ count = 5000 }) => {
  const ref = useRef<THREE.Points>(null);
  
  // Generate random positions for stars
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }
    return [positions, colors];
  }, [count]);

  // Animate the star field
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
      ref.current.rotation.z += 0.001;
    }
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        transparent
        vertexColors
        size={0.5}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
      />
    </points>
  );
};

const FloatingGeometry: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 2;
    }
  });

  return (
    <mesh ref={meshRef} position={[10, 0, -20]}>
      <icosahedronGeometry args={[2, 0]} />
      <meshBasicMaterial color="#ffffff" opacity={0.1} transparent wireframe />
    </mesh>
  );
};

const StarField3D: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <StarField count={3000} />
        <FloatingGeometry />
        
        {/* Additional floating elements */}
        <mesh position={[-15, 5, -30]}>
          <octahedronGeometry args={[1.5, 0]} />
          <meshBasicMaterial color="#ffffff" opacity={0.05} transparent wireframe />
        </mesh>
        
        <mesh position={[20, -10, -25]}>
          <tetrahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#ffffff" opacity={0.08} transparent wireframe />
        </mesh>
      </Canvas>
    </div>
  );
};

export default StarField3D;