import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { AvatarActor, createDemoAvatarDefinition } from './ActorModel';

export function PixiAvatarView() {
    const hostRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const host = hostRef.current;

        if (!host) {
            return;
        }

        const app = new Application({
            antialias: true,
            backgroundAlpha: 0,
            resizeTo: host,
        });

        host.appendChild(app.view as HTMLCanvasElement);

        const actor = new AvatarActor(createDemoAvatarDefinition());
        app.stage.addChild(actor.container);

        const repositionActor = () => {
            actor.container.position.set(app.screen.width * 0.5, app.screen.height * 0.7);
        };

        repositionActor();

        app.ticker.add((deltaTime) => {
            actor.update(deltaTime / 60);
        });

        window.addEventListener('resize', repositionActor);

        return () => {
            window.removeEventListener('resize', repositionActor);
            app.destroy(true, { children: true, texture: false, baseTexture: false });
        };
    }, []);

    return (
        <div
            ref={hostRef}
            style={{
                width: '100vw',
                height: '100vh',
                display: 'grid',
                placeItems: 'stretch',
            }}
        />
    );
}
