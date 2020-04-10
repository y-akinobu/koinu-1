import { PAsm, ParseTree } from 'pegtree';
import { PEG as CJ } from './cj'

const CJGrammar = CJ()
const CJParser = PAsm.generate(CJGrammar, 'Sentence');

const parse = (s: string) => {
  const t = CJParser(s)
  console.log(t.dump())
}


parse('私は昨日公園に行った')
//PAsm.example(CJGrammar, 'Sentence', '吾輩は猫である')