import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock OrbitControls before importing ShelfEngine
vi.mock('three/addons/controls/OrbitControls.js', () => {
  return {
    OrbitControls: vi.fn().mockImplementation(function() {
      return {
        update: vi.fn(),
        dispose: vi.fn(),
      };
    }),
  };
});

// Mock three's WebGLRenderer
vi.mock('three', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(function() {
      return {
        outputColorSpace: '',
        toneMapping: 0,
        toneMappingExposure: 1,
        shadowMap: { enabled: false, type: 0 },
        capabilities: { getMaxAnisotropy: () => 1 },
        setPixelRatio: vi.fn(),
        setSize: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        info: {
          render: { calls: 0, triangles: 0 },
          memory: { geometries: 0, textures: 0 },
        },
        domElement: document.createElement('canvas'),
      };
    })
  };
});

import { ShelfEngine } from '../app/ShelfEngine';

describe('ShelfEngine constructor defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should initialize with correct default values', () => {
    // Create a mock canvas
    const canvas = document.createElement('canvas');
    canvas.style.touchAction = '';

    // Create mock dependencies
    const books: any[] = [];
    const callbacks = {
      onActiveIndex: vi.fn(),
      onMode: vi.fn(),
      onStatus: vi.fn(),
      onReady: vi.fn()
    };

    // Create the engine
    const engine = new ShelfEngine(canvas, books, callbacks);

    // Stop the requestAnimationFrame loop to avoid subsequent calls in test
    const e = engine as any;
    e.isDisposed = true; // Tell engine not to continue animating
    if (e.animationFrame) {
      cancelAnimationFrame(e.animationFrame);
    }

    // Assert on canvas style changes made by constructor
    expect(canvas.style.touchAction).toBe('pan-y');

    expect(e.mode).toBe('browse');
    expect(e.selectedIndex).toBeNull();
    expect(e.activeIndex).toBe(0);
    expect(e.presentedIndex).toBe(0);
    expect(e.pendingFocusIndex).toBeNull();
    expect(e.browseMotionPhase).toBe('idle');
    expect(e.browseMotionProgress).toBe(0);
    expect(e.motionBookIndex).toBeNull();
    expect(e.collisionRejects).toBe(0);
    expect(e.lastCollisionPair).toBeNull();
    expect(e.scrollIndex).toBe(0);
    expect(e.targetScrollIndex).toBe(0);
    expect(e.focusProgress).toBe(0);
    expect(e.isInspectingSwitch).toBe(false);
    expect(e.pointerDown).toBe(false);
    expect(e.pointerId).toBeNull();
    expect(e.reducedMotion).toBe(false);
    expect(e.detailScrollProgress).toBe(0);
    expect(e.currentScrollProgress).toBe(0);
  });
});
