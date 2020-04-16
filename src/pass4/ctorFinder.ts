import { Finder } from '../pass';
import { Namespace, Class } from '../type';
import * as estree from 'estree';

export class CtorFinder extends Finder {
    public find(_: estree.Program, context: Namespace): void {
        this.findClasses(context);
    }

    private findClasses(namespace: Namespace): void {
        for (const ns of namespace.namespaces) {
            this.findClasses(ns);
        }
        for (const clazz of namespace.classes) {
            this.findCtor(clazz);
        }
    }

    private findCtor(clazz: Class): void {
        clazz.ctor = clazz.functions.find((f): boolean => f.name === 'init');
    }
}