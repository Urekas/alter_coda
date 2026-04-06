import { Instance } from '../store';

const hexTo16BitRGB = (hex: string) => {
  const cleanHex = hex.replace('#', '');
  const r8 = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g8 = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b8 = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return { R: r8 * 257, G: g8 * 257, B: b8 * 257 };
};

export const exportToSportsCodeXML = (instances: Instance[], rows: { code: string; color: string }[], filename?: string): void => {
  const instancesXML = instances.map((instance) => {
    const labelsXML = instance.labels.map(label => {
      const groupNode = label.group ? `\n        <group>${label.group}</group>` : '';
      return `      <label>${groupNode}
        <text>${label.text}</text>
      </label>`;
    }).join('\n');

    return `    <instance>
      <ID>${instance.id}</ID>
      <start>${instance.start}</start>
      <end>${instance.end}</end>
      <code>${instance.code}</code>
${labelsXML}
    </instance>`;
  }).join('\n');

  const rowsXML = rows.map((row) => {
    const { R, G, B } = hexTo16BitRGB(row.color);
    return `    <row>
      <code>${row.code}</code>
      <R>${R}</R>
      <G>${G}</G>
      <B>${B}</B>
    </row>`;
  }).join('\n');

  const xmlString = `<?xml version="1.0" encoding="utf-8"?>\n<file>\n  <ALL_INSTANCES>\n${instancesXML}\n  </ALL_INSTANCES>\n  <ROWS>\n${rowsXML}\n  </ROWS>\n</file>`;

  const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename ? `${filename}.xml` : `sportscode_export_${Date.now()}.xml`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
