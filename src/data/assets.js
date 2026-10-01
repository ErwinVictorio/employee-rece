import red from '../assets/character/RedRunner.png';
import blue from '../assets/character/blue_runner.png';
import yellow from '../assets/character/yellowRunner.png';
export const characters = [{
  name: 'Red',
  image: red,
  color: '#fa5963'
}, {
  name: 'Blue',
  image: blue,
  color: '#55b9ff'
}, {
  name: 'Yellow',
  image: yellow,
  color: '#ffd157'
}, {
  name: 'Pink', image: red, color: '#ff408b', filter: 'hue-rotate(325deg)'
}, {
  name: 'Purple', image: red, color: '#9855ff', filter: 'hue-rotate(265deg)'
}, {
  name: 'Green', image: yellow, color: '#19d991', filter: 'hue-rotate(70deg)'
}];
export const defaultEmployees = ['Juan', 'Maria', 'Pedro', 'Anna', 'Carlos', 'Isabelle'].map((name, i) => ({
  id: `sample-${i}`,
  name,
  character: i % 6,
  avatar: ''
}));
