'use client';

import type { GeneratedQuickDocument, GeneratedQuotation } from './job-generation';
import { applyWordQuotationTemplate } from './word-template-application.ts';

export type QuotationExportOptions = {
  fontFamily: string;
  headingColor: string;
  bodyColor: string;
  templateFile?: Blob | null;
};

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export function quotationExportProblems(document: GeneratedQuickDocument) {
  const problems: string[] = [];
  const quotation = document.quotation;
  if (!quotation) return ['The generated response does not contain structured quotation data.'];
  if (!clean(document.title) || /^(?:business|commercial)?\s*quotation$/i.test(clean(document.title)))
    problems.push('The quotation needs a specific client- or scope-facing title.');
  if (!clean(quotation.quotationNumber)) problems.push('The quotation reference is missing.');
  if (!clean(quotation.issueDate)) problems.push('The issue date is missing.');
  if (!clean(quotation.preparedFor)) problems.push('The client name is missing.');
  if (!clean(quotation.preparedBy) || /^(?:abc|tbc|tbd|n\/?a|to be confirmed)$/i.test(clean(quotation.preparedBy)))
    problems.push('Replace the supplier placeholder with the legal or trading name.');
  if (!quotation.items?.length) problems.push('The quotation has no priced line items.');
  for (const [index, item] of (quotation.items || []).entries()) {
    const description = clean(item.description);
    if (!description) problems.push(`Line item ${index + 1} has no description.`);
    if (/\b(?:reg|quotation for)\s*$/i.test(description) || /(?:^|\s)[–—-]\s*\d+\s*$/i.test(description))
      problems.push(`Line item ${index + 1} appears truncated.`);
    if (!clean(item.amount) && !clean(item.unitPrice)) problems.push(`Line item ${index + 1} has no price.`);
  }
  if (!clean(quotation.currency) || /^not specified$/i.test(clean(quotation.currency)))
    problems.push('The quotation currency is missing.');
  if (!clean(quotation.total)) problems.push('The quotation total is missing.');
  return [...new Set(problems)];
}

export function assertQuotationExportReady(document: GeneratedQuickDocument): GeneratedQuotation {
  const problems = quotationExportProblems(document);
  if (problems.length)
    throw new Error(`The quotation did not pass the export quality check: ${problems.join(' ')}`);
  return document.quotation!;
}

