import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import LenisScroll from "@/components/lenis-scroll";
import Footer from "@/components/footer";

const poppins = Poppins({
    subsets: ["latin"],
    variable: "--font-poppins",
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

export const metadata = {
    title: "Seltech - Digital Marketplace for Tech Services",
    description: "Connect with top freelancers, developers, and businesses. Post projects, hire talent, and grow your business on Seltech's all-in-one tech marketplace.",
    keywords: ["freelance", "marketplace", "tech services", "hire developers", "digital services"],
    appleWebApp: {
        title: "Seltech",
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <LenisScroll />
                <Navbar />
                {children}
                <Footer />
            </body>
        </html>
    );
}