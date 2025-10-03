import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

const logoSrc = "/lovable-uploads/3b336ab1-e951-42a8-b0c4-758eed877e6a.png";

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const quickLinks = [
    { name: t("footer.aboutUs"), href: "/about" },
    { name: t("footer.contactUs"), href: "/contact" },
    { name: t("footer.privacyPolicy"), href: "#" },
    { name: t("footer.termsOfService"), href: "#" },
    { name: t("footer.advertise"), href: "#" },
    { name: t("footer.jobs"), href: "#" },
  ];

  const categories = [
    { name: t("footer.politics"), sectionId: "politics" },
    { name: t("footer.sports"), sectionId: "sports" },
    { name: t("footer.business"), sectionId: "business" },
    { name: t("footer.entertainment"), sectionId: "entertainment" },
    { name: t("footer.technology"), sectionId: "technology" },
  ];

  // Handle hash navigation when component mounts or location changes
  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      const sectionId = location.hash.substring(1); // Remove the # symbol
      console.log('Hash detected, scrolling to:', sectionId);
      
      // Use a longer timeout to ensure all components are loaded
      const timer = setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          console.log('Successfully scrolled to:', sectionId);
        } else {
          console.error('Element not found for hash:', sectionId);
          // List all available elements with IDs for debugging
          const allElements = document.querySelectorAll('[id]');
          console.log('Available elements with IDs:', Array.from(allElements).map(el => el.id));
        }
      }, 800); // Increased timeout to 800ms to ensure all components are loaded
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  const handleCategoryClick = (sectionId: string) => {
    console.log('Footer category clicked:', sectionId);
    
    // If we're already on the home page, just scroll to the section
    if (location.pathname === "/") {
      console.log('Already on home page, scrolling to:', sectionId);
      const element = document.getElementById(sectionId);
      if (element) {
        console.log('Found element, scrolling to:', sectionId);
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        console.error('Element not found:', sectionId);
        // List all available elements with IDs for debugging
        const allElements = document.querySelectorAll('[id]');
        console.log('Available elements with IDs:', Array.from(allElements).map(el => el.id));
      }
    } else {
      // If we're on a different page, navigate to home with hash
      console.log('Navigating to home page with hash:', sectionId);
      navigate(`/#${sectionId}`);
    }
  };

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/share/r/1HT547nmdJ/", color: "hover:text-primary" },
    { icon: Instagram, href: "https://www.instagram.com/reel/DHxp6IRt1-w/?igsh=MWdpYm5zbmVxeTYxeg==", color: "hover:text-primary" },
    { icon: Youtube, href: "https://www.youtube.com/@MaroKurukshetram", color: "hover:text-primary" },
  ];

  return (
    <footer className="font-mandali bg-gray-900 text-white text-base sm:text-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-4">
              <img src={logoSrc} alt={t("footer.logoAlt")} className="h-24 sm:h-32 lg:h-40 w-auto" loading="lazy" />
              <span className="sr-only">{t("footer.logoText")}</span>
            </div>
            <p className="text-gray-400 text-sm sm:text-base mb-4">
              {t("footer.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-1 sm:space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t("footer.categories")}</h4>
            <ul className="space-y-1 sm:space-y-2">
              {categories.map((category) => (
                <li key={category.name}>
                  <button
                    onClick={() => handleCategoryClick(category.sectionId)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-left text-sm sm:text-base"
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t("footer.newsletterTitle")}</h4>
            <p className="text-gray-400 mb-4 text-sm sm:text-base">
              {t("footer.newsletterDesc")}
            </p>
            <div className="space-y-2 sm:space-y-3">
              <input
                type="email"
                placeholder={t("footer.emailPlaceholder")}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-primary text-sm sm:text-base"
              />
              <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors duration-200 text-sm sm:text-base">
                {t("footer.subscribe")}
              </button>
            </div>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className={`text-gray-400 ${social.color} transition-colors duration-200`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              ))}
            </div>
            <div className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              © 2024 MaroKurukshetram News. {t("footer.allRightsReserved")}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;