import { useEffect, useState } from "react";
import { BlockType, BoxType, PointType } from "./types";

// load image as promise
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function makeZIndex() {
  return Math.round((Date.now() - 1729536285367) / 100);
}

export function pointIntersectsBlocks(
  { x, y }: PointType,
  blocks: BlockType[],
) {
  return blocks.filter((block) => {
    return pointIntersectsRotatedBlock({ x, y }, block);
  });
}

export function pointIntersectsBox({ x, y }: PointType, box: BoxType): boolean {
  return (
    x >= box.x &&
    x <= box.x + box.width &&
    y >= box.y &&
    y <= box.y + box.height
  );
}

export function pointIntersectsRotatedBlock(
  { x, y }: PointType,
  block: BlockType,
) {
  const cx = block.x + block.width / 2;
  const cy = block.y + block.height / 2;
  const angle = -(block.rotation || 0);

  // rotate point around center of block
  const rotatedPoint = rotateAroundCenter(x, y, cx, cy, angle);

  return (
    rotatedPoint[0] >= block.x &&
    rotatedPoint[0] <= block.x + block.width &&
    rotatedPoint[1] >= block.y &&
    rotatedPoint[1] <= block.y + block.height
  );
}

export function blockIntersectBlocks(
  { x, y, width, height }: BlockType,
  blocks: BlockType[],
): BlockType[] {
  return blocks.filter((block) => {
    return (
      x < block.x + block.width &&
      x + width > block.x &&
      y < block.y + block.height &&
      y + height > block.y
    );
  });
}

type Point = { x: number; y: number };

/** 1. Compute the 4 corners of a rotated rect */
function getCorners(b: BlockType): Point[] {
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const hw = b.width / 2;
  const hh = b.height / 2;
  const sin = Math.sin(b.rotation || 0);
  const cos = Math.cos(b.rotation || 0);

  // local-space corners around center
  const local: Point[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];

  // rotate & translate to world space
  return local.map((p) => ({
    x: cx + p.x * cos - p.y * sin,
    y: cy + p.x * sin + p.y * cos,
  }));
}

/** Normalize a vector */
function normalize(v: Point): Point {
  const len = Math.hypot(v.x, v.y);
  return { x: v.x / len, y: v.y / len };
}

/** Project a set of points onto an axis; return [min,max] */
function project(points: Point[], axis: Point): { min: number; max: number } {
  let min = Infinity,
    max = -Infinity;
  for (const p of points) {
    const proj = p.x * axis.x + p.y * axis.y;
    if (proj < min) min = proj;
    if (proj > max) max = proj;
  }
  return { min, max };
}

/** Test two rects for overlap using SAT */
function rectsOverlap(a: BlockType, b: BlockType): boolean {
  const ca = getCorners(a);
  const cb = getCorners(b);

  // build axes: normals of each edge (4 axes total)
  const axes: Point[] = [];
  for (let corners of [ca, cb] as Point[][]) {
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const edge = {
        x: corners[j].x - corners[i].x,
        y: corners[j].y - corners[i].y,
      };
      // normal = perpendicular
      axes.push(normalize({ x: -edge.y, y: edge.x }));
    }
  }

  // check overlap on every axis
  for (const axis of axes) {
    const pa = project(ca, axis);
    const pb = project(cb, axis);
    if (pa.max < pb.min || pb.max < pa.min) {
      // found a separating axis!
      return false;
    }
  }
  return true;
}

/** Your new blockOverlapsBlocks */
export function blockOverlapsBlocks(target: BlockType, blocks: BlockType[]) {
  return blocks.filter((other) => rectsOverlap(target, other));
}

export function rotateAroundCenter(
  x: number,
  y: number,
  cx: number,
  cy: number,
  angle: number,
) {
  return [
    (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle) + cx,
    (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle) + cy,
  ];
}

export function getRotatedExtents(block: BlockType) {
  const cx = block.x + block.width / 2;
  const cy = block.y + block.height / 2;
  const topLeft = rotateAroundCenter(
    block.x,
    block.y,
    cx,
    cy,
    block.rotation || 0,
  );
  const topRight = rotateAroundCenter(
    block.x + block.width,
    block.y,
    cx,
    cy,
    block.rotation || 0,
  );
  const bottomLeft = rotateAroundCenter(
    block.x,
    block.y + block.height,
    cx,
    cy,
    block.rotation || 0,
  );
  const bottomRight = rotateAroundCenter(
    block.x + block.width,
    block.y + block.height,
    cx,
    cy,
    block.rotation || 0,
  );
  const minX = Math.min(topLeft[0], topRight[0], bottomLeft[0], bottomRight[0]);
  const maxX = Math.max(topLeft[0], topRight[0], bottomLeft[0], bottomRight[0]);
  const minY = Math.min(topLeft[1], topRight[1], bottomLeft[1], bottomRight[1]);
  const maxY = Math.max(topLeft[1], topRight[1], bottomLeft[1], bottomRight[1]);
  const width = maxX - minX;
  const height = maxY - minY;
  return { minX, maxX, minY, maxY, width, height, blockId: block.id };
}
