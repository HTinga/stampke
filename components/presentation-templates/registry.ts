// Template registry - maps layoutId to component and metadata
// Lazily loaded to avoid bundling all 121 templates at once

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  family: string;
  loader: () => Promise<{ default: React.ComponentType<{ data?: any }> }>;
}

import type React from 'react';

export const TEMPLATE_FAMILIES = [
  'general', 'neo-general', 'modern', 'neo-modern', 'standard', 'neo-standard', 'swift', 'neo-swift'
];

// Static metadata for all templates (no dynamic imports at module level)
export const TEMPLATE_REGISTRY: TemplateInfo[] = [
  // General
  { id: 'general-intro', name: 'Intro Slide', description: 'Title, description, presenter info and image', family: 'general', loader: () => import('./general/IntroSlideLayout') },
  { id: 'general-basic-info', name: 'Basic Info', description: 'Clean two-column info layout', family: 'general', loader: () => import('./general/BasicInfoSlideLayout') },
  { id: 'general-bullets-icons', name: 'Bullet Icons', description: 'Icon-based bullet points', family: 'general', loader: () => import('./general/BulletIconsOnlySlideLayout') },
  { id: 'general-bullets-with-icons', name: 'Bullets with Icons', description: 'Bullets paired with icons', family: 'general', loader: () => import('./general/BulletWithIconsSlideLayout') },
  { id: 'general-chart-bullets', name: 'Chart + Bullets', description: 'Chart with bullet points', family: 'general', loader: () => import('./general/ChartWithBulletsSlideLayout') },
  { id: 'general-metrics', name: 'Metrics', description: 'Key business metrics display', family: 'general', loader: () => import('./general/MetricsSlideLayout') },
  { id: 'general-metrics-image', name: 'Metrics + Image', description: 'Metrics with supporting image', family: 'general', loader: () => import('./general/MetricsWithImageSlideLayout') },
  { id: 'general-numbered-bullets', name: 'Numbered Bullets', description: 'Ordered list layout', family: 'general', loader: () => import('./general/NumberedBulletsSlideLayout') },
  { id: 'general-quote', name: 'Quote', description: 'Inspirational quote with background image', family: 'general', loader: () => import('./general/QuoteSlideLayout') },
  { id: 'general-table', name: 'Table Info', description: 'Structured table layout', family: 'general', loader: () => import('./general/TableInfoSlideLayout') },
  { id: 'general-toc', name: 'Table of Contents', description: 'Slide index layout', family: 'general', loader: () => import('./general/TableOfContentsSlideLayout') },
  { id: 'general-team', name: 'Team', description: 'Team member showcase', family: 'general', loader: () => import('./general/TeamSlideLayout') },
  // Neo-general
  { id: 'neo-headline-stats', name: 'Headline + Stats', description: 'Bold headline with side metrics', family: 'neo-general', loader: () => import('./neo-general/HeadlineTextWithBulletsAndStats') },
  { id: 'neo-headline-image', name: 'Headline + Image', description: 'Headline with description and image', family: 'neo-general', loader: () => import('./neo-general/HeadlineDescriptionWithImage') },
  { id: 'neo-double-image', name: 'Double Image', description: 'Two images with description', family: 'neo-general', loader: () => import('./neo-general/HeadlineDescriptionWithDoubleImage') },
  { id: 'neo-three-column', name: 'Three Column List', description: 'Indexed three-column layout', family: 'neo-general', loader: () => import('./neo-general/IndexedThreeColumnList') },
  { id: 'neo-metric-cards', name: 'Metric Cards', description: 'Text block with metric cards', family: 'neo-general', loader: () => import('./neo-general/LayoutTextBlockWithMetricCards') },
  { id: 'neo-left-quote', name: 'Left Align Quote', description: 'Left-aligned quote design', family: 'neo-general', loader: () => import('./neo-general/LeftAlignQuote') },
  { id: 'neo-table', name: 'Table Layout', description: 'Title description with table', family: 'neo-general', loader: () => import('./neo-general/TitleDescriptionWithTable') },
  { id: 'neo-challenge-outcome', name: 'Challenge & Outcome', description: 'Problem/solution with stat', family: 'neo-general', loader: () => import('./neo-general/ChallengeAndOutcomeWithOneStat') },
  { id: 'neo-eight-metrics', name: 'Eight Metrics Grid', description: 'Grid of 8 metric snapshots', family: 'neo-general', loader: () => import('./neo-general/GridBasedEightMetricsSnapshots') },
  { id: 'neo-team-four', name: 'Four Team Members', description: 'Four team member grid', family: 'neo-general', loader: () => import('./neo-general/TitleTopDescriptionFourTeamMembersGrid') },
  { id: 'neo-risk', name: 'Risk Constraints', description: 'Three column risk layout', family: 'neo-general', loader: () => import('./neo-general/TitleThreeColumnRiskConstraints') },
  { id: 'neo-thank-you', name: 'Thank You', description: 'Thank you with contact info', family: 'neo-general', loader: () => import('./neo-general/ThankYouContactInfoFooterImageSlide') },
  { id: 'neo-timeline', name: 'Timeline', description: 'Visual timeline layout', family: 'neo-general', loader: () => import('./neo-general/Timeline') },
  { id: 'neo-full-chart', name: 'Full Width Chart', description: 'Title with full width chart', family: 'neo-general', loader: () => import('./neo-general/TitleWithFullWidthChart') },
  { id: 'neo-metrics-chart', name: 'Metrics + Chart', description: 'Metrics with chart', family: 'neo-general', loader: () => import('./neo-general/TitleMetricsWithChart') },
  { id: 'neo-grid-heading', name: 'Grid Heading', description: 'Grid based heading and description', family: 'neo-general', loader: () => import('./neo-general/TitleWithGridBasedHeadingAndDescription') },
  { id: 'neo-emphasis-block', name: 'Emphasis Block', description: 'Text split with emphasis', family: 'neo-general', loader: () => import('./neo-general/TextSplitWithEmphasisBlock') },
  // Modern
  { id: 'modern-intro', name: 'Modern Intro', description: 'Modern style intro slide', family: 'modern', loader: () => import('./modern/IntroSlideLayout') },
  { id: 'modern-bullets-icons', name: 'Modern Bullets', description: 'Modern icon bullets', family: 'modern', loader: () => import('./modern/BulletWithIconsSlideLayout') },
  // Standard
  { id: 'standard-intro', name: 'Standard Intro', description: 'Standard intro layout', family: 'standard', loader: () => import('./standard/IntroSlideLayout') },
];
