import * as acorn from 'acorn';
import * as estraverse from 'estraverse';
import * as fs from 'fs';
import * as estree from 'estree';

interface Property {
    name: string;
    type: PropertyType;
}

interface PropertyType {
    ptype: 'Literal' | 'Method' | 'Object' | 'Any';
}

interface PropertyTypeLiteral extends PropertyType {
    ptype: 'Literal';

    type: string;
    value: any;
}

interface PropertyTypeMethod extends PropertyType {
    ptype: 'Method';

    name: string;
    returnType: PropertyType;
    args: Map<string, PropertyType>;
}

interface PropertyTypeObject extends PropertyType {
    ptype: 'Object';

    properties: Property[];
}

interface PropertyTypeAny extends PropertyType {
    ptype: 'Any'
}

interface ClassInfo {
    name: string[];
    props: Property[];
    parent: ClassInfo | string[] | null;

    private: boolean;
}

const enemyReactionBase: ClassInfo = {
    name: ['ig', 'EnemyReactionBase'],
    parent: ['ig', 'Class'],
    props: [
        {name: 'name', type: {ptype: 'Literal', type: 'string', value: ''} as PropertyTypeLiteral},
        {name: 'type', type: {ptype: 'Literal', type: 'numver', value: '0'} as PropertyTypeLiteral},
        {name: 'action', type: {ptype: 'Any'}},
        {name: 'postSwitchState', type: {ptype: 'Any'}},
        {name: 'ignoreStun', type: {ptype: 'Literal', type: 'boolean', value: 'false'} as PropertyTypeLiteral},
        {name: 'restartPrevAction', type: {ptype: 'Literal', type: 'boolean', value: 'false'} as PropertyTypeLiteral},
        {name: 'init', type: {ptype: 'Method', name: '', args: new Map([['name', {ptype: 'Any'}], ['data', {ptype: 'Any'}]]), returnType: {ptype: 'Any'}} as PropertyTypeMethod},
        {name: 'onActivate', type: {ptype: 'Any'}},
        {name: 'preApply', type: {ptype: 'Any'}},
        {name: 'apply', type: {ptype: 'Method', name: '', args: new Map([['entity', {ptype: 'Any'}], ['actions', {ptype: 'Any'}]]), returnType: {ptype: 'Any'}} as PropertyTypeMethod},
        {name: 'check', type: {ptype: 'Any'}},
    ],
    private: true,
};
const todoType = new Map<string, number>();
main();

function main() {
    const code = read('./game.compiled.js');
    const ast = parse(code);
    const classes = findClasses(ast);
    const infos = buildClasses(classes);
    writeClasses(infos, './crosscode.d.ts');
    console.log(todoType.size);
    debugger;
}




function read(file: string) {
    return fs.readFileSync(file, 'utf8');
}

function parse(code: string) {
    return acorn.parse(code);
}

function findClasses(ast: acorn.Node) {
    const result = new Map<string[], estree.AssignmentExpression>();
    estraverse.traverse(ast as any, {
        enter: (node, parent) => {
            if (node.type === 'AssignmentExpression'
                && (node.left.type === 'MemberExpression' /*|| node.left.type === 'Identifier'*/)
                && node.right.type === 'CallExpression'
                && node.right.callee.type === 'MemberExpression'
                && node.right.callee.property.type === 'Identifier'
                && node.right.callee.property.name === 'extend') {
                    try {
                        result.set(buildTypeName(node.left), node);
                    } catch (e) {
                        console.log('Could not build name');
                    }
            }
        }
    });
    return result;
}

function buildClasses(classes: Map<string[], estree.AssignmentExpression>) {
    const result: ClassInfo[] = [{
            name: ['ig', 'Class'],
            parent: null,
            props: [],
            private: false,
        }, {
            name: ['ig', 'EventStepBase'],
            parent: ['ig', 'StepBase'],
            props: [],
            private: false,
        }, {
            name: ['ig', 'ActionStepBase'],
            parent: ['ig', 'StepBase'],
            props: [],
            private: false,
        }, enemyReactionBase];
    for (const [name, node] of classes) {
        result.push(buildClass(name, node));
    }
    return result;
}

