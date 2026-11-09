"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFBX, useAnimations } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";

import { getTerrainHeight } from "./terrainHeight";

import {
  blocksHouseMovement,
  HOUSE01,
  HOUSE02,
  updateHouseDoorFromPlayer,
} from "./houseState";

type AnimationName = "Idle" | "Walk" | "Run" | "Jump";

export default function Character() {
  // Character and Mixamo animations
  const characterFBX = useFBX("/models/character/character.fbx");

  const idleFBX = useFBX("/models/character/animations/idle.fbx");
  const walkFBX = useFBX("/models/character/animations/walk.fbx");
  const runFBX = useFBX("/models/character/animations/run.fbx");
  const jumpFBX = useFBX("/models/character/animations/jump.fbx");

  const root = useRef<THREE.Group>(null);

  // Keyboard input
  const keys = useRef<Record<string, boolean>>({});
  const jumpRequested = useRef(false);

  // Jump physics
  const jumping = useRef(false);
  const jumpAnimationFinished = useRef(false);
  const verticalVelocity = useRef(0);

  // Animation state
  const currentAnimation = useRef<AnimationName | null>(null);

  // Camera controls
  const cameraYaw = useRef(0);
  const cameraPitch = useRef(0.18);
  const cameraDistance = useRef(7);

  const firstPerson = useRef(false);
  const dragging = useRef(false);
  const cameraInitialized = useRef(false);

  const { camera, gl } = useThree();

  // Clone and scale the character
  const character = useMemo(() => {
    const model = SkeletonUtils.clone(characterFBX);

    model.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());

    if (size.y <= 0) {
      throw new Error("Invalid character dimensions.");
    }

    const scale = 1.7 / size.y;

    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);

    const scaledBounds = new THREE.Box3().setFromObject(model);
    const center = scaledBounds.getCenter(new THREE.Vector3());

    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= scaledBounds.min.y;

    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return model;
  }, [characterFBX]);

  // Prepare animation clips and remove horizontal root motion
  const clips = useMemo(() => {
    const sources = [
      { name: "Idle", file: idleFBX },
      { name: "Walk", file: walkFBX },
      { name: "Run", file: runFBX },
      { name: "Jump", file: jumpFBX },
    ];

    return sources.flatMap(({ name, file }) => {
      const source = file.animations[0];

      if (!source) {
        console.warn(`Missing ${name} animation`);
        return [];
      }

      const clip = source.clone();
      clip.name = name;

      let removedRootMotion = false;

      clip.tracks.forEach((track) => {
        const isRootPosition =
          /.+\.position$/i.test(track.name) &&
          /root|hips|armature/i.test(track.name);

        if (!isRootPosition) return;

        const values = track.values;
        const valueSize = track.getValueSize();

        if (valueSize !== 3 || values.length < 3) return;

        const initialX = values[0];
        const initialZ = values[2];

        for (let i = 0; i < values.length; i += 3) {
          values[i] = initialX;
          values[i + 2] = initialZ;
        }

        removedRootMotion = true;
      });

      console.log(
        `${name}: horizontal root motion ${
          removedRootMotion ? "removed" : "not found"
        }`,
      );

      return [clip];
    });
  }, [idleFBX, walkFBX, runFBX, jumpFBX]);

  const { actions } = useAnimations(clips, root);

  // Start idle animation
  useEffect(() => {
    const idle = actions.Idle;

    if (!idle) return;

    idle.reset();
    idle.enabled = true;
    idle.setLoop(THREE.LoopRepeat, Infinity);
    idle.fadeIn(0.25).play();

    currentAnimation.current = "Idle";

    return () => {
      idle.stop();
    };
  }, [actions]);

  // Reusable vectors
  const forwardVector = useMemo(() => new THREE.Vector3(), []);
  const rightVector = useMemo(() => new THREE.Vector3(), []);
  const moveDirection = useMemo(() => new THREE.Vector3(), []);

  const cameraFollowPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraLookTarget = useMemo(() => new THREE.Vector3(), []);
  const desiredCameraPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);

  // Keyboard and mouse controls
  useEffect(() => {
    const canvas = gl.domElement;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          event.code,
        )
      ) {
        event.preventDefault();
      }

      if (event.code === "KeyV" && !event.repeat) {
        firstPerson.current = !firstPerson.current;
        return;
      }

      keys.current[event.code] = true;

      if (event.code === "Space" && !event.repeat) {
        jumpRequested.current = true;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };

    const onBlur = () => {
      keys.current = {};
      jumpRequested.current = false;
      dragging.current = false;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      dragging.current = true;
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging.current) return;

      cameraYaw.current -= event.movementX * 0.004;
      cameraPitch.current -= event.movementY * 0.003;

      cameraPitch.current = THREE.MathUtils.clamp(
        cameraPitch.current,
        -0.25,
        0.8,
      );
    };

    const onPointerUp = () => {
      dragging.current = false;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (firstPerson.current) return;

      cameraDistance.current = THREE.MathUtils.clamp(
        cameraDistance.current + event.deltaY * 0.005,
        4,
        14,
      );
    };

    const onContextMenu = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContextMenu);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);

      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, [gl]);

  // Smooth animation transitions
  const playAnimation = (name: AnimationName) => {
    if (currentAnimation.current === name) return;

    const nextAction = actions[name];

    if (!nextAction) return;

    const previousAction = currentAnimation.current
      ? actions[currentAnimation.current]
      : null;

    nextAction.reset();
    nextAction.enabled = true;
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);

    nextAction.setLoop(
      name === "Jump" ? THREE.LoopOnce : THREE.LoopRepeat,
      name === "Jump" ? 1 : Infinity,
    );

    nextAction.clampWhenFinished = name === "Jump";

    nextAction.fadeIn(0.2).play();
    previousAction?.fadeOut(0.2);

    currentAnimation.current = name;
  };

  // Main game loop
  useFrame((_, delta) => {
    const player = root.current;

    if (!player) return;

    const dt = Math.min(delta, 0.05);

    // Read movement input
    const forward =
      (keys.current["KeyW"] || keys.current["ArrowUp"] ? 1 : 0) -
      (keys.current["KeyS"] || keys.current["ArrowDown"] ? 1 : 0);

    const sideways =
      (keys.current["KeyD"] || keys.current["ArrowRight"] ? 1 : 0) -
      (keys.current["KeyA"] || keys.current["ArrowLeft"] ? 1 : 0);

    // Camera-relative movement directions
    forwardVector.set(
      Math.sin(cameraYaw.current),
      0,
      -Math.cos(cameraYaw.current),
    );

    rightVector.set(
      Math.cos(cameraYaw.current),
      0,
      Math.sin(cameraYaw.current),
    );

    moveDirection
      .set(0, 0, 0)
      .addScaledVector(forwardVector, forward)
      .addScaledVector(rightVector, sideways);

    const hasMovementInput = moveDirection.lengthSq() > 0;

    const running = keys.current["ShiftLeft"] || keys.current["ShiftRight"];

    let moving = false;

    // Collision-aware movement
    if (hasMovementInput) {
      moveDirection.normalize();

      const speed = running ? 5.5 : 3;

      const oldX = player.position.x;
      const oldZ = player.position.z;

      const stepX = moveDirection.x * speed * dt;
      const stepZ = moveDirection.z * speed * dt;

      // Test X independently
      const candidateX = oldX + stepX;

      if (!blocksHouseMovement(candidateX, oldZ)) {
        player.position.x = candidateX;
      }

      // Test Z independently
      const candidateZ = oldZ + stepZ;

      if (!blocksHouseMovement(player.position.x, candidateZ)) {
        player.position.z = candidateZ;
      }

      moving =
        Math.abs(player.position.x - oldX) +
          Math.abs(player.position.z - oldZ) >
        0.0001;

      if (moving) {
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);

        player.rotation.y = THREE.MathUtils.damp(
          player.rotation.y,
          targetRotation,
          12,
          dt,
        );
      }
    }

    // Update automatic door after movement.
    updateHouseDoorFromPlayer(player.position.x, player.position.z);

    // Terrain height and house floor
    const localHouseX = player.position.x - HOUSE01.x;
    const localHouseZ = player.position.z - HOUSE01.z;

    const insideHouse01 =
      Math.abs(player.position.x - HOUSE01.x) < 3.6 &&
      Math.abs(player.position.z - HOUSE01.z) < 3.6;

    const insideHouse02 =
      Math.abs(player.position.x - HOUSE02.x) < 3.6 &&
      Math.abs(player.position.z - HOUSE02.z) < 3.6;

    const houseFloor = insideHouse01 ? HOUSE01 : insideHouse02 ? HOUSE02 : null;

    const groundHeight = houseFloor
      ? getTerrainHeight(houseFloor.x, houseFloor.z)
      : getTerrainHeight(player.position.x, player.position.z);

    const grounded =
      player.position.y <= groundHeight + 0.03 && verticalVelocity.current <= 0;

    // Jump
    if (jumpRequested.current) {
      jumpRequested.current = false;

      if (!jumping.current && grounded) {
        player.position.y = groundHeight;
        verticalVelocity.current = 5.2;

        jumping.current = true;
        jumpAnimationFinished.current = false;
      }
    }

    // Apply vertical movement
    if (jumping.current) {
      player.position.y += verticalVelocity.current * dt;
      verticalVelocity.current -= 15 * dt;

      if (player.position.y <= groundHeight && verticalVelocity.current <= 0) {
        player.position.y = groundHeight;
        verticalVelocity.current = 0;
      }
    } else {
      player.position.y = groundHeight;
    }

    // Detect jump animation completion
    const jumpAction = actions.Jump;

    if (
      jumping.current &&
      jumpAction &&
      !jumpAction.isRunning() &&
      jumpAction.time >= jumpAction.getClip().duration - 0.02
    ) {
      jumpAnimationFinished.current = true;
    }

    // Finish jump when animation and landing are complete
    if (
      jumping.current &&
      jumpAnimationFinished.current &&
      player.position.y <= groundHeight + 0.03 &&
      verticalVelocity.current <= 0
    ) {
      jumping.current = false;
    }

    // Choose animation
    if (jumping.current) {
      playAnimation("Jump");
    } else if (moving) {
      playAnimation(running ? "Run" : "Walk");
    } else {
      playAnimation("Idle");
    }

    // Hide body in first-person view
    character.visible = !firstPerson.current;

    // Camera forward direction
    forwardVector.set(
      Math.sin(cameraYaw.current),
      0,
      -Math.cos(cameraYaw.current),
    );

    // Camera follows the player
    if (!cameraInitialized.current) {
      cameraFollowPosition.set(
        player.position.x,
        groundHeight,
        player.position.z,
      );

      cameraInitialized.current = true;
    }

    cameraFollowPosition.x = THREE.MathUtils.damp(
      cameraFollowPosition.x,
      player.position.x,
      4,
      dt,
    );

    cameraFollowPosition.y = THREE.MathUtils.damp(
      cameraFollowPosition.y,
      groundHeight,
      4,
      dt,
    );

    cameraFollowPosition.z = THREE.MathUtils.damp(
      cameraFollowPosition.z,
      player.position.z,
      4,
      dt,
    );

    if (firstPerson.current) {
      // First-person camera
      cameraLookTarget.set(
        player.position.x,
        player.position.y + 1.48,
        player.position.z,
      );

      camera.position.lerp(cameraLookTarget, 1 - Math.exp(-12 * dt));

      cameraDirection.set(
        Math.sin(cameraYaw.current) * Math.cos(cameraPitch.current),
        Math.sin(cameraPitch.current),
        -Math.cos(cameraYaw.current) * Math.cos(cameraPitch.current),
      );

      camera.lookAt(
        cameraLookTarget.clone().addScaledVector(cameraDirection, 10),
      );
    } else {
      // Third-person camera
      const distance = cameraDistance.current;
      const pitch = cameraPitch.current;

      const horizontalDistance = distance * Math.cos(pitch);
      const verticalDistance = distance * Math.sin(pitch);

      desiredCameraPosition.set(
        cameraFollowPosition.x - forwardVector.x * horizontalDistance,
        cameraFollowPosition.y + 2.2 + verticalDistance,
        cameraFollowPosition.z - forwardVector.z * horizontalDistance,
      );

      cameraLookTarget.set(
        cameraFollowPosition.x + forwardVector.x * 1.8,
        cameraFollowPosition.y + 1.15,
        cameraFollowPosition.z + forwardVector.z * 1.8,
      );

      camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-5 * dt));

      camera.lookAt(cameraLookTarget);
    }
  });

  return (
    <group ref={root}>
      <primitive object={character} />
    </group>
  );
}

// Preload assets
useFBX.preload("/models/character/character.fbx");
useFBX.preload("/models/character/animations/idle.fbx");
useFBX.preload("/models/character/animations/walk.fbx");
useFBX.preload("/models/character/animations/run.fbx");
useFBX.preload("/models/character/animations/jump.fbx");
