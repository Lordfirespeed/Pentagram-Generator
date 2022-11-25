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

interface CircleState {
	mode: CircleModes;
	size: number;
}

export class Circle implements GeneratorInterface2D, ControlAwareInterface {

	private circleModeControlElm = document.createElement('select');

	public readonly changeEmitter = new EventEmitter<void>();

	private size: number;

	private sizeControl: Control<HTMLInputElement>;

	constructor(private state: StateItem<CircleState>) {
		this.mode = this.state.get('mode');
		this.size = Math.min(2000, this.state.get('size'));

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
	}

	public getBounds(): Bounds {
		return {
			minX: 0,
			maxX: this.size,

			minY: 0,
			maxY: this.size,
		};
	}

	private filled(x: number, y: number, radius: number, ratio: number): boolean {
		return distance(x, y, ratio) <= radius;
	}

	private fatFilled(x: number, y: number, radius: number, ratio: number): boolean {
		return this.filled(x, y, radius, ratio) && !(
			this.filled(x + 1, y, radius, ratio) &&
			this.filled(x - 1, y, radius, ratio) &&
			this.filled(x, y + 1, radius, ratio) &&
			this.filled(x, y - 1, radius, ratio) &&
			this.filled(x + 1, y + 1, radius, ratio) &&
			this.filled(x + 1, y - 1, radius, ratio) &&
			this.filled(x - 1, y - 1, radius, ratio) &&
			this.filled(x - 1, y + 1, radius, ratio)
		);
	}

	private thinFilled(x: number, y: number, radius: number, ratio: number): boolean {
		return this.filled(x, y, radius, ratio) && !(
			this.filled(x + 1, y, radius, ratio) &&
			this.filled(x - 1, y, radius, ratio) &&
			this.filled(x, y + 1, radius, ratio) &&
			this.filled(x, y - 1, radius, ratio)
		);
	}

	private thicknessFilled(): void {
		console.log("ee")
	}

	public isFilled(x: number, y: number): boolean {
		const bounds = this.getBounds();

		x = -.5 * (bounds.maxX - 2 * (x + .5));
		y = -.5 * (bounds.maxY - 2 * (y + .5));

		switch (this.mode) {
			case CircleModes.thick: {
				return this.fatFilled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY);
			}
			case CircleModes.thin: {
				return this.thinFilled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY);
			}
			default: {
				return this.filled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY);
			}
		}
	}

}
