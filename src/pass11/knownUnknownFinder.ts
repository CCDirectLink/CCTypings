import { Finder } from '../pass';
import { Namespace, Class, FunctionMeta, FieldMeta } from '../type';
import * as estree from 'estree';
import * as estraverse from 'estraverse';

export class KnownUnkownFinder extends Finder {
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
        let node = clazz.parent;
        while (node && node.parent !== node) {
            for (let i = 0; i < node.fields.length; i++) {
                const field = node.fields[i];
                if (this.isUnknown(field)) {
                    const replacement = this.resolveName(field.name, clazz);
                    if (replacement) {
                        if (replacement instanceof FieldMeta) {
                            field.type = replacement.type;
                        } else if (replacement instanceof FunctionMeta) {
                            node.fields.splice(i, 1);
                            i--;
                            node.functions.push(replacement);
                        }
                    }
                }
            }

            node = node.parent;
        }
    }

    private resolveName(name: string, root: Class): FieldMeta | FunctionMeta | undefined {
        let node: Class | undefined = root;
        while (node && node.parent !== node) {
            const field = node.fields.find((f): boolean => f.name === name);
            if (field && !this.isUnknown(field)) {
                return field;
            }

            const func = node.functions.find((f): boolean => f.name === name);
            if (func) {
                return func;
            }

            node = node.parent;
        }
    }

    private isUnknown(field: FieldMeta): boolean {
        return !field.type || field.type === 'any';
    }
}