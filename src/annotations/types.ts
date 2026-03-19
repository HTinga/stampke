
export interface BoxStyle {
  backgroundColor?: string;
  backgroundOpacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: number;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface FreeTextAnnotation {
  id: string;
  rect: [number, number, number, number];
  rotation?: number;
  content: string;
  textStyle?: TextStyle;
  boxStyle?: BoxStyle;
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Helvetica',
  fontSize: 12,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#000000',
  backgroundColor: 'transparent',
  textAlign: 'left',
  lineHeight: 1.2,
  letterSpacing: 0,
};

export const DEFAULT_BOX_STYLE: BoxStyle = {
  backgroundColor: 'transparent',
  backgroundOpacity: 1,
  borderColor: '#000000',
  borderWidth: 0,
  borderStyle: 'none',
  borderRadius: 0,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
};

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
}

export const AVAILABLE_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
];

export const FONT_SIZE_PRESETS = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96,
];
