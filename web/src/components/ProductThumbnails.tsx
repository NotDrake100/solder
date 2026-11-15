import React from 'react';

interface ProductThumbnailProps {
  id: string;
  className?: string;
}

export const ProductThumbnail: React.FC<ProductThumbnailProps> = ({ id, className = 'w-full h-full' }) => {
  switch (id) {
    case 'pocket-ai':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="pocket-top" x1="60" y1="30" x2="180" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
            <linearGradient id="pocket-left" x1="40" y1="80" x2="120" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <linearGradient id="pocket-right" x1="120" y1="120" x2="200" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#141416" />
            </linearGradient>
            <radialGradient id="speaker-glow" cx="150" cy="72" r="26" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="70%" stopColor="#111113" />
              <stop offset="100%" stopColor="#27272a" />
            </radialGradient>
          </defs>

          {/* Drop shadow */}
          <ellipse cx="120" cy="148" rx="80" ry="18" fill="#000000" opacity="0.45" filter="blur(6px)" />

          {/* Left Wall */}
          <polygon
            points="46,84 120,126 120,146 46,104"
            fill="url(#pocket-left)"
            stroke="#3f3f46"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Right Wall */}
          <polygon
            points="120,126 194,84 194,104 120,146"
            fill="url(#pocket-right)"
            stroke="#3f3f46"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Main Top Face */}
          <polygon
            points="120,42 194,84 120,126 46,84"
            fill="url(#pocket-top)"
            stroke="#52525b"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Top Chamfer Edge Highlight */}
          <polyline
            points="47,83 120,43 193,83"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />

          {/* OLED Screen Bezel & Screen */}
          <polygon
            points="70,82 108,60 108,82 70,104"
            fill="#09090b"
            stroke="#3f3f46"
            strokeWidth="1"
          />
          <polygon
            points="73,83 105,64 105,81 73,100"
            fill="#000000"
          />
          {/* OLED Audio Waveform / UI */}
          <polyline
            points="76,89 82,85 86,92 90,80 94,87 98,82 102,84"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* OLED Header text line */}
          <line x1="77" y1="84" x2="88" y2="78" stroke="#71717a" strokeWidth="0.8" />

          {/* Circular Acoustic Speaker Grille (isometric ellipse) */}
          <ellipse cx="146" cy="78" rx="22" ry="13" fill="url(#speaker-glow)" stroke="#3f3f46" strokeWidth="0.8" />
          <ellipse cx="146" cy="78" rx="17" ry="10" stroke="#27272a" strokeWidth="0.8" strokeDasharray="2 2" />
          <ellipse cx="146" cy="78" rx="12" ry="7" stroke="#3f3f46" strokeWidth="0.8" />
          {/* Speaker grill perforations */}
          <circle cx="146" cy="78" r="1.5" fill="#a1a1aa" />
          <circle cx="140" cy="76" r="1.2" fill="#71717a" />
          <circle cx="152" cy="80" r="1.2" fill="#71717a" />
          <circle cx="143" cy="82" r="1.2" fill="#71717a" />
          <circle cx="149" cy="74" r="1.2" fill="#71717a" />
          <circle cx="137" cy="80" r="1" fill="#52525b" />
          <circle cx="155" cy="76" r="1" fill="#52525b" />
          <circle cx="146" cy="72" r="1" fill="#52525b" />
          <circle cx="146" cy="84" r="1" fill="#52525b" />

          {/* Push-to-Talk Button (Cylinder on upper right) */}
          <ellipse cx="170" cy="62" rx="6" ry="3.5" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />
          <path d="M164,62 v4 a6,3.5 0 0,0 12,0 v-4 Z" fill="#27272a" stroke="#52525b" strokeWidth="0.8" />

          {/* Pinhole MEMS Mic */}
          <circle cx="118" cy="60" r="1.5" fill="#09090b" stroke="#71717a" strokeWidth="0.6" />

          {/* USB-C Port Cutout on Front Right */}
          <rect x="156" y="99" width="12" height="3" rx="1.5" transform="skewY(-30)" fill="#09090b" stroke="#52525b" strokeWidth="0.6" />

          {/* Status LED */}
          <circle cx="116" cy="116" r="1.5" fill="#ffffff" />
        </svg>
      );

    case 'sip':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sip-box-top" x1="50" y1="40" x2="140" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
            <linearGradient id="probe-grad" x1="160" y1="70" x2="200" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
          </defs>

          {/* Shadows */}
          <ellipse cx="95" cy="142" rx="55" ry="14" fill="#000" opacity="0.4" filter="blur(5px)" />
          <ellipse cx="185" cy="152" rx="25" ry="8" fill="#000" opacity="0.35" filter="blur(4px)" />

          {/* Controller Hub Box (Left) */}
          <polygon points="40,80 95,112 95,134 40,102" fill="#141416" stroke="#3f3f46" strokeWidth="1" />
          <polygon points="95,112 150,80 150,102 95,134" fill="#1c1c20" stroke="#3f3f46" strokeWidth="1" />
          <polygon points="95,48 150,80 95,112 40,80" fill="url(#sip-box-top)" stroke="#52525b" strokeWidth="1.2" />
          <polyline points="41,79 95,49 149,79" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.35" />

          {/* OLED screen on Hub Box */}
          <polygon points="56,77 86,60 86,76 56,93" fill="#09090b" stroke="#3f3f46" strokeWidth="0.8" />
          {/* Water drop & percentage readout */}
          <path d="M70,72 C68,76 67,78 67,80 A3,3 0 0,0 73,80 C73,78 72,76 70,72 Z" fill="#ffffff" />
          <line x1="75" y1="76" x2="82" y2="72" stroke="#a1a1aa" strokeWidth="1.2" />
          <line x1="75" y1="80" x2="80" y2="77" stroke="#71717a" strokeWidth="1" />

          {/* 5V Relay Block */}
          <polygon points="102,74 134,56 142,61 110,79" fill="#18181b" stroke="#52525b" strokeWidth="0.8" />
          <rect x="105" y="72" width="6" height="4" transform="skewY(-30)" fill="#3f3f46" />
          <rect x="115" y="66" width="6" height="4" transform="skewY(-30)" fill="#3f3f46" />

          {/* Connecting Wire Harness to Probe */}
          <path
            d="M135,85 C155,90 160,80 175,95"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M137,88 C158,95 163,84 178,98"
            stroke="#ffffff"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Iconic Capacitive Soil Moisture Probe (Right) */}
          {/* Top header plate */}
          <polygon points="166,94 188,81 198,87 176,100" fill="#27272a" stroke="#52525b" strokeWidth="1" />
          <circle cx="178" cy="91" r="1.5" fill="#ffffff" />
          <circle cx="184" cy="88" r="1.5" fill="#ffffff" />
          <circle cx="190" cy="85" r="1.5" fill="#ffffff" />

          {/* Long Two-Prong Probe Blade */}
          <polygon points="172,100 186,92 198,148 184,156" fill="url(#probe-grad)" stroke="#71717a" strokeWidth="1" />
          {/* Center prong slot cutout */}
          <polygon points="178,112 184,108 190,140 184,144" fill="#0a0a0a" stroke="#3f3f46" strokeWidth="0.8" />
          {/* Capacitive trace lines on prongs */}
          <line x1="175" y1="110" x2="182" y2="145" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
          <line x1="188" y1="102" x2="195" y2="137" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />

          {/* Mini DC Submersible Water Pump */}
          <ellipse cx="68" cy="128" rx="14" ry="7" fill="#27272a" stroke="#52525b" strokeWidth="0.8" />
          <path d="M54,128 v8 a14,7 0 0,0 28,0 v-8 Z" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
          {/* Outlet Hose tube */}
          <path d="M72,126 C75,115 82,112 88,110" stroke="#71717a" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'wisp':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="lamp-glow" cx="120" cy="65" r="45" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#a1a1aa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="dome-grad" x1="85" y1="35" x2="155" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#e4e4e7" />
              <stop offset="100%" stopColor="#71717a" />
            </linearGradient>
            <linearGradient id="base-grad" x1="80" y1="95" x2="160" y2="155" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
          </defs>

          {/* Ambient Glow */}
          <ellipse cx="120" cy="70" rx="55" ry="35" fill="url(#lamp-glow)" />
          {/* Shadow */}
          <ellipse cx="120" cy="154" rx="55" ry="14" fill="#000" opacity="0.45" filter="blur(6px)" />

          {/* Pedestal Base */}
          <ellipse cx="120" cy="144" rx="46" ry="18" fill="url(#base-grad)" stroke="#3f3f46" strokeWidth="1" />
          <path d="M74,124 v20 a46,18 0 0,0 92,0 v-20 Z" fill="#141416" stroke="#3f3f46" strokeWidth="1" />
          <ellipse cx="120" cy="124" rx="46" ry="18" fill="#27272a" stroke="#52525b" strokeWidth="1" />
          <ellipse cx="120" cy="124" rx="46" ry="18" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.3" />

          {/* Translucent Glowing Diffuser Lantern Dome */}
          <path
            d="M84,95 C84,55 98,35 120,35 C142,35 156,55 156,95 Z"
            fill="url(#dome-grad)"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          {/* Diffuser accent lines */}
          <ellipse cx="120" cy="78" rx="34" ry="12" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.7" fill="none" />
          <ellipse cx="120" cy="94" rx="36" ry="13" stroke="#e4e4e7" strokeWidth="0.8" fill="none" />

          {/* PIR Motion Sensor Dome (Faceted Fresnel Lens) on front cylinder */}
          <ellipse cx="120" cy="128" rx="14" ry="10" fill="#e4e4e7" stroke="#ffffff" strokeWidth="1" />
          {/* Faceted Fresnel lens grid */}
          <circle cx="120" cy="128" r="4" fill="#ffffff" stroke="#71717a" strokeWidth="0.5" />
          <line x1="120" y1="118" x2="120" y2="138" stroke="#71717a" strokeWidth="0.6" />
          <line x1="108" y1="128" x2="132" y2="128" stroke="#71717a" strokeWidth="0.6" />
          <line x1="112" y1="122" x2="128" y2="134" stroke="#71717a" strokeWidth="0.5" />
          <line x1="112" y1="134" x2="128" y2="122" stroke="#71717a" strokeWidth="0.5" />

          {/* Photodiode Ambient Light Sensor Aperture */}
          <circle cx="145" cy="130" r="2" fill="#000000" stroke="#71717a" strokeWidth="0.8" />

          {/* Base Rocker Switch */}
          <rect x="94" y="138" width="8" height="4" rx="1" fill="#3f3f46" stroke="#71717a" strokeWidth="0.5" />
        </svg>
      );

    case 'eave':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="solar-panel" x1="70" y1="40" x2="170" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <linearGradient id="eave-body" x1="60" y1="80" x2="180" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
          </defs>

          {/* Shadow */}
          <ellipse cx="120" cy="154" rx="65" ry="14" fill="#000" opacity="0.4" filter="blur(5px)" />

          {/* Main Weather Enclosure Body */}
          <polygon points="60,90 120,126 120,150 60,114" fill="#141416" stroke="#3f3f46" strokeWidth="1" />
          <polygon points="120,126 180,90 180,114 120,150" fill="#1c1c20" stroke="#3f3f46" strokeWidth="1" />
          <polygon points="120,54 180,90 120,126 60,90" fill="url(#eave-body)" stroke="#52525b" strokeWidth="1.2" />

          {/* Angled Rooftop Solar Panel Plate */}
          <polygon
            points="120,40 186,78 120,116 54,78"
            fill="url(#solar-panel)"
            stroke="#71717a"
            strokeWidth="1.2"
          />
          {/* Top highlight */}
          <polyline points="55,77 120,39 185,77" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
          {/* Photovoltaic silicon gridlines */}
          <line x1="87" y1="59" x2="153" y2="97" stroke="#3f3f46" strokeWidth="0.8" />
          <line x1="98" y1="53" x2="164" y2="91" stroke="#3f3f46" strokeWidth="0.8" />
          <line x1="142" y1="53" x2="76" y2="91" stroke="#3f3f46" strokeWidth="0.8" />
          <line x1="153" y1="59" x2="87" y2="97" stroke="#3f3f46" strokeWidth="0.8" />
          {/* Silver solar busbars */}
          <line x1="120" y1="44" x2="120" y2="112" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.75" />

          {/* Louvered side vents (left face) */}
          <line x1="68" y1="98" x2="112" y2="124" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="68" y1="98" x2="112" y2="124" stroke="#3f3f46" strokeWidth="1" strokeLinecap="round" />
          <line x1="68" y1="104" x2="112" y2="130" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="68" y1="104" x2="112" y2="130" stroke="#3f3f46" strokeWidth="1" strokeLinecap="round" />
          <line x1="68" y1="110" x2="112" y2="136" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="68" y1="110" x2="112" y2="136" stroke="#3f3f46" strokeWidth="1" strokeLinecap="round" />

          {/* Dual Ultrasonic Sonar Transceiver "Eyes" (Right face) */}
          {/* Transducer 1 (Tx) */}
          <ellipse cx="140" cy="116" rx="10" ry="7" fill="#27272a" stroke="#71717a" strokeWidth="1" />
          <ellipse cx="140" cy="116" rx="7" ry="5" fill="#09090b" stroke="#ffffff" strokeWidth="0.8" />
          <ellipse cx="140" cy="116" rx="4" ry="2.5" fill="#52525b" />

          {/* Transducer 2 (Rx) */}
          <ellipse cx="164" cy="102" rx="10" ry="7" fill="#27272a" stroke="#71717a" strokeWidth="1" />
          <ellipse cx="164" cy="102" rx="7" ry="5" fill="#09090b" stroke="#ffffff" strokeWidth="0.8" />
          <ellipse cx="164" cy="102" rx="4" ry="2.5" fill="#52525b" />

          {/* External Temp/Humidity Sensor Probe Stem underneath */}
          <rect x="116" y="146" width="8" height="18" fill="#27272a" stroke="#52525b" strokeWidth="0.8" />
          <line x1="115" y1="152" x2="125" y2="152" stroke="#71717a" strokeWidth="1" />
          <line x1="115" y1="156" x2="125" y2="156" stroke="#71717a" strokeWidth="1" />
          <line x1="115" y1="160" x2="125" y2="160" stroke="#71717a" strokeWidth="1" />

          {/* Telemetry Antenna Mast */}
          <line x1="64" y1="72" x2="64" y2="35" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="64" cy="34" r="2" fill="#ffffff" />
        </svg>
      );

    case 'robot-car':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="chassis-deck" x1="50" y1="60" x2="190" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
            <linearGradient id="tire-grad" x1="20" y1="80" x2="70" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="50%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
          </defs>

          {/* Wheel & Chassis Shadows */}
          <ellipse cx="50" cy="144" rx="22" ry="8" fill="#000" opacity="0.45" filter="blur(4px)" />
          <ellipse cx="190" cy="144" rx="22" ry="8" fill="#000" opacity="0.45" filter="blur(4px)" />
          <ellipse cx="120" cy="154" rx="60" ry="12" fill="#000" opacity="0.4" filter="blur(5px)" />

          {/* Left Large Drive Wheel (Tire with deep treads) */}
          <ellipse cx="48" cy="118" rx="16" ry="26" fill="url(#tire-grad)" stroke="#3f3f46" strokeWidth="1.2" />
          <ellipse cx="48" cy="118" rx="10" ry="18" fill="#09090b" stroke="#71717a" strokeWidth="1" />
          {/* Wheel Spokes / Hub */}
          <circle cx="48" cy="118" r="4" fill="#ffffff" />
          <line x1="48" y1="102" x2="48" y2="134" stroke="#a1a1aa" strokeWidth="1" />
          <line x1="40" y1="110" x2="56" y2="126" stroke="#71717a" strokeWidth="1" />
          {/* Tire Tread Cleats */}
          <line x1="38" y1="96" x2="46" y2="98" stroke="#ffffff" strokeWidth="1" />
          <line x1="33" y1="110" x2="41" y2="111" stroke="#ffffff" strokeWidth="1" />
          <line x1="34" y1="126" x2="42" y2="125" stroke="#ffffff" strokeWidth="1" />

          {/* Right Large Drive Wheel */}
          <ellipse cx="192" cy="118" rx="16" ry="26" fill="url(#tire-grad)" stroke="#3f3f46" strokeWidth="1.2" />
          <ellipse cx="192" cy="118" rx="10" ry="18" fill="#09090b" stroke="#71717a" strokeWidth="1" />
          <circle cx="192" cy="118" r="4" fill="#ffffff" />
          <line x1="192" y1="102" x2="192" y2="134" stroke="#a1a1aa" strokeWidth="1" />
          <line x1="184" y1="126" x2="200" y2="110" stroke="#71717a" strokeWidth="1" />

          {/* Main Robot Chassis Platform Plate */}
          <polygon
            points="120,68 184,98 120,136 56,98"
            fill="url(#chassis-deck)"
            stroke="#52525b"
            strokeWidth="1.2"
          />
          {/* Edge Highlight */}
          <polyline points="57,97 120,69 183,97" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
          {/* Plate thickness */}
          <polygon points="56,98 120,136 120,142 56,104" fill="#141416" stroke="#3f3f46" strokeWidth="1" />
          <polygon points="120,136 184,98 184,104 120,142" fill="#1c1c20" stroke="#3f3f46" strokeWidth="1" />

          {/* Caster Wheel (Front bottom nose) */}
          <ellipse cx="120" cy="148" rx="6" ry="4" fill="#a1a1aa" stroke="#ffffff" strokeWidth="0.8" />

          {/* Microcontroller PCB on Deck */}
          <polygon points="104,82 136,66 148,72 116,88" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
          {/* DIP Microcontroller IC */}
          <polygon points="110,80 126,72 130,74 114,82" fill="#000000" stroke="#52525b" strokeWidth="0.6" />
          <line x1="106" y1="84" x2="114" y2="88" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="1 1" />

          {/* Front Bumper Ultrasonic Distance Sensor (Eyes) */}
          {/* Servo Pan Bracket */}
          <rect x="114" y="112" width="12" height="8" fill="#27272a" stroke="#52525b" strokeWidth="0.8" />
          {/* Ultrasonic Sensor PCB plate */}
          <polygon points="98,118 142,118 142,106 98,106" fill="#18181b" stroke="#52525b" strokeWidth="1" />
          {/* Left Sonar Eye Barrel */}
          <ellipse cx="109" cy="112" rx="7" ry="7" fill="#27272a" stroke="#ffffff" strokeWidth="1" />
          <circle cx="109" cy="112" r="4.5" fill="#09090b" stroke="#71717a" strokeWidth="0.6" />
          <circle cx="109" cy="112" r="2" fill="#ffffff" />
          {/* Right Sonar Eye Barrel */}
          <ellipse cx="131" cy="112" rx="7" ry="7" fill="#27272a" stroke="#ffffff" strokeWidth="1" />
          <circle cx="131" cy="112" r="4.5" fill="#09090b" stroke="#71717a" strokeWidth="0.6" />
          <circle cx="131" cy="112" r="2" fill="#ffffff" />
        </svg>
      );

    case 'hasp':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="doorbell-front" x1="80" y1="30" x2="160" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="50%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <radialGradient id="chime-glow" cx="120" cy="115" r="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#a1a1aa" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Wall mount drop shadow */}
          <ellipse cx="120" cy="154" rx="55" ry="14" fill="#000000" opacity="0.45" filter="blur(6px)" />

          {/* Wall Backplate Bracket (Isometric depth) */}
          <path
            d="M86,40 C86,34 92,30 98,30 L142,30 C148,30 154,34 154,40 L154,140 C154,146 148,150 142,150 L98,150 C92,150 86,146 86,140 Z"
            fill="#141416"
            stroke="#3f3f46"
            strokeWidth="1"
          />

          {/* Doorbell Body (Sleek chamfered front fascia) */}
          <path
            d="M92,34 C92,30 96,26 102,26 L138,26 C144,26 148,30 148,34 L148,136 C148,142 144,146 138,146 L102,146 C96,146 92,142 92,136 Z"
            fill="url(#doorbell-front)"
            stroke="#52525b"
            strokeWidth="1.2"
          />

          {/* Top Edge Highlight */}
          <path
            d="M93,34 C93,31 97,27 102,27 L138,27 C143,27 147,31 147,34"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.45"
            strokeLinecap="round"
          />

          {/* Upper Camera Lens / Motion Optical Sensor */}
          <circle cx="120" cy="52" r="10" fill="#09090b" stroke="#3f3f46" strokeWidth="1" />
          <circle cx="120" cy="52" r="6" fill="#000000" stroke="#71717a" strokeWidth="0.8" />
          <circle cx="118" cy="50" r="1.8" fill="#ffffff" />
          <circle cx="120" cy="38" r="1.5" fill="#ffffff" />

          {/* Chime Speaker Acoustic Slits (for buzzer chime) */}
          <line x1="108" y1="72" x2="132" y2="72" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="104" y1="77" x2="136" y2="77" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="108" y1="82" x2="132" y2="82" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />

          {/* Glowing Aura around Chime Button */}
          <circle cx="120" cy="114" r="24" fill="url(#chime-glow)" />

          {/* Iconic Doorbell Push Button with Illuminated Halo Ring */}
          <circle cx="120" cy="114" r="18" fill="#09090b" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="120" cy="114" r="14" fill="#27272a" stroke="#71717a" strokeWidth="0.8" />

          {/* Bell Icon engraved inside button */}
          <path
            d="M120,105 C116.5,105 114,108 114,112 L113,117 L127,117 L126,112 C126,108 123.5,105 120,105 Z"
            fill="#ffffff"
          />
          <circle cx="120" cy="119.5" r="1.5" fill="#ffffff" />
          <circle cx="120" cy="103.5" r="1" fill="#ffffff" />

          {/* Acoustic Chime Tone Wave Arcs radiating from button */}
          <path d="M144,106 A15,15 0 0,1 144,122" stroke="#a1a1aa" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M150,100 A24,24 0 0,1 150,128" stroke="#71717a" strokeWidth="1" strokeLinecap="round" fill="none" />
          <path d="M96,106 A15,15 0 0,0 96,122" stroke="#a1a1aa" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M90,100 A24,24 0 0,0 90,128" stroke="#71717a" strokeWidth="1" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'desk-fan':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="blade-grad" cx="120" cy="80" r="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#a1a1aa" />
              <stop offset="100%" stopColor="#27272a" />
            </radialGradient>
          </defs>

          {/* Shadow */}
          <ellipse cx="120" cy="154" rx="55" ry="12" fill="#000" opacity="0.45" filter="blur(5px)" />

          {/* Desk Stand Base & Bracket */}
          <ellipse cx="120" cy="148" rx="42" ry="14" fill="#18181b" stroke="#52525b" strokeWidth="1.2" />
          <ellipse cx="120" cy="148" rx="42" ry="14" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.25" />
          {/* U-Bracket Arm */}
          <path
            d="M92,142 C92,110 98,90 108,82 M148,142 C148,110 142,90 132,82"
            stroke="#3f3f46"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Rear Motor Housing */}
          <ellipse cx="120" cy="78" rx="14" ry="12" fill="#141416" stroke="#3f3f46" strokeWidth="1" />

          {/* Outer Protective Shroud / Circular Cage */}
          <circle cx="120" cy="78" r="44" stroke="#52525b" strokeWidth="3" fill="#09090b" fillOpacity="0.4" />
          <circle cx="120" cy="78" r="44" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.5" />
          {/* Inner concentric grill wire */}
          <circle cx="120" cy="78" r="32" stroke="#3f3f46" strokeWidth="0.8" fill="none" />
          <circle cx="120" cy="78" r="20" stroke="#3f3f46" strokeWidth="0.8" fill="none" />
          {/* Radial wire spokes */}
          <line x1="120" y1="34" x2="120" y2="122" stroke="#52525b" strokeWidth="0.8" />
          <line x1="76" y1="78" x2="164" y2="78" stroke="#52525b" strokeWidth="0.8" />
          <line x1="89" y1="47" x2="151" y2="109" stroke="#3f3f46" strokeWidth="0.8" />
          <line x1="89" y1="109" x2="151" y2="47" stroke="#3f3f46" strokeWidth="0.8" />

          {/* 5 Aerodynamic Fan Rotor Blades */}
          <g transform="translate(120, 78)">
            {/* Blade 1 (0 deg) */}
            <path d="M0,0 C6,-12 18,-24 20,-36 C10,-34 -2,-26 -4,-12 Z" fill="url(#blade-grad)" stroke="#ffffff" strokeWidth="0.8" />
            {/* Blade 2 (72 deg) */}
            <path d="M0,0 C6,-12 18,-24 20,-36 C10,-34 -2,-26 -4,-12 Z" transform="rotate(72)" fill="url(#blade-grad)" stroke="#ffffff" strokeWidth="0.8" />
            {/* Blade 3 (144 deg) */}
            <path d="M0,0 C6,-12 18,-24 20,-36 C10,-34 -2,-26 -4,-12 Z" transform="rotate(144)" fill="url(#blade-grad)" stroke="#ffffff" strokeWidth="0.8" />
            {/* Blade 4 (216 deg) */}
            <path d="M0,0 C6,-12 18,-24 20,-36 C10,-34 -2,-26 -4,-12 Z" transform="rotate(216)" fill="url(#blade-grad)" stroke="#ffffff" strokeWidth="0.8" />
            {/* Blade 5 (288 deg) */}
            <path d="M0,0 C6,-12 18,-24 20,-36 C10,-34 -2,-26 -4,-12 Z" transform="rotate(288)" fill="url(#blade-grad)" stroke="#ffffff" strokeWidth="0.8" />
            {/* Central Spinner Hub */}
            <circle cx="0" cy="0" r="10" fill="#27272a" stroke="#ffffff" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="4" fill="#ffffff" />
          </g>

          {/* Thermal Sensor Probe Bead & Lead wire */}
          <path d="M150,146 C165,148 175,142 185,144" stroke="#a1a1aa" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <circle cx="186" cy="144" r="2.5" fill="#ffffff" stroke="#000" strokeWidth="0.5" />
        </svg>
      );

    case 'macro-pad':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="wedge-top" x1="60" y1="50" x2="180" y2="130" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
            <linearGradient id="knob-grad" x1="160" y1="50" x2="185" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#71717a" />
              <stop offset="100%" stopColor="#27272a" />
            </linearGradient>
          </defs>

          {/* Shadow */}
          <ellipse cx="120" cy="154" rx="70" ry="14" fill="#000" opacity="0.45" filter="blur(6px)" />

          {/* Wedge Enclosure Body */}
          <polygon points="50,90 120,132 120,148 50,106" fill="#141416" stroke="#3f3f46" strokeWidth="1" />
          <polygon points="120,132 190,90 190,106 120,148" fill="#1c1c20" stroke="#3f3f46" strokeWidth="1" />
          <polygon points="120,48 190,90 120,132 50,90" fill="url(#wedge-top)" stroke="#52525b" strokeWidth="1.2" />
          <polyline points="51,89 120,49 189,89" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />

          {/* OLED Ticker Screen Strip along top */}
          <polygon points="80,68 135,36 142,40 87,72" fill="#09090b" stroke="#3f3f46" strokeWidth="0.8" />
          <line x1="88" y1="67" x2="130" y2="43" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />

          {/* Metallic Rotary Encoder Knob with Knurled Rim */}
          <ellipse cx="162" cy="62" rx="12" ry="7" fill="url(#knob-grad)" stroke="#ffffff" strokeWidth="1" />
          <path d="M150,62 v5 a12,7 0 0,0 24,0 v-5 Z" fill="#27272a" stroke="#52525b" strokeWidth="0.8" />
          {/* Knob index indicator dot */}
          <circle cx="162" cy="58" r="1.5" fill="#ffffff" />

          {/* 3x3 Grid of Mechanical Keycaps */}
          {/* Row 1 */}
          {/* Key 1 */}
          <polygon points="76,82 90,74 90,82 76,90" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="76,82 90,74 98,78 84,86" fill="#52525b" stroke="#a1a1aa" strokeWidth="0.8" />
          {/* Key 2 */}
          <polygon points="98,95 112,87 112,95 98,103" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="98,95 112,87 120,91 106,99" fill="#52525b" stroke="#a1a1aa" strokeWidth="0.8" />
          {/* Key 3 */}
          <polygon points="120,108 134,100 134,108 120,116" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="120,108 134,100 142,104 128,112" fill="#52525b" stroke="#a1a1aa" strokeWidth="0.8" />

          {/* Row 2 */}
          {/* Key 4 */}
          <polygon points="94,72 108,64 108,72 94,80" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="94,72 108,64 116,68 102,76" fill="#52525b" stroke="#a1a1aa" strokeWidth="0.8" />
          {/* Key 5 */}
          <polygon points="116,85 130,77 130,85 116,93" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="116,85 130,77 138,81 124,89" fill="#52525b" stroke="#a1a1aa" strokeWidth="0.8" />
          {/* Key 6 */}
          <polygon points="138,98 152,90 152,98 138,106" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="138,98 152,90 160,94 146,102" fill="#52525b" stroke="#a1a1aa" strokeWidth="0.8" />

          {/* Row 3 */}
          {/* Key 7 */}
          <polygon points="112,62 126,54 126,62 112,70" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="112,62 126,54 134,58 120,66" fill="#52525b" stroke="#a1a1aa" strokeWidth="0.8" />
          {/* Key 8 */}
          <polygon points="134,75 148,67 148,75 134,83" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="134,75 148,67 156,71 142,79" fill="#52525b" stroke="#a1a1aa" strokeWidth="0.8" />
          {/* Key 9 */}
          <polygon points="156,88 170,80 170,88 156,96" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="156,88 170,80 178,84 164,92" fill="#52525b" stroke="#a1a1aa" strokeWidth="0.8" />

          {/* USB-C Rear Cutout */}
          <rect x="76" y="60" width="8" height="3" rx="1" transform="skewY(30)" fill="#09090b" stroke="#52525b" strokeWidth="0.6" />
        </svg>
      );

    default:
      return null;
  }
};
