import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
export default defineConfig({root:resolve(root,'github-pages'),base:'./',publicDir:resolve(root,'public'),plugins:[react()],build:{outDir:resolve(root,'docs'),emptyOutDir:true,rollupOptions:{input:{index:resolve(root,'github-pages/index.html'),'quan-ly':resolve(root,'github-pages/quan-ly.html'),'tao-loi-moi':resolve(root,'github-pages/tao-loi-moi.html')}}}});
