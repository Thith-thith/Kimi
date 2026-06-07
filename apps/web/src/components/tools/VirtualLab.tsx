"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FlaskConical, RefreshCw, Pencil, HelpCircle, X, Plus } from "lucide-react";
import Matter from "matter-js";

interface VirtualLabProps {
  onClose?: () => void;
}

interface Particle {
  el: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  mode: "inside" | "spill" | "vapor";
  tint?: number;
}

interface ElementItem {
  sym: string;
  name: string;
  color: string;
}

interface ElementGroup {
  group: string;
  elements: ElementItem[];
}

interface ReactionData {
  rate: number;
  heat: number;
  bubbleRate: number;
  waterColor: string | null;
  eq: string;
}

interface Bubble {
  el: HTMLSpanElement;
  worldX: number;
  worldY: number;
  vy: number;
  vx: number;
  life: number;
  maxLife: number;
  size: number;
}

const METAL_ELEMENTS: ElementGroup[] = [
  {
    group: "Alkali Metal",
    elements: [
      { sym: "Li", name: "Lithium", color: "#e85d5d" },
      { sym: "Na", name: "Sodium", color: "#e85d5d" },
      { sym: "K", name: "Potassium", color: "#e85d5d" },
      { sym: "Rb", name: "Rubidium", color: "#e85d5d" },
      { sym: "Cs", name: "Caesium", color: "#e85d5d" },
      { sym: "Fr", name: "Francium", color: "#e85d5d" },
    ]
  },
  {
    group: "Alkaline Earth Metal",
    elements: [
      { sym: "Be", name: "Beryllium", color: "#e8a14d" },
      { sym: "Mg", name: "Magnesium", color: "#e8a14d" },
      { sym: "Ca", name: "Calcium", color: "#e8a14d" },
      { sym: "Sr", name: "Strontium", color: "#e8a14d" },
      { sym: "Ba", name: "Barium", color: "#e8a14d" },
      { sym: "Ra", name: "Radium", color: "#e8a14d" },
    ]
  },
  {
    group: "Titration / Reactants",
    elements: [
      { sym: "HCl", name: "Hydrochloric Acid", color: "#3b82f6" },
      { sym: "NaOH", name: "Sodium Hydroxide", color: "#ef4444" },
      { sym: "AgNO3", name: "Silver Nitrate", color: "#6b7280" },
      { sym: "NaCl", name: "Sodium Chloride", color: "#d1d5db" },
      { sym: "C", name: "Carbon (Coal)", color: "#1f2937" },
    ]
  }
];

const REACTION_DATA: Record<string, ReactionData> = {
  Li: { rate: 0.00020, heat: 18, bubbleRate: 0.35, waterColor: "rgba(220,225,235,0.35)", eq: "2Li + 2H₂O → 2LiOH + H₂↑" },
  Na: { rate: 0.00055, heat: 45, bubbleRate: 0.65, waterColor: "rgba(220,225,235,0.40)", eq: "2Na + 2H₂O → 2NaOH + H₂↑" },
  K:  { rate: 0.00090, heat: 70, bubbleRate: 0.90, waterColor: "rgba(215,220,235,0.45)", eq: "2K + 2H₂O → 2KOH + H₂↑" },
  Rb: { rate: 0.00130, heat: 85, bubbleRate: 1.20, waterColor: "rgba(215,220,235,0.50)", eq: "2Rb + 2H₂O → 2RbOH + H₂↑" },
  Cs: { rate: 0.00180, heat: 95, bubbleRate: 1.50, waterColor: "rgba(210,215,230,0.55)", eq: "2Cs + 2H₂O → 2CsOH + H₂↑" },
  Fr: { rate: 0.00200, heat: 99, bubbleRate: 1.80, waterColor: "rgba(210,215,230,0.60)", eq: "2Fr + 2H₂O → 2FrOH + H₂↑" },
  Be: { rate: 0,       heat: 0,  bubbleRate: 0,    waterColor: null,                      eq: "Be + H₂O → No Reaction" },
  Mg: { rate: 0.00005, heat: 5,  bubbleRate: 0.08, waterColor: "rgba(230,235,240,0.15)", eq: "Mg + 2H₂O → Mg(OH)₂ + H₂↑" },
  Ca: { rate: 0.00025, heat: 22, bubbleRate: 0.45, waterColor: "rgba(235,235,230,0.50)", eq: "Ca + 2H₂O → Ca(OH)₂ + H₂↑" },
  Sr: { rate: 0.00040, heat: 35, bubbleRate: 0.55, waterColor: "rgba(225,230,235,0.40)", eq: "Sr + 2H₂O → Sr(OH)₂ + H₂↑" },
  Ba: { rate: 0.00060, heat: 50, bubbleRate: 0.70, waterColor: "rgba(220,225,235,0.45)", eq: "Ba + 2H₂O → Ba(OH)₂ + H₂↑" },
  Ra: { rate: 0.00080, heat: 60, bubbleRate: 0.80, waterColor: "rgba(215,220,230,0.50)", eq: "Ra + 2H₂O → Ra(OH)₂ + H₂↑" },
  HCl: { rate: 0.0018, heat: 25, bubbleRate: 0,    waterColor: "rgba(224,231,255,0.2)",  eq: "HCl + H₂O → H₃O⁺ + Cl⁻" },
  NaOH: { rate: 0.0014, heat: 45, bubbleRate: 0,   waterColor: "rgba(244,63,94,0.2)",    eq: "NaOH(s) → Na⁺(aq) + OH⁻(aq)" },
  AgNO3: { rate: 0.0010, heat: 5,  bubbleRate: 0,   waterColor: "rgba(243,244,246,0.3)",  eq: "AgNO₃(s) → Ag⁺(aq) + NO₃⁻(aq)" },
  NaCl: { rate: 0.0012, heat: 1,  bubbleRate: 0,    waterColor: "rgba(249,250,251,0.1)",  eq: "NaCl(s) → Na⁺(aq) + Cl⁻(aq)" },
  C: { rate: 0,       heat: 0,  bubbleRate: 0,    waterColor: null,                      eq: "C + H₂O → No Reaction" },
};

