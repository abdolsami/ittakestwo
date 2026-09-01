// palette + ear style for each pickable animal.
// the Pet component draws pixel art from these values.

export const ANIMALS = {
  cat: {
    emoji: '🐱', label: 'cat',
    body: '#f7c873', bodyDark: '#e0a94e', bodyShade: '#c98f38',
    belly: '#fff3d6', earIn: '#ffd7a0', cheek: '#ff8fc0', ear: 'pointy',
  },
  bunny: {
    emoji: '🐰', label: 'bunny',
    body: '#f2e9f7', bodyDark: '#dccbe8', bodyShade: '#c3aed6',
    belly: '#ffffff', earIn: '#ffc2e0', cheek: '#ff9ec9', ear: 'long',
  },
  bear: {
    emoji: '🐻', label: 'bear',
    body: '#c79a6b', bodyDark: '#a97c4e', bodyShade: '#8f6740',
    belly: '#f0dcc0', earIn: '#8f6740', cheek: '#ff8fb0', ear: 'round',
  },
  dog: {
    emoji: '🐶', label: 'dog',
    body: '#e6b98f', bodyDark: '#c9975f', bodyShade: '#ad7f4a',
    belly: '#fbeeda', earIn: '#b07c4a', cheek: '#ff9ab0', ear: 'floppy',
  },
  fox: {
    emoji: '🦊', label: 'fox',
    body: '#f28b46', bodyDark: '#d76e28', bodyShade: '#b85a1f',
    belly: '#fff0e0', earIn: '#2a1f3d', cheek: '#ff8f8f', ear: 'pointy',
  },
  panda: {
    emoji: '🐼', label: 'panda',
    body: '#f4f4f4', bodyDark: '#dcdcdc', bodyShade: '#c2c2c2',
    belly: '#ffffff', earIn: '#241a3d', cheek: '#ffb3c8', ear: 'round',
  },
  frog: {
    emoji: '🐸', label: 'frog',
    body: '#8fd66b', bodyDark: '#6bb84a', bodyShade: '#559c38',
    belly: '#e7ffcf', earIn: '#ffffff', cheek: '#ff9ab0', ear: 'bump',
  },
  penguin: {
    emoji: '🐧', label: 'penguin',
    body: '#4a5568', bodyDark: '#2d3748', bodyShade: '#1a202c',
    belly: '#ffffff', earIn: '#f6ad55', cheek: '#ff9ab0', ear: 'none',
  },
  mochi: {
    emoji: '🫧', label: 'mochi',
    body: '#8fe3d0', bodyDark: '#5fbfae', bodyShade: '#4aa596',
    belly: '#eafff9', earIn: '#ffc2e0', cheek: '#ff8fc0', ear: 'round',
  },
}

export const ANIMAL_KEYS = Object.keys(ANIMALS)

export const DEFAULT_SPECIES = 'mochi'

export function getAnimal(species) {
  return ANIMALS[species] || ANIMALS[DEFAULT_SPECIES]
}
