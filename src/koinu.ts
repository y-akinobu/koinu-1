import { PAsm, ParseTree } from 'pegtree';
import { PEG as CJ } from './cj'

type dict = { [key: string]: [string | undefined, any] }

const D: dict = {
  '色': ['fillStyle', undefined],
  '赤': [undefined, '#e60033'],
  '跳ね': ['restitution', 0.8],
  '固定': ['isStatic', true]
}

const MoreWords: string[] = [
  'よく', 'とても', 'すごく'
];

const LessWords: string[] = [
  'あまり', '少し', 'ちょっとだけ'
];


class Expr {
  conv(D: dict): [string | undefined, any] {
    return [undefined, undefined]
  }
}

const toExpr = (e: Expr | string) => {
  if (typeof e === 'string') {
    return new Token(e);
  }
  return e;
}

class Token extends Expr {
  x: string
  constructor(x: string) {
    super()
    this.x = x;
  }
  conv(D: dict): [string | undefined, any] {
    const kv = D[this.x];
    if (kv === undefined) {
      return ['undefined', this.x];
    }
    return kv;
  }
  public toString() {
    return `'${this.x}'`;
  }
}

class Let extends Expr {
  e1: Expr
  e2: Expr
  constructor(e1: Expr | string, e2: Expr | string) {
    super()
    this.e1 = toExpr(e1)
    this.e2 = toExpr(e2)
  }
  conv(D: dict): [string | undefined, any] {
    const kv1 = this.e1.conv(D);
    const kv2 = this.e2.conv(D);
    return [kv1[0], kv2[1]];
  }
  public toString() {
    return `Let(${this.e1},${this.e2})`;
  }
}

class More extends Expr {
  e: Expr
  constructor(e: Expr | string) {
    super()
    this.e = toExpr(e)
  }
  conv(D: dict): [string | undefined, any] {
    const kv = this.e.conv(D);
    if (typeof kv[1] === 'number') {
      return [kv[0], kv[1] * 1.25]
    }
    return kv;
  }
  public toString() {
    return `More(${this.e})`;
  }
}

class Less extends Expr {
  e: Expr
  constructor(e: Expr) {
    super()
    this.e = e
  }
  conv(D: dict): [string | undefined, any] {
    const kv = this.e.conv(D);
    if (typeof kv[1] === 'number') {
      return [kv[0], kv[1] * 0.75]
    }
    return kv;
  }
  public toString() {
    return `Less(${this.e})`;
  }
}

class Not extends Expr {
  e: Expr
  constructor(e: Expr) {
    super()
    this.e = e
  }
  conv(D: dict): [string | undefined, any] {
    const kv = this.e.conv(D);
    if (typeof kv[1] === 'boolean') {
      return [kv[0], !kv[1]]
    }
    return kv;
  }
  public toString() {
    return `Not(${this.e})`;
  }
}

const test = (e: Expr) => {
  const code = e.conv(D);
  console.log(code);
}

// test(new Let('色', new More('赤')))
// test(new Token('跳ねる'))
// test(new Not(new Token('固定')))

const CJGrammar = CJ()
const CJParser = PAsm.generate(CJGrammar, 'Sentence');

class Koinu {
  expressions: Expr[] = [];

  visit(t: ParseTree): Expr {
    const tag = t.gettag();
    const self = this as any;
    if (tag in self) {
      return (this as any)[tag](t)
    }
    //console.log(`TODO: ${tag}`);
    if (t.subNodes().length > 0) {
      return this.visitFirst(t);
    }
    return this.visitToken(t);
  }

  visitFirst(t: ParseTree) {
    return this.visit(t.subNodes()[0]);
  }

  visitToken(t: ParseTree) {
    return new Token(t.toString());
  }

  S(t: ParseTree) {
    var prev: Expr | null = null;
    for (const node of t.subNodes()) {
      if (node.is('')) continue;
      const expr = this.visit(node);
      prev = this.merge(prev, expr);
      //console.log(node.dump());
    }
    if (prev !== null) {
      this.expressions.push(prev);
    }
  }

  merge(prev: Expr | null, cur: Expr): Expr | null {
    if (prev === null) {
      return cur;
    }
    if (prev instanceof Let) {
      prev.e2 = cur;
      this.expressions.push(prev);
      return null;
    }
    if (this.isMoreWord(prev)) {
      this.expressions.push(new More(cur));
      return null;
    }
    if (this.isLessWord(prev)) {
      this.expressions.push(new More(cur));
      return null;
    }
    this.expressions.push(prev);
    return cur;
  }


  isMoreWord(e: Expr) {
    if (e instanceof Token) {
      if (MoreWords.indexOf(e.x) !== -1) {
        return true;
      }
    }
    return false;
  }

  isLessWord(e: Expr) {
    if (e instanceof Token) {
      if (LessWords.indexOf(e.x) !== -1) {
        return true;
      }
    }
    return false;
  }


  Subject(t: ParseTree) {
    return new Let(this.visitFirst(t), '_');
  }

  Not(t: ParseTree) {
    return new Not(this.visitFirst(t));
  }

  conv(D: dict) {
    for (const e of this.expressions) {
      console.log(`${e} => ${e.conv(D)}`);
    }
  }

}

const parse = (s: string) => {
  const t = CJParser(s)
  // t.gettag でタグが出てくる
  const koinu = new Koinu();
  console.log(t.dump());
  koinu.visit(t);
  koinu.conv(D);
}

// parse('色は赤い')
// parse('色は赤い')
parse('色は赤く、よく跳ねる')
// parse('吾輩は猫である')
// parse('吾輩は猫でした')

//PAsm.example(CJGrammar, 'Sentence', '吾輩は猫である')

