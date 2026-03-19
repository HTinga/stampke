import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFButton, PDFSignature, StandardFonts, rgb } from 'pdf-lib';
import type { FormField, FormFieldType, FormFieldRect, FormFieldOption, FormData } from './types';

// ============================================================================
// JSON Format
// ============================================================================

export function exportToJSON(
  fields: FormField[],
  metadata?: { pdfFileName?: string }
): string {
  const data: FormData = {
    fields: {},
    metadata: {
      pdfFileName: metadata?.pdfFileName,
      exportDate: new Date().toISOString(),
      version: '1.0',
    },
  };

  const fieldsByName = new Map<string, string | boolean | string[]>();
  fields.forEach(field => {
    if (field.value !== '' && field.value !== false) {
      fieldsByName.set(field.name, field.value);
    }
  });

  fieldsByName.forEach((value, name) => {
    data.fields[name] = value;
  });

  return JSON.stringify(data, null, 2);
}

export function importFromJSON(jsonString: string): Map<string, string | boolean | string[]> {
  const data: FormData = JSON.parse(jsonString);
  const fieldValues = new Map<string, string | boolean | string[]>();

  Object.entries(data.fields).forEach(([name, value]) => {
    fieldValues.set(name, value);
  });

  return fieldValues;
}

// ============================================================================
// FDF Format (Forms Data Format)
// ============================================================================

export function exportToFDF(
  fields: FormField[],
  metadata?: { pdfFileName?: string }
): string {
  const lines: string[] = [];

  lines.push('%FDF-1.2');
  lines.push('1 0 obj');
  lines.push('<<');
  lines.push('/FDF');
  lines.push('<<');

  if (metadata?.pdfFileName) {
    lines.push(`/F (${escapeFDFString(metadata.pdfFileName)})`);
  }

  lines.push('/Fields [');

  const fieldsByName = new Map<string, string | boolean | string[]>();
  fields.forEach(field => {
    if (field.value !== '' && field.value !== false) {
      fieldsByName.set(field.name, field.value);
    }
  });

  fieldsByName.forEach((value, name) => {
    lines.push('<<');
    lines.push(`/T (${escapeFDFString(name)})`);

    if (typeof value === 'boolean') {
      lines.push(`/V /${value ? 'Yes' : 'Off'}`);
    } else if (Array.isArray(value)) {
      lines.push(`/V [${value.map(v => `(${escapeFDFString(v)})`).join(' ')}]`);
    } else {
      lines.push(`/V (${escapeFDFString(String(value))})`);
    }

    lines.push('>>');
  });

  lines.push(']');
  lines.push('>>');
  lines.push('>>');
  lines.push('endobj');
  lines.push('trailer');
  lines.push('<<');
  lines.push('/Root 1 0 R');
  lines.push('>>');
  lines.push('%%EOF');

  return lines.join('\n');
}

export function importFromFDF(fdfString: string): Map<string, string | boolean | string[]> {
  const fieldValues = new Map<string, string | boolean | string[]>();

  const fieldRegex = /\/T\s*\(([^)]+)\)\s*\/V\s*(?:\/(\w+)|\(([^)]*)\)|\[([^\]]*)\])/g;
  let match;

  while ((match = fieldRegex.exec(fdfString)) !== null) {
    const name = unescapeFDFString(match[1]);

    if (match[2]) {
      const nameValue = match[2];
      fieldValues.set(name, nameValue === 'Yes' || nameValue === 'On');
    } else if (match[3] !== undefined) {
      fieldValues.set(name, unescapeFDFString(match[3]));
    } else if (match[4]) {
      const arrayMatch = match[4].match(/\(([^)]*)\)/g);
      if (arrayMatch) {
        const values = arrayMatch.map(v => unescapeFDFString(v.slice(1, -1)));
        fieldValues.set(name, values);
      }
    }
  }

  return fieldValues;
}

function escapeFDFString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function unescapeFDFString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

// ============================================================================
// XFDF Format (XML Forms Data Format)
// ============================================================================

export function exportToXFDF(
  fields: FormField[],
  metadata?: { pdfFileName?: string }
): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">');

  if (metadata?.pdfFileName) {
    lines.push(`  <f href="${escapeXML(metadata.pdfFileName)}" />`);
  }

  lines.push('  <fields>');

  const fieldsByName = new Map<string, string | boolean | string[]>();
  fields.forEach(field => {
    if (field.value !== '' && field.value !== false) {
      fieldsByName.set(field.name, field.value);
    }
  });

  fieldsByName.forEach((value, name) => {
    lines.push(`    <field name="${escapeXML(name)}">`);

    if (typeof value === 'boolean') {
      lines.push(`      <value>${value ? 'Yes' : 'Off'}</value>`);
    } else if (Array.isArray(value)) {
      value.forEach(v => {
        lines.push(`      <value>${escapeXML(v)}</value>`);
      });
    } else {
      lines.push(`      <value>${escapeXML(String(value))}</value>`);
    }

    lines.push('    </field>');
  });

  lines.push('  </fields>');
  lines.push('</xfdf>');

  return lines.join('\n');
}

