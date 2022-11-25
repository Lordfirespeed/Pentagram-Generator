import { GeneratorInterface2D, Bounds } from "./GeneratorInterface2D";
import { ControlAwareInterface, makeInputControl, Control } from "../Controller";
import { distance } from "../Math";
import { EventEmitter } from "../EventEmitter";
import { StateItem } from "../State";

export enum CircleModes {
	thick = 'thick',
	thin = 'thin',
	filled = 'filled',
	thickness = 'thickness',
}

interface CircleState {
	mode: CircleModes;
	size: number;
	thickness: number;
}

export class Circle implements GeneratorInterface2D, ControlAwareInterface {

	private circleModeControlElm = document.createElement('select');

	public readonly changeEmitter = new EventEmitter<void>();

	private size: number;
	private thickness: number;

	private radius: number

	private sizeControl: Control<HTMLInputElement>;
	private thicknessControl: Control<HTMLInputElement>;

	constructor(private state: StateItem<CircleState>) {
		this.mode = this.state.get('mode');
		this.size = Math.min(2000, this.state.get('size'));
		this.thickness = 0.5;

		this.radius = this.size / 2

		for (const item of Object.keys(CircleModes)) {
			const opt = document.createElement('option');
			opt.innerText = item;
			this.circleModeControlElm.appendChild(opt);

			if (item == this.mode) {
				opt.selected = true;
			}
		}

		this.circleModeControlElm.addEventListener('change', () => {
			this.setMode(this.circleModeControlElm.value as CircleModes);
			this.changeEmitter.trigger();
		});

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

	private mode: CircleModes = CircleModes.thick;

	private setMode(mode: CircleModes): void {
		this.state.set('mode', mode);
		this.mode = mode;
	}

	private setSize(size: number): void {
		this.state.set('size', size);
		this.size = size;
		this.radius = size/2;
	}

	private setThickness(thickness: number): void {
		this.state.set('thickness', thickness);
		this.thickness = thickness;
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

	private fatFilled(x: number, y: number): boolean {
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

	private thinFilled(x: number, y: number): boolean {
		return this.filled(x, y) && !(
			this.filled(x + 1, y) &&
			this.filled(x - 1, y) &&
			this.filled(x, y + 1) &&
			this.filled(x, y - 1)
		);
	}

	private thicknessFilled(x: number, y: number): boolean {
		return this.filled(x, y) && !(
			this.filled(x + 1, y) &&
			this.filled(x - 1, y) &&
			this.filled(x, y + 1) &&
			this.filled(x, y - 1)
		);
	}

	public isFilled(x: number, y: number): boolean {
		const bounds = this.getBounds();

		// Convert from graphical to local co-ordinates
		x = -.5 * (bounds.maxX - (2 * x)) + .5;
		y = -.5 * (bounds.maxY - (2 * y)) + .5;

		switch (this.mode) {
			case CircleModes.thick: {
				return this.fatFilled(x, y);
			}
			case CircleModes.thin: {
				return this.thinFilled(x, y);
			}
			case CircleModes.thickness: {
				return this.thicknessFilled(x, y);
			}
			default: {
				return this.filled(x, y);
			}
		}
	}

}