function buildClass(name: string[], node: estree.AssignmentExpression) {
    const body = getClassBody(node);
    const result: Property[] = [];
    for (const property of body.properties) {
        result.push(getPropertyInfo(property, name));
    }

    if (node.right.type !== 'CallExpression' || node.right.callee.type !== 'MemberExpression') {
        throw new Error('Unreachable');
    }
    const parent = removeCommon(buildTypeName(node.right.callee), name);
    if (parent.length === 1 && parent[0].length === 1) { // TODO: Improve this check
        return {
            name: name,
            parent: enemyReactionBase,
            props: result,
        } as ClassInfo;
    }
    return {
        name: name,
        parent: parent,
        props: result,
    } as ClassInfo;
}

function removeCommon(target: string[], compared: string[]) {
    for (const next of compared) {
        if (target[0] === next) {
            target.splice(0, 1);
        } else {
            return target[target.length - 1] === 'extend' ? target.splice(0, target.length - 1) : target;
        }
    }
    return [];
}

function getClassBody(node: estree.AssignmentExpression): estree.ObjectExpression {
    if (
        node.right.type !== 'CallExpression'
        || node.right.arguments.length < 1
    ) {
        throw new Error('Could not find class body');
    }
    const body = node.right.arguments[0];
    
    if (body.type !== 'ObjectExpression') {
        throw new Error('Could not find class body');
    }

    return body;
}

function getPropertyInfo(prop: estree.Property, name: string[]): Property {
    switch (prop.key.type) {
        case 'Identifier':
            return {
                name: prop.key.name,
                type: getPropertyType(prop.value, name),
            } as Property;
        case 'Literal':
            return {
                name: prop.key.value as string,
                type: getPropertyType(prop.value, name),
            }
        default:
            throw new Error('Could read prop name');
    }
}

function getPropertyType(prop: estree.Node, name: string[]): PropertyType {
    switch (prop.type) {
        case 'Literal':
            if (prop.value === null || prop.value === undefined) {
                return {ptype: 'Any'};
            }

            return {
                ptype: 'Literal',
                type: typeof prop.value,
                value: prop.value,
            } as PropertyTypeLiteral;
        case 'FunctionExpression':
            const args = new Map<string, PropertyType>();
            for (const param of prop.params) {
                args.set((<estree.Identifier>param).name, {ptype: 'Any'});
            }

            return {
                ptype: 'Method',
                name: prop.id ? prop.id.name : '',
                args: args,
                returnType: {ptype: 'Any'},
            } as PropertyTypeMethod;
        case 'ObjectExpression':
            return {
                ptype: 'Object',
                properties: prop.properties.map(p => getPropertyInfo(p, name))
            } as PropertyTypeObject;
        case 'NewExpression':
            return {
                ptype: 'Literal',
                type: removeCommon(buildTypeName(prop.callee as estree.MemberExpression), name).join('.')
            } as PropertyTypeLiteral
        default: 
            const val = todoType.get(prop.type) || 0;
            todoType.set(prop.type, val + 1);

            return {ptype: 'Any'};
    }
}

function buildTypeName(node: estree.MemberExpression | estree.Identifier): string[] {
    if (node.type === 'Identifier') {
        return [node.name];
    }

    const result: string[] = [];
    switch(node.object.type) {
        case 'Identifier':
            result.push(node.object.name);
            break;
        case 'MemberExpression':
            result.push(...buildTypeName(node.object));
            break;
        default:
            throw new Error('Unkown node type');
    }

    if (node.property.type !== 'Identifier') {
        throw new Error('Unkown node type');
    }
    result.push(node.property.name);
    return result;
}

function writeClasses(classes: ClassInfo[], file: string) {
    clearFile(file);
    return writeClassesLevel(classes, file, 0);
}

