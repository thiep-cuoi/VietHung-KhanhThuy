type Cell = string | number | boolean | null | undefined;
const enc = new TextEncoder();
function xml(value: unknown) { return String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function col(index: number) { let out = ""; for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + (n - 1) % 26) + out; return out; }
const crcTable = Array.from({ length: 256 }, (_, n) => { let c=n; for(let k=0;k<8;k++) c=c&1?0xedb88320^(c>>>1):c>>>1; return c>>>0; });
function crc32(data: Uint8Array) { let c=0xffffffff; for(const b of data)c=crcTable[(c^b)&255]^(c>>>8); return (c^0xffffffff)>>>0; }
function join(parts: Uint8Array[]) { const result = new Uint8Array(parts.reduce((a,p)=>a+p.length,0)); let at=0; for(const p of parts){ result.set(p,at);at+=p.length;} return result; }
function zip(files: Record<string,string>) {
  const chunks: Uint8Array[]=[], directory: Uint8Array[]=[]; let offset=0;
  for(const [path,content] of Object.entries(files)) {
    const name=enc.encode(path), data=enc.encode(content), crc=crc32(data), local=new Uint8Array(30), h=new DataView(local.buffer);
    h.setUint32(0,0x04034b50,true); h.setUint16(4,20,true); h.setUint16(6,0x800,true); h.setUint16(12,33,true); h.setUint32(14,crc,true); h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);
    chunks.push(local,name,data);
    const central=new Uint8Array(46),c=new DataView(central.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);
    directory.push(central,name);offset+=local.length+name.length+data.length;
  }
  const dir=join(directory),end=new Uint8Array(22),e=new DataView(end.buffer),count=Object.keys(files).length;
  e.setUint32(0,0x06054b50,true);e.setUint16(8,count,true);e.setUint16(10,count,true);e.setUint32(12,dir.length,true);e.setUint32(16,offset,true);
  return join([...chunks,dir,end]);
}
export function createWorkbook(sheets: { name:string; rows:Cell[][]; widths?:number[] }[]) {
  const files:Record<string,string>={};
  files["[Content_Types].xml"]=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`;
  files["_rels/.rels"]=`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  files["xl/workbook.xml"]=`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${xml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("")}</sheets></workbook>`;
  files["xl/_rels/workbook.xml.rels"]=`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  files["xl/styles.xml"]=`<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF203F53"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="top" wrapText="1"/></xf><xf fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  sheets.forEach((s,i)=>{
    const columns=Math.max(1,...s.rows.map(r=>r.length)),dimension=`A1:${col(columns-1)}${Math.max(1,s.rows.length)}`;
    files[`xl/worksheets/sheet${i+1}.xml`]=`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="${dimension}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${Array.from({length:columns},(_,n)=>`<col min="${n+1}" max="${n+1}" width="${s.widths?.[n]??24}" customWidth="1"/>`).join("")}</cols><sheetData>${s.rows.map((row,n)=>`<row r="${n+1}"${n===0?' ht="30" customHeight="1"':""}>${row.map((value,j)=>typeof value==="number"&&Number.isFinite(value)?`<c r="${col(j)}${n+1}" s="${n===0?1:0}"><v>${value}</v></c>`:`<c r="${col(j)}${n+1}" s="${n===0?1:0}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join("")}</row>`).join("")}</sheetData><autoFilter ref="${dimension}"/></worksheet>`;
  });
  return zip(files);
}