export default function VirtualLab({ onClose }: VirtualLabProps) {
  const tTools = useTranslations("tools");
  const tLab = useTranslations("virtualLab");
  const tTutorial = useTranslations("virtualLabTutorial");

  const [selectedElement, setSelectedElement] = useState<ElementItem>(METAL_ELEMENTS[0].elements[1]); // Na
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reactionInfo, setReactionInfo] = useState<string | null>(null);
  const [reactionActive, setReactionActive] = useState(false);
  const [heaterLevel, setHeaterLevel] = useState<number>(0);
  const heaterRef = useRef(0);

  // Refs for scene and animation loop
  const sceneRef = useRef<HTMLDivElement>(null);
  const beakerWrapRef = useRef<HTMLDivElement>(null);
  const beakerBodyRef = useRef<HTMLDivElement>(null);
  const fluidLayerRef = useRef<HTMLDivElement>(null);
  const spillLayerRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const standRef = useRef<HTMLDivElement>(null);
  const thermoFillRef = useRef<HTMLDivElement>(null);
  const thermoTempRef = useRef<HTMLDivElement>(null);
  const elementPickerRef = useRef<HTMLDivElement>(null);

  // Animation and physics state refs (avoid React render delay at 60fps)
  const stateRef = useRef({
    x: 0,
    y: 0,
    rot: 0,
    dragging: false,
    dragMode: "move" as "move" | "rotate",
    pointerId: null as number | "mouse" | null,
    startPointerX: 0,
    startPointerY: 0,
    startX: 0,
    startY: 0,
    startRot: 0,
    totalMove: 0,
    lastClientX: 0,
    lastClientY: 0,
    animationFrame: 0,
    particles: [] as Particle[],
    prevX: 0,
    prevY: 0,
    prevRot: 0,
    initialized: false,
  });

  const cubeRefState = useRef({
    x: 0, y: 0,
    vx: 0, vy: 0,
    angle: 0,
    w: 58, h: 58,
    dragging: false,
    insideBeaker: false,
    pointerId: null as number | "mouse" | null,
    dragOffsetX: 0, dragOffsetY: 0,
    targetX: 0, targetY: 0,
    totalDrag: 0,
    physicsScale: 1,
  });

  const rxnRef = useRef({
    active: false,
    progress: 0,
    temperature: 20,
    waterTint: 0,
    bubbles: [] as Bubble[],
    cubeScale: 1,
    lastElement: null as string | null,
  });

  // MatterJS engine variables refs
  const matterEngineRef = useRef<Matter.Engine | null>(null);
  const matterCubeBodyRef = useRef<Matter.Body | null>(null);
  const matterStandBodyRef = useRef<Matter.Body | null>(null);
  const matterSceneBodiesRef = useRef<Matter.Body[]>([]);
  const matterBeakerBodiesRef = useRef<Matter.Body[]>([]);

  // Constant Physics Parameters
  const PARTICLE_SEED_COUNT = 65;
  const ADD_WATER_COUNT = 18;
  const SPILL_TILT_THRESHOLD = 18;
  const RENDER_HEADROOM = 200;
  const CUBE_BASE_SIZE = 58;

  // React state sync on element select change
  const handleSelectElement = (element: ElementItem) => {
    setSelectedElement(element);
    setPickerOpen(false);
    resetReactionState();
  };

  const getCupCenterWorld = (offsetX = stateRef.current.x, offsetY = stateRef.current.y) => {
    const scene = sceneRef.current;
    if (!scene) return { x: 400, y: 270 };
    return {
      x: (scene.offsetWidth || scene.clientWidth) / 2 + offsetX,
      y: (scene.offsetHeight || scene.clientHeight) / 2 + offsetY,
    };
  };

  const localToWorld = (lx: number, ly: number, offsetX = stateRef.current.x, offsetY = stateRef.current.y, rot = stateRef.current.rot) => {
    const center = getCupCenterWorld(offsetX, offsetY);
    const rad = (rot * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: center.x + lx * cos - ly * sin,
      y: center.y + lx * sin + ly * cos,
    };
  };

  const worldToLocal = (wx: number, wy: number, offsetX = stateRef.current.x, offsetY = stateRef.current.y, rot = stateRef.current.rot) => {
    const center = getCupCenterWorld(offsetX, offsetY);
    const rad = (rot * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = wx - center.x;
    const dy = wy - center.y;
    return {
      x: dx * cos + dy * sin,
      y: -dx * sin + dy * cos,
    };
  };

  const fluidToWorld = (lx: number, ly: number, metrics: any, offsetX = stateRef.current.x, offsetY = stateRef.current.y, rot = stateRef.current.rot) => {
    return localToWorld(
      metrics.localOriginX + lx,
      metrics.localOriginY + ly,
      offsetX,
      offsetY,
      rot
    );
  };

  const worldToFluid = (wx: number, wy: number, metrics: any, offsetX = stateRef.current.x, offsetY = stateRef.current.y, rot = stateRef.current.rot) => {
    const local = worldToLocal(wx, wy, offsetX, offsetY, rot);
    return {
      x: local.x - metrics.localOriginX,
      y: local.y - metrics.localOriginY,
    };
  };

  const getCupMetrics = () => {
    const beakerWrap = beakerWrapRef.current;
    const beakerBody = beakerBodyRef.current;
    const wrapW = beakerWrap ? beakerWrap.offsetWidth : 210;
    const wrapH = beakerWrap ? beakerWrap.offsetHeight : 295;
    const bodyW = beakerBody ? beakerBody.offsetWidth : 165;
    const bodyH = beakerBody ? beakerBody.offsetHeight : 257.5;
    const bodyLeft = beakerBody ? beakerBody.offsetLeft : 22.5;
    const bodyTop = beakerBody ? beakerBody.offsetTop : 25;

    let wallLeft = 3;
    let wallRight = 3;
    let wallBottom = 3;

    if (beakerBody && typeof window !== "undefined") {
      const bodyStyle = window.getComputedStyle(beakerBody);
      wallLeft = parseFloat(bodyStyle.borderLeftWidth) || 3;
      wallRight = parseFloat(bodyStyle.borderRightWidth) || 3;
      wallBottom = parseFloat(bodyStyle.borderBottomWidth) || 3;
    }

    const width = bodyW - wallLeft - wallRight;
    const height = bodyH - wallBottom;
    const localOriginX = -wrapW / 2 + bodyLeft + wallLeft;
    const localOriginY = -wrapH / 2 + bodyTop;
    const cornerRadius = 27;
    const radius = Math.max(7.8, Math.min(width, height) * 0.052);

    return {
      width,
      height,
      localOriginX,
      localOriginY,
      cornerRadius,
      radius,
      headroom: RENDER_HEADROOM,
    };
  };

  const rotateLocalVector = (nx: number, ny: number, rot = stateRef.current.rot) => {
    const rad = (rot * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: nx * cos - ny * sin,
      y: nx * sin + ny * cos,
    };
  };

  const reflectVelocity = (particle: Particle, nx: number, ny: number, bounce = 0.22) => {
    const dot = particle.vx * nx + particle.vy * ny;
    if (dot < 0) {
      particle.vx -= (1 + bounce) * dot * nx;
      particle.vy -= (1 + bounce) * dot * ny;
    }
  };

  const ensureParticleParent = (particle: Particle, parent: HTMLElement) => {
    if (particle.el.parentElement !== parent) {
      parent.appendChild(particle.el);
    }
  };

  const renderParticle = (particle: Particle, metrics: any) => {
    const fluidLayer = fluidLayerRef.current;
    const spillLayer = spillLayerRef.current;
    if (!fluidLayer || !spillLayer) return;

    if (particle.mode === "inside") {
      ensureParticleParent(particle, fluidLayer);
      const local = worldToFluid(particle.x, particle.y, metrics);
      particle.el.style.transform = `translate3d(${(local.x - particle.r).toFixed(2)}px, ${(local.y + metrics.headroom - particle.r).toFixed(2)}px, 0)`;
    } else {
      ensureParticleParent(particle, spillLayer);
      particle.el.style.transform = `translate3d(${(particle.x - particle.r).toFixed(2)}px, ${(particle.y - particle.r).toFixed(2)}px, 0)`;
    }

    if (particle.mode !== "vapor") {
      const t = particle.tint || 0;
      if (t > 0.01) {
        // Blend from original blue (#4da6ff) toward milky colour (reaction dissolve tint)
        const r = Math.round(77  + (235 -  77) * t);
        const g = Math.round(166 + (235 - 166) * t);
        const b = Math.round(255 + (230 - 255) * t);
        const a = 1 - t * 0.2;
        particle.el.style.background = `rgba(${r},${g},${b},${a})`;
      } else {
        particle.el.style.background = "#4da6ff";
      }
    }
  };

  const spawnParticle = (localX: number, localY: number, metrics: any, velocity: Partial<Particle> = {}) => {
    const fluidLayer = fluidLayerRef.current;
    if (!fluidLayer) return;

    const world = fluidToWorld(localX, localY, metrics);
    const el = document.createElement("span");
    el.className = "virtual-lab-particle";
    el.style.width = `${(metrics.radius * 2).toFixed(2)}px`;
    el.style.height = `${(metrics.radius * 2).toFixed(2)}px`;
    fluidLayer.appendChild(el);

    const particle: Particle = {
      el,
      x: world.x,
      y: world.y,
      vx: velocity.vx ?? 0,
      vy: velocity.vy ?? 0,
      r: metrics.radius,
      mode: "inside",
      tint: 0,
    };
    stateRef.current.particles.push(particle);
    renderParticle(particle, metrics);
  };

  const seedParticles = () => {
    const fluidLayer = fluidLayerRef.current;
    const spillLayer = spillLayerRef.current;
    if (!fluidLayer || !spillLayer) return;

    fluidLayer.innerHTML = "";
    spillLayer.innerHTML = "";
    stateRef.current.particles = [];

    const metrics = getCupMetrics();
    const cols = 5;
    const usableWidth = metrics.width - metrics.radius * 2 - 10;
    const xGap = usableWidth / Math.max(1, cols - 1);
    const yGap = metrics.radius * 1.85;
    const startX = metrics.radius + 5;
    const startY = metrics.height - metrics.radius - 8;

    for (let i = 0; i < PARTICLE_SEED_COUNT; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const rowOffset = row % 2 ? xGap * 0.35 : 0;
      const lx = startX + xGap * col + rowOffset;
      const ly = startY - row * yGap;
      spawnParticle(lx, ly, metrics);
    }
  };

  const addWaterBurst = () => {
    const metrics = getCupMetrics();
    const count = ADD_WATER_COUNT;
    for (let i = 0; i < count; i += 1) {
      const spread = (i - (count - 1) / 2) * (metrics.radius * 1.45);
      const lx = Math.max(
        metrics.radius + 4,
        Math.min(
          metrics.width - metrics.radius - 4,
          metrics.width * 0.5 + spread + (Math.random() - 0.5) * metrics.radius
        )
      );
      const ly = Math.max(
        metrics.radius + 4,
        Math.min(
          metrics.height - metrics.radius - 6,
          metrics.radius + 12 + Math.random() * metrics.radius * 1.5
        )
      );
      spawnParticle(lx, ly, metrics, {
        vx: (Math.random() - 0.5) * 0.22,
        vy: Math.random() * 0.16,
      });
    }
  };

  const resolveInsideCollision = (particle: Particle, metrics: any) => {
    const fluidLayer = fluidLayerRef.current;
    const spillLayer = spillLayerRef.current;
    if (!fluidLayer || !spillLayer) return;

    let local = worldToFluid(particle.x, particle.y, metrics);
    let corrected = false;
    let localNormal = null;
    const normalizedTilt = ((((stateRef.current.rot % 360) + 540) % 360) - 180);
    const allowTiltSpill = Math.abs(normalizedTilt) >= SPILL_TILT_THRESHOLD;
    const pourRight = normalizedTilt >= 0;

    if (local.y < -particle.r * 0.5) {
      particle.mode = "spill";
      ensureParticleParent(particle, spillLayer);
      return;
    }

    const mouthBandY = particle.r * 1.2;
    const inPourZone =
      local.y <= mouthBandY &&
      (pourRight ? local.x >= metrics.width * 0.45 : local.x <= metrics.width * 0.55);

    if (allowTiltSpill && inPourZone) {
      particle.mode = "spill";
      ensureParticleParent(particle, spillLayer);
      particle.vx += pourRight ? 0.4 : -0.4;
      return;
    }

    const sideMin = particle.r;
    const sideMax = metrics.width - particle.r;
    const cornerStartY = Math.max(0, metrics.height - metrics.cornerRadius);
    const bottomFlatY = metrics.height - particle.r;
    const leftWallOpen = allowTiltSpill && !pourRight && local.y <= particle.r * 1.5;
    const rightWallOpen = allowTiltSpill && pourRight && local.y <= particle.r * 1.5;

    if (local.x < sideMin && !leftWallOpen) {
      local.x = sideMin;
      corrected = true;
      localNormal = { x: 1, y: 0 };
    } else if (local.x > sideMax && !rightWallOpen) {
      local.x = sideMax;
      corrected = true;
      localNormal = { x: -1, y: 0 };
    }

    if (
      local.y > bottomFlatY &&
      local.x >= metrics.cornerRadius &&
      local.x <= metrics.width - metrics.cornerRadius
    ) {
      local.y = bottomFlatY;
      corrected = true;
      localNormal = { x: 0, y: -1 };
    }

    if (local.x < metrics.cornerRadius && local.y > cornerStartY) {
      const cx = metrics.cornerRadius;
      const cy = cornerStartY;
      const dx = local.x - cx;
      const dy = local.y - cy;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const limit = Math.max(0.1, metrics.cornerRadius - particle.r);
      if (dist > limit) {
        const ux = dx / dist;
        const uy = dy / dist;
        local.x = cx + ux * limit;
        local.y = cy + uy * limit;
        corrected = true;
        localNormal = { x: -ux, y: -uy };
      }
    } else if (
      local.x > metrics.width - metrics.cornerRadius &&
      local.y > cornerStartY
    ) {
      const cx = metrics.width - metrics.cornerRadius;
      const cy = cornerStartY;
      const dx = local.x - cx;
      const dy = local.y - cy;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const limit = Math.max(0.1, metrics.cornerRadius - particle.r);
      if (dist > limit) {
        const ux = dx / dist;
        const uy = dy / dist;
        local.x = cx + ux * limit;
        local.y = cy + uy * limit;
        corrected = true;
        localNormal = { x: -ux, y: -uy };
      }
    }

    if (corrected) {
      const world = fluidToWorld(local.x, local.y, metrics);
      particle.x = world.x;
      particle.y = world.y;
      if (localNormal) {
        const worldNormal = rotateLocalVector(localNormal.x, localNormal.y);
        reflectVelocity(particle, worldNormal.x, worldNormal.y, 0.03);
      }
    }
  };

  const solveParticleCollisions = () => {
    const particles = stateRef.current.particles;
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        if (a.mode !== b.mode) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const minDist = a.r + b.r;

        if (dist < minDist) {
          const overlap = (minDist - dist) * 0.35;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;

          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const rel = rvx * nx + rvy * ny;
          if (rel < 0) {
            const impulse = rel * 0.5;
            a.vx += impulse * nx;
            a.vy += impulse * ny;
            b.vx -= impulse * nx;
            b.vy -= impulse * ny;
          }
        } else if (dist < minDist * 2.4) {
          const pull = (dist - minDist) * 0.003;
          const nx = dx / dist;
          const ny = dy / dist;
          a.vx += nx * pull;
          a.vy += ny * pull;
          b.vx -= nx * pull;
          b.vy -= ny * pull;

          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const align = 0.012;
          a.vx += rvx * align;
          a.vy += rvy * align;
          b.vx -= rvx * align;
          b.vy -= rvy * align;

          const tA = a.tint || 0;
          const tB = b.tint || 0;
          if (Math.abs(tA - tB) > 0.005) {
            const diff = tB - tA;
            a.tint = tA + diff * 0.04;
            b.tint = tB - diff * 0.04;
          }
        }
      }
    }
  };

  const resolveSceneCollision = (particle: Particle, sw: number, sh: number) => {
    const minX = particle.r + 2;
    const maxX = sw - particle.r - 2;
    const minY = particle.r + 2;
    const maxY = sh - particle.r - 2;

    if (particle.x < minX) {
      particle.x = minX;
      reflectVelocity(particle, 1, 0, 0.2);
    } else if (particle.x > maxX) {
      particle.x = maxX;
      reflectVelocity(particle, -1, 0, 0.2);
    }

    if (particle.y < minY) {
      particle.y = minY;
      reflectVelocity(particle, 0, 1, 0.2);
    } else if (particle.y > maxY) {
      particle.y = maxY;
      reflectVelocity(particle, 0, -1, 0.18);
      particle.vx *= 0.985;
    }
  };

  const resolveBeakerExteriorCollision = (particle: Particle, metrics: any) => {
    const fluidLayer = fluidLayerRef.current;
    if (!fluidLayer) return;

    const local = worldToFluid(particle.x, particle.y, metrics);
    if (local.x < -particle.r * 2 || local.x > metrics.width + particle.r * 2) return;
    if (local.y < -particle.r * 2 || local.y > metrics.height + particle.r * 2) return;

    if (local.y > -20 && local.y < 20 && local.x >= particle.r && local.x <= metrics.width - particle.r) {
      particle.mode = "inside";
      ensureParticleParent(particle, fluidLayer);
      return;
    }

    if (local.y >= 0 && local.y <= metrics.height) {
      if (local.x >= -particle.r && local.x <= metrics.width / 2) {
        const world = fluidToWorld(-particle.r, local.y, metrics);
        particle.x = world.x;
        particle.y = world.y;
        const wn = rotateLocalVector(-1, 0);
        reflectVelocity(particle, wn.x, wn.y, 0.1);
      } else if (local.x > metrics.width / 2 && local.x <= metrics.width + particle.r) {
        const world = fluidToWorld(metrics.width + particle.r, local.y, metrics);
        particle.x = world.x;
        particle.y = world.y;
        const wn = rotateLocalVector(1, 0);
        reflectVelocity(particle, wn.x, wn.y, 0.1);
      }
    }

    if (local.x >= 0 && local.x <= metrics.width) {
      if (local.y > metrics.height - particle.r && local.y <= metrics.height + particle.r) {
        const world = fluidToWorld(local.x, metrics.height + particle.r, metrics);
        particle.x = world.x;
        particle.y = world.y;
        const wn = rotateLocalVector(0, 1);
        reflectVelocity(particle, wn.x, wn.y, 0.1);
      }
    }
  };

  const resolveCubeParticleCollision = (p: Particle) => {
    const matterCubeBody = matterCubeBodyRef.current;
    if (!matterCubeBody) return;
    const cbx = matterCubeBody.position.x;
    const cby = matterCubeBody.position.y;
    const cbvx = matterCubeBody.velocity.x;
    const cbvy = matterCubeBody.velocity.y;

    const cube = cubeRefState.current;
    const halfW = (cube.w || CUBE_BASE_SIZE) / 2;
    const halfH = (cube.h || CUBE_BASE_SIZE) / 2;
    const closestX = Math.max(cbx - halfW, Math.min(cbx + halfW, p.x));
    const closestY = Math.max(cby - halfH, Math.min(cby + halfH, p.y));
    const dx = p.x - closestX;
    const dy = p.y - closestY;
    const dist = Math.hypot(dx, dy) || 0.0001;

    if (dist < p.r + 2) {
      const overlap = p.r + 2 - dist;
      const nx = dx / dist;
      const ny = dy / dist;
      p.x += nx * overlap * 1.2;
      p.y += ny * overlap * 1.2;
      const relVx = p.vx - cbvx;
      const relVy = p.vy - cbvy;
      const relNorm = relVx * nx + relVy * ny;
      if (relNorm < 0) {
        const impulse = relNorm * 0.6;
        p.vx -= impulse * nx;
        p.vy -= impulse * ny;

        if (Matter && !matterCubeBody.isStatic) {
          const mFactor = 0.002;
          Matter.Body.applyForce(matterCubeBody, { x: closestX, y: closestY }, {
            x: nx * impulse * mFactor,
            y: ny * impulse * mFactor,
          });
        }
      }
    }
  };

  const isCubeSubmerged = (metrics: any) => {
    const cube = cubeRefState.current;
    const rxn = rxnRef.current;
    if (!cube.insideBeaker || stateRef.current.particles.length === 0 || rxn.progress >= 1) return false;

    const cubeLocal = worldToFluid(cube.x, cube.y, metrics);
    let waterTopY = metrics.height;
    for (const p of stateRef.current.particles) {
      if (p.mode !== "inside") continue;
      const pLocal = worldToFluid(p.x, p.y, metrics);
      if (pLocal.y < waterTopY) waterTopY = pLocal.y;
    }
    return cubeLocal.y > waterTopY - 10;
  };

  const spawnBubble = (metrics: any) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const size = 3 + Math.random() * 5;
    const el = document.createElement("span");
    el.className = "virtual-lab-bubble";
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = "0";
    el.style.top = "0";

    const cube = cubeRefState.current;
    const rxn = rxnRef.current;
    const cubeLocal = worldToFluid(cube.x, cube.y, metrics);
    const bx = cubeLocal.x + (Math.random() - 0.5) * cube.w * rxn.cubeScale;
    const by = cubeLocal.y - (cube.h / 2) * rxn.cubeScale + Math.random() * 6;
    const worldPos = fluidToWorld(bx, by, metrics);

    el.style.transform = `translate3d(${worldPos.x.toFixed(1)}px, ${worldPos.y.toFixed(1)}px, 0)`;
    el.style.opacity = "0.7";
    scene.appendChild(el);

    const bubble: Bubble = {
      el,
      worldX: worldPos.x,
      worldY: worldPos.y,
      vy: -(0.6 + Math.random() * 1.2),
      vx: (Math.random() - 0.5) * 0.4,
      life: 0,
      maxLife: 40 + Math.random() * 60,
      size,
    };
    rxnRef.current.bubbles.push(bubble);
  };

  const tickBubbles = () => {
    const rxn = rxnRef.current;
    for (let i = rxn.bubbles.length - 1; i >= 0; i--) {
      const b = rxn.bubbles[i];
      b.life++;
      b.worldY += b.vy;
      b.worldX += b.vx + Math.sin(b.life * 0.15) * 0.3;
      const fade = 1 - b.life / b.maxLife;
      b.el.style.transform = `translate3d(${b.worldX.toFixed(1)}px, ${b.worldY.toFixed(1)}px, 0)`;
      b.el.style.opacity = (fade * 0.7).toFixed(2);
      if (b.life >= b.maxLife || b.worldY < 0) {
        b.el.remove();
        rxn.bubbles.splice(i, 1);
      }
    }
  };

  const tickReaction = (metrics: any) => {
    const rxn = rxnRef.current;
    const cube = cubeRefState.current;
    const matterCubeBody = matterCubeBodyRef.current;
    const matterEngine = matterEngineRef.current;

    // --- Heat Physics ---
    // Beaker must be near the burner: not dragged far sideways, not lifted high above the stand.
    // The beaker rests at y=0 (scene centre) with the burner directly below, so allow y > -120.
    const isBeakerOnBurner = Math.abs(stateRef.current.x) < 80 && stateRef.current.y > -120;
    const currentHeater = heaterRef.current;

    // Heater equilibrium caps: 0% = 20°C, 100% = 100°C
    const heaterCap = 20 + (80 * currentHeater) / 100;

    if (typeof window !== "undefined" && (window as any)._lastLogTick === undefined) {
      (window as any)._lastLogTick = 0;
    }
    if (typeof window !== "undefined" && Date.now() - ((window as any)._lastLogTick || 0) > 1000) {
      (window as any)._lastLogTick = Date.now();
      console.log("[VLab-Physics] state.x:", stateRef.current.x, "state.y:", stateRef.current.y, "isBeakerOnBurner:", isBeakerOnBurner, "currentHeater:", currentHeater, "heaterCap:", heaterCap, "rxn.temp:", rxn.temperature);
    }

    if (currentHeater > 0 && isBeakerOnBurner) {
      // Heat rates (°C per frame @ ~60 fps): max 0.28 at 100%
      const heatRate = (0.28 * currentHeater) / 100;

      if (rxn.temperature < heaterCap) {
        rxn.temperature = Math.min(heaterCap, rxn.temperature + heatRate);
      } else if (rxn.temperature > heaterCap) {
        // Cool toward the heater cap if temp is above it (e.g. heater turned down while reacting)
        rxn.temperature = Math.max(heaterCap, rxn.temperature - 0.10);
      }
    } else {
      // No burner active – passively cool toward room temperature
      rxn.temperature = Math.max(20, rxn.temperature - 0.10);
    }

    // Boiling evaporation (steam) - runs whenever water is near 100°C
    if (rxn.temperature >= 99.2) {
      const steamProb = 0.04 + (0.31 * currentHeater) / 100;
      if (Math.random() < steamProb) {
        const insideParticles = stateRef.current.particles.filter(p => p.mode === "inside");
        if (insideParticles.length > 0) {
          const pToBoil = insideParticles[Math.floor(Math.random() * insideParticles.length)];
          pToBoil.mode = "vapor";
          pToBoil.el.style.background = "rgba(255,255,255,0.35)";
          pToBoil.vy = -2 - Math.random() * 2.5;
          pToBoil.vx = (Math.random() - 0.5) * 1.5;
          ensureParticleParent(pToBoil, sceneRef.current!);

          stateRef.current.particles.splice(stateRef.current.particles.indexOf(pToBoil), 1);
          setTimeout(() => {
            if (pToBoil.el) pToBoil.el.remove();
          }, 700);
        }
      }
    }

    const data = REACTION_DATA[selectedElement.sym];
    if (!data || data.rate === 0) {
      if (rxn.active) {
        rxn.active = false;
        setReactionActive(false);
      }
      updateThermometer();
      tickBubbles();
      return;
    }

    const submerged = isCubeSubmerged(metrics);

    if (submerged && rxn.progress < 1) {
      if (!rxn.active) {
        rxn.active = true;
        rxn.lastElement = selectedElement.sym;
        setReactionInfo(data.eq);
        setReactionActive(true);
      }

      // Scale reaction rate with temperature: +2% rate per °C above room temp (20°C)
      const tempFactor = 1 + (rxn.temperature - 20) * 0.020;
      const rateWithTemp = data.rate * tempFactor;

      rxn.progress = Math.min(1, rxn.progress + rateWithTemp);

      // Exothermic reaction contributes heat up to its natural maximum.
      // The overall cap is: max(heaterCap, naturalReactionTemp)
      // so a LOW heater (50°C) + mild element (Na, heat=45 → 65°C) caps at 65°C,
      // while a MAX heater + highly reactive element can still reach 100°C.
      const naturalReactionTemp = 20 + data.heat * Math.min(rxn.progress * 3, 1);
      const effectiveTempCap = Math.min(100, Math.max(heaterCap, naturalReactionTemp));
      if (rxn.temperature < naturalReactionTemp) {
        rxn.temperature = Math.min(effectiveTempCap, rxn.temperature + Math.max(0, (naturalReactionTemp - rxn.temperature) * 0.035));
      }

      rxn.cubeScale = Math.max(0, 1 - rxn.progress);
      const targetPhysScale = Math.max(0.1, 1 - rxn.progress);
      if (matterCubeBody && Math.abs(cube.physicsScale - targetPhysScale) > 0.005) {
        const factor = targetPhysScale / cube.physicsScale;
        Matter.Body.scale(matterCubeBody, factor, factor);
        cube.physicsScale = targetPhysScale;
      }

      // Scale bubble generation with temperature factor too
      if (Math.random() < data.bubbleRate * tempFactor * (1 - rxn.progress * 0.7)) {
        spawnBubble(metrics);
      }

      applyCubeScale();

      if (data.waterColor) {
        const intensity = rateWithTemp * 2.5;
        stateRef.current.particles.forEach(p => {
          if (p.mode === "inside") {
            const dist = Math.hypot(p.x - cube.x, p.y - cube.y);
            if (dist < 65) {
              p.tint = Math.min(1.0, (p.tint || 0) + intensity);
            }
          }
        });
      }

      if (rxn.progress >= 1) {
        rxn.cubeScale = 0;
        cube.dragging = false;
        cube.w = 0;
        cube.h = 0;
        const el = cubeRef.current;
        if (el) el.style.display = "none";
        if (matterCubeBody && matterEngine) {
          Matter.Composite.remove(matterEngine.world, matterCubeBody);
          matterCubeBodyRef.current = null;
        }
      }
    } else if (rxn.progress >= 1) {
      if (rxn.temperature <= 20.5 && rxn.active) {
        rxn.active = false;
        setReactionActive(false);
      }
    }

    updateThermometer();
    tickBubbles();
  };

  const applyCubeScale = () => {
    const el = cubeRef.current;
    if (!el) return;
    const s = rxnRef.current.cubeScale;
    el.style.width = `${(CUBE_BASE_SIZE * s).toFixed(1)}px`;
    el.style.height = `${(CUBE_BASE_SIZE * s).toFixed(1)}px`;

    const textSpan = el.querySelector("span");
    if (textSpan) {
      textSpan.style.opacity = s < 0.45 ? "0" : "1";
    }

    const cube = cubeRefState.current;
    cube.w = CUBE_BASE_SIZE * s;
    cube.h = CUBE_BASE_SIZE * s;

    const matterCubeBody = matterCubeBodyRef.current;
    if (matterCubeBody) {
      const currentPhysicsScale = cube.physicsScale;
      let safeS = Math.max(0.01, s);
      const ratio = safeS / currentPhysicsScale;

      if (Math.abs(ratio - 1) > 0.001) {
        const oldH = CUBE_BASE_SIZE * currentPhysicsScale;
        const newH = CUBE_BASE_SIZE * safeS;
        Matter.Body.scale(matterCubeBody, ratio, ratio);

        const shiftY = (oldH - newH) / 2;
        Matter.Body.setPosition(matterCubeBody, {
          x: matterCubeBody.position.x,
          y: matterCubeBody.position.y + shiftY,
        });

        cube.physicsScale = safeS;
      }
    }
  };

  const updateThermometer = () => {
    const thermoFill = thermoFillRef.current;
    const thermoTemp = thermoTempRef.current;
    const rxn = rxnRef.current;
    if (!thermoFill || !thermoTemp) return;

    const pct = Math.min(100, Math.max(5, ((rxn.temperature - 0) / 120) * 100));
    thermoFill.style.height = `${pct.toFixed(1)}%`;
    thermoTemp.textContent = `${Math.round(rxn.temperature)}°`;

    if (rxn.temperature < 30) {
      thermoFill.style.background = "linear-gradient(180deg, #5cb3ff 0%, #2b7de9 100%)";
    } else if (rxn.temperature < 60) {
      thermoFill.style.background = "linear-gradient(180deg, #ffb347 0%, #ff8c1a 100%)";
    } else {
      thermoFill.style.background = "linear-gradient(180deg, #ff6b4a 0%, #e84040 100%)";
    }
  };

  const rebuildBeakerBodies = () => {
    const matterEngine = matterEngineRef.current;
    if (!matterEngine) return;
    const metrics = getCupMetrics();
    if (!metrics || !metrics.width) return;

    if (matterBeakerBodiesRef.current.length > 0) {
      Matter.Composite.remove(matterEngine.world, matterBeakerBodiesRef.current);
      matterBeakerBodiesRef.current = [];
    }

    const wallT = 14;
    const cornerR = metrics.cornerRadius || 27;
    const w = metrics.width;
    const h = metrics.height;
    const rotRad = (stateRef.current.rot * Math.PI) / 180;

    const fw = (lx: number, ly: number) => fluidToWorld(lx, ly, metrics);

    const leftH = h - cornerR;
    const leftCenter = fw(-wallT / 2, leftH / 2);
    const leftWall = Matter.Bodies.rectangle(leftCenter.x, leftCenter.y, wallT, leftH, {
      isStatic: true,
      angle: rotRad,
      restitution: 0.2,
      friction: 0.3,
    });

    const rightCenter = fw(w + wallT / 2, leftH / 2);
    const rightWall = Matter.Bodies.rectangle(rightCenter.x, rightCenter.y, wallT, leftH, {
      isStatic: true,
      angle: rotRad,
      restitution: 0.2,
      friction: 0.3,
    });

    const bottomFlatW = w - cornerR * 2;
    const bottomCenter = fw(w / 2, h + wallT / 2);
    const bottomWall = Matter.Bodies.rectangle(bottomCenter.x, bottomCenter.y, bottomFlatW, wallT, {
      isStatic: true,
      angle: rotRad,
      restitution: 0.2,
      friction: 0.5,
    });

    const cornerBodies: Matter.Body[] = [];
    const segments = 8;

    for (let i = 0; i < segments; i++) {
      const a1 = Math.PI / 2 + (Math.PI / 2) * (i / segments);
      const a2 = Math.PI / 2 + (Math.PI / 2) * ((i + 1) / segments);
      const aMid = (a1 + a2) / 2;
      const ccx = cornerR;
      const ccy = h - cornerR;
      const segX = ccx + Math.cos(aMid) * (cornerR + wallT / 4);
      const segY = ccy + Math.sin(aMid) * (cornerR + wallT / 4);
      const segWorld = fw(segX, segY);
      const len = 2 * cornerR * Math.sin((a2 - a1) / 2) + 4;
      cornerBodies.push(
        Matter.Bodies.rectangle(segWorld.x, segWorld.y, len, wallT, {
          isStatic: true,
          angle: aMid + Math.PI / 2 + rotRad,
          restitution: 0.2,
          friction: 0.3,
        })
      );
    }

    for (let i = 0; i < segments; i++) {
      const a1 = (Math.PI / 2) * (i / segments);
      const a2 = (Math.PI / 2) * ((i + 1) / segments);
      const aMid = (a1 + a2) / 2;
      const ccx = w - cornerR;
      const ccy = h - cornerR;
      const segX = ccx + Math.cos(aMid) * (cornerR + wallT / 4);
      const segY = ccy + Math.sin(aMid) * (cornerR + wallT / 4);
      const segWorld = fw(segX, segY);
      const len = 2 * cornerR * Math.sin((a2 - a1) / 2) + 4;
      cornerBodies.push(
        Matter.Bodies.rectangle(segWorld.x, segWorld.y, len, wallT, {
          isStatic: true,
          angle: aMid + Math.PI / 2 + rotRad,
          restitution: 0.2,
          friction: 0.3,
        })
      );
    }

    matterBeakerBodiesRef.current = [leftWall, rightWall, bottomWall, ...cornerBodies];
    Matter.Composite.add(matterEngine.world, matterBeakerBodiesRef.current);
  };

  const updateView = () => {
    const beakerWrap = beakerWrapRef.current;
    if (!beakerWrap) return;
    beakerWrap.style.setProperty("--vlab-x", `${stateRef.current.x.toFixed(2)}px`);
    beakerWrap.style.setProperty("--vlab-y", `${stateRef.current.y.toFixed(2)}px`);
    beakerWrap.style.setProperty("--vlab-rot", `${stateRef.current.rot.toFixed(2)}deg`);
  };

  const resetReactionState = () => {
    // Reset reaction values
    const rxn = rxnRef.current;
    rxn.active = false;
    rxn.progress = 0;
    rxn.temperature = 20;
    rxn.waterTint = 0;
    rxn.cubeScale = 1;

    setReactionActive(false);

    // Remove old bubbles
    rxn.bubbles.forEach(b => b.el.remove());
    rxn.bubbles = [];

    // Recreate Stand Matter.js body
    const scene = sceneRef.current;
    const standEl = standRef.current;
    const matterEngine = matterEngineRef.current;

    const sw = scene ? scene.offsetWidth : 800;
    const sh = scene ? scene.offsetHeight : 540;
    const standW = 82.5;
    const standTotalH = 37.5;

    if (standEl) {
      standEl.style.transform = `translate3d(${(sw * 0.82 - standW / 2).toFixed(1)}px, ${(sh - standTotalH).toFixed(1)}px, 0)`;
      standEl.style.opacity = "1";
    }

    if (matterEngine) {
      if (matterStandBodyRef.current) {
        Matter.Composite.remove(matterEngine.world, matterStandBodyRef.current);
      }
      matterStandBodyRef.current = Matter.Bodies.rectangle(
        sw * 0.82,
        sh - standTotalH / 2,
        standW,
        standTotalH,
        {
          isStatic: true,
          restitution: 0.2,
          friction: 0.5,
          chamfer: { radius: 2 }
        }
      );
      Matter.Composite.add(matterEngine.world, matterStandBodyRef.current);
    }

    // Reset cube variables
    const cube = cubeRefState.current;
    cube.w = CUBE_BASE_SIZE;
    cube.h = CUBE_BASE_SIZE;
    cube.dragging = false;
    cube.insideBeaker = false;
    cube.pointerId = null;
    cube.x = sw * 0.82;
    cube.y = sh - standTotalH - cube.h / 2;
    cube.vx = 0;
    cube.vy = 0;
    cube.angle = 0;
    cube.physicsScale = 1;

    // Reset cube visual element
    const cubeEl = cubeRef.current;
    if (cubeEl) {
      cubeEl.style.display = "flex";
      cubeEl.style.width = `${CUBE_BASE_SIZE}px`;
      cubeEl.style.height = `${CUBE_BASE_SIZE}px`;
      cubeEl.style.transform = `translate3d(${(cube.x - cube.w / 2).toFixed(1)}px, ${(cube.y - cube.h / 2).toFixed(1)}px, 0)`;
      const textSpan = cubeEl.querySelector("span");
      if (textSpan) textSpan.style.opacity = "1";
    }

    // Recreate cube Matter.js body
    if (matterEngine) {
      if (matterCubeBodyRef.current) {
        Matter.Composite.remove(matterEngine.world, matterCubeBodyRef.current);
      }
      matterCubeBodyRef.current = Matter.Bodies.rectangle(
        cube.x,
        cube.y,
        cube.w,
        cube.h,
        {
          restitution: 0.35,
          friction: 0.4,
          frictionAir: 0.02,
          density: 0.008,
          chamfer: { radius: 8 },
          label: "metalCube",
        }
      );
      Matter.Composite.add(matterEngine.world, matterCubeBodyRef.current);
    }

    // Reset water particle tints
    stateRef.current.particles.forEach(p => {
      p.tint = 0;
      p.mode = "inside";
      p.vx = 0;
      p.vy = 0;
    });

    // Re-seed original water count if we boiled some off
    if (stateRef.current.particles.length < PARTICLE_SEED_COUNT) {
      seedParticles();
    }
  };

  const fullReset = () => {
    // Reset Beaker Coordinates
    stateRef.current.x = 0;
    stateRef.current.y = 0;
    stateRef.current.rot = 0;
    updateView();

    // Reset Particles
    const fluidLayer = fluidLayerRef.current;
    const spillLayer = spillLayerRef.current;
    if (fluidLayer) fluidLayer.innerHTML = "";
    if (spillLayer) spillLayer.innerHTML = "";
    stateRef.current.particles = [];
    seedParticles();

    // Reset cube and reaction states
    resetReactionState();

    // Reset heater
    setHeaterLevel(0);
    heaterRef.current = 0;
  };

  // Main game animation loop
  const animate = () => {
    const scene = sceneRef.current;
    const matterEngine = matterEngineRef.current;
    if (!scene) return;

    const sceneW = scene.offsetWidth || 800;
    const sceneH = scene.offsetHeight || 540;

    const state = stateRef.current;
    const dxCup = state.x - state.prevX;
    const dyCup = state.y - state.prevY;
    const dRot = state.rot - state.prevRot;
    const gravity = 0.32;
    const maxSpeed = 10;
    const cupCenter = getCupCenterWorld();
    const metrics = getCupMetrics();

    // Loop over water particles to integrate motion and beaker velocity influences
    for (const p of state.particles) {
      if (p.mode === "inside") {
        const localPrev = worldToFluid(
          p.x,
          p.y,
          metrics,
          state.prevX,
          state.prevY,
          state.prevRot
        );
        const wasInsideCup =
          localPrev.x > -p.r * 2 &&
          localPrev.x < metrics.width + p.r * 2 &&
          localPrev.y > -60 &&
          localPrev.y < metrics.height + 30;

        if (wasInsideCup) {
          const carried = fluidToWorld(
            localPrev.x,
            localPrev.y,
            metrics,
            state.x,
            state.y,
            state.rot
          );
          const carryX = carried.x - p.x;
          const carryY = carried.y - p.y;

          p.x += carryX * 0.9;
          p.y += carryY * 0.9;

          const inertiaX = Math.max(-5, Math.min(5, carryX * 0.12 - dxCup * 0.18));
          const inertiaY = Math.max(-5, Math.min(5, carryY * 0.12 - dyCup * 0.18));
          p.vx += inertiaX;
          p.vy += inertiaY;

          const swirl = Math.max(-0.3, Math.min(0.3, dRot * 0.008));
          const relX = p.x - cupCenter.x;
          const relY = p.y - cupCenter.y;
          p.vx += -relY * swirl;
          p.vy += relX * swirl;
        }
      }

      p.vy += gravity;

      // Reaction fizzing noise
      const rxn = rxnRef.current;
      const reactionIntensity = rxn.active && rxn.progress < 1 ? Math.pow(REACTION_DATA[selectedElement.sym].rate * 800, 1.2) : 0;
      if (reactionIntensity > 0.02) {
        const noise = reactionIntensity * 1.4;
        p.vx += (Math.random() - 0.5) * noise;
        p.vy += (Math.random() - 0.5) * noise;
      }

      const speedSq = p.vx * p.vx + p.vy * p.vy;
      const isResting = speedSq < 0.06 && Math.abs(dxCup) < 0.1 && Math.abs(dRot) < 0.1;

      if (isResting && reactionIntensity < 0.1) {
        p.vx *= 0.7;
        p.vy *= 0.7;
        if (speedSq < 0.001) {
          p.vx = 0;
          p.vy = 0;
        }
      } else {
        p.vx *= 0.99;
        p.vy *= 0.99;
      }

      const currentSpeed = Math.hypot(p.vx, p.vy);
      if (currentSpeed > maxSpeed) {
        const scale = maxSpeed / currentSpeed;
        p.vx *= scale;
        p.vy *= scale;
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.mode === "spill") {
        resolveSceneCollision(p, sceneW, sceneH);
      }
    }

    // MatterJS Cube physics update
    const cube = cubeRefState.current;
    const matterCubeBody = matterCubeBodyRef.current;
    if (matterEngine && matterCubeBody) {
      rebuildBeakerBodies();

      const wasInside = cube.insideBeaker;

      if (cube.dragging && cube.targetX !== undefined) {
        const dx = cube.targetX - matterCubeBody.position.x;
        const dy = cube.targetY - matterCubeBody.position.y;
        const stiffness = 0.35;
        let tvx = dx * stiffness;
        let tvy = dy * stiffness;

        const speed = Math.hypot(tvx, tvy);
        const maxV = 20;
        if (speed > maxV) {
          tvx = (tvx / speed) * maxV;
          tvy = (tvy / speed) * maxV;
        }
        Matter.Body.setVelocity(matterCubeBody, { x: tvx, y: tvy });
        Matter.Body.setAngularVelocity(matterCubeBody, matterCubeBody.angularVelocity * 0.5);
      }

      Matter.Engine.update(matterEngine, 1000 / 60);

      cube.x = matterCubeBody.position.x;
      cube.y = matterCubeBody.position.y;
      cube.vx = matterCubeBody.velocity.x;
      cube.vy = matterCubeBody.velocity.y;
      cube.angle = matterCubeBody.angle;

      const hw = (cube.w || CUBE_BASE_SIZE) / 2;
      const local = worldToFluid(cube.x, cube.y, metrics);
      const inH = local.x > hw && local.x < metrics.width - hw;

      const cr = metrics.cornerRadius || 27;
      let inCornerArc = false;
      if (local.x < cr && local.y > metrics.height - cr) {
        inCornerArc = Math.hypot(cr - local.x, local.y - (metrics.height - cr)) > cr - hw;
      } else if (local.x > metrics.width - cr && local.y > metrics.height - cr) {
        inCornerArc = Math.hypot(local.x - (metrics.width - cr), local.y - (metrics.height - cr)) > cr - hw;
      }

      const inV = local.y > -hw && local.y < metrics.height - hw && !inCornerArc;
      const isInside = inH && inV;
      const isInMouth = inH && local.y > -hw * 2 && local.y < hw * 3;

      if (!wasInside && isInside && !isInMouth) {
        let pushX = local.x < metrics.width / 2 ? -hw - 4 : metrics.width + hw + 4;
        const worldPos = fluidToWorld(pushX, local.y, metrics);
        cube.x = worldPos.x;
        cube.y = worldPos.y;
        Matter.Body.setPosition(matterCubeBody, { x: cube.x, y: cube.y });
        Matter.Body.setVelocity(matterCubeBody, { x: 0, y: cube.vy });
      } else if (wasInside && !isInside && !isInMouth) {
        let clampedX = Math.max(hw, Math.min(metrics.width - hw, local.x));
        let clampedY = Math.min(metrics.height - hw, local.y);

        if (clampedX < cr && clampedY > metrics.height - cr) {
          const dist = Math.hypot(cr - clampedX, clampedY - (metrics.height - cr));
          const maxD = cr - hw;
          if (dist > maxD && maxD >= 0) {
            clampedX = cr - maxD * ((cr - clampedX) / dist);
            clampedY = (metrics.height - cr) + maxD * ((clampedY - (metrics.height - cr)) / dist);
          }
        } else if (clampedX > metrics.width - cr && clampedY > metrics.height - cr) {
          const cxRight = metrics.width - cr;
          const dist = Math.hypot(clampedX - cxRight, clampedY - (metrics.height - cr));
          const maxD = cr - hw;
          if (dist > maxD && maxD >= 0) {
            clampedX = cxRight + maxD * ((clampedX - cxRight) / dist);
            clampedY = (metrics.height - cr) + maxD * ((clampedY - (metrics.height - cr)) / dist);
          }
        }

        const worldPos = fluidToWorld(clampedX, clampedY, metrics);
        cube.x = worldPos.x;
        cube.y = worldPos.y;
        Matter.Body.setPosition(matterCubeBody, { x: cube.x, y: cube.y });
        Matter.Body.setVelocity(matterCubeBody, { x: 0, y: 0 });
      }

      if (wasInside) {
        if (local.y < -hw - 5) cube.insideBeaker = false;
      } else {
        if (isInMouth && local.y > 0 && local.y < hw * 3) cube.insideBeaker = true;
      }
    }

    // Multi-pass collision resolution
    for (let i = 0; i < 3; i += 1) {
      solveParticleCollisions();
      for (const p of state.particles) {
        if (p.mode === "inside") {
          resolveInsideCollision(p, metrics);
        } else {
          resolveSceneCollision(p, sceneW, sceneH);
          resolveBeakerExteriorCollision(p, metrics);
        }
        if (cube.w > 0) resolveCubeParticleCollision(p);
      }
    }

    // Bounds enforce
    for (const p of state.particles) {
      const r = p.r || 5;
      if (p.x < r) { p.x = r; p.vx = Math.abs(p.vx) * 0.3; }
      if (p.x > sceneW - r) { p.x = sceneW - r; p.vx = -Math.abs(p.vx) * 0.3; }
      if (p.y < r) { p.y = r; p.vy = Math.abs(p.vy) * 0.3; }
      if (p.y > sceneH - r) { p.y = sceneH - r; p.vy = -Math.abs(p.vy) * 0.3; }
    }

    tickReaction(metrics);

    // Sync metal cube transform styles
    const renderCubeEl = cubeRef.current;
    if (renderCubeEl) {
      renderCubeEl.style.transform = `translate3d(${(cube.x - cube.w / 2).toFixed(1)}px, ${(cube.y - cube.h / 2).toFixed(1)}px, 0) rotate(${cube.angle.toFixed(3)}rad)`;
    }

    state.particles.forEach(p => renderParticle(p, metrics));

    state.prevX = state.x;
    state.prevY = state.y;
    state.prevRot = state.rot;
    updateView();

    state.animationFrame = window.requestAnimationFrame(animate);
  };

  // Beaker drag event helpers
  const beginDrag = (clientX: number, clientY: number, pointerId: number | "mouse" = "mouse", mode: "move" | "rotate" = "move") => {
    const state = stateRef.current;
    state.dragging = true;
    state.pointerId = pointerId;
    state.dragMode = mode;
    state.startPointerX = clientX;
    state.startPointerY = clientY;
    state.lastClientX = clientX;
    state.lastClientY = clientY;
    state.startX = state.x;
    state.startY = state.y;
    state.startRot = state.rot;
    state.totalMove = 0;

    const wrap = beakerWrapRef.current;
    if (wrap) wrap.classList.add("dragging");
  };

  const dragTo = (clientX: number, clientY: number) => {
    const state = stateRef.current;
    const scene = sceneRef.current;
    if (!state.dragging || !scene) return;

    const dx = clientX - state.startPointerX;
    const dy = clientY - state.startPointerY;
    const stepX = clientX - state.lastClientX;
    const stepY = clientY - state.lastClientY;

    if (state.dragMode === "rotate") {
      const sceneRect = scene.getBoundingClientRect();
      const center = getCupCenterWorld();
      const cx = sceneRect.left + center.x;
      const cy = sceneRect.top + center.y;

      const startRad = Math.atan2(state.startPointerY - cy, state.startPointerX - cx);
      const currentRad = Math.atan2(clientY - cy, clientX - cx);

      let diffRad = currentRad - startRad;
      while (diffRad > Math.PI) diffRad -= 2 * Math.PI;
      while (diffRad < -Math.PI) diffRad += 2 * Math.PI;

      const deg = (diffRad * 180) / Math.PI;
      state.rot = Math.max(-100, Math.min(100, state.startRot + deg));
    } else {
      const wrap = beakerWrapRef.current;
      const wrapW = wrap ? wrap.offsetWidth : 210;
      const wrapH = wrap ? wrap.offsetHeight : 295;
      const sceneW = scene.offsetWidth || 800;
      const sceneH = scene.offsetHeight || 540;

      const maxX = Math.max(0, (sceneW - wrapW) / 2 - 22);
      const maxY = Math.max(0, (sceneH - wrapH) / 2 - 22);

      state.x = Math.max(-maxX, Math.min(maxX, state.startX + dx));
      state.y = Math.max(-maxY, Math.min(maxY, state.startY + dy));
    }

    state.totalMove += Math.abs(stepX) + Math.abs(stepY);
    state.lastClientX = clientX;
    state.lastClientY = clientY;
  };

  const endDrag = () => {
    const state = stateRef.current;
    if (!state.dragging) return;
    state.dragging = false;
    state.pointerId = null;
    const wrap = beakerWrapRef.current;
    if (wrap) {
      wrap.classList.remove("dragging");
      wrap.style.cursor = "grab";
    }

    // Add back smooth return transitions if not rotated too far
    if (state.totalMove < 8) {
      // Gentle visual impulse
    }
  };

  const checkTopHalf = (clientX: number, clientY: number) => {
    const wrap = beakerWrapRef.current;
    if (!wrap) return false;
    const sceneRect = wrap.getBoundingClientRect();
    const sceneX = clientX - sceneRect.left;
    const sceneY = clientY - sceneRect.top;
    return worldToLocal(sceneX, sceneY).y < 0;
  };

  useEffect(() => {
    // Client-side initialization
    const scene = sceneRef.current;
    const beakerWrap = beakerWrapRef.current;
    const standEl = standRef.current;
    const cubeEl = cubeRef.current;
    if (!scene || !beakerWrap || !standEl || !cubeEl) return;

    // Set up standard window listener abort signal
    const controller = new AbortController();
    const { signal } = controller;

    const sw = scene.offsetWidth || 800;
    const sh = scene.offsetHeight || 540;
    const standW = 82.5;
    const standTotalH = 37.5;

    // Initialize HTML layout positions
    standEl.style.transform = `translate3d(${(sw * 0.82 - standW / 2).toFixed(1)}px, ${(sh - standTotalH).toFixed(1)}px, 0)`;

    const cube = cubeRefState.current;
    cube.x = sw * 0.82;
    cube.y = sh - standTotalH - cube.h / 2;

    cubeEl.style.transform = `translate3d(${(cube.x - cube.w / 2).toFixed(1)}px, ${(cube.y - cube.h / 2).toFixed(1)}px, 0)`;

    // Seed fluid particles
    if (!stateRef.current.initialized) {
      seedParticles();
      stateRef.current.initialized = true;
    }

    // Initialize Matter.js Physics Engine
    const wallT = 60;
    const matterEngine = Matter.Engine.create({ gravity: { x: 0, y: 1.8 } });
    matterEngineRef.current = matterEngine;

    // Boundary walls to contain metal cube within visible stage area
    const floor = Matter.Bodies.rectangle(sw / 2, sh + wallT / 2 - 2, sw + 40, wallT, { isStatic: true, restitution: 0.3, friction: 0.5 });
    const ceiling = Matter.Bodies.rectangle(sw / 2, -wallT / 2 + 2, sw + 40, wallT, { isStatic: true, restitution: 0.1 });
    const wallL = Matter.Bodies.rectangle(-wallT / 2 + 2, sh / 2, wallT, sh + 40, { isStatic: true, restitution: 0.3 });
    const wallR = Matter.Bodies.rectangle(sw + wallT / 2 - 2, sh / 2, wallT, sh + 40, { isStatic: true, restitution: 0.3 });
    matterSceneBodiesRef.current = [floor, ceiling, wallL, wallR];

    const standBody = Matter.Bodies.rectangle(sw * 0.82, sh - standTotalH / 2, standW, standTotalH, {
      isStatic: true,
      restitution: 0.2,
      friction: 0.5,
      chamfer: { radius: 2 },
    });
    matterStandBodyRef.current = standBody;

    const cubeBody = Matter.Bodies.rectangle(cube.x, cube.y, cube.w, cube.h, {
      restitution: 0.35,
      friction: 0.4,
      frictionAir: 0.02,
      density: 0.008,
      chamfer: { radius: 8 },
      label: "metalCube",
    });
    matterCubeBodyRef.current = cubeBody;

    Matter.Composite.add(matterEngine.world, [...matterSceneBodiesRef.current, standBody, cubeBody]);
    rebuildBeakerBodies();

    // ----- Attach Event Listeners -----

    // Beaker wrapper dragging/rotation
    beakerWrap.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const isTopHalf = checkTopHalf(event.clientX, event.clientY);
      beginDrag(event.clientX, event.clientY, event.pointerId, isTopHalf ? "rotate" : "move");
      beakerWrap.style.cursor = isTopHalf ? "alias" : "grabbing";
      if (typeof beakerWrap.setPointerCapture === "function") {
        beakerWrap.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
    }, { signal });

    beakerWrap.addEventListener("pointermove", (event) => {
      if (!stateRef.current.dragging) {
        const isTopHalf = checkTopHalf(event.clientX, event.clientY);
        beakerWrap.style.cursor = isTopHalf ? "alias" : "grab";
      }
    }, { signal });

    window.addEventListener("pointermove", (event) => {
      const state = stateRef.current;
      if (state.dragging && state.pointerId === event.pointerId) {
        dragTo(event.clientX, event.clientY);
      }
    }, { signal });

    window.addEventListener("pointerup", (event) => {
      if (stateRef.current.pointerId !== event.pointerId) return;
      if (typeof beakerWrap.hasPointerCapture === "function" && beakerWrap.hasPointerCapture(event.pointerId)) {
        beakerWrap.releasePointerCapture(event.pointerId);
      }
      endDrag();
    }, { signal });

    window.addEventListener("pointercancel", (event) => {
      if (stateRef.current.pointerId !== event.pointerId) return;
      endDrag();
    }, { signal });

    // Metal cube dragging
    cubeEl.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      if (rxnRef.current.progress >= 1) return; // dissolved
      e.preventDefault();
      e.stopPropagation();

      const cube = cubeRefState.current;
      cube.dragging = true;
      cube.pointerId = e.pointerId;
      cube.totalDrag = 0;
      setPickerOpen(false);

      if (standEl) standEl.style.opacity = "0";
      if (matterStandBodyRef.current && matterEngine) {
        Matter.Composite.remove(matterEngine.world, matterStandBodyRef.current);
        matterStandBodyRef.current = null;
      }

      const sceneRect = scene.getBoundingClientRect();
      cube.dragOffsetX = e.clientX - sceneRect.left - cube.x;
      cube.dragOffsetY = e.clientY - sceneRect.top - cube.y;
      cube.targetX = cube.x;
      cube.targetY = cube.y;

      if (typeof cubeEl.setPointerCapture === "function") {
        cubeEl.setPointerCapture(e.pointerId);
      }
    }, { signal });

    window.addEventListener("pointermove", (e) => {
      const cube = cubeRefState.current;
      if (!cube.dragging || cube.pointerId !== e.pointerId) return;

      const sceneRect = scene.getBoundingClientRect();
      const sw = scene.offsetWidth || 800;
      const sh = scene.offsetHeight || 540;
      const tx = e.clientX - sceneRect.left - cube.dragOffsetX;
      const ty = e.clientY - sceneRect.top - cube.dragOffsetY;

      cube.targetX = Math.max(cube.w / 2 + 2, Math.min(sw - cube.w / 2 - 2, tx));
      cube.targetY = Math.max(cube.h / 2 + 2, Math.min(sh - cube.h / 2 - 2, ty));
      cube.totalDrag += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
    }, { signal });

    const endCubeDrag = (e: PointerEvent) => {
      const cube = cubeRefState.current;
      if (cube.pointerId !== e.pointerId) return;
      cube.dragging = false;
      cube.pointerId = null;
      cube.totalDrag = 0;
      if (typeof cubeEl.hasPointerCapture === "function" && cubeEl.hasPointerCapture(e.pointerId)) {
        cubeEl.releasePointerCapture(e.pointerId);
      }
    };
    window.addEventListener("pointerup", endCubeDrag, { signal });
    window.addEventListener("pointercancel", endCubeDrag, { signal });

    // Close element picker when clicking elsewhere
    document.addEventListener("pointerdown", (e) => {
      const picker = elementPickerRef.current;
      if (picker && picker.classList.contains("open") && !picker.contains(e.target as Node) && !cubeEl.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }, { signal });

    // Start physics/render loop
    stateRef.current.animationFrame = window.requestAnimationFrame(animate);

    // Cleanup on component unmount
    return () => {
      controller.abort();
      window.cancelAnimationFrame(stateRef.current.animationFrame);
      if (matterEngine) {
        Matter.Composite.clear(matterEngine.world, false);
        Matter.Engine.clear(matterEngine);
      }
      rxnRef.current.bubbles.forEach(b => b.el.remove());
    };
  }, [selectedElement]);

  const handleHeaterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setHeaterLevel(val);
    heaterRef.current = val;
  };

  const getHeaterLabel = (val: number) => {
    if (val === 0) {
      try {
        const translated = tLab("heaterOff");
        return translated === "heaterOff" ? "OFF" : translated;
      } catch {
        return "OFF";
      }
    }
    return `${val}%`;
  };

  const getHeaterTitle = () => {
    try {
      const translated = tLab("heater");
      if (translated === "heater") return "Heater";
      return translated;
    } catch {
      return "Heater";
    }
  };

  const renderFormulaJSX = (formula: string) => {
    const parts = formula.split(/(\d+)/);
    return (
      <span className="font-mono font-bold">
        {parts.map((part, i) => {
          if (/^\d+$/.test(part)) {
            return <sub key={i} className="text-[75%] bottom-[-0.25em]">{part}</sub>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="w-full max-w-none mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* CSS Stylesheet Inject */}
      <style dangerouslySetInnerHTML={{ __html: `
        .virtual-lab-goo-defs {
            position: absolute;
            width: 0;
            height: 0;
            pointer-events: none;
        }

        .virtual-lab-shell {
            display: flex;
            flex: 1;
            flex-direction: column;
            width: 100%;
            height: 600px;
            box-sizing: border-box;
            padding: 0;
            background: transparent;
            position: relative;
            user-select: none;
            -webkit-user-select: none;
        }

        .virtual-lab-stage {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: stretch;
            justify-content: center;
            background: transparent;
        }

        .virtual-lab-scene {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(165deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.02) 100%);
            border-radius: 20px;
            box-sizing: border-box;
            overflow: hidden;
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 
                inset 0 4px 10px rgba(0, 0, 0, 0.03),
                inset 0 2px 4px rgba(0, 0, 0, 0.02),
                inset 0 -1px 2px rgba(255, 255, 255, 0.6),
                0 1px 2px rgba(255, 255, 255, 1);
        }

        .virtual-lab-particle-layer {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 1;
            filter: url(#virtual-lab-goo-filter);
        }

        .virtual-lab-wooden-stand {
            position: absolute;
            left: 0;
            top: 0;
            width: 82.5px;
            height: 17.5px;
            box-sizing: border-box;
            border-radius: 4px;
            background: linear-gradient(180deg, #b07e54, #8b5a2b);
            border: 2px solid #5c3a18;
            border-top: 1px solid #d4a373;
            box-shadow: 0 4px 6px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.1);
            z-index: 5;
            transition: opacity 0.3s ease;
            will-change: transform;
        }

        .virtual-lab-wooden-stand::before,
        .virtual-lab-wooden-stand::after {
            content: '';
            position: absolute;
            top: 100%;
            width: 12.5px;
            height: 20px;
            background: linear-gradient(180deg, #8b5a2b, #5c3a18);
            border: 2px solid #5c3a18;
            border-top: none;
            border-radius: 0 0 3px 3px;
            box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            box-sizing: border-box;
        }
        .virtual-lab-wooden-stand::before { left: 6px; }
        .virtual-lab-wooden-stand::after { right: 6px; }

        .virtual-lab-metal-cube {
            position: absolute;
            left: 0;
            top: 0;
            width: 58px;
            height: 58px;
            box-sizing: border-box;
            border-radius: 8px;
            background: #b0b5bc;
            border: 1px solid #9da3ab;
            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
            cursor: grab;
            touch-action: none;
            user-select: none;
            z-index: 10;
            will-change: transform;
        }

        .virtual-lab-metal-cube:active { cursor: grabbing; }

        .virtual-lab-beaker-wrap {
            position: relative;
            width: 210px;
            height: 295px;
            --vlab-x: 0px;
            --vlab-y: 0px;
            --vlab-rot: 0deg;
            transform: translate3d(var(--vlab-x), var(--vlab-y), 0) rotate(var(--vlab-rot));
            transform-origin: 50% 50%;
            cursor: grab;
            touch-action: none;
            user-select: none;
            will-change: transform;
            transition: transform 180ms ease;
            z-index: 3;
        }

        .virtual-lab-beaker-wrap.dragging {
            cursor: grabbing;
            transition: none;
        }

        .virtual-lab-beaker {
            position: relative;
            width: 100%;
            height: 100%;
        }

        .virtual-lab-beaker-body {
            position: absolute;
            left: 22.5px;
            right: 22.5px;
            top: 25px;
            bottom: 12.5px;
            border-radius: 0 0 37.5px 37.5px;
            border-left: 3px solid rgba(212, 220, 232, 0.95);
            border-right: 3px solid rgba(212, 220, 232, 0.95);
            border-bottom: 3px solid rgba(212, 220, 232, 0.95);
            background: transparent;
        }

        .virtual-lab-fluid-mask {
            position: absolute;
            left: 0;
            right: 0;
            top: -200px;
            bottom: 0;
            overflow: hidden;
            border-radius: 0 0 34.5px 34.5px;
            pointer-events: none;
        }

        .virtual-lab-fluid-layer {
            position: absolute;
            inset: 0;
            filter: url(#virtual-lab-goo-filter);
            pointer-events: none;
        }

        .virtual-lab-particle {
            position: absolute;
            border-radius: 999px;
            background: #4da6ff;
            box-shadow: none;
            will-change: transform;
        }

        .virtual-lab-scale {
            position: absolute;
            right: 14px;
            top: 28px;
            bottom: 18px;
            width: 14px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: flex-end;
            pointer-events: none;
            opacity: 0.72;
        }

        .virtual-lab-scale span {
            display: block;
            height: 1.5px;
            border-radius: 999px;
            background: rgba(200, 210, 224, 0.92);
        }

        .virtual-lab-scale span:nth-child(5n + 1) { width: 12px; }
        .virtual-lab-scale span:nth-child(5n + 2),
        .virtual-lab-scale span:nth-child(5n + 5) { width: 7px; }
        .virtual-lab-scale span:nth-child(5n + 3),
        .virtual-lab-scale span:nth-child(5n + 4) { width: 9px; }

        .virtual-lab-controls {
            position: absolute;
            bottom: 14px;
            left: 0;
            right: 0;
            height: 48px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            z-index: 50;
            pointer-events: none;
        }

        .virtual-lab-btn {
            appearance: none;
            border: 2px solid transparent;
            padding: 10px 24px;
            border-radius: 14px;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
            font-family: inherit;
            letter-spacing: -0.01em;
            pointer-events: auto;
        }

        .virtual-lab-btn.primary {
            background: rgba(30, 41, 59, 0.88);
            color: white;
            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.08),
                0 8px 24px rgba(0, 0, 0, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .virtual-lab-btn.primary:hover {
            transform: translateY(-1px);
            background: rgba(30, 41, 59, 0.95);
            box-shadow:
                0 4px 12px rgba(0, 0, 0, 0.1),
                0 12px 32px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .virtual-lab-btn.secondary {
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #475569;
            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.03),
                0 4px 16px rgba(0, 0, 0, 0.04),
                inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .virtual-lab-btn.secondary:hover {
            background: rgba(255, 255, 255, 0.85);
            color: #334155;
            box-shadow:
                0 4px 12px rgba(0, 0, 0, 0.04),
                0 8px 24px rgba(0, 0, 0, 0.06),
                inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .dark .virtual-lab-btn.secondary {
            background: rgba(39, 39, 42, 0.72);
            color: #d4d4d8;
            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.2),
                0 4px 16px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .dark .virtual-lab-btn.secondary:hover {
            background: rgba(39, 39, 42, 0.85);
            color: white;
        }

        .virtual-lab-element-picker {
            position: absolute;
            z-index: 100;
            min-width: 170px;
            max-height: 480px;
            overflow-y: auto;
            background: linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,248,250,0.95) 100%);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border-radius: 14px;
            border: 1px solid rgba(0,0,0,0.08);
            box-shadow: 0 14px 38px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
            padding: 6px;
            display: none;
            flex-direction: column;
            gap: 2px;
            bottom: 74px;
            left: 50%;
            transform: translateX(45px);
        }

        .dark .virtual-lab-element-picker {
            background: linear-gradient(180deg, rgba(24, 24, 27, 0.95) 0%, rgba(18, 18, 18, 0.95) 100%);
            border-color: rgba(255,255,255,0.08);
            box-shadow: 0 14px 38px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3);
        }

        .virtual-lab-element-picker.open {
            display: flex;
            animation: vlab-picker-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes vlab-picker-in {
            from { opacity: 0; transform: translateX(45px) translateY(6px) scale(0.97); }
            to { opacity: 1; transform: translateX(45px) translateY(0) scale(1); }
        }

        .virtual-lab-picker-group {
            padding: 6px 10px 4px;
            font-size: 10px;
            font-weight: 700;
            color: #86868b;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        .virtual-lab-picker-item {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 8px 10px;
            border: none;
            border-radius: 9px;
            background: none;
            text-align: left;
            font-size: 13px;
            font-weight: 550;
            color: #2f3136;
            cursor: pointer;
            transition: background 0.15s ease;
            font-family: inherit;
        }

        .dark .virtual-lab-picker-item {
            color: #e4e4e7;
        }

        .virtual-lab-picker-item:hover {
            background: rgba(0,0,0,0.04);
        }

        .dark .virtual-lab-picker-item:hover {
            background: rgba(255,255,255,0.05);
        }

        .virtual-lab-picker-item.active {
            background: rgba(0,0,0,0.07);
            font-weight: 650;
        }

        .dark .virtual-lab-picker-item.active {
            background: rgba(255,255,255,0.1);
        }

        .virtual-lab-picker-sym {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 7px;
            font-size: 13px;
            font-weight: 700;
            flex-shrink: 0;
            color: white;
        }

        .virtual-lab-element-picker::-webkit-scrollbar { display: none; }

        .virtual-lab-thermometer {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            min-width: 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            padding: 12px 10px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(0,0,0,0.04);
            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.03),
                0 8px 24px rgba(0, 0, 0, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.8);
            pointer-events: none;
            z-index: 15;
        }

        .dark .virtual-lab-thermometer {
            background: rgba(39, 39, 42, 0.72);
            border-color: rgba(255,255,255,0.05);
            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.2),
                0 8px 24px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .virtual-lab-thermo-track {
            position: relative;
            width: 8px;
            height: 100px;
            background: rgba(200, 210, 224, 0.4);
            border-radius: 999px;
            overflow: hidden;
        }

        .dark .virtual-lab-thermo-track {
            background: rgba(63, 63, 70, 0.5);
        }

        .virtual-lab-thermo-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 12%;
            background: linear-gradient(180deg, #5cb3ff 0%, #2b7de9 100%);
            border-radius: 999px;
            transition: height 0.6s ease;
        }

        .virtual-lab-thermo-temp {
            font-size: 11px;
            font-weight: 700;
            color: #555;
            letter-spacing: -0.02em;
            text-align: center;
            line-height: 1;
        }

        .dark .virtual-lab-thermo-temp {
            color: #e4e4e7;
        }

        .virtual-lab-thermo-label {
            font-size: 8px;
            font-weight: 600;
            color: #86868b;
            letter-spacing: 0.03em;
            text-transform: uppercase;
        }

        .virtual-lab-bubble {
            position: absolute;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.55);
            border: 1px solid rgba(255, 255, 255, 0.35);
            pointer-events: none;
            will-change: transform, opacity;
            z-index: 9;
        }

        .virtual-lab-reaction-info {
            display: none;
            position: absolute;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            width: max-content;
            z-index: 20;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 14px 22px;
            border-radius: 14px;
            background: rgba(236, 253, 245, 0.85);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(167, 243, 208, 0.6);
            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.03),
                0 8px 24px rgba(0, 0, 0, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.8);
            font-size: 16px;
            font-family: inherit;
            font-weight: 600;
            color: #047857;
            letter-spacing: 0.01em;
            animation: vlab-badge-in 0.3s ease;
        }

        .dark .virtual-lab-reaction-info {
            background: rgba(6, 78, 59, 0.8);
            border-color: rgba(52, 211, 153, 0.3);
            color: #a7f3d0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .virtual-lab-reaction-info.active {
            display: flex;
        }

        @keyframes vlab-badge-in {
            from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.96); }
            to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        .virtual-lab-reaction-eq {
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            font-weight: 700;
        }

        .virtual-lab-heater-control {
            position: absolute;
            left: 16px;
            bottom: 16px;
            min-width: 130px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 12px 14px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(0,0,0,0.04);
            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.03),
                0 8px 24px rgba(0, 0, 0, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.8);
            z-index: 15;
        }

        .dark .virtual-lab-heater-control {
            background: rgba(39, 39, 42, 0.72);
            border-color: rgba(255,255,255,0.05);
            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.2),
                0 8px 24px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .virtual-lab-heater-slider {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: rgba(200, 210, 224, 0.5);
            outline: none;
            margin: 6px 0;
        }

        .dark .virtual-lab-heater-slider {
            background: rgba(63, 63, 70, 0.6);
        }

        .virtual-lab-heater-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ef4444;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            transition: transform 0.1s;
        }

        .virtual-lab-heater-slider::-webkit-slider-thumb:hover {
            transform: scale(1.15);
        }

        .virtual-lab-burner-assembly {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 2;
        }

        .virtual-lab-tripod {
            position: absolute;
            left: 50%;
            bottom: 0;
            transform: translateX(-50%);
            width: 190px;
            height: 164px;
        }

        .virtual-lab-tripod-gauze {
            position: absolute;
            top: 0;
            left: 5px;
            width: 180px;
            height: 6px;
            background: linear-gradient(90deg, #374151 0%, #1f2937 50%, #374151 100%);
            border-radius: 2px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        .virtual-lab-tripod-leg {
            position: absolute;
            top: 5px;
            width: 6px;
            height: 159px;
            background: linear-gradient(180deg, #4b5563 0%, #1f2937 100%);
            border-radius: 2px;
        }

        .virtual-lab-tripod-leg.left {
            left: 15px;
            transform: rotate(6deg);
            transform-origin: top center;
        }

        .virtual-lab-tripod-leg.right {
            right: 15px;
            transform: rotate(-6deg);
            transform-origin: top center;
        }

        .virtual-lab-burner-nozzle {
            position: absolute;
            left: 50%;
            bottom: 0;
            transform: translateX(-50%);
            width: 70px;
            height: 95px;
        }

        .virtual-lab-burner-base {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 70px;
            height: 10px;
            background: linear-gradient(180deg, #9ca3af 0%, #4b5563 100%);
            border-radius: 4px 4px 0 0;
            border: 1px solid #6b7280;
        }

        .virtual-lab-burner-tube {
            position: absolute;
            bottom: 10px;
            left: 27px;
            width: 16px;
            height: 85px;
            background: linear-gradient(90deg, #d97706 0%, #f59e0b 35%, #b45309 100%);
            border: 1px solid #78350f;
            border-radius: 1px 1px 0 0;
        }

        .virtual-lab-burner-collar {
            position: absolute;
            bottom: 20px;
            left: 24px;
            width: 22px;
            height: 12px;
            background: linear-gradient(90deg, #4b5563 0%, #9ca3af 50%, #374151 100%);
            border: 1px solid #1f2937;
            border-radius: 2px;
        }

        .virtual-lab-flame {
            position: absolute;
            width: 40px;
            height: 70px;
            transform-origin: bottom center;
            filter: blur(1px);
            mix-blend-mode: screen;
        }

        .flame-part {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 50% 50% 20% 20% / 60% 60% 40% 40%;
            transform-origin: bottom center;
            animation: flame-flicker 0.12s infinite alternate ease-in-out;
        }

        .flame-glow {
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            opacity: 0.35;
            pointer-events: none;
            transition: all 0.3s ease;
        }

        @keyframes flame-flicker {
            0% { transform: translateX(-50%) scaleX(0.96) rotate(-1deg); }
            100% { transform: translateX(-50%) scaleX(1.04) rotate(1deg) scaleY(1.05); }
        }

        .virtual-lab-flame.level-1 {
            height: 40px;
            width: 24px;
        }
        .virtual-lab-flame.level-1 .flame-glow {
            background: radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(59, 130, 246, 0) 70%);
        }
        .virtual-lab-flame.level-1 .flame-part.outer {
            width: 22px;
            height: 36px;
            background: linear-gradient(180deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.4) 100%);
            z-index: 1;
        }
        .virtual-lab-flame.level-1 .flame-part.mid {
            width: 14px;
            height: 24px;
            background: linear-gradient(180deg, rgba(96, 165, 250, 0.9) 0%, rgba(29, 78, 216, 0.6) 100%);
            z-index: 2;
        }
        .virtual-lab-flame.level-1 .flame-part.core {
            width: 8px;
            height: 14px;
            background: #ffffff;
            opacity: 0.9;
            z-index: 3;
        }

        .virtual-lab-flame.level-2 {
            height: 60px;
            width: 32px;
        }
        .virtual-lab-flame.level-2 .flame-glow {
            background: radial-gradient(circle, rgba(249, 115, 22, 0.5) 0%, rgba(59, 130, 246, 0.1) 70%);
        }
        .virtual-lab-flame.level-2 .flame-part.outer {
            width: 30px;
            height: 55px;
            background: linear-gradient(180deg, rgba(249, 115, 22, 0.8) 20%, rgba(59, 130, 246, 0.3) 100%);
            z-index: 1;
        }
        .virtual-lab-flame.level-2 .flame-part.mid {
            width: 18px;
            height: 38px;
            background: linear-gradient(180deg, rgba(251, 146, 60, 0.9) 10%, rgba(37, 99, 235, 0.5) 100%);
            z-index: 2;
        }
        .virtual-lab-flame.level-2 .flame-part.core {
            width: 10px;
            height: 22px;
            background: linear-gradient(180deg, #ffffff 0%, rgba(96, 165, 250, 0.9) 100%);
            z-index: 3;
        }

        .virtual-lab-flame.level-3 {
            height: 90px;
            width: 44px;
        }
        .virtual-lab-flame.level-3 .flame-glow {
            background: radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, rgba(245, 158, 11, 0.2) 50%, rgba(239, 68, 68, 0) 80%);
        }
        .virtual-lab-flame.level-3 .flame-part.outer {
            width: 42px;
            height: 85px;
            background: linear-gradient(180deg, rgba(239, 68, 68, 0.85) 0%, rgba(245, 158, 11, 0.6) 50%, rgba(37, 99, 235, 0.1) 100%);
            z-index: 1;
            animation-duration: 0.08s;
        }
        .virtual-lab-flame.level-3 .flame-part.mid {
            width: 26px;
            height: 60px;
            background: linear-gradient(180deg, rgba(245, 158, 11, 0.95) 0%, rgba(251, 146, 60, 0.8) 60%, rgba(59, 130, 246, 0.3) 100%);
            z-index: 2;
            animation-duration: 0.1s;
        }
        .virtual-lab-flame.level-3 .flame-part.core {
            width: 14px;
            height: 35px;
            background: linear-gradient(180deg, #ffffff 0%, rgba(253, 224, 71, 0.9) 100%);
            z-index: 3;
            animation-duration: 0.12s;
        }

        @media (max-width: 980px) {
            .virtual-lab-beaker-wrap {
                width: 187.5px;
                height: 262.5px;
            }
        }
      ` }} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 w-full">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-650 dark:text-purple-400 rounded-xl border border-purple-200 dark:border-purple-500/20">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {tTools("virtualLabName")}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {tTools("virtualLabDesc")}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* SVG Gooey Filter Definitions */}
      <svg className="virtual-lab-goo-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id="virtual-lab-goo-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="blur"></feGaussianBlur>
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 14 -6"
              result="goo"
            ></feColorMatrix>
            <feBlend in="SourceGraphic" in2="goo"></feBlend>
          </filter>
        </defs>
      </svg>

      {/* Main Physics Simulator Area */}
      <div className="virtual-lab-shell select-none">
        <div className="virtual-lab-stage">
          <div ref={sceneRef} className="virtual-lab-scene" id="virtual-lab-scene">
            {/* Spill Particle layer */}
            <div ref={spillLayerRef} className="virtual-lab-particle-layer" id="virtual-lab-particle-layer" aria-hidden="true"></div>

            {/* Stand element */}
            <div ref={standRef} className="virtual-lab-wooden-stand" id="virtual-lab-wooden-stand"></div>

            {/* Bunsen Burner & Tripod Assembly */}
            <div className="virtual-lab-burner-assembly" aria-hidden="true">
              {/* Tripod Stand */}
              <div className="virtual-lab-tripod">
                <div className="virtual-lab-tripod-gauze"></div>
                <div className="virtual-lab-tripod-leg left"></div>
                <div className="virtual-lab-tripod-leg right"></div>
              </div>

              {/* Burner Nozzle */}
              <div className="virtual-lab-burner-nozzle">
                <div className="virtual-lab-burner-base"></div>
                <div className="virtual-lab-burner-tube"></div>
                <div className="virtual-lab-burner-collar"></div>
              </div>

              {/* Flame */}
              {heaterLevel > 0 && (() => {
                const levelClass = heaterLevel > 66 ? 3 : heaterLevel > 33 ? 2 : 1;
                const scale = 0.6 + (heaterLevel / 100) * 0.4;
                return (
                  <div className={`virtual-lab-flame level-${levelClass}`} style={{ left: '50%', bottom: '95px', transform: `translateX(-50%) scale(${scale})` }}>
                    <div className="flame-glow"></div>
                    <div className="flame-part core"></div>
                    <div className="flame-part mid"></div>
                    <div className="flame-part outer"></div>
                  </div>
                );
              })()}
            </div>

            {/* Metal element cube */}
            <div
              ref={cubeRef}
              className="virtual-lab-metal-cube"
              id="virtual-lab-metal-cube"
              style={{
                background: "#b0b5bc",
                border: "1px solid #9da3ab",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "17px",
                fontWeight: "800",
                fontFamily: "Inter, sans-serif",
                textShadow: "0 1px 2px rgba(0,0,0,0.25)"
              }}
            >
              <span style={{ color: selectedElement.color, textShadow: "none", fontSize: "17px", fontWeight: "800" }}>
                {selectedElement.sym}
              </span>
            </div>

            {/* Beaker Container */}
            <div
              ref={beakerWrapRef}
              className="virtual-lab-beaker-wrap"
              id="virtual-lab-beaker-wrap"
              aria-label={tLab("beakerAria")}
            >
              <div className="virtual-lab-beaker">
                <div ref={beakerBodyRef} className="virtual-lab-beaker-body" id="virtual-lab-beaker-body">
                  <div className="virtual-lab-fluid-mask" aria-hidden="true">
                    {/* Water Particle container */}
                    <div ref={fluidLayerRef} className="virtual-lab-fluid-layer" id="virtual-lab-fluid-layer"></div>
                  </div>
                  {/* Graduated volumetric markings */}
                  <div className="virtual-lab-scale" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thermometer Side Badge */}
            <div className="virtual-lab-thermometer" id="virtual-lab-thermometer">
              <div className="virtual-lab-thermo-track">
                <div ref={thermoFillRef} className="virtual-lab-thermo-fill" id="virtual-lab-thermo-fill" style={{ height: "12%" }}></div>
              </div>
              <div ref={thermoTempRef} className="virtual-lab-thermo-temp" id="virtual-lab-thermo-temp">20°</div>
              <div className="virtual-lab-thermo-label">TEMP</div>
            </div>

            {/* Heater Control Card */}
            <div className="virtual-lab-heater-control" id="virtual-lab-heater-control">
              <span className="virtual-lab-thermo-label">{getHeaterTitle()}</span>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 leading-none">
                {getHeaterLabel(heaterLevel)}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={heaterLevel}
                onChange={handleHeaterChange}
                className="virtual-lab-heater-slider"
                aria-label="Water Heater Intensity"
              />
            </div>

            {/* Bottom Controls */}
            <div className="virtual-lab-controls">
              <button onClick={addWaterBurst} className="virtual-lab-btn primary flex items-center gap-2" id="virtual-lab-add-water-btn" type="button">
                <Plus className="w-4 h-4" />
                {tLab("addWater")}
              </button>
              <button onClick={fullReset} className="virtual-lab-btn secondary flex items-center gap-2" id="virtual-lab-clear-water-btn" type="button">
                <RefreshCw className="w-4 h-4" />
                {tLab("reset")}
              </button>
              <button onClick={() => setPickerOpen(!pickerOpen)} className="virtual-lab-btn secondary flex items-center gap-2" id="virtual-lab-change-element-btn" type="button">
                <Pencil className="w-4 h-4" />
                {tLab("element")}
              </button>
            </div>
          </div>
        </div>

        {/* Floating Active Chemical Equation Badge */}
        <div className={`virtual-lab-reaction-info ${reactionActive ? "active" : ""}`} id="virtual-lab-reaction-info">
          <span>Reaction:</span>
          <span className="virtual-lab-reaction-eq ml-1">{reactionInfo ? renderFormulaJSX(reactionInfo) : ""}</span>
        </div>

        {/* Element Selection Picker Dropdown */}
        <div ref={elementPickerRef} className={`virtual-lab-element-picker ${pickerOpen ? "open" : ""}`} id="virtual-lab-element-picker">
          {METAL_ELEMENTS.map(group => (
            <div key={group.group} className="flex flex-col">
              <div className="virtual-lab-picker-group">{group.group}</div>
              {group.elements.map(el => (
                <button
                  key={el.sym}
                  onClick={() => handleSelectElement(el)}
                  className={`virtual-lab-picker-item ${selectedElement.sym === el.sym ? "active" : ""}`}
                  type="button"
                >
                  <span className="virtual-lab-picker-sym" style={{ backgroundColor: el.color }}>
                    {el.sym}
                  </span>
                  <span>{el.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
