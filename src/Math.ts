export function distance(x: number, y: number): number {
	return Math.sqrt((Math.pow(y, 2)) + Math.pow(x, 2));
}

export function xor(left: boolean, right: boolean): boolean {
	return left ? !right : right;
}
