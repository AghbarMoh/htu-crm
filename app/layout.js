import { Inter } from "next/font/google";
import "./globals.css";
 
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
 
export const metadata = {
  title: "HTU SRO CRM",
  description: "Students Recruitement & Outreach Office",
  manifest: "/manifest.json",
  themeColor: "#0a0a0f",
};
 
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
 