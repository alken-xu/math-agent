'use strict';
const PptxGenJS = require('pptxgenjs');
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';   // 13.33" × 7.5"

// ─── Palette ──────────────────────────────────────────────────────────────────
const DB  = '1E2761';   // dark blue  — header / titles
const OR  = 'F96167';   // orange     — answers / accents
const WH  = 'FFFFFF';
const LB  = 'EBF0FB';   // light blue — question bg strip
const SB  = 'F5F7FD';   // soft blue  — step card bg
const LG  = 'F4F4F4';   // light gray
const GR  = '2E7D32';   // dark green — ✅ verifier
const LGR = 'E8F5E9';   // light green bg
const AM  = 'BF360C';   // amber/red  — ⚠️ verifier
const LAM = 'FFF3E0';   // light amber bg
const TDB = '0D1A4A';   // darker blue for dense text
const MGR = '555555';   // mid gray footnote

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Dark-blue header bar + white title + optional right badge */
function hdr(s, title, badge, badgeCol) {
  s.addShape(pptx.ShapeType.rect, { x:0, y:0, w:'100%', h:1.05, fill:{color:DB} });
  s.addText(title, { x:0.35, y:0.05, w:9.8, h:0.95,
    fontSize:27, bold:true, color:WH, fontFace:'Calibri', valign:'middle' });
  if (badge) {
    const bc = badgeCol || OR;
    s.addShape(pptx.ShapeType.roundRect,
      { x:10.3, y:0.2, w:2.75, h:0.65, fill:{color:bc}, rectRadius:0.12 });
    s.addText(badge, { x:10.3, y:0.2, w:2.75, h:0.65,
      fontSize:13, bold:true, color:WH, fontFace:'Calibri',
      align:'center', valign:'middle' });
  }
}

/** Thin light-blue strip just below header — echoes the problem text */
function qStrip(s, txt) {
  s.addShape(pptx.ShapeType.rect, { x:0, y:1.05, w:'100%', h:0.55, fill:{color:LB} });
  s.addText(txt, { x:0.35, y:1.06, w:12.6, h:0.52,
    fontSize:13, italic:true, color:TDB, fontFace:'Calibri', valign:'middle' });
}

/**
 * Draw a step card.
 * @param {object} s   slide
 * @param {number} n   step number (shown in badge)
 * @param {string} lbl bold label  e.g. "步骤1：定义距离"
 * @param {string} body content text (may include \n)
 * @param {number} y   top position (inches)
 * @param {number} h   card height (inches)
 * @param {string} [accentCol]  left-strip colour, defaults to OR
 */
function stepCard(s, n, lbl, body, y, h, accentCol) {
  const ac = accentCol || OR;
  const X = 0.3, W = 12.73;
  s.addShape(pptx.ShapeType.rect,
    { x:X, y:y, w:W, h:h, fill:{color:SB}, line:{color:'CDD5ED', width:0.5} });
  s.addShape(pptx.ShapeType.rect,
    { x:X, y:y, w:0.08, h:h, fill:{color:ac} });
  // number badge
  const badgeY = y + (h - 0.44) / 2;
  s.addShape(pptx.ShapeType.ellipse,
    { x:X+0.16, y:badgeY, w:0.44, h:0.44, fill:{color:ac} });
  s.addText(String(n), { x:X+0.16, y:badgeY, w:0.44, h:0.44,
    fontSize:13, bold:true, color:WH, fontFace:'Calibri',
    align:'center', valign:'middle' });
  // label
  s.addText(lbl, { x:X+0.75, y:y+0.07, w:11.85, h:0.36,
    fontSize:14, bold:true, color:DB, fontFace:'Calibri', valign:'top' });
  // body
  s.addText(body, { x:X+0.75, y:y+0.43, w:11.85, h:h-0.52,
    fontSize:14, color:'1A1A1A', fontFace:'Calibri', valign:'top' });
}

/** Orange answer box */
function ansBox(s, txt, x, y, w, h) {
  s.addShape(pptx.ShapeType.roundRect,
    { x:x, y:y, w:w, h:h, fill:{color:OR}, rectRadius:0.1 });
  s.addText(txt, { x:x, y:y, w:w, h:h,
    fontSize:20, bold:true, color:WH, fontFace:'Calibri',
    align:'center', valign:'middle' });
}

/** Self-check / note bar at bottom (green=ok, amber=warn) */
function chkBar(s, txt, ok) {
  const bg  = ok ? LGR : LAM;
  const tc  = ok ? GR  : AM;
  const icon = ok ? '✅' : '⚠️';
  s.addShape(pptx.ShapeType.rect,
    { x:0.3, y:6.58, w:12.73, h:0.68, fill:{color:bg} });
  s.addText(icon + '  ' + txt, { x:0.45, y:6.6, w:12.5, h:0.64,
    fontSize:13, color:tc, fontFace:'Calibri', bold:!ok, valign:'middle' });
}

/** Verifier verdict card (full-width) */
function verdictCard(s, ok, title, body, y, h) {
  const bg  = ok ? LGR  : LAM;
  const lc  = ok ? GR   : AM;
  const tc  = ok ? GR   : AM;
  s.addShape(pptx.ShapeType.rect,
    { x:0.3, y:y, w:12.73, h:h, fill:{color:bg}, line:{color:lc, width:1} });
  s.addShape(pptx.ShapeType.rect,
    { x:0.3, y:y, w:0.1, h:h, fill:{color:lc} });
  s.addText(title, { x:0.55, y:y+0.08, w:12.3, h:0.42,
    fontSize:15, bold:true, color:tc, fontFace:'Calibri', valign:'top' });
  s.addText(body, { x:0.55, y:y+0.52, w:12.3, h:h-0.6,
    fontSize:13, color:'333333', fontFace:'Calibri', valign:'top' });
}

/** Light info box (dark-blue border, white bg) */
function infoBox(s, title, body, y, h) {
  s.addShape(pptx.ShapeType.rect,
    { x:0.3, y:y, w:12.73, h:h, fill:{color:WH}, line:{color:DB, width:0.8} });
  s.addShape(pptx.ShapeType.rect,
    { x:0.3, y:y, w:0.08, h:h, fill:{color:DB} });
  s.addText(title, { x:0.55, y:y+0.07, w:12.3, h:0.38,
    fontSize:14, bold:true, color:DB, fontFace:'Calibri', valign:'top' });
  s.addText(body, { x:0.55, y:y+0.48, w:12.3, h:h-0.56,
    fontSize:14, color:'1A1A1A', fontFace:'Calibri', valign:'top' });
}

