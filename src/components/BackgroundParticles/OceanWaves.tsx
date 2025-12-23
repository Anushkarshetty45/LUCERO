import './OceanWaves.css'

/**
 * OceanWaves component
 * Multi-layer SVG wave animation for Ocean Breeze theme
 */
export default function OceanWaves() {
  return (
    <div className="ocean-waves">
      {/* Layer 1 - Slow */}
      <svg
        className="wave wave-1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
      >
        <defs>
          <path
            id="wave-path-1"
            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
          />
        </defs>
        <g>
          <use xlinkHref="#wave-path-1" x="50" y="0" fill="rgba(74, 144, 184, 0.1)" />
        </g>
      </svg>

      {/* Layer 2 - Medium */}
      <svg
        className="wave wave-2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
      >
        <defs>
          <path
            id="wave-path-2"
            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
          />
        </defs>
        <g>
          <use xlinkHref="#wave-path-2" x="50" y="3" fill="rgba(43, 95, 124, 0.15)" />
        </g>
      </svg>

      {/* Layer 3 - Fast */}
      <svg
        className="wave wave-3"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
      >
        <defs>
          <path
            id="wave-path-3"
            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
          />
        </defs>
        <g>
          <use xlinkHref="#wave-path-3" x="50" y="6" fill="rgba(26, 58, 82, 0.1)" />
        </g>
      </svg>
    </div>
  )
}
