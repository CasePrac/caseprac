import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export interface VisualComparisonResult {
  passed: boolean;
  score: number;
  diffPixelRatio: number;
  diffPngBuffer?: Buffer;
}

export function compareScreenshots(
  actualBuffer: Buffer,
  referenceBuffer: Buffer,
  options?: { maxDiffPixelRatio?: number; threshold?: number }
): VisualComparisonResult {
  const maxDiffRatio = options?.maxDiffPixelRatio ?? 0.02; // default max 2% diff
  const threshold = options?.threshold ?? 0.2; // pixel mismatch sensitivity

  try {
    const actualPng = PNG.sync.read(actualBuffer);
    const referencePng = PNG.sync.read(referenceBuffer);

    // Ensure matching dimensions
    const width = Math.min(actualPng.width, referencePng.width);
    const height = Math.min(actualPng.height, referencePng.height);

    const diffPng = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      actualPng.data,
      referencePng.data,
      diffPng.data,
      width,
      height,
      { threshold }
    );

    const totalPixels = width * height;
    const diffPixelRatio = totalPixels > 0 ? numDiffPixels / totalPixels : 0;
    const passed = diffPixelRatio <= maxDiffRatio;

    // Convert pixel ratio to 0-100 score
    const score = Math.max(0, Math.min(100, Math.round((1 - diffPixelRatio) * 100)));
    const diffPngBuffer = PNG.sync.write(diffPng);

    return {
      passed,
      score,
      diffPixelRatio,
      diffPngBuffer,
    };
  } catch (err) {
    // If dimension mismatch or parse error
    return {
      passed: false,
      score: 0,
      diffPixelRatio: 1.0,
    };
  }
}
