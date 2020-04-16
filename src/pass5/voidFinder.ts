import { Finder } from '../pass';
import { Namespace, Class, FunctionMeta } from '../type';
import * as estree from 'estree';
import * as estraverse from 'estraverse';

export class VoidFinder extends Finder {
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
        for (const func of clazz.functions) {
            this.checkFunction(func);
        }
    }

    private checkFunction(func: FunctionMeta): void {
        let result = true;
        estraverse.traverse(func.src, {
            enter: (node): estraverse.VisitorOption | undefined => {
                if (node.type === 'ReturnStatement') {
                    result = false;
                    return estraverse.VisitorOption.Break;
                }
            }
        });

        if (result) {
            func.returnType = 'void';
        }
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