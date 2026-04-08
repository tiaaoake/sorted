import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import type {
  VisualDiffGuide,
  VisualDiffSection,
  VisualDiffSeverity,
} from "@/lib/types/comparison";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function severityForRatio(changedPixelRatio: number): VisualDiffSeverity {
  if (changedPixelRatio >= 0.12) return "high";
  if (changedPixelRatio >= 0.04) return "medium";
  return "low";
}

function sectionRanges(height: number, sectionCount: number): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (let i = 0; i < sectionCount; i += 1) {
    const startY = Math.floor((i / sectionCount) * height);
    const endY =
      i === sectionCount - 1
        ? height
        : Math.floor(((i + 1) / sectionCount) * height);
    ranges.push([startY, Math.max(startY + 1, endY)]);
  }
  return ranges;
}

function toGuide(
  width: number,
  height: number,
  diffMask: Uint8Array,
  sectionCount = 8,
): VisualDiffGuide {
  const ranges = sectionRanges(height, sectionCount);
  const sections: VisualDiffSection[] = ranges.map(([startY, endY], index) => {
    const span = endY - startY;
    let changed = 0;
    for (let y = startY; y < endY; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (diffMask[y * width + x] === 1) changed += 1;
      }
    }
    const total = width * span;
    const ratio = total > 0 ? changed / total : 0;
    return {
      sectionIndex: index,
      startYRatio: clamp01(startY / height),
      endYRatio: clamp01(endY / height),
      changedPixelRatio: ratio,
      severity: severityForRatio(ratio),
    };
  });

  return {
    mode: "fullPage",
    width,
    height,
    sectionCount,
    sections,
  };
}

function loadPng(buffer: Buffer): PNG {
  return PNG.sync.read(buffer);
}

function resizeNearest(
  src: PNG,
  targetWidth: number,
  targetHeight: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(targetWidth * targetHeight * 4);
  for (let y = 0; y < targetHeight; y += 1) {
    const srcY = Math.min(src.height - 1, Math.floor((y / targetHeight) * src.height));
    for (let x = 0; x < targetWidth; x += 1) {
      const srcX = Math.min(src.width - 1, Math.floor((x / targetWidth) * src.width));
      const srcIdx = (srcY * src.width + srcX) * 4;
      const outIdx = (y * targetWidth + x) * 4;
      out[outIdx] = src.data[srcIdx];
      out[outIdx + 1] = src.data[srcIdx + 1];
      out[outIdx + 2] = src.data[srcIdx + 2];
      out[outIdx + 3] = src.data[srcIdx + 3];
    }
  }
  return out;
}

export async function buildVisualDiffGuideFromBuffers(
  currentPng: Buffer,
  nextPng: Buffer,
): Promise<VisualDiffGuide | undefined> {
  try {
    const cur = loadPng(currentPng);
    const nxt = loadPng(nextPng);

    const width = Math.min(cur.width, nxt.width);
    const height = Math.min(cur.height, nxt.height);
    if (width < 8 || height < 8) return undefined;

    const curData = resizeNearest(cur, width, height);
    const nxtData = resizeNearest(nxt, width, height);
    const diff = new Uint8ClampedArray(width * height * 4);

    pixelmatch(curData, nxtData, diff, width, height, {
      threshold: 0.15,
      includeAA: false,
      alpha: 0.1,
    });

    const mask = new Uint8Array(width * height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        // pixelmatch paints changed regions in red tones.
        mask[y * width + x] = diff[idx] > 20 ? 1 : 0;
      }
    }

    const guide = toGuide(width, height, mask);
    return {
      ...guide,
      currentPngHeight: cur.height,
      newPngHeight: nxt.height,
    };
  } catch {
    return undefined;
  }
}
