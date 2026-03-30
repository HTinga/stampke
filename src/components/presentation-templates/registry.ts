// Presentation template registry for DocumentsHub

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  family: string;
  slides: number;
}

export const TEMPLATE_FAMILIES = [
  'neo-corporate',
  'neo-creative',
  'neo-minimal',
  'neo-academic',
  'neo-startup',
];

export const TEMPLATE_REGISTRY: TemplateInfo[] = [
  { id: 'corp-pitch', name: 'Corporate Pitch', description: 'Professional business pitch deck', family: 'neo-corporate', slides: 10 },
  { id: 'corp-quarterly', name: 'Quarterly Review', description: 'Financial & performance review', family: 'neo-corporate', slides: 12 },
  { id: 'corp-strategy', name: 'Strategy Brief', description: 'Strategic planning template', family: 'neo-corporate', slides: 8 },
  { id: 'creative-portfolio', name: 'Creative Portfolio', description: 'Showcase creative work', family: 'neo-creative', slides: 8 },
  { id: 'creative-brand', name: 'Brand Guidelines', description: 'Brand identity guide', family: 'neo-creative', slides: 10 },
  { id: 'creative-launch', name: 'Product Launch', description: 'New product announcement', family: 'neo-creative', slides: 9 },
  { id: 'minimal-report', name: 'Minimal Report', description: 'Clean data presentation', family: 'neo-minimal', slides: 6 },
  { id: 'minimal-proposal', name: 'Proposal', description: 'Simple project proposal', family: 'neo-minimal', slides: 7 },
  { id: 'academic-thesis', name: 'Thesis Defense', description: 'Academic research defense', family: 'neo-academic', slides: 15 },
  { id: 'academic-lecture', name: 'Lecture Slides', description: 'Course content delivery', family: 'neo-academic', slides: 12 },
  { id: 'startup-investor', name: 'Investor Deck', description: 'Fundraising pitch deck', family: 'neo-startup', slides: 10 },
  { id: 'startup-roadmap', name: 'Product Roadmap', description: 'Development timeline', family: 'neo-startup', slides: 8 },
];
