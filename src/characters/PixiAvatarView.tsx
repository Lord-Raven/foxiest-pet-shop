import { useEffect, useRef } from 'react';
import { Application, Assets } from 'pixi.js';
import { AvatarActor, createDemoAvatarDefinition } from './ActorModel';

export function PixiAvatarView() {
    const hostRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const host = hostRef.current;
        let app: Application | null = null;
        let disposed = false;

        if (!host) {
            return;
        }

        const init = async () => {
            const definition = createDemoAvatarDefinition();
            await Promise.all(definition.parts.map((part) => Assets.load(part.textureUrl)));

            if (disposed) {
                return;
            }

            app = new Application({
                antialias: true,
                backgroundAlpha: 0,
                resizeTo: host,
            });

            host.appendChild(app.view as HTMLCanvasElement);

            const actor = new AvatarActor(definition);
            app.stage.addChild(actor.container);

            const repositionActor = () => {
                actor.container.position.set(app!.screen.width * 0.5, app!.screen.height * 0.7);
            };

            repositionActor();

            app.ticker.add((deltaTime) => {
                actor.update(deltaTime / 60);
            });

            window.addEventListener('resize', repositionActor);

            const destroy = () => {
                window.removeEventListener('resize', repositionActor);
            };

            (app as Application & { __cleanup?: () => void }).__cleanup = destroy;
        };

        init().catch((error) => {
            console.error('Failed to initialize Pixi avatar view', error);
        });

        return () => {
            disposed = true;

            const cleanup = (app as Application & { __cleanup?: () => void } | null)?.__cleanup;
            cleanup?.();
            app?.destroy(true, { children: true, texture: false, baseTexture: false });
        };
    }, []);

    return (
        <div
            ref={hostRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'stretch',
            }}
        />
    );
}
