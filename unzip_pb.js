import AdmZip from 'adm-zip';
import path from 'path';

const zipPath = path.join(process.cwd(), 'pb.zip');
const targetDir = path.join(process.cwd(), 'pb_bin');

try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(targetDir, true);
    console.log('Unzipped pocketbase.zip successfully');
} catch (e) {
    console.error('Error unzipping pocketbase.zip:', e);
}
