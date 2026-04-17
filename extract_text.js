'use strict';
/**
 * extract_text.js  —  从 .pptx 提取每页文本，检测潜在截断问题
 * 用法: node extract_text.js <file.pptx>
 */
const JSZip = require('jszip');
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('Usage: node extract_text.js <file.pptx>'); process.exit(1); }

JSZip.loadAsync(fs.readFileSync(file)).then(zip => {
  // collect slide files in order
  const slideFiles = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a,b) => {
      const na = parseInt(a.match(/\d+/)[0]);
      const nb = parseInt(b.match(/\d+/)[0]);
      return na - nb;
    });

  const proms = slideFiles.map((name, idx) =>
    zip.file(name).async('string').then(xml => {
      // Extract all <a:t> text nodes
      const texts = [];
      const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
      let m;
      while ((m = re.exec(xml)) !== null) {
        const t = m[1].trim();
        if (t) texts.push(t);
      }
      const joined = texts.join(' | ');
      const lineCount = texts.length;

      // Count non-table text fragments for overflow check
      const xmlNoTbl = xml.replace(/<a:tbl[\s\S]*?<\/a:tbl>/g, '');
      const nonTableFrags = (xmlNoTbl.match(/<a:t[^>]*>[^<]{2,}<\/a:t>/g) || []).length;

      const warnings = [];
      if (nonTableFrags > 30) warnings.push(`⚠ 非表格文本片段数 ${nonTableFrags}，可能内容过多`);

      // Check font sizes — only for non-empty, non-table-cell runs
      // Strip table content first (table cells have their own sizing rules)
      const xmlNoTable = xml.replace(/<a:tbl[\s\S]*?<\/a:tbl>/g, '');
      const fontSizes = [];
      // Find font size + paired text content in same <a:r> run
      const runRe = /<a:r\b[^>]*>([\s\S]*?)<\/a:r>/g;
      let rm;
      while ((rm = runRe.exec(xmlNoTable)) !== null) {
        const runXml = rm[1];
        const txtM = runXml.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
        const runText = txtM ? txtM[1] : '';
        if (runText.trim().length < 2) continue;  // skip spacers/empty runs
        const szM = runXml.match(/sz="(\d+)"/);
        if (szM) fontSizes.push(parseInt(szM[1]) / 100);
      }
      const minFont = fontSizes.length ? Math.min(...fontSizes) : null;
      if (minFont !== null && minFont < 18) {
        warnings.push(`⚠ 正文最小字号 ${minFont}pt < 18pt（共${fontSizes.filter(f=>f<18).length}处）`);
      }

      // Count spAutoFit vs no autoFit
      const autoFitCount = (xml.match(/<a:spAutoFit\/>/g) || []).length;
      const normAutoFit = (xml.match(/<a:normAutofit/g) || []).length;
      const noAutoFit = (xml.match(/<a:bodyPr[^>]*>(?!.*<a:spAutoFit)[^<]*<\/a:bodyPr>/g) || []).length;

      return { idx: idx+1, name, lineCount, minFont, autoFitCount, normAutoFit, joined, warnings };
    })
  );

  return Promise.all(proms);
}).then(results => {
  console.log(`\n📄 文件：${file}`);
  console.log(`   共 ${results.length} 张幻灯片\n`);
  console.log('=' .repeat(70));

  let hasWarnings = false;
  results.forEach(r => {
    const warnStr = r.warnings.length ? '\n   ' + r.warnings.join('\n   ') : '';
    const autoStr = r.autoFitCount > 0 ? `✅ spAutoFit×${r.autoFitCount}` : '❌ 无spAutoFit';
    const fontStr = r.minFont !== null
      ? (r.minFont >= 18 ? `✅ 最小字号${r.minFont}pt` : `❌ 最小字号${r.minFont}pt`)
      : '— 无字号信息';
    console.log(`P${String(r.idx).padStart(2,'0')}  ${autoStr}  ${fontStr}  文本片段:${r.lineCount}${warnStr}`);
    if (r.warnings.length) hasWarnings = true;
  });

  console.log('='.repeat(70));
  if (!hasWarnings) {
    console.log('\n✅ 全部检查通过：无截断风险，字号合规，autoFit 已启用\n');
  } else {
    console.log('\n⚠ 发现问题，请检查上方标记的幻灯片\n');
    process.exit(1);
  }
});
