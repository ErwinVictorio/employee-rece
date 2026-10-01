import { useMemo } from 'react';
import { companyBuilding as design } from '../../data/locations';
import StaticBlocks from './StaticBlocks';
import CompanySign3D from './CompanySign3D';

export default function CompanyBuilding3D({ low = true, ...props }) {
  const blocks = useMemo(() => {
    const a = [];
    const add = (position, size, color = '#a99e8b', rotation = 0) => a.push({ position, size, color, rotation });
    const { width: w, depth: d, levelHeight: h, balconyDepth: b, roofOverhang: roof, entranceX: door } = design;
    add([0, h * 1.5, -d / 2], [w, h * 3, d]);
    for (let floor = 1; floor <= 3; floor++) {
      const y = floor * h;
      add([0, y, -d / 2 + b / 2], [w + b * 2, .55, d + b], '#8e8678');
      add([0, y + .35, b], [w + b * 2, .9, .28], '#a39a88');
      for (const x of [-w / 2 - b + .2, w / 2 + b - .2]) add([x, y + .35, -d / 2 + b / 2], [.3, .9, d + b]);
      if (floor >= 2) {
        add([0, y + 1.35, b], [w + b * 2, .09, .09], '#b79e72');
        for (let x = -w / 2 - b; x <= w / 2 + b; x += low ? 1.4 : .7) add([x, y + 1, b], [.055, .7, .055], '#4b504b');
        for (const x of [-w / 2 - b, w / 2 + b]) {
          add([x, y + 1.35, -d / 2 + b / 2], [.08, .08, d + b], '#b79e72');
          for (let z = -d; z < b; z += 1) add([x, y + 1, z], [.055, .7, .055], '#4b504b');
        }
      }
      for (const x of [-12, -6, 0, 6, 12]) {
        add([x, y - h / 2, b - .5], [.5, h, .65], '#b1a692');
        add([x, y - .62, b - .15], [.7, .9, 1], '#978e7e', -.22);
      }
    }
    add([0, h * 3 + 1.8, -d / 2 + .4], [w + roof * 2, .65, d + roof * 2], '#898476');
    add([0, h * 3 + 1.45, -d / 2], [w + roof, .15, d + roof], '#625f55');
    for (let floor = 0; floor < 3; floor++) for (let x = -11; x <= 11; x += 4.4) {
      const y = floor * h + 1.8;
      add([x, y, .06], [2.9, 2.25, .15], '#253d3b');
      for (let k = -1; k <= 1; k++) add([x + k * .85, y, .17], [.065, 2.3, .06], '#777b6a');
      for (const dy of [-.75, 0, .75]) add([x, y + dy, .17], [2.9, .065, .06], '#777b6a');
      if (floor === 1) { add([x, y - 1.3, .45], [1.15, .6, .65], '#d0ccba'); add([x, y - 1.3, .79], [.65, .4, .04], '#6f756e'); }
    }
    add([door, 1.5, .3], [3.5, 3, .35], '#333c35');
    add([door, 1.55, .51], [3.05, 2.6, .06], '#47706d');
    add([door, 1.5, .57], [.1, 3, .07], '#262e2a');
    add([door, 3.05, 1], [4.4, .2, 2], '#415d50');
    for (let i = 0; i < 3; i++) add([door, .08 + i * .1, 1.4 - i * .35], [4.5, .16 + i * .2, 1.6], '#c0b9a8');
    return a;
  }, [low]);
  return <group {...props}><StaticBlocks blocks={blocks} name="company-building" castShadow receiveShadow /><CompanySign3D position={[design.entranceX, 3.3, design.balconyDepth + .18]} /></group>;
}
