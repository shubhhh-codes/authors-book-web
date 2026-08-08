import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { ShelfEngine } from './ShelfEngine';
import type { CatalogBook } from './catalog';

// Mock OrbitControls before mocking three
vi.mock('three/addons/controls/OrbitControls.js', () => ({
  OrbitControls: class MockOrbitControls {
    target = new THREE.Vector3();
    update = vi.fn();
    dispose = vi.fn();
  }
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Create a globally accessible mock for loadAsync
const mockLoadAsync = vi.fn();

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();

  class MockWebGLRenderer {
    capabilities = { getMaxAnisotropy: () => 8 };
    shadowMap = { enabled: false, type: 0 };
    setSize = () => {};
    setPixelRatio = () => {};
    getPixelRatio = () => 1;
    setAnimationLoop = () => {};
    render = () => {};
    dispose = () => {};
    info = { memory: { textures: 0, geometries: 0 }, render: { calls: 0, triangles: 0 } };
  }

  return {
    ...actual,
    TextureLoader: class MockTextureLoader {
      // Instead of an instance property that we can't easily mock, let's call our global mock
      loadAsync = mockLoadAsync;
    },
    WebGLRenderer: MockWebGLRenderer,
  };
});

describe('ShelfEngine', () => {
  let mockCanvas: HTMLCanvasElement;
  const mockBooksData: CatalogBook[] = [];
  let engine: any;

  beforeEach(() => {
    mockCanvas = document.createElement('canvas');
    mockLoadAsync.mockReset();
  });

  afterEach(() => {
    if (engine) {
      engine.isDisposed = true;
      engine.dispose();
    }
  });

  describe('loadCustomCover error handling', () => {
    it('should keep the procedural cover when an optional image fails to load', async () => {
      mockLoadAsync.mockRejectedValue(new Error('Failed to load'));

      engine = new ShelfEngine(mockCanvas, mockBooksData, {
        onActiveIndex: vi.fn(),
        onMode: vi.fn(),
        onStatus: vi.fn(),
        onReady: vi.fn(),
      });

      const mockProceduralTexture = { dispose: vi.fn() };
      const mockRuntime = {
        data: { id: 'test-book' },
        textures: [],
        frontSurface: {
          material: {
            map: mockProceduralTexture
          }
        }
      };

      await engine.loadCustomCover(mockRuntime, 'invalid-url');

      expect(mockProceduralTexture.dispose).not.toHaveBeenCalled();
      expect(mockRuntime.frontSurface.material.map).toBe(mockProceduralTexture);
    });

    it('should successfully apply loaded texture and dispose of procedural one', async () => {
      const mockTexture = {
        name: '',
        colorSpace: '',
        anisotropy: 0,
        dispose: vi.fn()
      };

      mockLoadAsync.mockResolvedValue(mockTexture);

      engine = new ShelfEngine(mockCanvas, mockBooksData, {
        onActiveIndex: vi.fn(),
        onMode: vi.fn(),
        onStatus: vi.fn(),
        onReady: vi.fn(),
      });

      const mockProceduralTexture = { dispose: vi.fn() };
      const mockRuntime = {
        data: { id: 'test-book' },
        textures: [mockProceduralTexture],
        frontSurface: {
          material: {
            map: mockProceduralTexture,
            needsUpdate: false,
          }
        }
      };

      await engine.loadCustomCover(mockRuntime, 'valid-url');

      // The material map should be replaced with our mockTexture
      expect(mockRuntime.frontSurface.material.map).toBe(mockTexture);

      // Property updates from ShelfEngine
      expect((mockRuntime.frontSurface.material.map as any).name).toBe('customCover:test-book');
      expect((mockRuntime.frontSurface.material.map as any).colorSpace).toBe(THREE.SRGBColorSpace);
      expect((mockRuntime.frontSurface.material.map as any).anisotropy).toBe(8);
      expect(mockRuntime.frontSurface.material.needsUpdate).toBe(true);

      // Cleanup of old texture
      expect(mockProceduralTexture.dispose).toHaveBeenCalled();
      expect(mockRuntime.textures).toContain(mockTexture);
      expect(mockRuntime.textures).not.toContain(mockProceduralTexture);
    });
  });
});