function writeClassesLevel(infos: ClassInfo[], file: string, level: number) {
    const pairs: [ClassInfo, string[]][] = infos.map(c => [c, c.name.slice(level)]);

    const classes = getClasses(pairs);
    for (const [info, name] of classes) {
        writeClass(info, name, level, file);
    }

    const ns = getNamespaces(pairs);
    for (const [i, name] of ns) {
        writeNamespace(i, name, level, file);
    }
}

function writeNamespace(infos: ClassInfo[], name: string, level: number, file: string) {
    if (level === 0 && name !== 'ig' && name !== 'sc') {
        console.log(`Skipped suspicious namespace ${name}`);
        return;
    }

    console.log(` Writing namespace ${name} (Level ${level})`);
    fs.appendFileSync(file, `${'\t'.repeat(level)}${level === 0 ? 'declare ' : ''}namespace ${name} {\n`);
    writeClassesLevel(infos, file, level + 1);
    fs.appendFileSync(file, `${'\t'.repeat(level)}}\n`);
}

function writeClass(info: ClassInfo, name: string, level: number, file: string) {
    fs.appendFileSync(file, `${'\t'.repeat(level)}${level == 0 ? 'declare ' : ''}${info.private ? 'interface' : 'class'} ${name} ${info.parent instanceof Array ? (info.parent.length > 0 ? `extends ${info.parent.join('.')} ` : '') : (info.parent !== null ? ((<ClassInfo>info.parent).private ? `implements ${(<ClassInfo>info.parent).name.join('.')} ` : `extends ${(<ClassInfo>info.parent).name.join('.')} `) : '')}{\n`);

    for (const prop of info.props) {
        if (prop.name === 'init' && prop.type.ptype === 'Method') {
            writeCtor(prop, level + 1, file);
        }

        writeProp(prop, level + 1, file);
    }
    fs.appendFileSync(file, `${'\t'.repeat(level)}}\n`);
}

function writeProp(prop: Property, level: number, file: string) {
    fs.appendFileSync(file, `${'\t'.repeat(level)}${prop.name}: ${resolveType(prop.type, level)};\n`);
}

function writeCtor(prop: Property, level: number, file: string) {
    const method = prop.type as PropertyTypeMethod;
    fs.appendFileSync(file, `${'\t'.repeat(level)}constructor(${
        Array.from(method.args)
            .map(([name, t]) => `${name}?: ${resolveType(t, level)}`)
            .join(', ')
        });\n`);
}

function resolveType(type: PropertyType, level: number): string {
    switch (type.ptype) {
        case 'Any':
            return 'any';
        case 'Literal':
            return (<PropertyTypeLiteral>type).type;
        case 'Method':
            const method = type as PropertyTypeMethod;
            return `(${
                Array.from(method.args)
                    .map(([name, t]) => `${name}?: ${resolveType(t, level)}`)
                    .join(', ')
            }) => ${resolveType(method.returnType, level)}`;
        case 'Object':
            const obj = type as PropertyTypeObject;
            if (obj.properties.length === 0) {
                return '{[key: string]: any}'
            }

            let result = '{\n';
            for (const prop of obj.properties) {
                result += `${'\t'.repeat(level + 1)}${prop.name}: ${resolveType(prop.type, level + 1)};\n`;
            }
            result += `${'\t'.repeat(level)}}`;
            return result;
        default:
            debugger;
            return 'any';
    }
}

function getClasses(pairs: [ClassInfo, string[]][]): [ClassInfo, string][] {
    return pairs
        .filter(p => p[1].length === 1)
        .map(p => [p[0], p[1][0]]);
}

function getNamespaces(pairs: [ClassInfo, string[]][]): [ClassInfo[], string][] {
    pairs = pairs
        .filter(p => p[1].length > 1);
    
    return pairs
        .map(p => p[1][0])
        .filter((value, index, self) => self.indexOf(value) === index) //Distinct
        .map(n => [
            pairs
                .filter(p => p[1][0] === n)
                .map(p => p[0]), 
            n]);
}

function clearFile(file: string) {
    fs.writeFileSync(file, '');
}