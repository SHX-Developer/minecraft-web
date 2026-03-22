import * as THREE from "three";
import {
  DAY_DURATION_SECONDS,
  FOG_FAR,
  FOG_NEAR,
  NIGHT_DURATION_SECONDS,
  SKY_COLOR,
} from "../utils/constants.js";
import { clamp } from "../utils/helpers.js";

const DAY_SKY = new THREE.Color(SKY_COLOR);
const SUNSET_SKY = new THREE.Color(0xff9b66);
const NIGHT_SKY = new THREE.Color(0x0f1835);

const DAY_FOG = new THREE.Color(0x9ed0ff);
const SUNSET_FOG = new THREE.Color(0xcd7d56);
const NIGHT_FOG = new THREE.Color(0x1a2948);

export class DayNightCycle {
  constructor(scene) {
    this.scene = scene;
    this.cycleDuration = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;
    this.time = 0;
    this.orbitRadius = 130;
    this.orbitTilt = 0.25;

    this.sunLight = new THREE.DirectionalLight(0xfff0d8, 1.0);
    this.moonLight = new THREE.DirectionalLight(0xa8c0ff, 0.0);
    this.ambientLight = new THREE.HemisphereLight(0xbddcff, 0x4b5a46, 0.72);
    this.lightTarget = new THREE.Object3D();
    this.scene.add(this.ambientLight, this.sunLight, this.moonLight, this.lightTarget);

    this.sunLight.target = this.lightTarget;
    this.moonLight.target = this.lightTarget;

    this.sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 18, 18),
      new THREE.MeshBasicMaterial({ color: 0xffdc86 })
    );
    this.moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 18, 18),
      new THREE.MeshBasicMaterial({ color: 0xe5ecff })
    );
    this.scene.add(this.sunMesh, this.moonMesh);

    this.currentSkyColor = DAY_SKY.clone();
    this.currentFogColor = DAY_FOG.clone();
    this.currentFogNear = FOG_NEAR;
    this.currentFogFar = FOG_FAR;
    this.sunFactor = 1;
    this.moonFactor = 0;

    this.sunPos = new THREE.Vector3();
    this.moonPos = new THREE.Vector3();
  }

  update(delta, centerPosition) {
    this.time = (this.time + delta) % this.cycleDuration;
    const phase = this.time / this.cycleDuration;
    const angle = phase * Math.PI * 2;
    const sunElevation = Math.sin(angle);
    const azimuth = Math.cos(angle);

    this.sunPos.set(
      centerPosition.x + azimuth * this.orbitRadius,
      centerPosition.y + sunElevation * this.orbitRadius,
      centerPosition.z + Math.sin(angle + this.orbitTilt) * this.orbitRadius
    );
    this.moonPos.copy(centerPosition).sub(this.sunPos).add(centerPosition);

    this.sunMesh.position.copy(this.sunPos);
    this.moonMesh.position.copy(this.moonPos);
    this.sunLight.position.copy(this.sunPos);
    this.moonLight.position.copy(this.moonPos);
    this.lightTarget.position.copy(centerPosition);

    this.sunFactor = clamp(sunElevation * 1.15 + 0.05, 0, 1);
    this.moonFactor = clamp(-sunElevation * 0.5, 0, 0.5);

    this.sunLight.intensity = this.sunFactor * 1.15;
    this.moonLight.intensity = this.moonFactor;
    this.ambientLight.intensity = 0.18 + this.sunFactor * 0.62;

    const twilight = clamp(1 - Math.abs(sunElevation) * 3.2, 0, 1);
    this.currentSkyColor.copy(NIGHT_SKY).lerp(DAY_SKY, this.sunFactor);
    this.currentFogColor.copy(NIGHT_FOG).lerp(DAY_FOG, this.sunFactor);

    if (twilight > 0) {
      const twilightBoost = twilight * 0.5;
      this.currentSkyColor.lerp(SUNSET_SKY, twilightBoost);
      this.currentFogColor.lerp(SUNSET_FOG, twilightBoost);
    }

    this.currentFogNear = 20 + this.sunFactor * (FOG_NEAR - 20);
    this.currentFogFar = 95 + this.sunFactor * (FOG_FAR - 95);

    this.scene.background.copy(this.currentSkyColor);
    if (this.scene.fog) {
      this.scene.fog.color.copy(this.currentFogColor);
      this.scene.fog.near = this.currentFogNear;
      this.scene.fog.far = this.currentFogFar;
    }
  }
}
