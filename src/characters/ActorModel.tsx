import { Container, SimplePlane, Texture } from 'pixi.js';

export interface VertexOffset {
	column: number;
	row: number;
	dx: number;
	dy: number;
}

export interface AvatarPartDefinition {
	id: string;
	textureUrl: string;
	width: number;
	height: number;
	x: number;
	y: number;
	zIndex: number;
	gridX?: number;
	gridY?: number;
	pivotX?: number;
	pivotY?: number;
	baseOffsets?: VertexOffset[];
	breatheAmount?: number;
	breatheSpeed?: number;
}

export interface AvatarDefinition {
	parts: AvatarPartDefinition[];
}

class DeformablePart {
	readonly id: string;
	readonly mesh: SimplePlane;

	private readonly gridX: number;
	private readonly gridY: number;
	private readonly baseVertices: Float32Array;
	private readonly authoredOffsets: VertexOffset[];
	private readonly breatheAmount: number;
	private readonly breatheSpeed: number;
	private phase = 0;

	constructor(definition: AvatarPartDefinition) {
		this.id = definition.id;
		this.gridX = Math.max(2, definition.gridX ?? 4);
		this.gridY = Math.max(2, definition.gridY ?? 4);

		const texture = Texture.from(definition.textureUrl);
		this.mesh = new SimplePlane(texture, this.gridX, this.gridY);

		const applyScale = () => {
			// Keep part dimensions stable once the texture metadata is available.
			const sourceW = texture.orig.width || 1;
			const sourceH = texture.orig.height || 1;
			this.mesh.scale.set(definition.width / sourceW, definition.height / sourceH);
		};
		applyScale();
		texture.once('update', applyScale);

		this.mesh.position.set(definition.x, definition.y);
		const pivotX = definition.pivotX ?? 0.5;
		const pivotY = definition.pivotY ?? 0.5;
		const applyPivot = () => {
			const sourceW = texture.orig.width || 1;
			const sourceH = texture.orig.height || 1;
			this.mesh.pivot.set(sourceW * pivotX, sourceH * pivotY);
		};
		applyPivot();
		texture.once('update', applyPivot);
		this.mesh.zIndex = definition.zIndex;

		const vertexBuffer = this.mesh.geometry.getBuffer('aVertexPosition');
		const initialVertices = vertexBuffer.data as unknown as ArrayLike<number>;
		this.baseVertices = new Float32Array(initialVertices);
		this.authoredOffsets = definition.baseOffsets ?? [];
		this.breatheAmount = definition.breatheAmount ?? 0;
		this.breatheSpeed = definition.breatheSpeed ?? 1;

		this.applyVertexOffsets(this.authoredOffsets);
	}

	update(deltaSeconds: number): void {
		if (this.breatheAmount <= 0) {
			return;
		}

		this.phase += deltaSeconds * this.breatheSpeed;
		this.resetDeformation();
		this.applyVertexOffsets(this.authoredOffsets);

		const vertexBuffer = this.mesh.geometry.getBuffer('aVertexPosition');
		const vertices = vertexBuffer.data as unknown as Float32Array;
		const wave = Math.sin(this.phase) * this.breatheAmount;

		for (let row = 0; row < this.gridY; row += 1) {
			const rowInfluence = (this.gridY - 1 - row) / (this.gridY - 1);
			for (let column = 0; column < this.gridX; column += 1) {
				const index = this.vertexIndex(column, row);
				const xNorm = column / (this.gridX - 1);
				const xCurve = 0.8 + Math.sin(xNorm * Math.PI) * 0.2;

				vertices[index + 1] += wave * rowInfluence * xCurve;
			}
		}

		vertexBuffer.update();
	}

	resetDeformation(): void {
		const vertexBuffer = this.mesh.geometry.getBuffer('aVertexPosition');
		const vertices = vertexBuffer.data as unknown as Float32Array;

		vertices.set(this.baseVertices);
		vertexBuffer.update();
	}

