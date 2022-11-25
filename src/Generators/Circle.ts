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

	private circleModeControlElm = document.createElement('select');

	public readonly changeEmitter = new EventEmitter<void>();

	private size: number;
	private thickness: number;

	private radius: number
	private intThickness: number
	private thinRender: boolean

	private sizeControl: Control<HTMLInputElement>;
	private thicknessControl: Control<HTMLInputElement>;

	constructor(private state: StateItem<CircleState>) {
		this.size = Math.min(2000, this.state.get('size'));
		this.thickness = 0.5;

		this.intThickness = Math.floor(this.thickness);
		this.thinRender = (this.thickness % 1) < 0.5;

		this.radius = this.size / 2;

		this.sizeControl = makeInputControl('Shape', 'size', "number", this.size, () => {
			this.setSize(parseInt(this.sizeControl.element.value, 10));
			this.changeEmitter.trigger();
		});

		this.thicknessControl = makeInputControl('Shape', 'thickness', "range", 0.5, (val)=> {
			this.setThickness(parseInt(val, 10))
			this.changeEmitter.trigger()
		}, {min: "0.5", max: "10"})
	}

	public getControls(): Control[] {
		return [
			this.sizeControl,
			{ element: this.circleModeControlElm, label: 'border', group: 'Render' },
		];
	}

	private setSize(size: number): void {
		this.state.set('size', size);
		this.size = size;
		this.radius = size/2;
	}

	private setThickness(thickness: number): void {
		this.state.set('thickness', thickness);
		this.thickness = thickness;
		this.intThickness = Math.floor(thickness)
		this.thinRender = (thickness % 1) < 0.5
	}

	public getBounds(): Bounds {
		return {
			minX: 0,
			maxX: this.size,

			minY: 0,
			maxY: this.size,
		};
	}

	private filled(x: number, y: number): boolean {
		return distance(x, y) <= this.radius;
	}

	private oldFatFilled(x: number, y: number): boolean {
		return this.filled(x, y) && !(
			this.filled(x + 1, y) &&
			this.filled(x - 1, y) &&
			this.filled(x, y + 1) &&
			this.filled(x, y - 1) &&
			this.filled(x + 1, y + 1) &&
			this.filled(x + 1, y - 1) &&
			this.filled(x - 1, y - 1) &&
			this.filled(x - 1, y + 1)
		);
	}

	private oldThinFilled(x: number, y: number): boolean {
		return this.filled(x, y) && !(
			this.filled(x + 1, y) &&
			this.filled(x - 1, y) &&
			this.filled(x, y + 1) &&
			this.filled(x, y - 1)
		);
	}

	private thinFilled(x: number, y: number): boolean {
		return this.filled(x, y) && !(
			this.filled(x + this.thickness, y) &&
			this.filled(x - this.thickness, y) &&
			this.filled(x, y + this.thickness) &&
			this.filled(x, y - this.thickness)
		);
	}

	private thickFilled(x: number, y: number): boolean {
		return this.filled(x, y) && !(
			this.filled(x + this.intThickness, y) &&
			this.filled(x - this.intThickness, y) &&
			this.filled(x, y + this.intThickness) &&
			this.filled(x, y - this.intThickness) &&
			this.filled(x + this.intThickness, y + this.intThickness) &&
			this.filled(x + this.intThickness, y - this.intThickness) &&
			this.filled(x - this.intThickness, y - this.intThickness) &&
			this.filled(x - this.intThickness, y + this.intThickness)
		);
	}

	public isFilled(x: number, y: number): boolean {
		const bounds = this.getBounds();

		// Convert from graphical to local co-ordinates
		x = -.5 * (bounds.maxX - (2 * x)) + .5;
		y = -.5 * (bounds.maxY - (2 * y)) + .5;

		if (this.thinRender) {
			return this.thinFilled(x, y)
		} else {
			return this.thickFilled(x, y)
		}
	}
}
