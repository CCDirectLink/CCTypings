import { Finder } from '../pass';
import { Namespace, Class, UnionTypeMeta } from '../type';
import * as estree from 'estree';

export class StaticClassFinder extends Finder {
    public find(_: estree.Program, context: Namespace): void {
        const ns = this.getNamespace('ig', context);
        if (!ns) {
            return;
        }

        const igClass = new Class('Class');
        igClass.parent = igClass;
        ns.classes.push(igClass);

        const actionStepBase = new Class('ActionStepBase');
        actionStepBase.parentName = ['ig', 'StepBase'];
        ns.classes.push(actionStepBase);

        const eventStepBase = new Class('EventStepBase');
        eventStepBase.parentName = ['ig', 'StepBase'];
        ns.classes.push(eventStepBase);

        const sound = new Class('Sound');
        sound.parentName = ['ig', 'SoundWebAudio'];
        ns.classes.push(sound);
    }

    private getNamespace(name: string, context: Namespace): Namespace | undefined {
        return context.namespaces.find((ns): boolean => ns.name === name);
    }
}