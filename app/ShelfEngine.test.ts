import { ShelfEngine } from './ShelfEngine';
import * as THREE from 'three';

// Mock WebGLRenderer to avoid canvas context errors
jest.mock('three', () => {
  const originalModule = jest.requireActual('three');
  return {
    ...originalModule,
    WebGLRenderer: jest.fn().mockImplementation(() => {
      return {
        setSize: jest.fn(),
        setPixelRatio: jest.fn(),
        getPixelRatio: jest.fn().mockReturnValue(1),
        setAnimationLoop: jest.fn(),
        render: jest.fn(),
        shadowMap: { enabled: false, type: 0 },
        domElement: document.createElement('canvas'),
        dispose: jest.fn(),
        capabilities: { getMaxAnisotropy: () => 1 },
        info: {
          render: { calls: 0, triangles: 0 },
          memory: { geometries: 0, textures: 0 }
        }
      };
    }),
  };
});

describe('ShelfEngine', () => {
  let canvas: HTMLCanvasElement;
  let mockOnStatus: jest.Mock;

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    canvas = document.createElement('canvas');
    mockOnStatus = jest.fn();
    global.fetch = jest.fn();

    // We need to restore WebGLRenderer mock implementation because jest.resetAllMocks() in afterEach removes it
    (THREE.WebGLRenderer as jest.Mock).mockImplementation(() => {
      return {
        setSize: jest.fn(),
        setPixelRatio: jest.fn(),
        getPixelRatio: jest.fn().mockReturnValue(1),
        setAnimationLoop: jest.fn(),
        render: jest.fn(),
        shadowMap: { enabled: false, type: 0 },
        domElement: document.createElement('canvas'),
        dispose: jest.fn(),
        capabilities: { getMaxAnisotropy: () => 1 },
        info: {
          render: { calls: 0, triangles: 0 },
          memory: { geometries: 0, textures: 0 }
        }
      };
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('handles loadStripeAssets archive failure correctly (fetch error)', async () => {
    // Make fetch reject
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const engine = new ShelfEngine(canvas, [], {
      onReady: jest.fn(),
      onStatus: mockOnStatus,
      onActiveIndex: jest.fn(),
      onMode: jest.fn(),
    });

    mockOnStatus.mockClear();

    // Call private method loadStripeAssets
    await (engine as any).loadStripeAssets();

    // The method catches the error and calls onStatus again
    expect(mockOnStatus).toHaveBeenCalledWith('0 volumes ready');
  });

  it('handles loadStripeAssets bad response correctly', async () => {
    // Make fetch resolve with bad response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false
    });

    const engine = new ShelfEngine(canvas, [], {
      onReady: jest.fn(),
      onStatus: mockOnStatus,
      onActiveIndex: jest.fn(),
      onMode: jest.fn(),
    });

    mockOnStatus.mockClear();

    // Call private method loadStripeAssets
    await (engine as any).loadStripeAssets();

    // The method catches the error and calls onStatus again
    expect(mockOnStatus).toHaveBeenCalledWith('0 volumes ready');
  });
});