export async function buildQuotationDocx(
  document: GeneratedQuickDocument,
  options: QuotationExportOptions,
) {
  const quotation = assertQuotationExportReady(document);
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    PageNumber,
    Packer,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import('docx');

  const font = clean(options.fontFamily) || 'Arial';
  const heading = clean(options.headingColor).replace('#', '') || '173F4F';
  const body = clean(options.bodyColor).replace('#', '') || '202020';
  const border = 'D9D9D9';
  const pale = 'F4F7F8';
  const shown = (value: string, fallback = 'Not specified in the supplied brief.') => clean(value) || fallback;
  const textRun = (value: string, config: { bold?: boolean; color?: string; size?: number } = {}) =>
    new TextRun({ text: value, font, color: config.color || body, bold: config.bold, size: config.size });
  const paragraph = (
    value: string,
    config: { bold?: boolean; color?: string; size?: number; before?: number; after?: number; pageBreakBefore?: boolean; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {},
  ) =>
    new Paragraph({
      alignment: config.alignment,
      pageBreakBefore: config.pageBreakBefore,
      spacing: { before: config.before || 0, after: config.after ?? 120, line: 276 },
      children: [textRun(value, config)],
    });
  const cell = (
    value: string,
    config: { bold?: boolean; shade?: string; color?: string; width?: number; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {},
  ) =>
    new TableCell({
      width: config.width ? { size: config.width, type: WidthType.PERCENTAGE } : undefined,
      shading: config.shade ? { type: ShadingType.CLEAR, fill: config.shade } : undefined,
      margins: { top: 120, bottom: 120, left: 140, right: 140 },
      verticalAlign: 'center',
      children: [
        new Paragraph({
          alignment: config.alignment,
          spacing: { after: 0, line: 250 },
          children: [textRun(shown(value, '—'), { bold: config.bold, color: config.color })],
        }),
      ],
    });
  const borders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: border },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: border },
    left: { style: BorderStyle.SINGLE, size: 1, color: border },
    right: { style: BorderStyle.SINGLE, size: 1, color: border },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: border },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: border },
  };

  const metaRows = [
    ['Quotation reference', quotation.quotationNumber, 'Issue date', quotation.issueDate],
    ['Prepared for', quotation.preparedFor, 'Prepared by', quotation.preparedBy],
    ['Client contact', quotation.clientContact, 'Supplier contact', quotation.supplierContact],
    ['Validity', quotation.validity, 'Currency', quotation.currency],
  ].map(
    (row) =>
      new TableRow({
        cantSplit: true,
        children: row.map((value, index) =>
          cell(value, {
            bold: index % 2 === 0,
            shade: index % 2 === 0 ? pale : undefined,
            color: index % 2 === 0 ? heading : body,
            width: index % 2 === 0 ? 18 : 32,
          }),
        ),
      }),
  );
  const pricingRows = [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        cell('Description', { bold: true, shade: heading, color: 'FFFFFF', width: 52 }),
        cell('Qty', { bold: true, shade: heading, color: 'FFFFFF', width: 10, alignment: AlignmentType.CENTER }),
        cell('Unit price', { bold: true, shade: heading, color: 'FFFFFF', width: 18, alignment: AlignmentType.RIGHT }),
        cell('Amount', { bold: true, shade: heading, color: 'FFFFFF', width: 20, alignment: AlignmentType.RIGHT }),
      ],
    }),
    ...quotation.items.map(
      (item, index) =>
        new TableRow({
          cantSplit: true,
          children: [
            cell(item.description, { shade: index % 2 ? pale : undefined, width: 52 }),
            cell(item.quantity, { shade: index % 2 ? pale : undefined, width: 10, alignment: AlignmentType.CENTER }),
            cell(item.unitPrice, { shade: index % 2 ? pale : undefined, width: 18, alignment: AlignmentType.RIGHT }),
            cell(item.amount, { bold: true, shade: index % 2 ? pale : undefined, width: 20, alignment: AlignmentType.RIGHT }),
          ],
        }),
    ),
  ];
  const totalsRows = [
    ['Subtotal', quotation.subtotal],
    [quotation.taxLabel || 'Tax', quotation.taxAmount],
    ['Total', quotation.total],
  ]
    .filter(([, value]) => clean(value))
    .map(
      ([label, value], index, rows) =>
        new TableRow({
          cantSplit: true,
          children: [
            cell(label, { bold: index === rows.length - 1, shade: index === rows.length - 1 ? pale : undefined, width: 80, alignment: AlignmentType.RIGHT }),
            cell(value, { bold: true, shade: index === rows.length - 1 ? pale : undefined, width: 20, alignment: AlignmentType.RIGHT }),
          ],
        }),
    );
  const termsRows = [
    ['Payment terms', quotation.paymentTerms],
    ['Payment details', quotation.paymentDetails],
    ['Delivery and scope', quotation.deliveryTerms],
    ['Exclusions and assumptions', quotation.exclusions],
    ['Acceptance', quotation.acceptanceInstructions],
  ].map(
    ([label, value]) =>
      new TableRow({
        cantSplit: true,
        children: [
          cell(label, { bold: true, shade: pale, color: heading, width: 24 }),
          cell(shown(value), { width: 76 }),
        ],
      }),
  );

  const children = [
    paragraph(document.title, { bold: true, color: heading, size: 34, after: 100 }),
    paragraph(`Quotation reference ${quotation.quotationNumber}`, { color: heading, size: 18, after: 260 }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: metaRows, borders }),
    paragraph(clean(document.body), { before: 240, after: 220 }),
    paragraph('Scope and pricing', { bold: true, color: heading, size: 24, before: 120, after: 120 }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: pricingRows, borders }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: totalsRows, borders }),
    paragraph('Commercial terms', { bold: true, color: heading, size: 24, before: 0, after: 120, pageBreakBefore: true }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: termsRows, borders }),
    paragraph('Client acceptance', { bold: true, color: heading, size: 24, before: 300, after: 180 }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            cell('Authorized signature\n\n________________________________', { width: 50 }),
            cell('Name and date\n\n________________________________', { width: 50 }),
          ],
        }),
      ],
    }),
  ];
  const file = new Document({
    styles: {
      default: {
        document: { run: { font, color: body, size: 21 }, paragraph: { spacing: { line: 276 } } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 567, footer: 567 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [textRun('Page ', { color: '777777', size: 16 }), new TextRun({ children: [PageNumber.CURRENT], font, color: '777777', size: 16 })],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  const generated = await Packer.toBlob(file);
  return options.templateFile
    ? applyWordQuotationTemplate(options.templateFile, generated)
    : generated;
}
