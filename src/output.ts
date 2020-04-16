import * as fs from 'fs';
import { Namespace, Class, FunctionMeta, FieldMeta, UnionTypeMeta } from "./type";

export class Formatter {
    private stream!: fs.WriteStream;

    public print(name: string, context: Namespace): void {
        this.stream = fs.createWriteStream(name);
        for (const ns of context.namespaces) {
            this.namespace(ns, 0);
        }
        this.stream.close();
    }

    private write(text: string): void {
        this.stream.write(text);
    }

    private indent(level: number): void {
        this.write('    '.repeat(level));
    }

    private declareOrExport(level: number): void {
        this.indent(level);
        if (level === 0) {
            this.write('declare ');
        } else {
            this.write('export ');
        }
    }

    private namespace(ns: Namespace, level: number): void {
        this.declareOrExport(level);
        this.write(`namespace ${ns.name} {\n`);

        for (const namespace of ns.namespaces) {
            this.namespace(namespace, level + 1);
        }

        for (const clazz of ns.classes) {
            this.clazz(clazz, level + 1);
        }
        
        for (const unionType of ns.unionTypes) {
            this.unionType(unionType, level + 1);
        }
        
        this.indent(level);
        this.write('}\n');
    }

    private clazz(clazz: Class, level: number): void {
        this.declareOrExport(level);
        this.write(`class ${clazz.name} `);
        if (clazz.parent !== clazz && clazz.parentName) {
            this.write(`extends ${clazz.parentName.join('.')} `);
        }
        this.write('{\n');

        for (const field of clazz.fields) {
            this.field(field, level + 1);
        }
        if (clazz.fields.length > 0) {
            this.write('\n');
        }
        if (clazz.ctor) {
            this.ctor(clazz.ctor, level + 1);
            this.write('\n');
        }
        for (const func of clazz.functions) {
            this.function(func, level + 1);
        }
        
        this.indent(level);
        this.write('}\n');
    }

    private ctor(ctor: FunctionMeta, level: number): void {
        this.indent(level);
        this.write(`public constructor(${ctor.argNames.filter((n): boolean => !n.startsWith('_usedInChild')).map((n): string => n + ': any').join(', ')});\n`);
    }

    private function(func: FunctionMeta, level: number): void {
        this.indent(level);
        this.write(`public ${func.name}(`);
        this.write(func.argNames.map((n): string => n + ': any').join(', '));
        this.write(`): ${func.returnType || 'any'};\n`);
    }
    
    private field(field: FieldMeta, level: number): void {
        this.indent(level);
        this.write(`public ${field.name}: ${field.type || 'any'};\n`);
    }

    
    private unionType(unionType: UnionTypeMeta, level: number): void {
        this.declareOrExport(level);
        this.write(`let ${unionType.name}: typeof ${unionType.types.join(' | typeof ')};\n`);
    }

}