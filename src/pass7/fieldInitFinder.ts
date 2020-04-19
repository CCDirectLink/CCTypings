import { Finder } from '../pass';
import { Namespace, Class, FunctionMeta, FieldMeta } from '../type';
import * as estree from 'estree';

export class FieldInitFinder extends Finder {
    public find(_: estree.Program, context: Namespace): void {
        this.findClasses(context);
    }

    private findClasses(namespace: Namespace): void {
        for (const ns of namespace.namespaces) {
            this.findClasses(ns);
        }
        for (const clazz of namespace.classes) {
            this.findFields(clazz);
        }
    }

    private findFields(clazz: Class): void {
        for (const field of clazz.fields) {
            this.findFieldType(field);
        }
    }

    private findFieldType(field: FieldMeta): void {
        switch (field.initSrc.type) {
            case 'Literal':
                switch (typeof field.initSrc.value) {
                    case 'boolean':
                    case 'number':
                    case 'string':
                        field.type = typeof field.initSrc.value;
                        break;
                }
                break;
            case 'NewExpression':
                try {
                    const name = this.getName(field.initSrc);
                    if (name.length !== 1) {
                        field.type = name;
                    }
                } catch (ex) {
                    if (ex !== 'Computed') {
                        throw ex;
                    }
                }
                break;
            case 'Identifier':
            case 'ArrayExpression':
            case 'ObjectExpression':
            case 'CallExpression':
            case 'MemberExpression':
            case 'UnaryExpression':
            case 'BinaryExpression':
                break;
            default:
                debugger;
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