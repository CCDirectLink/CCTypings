import { Finder } from '../pass';
import { Namespace, Class, FunctionMeta, FieldMeta } from '../type';
import * as estree from 'estree';
import * as estraverse from 'estraverse';

export class ClassFieldNewFinder extends Finder {
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
            this.checkFunction(clazz, func);
        }
    }

    private checkFunction(clazz: Class, func: FunctionMeta): void {
        estraverse.traverse(func.src, {
            enter: (node): void => {
                if (node.type === 'AssignmentExpression') {
                    const field = this.getClassField(clazz, node);
                    if (field) {
                        const type = this.getNewExpression(node);
                        if (type) {
                            field.type = type;
                        }
                    }
                }
            }
        });
    }

    private getClassField(clazz: Class, node: estree.AssignmentExpression): FieldMeta | undefined {
        if (node.left.type === 'MemberExpression'
        && node.left.object.type === 'ThisExpression'
        && node.left.property.type === 'Identifier') {
            const name = node.left.property.name;
            return clazz.fields.find((f): boolean => f.name === name);
        }
    }

    private getNewExpression(node: estree.AssignmentExpression): string | undefined {
        if (node.right.type === 'NewExpression') {
            try {
                const name = this.getName(node.right);
                if (name.startsWith('window.')) {
                    return name.substr('window.'.length);
                }
                if (name.length === 1 || name.includes('createFromJson')) {
                    return;
                }
                return name;
            } catch (ex) {
                if (ex !== 'Computed') {
                    throw ex;
                }
            }
        }
    }

    private getName(node: estree.Node): string {
        switch(node.type) {
            case "NewExpression":
                return this.getName(node.callee);
            case "Identifier":
                return node.name;
            case "MemberExpression":
                if (node.computed && node.object.type !== 'Literal') {
                    throw 'Computed';
                }

                return this.getName(node.object) + '.' + this.getName(node.property);
            default:
                debugger;
                return '';
        }
    }
}