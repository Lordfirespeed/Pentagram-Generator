import { GeneratorInterface2D, Bounds } from "./GeneratorInterface2D";
import { ControlAwareInterface, makeInputControl, Control } from "../Controller";
import { distance } from "../Math";
import { EventEmitter } from "../EventEmitter";
import { StateItem } from "../State";

interface CircleState {
	size: number;
	thickness: number;
}

export class Circle implements GeneratorInterface2D, ControlAwareInterface {

	public readonly changeEmitter = new EventEmitter<void>();

	private size: number;
	private thickness: number;

	private radius: number

	private sizeControl: Control<HTMLInputElement>;
	private thicknessControl: Control<HTMLInputElement>;

	constructor(private state: StateItem<CircleState>) {
		this.size = Math.min(2000, this.state.get('size'));
		this.thickness = 1;

		this.radius = this.size / 2;

		this.sizeControl = makeInputControl('Circle', 'size', "number", this.size, () => {
			this.setSize(parseInt(this.sizeControl.element.value, 10));
			this.changeEmitter.trigger();
		});

		this.thicknessControl = makeInputControl('Circle', 'thickness', "number", this.thickness, () => {
			this.setThickness(parseFloat(this.thicknessControl.element.value));
			this.changeEmitter.trigger();
		});
	}

	public getControls(): Control[] {
		return [
			this.sizeControl,
			this.thicknessControl
		];
	}

	private setSize(size: number): void {
		this.state.set('size', size);
		this.size = size;
		this.radius = size/2;
	}

	private setThickness(thickness: number): void {
		this.state.set('thickness', thickness);
		this.thickness = thickness
	}

	public getBounds(): Bounds {
		return new Bounds(0, this.size, 0, this.size)
	}

	private is_within_radius(x: number, y: number, radius: number): boolean {
		return distance(x, y) <= radius;
	}

	private filled(x: number, y: number): boolean {
		return this.is_within_radius(x, y, this.radius) && !(this.is_within_radius(x, y, this.radius - this.thickness))
	}

	public isFilled(x: number, y: number, bounds: Bounds): boolean {

		// Convert from graphical to local co-ordinates
		x = -.5 * (bounds.maxX - (2 * x)) + .5;
		y = -.5 * (bounds.maxY - (2 * y)) + .5;

		return this.filled(x, y)
	}
}
