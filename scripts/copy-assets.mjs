import { cpSync, mkdirSync } from 'fs';

const targets = [
	{ src: 'nodes/Manatal/assets/manatal.svg', dest: 'dist/nodes/Manatal/assets/manatal.svg' },
	{
		src: 'nodes/Manatal/assets/manatal.dark.svg',
		dest: 'dist/nodes/Manatal/assets/manatal.dark.svg',
	},
	{ src: 'nodes/Manatal/Manatal.node.json', dest: 'dist/nodes/Manatal/Manatal.node.json' },
	{ src: 'nodes/Manatal/ManatalTrigger.node.json', dest: 'dist/nodes/Manatal/ManatalTrigger.node.json' },
];

for (const { src, dest } of targets) {
	mkdirSync(dest.split('/').slice(0, -1).join('/'), { recursive: true });
	cpSync(src, dest);
	console.log(`Copied ${src} → ${dest}`);
}
