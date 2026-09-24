const fs = require('fs');

function replaceUnsplash(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/photo-[a-zA-Z0-9-]+/g, (match) => {
    return 'asset-' + match.substring(6, 16);
  });
  content = content.replace(/https:\/\/images\.unsplash\.com\/[^\s\"\'\`]+/g, '');
  fs.writeFileSync(filePath, content);
}

replaceUnsplash('src/data/mock.ts');
replaceUnsplash('src/data/catalog.ts');
replaceUnsplash('src/pages/Dashboard.tsx');

let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');
home = home.replace(/photo-[a-zA-Z0-9-]+/g, (match) => 'asset-' + match.substring(6, 16));
home = home.replace(/<img[^>]*src=[\"']https:\/\/images\.unsplash\.com\/photo-1451187580459-43490279c0fa[^>]*>/, '<div className="w-full h-full bg-[#0A0B0D]" />');
home = home.replace(/<img[^>]*src=[\"']https:\/\/images\.unsplash\.com\/photo-1451187580459-43490279c0fa[^>]*>/, '<div className="absolute inset-0 w-full h-full bg-[#0d1020] opacity-45" />');
home = home.replace(/<img src=\{\`https:\/\/images\.unsplash\.com\/\$\{t\.avatar\}\?[^\`]+\`\} alt=\{t\.name\} className=\"w-12 h-12 rounded-full object-cover ring-2 ring-\\[#2F6BFF\\]\/40\" \/>/g, '<div className="w-12 h-12 rounded-full bg-[#2F6BFF]/20 ring-2 ring-[#2F6BFF]/40 flex items-center justify-center text-[#2F6BFF] font-medium">{t.name.charAt(0)}</div>');
fs.writeFileSync('src/pages/Home.tsx', home);

let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
settings = settings.replace(/<img src=\"https:\/\/images\.unsplash\.com\/photo-1507003211169-0a1dd7228f2d[^\"]+\" alt=\"Profile\" className=\"w-20 h-20 rounded-2xl object-cover\" \/>/, '<div className="w-20 h-20 rounded-2xl bg-[#2F6BFF]/20 flex items-center justify-center text-3xl font-medium text-[#2F6BFF]">M</div>');
fs.writeFileSync('src/pages/Settings.tsx', settings);

let nav = fs.readFileSync('src/components/Nav.tsx', 'utf8');
nav = nav.replace(/<img src=\"https:\/\/images\.unsplash\.com\/photo-1507003211169-0a1dd7228f2d[^\"]+\" alt=\"Profile\" className=\"w-7 h-7 rounded-lg object-cover\" \/>/, '<div className="w-7 h-7 rounded-lg bg-black/10 flex items-center justify-center text-xs font-medium text-black/60">M</div>');
fs.writeFileSync('src/components/Nav.tsx', nav);

let nfts = fs.readFileSync('src/pages/NFTs.tsx', 'utf8');
nfts = nfts.replace(/bg-gradient-to-t from-\\[#ffffff\\] to-transparent opacity-60/g, 'photo-tint-bottom');
fs.writeFileSync('src/pages/NFTs.tsx', nfts);

let about = fs.readFileSync('src/pages/About.tsx', 'utf8');
about = about.replace(/<img[^>]*src=\"https:\/\/images\.unsplash\.com\/photo-1600880292203-[^\"]+\"[^>]*>/, '<div className="w-full h-full bg-[#0A0B0D]/5 rounded-2xl" />');
about = about.replace(/<img[^>]*src=\{\`https:\/\/images\.unsplash\.com\/\$\{member\.img\}[^\`]+\`\}[^>]*>/g, '<div className="w-full h-full bg-[#0A0B0D]/5 flex items-center justify-center text-[#0A0B0D]/20 text-4xl font-display">{member.name.charAt(0)}</div>');
about = about.replace(/photo-[a-zA-Z0-9-]+/g, (match) => 'asset-' + match.substring(6, 16));
fs.writeFileSync('src/pages/About.tsx', about);

let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
login = login.replace(/<img[^>]*src=\"https:\/\/images\.unsplash\.com\/photo-1614854262318-[^\"]+\"[^>]*>/, '<div className="absolute inset-0 bg-[#0A0B0D]" />');
fs.writeFileSync('src/pages/Login.tsx', login);

let adminkyc = fs.readFileSync('src/pages/admin/AdminKYC.tsx', 'utf8');
adminkyc = adminkyc.replace(/<img src=\{\`https:\/\/images\.unsplash\.com\/\$\{doc\}[^\`]+\`\}[^>]*\/>/g, '<div className="w-full h-full bg-black/5 flex items-center justify-center text-xs text-black/30">Document Scan</div>');
fs.writeFileSync('src/pages/admin/AdminKYC.tsx', adminkyc);
