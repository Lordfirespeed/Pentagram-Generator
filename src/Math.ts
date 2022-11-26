export function distance(x: number, y: number): number {
	return Math.sqrt((Math.pow(y, 2)) + Math.pow(x, 2));
}

export function xor(left: boolean, right: boolean): boolean {
	return left ? !right : right;
}

export function distanceToLine(x: number, y: number, m: number, c: number): number {
	// Returns the perpendicular distance from the point (x, y) to the line y=mx+c
	const cPrime = y + x / m;
	const intersectX = (cPrime - c) / (m + (1/m));
	const intersectY = m * intersectX + c;
	const diffX = intersectX - x, diffY = intersectY - y;
	return distance(diffX, diffY);
}
