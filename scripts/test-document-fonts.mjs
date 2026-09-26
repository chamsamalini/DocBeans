import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page=readFileSync(new URL('../app/create/page.tsx',import.meta.url),'utf8');
const expected=[
  ['source-sans','Source Sans 3 · Clean'],
  ['playfair','Playfair Display · Elegant'],
  ['montserrat','Montserrat · Modern'],
  ['georgia','Georgia · Classic'],
  ['times','Times New Roman · Traditional'],
  ['aptos','Aptos · Contemporary business'],
  ['calibri','Calibri · Familiar business'],
  ['arial','Arial · Universal'],
  ['cambria','Cambria · Formal report'],
  ['garamond','Garamond · Refined'],
  ['verdana','Verdana · Highly readable'],
];
for(const [value,label] of expected){
  assert.ok(page.includes(`| '${value}'`)||page.includes(`${value}:`)||page.includes(`'${value}':`),`Missing document-font value: ${value}`);
  assert.ok(page.includes(label),`Missing document-font label: ${label}`);
}
for(const marker of ['exportFamily','pdfFamily','documentFontFromFamily','pdfFontFromFamily','selectedFont.exportFamily','const fontFace=effectiveFontFamily'])assert.ok(page.includes(marker),`Font export integration marker missing: ${marker}`);
console.log(`Document font catalogue and export mappings verified for ${expected.length} fonts.`);
