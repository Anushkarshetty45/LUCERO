import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ParticleBurst() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 15

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    })
    const container = containerRef.current
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Create central glowing sphere (hidden - only particles visible)
    const sphereGeometry = new THREE.SphereGeometry(5, 32, 32)
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    scene.add(sphere)

    // Add glow effect to sphere (hidden)
    const glowGeometry = new THREE.SphereGeometry(6, 32, 32)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    scene.add(glow)

    // Create particles
    const particleCount = 800
    const particlesGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities: THREE.Vector3[] = []
    const sizes = new Float32Array(particleCount)
    const alphas = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      // Distribute particles across the space like stars
      positions[i3] = (Math.random() - 0.5) * 60
      positions[i3 + 1] = (Math.random() - 0.5) * 40
      positions[i3 + 2] = (Math.random() - 0.5) * 20

      // Gentle drifting motion for stars
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.01
        )
      )

      sizes[i] = Math.random() * 0.15 + 0.1
      alphas[i] = Math.random() * 0.5 + 0.5
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particlesGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: createParticleTexture()
    })

    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particles)

    // Create particle texture
    function createParticleTexture() {
      const canvas = document.createElement('canvas')
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext('2d')!

      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 32, 32)

      const texture = new THREE.Texture(canvas)
      texture.needsUpdate = true
      return texture
    }

    // Animation
    let time = 0
    const animate = () => {
      requestAnimationFrame(animate)
      time += 0.016

      // Pulse the sphere
      const pulse = Math.sin(time * 2) * 0.1 + 1
      sphere.scale.set(pulse, pulse, pulse)
      glow.scale.set(pulse * 1.1, pulse * 1.1, pulse * 1.1)

      // Gentle rotation
      sphere.rotation.y += 0.005
      glow.rotation.y += 0.003

      // Animate particles - moving stars effect
      const positionsAttr = particlesGeometry.attributes.position
      const alphasAttr = particlesGeometry.attributes.alpha

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3

        // Move stars gently
        positionsAttr.array[i3] += velocities[i].x
        positionsAttr.array[i3 + 1] += velocities[i].y
        positionsAttr.array[i3 + 2] += velocities[i].z

        // Twinkling effect
        alphasAttr.array[i] = 0.5 + Math.sin(time * 2 + i) * 0.3

        // Wrap around when stars go out of bounds
        if (Math.abs(positionsAttr.array[i3]) > 30) {
          positionsAttr.array[i3] = -Math.sign(positionsAttr.array[i3]) * 30
        }
        if (Math.abs(positionsAttr.array[i3 + 1]) > 20) {
          positionsAttr.array[i3 + 1] = -Math.sign(positionsAttr.array[i3 + 1]) * 20
        }
        if (Math.abs(positionsAttr.array[i3 + 2]) > 10) {
          positionsAttr.array[i3 + 2] = -Math.sign(positionsAttr.array[i3 + 2]) * 10
        }
      }

      positionsAttr.needsUpdate = true
      alphasAttr.needsUpdate = true

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      sphereGeometry.dispose()
      sphereMaterial.dispose()
      glowGeometry.dispose()
      glowMaterial.dispose()
      particlesGeometry.dispose()
      particlesMaterial.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  )
}
