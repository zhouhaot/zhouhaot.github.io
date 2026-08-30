import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";
// 个人资料（名字/简介/头像/GitHub/社交链接）抽到 profile.json，
// 可通过后台 /admin/ 的「站点设置 → 个人资料」直接修改，无需改代码
import profile from "./profile.json";

/** 由社交链接名称推导 iconify 图标（后台编辑时无需关心图标代码） */
function iconFor(name: string): string {
	const key = name.trim().toLowerCase();
	const map: Record<string, string> = {
		github: "fa6-brands:github",
		bilibili: "fa6-brands:bilibili",
		b站: "fa6-brands:bilibili",
		twitter: "fa6-brands:x-twitter",
		x: "fa6-brands:x-twitter",
		steam: "fa6-brands:steam",
		email: "fa6-regular:envelope",
		邮箱: "fa6-regular:envelope",
		邮件: "fa6-regular:envelope",
	};
	return map[key] ?? "fa6-solid:link";
}

export const siteConfig: SiteConfig = {
	title: "zevth",
	subtitle: "数字世界的造梦者",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 250, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: false,
		src: "assets/images/demo-banner.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		// {
		//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
		//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		{
			name: "作品",
			url: "/projects/",
		},
		LinkPreset.About,
		{
			name: "GitHub",
			url: profile.github, // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: profile.avatar, // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: profile.name,
	bio: profile.bio,
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github", // Visit https://icones.js.org/ for icon codes
			url: profile.github,
		},
		...profile.links.map((link) => ({
			name: link.name,
			icon: iconFor(link.name),
			url: link.url,
		})),
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
