import * as estree from 'estree';

export class Namespace {
    public readonly name: string;
    public readonly classes: Class[] = [];
    public readonly namespaces: Namespace[] = [];
    public readonly unionTypes: UnionTypeMeta[] = [];

    public constructor(name: string) {
        this.name = name;
    }
}

export class Class {
    public readonly name: string;

    public assignNode?: estree.AssignmentExpression;
    public parentName?: string[];
    public parent?: Class;

    public properties = new Map<string, estree.Node>();
    public fields: FieldMeta[] = [];
    public functions: FunctionMeta[] = [];
    public ctor?: FunctionMeta;

    public constructor(name: string) {
        this.name = name;
    }
}

export class FieldMeta {
    public readonly name: string;
    public readonly initSrc: estree.Node;

    public type?: string;

    public constructor(name: string, initSrc: estree.Node) {
        this.name = name;
        this.initSrc = initSrc;
    }
}

export class FunctionMeta {
    public readonly name: string;
    public readonly argNames: string[] = [];
    public readonly src: estree.FunctionExpression;

    public returnType?: string;

    public constructor(name: string, src: estree.FunctionExpression) {
        this.name = name;
        this.src = src;
    }
}

export class UnionTypeMeta {
    public readonly name: string;
    public readonly types: string[];

    public constructor(name: string, types: string[]) {
        this.name = name;
        this.types = types;
    }
}