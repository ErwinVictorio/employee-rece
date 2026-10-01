import { characters } from '../data/assets';

// Original vector portraits keep tiny race labels readable; uploaded photos win.
export function RacerPortrait({ employee }) {
  const color = characters[employee.character].color;
  const ponytail = [1, 3, 5].includes(employee.character);
  return <span className="racer-portrait" style={{ '--team-color': color }}>
    {employee.avatar ? <img src={employee.avatar} alt="" /> : <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="#15223b" />
      {ponytail && <ellipse cx="35" cy="28" rx="8" ry="14" fill="#382619" />}
      <path d="M8 48v-7c0-11 32-11 32 0v7" fill={color} />
      <rect x="20" y="30" width="8" height="10" rx="4" fill="#e3a073" />
      <ellipse cx="24" cy="21" rx="14" ry="16" fill="#352419" />
      <ellipse cx="24" cy="24" rx="11" ry="13" fill="#f3ba8a" />
      <path d="M13 21c1-14 23-15 24 1-7-1-12-7-13-10-2 6-6 9-11 9" fill="#352419" />
      <ellipse cx="20" cy="24" rx="1.8" ry="2.4" fill="#152039" /><ellipse cx="29" cy="24" rx="1.8" ry="2.4" fill="#152039" />
      <path d="M21 30q4 4 8-1" fill="none" stroke="#9f4c36" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 39l7 5 8-5" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>}
  </span>;
}
