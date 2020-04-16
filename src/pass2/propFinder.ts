import { Finder } from '../pass';
import { Namespace, Class } from '../type';
import * as estree from 'estree';

export class PropFinder extends Finder {
    public find(_: estree.Program, context: Namespace): void {
        this.findClasses(context);
    }

    private findClasses(namespace: Namespace): void {
        for (const ns of namespace.namespaces) {
            this.findClasses(ns);
        }
        for (const clazz of namespace.classes) {
            this.findProperties(clazz);
        }
    }

    private findProperties(clazz: Class): void {
        const props = this.getPropertyNames(clazz);
        for (const [name, init] of props) {
            clazz.properties.set(name, init);
        }
    }

    private getPropertyNames(clazz: Class): [string, estree.Node][] {
        const result: [string, estree.Node][] = [];
        if (!clazz.assignNode) {
            return result; // Unreachable
        }

        const call = clazz.assignNode.right as estree.CallExpression;
        const obj = call.arguments[0] as estree.ObjectExpression;

        for (const prop of obj.properties) {
            const name = this.getName(prop);
            const init = prop.value;

            result.push([name, init]);
        }

        return result;
    }

    private getName(prop: estree.Property): string {
        switch(prop.key.type) {
            case 'Identifier':
                return prop.key.name;
            case 'Literal':
                if (typeof prop.key.value !== 'string') {
                    debugger;
                    return '';
                }
                return prop.key.value;
            default:
                debugger;
                return '';
        }
    }
}