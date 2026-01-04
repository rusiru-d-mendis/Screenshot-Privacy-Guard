
export interface Point {
  x: number;
  y: number;
}

export interface RectangleRegion {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EllipseRegion {
  type: 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FreehandRegion {
  type: 'path';
  points: Point[];
}

export type DrawingRegion = RectangleRegion | EllipseRegion | FreehandRegion;
