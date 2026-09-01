/* eslint-disable no-underscore-dangle */
import { useEffect, useState } from 'react';
import { LAppLive2DManager } from '../../../WebSDK/src/lapplive2dmanager';
import { HitAreaNameHead } from '../../../WebSDK/src/lappdefine';

export interface Live2DScreenAnchor {
  x: number;
  y: number;
  bottom: number;
  left: number;
  right: number;
  ready: boolean;
}

const SAMPLE_INTERVAL_MS = 80;
const POSITION_EPSILON_PX = 0.75;

export function useLive2DScreenAnchor(): Live2DScreenAnchor {
  const [anchor, setAnchor] = useState<Live2DScreenAnchor>(() => ({
    x: window.innerWidth / 2,
    y: Math.max(120, window.innerHeight * 0.22),
    bottom: window.innerHeight * 0.78,
    left: window.innerWidth * 0.35,
    right: window.innerWidth * 0.65,
    ready: false,
  }));

  useEffect(() => {
    const updateAnchor = () => {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
      const model = LAppLive2DManager.getExistingInstance()?.getModel(0);
      const cubismModel = model?.getModel();
      const renderer = model?.getRenderer();
      if (!canvas || !cubismModel || !renderer) return;

      const matrix = renderer.getMvpMatrix();
      const drawableCount = cubismModel.getDrawableCount();
      const headArea = Array.from(
        { length: model._modelSetting.getHitAreasCount() },
        (_, index) => index,
      ).find((index) => model._modelSetting.getHitAreaName(index) === HitAreaNameHead);
      const headDrawable = headArea === undefined
        ? -1
        : cubismModel.getDrawableIndex(model._modelSetting.getHitAreaId(headArea));
      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      let headMinX = Number.POSITIVE_INFINITY;
      let headMaxX = Number.NEGATIVE_INFINITY;

      for (let drawable = 0; drawable < drawableCount; drawable += 1) {
        if (cubismModel.getDrawableOpacity(drawable) > 0.01) {
          const vertices = cubismModel.getDrawableVertices(drawable);
          for (let vertex = 0; vertex < vertices.length; vertex += 2) {
            const x = matrix.transformX(vertices[vertex]);
            const y = matrix.transformY(vertices[vertex + 1]);
            if (Number.isFinite(x) && Number.isFinite(y)) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
              if (drawable === headDrawable) {
                headMinX = Math.min(headMinX, x);
                headMaxX = Math.max(headMaxX, x);
              }
            }
          }
        }
      }

      if (!Number.isFinite(minX)
        || !Number.isFinite(maxX)
        || !Number.isFinite(minY)
        || !Number.isFinite(maxY)) return;
      const rect = canvas.getBoundingClientRect();
      const centerX = Number.isFinite(headMinX) && Number.isFinite(headMaxX)
        ? (headMinX + headMaxX) / 2
        : (minX + maxX) / 2;
      const next = {
        // Cubism's MVP output is normalized to -1...1 before viewport mapping.
        x: rect.left + ((centerX + 1) / 2) * rect.width,
        y: rect.top + ((1 - maxY) / 2) * rect.height,
        bottom: rect.top + ((1 - minY) / 2) * rect.height,
        left: rect.left + ((minX + 1) / 2) * rect.width,
        right: rect.left + ((maxX + 1) / 2) * rect.width,
        ready: true,
      };

      setAnchor((previous) => (
        previous.ready === next.ready
        && Math.abs(previous.x - next.x) < POSITION_EPSILON_PX
        && Math.abs(previous.y - next.y) < POSITION_EPSILON_PX
        && Math.abs(previous.bottom - next.bottom) < POSITION_EPSILON_PX
        && Math.abs(previous.left - next.left) < POSITION_EPSILON_PX
        && Math.abs(previous.right - next.right) < POSITION_EPSILON_PX
          ? previous
          : next
      ));
    };

    updateAnchor();
    const interval = window.setInterval(updateAnchor, SAMPLE_INTERVAL_MS);
    window.addEventListener('resize', updateAnchor);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', updateAnchor);
    };
  }, []);

  return anchor;
}
