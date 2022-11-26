import { GeneratorInterface2D, Bounds } from "./GeneratorInterface2D";
import { ControlAwareInterface, makeInputControl, Control } from "../Controller";
import { distanceToLine, distance } from "../Math";
import { EventEmitter } from "../EventEmitter";
import { StateItem } from "../State";

interface StarState {
	size: number;
	thickness: number;
	points: number;
}

export class Star implements GeneratorInterface2D, ControlAwareInterface {

	public readonly changeEmitter = new EventEmitter<void>();

	private size: number;
	private thickness: number;
	private points: number;

	private radius: number;
	private halfThickness: number;
	private pointJump: number;
	private lines: [number, number][];

	private sizeControl: Control<HTMLInputElement>;
	private thicknessControl: Control<HTMLInputElement>;
	private pointsControl: Control<HTMLInputElement>;

	constructor(private state: StateItem<StarState>) {
		this.size = Math.min(2000, this.state.get('size'));
		this.thickness = 1;
		this.points = 5;

		this.radius = this.size / 2;
		this.halfThickness = this.thickness / 2;
		this.pointJump = Math.ceil(this.points / 4)
		this.lines = [];
		this.generateLines()

		this.sizeControl = makeInputControl('Star', 'size', "number", this.size, () => {
			this.setSize(parseInt(this.sizeControl.element.value, 10));
			this.changeEmitter.trigger();
		});

		this.thicknessControl = makeInputControl('Star', 'thickness', "number", this.thickness, () => {
			this.setThickness(parseFloat(this.thicknessControl.element.value));
			this.changeEmitter.trigger();
		});

		this.pointsControl = makeInputControl('Star', 'points', "number", this.points, () => {
			this.setPoints(parseInt(this.pointsControl.element.value, 10))
			this.changeEmitter.trigger();
		});
	}

	public getControls(): Control[] {
		return [
			this.sizeControl,
			this.thicknessControl,
			this.pointsControl
		];
	}

	private setSize(size: number): void {
		this.state.set('size', size);
		this.size = size;
		this.radius = size/2;
		this.generateLines()
	}

	private setThickness(thickness: number): void {
		this.state.set('thickness', thickness);
		this.thickness = thickness;
		this.halfThickness = thickness/2;
	}

	private setPoints(points: number): void {
		points = Math.min(Math.max(3, points), 9)
		this.state.set('points', points)
		this.points = points;
		this.pointJump = Math.ceil(points / 4)
		this.generateLines()
	}

	private static pointsOnCircle(numberPoints: number, radius: number): [number, number][] {
		const points: [number, number][] = [];
		const angleInterval = (2 * Math.PI)/numberPoints;
		const offset = -0.5 * Math.PI;
		for (let angleIndex = 0; angleIndex < numberPoints; angleIndex++) {
			const angle = angleIndex * angleInterval + offset
			points.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
		}
		return points
	}

	private generateLinesFromPairsOfPoints(points: [number, number][], startIndex: number): void {
		let currentPoint = points[startIndex];
		let currentIndex = startIndex;
		do {
			currentIndex += this.pointJump;
			currentIndex %= this.points;
			const nextPoint = points[currentIndex];
			console.log(currentPoint, nextPoint);

			const gradient = (nextPoint[1] - currentPoint[1]) / (nextPoint[0] - currentPoint[0]);
			const constant = currentPoint[1] - gradient * currentPoint[0];
			this.lines.push([gradient, constant]);

			currentPoint = nextPoint;
		} while (currentIndex !== startIndex)
	}

	private generateLines(): void {
		this.lines = [];
		const points = Star.pointsOnCircle(this.points, this.radius);

		if (this.points % this.pointJump === 0) {
			for (let loopIndex = 0; loopIndex < this.points / this.pointJump; loopIndex ++) {
				this.generateLinesFromPairsOfPoints(points, loopIndex)
			}
		} else {
			this.generateLinesFromPairsOfPoints(points, 0)
		}
	}

	public getBounds(): Bounds {
		return new Bounds(0, this.size, 0, this.size)
	}

	private filled(x: number, y: number): boolean {
		return this.lines.some(([m, c]) => {
			return distanceToLine(x, y, m, c) < this.halfThickness && distance(x, y) < this.radius
		});
	}

	public isFilled(x: number, y: number, bounds: Bounds): boolean {

		// Convert from graphical to local co-ordinates
		x = -.5 * (bounds.maxX - (2 * x)) + .5;
		y = -.5 * (bounds.maxY - (2 * y)) + .5;

		return this.filled(x, y)
	}
}
