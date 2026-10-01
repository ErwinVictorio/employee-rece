import Stadium3D from './Stadium3D';
import CompanyGrounds3D from './CompanyGrounds3D';

export default function RaceEnvironment({ location, ...props }) {
  return location === 'company-grounds' ? <CompanyGrounds3D {...props} /> : <Stadium3D {...props} />;
}
