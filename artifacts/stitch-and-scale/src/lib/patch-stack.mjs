import { readFileSync, writeFileSync } from 'fs';
const p = 'src/lib/marketplace-takerate-lab.ts';
let s = readFileSync(p, 'utf8');
s = s.replace("} catch (e) { console.error('FLAG-SECTION-ERROR', String(e)); }",
  "} catch (e) { console.error('FLAG-SECTION-ERROR', e.stack ? e.stack.split('\n').slice(0,6).join(' | ') : String(e)); }");
writeFileSync(p, s);
console.log('patched stack');
