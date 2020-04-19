import { Finder } from '../pass';
import { Namespace, Class, FunctionMeta, FieldMeta } from '../type';
import * as estree from 'estree';

export class HardcodedFinder extends Finder {
    public find(_: estree.Program, context: Namespace): void {
        const ns = this.getNamespace('ig', context);
        if (!ns) {
            return;
        }

        const rgb = new Class('RGBColor');
        rgb.ctor = this.getFunction('', [['color', 'string | {r: number, g: number, b: number}']]);
        rgb.functions.push(
            this.getFunction('toRGB', [], 'string'),
            this.getFunction('toHex', [], 'string'),
            this.getFunction('assign', [['color', '{r: number, g: number, b: number}']]),
            this.getFunction('addColor', [['color', '{r: number, g: number, b: number}'], ['strenght', 'number']]),
        );
        rgb.fields.push(
            this.getField('r', 'number'),
            this.getField('g', 'number'),
            this.getField('b', 'number'),
            this.getField('ok', 'boolean'),
        )
        ns.classes.push(rgb);

        const sc = this.getNamespace('sc', context);
        if (!sc) {
            return;
        }

        const enemyEntryButton = sc.classes.find((c): boolean => c.name === 'EnemyEntryButton');
        if (!enemyEntryButton) {
            return;
        }
        enemyEntryButton.fields.splice(enemyEntryButton.fields.findIndex((f): boolean => f.name === 'level'), 1); //Remove wrong level entry

        const socialEntryButton = sc.classes.find((c): boolean => c.name === 'SocialEntryButton');
        if (!socialEntryButton) {
            return;
        }
        socialEntryButton.fields.splice(socialEntryButton.fields.findIndex((f): boolean => f.name === 'level'), 1); //Remove wrong level entry

        const effectEntry = this.getNamespace('EFFECT_ENTRY', ns);
        if (!effectEntry) {
            return;
        }
        for (const name of ['OFFSET_PARTICLE_CIRCLE', 'PARTICLE_CIRCLE', 'DEBRIS_CIRCLE']) {
            const clazz = effectEntry.classes.find((c): boolean => c.name === name);
            if (!clazz) {
                continue;
            }
            clazz.parentName = ['ig', 'EffectStepBase'];
        }

        const enemyReaction = this.getNamespace('ENEMY_REACTION', sc);
        if (!enemyReaction) {
            return;
        }
        for (const clazz of enemyReaction.classes) {
            clazz.parentName = ['ig', 'Class']; //TODO: make dummy class
        }

    }

    private getNamespace(name: string, context: Namespace): Namespace | undefined {
        return context.namespaces.find((ns): boolean => ns.name === name);
    }

    private getFunction(name: string, args: [string, string][], ret?: string): FunctionMeta {
        const result = new FunctionMeta(name, {} as estree.FunctionExpression);

        result.argNames.push(...args.map((a): string => a[0]));
        //result.argTypes.push(...args.map((a): string => a[1]));
        result.returnType = ret || 'void';

        return result;
    }

    private getField(name: string, type: string): FieldMeta {
        const result = new FieldMeta(name, {} as estree.Node);
        result.type = type;
        return result;
    }
}