export function importFromXFDF(xfdfString: string): Map<string, string | boolean | string[]> {
  const fieldValues = new Map<string, string | boolean | string[]>();

  const parser = new DOMParser();
  const doc = parser.parseFromString(xfdfString, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XFDF format');
  }

  const fieldElements = doc.querySelectorAll('field');

  fieldElements.forEach(fieldEl => {
    const name = fieldEl.getAttribute('name');
    if (!name) return;

    const valueElements = fieldEl.querySelectorAll('value');
    if (valueElements.length === 0) return;

    if (valueElements.length === 1) {
      const value = valueElements[0].textContent || '';
      if (value === 'Yes' || value === 'On') {
        fieldValues.set(name, true);
      } else if (value === 'Off' || value === 'No') {
        fieldValues.set(name, false);
      } else {
        fieldValues.set(name, value);
      }
    } else {
      const values = Array.from(valueElements).map(el => el.textContent || '');
      fieldValues.set(name, values);
    }
  });

  return fieldValues;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================================
// Download utilities
// ============================================================================

export function downloadFormData(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// ============================================================================
// Form Extraction and Manipulation
// ============================================================================

export async function extractFormFields(pdfData: ArrayBuffer): Promise<FormField[]> {
  const pdfDoc = await PDFDocument.load(pdfData, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const fields: FormField[] = [];

  try {
    const pdfFields = form.getFields();

    for (const field of pdfFields) {
      const fieldName = field.getName();
      const widgets = field.acroField.getWidgets();

      for (let widgetIndex = 0; widgetIndex < widgets.length; widgetIndex++) {
        const widget = widgets[widgetIndex];
        const pageRef = widget.P();

        let pageNumber = 1;
        if (pageRef) {
          const pages = pdfDoc.getPages();
          for (let i = 0; i < pages.length; i++) {
            if (pages[i].ref === pageRef) {
              pageNumber = i + 1;
              break;
            }
          }
        }

        const rect = widget.getRectangle();
        const page = pdfDoc.getPage(pageNumber - 1);
        const pageHeight = page.getHeight();

        const fieldRect: FormFieldRect = {
          x: rect.x,
          y: pageHeight - rect.y - rect.height,
          width: rect.width,
          height: rect.height,
        };

        let fieldType: FormFieldType = 'text';
        let value: string | boolean | string[] = '';
        let options: FormFieldOption[] | undefined;
        let exportValue: string | undefined;
        let radioGroup: string | undefined;
        let multiline = false;
        let maxLength: number | undefined;

        if (field instanceof PDFTextField) {
          fieldType = 'text';
          value = field.getText() || '';
          multiline = field.isMultiline();
          maxLength = field.getMaxLength();
        } else if (field instanceof PDFCheckBox) {
          fieldType = 'checkbox';
          value = field.isChecked();
          const onValue = field.acroField.getOnValue();
          exportValue = onValue ? String(onValue).replace(/^\//, '') : 'Yes';
        } else if (field instanceof PDFDropdown) {
          fieldType = 'dropdown';
          const selected = field.getSelected();
          value = selected.length > 0 ? selected[0] : '';
          options = field.getOptions().map(opt => ({ label: opt, value: opt }));
        } else if (field instanceof PDFRadioGroup) {
          fieldType = 'radio';
          value = field.getSelected() || '';
          radioGroup = fieldName;
          options = field.getOptions().map(opt => ({ label: opt, value: opt }));
        } else if (field instanceof PDFButton) {
          fieldType = 'button';
          value = '';
        } else if (field instanceof PDFSignature) {
          fieldType = 'signature';
          value = '';
        }

        const acroField = field.acroField;
        const flags = acroField.getFlags();
        const isReadOnly = (flags & 1) !== 0;
        const isRequired = (flags & 2) !== 0;
        const isHidden = widget.hasFlag(1);

        const formField: FormField = {
          id: `${fieldName}-${widgetIndex}`,
          name: fieldName,
          type: fieldType,
          value,
          defaultValue: value,
          rect: fieldRect,
          pageNumber,
          required: isRequired,
          readOnly: isReadOnly,
          hidden: isHidden,
          options,
          exportValue,
          radioGroup,
          multiline,
          maxLength,
        };

        fields.push(formField);
      }
    }
  } catch (error) {
    console.error('Error extracting form fields:', error);
  }

  return fields;
}

export async function hasFormFields(pdfData: ArrayBuffer): Promise<boolean> {
  try {
    const pdfDoc = await PDFDocument.load(pdfData, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    return fields.length > 0;
  } catch {
    return false;
  }
}

export async function updateFormFieldValues(
  pdfData: ArrayBuffer,
  fieldValues: Map<string, string | boolean | string[]>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfData, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  for (const [fieldName, value] of fieldValues) {
    try {
      const field = form.getField(fieldName);

      if (field instanceof PDFTextField) {
        field.setText(String(value));
      } else if (field instanceof PDFCheckBox) {
        if (value === true || value === 'true' || value === 'Yes') {
          field.check();
        } else {
          field.uncheck();
        }
      } else if (field instanceof PDFDropdown) {
        if (typeof value === 'string') {
          field.select(value);
        } else if (Array.isArray(value) && value.length > 0) {
          field.select(value[0]);
        }
      } else if (field instanceof PDFRadioGroup) {
        if (typeof value === 'string' && value) {
          field.select(value);
        }
      }
    } catch (error) {
      console.warn(`Failed to update field "${fieldName}":`, error);
    }
  }

  return pdfDoc.save();
}

export function getFieldByName(fields: FormField[], name: string): FormField | undefined {
  return fields.find(f => f.name === name);
}

export function getFieldsOnPage(fields: FormField[], pageNumber: number): FormField[] {
  return fields.filter(f => f.pageNumber === pageNumber);
}

export function groupRadioButtons(fields: FormField[]): Map<string, FormField[]> {
  const groups = new Map<string, FormField[]>();

  fields
    .filter(f => f.type === 'radio' && f.radioGroup)
    .forEach(field => {
      const groupName = field.radioGroup!;
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(field);
    });

  return groups;
}

export async function flattenForm(pdfData: ArrayBuffer): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfData, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  try {
    form.flatten();
  } catch (error) {
    console.error('Error flattening form:', error);
    await manualFlatten(pdfDoc);
  }

  return pdfDoc.save();
}

async function manualFlatten(pdfDoc: PDFDocument): Promise<void> {
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const field of fields) {
    try {
      const widgets = field.acroField.getWidgets();

      for (const widget of widgets) {
        const rect = widget.getRectangle();
        const pageRef = widget.P();

        let page = pdfDoc.getPages()[0];
        if (pageRef) {
          const pages = pdfDoc.getPages();
          for (const p of pages) {
            if (p.ref === pageRef) {
              page = p;
              break;
            }
          }
        }

        let textValue = '';
        const fieldName = field.getName();

        try {
          if ('getText' in field) {
            textValue = (field as { getText: () => string | undefined }).getText() || '';
          } else if ('isChecked' in field) {
            textValue = (field as { isChecked: () => boolean }).isChecked() ? '✓' : '';
          } else if ('getSelected' in field) {
            const selected = (field as { getSelected: () => string[] | string }).getSelected();
            textValue = Array.isArray(selected) ? selected.join(', ') : (selected || '');
          }
        } catch {
          console.warn(`Could not get value for field: ${fieldName}`);
        }

        if (textValue) {
          const fontSize = Math.min(rect.height * 0.7, 12);

          page.drawText(textValue, {
            x: rect.x + 2,
            y: rect.y + (rect.height - fontSize) / 2,
            size: fontSize,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
        }

        if ('isChecked' in field && (field as { isChecked: () => boolean }).isChecked()) {
          const centerX = rect.x + rect.width / 2;
          const centerY = rect.y + rect.height / 2;
          const size = Math.min(rect.width, rect.height) * 0.6;

          page.drawText('✓', {
            x: centerX - size / 2,
            y: centerY - size / 2,
            size: size,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
        }
      }

      form.removeField(field);
    } catch (error) {
      console.warn(`Error processing field ${field.getName()}:`, error);
    }
  }
}

export async function isFlattened(pdfData: ArrayBuffer): Promise<boolean> {
  try {
    const pdfDoc = await PDFDocument.load(pdfData, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    return fields.length === 0;
  } catch {
    return true;
  }
}

export async function getFormFieldCount(pdfData: ArrayBuffer): Promise<number> {
  try {
    const pdfDoc = await PDFDocument.load(pdfData, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    return form.getFields().length;
  } catch {
    return 0;
  }
}
