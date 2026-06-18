import Papa from "papaparse";
import { NextResponse } from "next/server";

type RawProduct = {
	title?: string;
	category?: string;
	image?: string;
	price?: string | number;
	quantity?: string | number;
};

const DEFAULT_IMAGE = "/aliada.jpeg";

const normalizeImageUrl = (raw: string | undefined) => {
	const value = String(raw ?? "").trim();
	if (!value) return DEFAULT_IMAGE;

	const driveFileMatch = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
	if (value.includes("drive.google.com") && driveFileMatch?.[1]) {
		return `/api/products/image?id=${driveFileMatch[1]}`;
	}

	const driveOpenMatch = value.match(/[?&]id=([^&]+)/);
	if (value.includes("drive.google.com") && driveOpenMatch?.[1]) {
		return `/api/products/image?id=${driveOpenMatch[1]}`;
	}

	if (value.startsWith("http://") || value.startsWith("https://")) {
		return `/api/products/image?src=${encodeURIComponent(value)}`;
	}

	if (value.startsWith("www.")) {
		return `/api/products/image?src=${encodeURIComponent(`https://${value}`)}`;
	}

	if (value.startsWith("/")) {
		return value;
	}

	return value;
};

const toNumber = (value: string | number | undefined, fallback: number) => {
	const normalized = String(value ?? "").replace(",", ".").trim();
	const converted = Number(normalized);
	return Number.isFinite(converted) ? converted : fallback;
};

const SHEET_CSV_URL =
	"https://docs.google.com/spreadsheets/d/1Qxh_1sP-d_oX54ZX0APPNtLBYkUXYly7/export?format=csv&gid=88185419";

export async function GET() {
	try {
		const response = await fetch(SHEET_CSV_URL, {
			cache: "no-store",
			redirect: "follow",
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: "Unable to fetch products from Google Sheets" },
				{ status: 502 }
			);
		}

		const csvText = await response.text();
		const parsed = Papa.parse<RawProduct>(csvText, {
			header: true,
			skipEmptyLines: true,
		});

		if (parsed.errors.length > 0) {
			return NextResponse.json(
				{ error: "Unable to parse product data" },
				{ status: 500 }
			);
		}

		const products = parsed.data
			.filter((product) => product.title && product.price)
			.map((product) => ({
				title: String(product.title ?? ""),
				category: String(product.category ?? ""),
				image: normalizeImageUrl(product.image),
				price: toNumber(product.price, 0),
				quantity: toNumber(product.quantity, 1),
			}));

		return NextResponse.json(products);
	} catch {
		return NextResponse.json(
			{
				error:
					"Could not load products. Ensure the Google Sheet is shared publicly or published as CSV.",
			},
			{ status: 500 }
		);
	}
}
