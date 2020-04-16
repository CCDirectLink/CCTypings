import { Finder } from '../pass';
import { Namespace, Class, FunctionMeta } from '../type';
import * as estree from 'estree';

export class FunctionFinder extends Finder {
    public find(_: estree.Program, context: Namespace): void {
        this.findClasses(context);
    }

    private findClasses(namespace: Namespace): void {
        for (const ns of namespace.namespaces) {
            this.findClasses(ns);
        }
        for (const clazz of namespace.classes) {
            this.findFunctions(clazz);
        }
    }

    private findFunctions(clazz: Class): void {
        for (const [name, init] of clazz.properties) {
            if (init.type === 'FunctionExpression') {
                clazz.functions.push(this.buildFuncMeta(name, init));
            }
        }
    }

    private buildFuncMeta(name: string, init: estree.FunctionExpression): FunctionMeta {
        const result = new FunctionMeta(name, init);
        for (const arg of init.params) {
            result.argNames.push(this.getName(arg))
        }
        return result;
    }

    private getName(pattern: estree.Pattern): string {
        switch(pattern.type) {
            case 'Identifier':
                return pattern.name;
            default:
                debugger;
                return '';
        }
    }
}