export const DEFAULT_COLOR_PRESETS = [
  {
    type: 'gradient',
    label: 'Default Gradients',
    defaultOpen: true,
    colors: [
      [
        { color: '#ff40ff', percent: 0 },
        { color: '#fec700', percent: 100 },
      ],
      [
        { color: '#f9a8d4', percent: 0 },
        { color: '#fed7aa', percent: 50 },
        { color: '#fca5a5', percent: 100 },
      ],
      [
        { color: '#86efac', percent: 0 },
        { color: '#fef08a', percent: 50 },
        { color: '#bbf7d0', percent: 100 },
      ],
      [
        { color: '#bbf7d0', percent: 0 },
        { color: '#bfdbfe', percent: 50 },
        { color: '#93c5fd', percent: 100 },
      ],
      [
        { color: '#c7d2fe', percent: 0 },
        { color: '#60a5fa', percent: 50 },
        { color: '#8b5cf6', percent: 100 },
      ],
      [
        { color: '#fca5a5', percent: 0 },
        { color: '#fdba74', percent: 50 },
        { color: '#fde68a', percent: 100 },
      ],
      [
        { color: '#f9a8d4', percent: 0 },
        { color: '#f472b6', percent: 50 },
        { color: '#f87171', percent: 100 },
      ],
      [
        { color: '#94a3b8', percent: 0 },
        { color: '#6b7280', percent: 50 },
        { color: '#374151', percent: 100 },
      ],
      [
        { color: '#fdba74', percent: 0 },
        { color: '#fb923c', percent: 50 },
        { color: '#f87171', percent: 100 },
      ],
      [
        { color: '#5eead4', percent: 0 },
        { color: '#22d3ee', percent: 100 },
      ],
      [
        { color: '#f87171', percent: 0 },
        { color: '#9333ea', percent: 100 },
      ],
      [
        { color: '#af6dff', percent: 0 },
        { color: '#ffebaa', percent: 100 },
      ],
    ],
  },
  {
    type: 'single',
    label: 'Default Colors',
    defaultOpen: true,
    colors: [
      '#ffffff',
      '#edebeb',
      useAppConfig().APP.color,
      '#F44336',
      '#1E88E5',
      '#FDD835',
      '#7a00cc',
      '#bfeb30',
      '#34302c',
      '#41199c',
      '#df21a5',
    ],
  },
];

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'google',
    title: 'Google',
    url: 'https://www.google.com',
    icon: 'icon:logos:google-icon',
    color: '#fff',
  },
  {
    id: 'gmail',
    title: 'Gmail',
    url: 'https://mail.google.com',
    icon: 'icon:logos:google-gmail',
    color: '#fff',
  },
  {
    id: 'youtube',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    icon: 'icon:simple-icons:youtube',
    color: '#ff0000',
    textColor: '#fff',
  },
  {
    id: 'facebook',
    title: 'Facebook',
    url: 'https://www.facebook.com',
    icon: 'icon:bxl:facebook',
    color: '#1877f2',
    textColor: '#fff',
  },
  {
    id: 'instagram',
    title: 'Instagram',
    url: 'https://www.instagram.com',
    icon: 'icon:simple-icons:instagram',
    color: `linear-gradient(45deg, #f58529, #dd2a7b, #8134af, #515bd4)`,
    textColor: '#fff',
  },
  {
    id: 'x',
    title: 'X (Twitter)',
    url: 'https://x.com',
    icon: 'icon:logos:x',
    color: '#fff',
  },
  {
    id: 'linkedin',
    title: 'LinkedIn',
    url: 'https://www.linkedin.com',
    icon: 'icon:bxl:linkedin',
    color: '#0a66c2',
    textColor: '#fff',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    url: 'https://web.whatsapp.com',
    icon: 'icon:logos:whatsapp-icon',
    color: '#45c654',
  },
  {
    id: 'github',
    title: 'GitHub',
    url: 'https://github.com',
    icon: 'icon:logos:github-icon',
    color: '#fff',
  },
  {
    id: 'chatgpt',
    title: 'ChatGPT',
    url: 'https://chat.openai.com',
    icon: 'icon:simple-icons:openai',
    color: '#fff',
    textColor: '#000',
  },
  {
    id: 'netflix',
    title: 'Netflix',
    url: 'https://www.netflix.com',
    icon: 'icon:simple-icons:netflix',
    color: '#000000',
    textColor: 'red',
  },
  {
    id: 'tiktok',
    title: 'Tiktok',
    url: 'https://www.tiktok.com',
    icon: 'icon:logos:tiktok-icon',
    color: '#000',
  },
];

export const DEFAULT_TRACKS = [
  { id: '1', name: 'Ariis Gozalo Phonk', path: '/audio/ariis-gozalo-phonk.mp3' },
  { id: '2', name: 'Phonk', path: '/audio/phonk.mp3' },
  { id: '3', name: 'Birds', path: '/audio/birds.mp3' },
  { id: '4', name: 'Campfire', path: '/audio/campfire.mp3' },
  { id: '5', name: 'Chimes', path: '/audio/chimes.mp3' },
  { id: '6', name: 'Night', path: '/audio/night.mp3' },
  { id: '7', name: 'Playground', path: '/audio/playground.mp3' },
  { id: '8', name: 'Rain', path: '/audio/rain.mp3' },
  { id: '9', name: 'River', path: '/audio/river.mp3' },
  { id: '10', name: 'Storm', path: '/audio/storm.mp3' },
  { id: '11', name: 'Swamp', path: '/audio/swamp.mp3' },
  { id: '12', name: 'Train', path: '/audio/train.mp3' },
  { id: '13', name: 'Vinyl', path: '/audio/vinyl.mp3' },
];

export const DEFAULT_WALLPAPERS: Wallpaper[] = [
  {
    id: 'default-1',
    name: 'Default 1',
    type: 'image',
    path: '/wallpapers/images/default-1.jpg',
    category: 'abstract',
  },
];

export const WALLPAPERS_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'nature', name: 'Nature' },
  { id: 'urban', name: 'Urban' },
  { id: 'abstract', name: 'Abstract' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'space', name: 'Space' },
  { id: 'anime', name: 'Anime' },
  { id: 'custom', name: 'Custom' },
];
