import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Guild Rantau — Pulang ke Rumu',description:'Satu tenda. Satu monster baik hati. Rumah untuk kita semua. Jelajahi dunia Guild Rantau dan mulai kisahmu.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="id"><body>{children}</body></html>;}
