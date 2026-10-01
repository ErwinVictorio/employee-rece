import Stadium3D from './Stadium3D';
import CompanyGrounds3D from './CompanyGrounds3D';
import ImageGrounds3D from './ImageGrounds3D';

export default function RaceEnvironment({ location, ...props }) {
  if (location === 'company-image') return <ImageGrounds3D {...props} />;
  return location === 'company-grounds' ? <CompanyGrounds3D {...props} /> : <Stadium3D {...props} />;
}
