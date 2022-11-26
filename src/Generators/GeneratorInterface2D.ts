import { EventEmitter } from "../EventEmitter";

export class Bounds {
	minX: number
	maxX: number
	minY: number
	maxY: number

	constructor(minX: number, maxX: number, minY: number, maxY: number) {
		this.minX = minX;
		this.maxX = maxX;
		this.minY = minY;
		this.maxY = maxY;
	}

	public static encompass(lotsOfBounds: Bounds[]): Bounds{
		const encompassing = lotsOfBounds[0];
		lotsOfBounds.slice(1).forEach((bounds) => {
			if (bounds.minX < encompassing.minX) {encompassing.minX = bounds.minX}
			if (bounds.maxX > encompassing.maxX) {encompassing.maxX = bounds.maxX}
			if (bounds.minY < encompassing.minY) {encompassing.minY = bounds.minY}
			if (bounds.maxY > encompassing.maxY) {encompassing.maxY = bounds.maxY}
		})
		return encompassing
	}
}

export interface GeneratorInterface2D {

	readonly changeEmitter : EventEmitter<any|void>;

	isFilled(x: number, y: number, bounds: Bounds): boolean;
	getBounds(): Bounds;

}
