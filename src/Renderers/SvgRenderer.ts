import {GeneratorInterface2D, Bounds} from "../Generators/GeneratorInterface2D";
import {RendererInterface} from "./RendererInterface";
import {Control, ControlAwareInterface, InfoControl, makeButtonControl, makeInputControl} from "../Controller";
import {EventEmitter} from "../EventEmitter";
import {xor} from "../Math";
import {StateItem} from "../State";

function isSvgElement(el: Node): el is SVGElement {
	return (el as SVGElement).namespaceURI === "http://www.w3.org/2000/svg";
}

function svgToCanvas(svgData: string): Promise<HTMLCanvasElement> {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (ctx === null) {
		throw new Error("Could not create canvas context");
	}

	const p = new Promise<HTMLCanvasElement>((resolve) => {
		const img = document.createElement("img");
		img.src = "data:image/svg+xml;base64," + btoa(svgData);

		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;

			ctx.drawImage(img, 0, 0);

			resolve(canvas);
		};
	});

	return p;
}

interface SvgRendererState {
	scale: number;
}

export class SvgRenderer implements RendererInterface, ControlAwareInterface {

	private dWidth = 5;
	private dBorder = 1;
	private dFull = this.dWidth + this.dBorder;

	private blocks = new InfoControl("Details", "blocks");

	private stacksOf64 = new InfoControl("Details", "stacks of 64");
	private stacksOf16 = new InfoControl("Details", "stacks of 16");

	public readonly changeEmitter = new EventEmitter<void>();

	public scaleSize = 544;

	constructor(private state: StateItem<SvgRendererState>) {
		this.scaleSize = state.get('scale');
	}


	public getControls(): Control[] {

		const scale = makeInputControl('Render', 'scale', 'range', this.scaleSize, (val) => {
			this.scaleSize = parseInt(val, 10);
			this.state.set('scale', this.scaleSize);
			this.scale();
		}, { min: "50", max: "3000" });

		return [
			scale,

			makeButtonControl('Download', null, 'PNG', async () => {
				if (!this.lastSvg) {
					throw new Error('No SVG to download');
				}

				const canvas = await svgToCanvas(this.lastSvg.outerHTML);
				const dataUrl = canvas.toDataURL();

				const a = document.createElement('a');
				a.href = dataUrl;
				a.download = "soup.png";
				document.body.appendChild(a);
				a.click();
			}),

			makeButtonControl('Download', null, 'SVG', async () => {
				if (!this.lastSvg) {
					throw new Error('No SVG to download');
				}

				const a = document.createElement('a');
				a.href = "data:image/svg+xml;base64," + btoa(this.lastSvg.outerHTML);
				a.download = "soup.svg";
				document.body.appendChild(a);
				a.click();
			}),

			this.blocks,
			this.stacksOf64,
			this.stacksOf16,
		];
	}

	private hasInlineSvg(): boolean {
		const div = document.createElement('div');
		div.innerHTML = '<svg/>';
		return Boolean(div.firstChild && isSvgElement(div.firstChild));
	}

	private add(x: number, y: number, width: number, height: number, filled: boolean): string {
		const xp = (((x + 1) * this.dFull) /*+ (this._svg_width / 2)*/ - (this.dFull / 2)) + .5;
		const yp = (((y + 1) * this.dFull) /*+ (this._svg_height / 2)*/ - (this.dFull / 2)) + .5;

		let color: string | null = null;

		const midx = (width / 2) - .5;
		const midy = (height / 2) - .5;

		let extra = "";
		if (filled) {
			if (x == midx || y == midy) {
				color = '#808080';
			} else {
				color = '#FF0000';
			}

			extra = 'onclick="this.style.fill=\'#7711AA\'"';
		} else if (x == midx || y == midy) {
			if (xor(!!(x & 1), !!(y & 1))) {
				color = '#EEEEEE';
			} else {
				color = '#F8F8F8';
			}
		}

		if (color) {
			const fillstr = (filled ? 'filled' : '');
			return `<rect x="${xp}" y="${yp}" fill="${color}" width="${this.dWidth}" height="${this.dWidth}" class="${fillstr}" data-x="${x}" data-y="${y}" ${extra}/>`;
		}

		return '';
	}

	private lastSvg: SVGElement | null = null;

	public render(target: HTMLElement, generators: GeneratorInterface2D[]): void {
		if (!this.hasInlineSvg()) {
			throw new Error(`SVG Renderer: No support for inline SVG. Please use a browser that supports SVG.`);
		}

		target.innerHTML = this.generateSVG(generators);
		// const svgElm = target.firstChild as SVGElement;

		this.lastSvg = target.querySelector('svg');

		this.scale();
	}

	private generateSVG(generators: GeneratorInterface2D[]): string {
		const bounds = Bounds.encompass(generators.map(generator => generator.getBounds()))

		const width = bounds.maxX - bounds.minX;
		const height = bounds.maxY - bounds.minY;

		const svgWidth = this.dFull * (width + 1);
		const svgHeight = this.dFull * (height + 1);

		let text = `<svg id="svg_circle" xmlns="http://www.w3.org/2000/svg" data-w="${svgWidth}" data-h="${svgHeight}"
			width="${svgWidth}px" height="${svgHeight}px" viewBox="0 0 ${svgWidth} ${svgHeight}">`;

		let fillCount = 0;
		for (let y = bounds.minY; y < bounds.maxY; y++) {
			for (let x = bounds.minX; x < bounds.maxX; x++) {
				const filled = generators.some(generator => generator.isFilled(x, y, bounds));
				text += this.add(x, y, width, height, filled);

				if (filled) {
					fillCount++;
				}
			}
		}

		this.blocks.setValue(`${fillCount}`);
		this.stacksOf64.setValue(`${(fillCount / 64).toFixed(1)}`);
		this.stacksOf16.setValue(`${(fillCount / 16).toFixed(1)}`);

		for (let ix = 0; ix < svgWidth; ix += this.dFull) {
			let fill = "#bbbbbb";
			if (ix % 32 == 0) {
				fill = "#252525";
			}
			text += `<rect x="${(ix + (this.dWidth / 2))}" y="0" fill="${fill}" width="${this.dBorder}" height="${svgHeight}" opacity=".6" />`;
		}

		for (let iy = 0; iy < svgHeight; iy += this.dFull) {
			let fill = "#bbbbbb";
			if (iy % 32 == 0) {
				fill = "#252525";
			}
			text += `<rect x="0" y="${(iy + (this.dWidth / 2))}" fill="${fill}" width="${svgWidth}" opacity=".6" height="${this.dBorder}"/>`;
		}

		// text += '<line id="selection_line" x1="0" y1="0" x2="0" y2="0" style="stroke:rgb(0,255,0);" stroke-width="3" stroke-linecap="round" opacity="0" />';
		text += '</svg>';

		return text;
	}

	private scale() {
		if (!this.lastSvg) {
			throw new Error("Error finding svg_circle");
		}
		const h = this.lastSvg.getAttribute('data-h');
		const w = this.lastSvg.getAttribute('data-w');
		if (!h || !w) {
			throw new Error("error getting requisite data attributes");
		}

		const aspect = parseInt(h, 10) / parseInt(w, 10);

		const scaleX = this.scaleSize;
		const scaleY = this.scaleSize * aspect;

		this.lastSvg.setAttribute('width', scaleX + 'px');
		this.lastSvg.setAttribute('height', scaleY + 'px');
		this.lastSvg.style.width = scaleX + 'px';
		this.lastSvg.style.height = scaleY + 'px';
	}
}
