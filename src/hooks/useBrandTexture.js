import { useLoader } from '@react-three/fiber';
import { TextureLoader, SRGBColorSpace } from 'three';
import { branding } from '../data/branding';
class BrandTextureLoader extends TextureLoader {
  load(url, onLoad, onProgress, onError) {
    return super.load(url, texture => { texture.colorSpace = SRGBColorSpace; onLoad?.(texture); }, onProgress, onError);
  }
}
export function useBrandTexture(variant = 'logo') {
  return useLoader(BrandTextureLoader, branding[variant]);
}
