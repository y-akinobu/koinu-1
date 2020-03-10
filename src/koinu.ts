import { PAsm, ParseTree } from 'pegtree';
import { PEG as CJ } from './cj'

type dict = { [key: string]: [string | undefined, any] }

const D: dict = {
  '色': ['fillStyle', undefined],
  '赤': [undefined, '#e60033'],
  '跳ねる': ['restitution', 0.8],
  '固定': ['isStatic', true]
}



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
}

class Token extends Expr {
  x: string
  constructor(x: string) {
    super()
    this.x = x;
  }
  conv(D: dict) {
    return D[this.x];
  }
}

const test = (e: Expr) => {
  const code = e.conv(D);
  console.log(code);
}

test(new Let('色', new More('赤')))
test(new Token('跳ねる'))
test(new Not(new Token('固定')))

const CJGrammar = CJ()
const CJParser = PAsm.generate(CJGrammar, 'Sentence');

const parse = (s: string) => {
  const t = CJParser(s)
  // t.gettag でタグが出てくる
  console.log(t.dump())
}

parse('色は赤い')
parse('色は赤い')
parse('色は赤く、跳ねる')

//PAsm.example(CJGrammar, 'Sentence', '吾輩は猫である')

