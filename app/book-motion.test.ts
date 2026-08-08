import { describe, it, expect } from "vitest";
import { shelvedBookPose, shelvedYaw, MotionLayout } from "./book-motion";

describe("shelvedBookPose", () => {
  it("should return the correct BookPose based on the provided MotionLayout", () => {
    const mockLayout: MotionLayout = {
      shelvedZ: -0.5,
      presentedZ: 0.5,
      rotationLaneZ: 0,
      presentedScale: 1.1,
      collisionMargin: 0.1,
    };

    const result = shelvedBookPose(mockLayout);

    expect(result).toEqual({
      x: 0,
      z: mockLayout.shelvedZ,
      yaw: shelvedYaw,
      scale: 1,
    });
  });

  it("should return the correct BookPose even with different shelvedZ values", () => {
    const mockLayout: MotionLayout = {
      shelvedZ: -10,
      presentedZ: 0,
      rotationLaneZ: 0,
      presentedScale: 1,
      collisionMargin: 0,
    };

    const result = shelvedBookPose(mockLayout);

    expect(result).toEqual({
      x: 0,
      z: -10,
      yaw: shelvedYaw,
      scale: 1,
    });
  });
});
