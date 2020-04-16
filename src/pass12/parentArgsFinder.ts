import { Finder } from '../pass';
import { Namespace, Class, FunctionMeta, FieldMeta } from '../type';
import * as estree from 'estree';
import * as estraverse from 'estraverse';

export class ParentArgsFinder extends Finder {
    public find(_: estree.Program, context: Namespace): void {
        this.findClasses(context);
    }

    private findClasses(namespace: Namespace): void {
        for (const ns of namespace.namespaces) {
            this.findClasses(ns);
        }
        for (const clazz of namespace.classes) {
            this.checkParents(clazz);
        }
    }

    private checkParents(clazz: Class): void {
        for (const func of clazz.functions) {
            this.extendParents(func.name, func.argNames.length, clazz);
        }
    }

    private extendParents(name: string, count: number, root: Class): void {
        let node = root.parent;
        while (node && node.parent !== node) {
            const func = node.functions.find((f): boolean => f.name === name);
            if (func) {
                if (func.argNames.length < count) {
                    for (let i = func.argNames.length; i < count; i++) {
                        func.argNames.push('_usedInChild' + i);
                    }
                }
            }

            node = node.parent;
        }
    }
}