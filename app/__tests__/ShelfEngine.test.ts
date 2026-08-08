import * as THREE from 'three';
import { createLivingMaterial } from '../ShelfEngine';

describe('createLivingMaterial', () => {
  it('should create a ShaderMaterial with expected uniforms and blending', () => {
    const colorHex = '#ff0000';
    const material = createLivingMaterial(colorHex);

    expect(material).toBeInstanceOf(THREE.ShaderMaterial);

    // Check material properties
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
    expect(material.blending).toBe(THREE.AdditiveBlending);

    // Check uniforms
    expect(material.uniforms).toBeDefined();
    expect(material.uniforms.uTime).toBeDefined();
    expect(material.uniforms.uTime.value).toBe(0);

    expect(material.uniforms.uStrength).toBeDefined();
    expect(material.uniforms.uStrength.value).toBe(0);

    expect(material.uniforms.uColor).toBeDefined();
    expect(material.uniforms.uColor.value).toBeInstanceOf(THREE.Color);
    expect(material.uniforms.uColor.value.getHexString()).toBe('ff0000');

    // Check if shaders exist (as strings)
    expect(typeof material.vertexShader).toBe('string');
    expect(typeof material.fragmentShader).toBe('string');

    // Check key variable usage in shaders
    expect(material.vertexShader).toContain('gl_Position');
    expect(material.fragmentShader).toContain('gl_FragColor');
    expect(material.fragmentShader).toContain('uColor');
    expect(material.fragmentShader).toContain('uStrength');
    expect(material.fragmentShader).toContain('uTime');
  });
});