/** Orange highlight formula box (inline, right-aligned) */
function fmlaBox(s, txt, x, y, w, h) {
  s.addShape(pptx.ShapeType.roundRect,
    { x:x, y:y, w:w, h:h, fill:{color:OR}, rectRadius:0.08 });
  s.addText(txt, { x:x, y:y, w:w, h:h,
    fontSize:16, bold:true, color:WH, fontFace:'Calibri',
    align:'center', valign:'middle' });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 1 — COVER
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  s.addShape(pptx.ShapeType.rect, { x:0,y:0,w:'100%',h:'100%', fill:{color:DB} });
  // decorative lines
  s.addShape(pptx.ShapeType.rect, { x:0,y:2.6, w:'100%',h:0.07, fill:{color:OR} });
  s.addShape(pptx.ShapeType.rect, { x:0,y:2.8, w:'100%',h:0.07, fill:{color:OR} });
  s.addText('数学解题报告', {
    x:0.5,y:0.6,w:12.33,h:1.6,
    fontSize:52,bold:true,color:WH,fontFace:'Calibri',align:'center' });
  s.addText('平面直角坐标系专题 · 2026年4月12日作业', {
    x:0.5,y:2.2,w:12.33,h:0.65,
    fontSize:22,color:OR,fontFace:'Calibri',align:'center',bold:true });
  const infos = [
    ['年  级', '七年级下学期'],
    ['章  节', '第7章 平面直角坐标系'],
    ['题目数', '14道（第7~18题，含变1、变2）'],
    ['生成日期', '2026-04-16'],
  ];
  infos.forEach(([k,v], i) => {
    s.addText(`${k}：${v}`, {
      x:2.5, y:3.15+i*0.58, w:8.33, h:0.5,
      fontSize:18, color:'D0D8FF', fontFace:'Calibri', align:'center' });
  });
  s.addText('math-solver  ×  math-verifier', {
    x:0,y:7.0,w:'100%',h:0.38,
    fontSize:12,color:'6070A0',fontFace:'Calibri',align:'center' });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  第7题  绝对值方程 — 点到坐标轴距离
// ═══════════════════════════════════════════════════════════════════════════════

// — P2  题目介绍 —
{
  const s = pptx.addSlide();
  hdr(s,'第7题 — 点到坐标轴距离求参数','坐标与图形');
  infoBox(s,'📋 题目',
    'M(m+1, 3m-5)，到 x 轴的距离是到 y 轴距离的一半，求 m 的值。',
    1.2, 0.9);
  infoBox(s,'💡 知识点',
    '① 点 (x₀, y₀) 到 x 轴距离 = |y₀|（纵坐标绝对值）\n' +
    '② 点 (x₀, y₀) 到 y 轴距离 = |x₀|（横坐标绝对值）\n' +
    '③ 含绝对值方程的七年级解法：分情况去绝对值，化为两个一元一次方程',
    2.2, 1.35);
  infoBox(s,'🔍 解题思路',
    '设题意得 |3m-5| = ½|m+1|，即 2|3m-5| = |m+1|\n' +
    '→ 分两种情况：(A) 两侧同号  (B) 两侧异号，各解一个一元一次方程',
    3.68, 0.9);
  chkBar(s,'七年级方法：分情况去绝对值（不使用九年级的求根公式）', true);
}

// — P3  解题步骤 步骤1~2 —
{
  const s = pptx.addSlide();
  hdr(s,'第7题 — 解题步骤（1/3）','坐标与图形');
  qStrip(s,'M(m+1, 3m-5) 到 x 轴距离是到 y 轴距离的一半，求 m');
  stepCard(s,1,'写出点到坐标轴距离的表达式',
    '到 x 轴距离 = |纵坐标| = |3m-5|\n' +
    '到 y 轴距离 = |横坐标| = |m+1|',
    1.72, 1.3);
  stepCard(s,2,'根据题意建立绝对值方程',
    '到 x 轴距离 = ½ × 到 y 轴距离\n' +
    '|3m-5| = ½ × |m+1|\n' +
    '两边同乘以 2，整理为：  2|3m-5| = |m+1|',
    3.12, 1.3);
  stepCard(s,3,'说明分情况讨论的依据',
    '绝对值 |A| = |B| 等价于 A = B 或 A = -B（两种情况）\n' +
    '因此需要分情况去掉绝对值符号，分别列方程求解。',
    4.52, 1.3);
  chkBar(s,'关键依据：|A|=|B| ⟺ A=B 或 A=-B', true);
}

// — P4  情况一 —
{
  const s = pptx.addSlide();
  hdr(s,'第7题 — 解题步骤（2/3）：情况一','坐标与图形');
  qStrip(s,'2|3m-5| = |m+1|  →  分两种情况讨论');
  stepCard(s,'一','情况一：两侧同号，去绝对值',
    '2(3m-5) = m+1\n' +
    '展开左边：6m - 10 = m + 1\n' +
    '移项合并：6m - m = 1 + 10\n' +
    '           5m = 11\n' +
    '            m = 11/5',
    1.72, 2.0, '3949AB');
  stepCard(s,'✓','代入验证（情况一）',
    'm = 11/5：\n' +
    '  到 x 轴距离 = |3×11/5 - 5| = |33/5 - 25/5| = 8/5\n' +
    '  到 y 轴距离 = |11/5 + 1| = |11/5 + 5/5| = 16/5\n' +
    '  8/5 = ½ × 16/5  ✓  满足题意',
    3.82, 2.0, GR);
  chkBar(s,'情况一结果：m = 11/5（已验证）', true);
}

// — P5  情况二 —
{
  const s = pptx.addSlide();
  hdr(s,'第7题 — 解题步骤（3/3）：情况二','坐标与图形');
  qStrip(s,'2|3m-5| = |m+1|  →  分两种情况讨论');
  stepCard(s,'二','情况二：两侧异号，去绝对值',
    '2(3m-5) = -(m+1)\n' +
    '展开左边：6m - 10 = -m - 1\n' +
    '移项合并：6m + m = -1 + 10\n' +
    '           7m = 9\n' +
    '            m = 9/7',
    1.72, 2.0, '3949AB');
  stepCard(s,'✓','代入验证（情况二）',
    'm = 9/7：\n' +
    '  到 x 轴距离 = |3×9/7 - 5| = |27/7 - 35/7| = 8/7\n' +
    '  到 y 轴距离 = |9/7 + 1| = |9/7 + 7/7| = 16/7\n' +
    '  8/7 = ½ × 16/7  ✓  满足题意',
    3.82, 2.0, GR);
  chkBar(s,'情况二结果：m = 9/7（已验证）', true);
}

// — P6  答案页 —
{
  const s = pptx.addSlide();
  hdr(s,'第7题 — 最终答案','坐标与图形');
  qStrip(s,'M(m+1, 3m-5) 到 x 轴距离是到 y 轴距离的一半');
  ansBox(s,'m = 11/5  或  m = 9/7', 1.5, 1.72, 10.33, 1.5);
  infoBox(s,'📌 解题方法对比',
    '七年级方法（分情况去绝对值）：\n' +
    '  情况一：2(3m-5) = m+1  →  m = 11/5\n' +
    '  情况二：2(3m-5) = -(m+1)  →  m = 9/7\n\n' +
    '⚠️  九年级方法（两边平方→求根公式）：答案相同，但超纲，考试中不推荐使用',
    3.42, 2.95);
  chkBar(s,'两个答案均已代入原题验证 ✓', true);
}

// — P7  审核页 —
{
  const s = pptx.addSlide();
  hdr(s,'第7题 — 审核结果','math-verifier', AM);
  qStrip(s,'M(m+1, 3m-5) 到 x 轴距离是到 y 轴距离的一半');
  verdictCard(s, false,
    '⚠️  答案正确，但解题方法超纲',
    'solver 使用了"两边平方 → 求根公式"。\n' +
    '求根公式是九年级内容（第21章 一元二次方程），七年级不应使用。\n\n' +
    '七年级正确方法：分情况去绝对值，建立两个一元一次方程分别求解。\n' +
    '两种方法最终答案一致：m = 11/5 或 m = 9/7，答案无误。',
    1.72, 2.6);
  verdictCard(s, true,
    '✅  正确答案',
    'm = 11/5  或  m = 9/7（两个解均正确，且两种方法答案一致）',
    4.5, 1.1);
  chkBar(s,'考试建议：使用分情况讨论（七年级方法），避免使用超纲公式', false);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  第8题  正方形顶点坐标（需穷举四种情况）
// ═══════════════════════════════════════════════════════════════════════════════

// — P8  题目介绍 —
{
  const s = pptx.addSlide();
  hdr(s,'第8题 — 正方形顶点坐标','坐标与图形');
  infoBox(s,'📋 题目',
    '正方形 ABCD 边长为 2，点 A 与坐标系原点重合，\n' +
    'AB 所在直线与 x 轴重合，AD 所在直线与 y 轴重合。\n' +
    '请写出 A、B、C、D 四点的坐标。',
    1.2, 1.15);
  infoBox(s,'🔍 关键分析',
    '题目说 "AB 所在直线与 x 轴重合" —— 但没有规定 B 在正方向还是负方向！\n' +
    '同理 "AD 所在直线与 y 轴重合" —— 没有规定 D 在正方向还是负方向。\n\n' +
    '因此 B 可取 (2,0) 或 (-2,0)，D 可取 (0,2) 或 (0,-2)，\n' +
    '两两组合共有 4 种情况，必须全部列出。',
    2.48, 1.8);
  infoBox(s,'💡 知识点',
    '正方形四个顶点依次相邻 → C 由 B 与 D 的坐标确定（与 B 同列、与 D 同行）',
    4.4, 0.75);
  chkBar(s,'关键：穷举 B、D 方向（正/负），共 4 种情况', false);
}

// — P9  情况一、二 —
{
  const s = pptx.addSlide();
  hdr(s,'第8题 — 情况一、二','坐标与图形');
  qStrip(s,'AB 在 x 轴，AD 在 y 轴，边长为 2，A 在原点');
  stepCard(s,'一','B 在 x 轴正方向，D 在 y 轴正方向（第一象限）',
    'A(0, 0)   →   固定于原点\n' +
    'B 在 x 轴正方向，AB = 2  →  B(2, 0)\n' +
    'D 在 y 轴正方向，AD = 2  →  D(0, 2)\n' +
    'C 与 B 同横坐标、与 D 同纵坐标  →  C(2, 2)\n' +
    '✅  A(0,0)  B(2,0)  C(2,2)  D(0,2)',
    1.72, 2.05);
  stepCard(s,'二','B 在 x 轴负方向，D 在 y 轴正方向（第二象限）',
    'A(0, 0)   →   固定于原点\n' +
    'B 在 x 轴负方向，AB = 2  →  B(-2, 0)\n' +
    'D 在 y 轴正方向，AD = 2  →  D(0, 2)\n' +
    'C 与 B 同横坐标、与 D 同纵坐标  →  C(-2, 2)\n' +
    '✅  A(0,0)  B(-2,0)  C(-2,2)  D(0,2)',
    3.87, 2.05);
  chkBar(s,'情况一、二已完整列出', true);
}

// — P10  情况三、四 —
{
  const s = pptx.addSlide();
  hdr(s,'第8题 — 情况三、四','坐标与图形');
  qStrip(s,'AB 在 x 轴，AD 在 y 轴，边长为 2，A 在原点');
  stepCard(s,'三','B 在 x 轴正方向，D 在 y 轴负方向（第四象限）',
    'A(0, 0)   →   固定于原点\n' +
    'B 在 x 轴正方向，AB = 2  →  B(2, 0)\n' +
    'D 在 y 轴负方向，AD = 2  →  D(0, -2)\n' +
    'C 与 B 同横坐标、与 D 同纵坐标  →  C(2, -2)\n' +
    '✅  A(0,0)  B(2,0)  C(2,-2)  D(0,-2)',
    1.72, 2.05);
  stepCard(s,'四','B 在 x 轴负方向，D 在 y 轴负方向（第三象限）',
    'A(0, 0)   →   固定于原点\n' +
    'B 在 x 轴负方向，AB = 2  →  B(-2, 0)\n' +
    'D 在 y 轴负方向，AD = 2  →  D(0, -2)\n' +
    'C 与 B 同横坐标、与 D 同纵坐标  →  C(-2, -2)\n' +
    '✅  A(0,0)  B(-2,0)  C(-2,-2)  D(0,-2)',
    3.87, 2.05);
  chkBar(s,'情况三、四已完整列出', true);
}

// — P11  答案汇总 + 审核 —
{
  const s = pptx.addSlide();
  hdr(s,'第8题 — 答案汇总 & 审核','坐标与图形');
  qStrip(s,'正方形 ABCD，边长为2，A 在原点，AB 在 x 轴，AD 在 y 轴');
  const rows = [
    [
      {text:'情况', options:{bold:true,color:WH,fill:DB}},
      {text:'A',    options:{bold:true,color:WH,fill:DB}},
      {text:'B',    options:{bold:true,color:WH,fill:DB}},
      {text:'C',    options:{bold:true,color:WH,fill:DB}},
      {text:'D',    options:{bold:true,color:WH,fill:DB}},
      {text:'象限', options:{bold:true,color:WH,fill:DB}},
    ],
    ['一','(0,0)','(2,0)','(2,2)','(0,2)','第一象限'],
    ['二','(0,0)','(-2,0)','(-2,2)','(0,2)','第二象限'],
    ['三','(0,0)','(2,0)','(2,-2)','(0,-2)','第四象限'],
    ['四','(0,0)','(-2,0)','(-2,-2)','(0,-2)','第三象限'],
  ];
  s.addTable(rows, { x:0.3, y:1.72, w:12.73, fontSize:14, fontFace:'Calibri',
    border:{pt:1, color:'CCCCCC'}, colW:[1.3,2.1,2.1,2.1,2.1,3.0],
    rowH:0.52, fill:{color:LG} });
  verdictCard(s, false,
    '⚠️  solver 只给出了情况一，遗漏另外三种情况',
    '题目未限制 B/D 方向，应穷举全部四种组合。如图示明确方向，仅需一种即可。',
    4.55, 0.9);
  chkBar(s,'答案正确性：四种情况答案均正确；完整性：需全部列出', false);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  第9题  平行四边形 ABCD 求 C 坐标
// ═══════════════════════════════════════════════════════════════════════════════

// — P12  题目介绍 —
{
  const s = pptx.addSlide();
  hdr(s,'第9题 — 平行四边形求顶点坐标','坐标与图形');
  infoBox(s,'📋 题目',
    '平行四边形 ABCD 中，AB 与 x 轴重合，CD∥x 轴。\n' +
    '已知 A(-3, 0)，B(1, 0)，D(-2, 2)，求 C 点坐标。',
    1.2, 0.95);
  infoBox(s,'💡 知识点 & 解题思路',
    '平行四边形性质：对边平行且相等。\n' +
    '  AB∥DC 且 AB = DC → DC 与 AB 方向相同、长度相同\n\n' +
    '七年级坐标差法（不使用向量符号）：\n' +
    '  AB 的横向位移 = x_B - x_A = 1-(-3) = 4（向右4格）\n' +
    '  AB 的纵向位移 = y_B - y_A = 0-0 = 0（不上下移动）\n' +
    '  C 由 D 出发，按 AB 相同位移到达：C = (x_D+4,  y_D+0)',
    2.28, 2.35);
  chkBar(s,'注意：用"坐标差"表述，避免使用"向量"（高中内容）', false);
}

// — P13  解题步骤 + 答案 + 审核 —
{
  const s = pptx.addSlide();
  hdr(s,'第9题 — 解题步骤 & 结果','坐标与图形');
  qStrip(s,'A(-3,0)  B(1,0)  D(-2,2)  →  CD∥AB，求 C');
  stepCard(s,1,'计算 AB 的位移（横向、纵向各差多少）',
    '横向位移 = x_B - x_A = 1 - (-3) = 4\n纵向位移 = y_B - y_A = 0 - 0 = 0',
    1.72, 1.0);
  stepCard(s,2,'DC 与 AB 相同位移，由 D 推出 C',
    'x_C = x_D + 横向位移 = -2 + 4 = 2\ny_C = y_D + 纵向位移 =  2 + 0 = 2\n→  C(2, 2)',
    2.82, 1.0);
  stepCard(s,'✓','自查：验证 CD∥x 轴',
    'C(2, 2) 与 D(-2, 2) 的纵坐标均为 2，两点纵坐标相等 → CD∥x 轴  ✓',
    3.92, 0.9, GR);
  ansBox(s,'C(2, 2)', 4.0, 5.0, 5.33, 1.0);
  verdictCard(s, true,
    '✅  答案正确',
    'C(2, 2) 验证通过；solver 使用"向量"表述，高中概念，建议改用坐标差法。',
    6.15, 0.88);
  chkBar(s,'答案：C(2, 2)  ✓', true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  变1题  平行四边形 ABCD 已知 A B C，求 D
// ═══════════════════════════════════════════════════════════════════════════════

// — P14  题目介绍 —
{
  const s = pptx.addSlide();
  hdr(s,'变1题 — 平行四边形求顶点坐标（对角线法）','坐标与图形');
  infoBox(s,'📋 题目',
    '平行四边形 ABCD 中，已知 A(-3, 0)，B(1, 0)，C(-2, 2)，求 D 点坐标。',
    1.2, 0.8);
  infoBox(s,'💡 知识点 & 解题思路',
    '平行四边形性质：对角线互相平分。\n' +
    '  即 AC 的中点 = BD 的中点 = 对角线交点 M\n\n' +
    '解题策略：\n' +
    '  Step 1：用 A、C 坐标算出中点 M 的坐标\n' +
    '  Step 2：利用 M 是 BD 的中点，由 B 和 M 反推 D\n' +
    '  公式：若 M 是 BD 中点，则 D = (2×x_M - x_B,  2×y_M - y_B)',
    2.13, 2.2);
  chkBar(s,'核心性质：平行四边形对角线互相平分', true);
}

// — P15  解题步骤 + 答案 + 审核 —
{
  const s = pptx.addSlide();
  hdr(s,'变1题 — 解题步骤 & 结果','坐标与图形');
  qStrip(s,'A(-3,0)  B(1,0)  C(-2,2)，对角线互相平分，求 D');
  stepCard(s,1,'求对角线 AC 的中点 M',
    'x_M = (x_A + x_C) / 2 = (-3 + (-2)) / 2 = -5/2\n' +
    'y_M = (y_A + y_C) / 2 = (0  +   2 ) / 2 =  1\n' +
    '∴  M(-5/2,  1)',
    1.72, 1.05);
  stepCard(s,2,'M 也是 BD 的中点，由 B 和 M 反推 D',
    'x_D = 2×x_M - x_B = 2×(-5/2) - 1 = -5 - 1 = -6\n' +
    'y_D = 2×y_M - y_B = 2×1    - 0 = 2\n' +
    '∴  D(-6,  2)',
    2.87, 1.05);
  stepCard(s,'✓','自查：验证 AB = DC（对边相等）',
    'AB 的位移：(x_B-x_A, y_B-y_A) = (1-(-3), 0-0) = (4, 0)\n' +
    'DC 的位移：(x_C-x_D, y_C-y_D) = (-2-(-6), 2-2) = (4, 0)\n' +
    'AB 与 DC 位移相同  ✓',
    4.02, 1.2, GR);
  ansBox(s,'D(-6, 2)', 4.0, 5.37, 5.33, 0.9);
  verdictCard(s, true,
    '✅  答案正确',
    'D(-6, 2) 验证通过；solver 表述规范，对角线中点法使用正确。',
    6.38, 0.78);
  chkBar(s,'答案：D(-6, 2)  ✓', true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  变2题  已知三顶点，求第四顶点（3种情况）
// ═══════════════════════════════════════════════════════════════════════════════

// — P16  题目 + 分析思路 —
{
  const s = pptx.addSlide();
  hdr(s,'变2题 — 平行四边形三顶点求第四顶点','坐标与图形');
  infoBox(s,'📋 题目',
    '平行四边形三个顶点坐标分别为 (-3,0)、(1,0)、(-2,-2)，求另一个顶点的坐标。',
    1.2, 0.8);
  infoBox(s,'🔍 关键分析：为什么要分三种情况',
    '已知三点，但 不知道 哪两个点是对角顶点（对角线两端）。\n\n' +
    '记 P₁(-3,0)，P₂(1,0)，P₃(-2,-2)，第四顶点 P₄ 未知。\n' +
    '对角线的选法有三种：\n' +
    '   情况一：P₁ 与 P₃ 为对角  →  对角线是 P₁P₃，另一对角为 P₂P₄\n' +
    '   情况二：P₁ 与 P₂ 为对角  →  对角线是 P₁P₂，另一对角为 P₃P₄\n' +
    '   情况三：P₂ 与 P₃ 为对角  →  对角线是 P₂P₃，另一对角为 P₁P₄\n' +
    '每种情况用"对角线中点相等"列方程求 P₄',
    2.13, 2.85);
  chkBar(s,'三种情况均需列出，任何一种都不能遗漏', false);
}

// — P17  情况一 —
{
  const s = pptx.addSlide();
  hdr(s,'变2题 — 情况一（P₁与P₃对角）','坐标与图形');
  qStrip(s,'P₁(-3,0)  P₂(1,0)  P₃(-2,-2)，P₁P₃ 为对角线，求 P₄');
  stepCard(s,1,'求对角线 P₁P₃ 的中点 M',
    'x_M = (-3 + (-2)) / 2 = -5/2\n' +
    'y_M = (0  + (-2))  / 2 = -1\n' +
    '∴  M(-5/2,  -1)',
    1.72, 1.15);
  stepCard(s,2,'M 也是 P₂P₄ 的中点，由 P₂ 反推 P₄',
    'x_P₄ = 2×(-5/2) - 1 = -5 - 1 = -6\n' +
    'y_P₄ = 2×(-1)   - 0 = -2\n' +
    '∴  P₄ = (-6, -2)',
    2.97, 1.1);
  stepCard(s,'✓','验证：P₁P₂ 是否平行且等于 P₄P₃',
    'P₁→P₂ 位移：(1-(-3), 0-0) = (4, 0)\n' +
    'P₄→P₃ 位移：(-2-(-6), -2-(-2)) = (4, 0)  ✓',
    4.17, 1.05, GR);
  ansBox(s,'情况一：P₄ = (-6, -2)', 2.0, 5.38, 9.33, 0.88);
  chkBar(s,'情况一结果：(-6, -2)  ✓', true);
}

// — P18  情况二 —
{
  const s = pptx.addSlide();
  hdr(s,'变2题 — 情况二（P₁与P₂对角）','坐标与图形');
  qStrip(s,'P₁(-3,0)  P₂(1,0)  P₃(-2,-2)，P₁P₂ 为对角线，求 P₄');
  stepCard(s,1,'求对角线 P₁P₂ 的中点 M',
    'x_M = (-3 + 1) / 2 = -1\n' +
    'y_M = (0  + 0) / 2 =  0\n' +
    '∴  M(-1,  0)',
    1.72, 1.1);
  stepCard(s,2,'M 也是 P₃P₄ 的中点，由 P₃ 反推 P₄',
    'x_P₄ = 2×(-1) - (-2) = -2 + 2 = 0\n' +
    'y_P₄ = 2×0    - (-2) = 0  + 2 = 2\n' +
    '∴  P₄ = (0, 2)',
    2.92, 1.05);
  stepCard(s,'✓','验证：P₁P₃ 是否平行且等于 P₂P₄',
    'P₁→P₃ 位移：(-2-(-3), -2-0) = (1, -2)\n' +
    'P₂→P₄ 位移：(0-1, 2-0) = (-1, 2)  →  大小相等方向相反，即 P₃P₁ = P₂P₄  ✓',
    4.07, 1.15, GR);
  ansBox(s,'情况二：P₄ = (0, 2)', 2.0, 5.38, 9.33, 0.88);
  chkBar(s,'情况二结果：(0, 2)  ✓', true);
}

// — P19  情况三 —
{
  const s = pptx.addSlide();
  hdr(s,'变2题 — 情况三（P₂与P₃对角）','坐标与图形');
  qStrip(s,'P₁(-3,0)  P₂(1,0)  P₃(-2,-2)，P₂P₃ 为对角线，求 P₄');
  stepCard(s,1,'求对角线 P₂P₃ 的中点 M',
    'x_M = (1 + (-2)) / 2 = -1/2\n' +
    'y_M = (0 + (-2))  / 2 = -1\n' +
    '∴  M(-1/2,  -1)',
    1.72, 1.1);
  stepCard(s,2,'M 也是 P₁P₄ 的中点，由 P₁ 反推 P₄',
    'x_P₄ = 2×(-1/2) - (-3) = -1 + 3 = 2\n' +
    'y_P₄ = 2×(-1)   - 0    = -2\n' +
    '∴  P₄ = (2, -2)',
    2.92, 1.05);
  stepCard(s,'✓','验证：P₁P₂ 是否平行且等于 P₄P₃',
    'P₁→P₂ 位移：(1-(-3), 0-0) = (4, 0)\n' +
    'P₄→P₃ 位移：(-2-2, -2-(-2)) = (-4, 0)  →  P₄P₃ 与 P₁P₂ 方向相反大小相等  ✓',
    4.07, 1.15, GR);
  ansBox(s,'情况三：P₄ = (2, -2)', 2.0, 5.38, 9.33, 0.88);
  chkBar(s,'情况三结果：(2, -2)  ✓', true);
}

// — P20  答案汇总 + 审核 —
{
  const s = pptx.addSlide();
  hdr(s,'变2题 — 答案汇总 & 审核','坐标与图形');
  qStrip(s,'平行四边形三顶点：(-3,0)，(1,0)，(-2,-2)');
  const rows = [
    [{text:'对角线选法',options:{bold:true,color:WH,fill:DB}},
     {text:'中点 M',   options:{bold:true,color:WH,fill:DB}},
     {text:'第四顶点 P₄',options:{bold:true,color:WH,fill:DB}}],
    ['情况一：P₁(-3,0) 与 P₃(-2,-2)','M(-5/2, -1)','(-6, -2)'],
    ['情况二：P₁(-3,0) 与 P₂(1,0)',  'M(-1, 0)',   '(0, 2)'],
    ['情况三：P₂(1,0) 与 P₃(-2,-2)', 'M(-1/2, -1)','(2, -2)'],
  ];
  s.addTable(rows, { x:0.3, y:1.72, w:12.73, fontSize:14, fontFace:'Calibri',
    border:{pt:1, color:'CCCCCC'}, colW:[5.2,3.2,4.33], rowH:0.6,
    fill:{color:LG} });
  ansBox(s,'(-6,-2)  或  (0,2)  或  (2,-2)\n三种情况均需列出！', 0.8, 3.98, 11.73, 1.4);
  verdictCard(s, true,
    '✅  答案完整正确',
    '三种情况全部正确，答案 (-6,-2)、(0,2)、(2,-2) 均经验证。分情况讨论完整。',
    5.5, 0.88);
  chkBar(s,'答案：(-6,-2) 或 (0,2) 或 (2,-2)，三种情况缺一不可', true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  第10题  点到坐标轴的距离（基础题）
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  hdr(s,'第10题 — 点到坐标轴的距离','坐标与图形');
  infoBox(s,'📋 题目',
    '点 P(-3, 4)，到 x 轴的距离为___，到 y 轴的距离为___。',
    1.2, 0.75);
  stepCard(s,1,'到 x 轴的距离 = |纵坐标|',
    '纵坐标 y = 4\n到 x 轴距离 = |4| = 4',
    2.08, 1.1);
  stepCard(s,2,'到 y 轴的距离 = |横坐标|',
    '横坐标 x = -3\n到 y 轴距离 = |-3| = 3',
    3.28, 1.1);
  ansBox(s,'到 x 轴距离 = 4     到 y 轴距离 = 3', 1.0, 4.5, 11.33, 1.1);
  verdictCard(s, true,
    '✅  答案正确',
    '到 x 轴距离 = |纵坐标| = |4| = 4  ✓     到 y 轴距离 = |横坐标| = |-3| = 3  ✓',
    5.72, 0.9);
  chkBar(s,'答案：到 x 轴距离 4，到 y 轴距离 3  ✓', true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  第11题  在坐标系中描点（分析象限）
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  hdr(s,'第11题 — 坐标系中描点','坐标与图形');
  infoBox(s,'📋 题目',
    '在同一坐标系中画出下列点：A(-3,2)，B(1,-4)，C(-2,-2)，D(3,0)，E(1,4)，F(-2,2)，G(0,-3)',
    1.2, 0.72);
  const rows = [
    [{text:'点',options:{bold:true,color:WH,fill:DB}},
     {text:'坐标',options:{bold:true,color:WH,fill:DB}},
     {text:'横坐标（x）判断',options:{bold:true,color:WH,fill:DB}},
     {text:'纵坐标（y）判断',options:{bold:true,color:WH,fill:DB}},
     {text:'所在位置',options:{bold:true,color:WH,fill:DB}}],
    ['A','(-3, 2)','x=-3 < 0（左）','y=2 > 0（上）','第二象限'],
    ['B','(1, -4)', 'x=1  > 0（右）','y=-4 < 0（下）','第四象限'],
    ['C','(-2, -2)','x=-2 < 0（左）','y=-2 < 0（下）','第三象限'],
    ['D','(3, 0)',  'x=3  > 0','y=0（在轴上）','x 轴正半轴'],
    ['E','(1, 4)',  'x=1  > 0（右）','y=4 > 0（上）','第一象限'],
    ['F','(-2, 2)', 'x=-2 < 0（左）','y=2 > 0（上）','第二象限'],
    ['G','(0, -3)', 'x=0（在轴上）','y=-3 < 0','y 轴负半轴'],
  ];
  s.addTable(rows, { x:0.3, y:2.05, w:12.73, fontSize:13, fontFace:'Calibri',
    border:{pt:1,color:'CCCCCC'}, colW:[0.75,1.5,3.3,3.3,3.88], rowH:0.47,
    fill:{color:LG} });
  verdictCard(s, true,
    '✅  答案正确',
    '七点象限/轴位均判断正确，A、F 同在第二象限（y≠相同，为不同的点）。',
    5.72, 0.9);
  chkBar(s,'描点题：根据 x、y 正负判断象限，在轴上的点单独处理', true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  第12题  M(3a-8, a-1) 四种条件求坐标
// ═══════════════════════════════════════════════════════════════════════════════

// — P24  题目介绍 —
{
  const s = pptx.addSlide();
  hdr(s,'第12题 — 参数坐标按条件求值','坐标与图形');
  infoBox(s,'📋 题目',
    '已知 M(3a-8, a-1)，分别根据下列条件求 M 点的坐标：\n' +
    '① M 在 y 轴上\n' +
    '② M 在二、四象限角平分线上（即 OM 平分∠xOy 的反角，满足 x+y=0）\n' +
    '③ M 在第二象限且 a 为整数\n' +
    '④ N(3,-6)，MN∥x 轴',
    1.2, 1.7);
  infoBox(s,'💡 各小问核心知识',
    '① y 轴上的点：横坐标 = 0          ②  二、四象限角平分线：x + y = 0\n' +
    '③ 第二象限：x < 0 且 y > 0         ④  平行于 x 轴的两点：纵坐标相等',
    3.03, 1.0);
  chkBar(s,'各小问用不同坐标特征列方程，解出 a 再代回求 M 坐标', true);
}

// — P25  小问①②  —
{
  const s = pptx.addSlide();
  hdr(s,'第12题 — 小问①②','坐标与图形');
  qStrip(s,'M(3a-8, a-1)，① 在 y 轴上；② 在二、四象限角平分线上');
  stepCard(s,'①','M 在 y 轴上  →  横坐标 = 0',
    '3a - 8 = 0\n' +
    'a = 8/3\n' +
    '纵坐标 = a - 1 = 8/3 - 1 = 8/3 - 3/3 = 5/3\n' +
    '∴  M(0, 5/3)',
    1.72, 1.55, '3949AB');
  stepCard(s,'②','M 在二、四象限角平分线上  →  x + y = 0',
    '(3a-8) + (a-1) = 0\n' +
    '4a - 9 = 0\n' +
    'a = 9/4\n' +
    '横坐标 = 3×(9/4) - 8 = 27/4 - 32/4 = -5/4\n' +
    '纵坐标 = 9/4 - 1 = 9/4 - 4/4 = 5/4\n' +
    '验证：-5/4 + 5/4 = 0 ✓，且在第二象限（x<0, y>0）✓\n' +
    '∴  M(-5/4, 5/4)',
    3.37, 2.5, '3949AB');
  chkBar(s,'① M(0, 5/3)   ② M(-5/4, 5/4)', true);
}

// — P26  小问③④ —
{
  const s = pptx.addSlide();
  hdr(s,'第12题 — 小问③④','坐标与图形');
  qStrip(s,'M(3a-8, a-1)，③ 第二象限且 a 为整数；④ MN∥x轴，N(3,-6)');
  stepCard(s,'③','M 在第二象限且 a 为整数',
    '第二象限条件：横坐标 < 0  且  纵坐标 > 0\n' +
    '横坐标 < 0：3a - 8 < 0  →  a < 8/3 ≈ 2.67\n' +
    '纵坐标 > 0：a - 1 > 0   →  a > 1\n' +
    '综合：1 < a < 2.67，且 a 为整数  →  唯一解 a = 2\n' +
    '横坐标 = 3×2 - 8 = -2，纵坐标 = 2 - 1 = 1\n' +
    '∴  M(-2, 1)',
    1.72, 2.2, '3949AB');
  stepCard(s,'④','MN∥x 轴  →  纵坐标相等',
    'MN∥x 轴  →  y_M = y_N\n' +
    'a - 1 = -6  →  a = -5\n' +
    '横坐标 = 3×(-5) - 8 = -15 - 8 = -23\n' +
    '∴  M(-23, -6)',
    4.02, 1.8, '3949AB');
  chkBar(s,'③ M(-2, 1)   ④ M(-23, -6)', true);
}

// — P27  答案汇总 + 审核 —
{
  const s = pptx.addSlide();
  hdr(s,'第12题 — 答案汇总 & 审核','坐标与图形');
  qStrip(s,'M(3a-8, a-1)，四种条件');
  const rows = [
    [{text:'小问',options:{bold:true,color:WH,fill:DB}},
     {text:'条件',options:{bold:true,color:WH,fill:DB}},
     {text:'解得 a',options:{bold:true,color:WH,fill:DB}},
     {text:'M 的坐标',options:{bold:true,color:WH,fill:DB}}],
    ['①','M 在 y 轴','a = 8/3','M(0, 5/3)'],
    ['②','二四象限角平分线（x+y=0）','a = 9/4','M(-5/4, 5/4)'],
    ['③','第二象限，a 为整数','a = 2','M(-2, 1)'],
    ['④','MN∥x 轴，N(3,-6)','a = -5','M(-23, -6)'],
  ];
  s.addTable(rows, { x:0.3, y:1.72, w:12.73, fontSize:14, fontFace:'Calibri',
    border:{pt:1,color:'CCCCCC'}, colW:[0.8,4.3,2.5,5.13], rowH:0.58,
    fill:{color:LG} });
  verdictCard(s, true,
    '✅  四小问全部正确',
    '① M(0,5/3) ✓   ② M(-5/4,5/4) ✓   ③ M(-2,1) ✓   ④ M(-23,-6) ✓\n' +
    '各小问均正确利用坐标特征列方程求解，过程规范。',
    4.88, 1.25);
  chkBar(s,'答案：① M(0,5/3)  ② M(-5/4,5/4)  ③ M(-2,1)  ④ M(-23,-6)  全部正确 ✓', true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  第13题  M(|m|, n) mn≠0 在第几象限
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  hdr(s,'第13题 — 绝对值坐标判断象限','坐标与图形');
  infoBox(s,'📋 题目',
    '已知 M(|m|, n) 且 mn ≠ 0，M 在第几象限？',
    1.2, 0.72);
  stepCard(s,1,'由 mn≠0 推出 m、n 各自非零',
    'mn ≠ 0  →  m ≠ 0  且  n ≠ 0',
    2.05, 0.85);
  stepCard(s,2,'分析横坐标 |m| 的符号',
    '|m| 是 m 的绝对值；由于 m ≠ 0，所以 |m| > 0\n→  横坐标恒为正数，M 一定在 y 轴右侧',
    3.0, 1.05);
  stepCard(s,3,'分析纵坐标 n 的符号（分两种情况）',
    '情况A：n > 0  →  横 > 0，纵 > 0  →  第一象限\n' +
    '情况B：n < 0  →  横 > 0，纵 < 0  →  第四象限\n' +
    '（n 的正负无法从题目确定，两种情况都可能）',
    4.15, 1.35);
  ansBox(s,'M 在第一象限  或  第四象限', 1.5, 5.65, 10.33, 0.85);
  verdictCard(s, true,
    '✅  答案正确',
    '横坐标 |m|>0 恒成立，纵坐标 n 符号不确定 → 两种象限均需列出。',
    6.62, 0.78);
  chkBar(s,'答案：第一象限或第四象限（n 的符号决定，不能只写一个）  ✓', true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  第14题  M(a,a-b) 在第四象限 → Q(b,-a) 在第几象限
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  hdr(s,'第14题 — 象限条件推断','坐标与图形');
  infoBox(s,'📋 题目',
    '若 M(a, a-b) 在第四象限，那么 Q(b, -a) 在第几象限？',
    1.2, 0.72);
  stepCard(s,1,'由 M 在第四象限，建立不等式',
    '第四象限条件：横坐标 > 0  且  纵坐标 < 0\n' +
    '横坐标 a > 0\n' +
    '纵坐标 a - b < 0  →  b > a',
    2.05, 1.3);
  stepCard(s,2,'综合推断 a、b 的符号',
    '由 a > 0  且  b > a\n→  b > a > 0  →  b > 0\n→  综合：a > 0，b > 0',
    3.45, 1.1);
  stepCard(s,3,'判断 Q(b, -a) 的象限',
    '横坐标 b > 0（正）\n' +
    '纵坐标 -a < 0（因 a > 0，所以 -a < 0）（负）\n' +
    '→  横正纵负  →  第四象限',
    4.65, 1.2);
  ansBox(s,'Q 在第四象限', 3.5, 5.97, 6.33, 0.85);
  verdictCard(s, true,
    '✅  答案正确',
    'Q(b,-a)：b>0，-a<0，第四象限 ✓',
    6.94, 0.72);
  chkBar(s,'答案：Q 在第四象限  ✓', true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  第15题  PQ∥y 轴求 m
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  hdr(s,'第15题 — 平行于坐标轴的条件','坐标与图形');
  infoBox(s,'📋 题目',
    '若 P(3+m, 2h) 与 Q(2m-3, 3n+1)，且 PQ∥y 轴，求 m（和 n）的值。',
    1.2, 0.72);
  stepCard(s,1,'PQ∥y 轴的充要条件',
    'PQ∥y 轴  ⟺  P、Q 两点横坐标相等（且 P、Q 不重合）\n' +
    '→  3 + m = 2m - 3',
    2.05, 1.1);
  stepCard(s,2,'解方程求 m',
    '3 + m = 2m - 3\n' +
    '3 + 3 = 2m - m\n' +
    '6 = m\n' +
    '∴  m = 6',
    3.25, 1.1);
  stepCard(s,3,'关于 n 的说明',
    '题目中含参数 h 和 n；PQ∥y 轴的条件只涉及横坐标（m），\n' +
    '纵坐标 2h 与 3n+1 无约束（只需不相等以保证 P、Q 不重合）。\n' +
    '故 n 无法由题目给定条件唯一确定。',
    4.45, 1.3);
  ansBox(s,'m = 6\n（n 无法由题目条件唯一确定）', 2.0, 5.87, 9.33, 1.0);
  verdictCard(s, true,
    '✅  答案正确',
    'm = 6 ✓；solver 正确指出 n 无法确定，处理规范。',
    6.98, 0.72);
  chkBar(s,'答案：m = 6（n 不可唯一确定）  ✓', true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  第16题  P 在第四象限，化简绝对值表达式
// ═══════════════════════════════════════════════════════════════════════════════

// — P32  题目 + 条件分析 —
{
  const s = pptx.addSlide();
  hdr(s,'第16题 — 利用象限条件化简绝对值','坐标与图形');
  infoBox(s,'📋 题目',
    '若 P(4x-5, 3-x) 在第四象限，化简：|5-4x| - |x-3|',
    1.2, 0.72);
  stepCard(s,1,'利用第四象限条件确定 x 的范围',
    '第四象限：横坐标 > 0  且  纵坐标 < 0\n\n' +
    '横坐标 4x-5 > 0  →  x > 5/4\n' +
    '纵坐标 3-x  < 0  →  x > 3\n\n' +
    '取交集：x > 3',
    2.05, 2.1);
  stepCard(s,2,'在 x > 3 时，判断各绝对值内表达式的符号',
    '当 x > 3 时：\n' +
    '  4x > 12 > 5  →  5 - 4x < 0\n' +
    '  x > 3        →  x - 3 > 0',
    4.25, 1.55);
  chkBar(s,'关键：先用象限条件缩小 x 范围，再分析绝对值内的正负', true);
}

// — P33  化简过程 + 答案 + 审核 —
{
  const s = pptx.addSlide();
  hdr(s,'第16题 — 化简过程 & 结果','坐标与图形');
  qStrip(s,'x > 3 时，化简 |5-4x| - |x-3|');
  stepCard(s,3,'去绝对值符号',
    '|5-4x| = -(5-4x) = 4x-5          （因为 5-4x < 0）\n' +
    '|x-3|  = x-3                       （因为 x-3 > 0）',
    1.72, 1.05);
  stepCard(s,4,'合并化简',
    '|5-4x| - |x-3|\n' +
    '= (4x-5) - (x-3)\n' +
    '= 4x - 5 - x + 3\n' +
    '= 3x - 2',
    2.87, 1.3);
  ansBox(s,'3x - 2', 4.0, 4.3, 5.33, 1.0);
  verdictCard(s, true,
    '✅  答案正确',
    '化简结果 3x-2 ✓；象限条件推导和去绝对值过程均正确。',
    5.42, 0.9);
  chkBar(s,'答案：3x - 2  ✓', true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  第17题  P、Q 三种对称关系求 x、y
// ═══════════════════════════════════════════════════════════════════════════════

// — P34  题目介绍 —
{
  const s = pptx.addSlide();
  hdr(s,'第17题 — 坐标系中点的对称关系','坐标与图形');
  infoBox(s,'📋 题目',
    '已知 P(2x+3, 3-y)，Q(y+4, x-5)，若 P、Q 满足以下对称关系，分别求 x、y：\n' +
    '① 关于 x 轴对称   ② 关于 y 轴对称   ③ 关于原点对称',
    1.2, 1.1);
  infoBox(s,'💡 对称坐标关系汇总',
    '① 关于 x 轴对称：横坐标相等，纵坐标互为相反数\n' +
    '   (a, b) 与 (a, -b) 关于 x 轴对称\n\n' +
    '② 关于 y 轴对称：横坐标互为相反数，纵坐标相等\n' +
    '   (a, b) 与 (-a, b) 关于 y 轴对称\n\n' +
    '③ 关于原点对称：横坐标互为相反数，纵坐标互为相反数\n' +
    '   (a, b) 与 (-a, -b) 关于原点对称',
    2.43, 2.55);
  chkBar(s,'每种情况列二元一次方程组，联立求 x、y', true);
}

// — P35  小问① 关于 x 轴 —
{
  const s = pptx.addSlide();
  hdr(s,'第17题 — ① 关于 x 轴对称','坐标与图形');
  qStrip(s,'P(2x+3, 3-y)  与  Q(y+4, x-5) 关于 x 轴对称');
  stepCard(s,1,'列方程组（横坐标相等，纵坐标互为相反数）',
    '横坐标相等：    2x+3 = y+4       … 方程(i)\n' +
    '纵坐标互为相反数：3-y = -(x-5)   … 方程(ii)',
    1.72, 1.1);
  stepCard(s,2,'解方程组',
    '由 (ii)：3-y = -x+5  →  x - y = 2  →  x = y + 2\n' +
    '代入 (i)：2(y+2)+3 = y+4\n' +
    '         2y+4+3 = y+4\n' +
    '         2y+7 = y+4\n' +
    '         y = -3，x = y+2 = -1',
    2.92, 1.5);
  stepCard(s,'✓','代入验证',
    'P = (2×(-1)+3, 3-(-3)) = (1, 6)\n' +
    'Q = ((-3)+4, (-1)-5) = (1, -6)\n' +
    'P(1,6) 与 Q(1,-6) 横坐标相同，纵坐标互为相反数 → 关于 x 轴对称  ✓',
    4.52, 1.4, GR);
  ansBox(s,'x = -1，y = -3', 3.5, 6.05, 6.33, 0.85);
  chkBar(s,'① x = -1，y = -3  ✓', true);
}

// — P36  小问② 关于 y 轴 —
{
  const s = pptx.addSlide();
  hdr(s,'第17题 — ② 关于 y 轴对称','坐标与图形');
  qStrip(s,'P(2x+3, 3-y)  与  Q(y+4, x-5) 关于 y 轴对称');
  stepCard(s,1,'列方程组（横坐标互为相反数，纵坐标相等）',
    '横坐标互为相反数：2x+3 = -(y+4)   … 方程(iii)\n' +
    '纵坐标相等：      3-y  = x-5       … 方程(iv)',
    1.72, 1.1);
  stepCard(s,2,'解方程组',
    '由 (iv)：3-y = x-5  →  x = 8-y\n' +
    '代入 (iii)：2(8-y)+3 = -(y+4)\n' +
    '           16-2y+3 = -y-4\n' +
    '           19-2y = -y-4\n' +
    '           -y = -23\n' +
    '           y = 23，x = 8-23 = -15',
    2.92, 1.8);
  stepCard(s,'✓','代入验证',
    'P = (2×(-15)+3, 3-23) = (-27, -20)\n' +
    'Q = (23+4, -15-5) = (27, -20)\n' +
    'P(-27,-20) 与 Q(27,-20) 横坐标互为相反数，纵坐标相同 → 关于 y 轴对称  ✓',
    4.82, 1.3, GR);
  ansBox(s,'x = -15，y = 23', 3.5, 6.25, 6.33, 0.82);
  chkBar(s,'② x = -15，y = 23  ✓', true);
}

// — P37  小问③ 关于原点 —
{
  const s = pptx.addSlide();
  hdr(s,'第17题 — ③ 关于原点对称','坐标与图形');
  qStrip(s,'P(2x+3, 3-y)  与  Q(y+4, x-5) 关于原点对称');
  stepCard(s,1,'列方程组（横、纵坐标各互为相反数）',
    '横坐标互为相反数：2x+3 = -(y+4)   … 方程(v)\n' +
    '纵坐标互为相反数：3-y  = -(x-5)   … 方程(vi)',
    1.72, 1.1);
  stepCard(s,2,'解方程组',
    '由 (vi)：3-y = -x+5  →  x = y+2\n' +
    '代入 (v)：2(y+2)+3 = -(y+4)\n' +
    '         2y+7 = -y-4\n' +
    '         3y = -11\n' +
    '         y = -11/3，x = y+2 = -11/3+6/3 = -5/3',
    2.92, 1.6);
  stepCard(s,'✓','代入验证',
    'P = (2×(-5/3)+3, 3-(-11/3)) = (-10/3+9/3, 9/3+11/3) = (-1/3, 20/3)\n' +
    'Q = ((-11/3)+4, (-5/3)-5) = (-11/3+12/3, -5/3-15/3) = (1/3, -20/3)\n' +
    'P(-1/3,20/3) 与 Q(1/3,-20/3) 两坐标均互为相反数 → 关于原点对称  ✓',
    4.62, 1.5, GR);
  ansBox(s,'x = -5/3，y = -11/3', 3.5, 6.25, 6.33, 0.82);
  chkBar(s,'③ x = -5/3，y = -11/3  ✓', true);
}

// — P38  答案汇总 + 审核 —
{
  const s = pptx.addSlide();
  hdr(s,'第17题 — 答案汇总 & 审核','坐标与图形');
  qStrip(s,'P(2x+3, 3-y)，Q(y+4, x-5)，三种对称关系');
  const rows = [
    [{text:'对称关系',options:{bold:true,color:WH,fill:DB}},
     {text:'方程组特征',options:{bold:true,color:WH,fill:DB}},
     {text:'x',options:{bold:true,color:WH,fill:DB}},
     {text:'y',options:{bold:true,color:WH,fill:DB}},
     {text:'验证',options:{bold:true,color:WH,fill:DB}}],
    ['① 关于 x 轴','横坐标=，纵坐标反','-1','-3','P(1,6) Q(1,-6) ✓'],
    ['② 关于 y 轴','横坐标反，纵坐标=','-15','23','P(-27,-20) Q(27,-20) ✓'],
    ['③ 关于原点', '横、纵均反','-5/3','-11/3','P(-1/3,20/3) Q(1/3,-20/3) ✓'],
  ];
  s.addTable(rows, { x:0.3, y:1.72, w:12.73, fontSize:13, fontFace:'Calibri',
    border:{pt:1,color:'CCCCCC'}, colW:[2.5,3.2,1.4,1.6,4.03], rowH:0.6,
    fill:{color:LG} });
  verdictCard(s, true,
    '✅  三小问全部正确',
    '① x=-1,y=-3 ✓   ② x=-15,y=23 ✓   ③ x=-5/3,y=-11/3 ✓\n解题过程规范，方程组建立及求解均正确，均已代入验证。',
    4.35, 1.35);
  chkBar(s,'答案：① x=-1,y=-3   ② x=-15,y=23   ③ x=-5/3,y=-11/3   全部正确 ✓', true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  第18题  关于竖直直线 x=1 的对称点
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  hdr(s,"第18题 — 关于直线的对称点坐标",'坐标与图形');
  infoBox(s,'📋 题目',
    "在平面直角坐标系中，AB 是过 (1,0) 且垂直于 x 轴的平面镜，\n点 P(3,2) 在 AB 中的像 P' 的坐标为___。",
    1.2, 0.88);
  stepCard(s,1,'确定直线 AB 的方程',
    "AB 过 (1,0) 且垂直于 x 轴  →  AB 是直线 x = 1",
    2.22, 0.88);
  stepCard(s,2,'写出关于直线 x = k 对称点的坐标公式',
    "关于竖直直线 x = k 对称：\n  纵坐标不变：y' = y\n  横坐标：x' = 2k - x  （P 和 P' 关于直线等距）",
    3.2, 1.2);
  stepCard(s,3,"代入 P(3,2) 和 k=1 求 P'",
    "x' = 2×1 - 3 = 2 - 3 = -1\ny' = 2（不变）\n∴  P'(-1, 2)",
    4.5, 1.05);
  stepCard(s,'✓',"自查：验证 P 与 P' 的中点在直线 x=1 上",
    "P(3,2) 与 P'(-1,2) 的中点 = ((3+(-1))/2, (2+2)/2) = (1, 2)\n中点横坐标 = 1，确实在直线 x=1 上  ✓",
    5.65, 1.15, GR);
  ansBox(s,"P'(-1, 2)", 4.0, 6.93, 5.33, 0.72);
  chkBar(s,"答案：P'(-1, 2)  ✓", true);
}

// — 审核页 18 —
{
  const s = pptx.addSlide();
  hdr(s,"第18题 — 审核结果",'math-verifier', GR);
  qStrip(s,"AB 是直线 x=1，P(3,2) 在 AB 中的像");
  verdictCard(s, true,
    "✅  答案正确，过程规范",
    "P'(-1, 2) 验证：\n" +
    "  P(3,2) 到直线 x=1 的距离 = |3-1| = 2\n" +
    "  P'(-1,2) 到直线 x=1 的距离 = |-1-1| = 2  ✓\n" +
    "  P 与 P' 的中点 = (1,2) 在直线 x=1 上  ✓",
    1.72, 2.4);
  infoBox(s,'📌 知识点归纳',
    '关于竖直直线 x=k 对称：\n' +
    '  P(a, b)  →  P\'(2k-a, b)\n' +
    '关于水平直线 y=k 对称：\n' +
    '  P(a, b)  →  P\'(a, 2k-b)',
    4.25, 1.65);
  chkBar(s,"答案：P'(-1, 2)  ✓  解题方法正确", true);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  最终页  总体审核报告
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  hdr(s,'总体审核报告','math-verifier', GR);
  s.addShape(pptx.ShapeType.rect, { x:0, y:1.05, w:'100%', h:0.45, fill:{color:LGR} });
  s.addText('审核结论：14道题答案全部正确（准确率 100%），存在3处方法/完整性问题', {
    x:0.35, y:1.07, w:12.6, h:0.41,
    fontSize:14, bold:true, color:GR, fontFace:'Calibri', valign:'middle' });

  const rows = [
    [{text:'题号',options:{bold:true,color:WH,fill:DB}},
     {text:'答案',options:{bold:true,color:WH,fill:DB}},
     {text:'结论',options:{bold:true,color:WH,fill:DB}},
     {text:'问题说明',options:{bold:true,color:WH,fill:DB}}],
    ['第7题','✓ 正确',{text:'⚠️ 方法超纲',options:{color:AM}},
     '使用求根公式（九年级），七年级应分情况去绝对值'],
    ['第8题','✓ 正确',{text:'⚠️ 不完整',options:{color:AM}},
     '只给出一种情况，应穷举四种方向组合'],
    ['第9题/变1','✓ 正确',{text:'⚠️ 表述超纲',options:{color:AM}},
     '使用"向量"概念（高中），建议改用坐标差法表述'],
    ['变2题','✓ 正确',{text:'✅ 完整正确',options:{color:GR}},
     '三种情况全部列出，分情况讨论完整'],
    ['第10题','✓ 正确',{text:'✅ 正确',options:{color:GR}},'—'],
    ['第11题','✓ 正确',{text:'✅ 正确',options:{color:GR}},'—'],
    ['第12题','✓ 正确',{text:'✅ 正确',options:{color:GR}},'四小问均正确'],
    ['第13题','✓ 正确',{text:'✅ 正确',options:{color:GR}},'两个象限均列出'],
    ['第14题','✓ 正确',{text:'✅ 正确',options:{color:GR}},'—'],
    ['第15题','✓ 正确',{text:'✅ 正确',options:{color:GR}},'正确指出 n 不可唯一确定'],
    ['第16题','✓ 正确',{text:'✅ 正确',options:{color:GR}},'象限条件推导规范'],
    ['第17题','✓ 正确',{text:'✅ 正确',options:{color:GR}},'三小问方程组均正确'],
    ['第18题','✓ 正确',{text:'✅ 正确',options:{color:GR}},'对称公式应用正确'],
  ];
  s.addTable(rows, { x:0.3, y:1.55, w:12.73, fontSize:12, fontFace:'Calibri',
    border:{pt:1,color:'CCCCCC'}, colW:[1.6,1.4,1.9,7.83], rowH:0.36,
    fill:{color:LG} });

  s.addShape(pptx.ShapeType.rect,
    { x:0.3, y:6.65, w:12.73, h:0.65, fill:{color:DB} });
  s.addText(
    '总结：答题准确率 100%  |  提升方向：① 七年级规范方法  ② 穷举多解情况  ③ 避免超纲表述',
    { x:0.45, y:6.67, w:12.5, h:0.61,
      fontSize:13, color:WH, fontFace:'Calibri', bold:true, valign:'middle' });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Save
// ═══════════════════════════════════════════════════════════════════════════════
pptx.writeFile({
  fileName: 'C:\\work\\claude\\math-agent\\20260412\\解题报告_20260412.pptx'
}).then(() => {
  console.log('✅  PPT 生成成功：20260412/解题报告_20260412.pptx');
}).catch(err => {
  console.error('❌  生成失败:', err);
  process.exit(1);
});
