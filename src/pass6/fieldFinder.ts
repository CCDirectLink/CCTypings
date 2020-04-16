import { Finder } from '../pass';
import { Namespace, Class, FunctionMeta, FieldMeta } from '../type';
import * as estree from 'estree';

export class FieldFinder extends Finder {
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
        for (const [name, init] of clazz.properties) {
            if (init.type !== 'FunctionExpression') {
                clazz.fields.push(new FieldMeta(name, init));
            }
        }
    }
}