	applyVertexOffsets(offsets: VertexOffset[]): void {
		if (offsets.length === 0) {
			return;
		}

		const vertexBuffer = this.mesh.geometry.getBuffer('aVertexPosition');
		const vertices = vertexBuffer.data as unknown as Float32Array;

		for (const offset of offsets) {
			const index = this.vertexIndex(offset.column, offset.row);
			vertices[index] += offset.dx;
			vertices[index + 1] += offset.dy;
		}

		vertexBuffer.update();
	}

	private vertexIndex(column: number, row: number): number {
		const x = Math.max(0, Math.min(this.gridX - 1, column));
		const y = Math.max(0, Math.min(this.gridY - 1, row));

		return (y * this.gridX + x) * 2;
	}
}

export class AvatarActor {
	readonly container: Container;

	private readonly parts: Map<string, DeformablePart>;

	constructor(definition: AvatarDefinition) {
		this.container = new Container();
		this.container.sortableChildren = true;
		this.parts = new Map<string, DeformablePart>();

		for (const partDefinition of definition.parts) {
			const part = new DeformablePart(partDefinition);

			this.parts.set(partDefinition.id, part);
			this.container.addChild(part.mesh);
		}
	}

	update(deltaSeconds: number): void {
		for (const part of this.parts.values()) {
			part.update(deltaSeconds);
		}
	}

	addOffsets(partId: string, offsets: VertexOffset[]): void {
		const part = this.parts.get(partId);

		if (!part) {
			return;
		}

		part.applyVertexOffsets(offsets);
	}
}

export function createDemoAvatarDefinition(): AvatarDefinition {
	const baseUrl = import.meta.env.BASE_URL;

	return {
		parts: [
			{
				id: 'torso',
				textureUrl: `${baseUrl}avatar-demo/torso.svg`,
				width: 280,
				height: 280,
				x: 0,
				y: 40,
				zIndex: 10,
				gridX: 6,
				gridY: 6,
				breatheAmount: 1.4,
				breatheSpeed: 2.4,
				baseOffsets: [
					{ column: 0, row: 0, dx: -4, dy: -4 },
					{ column: 5, row: 0, dx: 4, dy: -4 },
					{ column: 0, row: 5, dx: -8, dy: 0 },
					{ column: 5, row: 5, dx: 8, dy: 0 },
				],
			},
			{
				id: 'head',
				textureUrl: `${baseUrl}avatar-demo/head.svg`,
				width: 210,
				height: 210,
				x: 0,
				y: -145,
				zIndex: 20,
				gridX: 6,
				gridY: 6,
				breatheAmount: 0.4,
				breatheSpeed: 2.4,
				baseOffsets: [
					{ column: 2, row: 0, dx: -2, dy: -6 },
					{ column: 3, row: 0, dx: 2, dy: -6 },
					{ column: 0, row: 5, dx: -4, dy: 2 },
					{ column: 5, row: 5, dx: 4, dy: 2 },
				],
			},
			{
				id: 'hair',
				textureUrl: `${baseUrl}avatar-demo/hair.svg`,
				width: 230,
				height: 210,
				x: 0,
				y: -188,
				zIndex: 30,
				gridX: 5,
				gridY: 5,
				breatheAmount: 0.35,
				breatheSpeed: 2.0,
				baseOffsets: [
					{ column: 0, row: 0, dx: -10, dy: -6 },
					{ column: 4, row: 0, dx: 10, dy: -6 },
				],
			},
			{
				id: 'eyeLeft',
				textureUrl: `${baseUrl}avatar-demo/eye-left.svg`,
				width: 30,
				height: 16,
				x: -35,
				y: -145,
				zIndex: 40,
				gridX: 3,
				gridY: 3,
			},
			{
				id: 'eyeRight',
				textureUrl: `${baseUrl}avatar-demo/eye-right.svg`,
				width: 30,
				height: 16,
				x: 35,
				y: -145,
				zIndex: 40,
				gridX: 3,
				gridY: 3,
			},
		],
	};
}
