import { Instance } from '../store';

const hexTo16BitRGB = (hex: string) => {
  const cleanHex = hex.replace('#', '');
  const r8 = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g8 = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b8 = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return { R: r8 * 257, G: g8 * 257, B: b8 * 257 };
};

// 실제 Sportscode 태깅 결과 XML(예: "태깅결과_M27_중국vs호주_Sportscode.xml")과 바이트 단위로
// 최대한 똑같이 맞춘 포맷 — 확인해보니 실제 파일은:
//   - <?xml ...?> 선언 자체가 없음 (그냥 <file>로 바로 시작)
//   - 들여쓰기가 전혀 없음 (모든 태그가 줄 맨 앞부터 시작)
//   - BOM 없음 (순수 UTF-8)
//   - 라벨 없는 instance는 <code>...</code> 바로 다음 줄이 </instance> (빈 줄 없음)
// 이전에 넣었던 XML 선언/들여쓰기/BOM은 전부 이 실제 포맷과 달라서 제거함.
export const exportToSportsCodeXML = (instances: Instance[], rows: { code: string; color: string }[]): void => {
  const instancesXML = instances.map((instance) => {
    const labelsXML = instance.labels.map(label => {
      const groupNode = label.group ? `\n<group>${label.group}</group>` : '';
      return `<label>${groupNode}
<text>${label.text}</text>
</label>`;
    }).join('\n');

    const labelsBlock = labelsXML ? `\n${labelsXML}` : '';

    return `<instance>
<ID>${instance.id}</ID>
<start>${instance.start}</start>
<end>${instance.end}</end>
<code>${instance.code}</code>${labelsBlock}
</instance>`;
  }).join('\n');

  const rowsXML = rows.map((row) => {
    const { R, G, B } = hexTo16BitRGB(row.color);
    return `<row>
<code>${row.code}</code>
<R>${R}</R>
<G>${G}</G>
<B>${B}</B>
</row>`;
  }).join('\n');

  const xmlString = `<file>\n<ALL_INSTANCES>\n${instancesXML}\n</ALL_INSTANCES>\n<ROWS>\n${rowsXML}\n</ROWS>\n</file>`;

  const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `sportscode_export_${Date.now()}.xml`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
