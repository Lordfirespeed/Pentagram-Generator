import { GeneratorInterface2D, Bounds } from "./GeneratorInterface2D";
import { ControlAwareInterface, makeInputControl, Control } from "../Controller";
import { distance } from "../Math";
import { EventEmitter } from "../EventEmitter";
import { StateItem } from "../State";

export enum CircleModes {
	thick = 'thick',
	thin = 'thin',
	filled = 'filled',
}

function filled(x: number, y: number, radius: number, ratio: number): boolean {
	return distance(x, y, ratio) <= radius;
}

function fatfilled(x: number, y: number, radius: number, ratio: number): boolean {
	return filled(x, y, radius, ratio) && !(
		filled(x + 1, y, radius, ratio) &&
		filled(x - 1, y, radius, ratio) &&
		filled(x, y + 1, radius, ratio) &&
		filled(x, y - 1, radius, ratio) &&
		filled(x + 1, y + 1, radius, ratio) &&
		filled(x + 1, y - 1, radius, ratio) &&
		filled(x - 1, y - 1, radius, ratio) &&
		filled(x - 1, y + 1, radius, ratio)
	);
}

function thinfilled(x: number, y: number, radius: number, ratio: number): boolean {
	return fatfilled(x, y, radius, ratio) &&
		!(fatfilled(x + (x > 0 ? 1 : -1), y, radius, ratio)
			&& fatfilled(x, y + (y > 0 ? 1 : -1), radius, ratio));
}

interface CircleState {
	mode: CircleModes;
	width: number;
	height: number;
	force: boolean;
}

export class Circle implements GeneratorInterface2D, ControlAwareInterface {

	private circleModeControlElm = document.createElement('select');

	public readonly changeEmitter = new EventEmitter<void>();

	private width: number;
	private height: number;
	private force: boolean;

	private widthControl: Control<HTMLInputElement>;
	private heightControl: Control<HTMLInputElement>;
	private forceCircleControl : Control<HTMLInputElement>;

	constructor(private state: StateItem<CircleState>) {
		this.mode = this.state.get('mode');
		this.width = this.state.get('width');
		this.height = this.state.get('height');
		this.force = this.state.get('force');

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

		this.widthControl = makeInputControl('Shape', 'width', "number", this.width, () => {
			if (this.force) {
				this.heightControl.element.value = this.widthControl.element.value;
				this.setHeight(parseInt(this.widthControl.element.value, 10));
			}
			this.setWidth(parseInt(this.widthControl.element.value, 10));
			this.changeEmitter.trigger();
		});

		this.heightControl = makeInputControl('Shape', 'height', "number", this.height, () => {
			if (this.force) {
				this.widthControl.element.value = this.heightControl.element.value;
				this.setWidth(parseInt(this.heightControl.element.value, 10));
			}
			this.setHeight(parseInt(this.heightControl.element.value, 10));
			this.changeEmitter.trigger();
		});

		this.forceCircleControl = makeInputControl('Shape', 'Force Circle', "checkbox", "1", () => {
			// this.heightControl.element.value = this.widthControl.element.value;
			this.setForce(this.forceCircleControl.element.checked);

			// There's gotta be a cleaner way to do this, but this works for now avoiding recursive event calls
			this.setHeight(this.width);
			this.heightControl.element.value = this.widthControl.element.value;

			this.changeEmitter.trigger();
		});

		this.forceCircleControl.element.checked = this.force;
	}

	public getControls(): Control[] {
		return [
			this.forceCircleControl,
			this.widthControl,
			this.heightControl,
			{ element: this.circleModeControlElm, label: 'border', group: 'Shape' },
		];
	}

	private mode: CircleModes = CircleModes.thick;

	private setMode(mode: CircleModes): void {
		this.state.set('mode', mode);
		this.mode = mode;
	}

	private setWidth(width: number): void {
		this.state.set('width', width);
		this.width = width;
	}

	private setHeight(height: number): void {
		this.state.set('height', height);
		this.height = height;
	}

	private setForce(force: boolean): void {
		console.log(force);
		this.state.set('force', force);
		this.force = force;
	}

	public getBounds(): Bounds {
		return {
			minX: 0,
			maxX: this.width,

			minY: 0,
			maxY: this.height,
		};
	}

	public isFilled(x: number, y: number): boolean {
		const bounds = this.getBounds();

		x = -.5 * (bounds.maxX - 2 * (x + .5));
		y = -.5 * (bounds.maxY - 2 * (y + .5));

		switch (this.mode) {
			case CircleModes.thick: {
				return fatfilled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY);
			}
			case CircleModes.thin: {
				return thinfilled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY);
			}
			default: {
				return filled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY);
			}
		}
	}

}
