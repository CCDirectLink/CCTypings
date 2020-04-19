import * as fs from 'fs';
import * as acorn from 'acorn';
import * as estree from 'estree';
import { ClassFinder } from './pass1/classFinder';
import { PropFinder } from './pass2/propFinder';
import { FunctionFinder } from './pass3/functionFinder';
import { CtorFinder } from './pass4/ctorFinder';
import { VoidFinder } from './pass5/voidFinder';
import { FieldFinder } from './pass6/fieldFinder';
import { FieldInitFinder } from './pass7/fieldInitFinder';
import { ClassFieldNewFinder } from './pass8/classFieldNewFinder';
import { StaticClassFinder } from './pass9/staticClass';
import { ParentFinder } from './pass10/parentFinder';
import { KnownUnkownFinder } from './pass11/knownUnknownFinder';
import { ParentArgsFinder } from './pass12/parentArgsFinder';
import { HardcodedFinder } from './pass13/hardcodedFinder';
import { Namespace } from './type';
import { Formatter } from './output';
import { Finder } from './pass';

const code = fs.readFileSync('game.compiled.js', 'utf8');
const ast = acorn.parse(code) as unknown as estree.Program;

const passes: Finder[] = [
    new ClassFinder(),
    new PropFinder(),
    new FunctionFinder(),
    new CtorFinder(),
    new VoidFinder(),
    new FieldFinder(),
    new FieldInitFinder(),
    new ClassFieldNewFinder(),
    new StaticClassFinder(),
    new ParentFinder(),
    new KnownUnkownFinder(),
    new ParentArgsFinder(),
    new HardcodedFinder(),
];

const context = new Namespace('window');
for (const pass of passes) {
    pass.find(ast, context);
}

const formatter = new Formatter();
formatter.print('output.d.ts', context);