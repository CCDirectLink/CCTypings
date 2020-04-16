import { Finder } from '../pass';
import { Namespace, Class, FunctionMeta, FieldMeta } from '../type';
import * as estree from 'estree';
import * as estraverse from 'estraverse';

export class ParentFinder extends Finder {
    public find(_: estree.Program, context: Namespace): void {
        this.walkNamespace(context, context)
    }

    private walkNamespace(ns: Namespace, context: Namespace): void {
        for (const sub of ns.namespaces) {
            this.walkNamespace(sub, context);
        }

        for (const clazz of ns.classes) {
            this.resolveParent(clazz, context);
        }
    }

    private resolveParent(clazz: Class, context: Namespace): void {
        if (clazz.parent || !clazz.parentName) {
            return;
        }

        clazz.parent = this.resolveClass(clazz.parentName, context);
    }

    private resolveClass(name: string[], context: Namespace): Class | undefined {
        let node: Namespace = context;
        for (const part of name.slice(0, name.length - 1)) {
            const tmpNode = node.namespaces.find((ns): boolean => ns.name === part);
            if (!tmpNode) {
                return;
            }
            node = tmpNode;
        }

        const lastName = name[name.length - 1];
        return node.classes.find((clazz): boolean => clazz.name === lastName);
    }
}