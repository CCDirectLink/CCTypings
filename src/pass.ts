import * as estree from 'estree';
import { Namespace } from './type';

export abstract class Finder {
    public abstract find(ast: estree.Program, context: Namespace): void;
}